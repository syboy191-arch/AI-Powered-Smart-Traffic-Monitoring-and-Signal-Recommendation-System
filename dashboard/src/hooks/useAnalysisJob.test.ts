import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalysisJob } from './useAnalysisJob';
import { apiClient } from '../api/client';
import { TrafficResult } from '../api/types';

vi.mock('../api/client', () => ({
  apiClient: {
    uploadVideoWithProgress: vi.fn(),
    getJob: vi.fn(),
    getVideoUrl: vi.fn((jobId: string) => `/api/jobs/${jobId}/video`),
  },
}));

describe('useAnalysisJob Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-video');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useAnalysisJob());

    expect(result.current.state).toBe('idle');
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.processingProgress).toBeNull();
    expect(result.current.jobId).toBeNull();
    expect(result.current.jobStatus).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('selects valid video file and transitions to selected state', () => {
    const { result } = renderHook(() => useAnalysisJob());
    const file = new File(['dummy content'], 'traffic.mp4', { type: 'video/mp4' });

    act(() => {
      const validation = result.current.selectFile(file);
      expect(validation.valid).toBe(true);
    });

    expect(result.current.state).toBe('selected');
    expect(result.current.selectedFile).toBe(file);
    expect(result.current.previewUrl).toBe('blob:http://localhost/mock-video');
    expect(result.current.error).toBeNull();
  });

  it('fails validation when invalid file is selected', () => {
    const { result } = renderHook(() => useAnalysisJob());
    const badFile = new File(['dummy'], 'document.pdf', { type: 'application/pdf' });

    act(() => {
      const validation = result.current.selectFile(badFile);
      expect(validation.valid).toBe(false);
    });

    expect(result.current.state).toBe('failed');
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.title).toBe('Invalid Input');
  });

  it('resets state back to idle on reset()', () => {
    const { result } = renderHook(() => useAnalysisJob());
    const file = new File(['dummy content'], 'traffic.mp4', { type: 'video/mp4' });

    act(() => {
      result.current.selectFile(file);
    });
    expect(result.current.state).toBe('selected');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('runs full successful analysis workflow from upload to completion', async () => {
    const mockResult: TrafficResult = {
      cars: 5,
      motorcycles: 1,
      buses: 0,
      trucks: 0,
      density: 'MEDIUM',
      recommendation: 'Maintain standard timing',
      unique_vehicles: { cars: 5, motorcycles: 1, buses: 0, trucks: 0, total: 6 },
      frames_processed: 50,
      fps: 30,
      duration_seconds: 1.67,
      avg_vehicles_per_frame: 6,
      peak_vehicles_in_frame: 8,
      thresholds: { medium: 5, high: 12 },
    };

    vi.mocked(apiClient.uploadVideoWithProgress).mockResolvedValueOnce({
      jobId: 'job-1234',
      status: 'QUEUED',
      filename: 'traffic.mp4',
    });

    vi.mocked(apiClient.getJob)
      .mockResolvedValueOnce({
        jobId: 'job-1234',
        status: 'PROCESSING',
        progress: 45,
      })
      .mockResolvedValueOnce({
        jobId: 'job-1234',
        status: 'COMPLETED',
        progress: 100,
        result: mockResult,
      });

    const { result } = renderHook(() => useAnalysisJob());
    const file = new File(['dummy content'], 'traffic.mp4', { type: 'video/mp4' });

    act(() => {
      result.current.selectFile(file);
    });

    let analysisPromise: Promise<void>;
    act(() => {
      analysisPromise = result.current.startAnalysis();
    });

    expect(result.current.state).toBe('uploading');

    await act(async () => {
      await analysisPromise;
    });

    expect(result.current.state).toBe('processing');
    expect(result.current.jobId).toBe('job-1234');

    // Advance timer for first poll
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Advance timer for second poll
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.state).toBe('completed');
    expect(result.current.result).toEqual(mockResult);
  });

  it('handles job failure returned by backend polling', async () => {
    vi.mocked(apiClient.uploadVideoWithProgress).mockResolvedValueOnce({
      jobId: 'job-failed',
      status: 'QUEUED',
      filename: 'broken.mp4',
    });

    vi.mocked(apiClient.getJob).mockResolvedValueOnce({
      jobId: 'job-failed',
      status: 'FAILED',
      error: {
        code: 'INVALID_VIDEO',
        message: 'Corrupt video header',
      },
    });

    const { result } = renderHook(() => useAnalysisJob());
    const file = new File(['broken content'], 'broken.mp4', { type: 'video/mp4' });

    act(() => {
      result.current.selectFile(file);
    });

    let analysisPromise: Promise<void>;
    act(() => {
      analysisPromise = result.current.startAnalysis();
    });

    await act(async () => {
      await analysisPromise;
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.state).toBe('failed');
    expect(result.current.error?.title).toBe('Invalid or Corrupt Video');
    expect(result.current.error?.message).toContain('corrupt');
  });
});
