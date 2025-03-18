export interface Message {
  role: 'user' | 'assistant';
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
  | 'deepseek-reasoner' 
  | 'deepseek-chat' 
  | 'deepseek-coder'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-2'
  | 'gpt-4o-mini' 
  | 'gpt-4o';

export type ModelInfo = {
  [K in ModelType]: {
    name: string;
    description: string;
  }
}

export interface MessageData {
  tavily?: TavilyResponse;
  reasoning?: string;
}
