import { promises as fs } from 'fs';
import path from 'path';
import {
  Conversation,
  ConversationMetadata,
  ConversationNotFoundError,
  FileSystemError,
  PermissionError,
  SessionMetadata,
  SessionNotFoundError,
  StorageService
} from './interfaces.js';
import {
  ensureStorageDirectories,
  getConversationFilePath,
  getConversationsDirectory,
  getSessionFilePath,
  getSessionsDirectory
} from './paths.js';
import { setSecureFilePermissions } from './permissions.js';

/**
 * Implementation of StorageService that uses the file system for storage
 */
export class FileStorageService implements StorageService {
  /**
   * Initialize the storage service by ensuring directories exist
   */
  async initialize(): Promise<void> {
    await ensureStorageDirectories();
  }

  /**
   * Save conversation data to storage
   * @param conversation The conversation to save
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      await ensureStorageDirectories();
      
      const filePath = getConversationFilePath(conversation.id);
      const data = JSON.stringify(conversation, null, 2);
      
      await fs.writeFile(filePath, data, 'utf8');
      await setSecureFilePermissions(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getConversationFilePath(conversation.id), 'save', error as Error);
      }
      throw new FileSystemError(getConversationFilePath(conversation.id), 'save', error as Error);
    }
  }

  /**
   * Load conversation by ID
   * @param id The conversation ID
   * @returns The conversation or null if not found
   */
  async loadConversation(id: string): Promise<Conversation | null> {
    try {
      const filePath = getConversationFilePath(id);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as Conversation;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getConversationFilePath(id), 'load', error as Error);
      }
      throw new FileSystemError(getConversationFilePath(id), 'load', error as Error);
    }
  }

  /**
   * List all saved conversations
   * @returns Array of conversation metadata
   */
  async listConversations(): Promise<ConversationMetadata[]> {
    try {
      await ensureStorageDirectories();
      
      const dir = getConversationsDirectory();
      const files = await fs.readdir(dir);
      
      const conversationFiles = files.filter(file => file.endsWith('.json'));
      
      const metadataPromises = conversationFiles.map(async (file) => {
        try {
          const filePath = path.join(dir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const conversation = JSON.parse(data) as Conversation;
          
          // Extract preview from the last message or use empty string
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          const preview = lastMessage 
            ? lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '')
            : '';
          
          return {
            id: conversation.id,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messageCount: conversation.messages.length,
            preview,
            title: conversation.metadata?.title
          };
        } catch (error) {
          console.error(`Error reading conversation file ${file}:`, error);
          return null;
        }
      });
      
      const metadataResults = await Promise.all(metadataPromises);
      
      // Filter out null results and sort by updatedAt (newest first)
      return metadataResults
        .filter((metadata): metadata is ConversationMetadata => metadata !== null)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getConversationsDirectory(), 'list', error as Error);
      }
      throw new FileSystemError(getConversationsDirectory(), 'list', error as Error);
    }
  }

  /**
   * Delete a conversation
   * @param id The conversation ID to delete
   * @returns True if deleted, false if not found
   */
  async deleteConversation(id: string): Promise<boolean> {
    try {
      const filePath = getConversationFilePath(id);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getConversationFilePath(id), 'delete', error as Error);
      }
      throw new FileSystemError(getConversationFilePath(id), 'delete', error as Error);
    }
  }

  /**
   * Delete all conversations
   */
  async clearAllConversations(): Promise<void> {
    try {
      await ensureStorageDirectories();
      
      const dir = getConversationsDirectory();
      const files = await fs.readdir(dir);
      
      const conversationFiles = files.filter(file => file.endsWith('.json'));
      
      await Promise.all(
        conversationFiles.map(file => 
          fs.unlink(path.join(dir, file))
            .catch(error => console.error(`Failed to delete ${file}:`, error))
        )
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getConversationsDirectory(), 'delete', error as Error);
      }
      throw new FileSystemError(getConversationsDirectory(), 'delete', error as Error);
    }
  }

  /**
   * Save a named session
   * @param name The session name
   * @param conversation The conversation to save as a session
   */
  async saveSession(name: string, conversation: Conversation): Promise<void> {
    try {
      await ensureStorageDirectories();
      
      const filePath = getSessionFilePath(name);
      
      // Create a session object that references the conversation
      const session = {
        name,
        conversationId: conversation.id,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const data = JSON.stringify(session, null, 2);
      
      await fs.writeFile(filePath, data, 'utf8');
      await setSecureFilePermissions(filePath);
      
      // Also ensure the referenced conversation is saved
      await this.saveConversation(conversation);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getSessionFilePath(name), 'save', error as Error);
      }
      throw new FileSystemError(getSessionFilePath(name), 'save', error as Error);
    }
  }

  /**
   * Load a named session
   * @param name The session name
   * @returns The conversation or null if not found
   */
  async loadSession(name: string): Promise<Conversation | null> {
    try {
      const sessionFilePath = getSessionFilePath(name);
      const sessionData = await fs.readFile(sessionFilePath, 'utf8');
      const session = JSON.parse(sessionData) as { conversationId: string };
      
      const conversation = await this.loadConversation(session.conversationId);
      if (!conversation) {
        throw new ConversationNotFoundError(session.conversationId);
      }
      
      return conversation;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      if (error instanceof ConversationNotFoundError) {
        throw new SessionNotFoundError(name);
      }
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getSessionFilePath(name), 'load', error as Error);
      }
      throw new FileSystemError(getSessionFilePath(name), 'load', error as Error);
    }
  }

  /**
   * List all named sessions
   * @returns Array of session metadata
   */
  async listSessions(): Promise<SessionMetadata[]> {
    try {
      await ensureStorageDirectories();
      
      const dir = getSessionsDirectory();
      const files = await fs.readdir(dir);
      
      const sessionFiles = files.filter(file => file.endsWith('.json'));
      
      const metadataPromises = sessionFiles.map(async (file) => {
        try {
          const sessionFilePath = path.join(dir, file);
          const sessionData = await fs.readFile(sessionFilePath, 'utf8');
          const session = JSON.parse(sessionData) as { 
            name: string; 
            conversationId: string;
            createdAt: number;
            updatedAt: number;
          };
          
          // Try to load the associated conversation to get additional metadata
          const conversation = await this.loadConversation(session.conversationId);
          
          if (!conversation) {
            // If conversation not found, return basic session info
            return {
              name: session.name,
              conversationId: session.conversationId,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
              messageCount: 0,
              preview: '[Conversation not found]'
            };
          }
          
          // Extract preview from the last message or use empty string
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          const preview = lastMessage 
            ? lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '')
            : '';
          
          return {
            name: session.name,
            conversationId: session.conversationId,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            messageCount: conversation.messages.length,
            preview
          };
        } catch (error) {
          console.error(`Error reading session file ${file}:`, error);
          return null;
        }
      });
      
      const metadataResults = await Promise.all(metadataPromises);
      
      // Filter out null results and sort by updatedAt (newest first)
      return metadataResults
        .filter((metadata): metadata is SessionMetadata => metadata !== null)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new PermissionError(getSessionsDirectory(), 'list', error as Error);
      }
      throw new FileSystemError(getSessionsDirectory(), 'list', error as Error);
    }
  }
}