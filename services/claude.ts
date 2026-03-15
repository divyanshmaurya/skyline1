
import Anthropic from '@anthropic-ai/sdk';
import { CHATBOT_FLOW_INSTRUCTION } from '../constants';
import { ChatStage, ChatSessionData, ChatResponse } from '../types';

class ClaudeService {
  private getApiKey(): string {
    const key = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY as string;
    if (!key) console.warn("No Anthropic API Key found. Set VITE_ANTHROPIC_API_KEY.");
    return key || '';
  }

  async processMessage(
    message: string,
    currentStage: ChatStage,
    sessionData: ChatSessionData,
    history: { role: 'user' | 'model', text: string }[] = []
  ): Promise<ChatResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    const messages: Anthropic.MessageParam[] = [
      ...history.map(h => ({
        role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: h.text,
      })),
      {
        role: 'user' as const,
        content: `Current Stage: ${currentStage}\nCurrent Session Data: ${JSON.stringify(sessionData)}\nUser Message: ${message}`,
      },
    ];

    const tools: Anthropic.Tool[] = [{
      name: 'chat_response',
      description: 'Respond to the user and extract any lead information from their message.',
      input_schema: {
        type: 'object' as const,
        properties: {
          message: { type: 'string', description: 'Your response to the user' },
          extractedData: {
            type: 'object',
            description: 'Data extracted from the user message',
            properties: {
              intent: { type: 'string' },
              location: { type: 'string' },
              budget: { type: 'string' },
              timeline: { type: 'string' },
              bedrooms: { type: 'string' },
              financingStatus: { type: 'string' },
              zipCode: { type: 'string' },
              listingPreference: { type: 'string' },
              name: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' },
              contactPreference: { type: 'string' },
              bestTime: { type: 'string' },
            },
          },
          nextStage: { type: 'string', description: 'Next conversation stage (e.g. CORE_NEEDS, INTENT_SPECIFIC, VALUE_EXCHANGE, LEAD_CAPTURE_NAME, LEAD_CAPTURE_CONTACT, HANDOFF, COMPLETE)' },
          fallback: { type: 'boolean', description: 'True if user intent was unclear' },
        },
        required: ['message', 'nextStage'],
      },
    }];

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: CHATBOT_FLOW_INSTRUCTION,
        messages,
        tools,
        tool_choice: { type: 'tool', name: 'chat_response' },
      });

      const toolUse = response.content.find(b => b.type === 'tool_use');
      if (!toolUse || toolUse.type !== 'tool_use') throw new Error("EMPTY_RESPONSE");

      const result = toolUse.input as any;
      return {
        message: result.message || "I'm sorry, I'm having trouble processing that.",
        extractedData: result.extractedData,
        nextStage: result.nextStage as ChatStage,
        fallback: result.fallback,
      };
    } catch (error: any) {
      console.error("Claude Process Error:", error);
      let errorMessage = "I apologize, but I encountered an error. Please try again or contact us directly.";
      if (error?.message === "API_KEY_MISSING") {
        errorMessage = "The AI service is not configured. Please check the API key.";
      } else if (error?.status === 429) {
        errorMessage = "We're experiencing high traffic. Please wait a moment and try again.";
      }
      return { message: errorMessage, nextStage: currentStage };
    }
  }
}

export const claude = new ClaudeService();
