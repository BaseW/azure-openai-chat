import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Determines the base storage directory for the application based on the operating system.
 * Follows XDG Base Directory Specification on Linux/macOS and uses %APPDATA% on Windows.
 * 
 * @returns The base directory path for storing application data
 */
export function getBaseStorageDirectory(): string {
  const appName = 'azure-openai-chat';
  
  switch (os.platform()) {
    case 'win32':
      // Windows: Use %APPDATA%
      return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
    
    case 'darwin':
      // macOS: Use ~/Library/Application Support/
      return path.join(os.homedir(), 'Library', 'Application Support', appName);
    
    default:
      // Linux and others: Use XDG_DATA_HOME or ~/.local/share/
      const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
      return path.join(xdgDataHome, appName);
  }
}

/**
 * Gets the directory path for storing conversations
 * 
 * @returns The conversations directory path
 */
export function getConversationsDirectory(): string {
  return path.join(getBaseStorageDirectory(), 'conversations');
}

/**
 * Gets the directory path for storing named sessions
 * 
 * @returns The sessions directory path
 */
export function getSessionsDirectory(): string {
  return path.join(getBaseStorageDirectory(), 'sessions');
}

/**
 * Gets the file path for the command history
 * 
 * @returns The history file path
 */
export function getHistoryFilePath(): string {
  return path.join(getBaseStorageDirectory(), 'history.json');
}

/**
 * Ensures that the required storage directories exist.
 * Creates them if they don't exist.
 * 
 * @returns A promise that resolves when directories are created or verified
 */
export async function ensureStorageDirectories(): Promise<void> {
  const directories = [
    getBaseStorageDirectory(),
    getConversationsDirectory(),
    getSessionsDirectory()
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create storage directory: ${dir}. ${(error as Error).message}`);
    }
  }
}

/**
 * Validates if the storage directories exist and are accessible
 * 
 * @returns A promise that resolves to true if directories are valid, false otherwise
 */
export async function validateStorageDirectories(): Promise<boolean> {
  const directories = [
    getBaseStorageDirectory(),
    getConversationsDirectory(),
    getSessionsDirectory()
  ];

  try {
    for (const dir of directories) {
      await fs.access(dir, fs.constants.R_OK | fs.constants.W_OK);
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the file path for a specific conversation
 * 
 * @param conversationId The ID of the conversation
 * @returns The file path for the conversation
 */
export function getConversationFilePath(conversationId: string): string {
  return path.join(getConversationsDirectory(), `${conversationId}.json`);
}

/**
 * Gets the file path for a named session
 * 
 * @param sessionName The name of the session
 * @returns The file path for the session
 */
export function getSessionFilePath(sessionName: string): string {
  return path.join(getSessionsDirectory(), `${sessionName}.json`);
}