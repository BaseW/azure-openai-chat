import React from 'react';
import { render } from 'ink';
import App from './components/App.js';

const main = () => {
  const config = {
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
  };

  if (!config.azureEndpoint || !config.apiKey) {
    console.error('Error: Azure OpenAI configuration is missing');
    console.error('Please set the following environment variables:');
    console.error('  AZURE_OPENAI_ENDPOINT');
    console.error('  AZURE_OPENAI_API_KEY');
    console.error('  AZURE_OPENAI_DEPLOYMENT_NAME (optional, defaults to gpt-35-turbo)');
    process.exit(1);
  }

  render(<App config={config} />);
};

main();
