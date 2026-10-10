export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type DensityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UniqueVehicles {
  cars: number;
  motorcycles: number;
  buses: number;
  trucks: number;
  total: number;
}

export interface Thresholds {
  medium: number;
  high: number;
}

export interface TrafficResult {
  // Core / legacy fields
  cars: number;
  motorcycles: number;
  buses: number;
  trucks: number;
  density: DensityLevel;
  recommendation: string;

  // Optional extended Module 1/2/5B fields
  unique_vehicles?: UniqueVehicles;
  frames_processed?: number;
  fps?: number;
  duration_seconds?: number;
  avg_vehicles_per_frame?: number;
  peak_vehicles_in_frame?: number;
  thresholds?: Thresholds;
  annotated_video?: string | null;
}

export interface JobError {
  code: string;
  message: string;
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  filename?: string;
  progress?: number | null;
  result?: TrafficResult | null;
  error?: JobError | null;
  createdAt?: string;
}

export interface SessionAnalysisRecord {
  id: string;
  filename: string;
  timestamp: number;
  result: TrafficResult;
  status: JobStatus;
  durationSeconds?: number;
}

export interface UploadJobResponse {
  jobId: string;
  status: JobStatus;
  filename: string;
}

export interface ApiErrorPayload {
  error: JobError;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
