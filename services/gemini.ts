
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, CHATBOT_FLOW_INSTRUCTION } from "../constants";
import { ChatStage, ChatSessionData, GeminiResponse } from "../types";

export class GeminiService {
  private getApiKey(): string {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string);
    if (key) {
      console.log("API Key found (masked):", key.substring(0, 4) + "..." + key.substring(key.length - 4));
    } else {
      console.warn("No API Key found in any source.");
    }
    return key || '';
  }

  async processMessage(
    message: string, 
    currentStage: ChatStage, 
    sessionData: ChatSessionData,
    history: { role: 'user' | 'model', text: string }[] = []
  ): Promise<GeminiResponse> {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.error("Gemini API Key is missing in processMessage");
        throw new Error("API_KEY_MISSING");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
          { role: 'user', parts: [{ text: `Current Stage: ${currentStage}\nCurrent Session Data: ${JSON.stringify(sessionData)}\nUser Message: ${message}` }] }
        ],
        config: {
          systemInstruction: CHATBOT_FLOW_INSTRUCTION + "\n\nIMPORTANT: You must return a valid JSON object. Do not include any markdown formatting in your response.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING, description: "The response message to the user." },
              extractedData: {
                type: Type.OBJECT,
                properties: {
                  intent: { type: Type.STRING },
                  location: { type: Type.STRING },
                  budget: { type: Type.STRING },
                  timeline: { type: Type.STRING },
                  bedrooms: { type: Type.STRING },
                  financingStatus: { type: Type.STRING },
                  zipCode: { type: Type.STRING },
                  listingPreference: { type: Type.STRING },
                  name: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  email: { type: Type.STRING },
                  contactPreference: { type: Type.STRING },
                  bestTime: { type: Type.STRING },
                }
              },
              nextStage: { 
                type: Type.STRING
              },
              fallback: { type: Type.BOOLEAN }
            },
            required: ["message", "nextStage"]
          }
        },
      });

      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error("EMPTY_RESPONSE");
      }

      let text = response.text;
      if (!text) {
        console.warn("Response text is empty, checking parts...");
        const part = response.candidates[0].content.parts.find(p => p.text);
        text = part?.text || "{}";
      }
      // Clean up markdown if present
      if (text.startsWith("```json")) {
        text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      } else if (text.startsWith("```")) {
        text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");
      }
      
      const result = JSON.parse(text.trim());
      return {
        message: result.message || "I'm sorry, I'm having trouble processing that.",
        extractedData: result.extractedData,
        nextStage: result.nextStage as ChatStage,
        fallback: result.fallback
      };
    } catch (error: any) {
      console.error("Gemini Process Error Details:", error);
      let errorMessage = "I apologize, but I encountered an error. Please try again or contact us directly.";
      
      if (error?.message === "API_KEY_MISSING") {
        errorMessage = "I apologize, but the AI service is not configured correctly. Please check the API key.";
      } else if (error?.message === "EMPTY_RESPONSE") {
        errorMessage = "I apologize, but I received an empty response from the AI. Please try again.";
      } else if (error?.status === 429) {
        errorMessage = "I apologize, but we are experiencing high traffic. Please wait a moment and try again.";
      } else if (error?.status === 403) {
        errorMessage = "I apologize, but there is a permission issue with the AI service. Please check the API key and project settings.";
      }
      
      console.error("Final Error Message for UI:", errorMessage);
      
      return {
        message: errorMessage,
        nextStage: currentStage
      };
    }
  }

  async sendMessage(message: string, history: any[] = []) {
    // Keeping this for backward compatibility or simple messages
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.error("Gemini API Key is missing in sendMessage");
        return "API configuration error.";
      }

      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const response = await chat.sendMessage({ message });
      return response.text || "No response generated.";
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "I apologize, but I encountered an error connecting to our systems. Please try again or contact us directly.";
    }
  }

  // Helper for voice decoding as per guidelines
  static decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  static encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const gemini = new GeminiService();
