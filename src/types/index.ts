export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  input: string;
}

export interface Config {
  azureEndpoint: string;
  apiKey: string;
  deploymentName: string;
}
