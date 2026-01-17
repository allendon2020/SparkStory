
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, ImageSize } from "../types";

// Helper for decoding base64 to Uint8Array (required for Audio)
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper for retrying failed requests
const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
};

export class GeminiService {
  private static getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async generateStorySkeleton(topic: string): Promise<Story> {
    return withRetry(async () => {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short, 4-page story for kids about: "${topic}". 
        Each page should be about 2-3 sentences long. 
        Also provide a descriptive illustration prompt for each page.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              pages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    illustrationPrompt: { type: Type.STRING }
                  },
                  required: ["text", "illustrationPrompt"]
                }
              }
            },
            required: ["title", "pages"]
          }
        }
      });

      try {
        return JSON.parse(response.text || '{}') as Story;
      } catch (e) {
        throw new Error("Failed to parse story data: " + e);
      }
    });
  }

  static async generateIllustration(prompt: string, size: ImageSize): Promise<string> {
    return withRetry(async () => {
      const ai = this.getClient();
      
      const usePro = size === ImageSize.K2 || size === ImageSize.K4;
      const model = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
      
      const config: any = {
        imageConfig: {
          aspectRatio: "1:1"
        }
      };
      
      if (usePro) {
        config.imageConfig.imageSize = size;
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            { text: `Magical, vibrant, kid-friendly storybook illustration of: ${prompt}. High quality, digital art style.` }
          ]
        },
        config: config
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned from model");
    });
  }

  static async generateSpeech(text: string): Promise<string> {
    // 500 errors are common in preview TTS models, so we wrap in retry
    return withRetry(async () => {
      const ai = this.getClient();
      
      // Simplify the prompt to the format recommended in documentation
      // Remove complex punctuation that might confuse the TTS model
      const cleanedText = text.replace(/[""''«»]/g, '').trim();
      const ttsPrompt = `Say warmly: ${cleanedText}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data returned");
      return base64Audio;
    });
  }

  static async sendMessageToBuddy(message: string, history: { role: 'user' | 'model', text: string }[]) {
    const ai = this.getClient();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are Sparky, a magical and helpful storybook buddy for kids. You love stories, imagination, and answering kids' questions in a fun, safe, and encouraging way. Keep responses short, simple, and exciting!",
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  }
}

export const playAudio = async (base64Data: string) => {
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtxClass({ sampleRate: 24000 });
  const rawBytes = decodeBase64(base64Data);
  
  const dataInt16 = new Int16Array(rawBytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  return source;
};
