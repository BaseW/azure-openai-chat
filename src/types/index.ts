export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  input: string;
  streamingContent?: string;
}

export interface Config {
  azureEndpoint: string;
  apiKey: string;
  deploymentName: string;
}
