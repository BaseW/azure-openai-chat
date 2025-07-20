import { Message } from '../../types/index.js';

/**
 * Represents a conversation with messages and metadata
 */
export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    title?: string;
    tags?: string[];
    summary?: string;
  };
}

/**
 * Metadata about a conversation for listing purposes
 */
export interface ConversationMetadata {
  id: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview: string;
  title?: string;
}

/**
 * Metadata about a named session
 */
export interface SessionMetadata {
  name: string;
  conversationId: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview: string;
}

/**
 * Supported export formats for conversations
 */
export type ExportFormat = 'json' | 'markdown' | 'text';

/**
 * Interface for storage operations
 */
export interface StorageService {
  /**
   * Save conversation data to storage
   * @param conversation The conversation to save
   */
  saveConversation(conversation: Conversation): Promise<void>;
  
  /**
   * Load conversation by ID
   * @param id The conversation ID
   * @returns The conversation or null if not found
   */
  loadConversation(id: string): Promise<Conversation | null>;
  
  /**
   * List all saved conversations
   * @returns Array of conversation metadata
   */
  listConversations(): Promise<ConversationMetadata[]>;
  
  /**
   * Delete a conversation
   * @param id The conversation ID to delete
   * @returns True if deleted, false if not found
   */
  deleteConversation(id: string): Promise<boolean>;
  
  /**
   * Delete all conversations
   */
  clearAllConversations(): Promise<void>;
  
  /**
   * Save a named session
   * @param name The session name
   * @param conversation The conversation to save as a session
   */
  saveSession(name: string, conversation: Conversation): Promise<void>;
  
  /**
   * Load a named session
   * @param name The session name
   * @returns The conversation or null if not found
   */
  loadSession(name: string): Promise<Conversation | null>;
  
  /**
   * List all named sessions
   * @returns Array of session metadata
   */
  listSessions(): Promise<SessionMetadata[]>;
}

/**
 * Base error class for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string, 
    public operation: 'save' | 'load' | 'delete' | 'list', 
    public cause?: Error
  ) {
    super(`Storage error during ${operation}: ${message}`);
    this.name = 'StorageError';
  }
}

/**
 * Error thrown when a conversation is not found
 */
export class ConversationNotFoundError extends StorageError {
  constructor(id: string) {
    super(`Conversation with ID ${id} not found`, 'load');
    this.name = 'ConversationNotFoundError';
  }
}

/**
 * Error thrown when a session is not found
 */
export class SessionNotFoundError extends StorageError {
  constructor(name: string) {
    super(`Session with name "${name}" not found`, 'load');
    this.name = 'SessionNotFoundError';
  }
}

/**
 * Error thrown when there's an issue with file permissions
 */
export class PermissionError extends StorageError {
  constructor(path: string, operation: 'save' | 'load' | 'delete' | 'list', cause?: Error) {
    super(`Permission denied for ${path}`, operation, cause);
    this.name = 'PermissionError';
  }
}

/**
 * Error thrown when there's an issue with file system operations
 */
export class FileSystemError extends StorageError {
  constructor(path: string, operation: 'save' | 'load' | 'delete' | 'list', cause?: Error) {
    super(`File system error for ${path}`, operation, cause);
    this.name = 'FileSystemError';
  }
}

/**
 * Error thrown when there's an issue with data validation
 */
export class DataValidationError extends StorageError {
  constructor(message: string, operation: 'save' | 'load') {
    super(`Data validation error: ${message}`, operation);
    this.name = 'DataValidationError';
  }
}