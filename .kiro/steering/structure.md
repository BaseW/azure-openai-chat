# Project Structure

## Directory Organization

```
azure-openai-chat/
├── dist/               # Compiled JavaScript output
├── docs/               # Documentation files
│   ├── feature-requests.md
│   └── todos.md
├── src/                # Source code
│   ├── components/     # React/Ink UI components
│   │   ├── App.tsx     # Main application component
│   │   └── MessageList.tsx # Message display component
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts    # Shared type interfaces
│   ├── utils/          # Utility functions and services
│   │   ├── azure.ts    # Azure OpenAI API integration
│   │   └── storage/    # Storage implementation
│   │       ├── __tests__/           # Test files for storage
│   │       │   └── fileStorage.test.js  # Tests for file storage
│   │       ├── fileStorage.ts       # File-based storage service
│   │       ├── index.ts             # Storage exports
│   │       ├── interfaces.ts        # Storage interfaces
│   │       ├── paths.ts             # File path utilities
│   │       └── permissions.ts       # File permission utilities
│   └── index.tsx       # Application entry point
```

## Key Architecture Components

### Components
- **App**: Main application container managing state and user input
- **MessageList**: Renders conversation messages and streaming content

### Types
- **Message**: Core message structure with role, content, and timestamp
- **ChatState**: Application state including messages and UI state
- **Config**: Application configuration from environment variables

### Storage
- **StorageService**: Interface for persistence operations
- **FileStorageService**: File system implementation of storage
- **Conversation**: Data structure for chat conversations
- **Session**: Named references to conversations

## Testing Structure
- Tests are co-located with the code they test in `__tests__` directories
- Each service has corresponding test files (e.g., `fileStorage.test.js`)
- Tests use Jest as the testing framework
- External dependencies are mocked (fs, path)
- Mock implementations of services are created for testing

## Architectural Patterns

1. **Service-based architecture**:
   - Clear interfaces for services (StorageService)
   - Implementation can be swapped (FileStorageService)
   - Services are designed to be testable with dependency injection

2. **Error handling**:
   - Custom error hierarchy (StorageError, PermissionError, etc.)
   - Consistent error patterns with operation context

3. **Component composition**:
   - React component hierarchy with props passing
   - State management at the App level

4. **File organization**:
   - Feature-based organization (components, utils, types)
   - Related functionality grouped together (storage)
   - Tests co-located with implementation code