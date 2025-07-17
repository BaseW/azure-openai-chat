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
  const [streamingContent, setStreamingContent] = useState<string>('');
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
    setStreamingContent('');

    try {
      // ストリーミング用の一時的なメッセージを作成
      const tempAssistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      
      setMessages(prev => [...prev, tempAssistantMessage]);
      
      // ストリーミングコールバックを使用
      const response = await sendMessageToAzure(
        [...messages, newMessage],
        config.azureEndpoint,
        config.apiKey,
        config.deploymentName,
        (token) => {
          setStreamingContent(prev => prev + token);
        }
      );

      // ストリーミングが完了したら、完全なメッセージで置き換え
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => 
        prev.map(msg => 
          msg.isStreaming ? assistantMessage : msg
        )
      );
      setStreamingContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // エラーが発生した場合、ストリーミングメッセージを削除
      setMessages(prev => prev.filter(msg => !msg.isStreaming));
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
        <MessageList 
          messages={messages} 
          error={error} 
          isLoading={isLoading} 
          streamingContent={streamingContent}
        />
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
