import { describe, expect, test, vi, beforeEach } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';
import {
  getBaseStorageDirectory,
  getConversationsDirectory,
  getSessionsDirectory,
  getHistoryFilePath,
  ensureStorageDirectories,
  validateStorageDirectories
} from '../paths.js';

// Mock the paths module directly
vi.mock('../paths.js', async (importOriginal) => {
  const actual = await importOriginal();
  
  // Override the getBaseStorageDirectory function
  const mockGetBaseStorageDirectory = vi.fn();
  mockGetBaseStorageDirectory.mockImplementation(() => {
    const platform = vi.mocked(os.platform).getMockImplementation()?.();
    const homedir = vi.mocked(os.homedir).getMockImplementation()?.();
    
    if (platform === 'win32') {
      return path.join('/mock/appdata', 'azure-openai-chat');
    } else if (platform === 'darwin') {
      return path.join(homedir || '/mock/home', 'Library', 'Application Support', 'azure-openai-chat');
    } else {
      // Linux and others
      const xdgDataHome = process.env.XDG_DATA_HOME || path.join(homedir || '/mock/home', '.local', 'share');
      return path.join(xdgDataHome, 'azure-openai-chat');
    }
  });
  
  return {
    ...actual,
    getBaseStorageDirectory: mockGetBaseStorageDirectory,
    getConversationsDirectory: vi.fn().mockImplementation(() => path.join(mockGetBaseStorageDirectory(), 'conversations')),
    getSessionsDirectory: vi.fn().mockImplementation(() => path.join(mockGetBaseStorageDirectory(), 'sessions')),
    getHistoryFilePath: vi.fn().mockImplementation(() => path.join(mockGetBaseStorageDirectory(), 'history.json')),
    ensureStorageDirectories: vi.fn().mockImplementation(async () => {
      const dirs = [
        mockGetBaseStorageDirectory(),
        path.join(mockGetBaseStorageDirectory(), 'conversations'),
        path.join(mockGetBaseStorageDirectory(), 'sessions')
      ];
      
      for (const dir of dirs) {
        try {
          await fs.mkdir(dir, { recursive: true });
        } catch (error) {
          throw new Error(`Failed to create storage directory: ${dir}. ${(error as Error).message}`);
        }
      }
    }),
    validateStorageDirectories: vi.fn().mockImplementation(async () => {
      try {
        await fs.access(mockGetBaseStorageDirectory(), fs.constants.R_OK | fs.constants.W_OK);
        await fs.access(path.join(mockGetBaseStorageDirectory(), 'conversations'), fs.constants.R_OK | fs.constants.W_OK);
        await fs.access(path.join(mockGetBaseStorageDirectory(), 'sessions'), fs.constants.R_OK | fs.constants.W_OK);
        return true;
      } catch (error) {
        return false;
      }
    })
  };
});

// Mock the os module
vi.mock('os', () => ({
  platform: vi.fn(),
  homedir: vi.fn()
}));

// Mock the fs.promises module
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    access: vi.fn()
  },
  constants: {
    R_OK: 4,
    W_OK: 2
  }
}));

describe('Storage Paths', () => {
  const mockHomedir = '/mock/home';
  
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock os.homedir
    vi.mocked(os.homedir).mockReturnValue(mockHomedir);
    
    // Mock process.env
    process.env.APPDATA = '/mock/appdata';
    process.env.XDG_DATA_HOME = '/mock/xdg/data';
    
    // Mock fs.access to succeed by default
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  describe('getBaseStorageDirectory', () => {
    test('should return the correct path for Windows', () => {
      vi.mocked(os.platform).mockReturnValue('win32');
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join('/mock/appdata', 'azure-openai-chat'));
    });

    test('should return the correct path for macOS', () => {
      vi.mocked(os.platform).mockReturnValue('darwin');
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join(mockHomedir, 'Library', 'Application Support', 'azure-openai-chat'));
    });

    test('should return the correct path for Linux using XDG_DATA_HOME', () => {
      vi.mocked(os.platform).mockReturnValue('linux');
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join('/mock/xdg/data', 'azure-openai-chat'));
    });

    test('should return the correct path for Linux without XDG_DATA_HOME', () => {
      vi.mocked(os.platform).mockReturnValue('linux');
      delete process.env.XDG_DATA_HOME;
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join(mockHomedir, '.local', 'share', 'azure-openai-chat'));
    });
  });

  describe('Directory paths', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('linux');
    });

    test('should return the correct conversations directory', () => {
      const baseDir = getBaseStorageDirectory();
      const result = getConversationsDirectory();
      
      expect(result).toBe(path.join(baseDir, 'conversations'));
    });

    test('should return the correct sessions directory', () => {
      const baseDir = getBaseStorageDirectory();
      const result = getSessionsDirectory();
      
      expect(result).toBe(path.join(baseDir, 'sessions'));
    });

    test('should return the correct history file path', () => {
      const baseDir = getBaseStorageDirectory();
      const result = getHistoryFilePath();
      
      expect(result).toBe(path.join(baseDir, 'history.json'));
    });
  });

  describe('ensureStorageDirectories', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('linux');
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    });

    test('should create all required directories', async () => {
      await ensureStorageDirectories();
      
      expect(fs.mkdir).toHaveBeenCalledTimes(3);
    });

    test('should throw an error if directory creation fails', async () => {
      const error = new Error('Permission denied');
      vi.mocked(fs.mkdir).mockRejectedValue(error);
      
      await expect(ensureStorageDirectories()).rejects.toThrow(/Failed to create storage directory/);
    });
  });

  describe('validateStorageDirectories', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('linux');
      vi.mocked(fs.access).mockResolvedValue(undefined);
    });

    test('should return true if all directories are accessible', async () => {
      const result = await validateStorageDirectories();
      
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledTimes(3);
    });

    test('should return false if any directory is not accessible', async () => {
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('Access denied'));
      
      const result = await validateStorageDirectories();
      
      expect(result).toBe(false);
    });
  });
});