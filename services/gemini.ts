import { GoogleGenAI, Type } from "@google/genai";
import { CHATBOT_FLOW_INSTRUCTION, SYSTEM_INSTRUCTION } from "../constants";
import { ChatStage, ChatSessionData, GeminiResponse } from "../types";

function getApiKey(): string {
  return (
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    ""
  );
}

export class GeminiService {
  async processMessage(
    message: string,
    currentStage: ChatStage,
    sessionData: ChatSessionData,
    history: { role: "user" | "model"; text: string }[] = []
  ): Promise<GeminiResponse> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        ...history.map((h) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        })),
        {
          role: "user",
          parts: [
            {
              text: `Current Stage: ${currentStage}\nCurrent Session Data: ${JSON.stringify(sessionData)}\nUser Message: ${message}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction:
          CHATBOT_FLOW_INSTRUCTION +
          "\n\nIMPORTANT: Return only a valid JSON object with no markdown.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
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
              },
            },
            nextStage: { type: Type.STRING },
            fallback: { type: Type.BOOLEAN },
          },
          required: ["message", "nextStage"],
        },
      },
    });

    if (!response.candidates?.length) throw new Error("EMPTY_RESPONSE");

    const text = response.candidates[0].content.parts[0].text ?? "{}";
    const result = JSON.parse(text.trim());

    // Gemini occasionally doubles the message string inside the JSON value.
    // Detect and strip exact repetitions of any length.
    let msg: string = result.message || "I'm sorry, I'm having trouble processing that.";
    const half = msg.length / 2;
    if (Number.isInteger(half) && half > 0 && msg.slice(0, half) === msg.slice(half)) {
      msg = msg.slice(0, half);
    }

    return {
      message: msg,
      extractedData: result.extractedData,
      nextStage: result.nextStage as ChatStage,
      fallback: result.fallback,
    };
  }

  async sendMessage(message: string) {
    const apiKey = getApiKey();
    if (!apiKey) return "API configuration error.";

    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: { systemInstruction: SYSTEM_INSTRUCTION },
    });

    const response = await chat.sendMessage({ message });
    return response.text || "No response generated.";
  }

  static decodeBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  static encodeBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  static async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> {
    const samples = new Int16Array(data.buffer);
    const frameCount = samples.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      const channel = buffer.getChannelData(ch);
      for (let i = 0; i < frameCount; i++)
        channel[i] = samples[i * numChannels + ch] / 32768;
    }
    return buffer;
  }
}

export const gemini = new GeminiService();
