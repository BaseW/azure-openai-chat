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

## 開発者向け情報

### Pre-commit Hooks

This project uses Git pre-commit hooks to ensure code quality. The hooks are automatically set up when you run `pnpm install`.

The pre-commit hook runs the following checks on staged files:

1.  **Linting and Formatting**: Runs Biome to check for code style and formatting issues. Automatically fixes them.
2.  **Type Checking**: Runs the TypeScript compiler (`tsc`) to check for type errors.
3.  **Unit Tests**: Runs related unit tests using `vitest`.

#### Bypassing Hooks

You can bypass the pre-commit hooks in several ways:

-   **Bypass all checks**: Use the `--no-verify` flag with your commit command:
    ```bash
    git commit -m "Your message" --no-verify
    ```
-   **Bypass specific checks**: Use environment variables to skip individual checks:
    -   `SKIP_BIOME=true`: Skips linting and formatting.
    -   `SKIP_TSC=true`: Skips TypeScript type checking.
    -   `SKIP_TESTS=true`: Skips unit tests.

    Example:
    ```bash
    SKIP_TESTS=true git commit -m "Your message"
    ```
