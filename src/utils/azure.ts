import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { Message } from '../types/index.js';

export const sendMessageToAzure = async (
  messages: Message[],
  azureEndpoint: string,
  apiKey: string,
  deploymentName: string,
  onProgress?: (token: string) => void
): Promise<string> => {
  const client = new OpenAIClient(azureEndpoint, new AzureKeyCredential(apiKey));

  const chatMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // ストリーミングが要求された場合
  if (onProgress) {
    let fullResponse = '';
    
    const events = await client.streamChatCompletions(
      deploymentName,
      chatMessages
    );
    
    for await (const event of events) {
      const token = event.choices[0]?.delta?.content || '';
      if (token) {
        fullResponse += token;
        onProgress(token);
      }
    }
    
    return fullResponse;
  } else {
    // 従来の非ストリーミングモード
    const response = await client.getChatCompletions(deploymentName, chatMessages);
    return response.choices[0].message?.content || '';
  }
};
