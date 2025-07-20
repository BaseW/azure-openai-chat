# Technical Stack

## Core Technologies
- **Language**: TypeScript
- **Runtime**: Node.js
- **UI Framework**: Ink (React for CLI)
- **Module System**: ES Modules (ESM) for source, CommonJS for some tests

## Key Libraries
- **@azure/openai**: Azure OpenAI API client
- **ink**: Terminal UI framework based on React
- **ink-text-input**: Text input component for Ink

## Development Tools
- **TypeScript**: Strict type checking with `nodenext` module resolution
- **Jest**: Testing framework for unit tests
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Build System
- Package manager: pnpm
- Build tool: TypeScript compiler (tsc)

## Project Commands
```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run the application
pnpm start

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## Environment Configuration
Required environment variables:
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI API endpoint URL
- `AZURE_OPENAI_API_KEY`: API key for authentication
- `AZURE_OPENAI_DEPLOYMENT_NAME`: Model deployment name (optional)

## Code Style Guidelines
- Use ES Modules with explicit `.js` extensions in imports for source code
- Some test files may use CommonJS format
- Follow TypeScript strict mode guidelines
- Use interfaces for type definitions
- Implement proper error handling with custom error classes
- Use async/await for asynchronous operations

## Testing Guidelines
- Use Jest for unit testing
- Mock external dependencies (fs, path)
- Test both success and error paths
- Use descriptive test names that explain the expected behavior
- Group related tests with describe blocks
- Reset mocks between tests with jest.clearAllMocks()
- Create mock implementations of services for testing