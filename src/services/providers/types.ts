// Common types for AI provider services

export type MessageRole = "system" | "user" | "assistant";

export type MessageContent = string | {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail: "high" | "low" | "auto";
  };
}[];

export interface Message {
  role: MessageRole;
  content: MessageContent;
}

export interface APIOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionStreamResponse {
  id: string;
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface AIServiceProvider {
  sendMessage: (messages: Message[], apiKey: string, options?: APIOptions) => Promise<string>;
  streamResponse: (
    messages: Message[],
    apiKey: string,
    callbacks: StreamCallbacks,
    options?: APIOptions
  ) => Promise<void>;
  callAI: (options: {
    messages: { role: string; content: string }[];
    max_tokens?: number;
    temperature?: number;
    projectInstructions?: string;
    model?: string;
  }) => Promise<{
    choices: [{ message: { content: string } }];
    quick_replies?: string[];
  }>;
}


