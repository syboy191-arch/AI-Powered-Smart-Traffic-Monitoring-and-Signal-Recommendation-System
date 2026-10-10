/**
 * Video file validation constants and utility functions.
 * Validates format, non-empty, and file size constraints matching backend settings.
 */

export const MAX_FILE_SIZE_MB = 200;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 209,715,200 bytes

export const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm'] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Format bytes into human-readable string (B, KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formatted = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${formatted} ${units[i]}`;
}

/**
 * Extract lowercase file extension from filename without the dot.
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * Validate a video file for client-side pre-flight checks.
 * Validation is a convenience; the backend remains authoritative with magic-byte checks.
 */
export function validateVideoFile(file: File | null | undefined): ValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'Please select a video file.',
    };
  }

  // 1. Non-empty check
  if (file.size === 0) {
    return {
      valid: false,
      error: 'Selected file is empty (0 bytes). Please select a valid video.',
    };
  }

  // 2. Extension check
  const ext = getFileExtension(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
    const allowedList = ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ');
    return {
      valid: false,
      error: `Unsupported file format ${ext ? `'.${ext}'` : ''}. Supported formats: ${allowedList}.`,
    };
  }

  // 3. Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  return { valid: true };
}
