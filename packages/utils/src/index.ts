/**
 * Shared utility functions for SoraIDE
 */

// ============= File System Utilities =============

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
 * Validate file extension is allowed
 */
export function isAllowedExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return allowedExtensions.includes(ext);
}

// ============= ID Generation =============

/**
 * Generate unique ID (timestamp + random string)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============= Validation =============

/**
 * Validate project size limits
 */
export function validateProjectSize(
  files: Array<{ content: string }>,
  maxFileSize: number = 256 * 1024, // 256KB per file
  maxProjectSize: number = 1024 * 1024 // 1MB total
): void {
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  if (files.length > 20) {
    throw new Error('Too many files (max 20)');
  }

  let totalSize = 0;

  for (const file of files) {
    const fileSize = Buffer.byteLength(file.content, 'utf8');

    if (fileSize > maxFileSize) {
      throw new Error(`File too large (max ${maxFileSize / 1024}KB per file)`);
    }

    totalSize += fileSize;
  }

  if (totalSize > maxProjectSize) {
    throw new Error(`Project too large (max ${maxProjectSize / 1024}KB total)`);
  }
}

// ============= Color Generation =============

/**
 * Generate deterministic HSL color from string (for user cursors)
 */
export function generateUserColor(input: string): string {
  const hash = input.split('').reduce((acc, char) =>
    char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

// ============= Debounce/Throttle =============

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============= Error Handling =============

/**
 * Custom error class for SoraIDE
 */
export class SoraIDEError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SoraIDEError';
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  code?: string;
  statusCode: number;
} {
  if (error instanceof SoraIDEError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      statusCode: 500
    };
  }

  return {
    error: 'An unknown error occurred',
    statusCode: 500
  };
}

// ============= Rate Limiting =============

/**
 * In-memory rate limiter (for development)
 * Production should use Redis
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private limit: number,
    private windowMs: number
  ) {}

  /**
   * Check if request is allowed
   * @returns true if allowed, false if rate limit exceeded
   */
  check(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time =>
      now - time < this.windowMs
    );

    if (validRequests.length >= this.limit) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);

    return true;
  }

  /**
   * Get remaining requests for key
   */
  remaining(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time =>
      now - time < this.windowMs
    );

    return Math.max(0, this.limit - validRequests.length);
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time =>
        now - time < this.windowMs
      );

      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}
