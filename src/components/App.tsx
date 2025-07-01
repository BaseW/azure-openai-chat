import React, { useState, useRef } from 'react';
import { Box, Text, useStdin } from 'ink';
import TextInput from 'ink-text-input';
import { Message } from '../types/index.js';
import MessageList from './MessageList.js';
import { sendMessageToAzure } from '../utils/azure.js';

interface AppProps {
  config: {
    azureEndpoint: string;
    apiKey: string;
    deploymentName: string;
  };
}

const App: React.FC<AppProps> = ({ config }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const stdin = useStdin();

  const handleSend = async () => {
    const input = inputValue.trim();
    if (!input) return;

    const newMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessageToAzure(
        [...messages, newMessage],
        config.azureEndpoint,
        config.apiKey,
        config.deploymentName
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box marginBottom={1}>
        <Text>azure-openai-chat</Text>
      </Box>
      <Box flexGrow={1}>
        <MessageList messages={messages} error={error} isLoading={isLoading} />
      </Box>
      <Box marginTop={1}>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          placeholder="Type your message..."
          onSubmit={handleSend}
        />
      </Box>
    </Box>
  );
};

export default App;
