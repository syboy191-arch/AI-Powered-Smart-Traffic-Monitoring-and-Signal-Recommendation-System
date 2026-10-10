import { useState, useRef, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { TrafficResult, JobStatus } from '../api/types';
import { validateVideoFile, ValidationResult } from '../utils/validation';
import { formatErrorMessage, FormattedError } from '../utils/errorMapping';

export type JobWorkflowState =
  | 'idle'
  | 'selected'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed';

export interface UseAnalysisJobReturn {
  // Current state machine status
  state: JobWorkflowState;

  // Selected file and preview
  selectedFile: File | null;
  previewUrl: string | null;

  // Progress metrics
  uploadProgress: number; // 0 - 100
  processingProgress: number | null; // from backend (0 - 100) or null if not yet reported

  // Backend job metadata
  jobId: string | null;
  jobStatus: JobStatus | null;

  // Result and error
  result: TrafficResult | null;
  error: FormattedError | null;

  // Actions
  selectFile: (file: File) => ValidationResult;
  startAnalysis: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
  dismissError: () => void;
}

const BASE_POLLING_INTERVAL_MS = 1500;
const MAX_POLLING_DURATION_MS = 5 * 60 * 1000; // 5 minutes max total polling time
const MAX_CONSECUTIVE_POLL_ERRORS = 5;

export function useAnalysisJob(): UseAnalysisJobReturn {
  const [state, setState] = useState<JobWorkflowState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingProgress, setProcessingProgress] = useState<number | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  const [result, setResult] = useState<TrafficResult | null>(null);
  const [error, setError] = useState<FormattedError | null>(null);

  // References for cleanup and race-condition prevention
  const pollTimerRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const pollingStartTimeRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);

  // Keep previewUrlRef in sync
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  // Clean up polling timer
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Revoke object URL safely
  const revokeCurrentPreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      revokeCurrentPreview();
    };
  }, [stopPolling, revokeCurrentPreview]);

  /**
   * Select and validate a file for analysis.
   */
  const selectFile = useCallback(
    (file: File): ValidationResult => {
      // 1. Abort any previous pending work
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // 2. Validate file
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        const formatted = formatErrorMessage(
          'VALIDATION_ERROR',
          validation.error || 'Invalid video file selected.'
        );
        setError(formatted);
        setState('failed');
        return validation;
      }

      // 3. Revoke existing preview URL
      revokeCurrentPreview();

      // 4. Create new preview URL
      const newPreviewUrl = URL.createObjectURL(file);
      previewUrlRef.current = newPreviewUrl;

      // 5. Update state
      setSelectedFile(file);
      setPreviewUrl(newPreviewUrl);
      setError(null);
      setResult(null);
      setJobId(null);
      setJobStatus(null);
      setUploadProgress(0);
      setProcessingProgress(null);
      setState('selected');

      return validation;
    },
    [stopPolling, revokeCurrentPreview]
  );

  /**
   * Poll GET /api/jobs/{jobId} with exponential backoff on errors and max total timeout.
   */
  const pollJobStatus = useCallback(
    (targetJobId: string) => {
      stopPolling();
      pollingStartTimeRef.current = Date.now();
      consecutiveErrorsRef.current = 0;

      const scheduleNextPoll = (delayMs: number) => {
        if (!isMountedRef.current) return;
        pollTimerRef.current = window.setTimeout(runPollStep, delayMs);
      };

      const runPollStep = async () => {
        if (!isMountedRef.current) return;

        // Check max total polling duration
        const elapsed = Date.now() - pollingStartTimeRef.current;
        if (elapsed > MAX_POLLING_DURATION_MS) {
          stopPolling();
          const formatted = formatErrorMessage(
            'POLLING_TIMEOUT',
            'Analysis timed out while waiting for server results.'
          );
          setError(formatted);
          setState('failed');
          return;
        }

        try {
          const response = await apiClient.getJob(targetJobId);
          if (!isMountedRef.current) return;

          // Reset consecutive error counter on successful response
          consecutiveErrorsRef.current = 0;

          setJobStatus(response.status);
          if (response.progress !== undefined && response.progress !== null) {
            setProcessingProgress(response.progress);
          }

          if (response.status === 'COMPLETED') {
            stopPolling();
            if (response.result) {
              setResult(response.result);
            }
            setState('completed');
          } else if (response.status === 'FAILED') {
            stopPolling();
            const rawCode = response.error?.code || 'PROCESSING_FAILED';
            const rawMsg = response.error?.message;
            setError(formatErrorMessage(rawCode, rawMsg));
            setState('failed');
          } else {
            // Still QUEUED or PROCESSING — schedule next check
            scheduleNextPoll(BASE_POLLING_INTERVAL_MS);
          }
        } catch (err: unknown) {
          if (!isMountedRef.current) return;

          const apiErr = err as { status?: number; message?: string; code?: string };

          // 404 means the job is definitely gone/expired
          if (apiErr?.status === 404) {
            stopPolling();
            setError(
              formatErrorMessage(
                'JOB_NOT_FOUND',
                `Job ${targetJobId} was not found on the server.`
              )
            );
            setState('failed');
            return;
          }

          // Handle transient network / 5xx polling errors with backoff
          consecutiveErrorsRef.current += 1;
          const retries = consecutiveErrorsRef.current;

          if (retries >= MAX_CONSECUTIVE_POLL_ERRORS) {
            stopPolling();
            setError(
              formatErrorMessage(
                'NETWORK_ERROR',
                'Lost connection to traffic analysis server after multiple retries.'
              )
            );
            setState('failed');
          } else {
            // Exponential backoff: 2s, 3s, 4.5s, 6.75s...
            const backoffDelay = Math.min(
              10000,
              Math.round(BASE_POLLING_INTERVAL_MS * Math.pow(1.5, retries))
            );
            scheduleNextPoll(backoffDelay);
          }
        }
      };

      // Run initial check
      runPollStep();
    },
    [stopPolling]
  );

  /**
   * Start asynchronous video upload and analysis.
   */
  const startAnalysis = useCallback(async () => {
    if (!selectedFile || (state !== 'selected' && state !== 'failed')) {
      return;
    }

    // Prepare upload
    setState('uploading');
    setUploadProgress(0);
    setProcessingProgress(null);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Upload file with XHR progress reporting
      const uploadResponse = await apiClient.uploadVideoWithProgress(
        selectedFile,
        (percent) => {
          if (isMountedRef.current) {
            setUploadProgress(percent);
          }
        },
        abortController.signal
      );

      if (!isMountedRef.current) return;

      // 2. Upload complete → transition to processing
      setJobId(uploadResponse.jobId);
      setJobStatus(uploadResponse.status || 'QUEUED');
      setState('processing');

      // 3. Start polling backend for status
      pollJobStatus(uploadResponse.jobId);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;

      const apiErr = err as { code?: string; message?: string };
      if (apiErr?.code === 'UPLOAD_ABORTED') {
        // User cancelled upload
        setState('selected');
        setUploadProgress(0);
        return;
      }

      const formatted = formatErrorMessage(
        apiErr?.code || 'NETWORK_ERROR',
        apiErr?.message || 'Failed to upload traffic video.'
      );
      setError(formatted);
      setState('failed');
    } finally {
      abortControllerRef.current = null;
    }
  }, [selectedFile, state, pollJobStatus]);

  /**
   * Cancel in-flight upload or processing.
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopPolling();

    if (state === 'uploading') {
      setUploadProgress(0);
      setState('selected');
    } else if (state === 'processing') {
      setError(formatErrorMessage('CANCELLED', 'Analysis cancelled by user.'));
      setState('failed');
    }
  }, [state, stopPolling]);

  /**
   * Reset the entire hook state back to idle.
   */
  const reset = useCallback(() => {
    stopPolling();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    revokeCurrentPreview();

    setSelectedFile(null);
    setUploadProgress(0);
    setProcessingProgress(null);
    setJobId(null);
    setJobStatus(null);
    setResult(null);
    setError(null);
    setState('idle');
  }, [stopPolling, revokeCurrentPreview]);

  /**
   * Dismiss the current error alert while keeping the selected file.
   */
  const dismissError = useCallback(() => {
    setError(null);
    if (state === 'failed') {
      if (selectedFile) {
        setState('selected');
      } else {
        setState('idle');
      }
    }
  }, [state, selectedFile]);

  return {
    state,
    selectedFile,
    previewUrl,
    uploadProgress,
    processingProgress,
    jobId,
    jobStatus,
    result,
    error,
    selectFile,
    startAnalysis,
    cancel,
    reset,
    dismissError,
  };
}
