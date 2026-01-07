import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { DictionaryEntry, ExampleSentence } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper Types for JSON Schema ---

interface DictionaryResponse {
  targetTerm: string;
  definition: string;
  examples: Array<{ target: string; native: string }>;
  usageNote: string;
}

// --- Text Generation (Dictionary Lookup) ---

export const lookupTerm = async (
  term: string,
  nativeLang: string,
  targetLang: string
): Promise<Omit<DictionaryEntry, 'imageUrl' | 'id'>> => {
  
  const prompt = `
    I need a dictionary entry for the text "${term}".
    Native Language: ${nativeLang}
    Target Language: ${targetLang}

    Please provide:
    1. The "${targetLang}" version of the word/phrase. If the input is already in ${targetLang}, use it. If it is in ${nativeLang}, translate it. Let's call this 'targetTerm'.
    2. A natural language definition in ${nativeLang}.
    3. Two example sentences in ${targetLang} with ${nativeLang} translations.
    4. A usage note that explains cultural nuance, tone, or related words. 
       - Style: Fun, lively, casual (like talking to a friend). 
       - No greetings or fillers. Be concise.

    Return the response in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          targetTerm: { type: Type.STRING },
          definition: { type: Type.STRING },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                target: { type: Type.STRING },
                native: { type: Type.STRING },
              },
              required: ['target', 'native']
            }
          },
          usageNote: { type: Type.STRING }
        },
        required: ['targetTerm', 'definition', 'examples', 'usageNote']
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from AI");
  }

  const data = JSON.parse(response.text) as DictionaryResponse;

  return {
    term,
    targetTerm: data.targetTerm,
    targetLang,
    nativeLang,
    definition: data.definition,
    examples: data.examples,
    usageNote: data.usageNote,
  };
};

// --- Image Generation ---

export const generateImage = async (term: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A bright, colorful, minimalist vector art illustration representing the concept of: "${term}". White background. High contrast. Fun vibe.` }
        ]
      },
      config: {
        // Note: For nano banana series (gemini-2.5-flash-image), we must parse parts manually.
      }
    });

    // Extract image from parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined;
  }
};

// --- Audio Generation (TTS) ---

export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }, 
          },
        },
        safetySettings: [
           { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
           { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
           { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
           { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textPart) {
        console.warn("TTS returned text instead of audio:", textPart);
      }
      throw new Error("No audio data returned from Gemini TTS");
    }

    // Decode base64 to Uint8Array
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.error("Gemini TTS Error:", err);
    throw err;
  }
};

// --- Helper: Convert PCM to WAV for reliable browser playback ---
export const pcmToWav = (pcmData: Uint8Array, sampleRate: number): Blob => {
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length, true);
  
  return new Blob([wavHeader, pcmData], { type: 'audio/wav' });
};

// Helper to decode raw PCM data from Gemini to an AudioBuffer
export const decodePcmAudio = (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer => {
  const numChannels = 1;
  
  // Robustness: Ensure data length is even for Int16Array
  let safeData = data;
  if (data.byteLength % 2 !== 0) {
    safeData = data.slice(0, data.byteLength - 1);
  }

  const dataInt16 = new Int16Array(safeData.buffer, safeData.byteOffset, safeData.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// --- Story Generation ---

export const generateStory = async (
  words: string[],
  nativeLang: string,
  targetLang: string
): Promise<string> => {
  const prompt = `
    Write a short, funny, and coherent story using the following words/phrases: ${words.join(', ')}.
    
    The story should be written primarily in ${targetLang}.
    The level should be suitable for a language learner.
    Highlight the used words by wrapping them in **asterisks**.
    After the story, provide a brief summary in ${nativeLang}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Could not generate story.";
};

// --- Audio Transcription (Voice Search) ---

export const transcribeAudio = async (base64Audio: string, mimeType: string, languages: string[] = []): Promise<string> => {
  try {
    const langContext = languages.length > 0 
      ? `The audio is likely spoken in one of the following languages: ${languages.join(' or ')}.` 
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          { text: `Transcribe the spoken audio into text. ${langContext} Return ONLY the text of what was said.` }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription failed", error);
    throw error;
  }
};