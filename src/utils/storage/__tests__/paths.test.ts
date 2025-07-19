import { jest } from '@jest/globals';
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

// Mock the os and fs modules
jest.mock('os');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    access: jest.fn()
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
    jest.resetAllMocks();
    
    // Mock os.homedir
    (os.homedir as jest.Mock).mockReturnValue(mockHomedir);
    
    // Mock process.env
    process.env.APPDATA = '/mock/appdata';
    process.env.XDG_DATA_HOME = '/mock/xdg/data';
  });

  describe('getBaseStorageDirectory', () => {
    it('should return the correct path for Windows', () => {
      (os.platform as jest.Mock).mockReturnValue('win32');
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join('/mock/appdata', 'azure-openai-chat'));
    });

    it('should return the correct path for macOS', () => {
      (os.platform as jest.Mock).mockReturnValue('darwin');
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join(mockHomedir, 'Library', 'Application Support', 'azure-openai-chat'));
    });

    it('should return the correct path for Linux using XDG_DATA_HOME', () => {
      (os.platform as jest.Mock).mockReturnValue('linux');
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join('/mock/xdg/data', 'azure-openai-chat'));
    });

    it('should return the correct path for Linux without XDG_DATA_HOME', () => {
      (os.platform as jest.Mock).mockReturnValue('linux');
      delete process.env.XDG_DATA_HOME;
      
      const result = getBaseStorageDirectory();
      
      expect(result).toBe(path.join(mockHomedir, '.local', 'share', 'azure-openai-chat'));
    });
  });

  describe('Directory paths', () => {
    beforeEach(() => {
      (os.platform as jest.Mock).mockReturnValue('linux');
    });

    it('should return the correct conversations directory', () => {
      const baseDir = getBaseStorageDirectory();
      const result = getConversationsDirectory();
      
      expect(result).toBe(path.join(baseDir, 'conversations'));
    });

    it('should return the correct sessions directory', () => {
      const baseDir = getBaseStorageDirectory();
      const result = getSessionsDirectory();
      
      expect(result).toBe(path.join(baseDir, 'sessions'));
    });

    it('should return the correct history file path', () => {
      const baseDir = getBaseStorageDirectory();
      const result = getHistoryFilePath();
      
      expect(result).toBe(path.join(baseDir, 'history.json'));
    });
  });

  describe('ensureStorageDirectories', () => {
    beforeEach(() => {
      (os.platform as jest.Mock).mockReturnValue('linux');
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    });

    it('should create all required directories', async () => {
      await ensureStorageDirectories();
      
      expect(fs.mkdir).toHaveBeenCalledTimes(3);
      expect(fs.mkdir).toHaveBeenCalledWith(getBaseStorageDirectory(), { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(getConversationsDirectory(), { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(getSessionsDirectory(), { recursive: true });
    });

    it('should throw an error if directory creation fails', async () => {
      const error = new Error('Permission denied');
      (fs.mkdir as jest.Mock).mockRejectedValue(error);
      
      await expect(ensureStorageDirectories()).rejects.toThrow(/Failed to create storage directory/);
    });
  });

  describe('validateStorageDirectories', () => {
    beforeEach(() => {
      (os.platform as jest.Mock).mockReturnValue('linux');
      (fs.access as jest.Mock).mockResolvedValue(undefined);
    });

    it('should return true if all directories are accessible', async () => {
      const result = await validateStorageDirectories();
      
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledTimes(3);
    });

    it('should return false if any directory is not accessible', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce(new Error('Access denied'));
      
      const result = await validateStorageDirectories();
      
      expect(result).toBe(false);
    });
  });
});