import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { decodePcmAudio } from "./geminiService";

export class LiveSession {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private inputStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isConnected = false;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(
    nativeLang: string, 
    targetLang: string, 
    onError: (err: any) => void,
    onClose: () => void
  ) {
    if (this.isConnected) return;

    this.isConnected = true;
    this.nextStartTime = 0;

    // 1. Audio Setup
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Get Mic Stream
    this.inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 2. Connect to Gemini Live
    const config = {
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `You are a friendly language tutor. The user speaks ${nativeLang} and is learning ${targetLang}. 
        You can see what the user is showing you via their camera. 
        Help them name objects, practice pronunciation, or have a casual conversation in ${targetLang}.
        Keep responses concise and encouraging.`,
      },
    };

    this.sessionPromise = this.ai.live.connect({
      model: config.model,
      config: config.config,
      callbacks: {
        onopen: () => {
          console.log("Live session opened");
          this.startAudioInput();
        },
        onmessage: async (message: LiveServerMessage) => {
          this.handleServerMessage(message);
        },
        onerror: (e: any) => {
          console.error("Live session error:", e);
          onError(e);
        },
        onclose: () => {
          console.log("Live session closed");
          this.disconnect(); // Ensure cleanup
          onClose();
        },
      },
    });
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.inputStream || !this.sessionPromise) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.inputStream);
    // Use ScriptProcessor for raw PCM access (standard for this API usage)
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createPcmBlob(inputData);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private createPcmBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Manually encode to base64 string
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
      mimeType: 'audio/pcm;rate=16000',
      data: base64,
    };
  }

  private async handleServerMessage(message: LiveServerMessage) {
    if (!this.outputAudioContext) return;

    const serverContent = message.serverContent;

    // Handle Interruption
    if (serverContent?.interrupted) {
      this.sources.forEach(source => source.stop());
      this.sources.clear();
      this.nextStartTime = 0;
      return;
    }

    // Handle Audio Output
    const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
       // Decode base64 manually to Uint8Array first
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Use the helper from geminiService to get AudioBuffer
      const audioBuffer = decodePcmAudio(bytes, this.outputAudioContext, 24000);
      
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      
      source.addEventListener('ended', () => {
        this.sources.delete(source);
      });

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }
  }

  sendVideoFrame(base64Data: string) {
    if (!this.sessionPromise || !this.isConnected) return;
    
    // Strip header if present (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = base64Data.split(',')[1] || base64Data;

    this.sessionPromise.then(session => {
      session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    });
  }

  disconnect() {
    this.isConnected = false;
    
    // Close session
    this.sessionPromise?.then(session => session.close());
    this.sessionPromise = null;

    // Stop tracks
    this.inputStream?.getTracks().forEach(track => track.stop());
    this.inputStream = null;

    // Disconnect audio nodes
    this.processor?.disconnect();
    this.processor = null;

    // Close contexts
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    
    this.sources.clear();
  }
}
