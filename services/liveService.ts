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
  
  // Transcription State
  private currentInputTranscription = '';
  private currentOutputTranscription = '';
  private onTranscription: ((user: string, ai: string) => void) | null = null;
  private onTurnComplete: ((user: string, ai: string) => void) | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect(
    nativeLang: string, 
    targetLang: string, 
    activeGoal: string | null,
    onTranscription: (user: string, ai: string) => void,
    onError: (err: any) => void,
    onClose: () => void,
    onTurnComplete?: (user: string, ai: string) => void
  ) {
    if (this.isConnected) return;

    this.isConnected = true;
    this.nextStartTime = 0;
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';
    this.onTranscription = onTranscription;
    this.onTurnComplete = onTurnComplete || null;

    try {
      // 1. Audio Setup
      // Initialize Output Context (Speaker)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioContext = new AudioContextClass();
      
      // Initialize Input Context (Microphone)
      // Try to get 16000Hz as preferred by Gemini Live
      try {
        this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      } catch (e) {
        console.warn("Could not create 16kHz context, falling back to default.", e);
        this.inputAudioContext = new AudioContextClass();
      }
      
      // CRITICAL: Resume output context immediately. 
      if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
      }

      // Get Mic Stream
      this.inputStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Connect to Gemini Live
      const systemInstruction = `You are a friendly language tutor. The user speaks ${nativeLang} and is learning ${targetLang}. 
      ${activeGoal ? `The user has a specific learning goal: "${activeGoal}". Focus the roleplay, vocabulary, and conversation strictly around this topic.` : 'Help them name objects, practice pronunciation, or have a casual conversation.'}
      Keep responses concise, encouraging, and suitable for a learner. 
      If the user makes a mistake, gently correct them.
      IMPORTANT: The conversation will ONLY be in ${nativeLang} or ${targetLang}. Do not switch to other languages or hallucinate words from other languages.`;

      const config = {
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: systemInstruction,
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
            this.disconnect();
            onClose();
          },
        },
      });
    } catch (err) {
      onError(err);
      this.disconnect();
    }
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.inputStream || !this.sessionPromise) return;

    if (this.inputAudioContext.state === 'suspended') {
      this.inputAudioContext.resume();
    }

    const source = this.inputAudioContext.createMediaStreamSource(this.inputStream);
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
    const serverContent = message.serverContent;

    if (serverContent?.outputTranscription) {
      this.currentOutputTranscription += serverContent.outputTranscription.text;
      this.onTranscription?.(this.currentInputTranscription, this.currentOutputTranscription);
    } else if (serverContent?.inputTranscription) {
      this.currentInputTranscription += serverContent.inputTranscription.text;
      this.onTranscription?.(this.currentInputTranscription, this.currentOutputTranscription);
    }

    if (serverContent?.turnComplete) {
      if (this.onTurnComplete && (this.currentInputTranscription || this.currentOutputTranscription)) {
          this.onTurnComplete(this.currentInputTranscription, this.currentOutputTranscription);
      }
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
    }

    if (!this.outputAudioContext) return;

    if (serverContent?.interrupted) {
      this.sources.forEach(source => source.stop());
      this.sources.clear();
      this.nextStartTime = 0;
      this.currentOutputTranscription = '';
      return;
    }

    const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Robust decoding using the helper
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
    this.onTranscription = null;
    this.onTurnComplete = null;
    
    this.sessionPromise?.then(session => session.close());
    this.sessionPromise = null;

    this.inputStream?.getTracks().forEach(track => track.stop());
    this.inputStream = null;

    this.processor?.disconnect();
    this.processor = null;

    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    
    this.sources.clear();
  }
}