/**
 * Utility functions for the IDE
 */

/**
 * Sanitize filename to prevent directory traversal attacks
 * Blocks: .. , / , \ , null bytes
 */
export function sanitizeFilename(filename: string): string {
  if (/[\/\\]|\.\.|\x00/.test(filename)) {
    throw new Error('Invalid filename: contains dangerous characters');
  }

  if (filename.length > 255) {
    throw new Error('Filename too long (max 255 characters)');
  }

  if (filename.trim().length === 0) {
    throw new Error('Filename cannot be empty');
  }

  return filename.trim();
}

/**
 * Generate unique ID (timestamp + random string)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
