import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { Message } from '../types/index.js';

export const sendMessageToAzure = async (
  messages: Message[],
  azureEndpoint: string,
  apiKey: string,
  deploymentName: string
): Promise<string> => {
  const client = new OpenAIClient(azureEndpoint, new AzureKeyCredential(apiKey));

  const chatMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  const response = await client.getChatCompletions(deploymentName, chatMessages);

  return response.choices[0].message?.content || '';
};
