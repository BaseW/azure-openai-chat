import { promises as fs } from 'fs';
import os from 'os';

/**
 * Sets appropriate file permissions for storage files to ensure privacy
 * On Unix-like systems, sets 0o600 (read/write for owner only)
 * On Windows, this is a no-op as Windows uses ACLs
 * 
 * @param filePath Path to the file to set permissions on
 * @returns A promise that resolves when permissions are set
 */
export async function setSecureFilePermissions(filePath: string): Promise<void> {
  // Only set explicit permissions on Unix-like systems
  if (os.platform() !== 'win32') {
    try {
      // 0o600 = read/write for owner only
      await fs.chmod(filePath, 0o600);
    } catch (error) {
      console.error(`Failed to set permissions on ${filePath}: ${(error as Error).message}`);
      // Don't throw, as this is not critical for functionality
    }
  }
}

/**
 * Validates if a file has secure permissions
 * On Unix-like systems, checks if permissions are 0o600 or more restrictive
 * On Windows, always returns true as Windows uses ACLs
 * 
 * @param filePath Path to the file to check permissions
 * @returns A promise that resolves to true if permissions are secure, false otherwise
 */
export async function validateFilePermissions(filePath: string): Promise<boolean> {
  // Windows uses ACLs, so we don't check permissions on Windows
  if (os.platform() === 'win32') {
    return true;
  }

  try {
    const stats = await fs.stat(filePath);
    // Check if permissions are 0o600 (read/write for owner only) or more restrictive
    // 0o077 is the mask for all permissions for group and others
    return (stats.mode & 0o077) === 0;
  } catch (error) {
    return false;
  }
}