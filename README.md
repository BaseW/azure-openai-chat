# azure-open-ai-chat

[Ink](https://github.com/vadimdemedes/ink) と React を使って Azure OpenAI と連携する CLI チャットアプリ

## セットアップ

1. プロジェクトの依存関係をインストール
```bash
pnpm install
```

2. 環境変数を設定
以下の環境変数を設定する必要があります：

```bash
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_API_KEY="your-api-key"
export AZURE_OPENAI_DEPLOYMENT_NAME="gpt-35-turbo"  # オプション
```

3. アプリケーションを実行
```bash
pnpm start
```
