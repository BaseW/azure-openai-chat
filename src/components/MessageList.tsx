import React from 'react';
import { Box, Text } from 'ink';
import { Message } from '../types/index.js';

interface MessageListProps {
  messages: Message[];
  error: string | null;
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, error, isLoading }) => {
  return (
    <Box flexDirection="column">
      {messages.map((message, index) => (
        <Box key={index} marginBottom={1}>
          <Text color={message.role === 'user' ? 'blue' : 'green'}>
            {message.role === 'user' ? '👤' : '🤖'} {message.content}
          </Text>
        </Box>
      ))}
      {error && (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
      {isLoading && (
        <Box marginTop={1}>
          <Text color="yellow">Thinking...</Text>
        </Box>
      )}
    </Box>
  );
};

export default MessageList;
