/**
 * User-friendly error message resolution for backend and client errors.
 * Maps technical error codes into actionable, clear human-readable messages.
 */

export interface FormattedError {
  code: string;
  title: string;
  message: string;
}

const ERROR_CODE_MAP: Record<string, { title: string; message: string }> = {
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message:
      'The selected video file exceeds the maximum 200MB size limit. Please choose a smaller video or compress the file before uploading.',
  },
  UNSUPPORTED_FORMAT: {
    title: 'Unsupported Video Format',
    message:
      'The file format is not supported. Please upload a video in MP4, MOV, AVI, MKV, or WebM format.',
  },
  EMPTY_FILE: {
    title: 'Empty File',
    message:
      'The uploaded video file is empty (0 bytes). Please select a valid, non-empty video file.',
  },
  INVALID_VIDEO: {
    title: 'Invalid or Corrupt Video',
    message:
      'The video file appears corrupt, incomplete, or contains undecodable video frames. Please verify the file plays locally and try again.',
  },
  QUEUE_FULL: {
    title: 'Server Busy',
    message:
      'The traffic analysis server is currently processing the maximum number of concurrent jobs. Please wait a few moments and try again.',
  },
  NETWORK_ERROR: {
    title: 'Backend Unreachable',
    message:
      'Unable to communicate with the analysis server. Please check your network connection and ensure the backend server is running.',
  },
  TIMEOUT: {
    title: 'Analysis Timed Out',
    message:
      'The video analysis took longer than the maximum allowed duration. For large files, consider using shorter video clips.',
  },
  POLLING_TIMEOUT: {
    title: 'Analysis Timed Out',
    message:
      'The analysis took too long to complete. The server may still be processing in the background, or the job timed out.',
  },
  JOB_NOT_FOUND: {
    title: 'Job Not Found',
    message:
      'The requested analysis job could not be located on the server. The session may have expired.',
  },
  PROCESSING_FAILED: {
    title: 'Processing Failed',
    message:
      'An unexpected error occurred during vehicle detection and tracking. Please verify your video footage and try again.',
  },
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message:
      'The selected file failed validation checks. Please select a valid video footage file.',
  },
  CANCELLED: {
    title: 'Analysis Cancelled',
    message: 'Video upload and analysis was cancelled by the user.',
  },
  UPLOAD_ABORTED: {
    title: 'Upload Cancelled',
    message: 'Video upload was cancelled.',
  },
};

export function formatErrorMessage(
  code?: string,
  rawMessage?: string
): FormattedError {
  const normalizedCode = (code || 'PROCESSING_FAILED').toUpperCase();
  const mapped = ERROR_CODE_MAP[normalizedCode];

  if (mapped) {
    // If backend provided a specific and safe message that isn't generic, we can use it or fallback to friendly mapped
    return {
      code: normalizedCode,
      title: mapped.title,
      message: mapped.message,
    };
  }

  return {
    code: normalizedCode,
    title: 'Analysis Error',
    message:
      rawMessage && !rawMessage.includes('java.') && !rawMessage.includes('Exception')
        ? rawMessage
        : 'An error occurred during video analysis. Please try again.',
  };
}
