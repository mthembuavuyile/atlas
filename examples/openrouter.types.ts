/**
 * Atlas — TypeScript Type Definitions & Client Example
 * By Vylex Technologies — https://vylex.co.za
 */
import * as dotenv from 'dotenv';
dotenv.config();

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_KEY: string = process.env.OPENROUTER_API_KEY || '';

export async function askAtlas(prompt: string): Promise<string> {
  const payload: ChatCompletionRequest = {
    model: process.env.OPENROUTER_MODEL || 'stealth/ox-alpha',
    messages: [
      {
        role: 'system',
        content: 'You are Atlas, a powerful AI assistant by Vylex Technologies. You are an advanced engineer specialized in TypeScript, Node.js, and agent systems.'
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://vylex.co.za',
      'X-Title': 'Atlas by Vylex Technologies',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Atlas API Error (${response.status}): ${errorText}`);
  }

  const result = (await response.json()) as ChatCompletionResponse;
  return result.choices[0]?.message?.content ?? 'No content returned';
}
