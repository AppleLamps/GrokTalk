// Define custom types for chat functionality

// Message role types
export type MessageRole = "system" | "user" | "assistant";

// Content types for messages
export type MessageContentItem = {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
    detail: "high" | "low" | "auto";
  };
};

export type MessageContent = string | MessageContentItem[];

// Interface for messages
export interface MessageInterface {
  role: MessageRole;
  content: MessageContent;
}

// Interface for message requests
export interface MessageRequestInterface {
  model: string;
  messages: MessageInterface[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Types for model selection
// OpenRouter model slugs
export type ModelType =
  | "x-ai/grok-3"
  | "x-ai/grok-4"
  | "x-ai/grok-vision-beta"
  | "google/gemini-2.5-flash-lite"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-pro"
  | "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
  | "openai/gpt-5"
  | "openai/gpt-5-chat"
  | "openai/gpt-5-mini"
  | "anthropic/claude-opus-4.1"
  | "anthropic/claude-sonnet-4";

// Payload type for vision requests
export interface GPT4VisionPayload {
  model: string;
  messages: MessageInterface[];
  max_tokens: number;
  temperature: number;
  stream: boolean;
} 