import { describe, expect, test, vi, beforeEach } from 'vitest';
import { FileStorageService } from '../fileStorage.js';
import { Conversation } from '../interfaces.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock the fs.promises module
vi.mock('fs', () => ({
  promises: {
    writeFile: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn(),
    readdir: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn()
  }
}));

// Mock the path module
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: vi.fn((...args: string[]) => args.join('/'))
  };
});

// Mock the paths module
vi.mock('../paths.js', () => ({
  ensureStorageDirectories: vi.fn().mockResolvedValue(undefined),
  getConversationFilePath: vi.fn((id: string) => `conversations/${id}.json`),
  getSessionFilePath: vi.fn((name: string) => `sessions/${name}.json`),
  getConversationsDirectory: vi.fn(() => 'conversations'),
  getSessionsDirectory: vi.fn(() => 'sessions'),
}));

// Mock the permissions module
vi.mock('../permissions.js', () => ({
  setSecureFilePermissions: vi.fn().mockResolvedValue(undefined),
}));

describe('FileStorageService', () => {
  let service: FileStorageService;
  let mockConversation: Conversation;

  beforeEach(() => {
    service = new FileStorageService();
    mockConversation = {
      id: 'test-id',
      messages: [
        { role: 'user', content: 'Hello', timestamp: 1625097600000 },
        { role: 'assistant', content: 'Hi there!', timestamp: 1625097601000 }
      ],
      createdAt: 1625097600000,
      updatedAt: 1625097601000
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  test('saveConversation should write to file system', async () => {
    await service.saveConversation(mockConversation);

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      'conversations/test-id.json',
      JSON.stringify(mockConversation, null, 2),
      'utf8'
    );
  });

  test('loadConversation should read from file system', async () => {
    vi.mocked(fs.promises.readFile).mockResolvedValue(JSON.stringify(mockConversation));

    const result = await service.loadConversation('test-id');

    expect(fs.promises.readFile).toHaveBeenCalledWith('conversations/test-id.json', 'utf8');
    expect(result).toEqual(mockConversation);
  });

  test('loadConversation should return null if file not found', async () => {
    const error = new Error('File not found');
    (error as NodeJS.ErrnoException).code = 'ENOENT';
    vi.mocked(fs.promises.readFile).mockRejectedValue(error);

    const result = await service.loadConversation('non-existent');

    expect(result).toBeNull();
  });

  test('listConversations should return sorted metadata', async () => {
    const mockFiles = ['test-id1.json', 'test-id2.json'];
    const mockConversation1 = {
      ...mockConversation,
      id: 'test-id1',
      updatedAt: 1625097600000
    };
    const mockConversation2 = {
      ...mockConversation,
      id: 'test-id2',
      updatedAt: 1625097700000
    };

    vi.mocked(fs.promises.readdir).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockImplementation((path) => {
      if (path.includes('test-id1')) {
        return Promise.resolve(JSON.stringify(mockConversation1));
      } else {
        return Promise.resolve(JSON.stringify(mockConversation2));
      }
    });

    const result = await service.listConversations();

    expect(result).toHaveLength(2);
    // Should be sorted by updatedAt in descending order
    expect(result[0].id).toBe('test-id2');
    expect(result[1].id).toBe('test-id1');
  });

  test('deleteConversation should remove file', async () => {
    vi.mocked(fs.promises.unlink).mockResolvedValue(undefined);

    const result = await service.deleteConversation('test-id');

    expect(fs.promises.unlink).toHaveBeenCalledWith('conversations/test-id.json');
    expect(result).toBe(true);
  });

  test('deleteConversation should return false if file not found', async () => {
    const error = new Error('File not found');
    (error as NodeJS.ErrnoException).code = 'ENOENT';
    vi.mocked(fs.promises.unlink).mockRejectedValue(error);

    const result = await service.deleteConversation('non-existent');

    expect(result).toBe(false);
  });

  test('saveSession should save session and conversation', async () => {
    await service.saveSession('test-session', mockConversation);

    // Should save both the session and the conversation
    expect(fs.promises.writeFile).toHaveBeenCalledTimes(2);
  });

  test('loadSession should load the referenced conversation', async () => {
    const mockSession = {
      name: 'test-session',
      conversationId: 'test-id',
      createdAt: 1625097600000,
      updatedAt: 1625097601000
    };

    vi.mocked(fs.promises.readFile).mockImplementation((path) => {
      if (path.includes('sessions')) {
        return Promise.resolve(JSON.stringify(mockSession));
      } else {
        return Promise.resolve(JSON.stringify(mockConversation));
      }
    });

    const result = await service.loadSession('test-session');

    expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockConversation);
  });

  test('listSessions should return session metadata', async () => {
    const mockFiles = ['session1.json', 'session2.json'];
    const mockSession1 = {
      name: 'session1',
      conversationId: 'test-id1',
      createdAt: 1625097600000,
      updatedAt: 1625097600000
    };
    const mockSession2 = {
      name: 'session2',
      conversationId: 'test-id2',
      createdAt: 1625097700000,
      updatedAt: 1625097700000
    };

    vi.mocked(fs.promises.readdir).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockImplementation((path) => {
      if (path.includes('session1')) {
        return Promise.resolve(JSON.stringify(mockSession1));
      } else if (path.includes('session2')) {
        return Promise.resolve(JSON.stringify(mockSession2));
      } else if (path.includes('test-id1')) {
        return Promise.resolve(JSON.stringify(mockConversation));
      } else {
        return Promise.resolve(JSON.stringify(mockConversation));
      }
    });

    const result = await service.listSessions();

    expect(result).toHaveLength(2);
    // Should be sorted by updatedAt in descending order
    expect(result[0].name).toBe('session2');
    expect(result[1].name).toBe('session1');
  });
});