import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  getFileExtension,
  validateVideoFile,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from './validation';

describe('validation utils', () => {
  describe('formatFileSize', () => {
    it('formats 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(-10)).toBe('0 B');
    });

    it('formats bytes, kilobytes, and megabytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(50 * 1024 * 1024)).toBe('50.0 MB');
    });
  });

  describe('getFileExtension', () => {
    it('extracts extension accurately in lowercase', () => {
      expect(getFileExtension('traffic.mp4')).toBe('mp4');
      expect(getFileExtension('VIDEO.MOV')).toBe('mov');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('sample.TRAFFIC.MKV')).toBe('mkv');
    });

    it('returns empty string when no extension or trailing dot', () => {
      expect(getFileExtension('noextension')).toBe('');
      expect(getFileExtension('trailing.')).toBe('');
    });
  });

  describe('validateVideoFile', () => {
    it('rejects null or undefined file', () => {
      expect(validateVideoFile(null)).toEqual({
        valid: false,
        error: 'Please select a video file.',
      });
      expect(validateVideoFile(undefined)).toEqual({
        valid: false,
        error: 'Please select a video file.',
      });
    });

    it('rejects 0-byte empty file', () => {
      const emptyFile = new File([], 'empty.mp4', { type: 'video/mp4' });
      const result = validateVideoFile(emptyFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Selected file is empty');
    });

    it('rejects unsupported extensions', () => {
      const txtFile = new File(['dummy'], 'notes.txt', { type: 'text/plain' });
      const result = validateVideoFile(txtFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file format');

      const exeFile = new File(['dummy'], 'program.exe', { type: 'application/octet-stream' });
      expect(validateVideoFile(exeFile).valid).toBe(false);
    });

    it('rejects files exceeding size limit', () => {
      // Mock large file size property
      const largeFile = new File(['dummy'], 'huge.mp4', { type: 'video/mp4' });
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE_BYTES + 1024 });

      const result = validateVideoFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB}MB`);
    });

    it('accepts valid video files with allowed extensions', () => {
      const allowed = ['traffic.mp4', 'traffic.mov', 'traffic.avi', 'traffic.mkv', 'traffic.webm'];
      for (const name of allowed) {
        const file = new File(['dummy content'], name, { type: 'video/mp4' });
        expect(validateVideoFile(file)).toEqual({ valid: true });
      }
    });
  });
});
