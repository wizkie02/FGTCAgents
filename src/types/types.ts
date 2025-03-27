export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  searchResults?: SearchResult[];
  fullTavilyData?: TavilyResponse | null;
  reasoningInput?: string;
}

export interface TavilyImage {
  url: string;
  description?: string;
}

export interface SearchResult {
  title: string;
  content: string;
  url: string;
  snippet?: string;
  score?: number;
  image?: TavilyImage;
}

export interface TavilyResponse {
  results: SearchResult[];
  images?: TavilyImage[];
  answer?: string;
  query?: string;
  error?: string;
}

export interface ChatSection {
  query: string;
  searchResults: SearchResult[];
  reasoning: string;
  response: string;
  error?: string | null;
  isLoadingSources?: boolean;
  isLoadingThinking?: boolean;
  isReasoningCollapsed?: boolean;
}

export interface SuggestionType {
  label: string;
  prefix: string;
}

export type ModelType =
  // OpenAI Models
  | 'gpt-4-turbo'
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'chatgpt-4o'
  | 'openai-o1-mini'
  | 'gpt-4-0125-preview'
  | 'gpt-4-vision-preview'
  | 'gpt-4'
  | 'gpt-3.5-turbo-0125'
  | 'gpt-3.5-turbo-instruct'
  // Anthropic Models
  | 'claude-3-opus'
  | 'claude-3.7-sonnet'
  | 'claude-3.5-sonnet-new'
  | 'claude-3.5-haiku'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'claude-2.1'
  // Google Models
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-pro'
  | 'gemini-pro'
  | 'gemini-pro-vision'
  // DeepSeek Models
  | 'deepseek-v3'
  | 'deepseek-r1'
  | 'deepseek-coder-33b'
  | 'deepseek-coder-6.7b'
  | 'deepseek-llm-67b-chat'
  | 'deepseek-llm-7b-chat'
  // Meta Models
  | 'llama-3-70b'
  | 'llama-3-8b'
  | 'llama-2-70b'
  | 'llama-2-13b'
  | 'llama-2-7b'
  // Mistral Models
  | 'mixtral-8x7b'
  | 'mistral-7b'
  | 'mistral-large'
  | 'mistral-medium'
  | 'mistral-small';

export type ModelInfo = {
  [K in ModelType]: {
    name: string;
    description: string;
  }
}

// Provider-specific response types
export interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
}

export interface AnthropicResponse {
  id: string;
  content: Array<{
    text: string;
    type: string;
  }>;
}

export interface GoogleAIResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export interface MetaAIResponse {
  generations: Array<{
    text: string;
  }>;
}

export interface MistralResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export type ModelResponse = 
  | OpenAIResponse 
  | AnthropicResponse 
  | GoogleAIResponse 
  | DeepSeekResponse 
  | MetaAIResponse 
  | MistralResponse;

export interface MessageData {
  tavily?: TavilyResponse;
  reasoning?: string;
}
