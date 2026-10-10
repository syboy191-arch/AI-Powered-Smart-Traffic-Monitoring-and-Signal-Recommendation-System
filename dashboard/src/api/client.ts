import {
  UploadJobResponse,
  JobResponse,
  ApiError,
  ApiErrorPayload,
} from './types';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      try {
        const errorData = (await response.json()) as ApiErrorPayload;
        if (errorData?.error) {
          throw new ApiError(
            errorData.error.message || 'An error occurred during request',
            errorData.error.code || 'API_ERROR',
            response.status
          );
        }
      } catch (err) {
        if (err instanceof ApiError) throw err;
      }
    }
    throw new ApiError(
      `Request failed with status ${response.status}`,
      'HTTP_ERROR',
      response.status
    );
  }

  if (isJson) {
    return (await response.json()) as T;
  }
  return {} as T;
}

export const apiClient = {
  /**
   * Upload a traffic video file for asynchronous processing using Fetch.
   * @param file Video file to upload (mp4, avi, mov, mkv, webm)
   */
  async uploadVideo(file: File): Promise<UploadJobResponse> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch(`${BASE_URL}/api/videos`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<UploadJobResponse>(response);
  },

  /**
   * Upload a traffic video file with real-time XMLHttpRequest progress reporting and cancellation.
   * @param file Video file to upload
   * @param onProgress Callback invoked with upload percentage (0-100)
   * @param signal AbortSignal to cancel in-flight upload
   */
  uploadVideoWithProgress(
    file: File,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<UploadJobResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('video', file);

      // Handle abort signal
      if (signal) {
        if (signal.aborted) {
          return reject(new ApiError('Upload cancelled by user', 'UPLOAD_ABORTED', 0));
        }
        signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      // Track upload progress
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.min(
              100,
              Math.max(0, Math.round((event.loaded / event.total) * 100))
            );
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        let responseData: (UploadJobResponse & ApiErrorPayload) | null = null;
        try {
          if (xhr.responseText) {
            responseData = JSON.parse(xhr.responseText) as UploadJobResponse & ApiErrorPayload;
          }
        } catch {
          // Non-JSON response
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (responseData) {
            resolve(responseData as UploadJobResponse);
          } else {
            resolve({
              jobId: '',
              status: 'QUEUED',
              filename: file.name,
            });
          }
        } else {
          const errorMessage =
            responseData?.error?.message ||
            `Upload failed with status ${xhr.status} (${xhr.statusText || 'Server Error'})`;
          const errorCode = responseData?.error?.code || 'UPLOAD_ERROR';
          reject(new ApiError(errorMessage, errorCode, xhr.status));
        }
      };

      xhr.onerror = () => {
        reject(
          new ApiError(
            'Network error occurred during video upload. Please verify the backend server is running.',
            'NETWORK_ERROR',
            0
          )
        );
      };

      xhr.onabort = () => {
        reject(new ApiError('Upload cancelled by user', 'UPLOAD_ABORTED', 0));
      };

      xhr.ontimeout = () => {
        reject(new ApiError('Upload timed out. Please try again.', 'TIMEOUT', 0));
      };

      xhr.open('POST', `${BASE_URL}/api/videos`);
      xhr.send(formData);
    });
  },

  /**
   * Retrieve the status and results of a traffic analysis job.
   * @param jobId UUID of the job
   */
  async getJob(jobId: string): Promise<JobResponse> {
    const response = await fetch(`${BASE_URL}/api/jobs/${encodeURIComponent(jobId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    return handleResponse<JobResponse>(response);
  },

  /**
   * Get the video streaming URL for a processed job's annotated video.
   * @param jobId UUID of the job
   */
  getVideoUrl(jobId: string): string {
    return `${BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/video`;
  },
};
