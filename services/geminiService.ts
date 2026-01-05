import { GoogleGenAI, Type } from "@google/genai";
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
        // It does not support responseMimeType for images in the config directly like Imagen.
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

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Puck" }, // Puck is usually energetic/fun
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data returned");
  }

  // Decode base64 to ArrayBuffer
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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