import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  FileVideo,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { InlineAlert } from '../ui/InlineAlert';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { useAnalysisJob } from '../../hooks/useAnalysisJob';
import {
  formatFileSize,
  getFileExtension,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_MB,
} from '../../utils/validation';
import { TrafficAnalysisResults } from '../analytics/TrafficAnalysisResults';
import { SessionAnalysisRecord } from '../../api/types';

export interface AnalyzeVideoViewProps {
  onNavigateToOverview: () => void;
  sessionRecords?: SessionAnalysisRecord[];
  onRecordCompleted?: (record: SessionAnalysisRecord) => void;
  onSelectSessionRecord?: (record: SessionAnalysisRecord) => void;
}

export const AnalyzeVideoView: React.FC<AnalyzeVideoViewProps> = ({
  onNavigateToOverview,
  sessionRecords = [],
  onRecordCompleted,
  onSelectSessionRecord,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const recordedJobsRef = useRef<Set<string>>(new Set());

  const {
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
  } = useAnalysisJob();

  // Automatically record completed jobs into session state
  useEffect(() => {
    if (state === 'completed' && result && jobId && !recordedJobsRef.current.has(jobId)) {
      recordedJobsRef.current.add(jobId);
      if (onRecordCompleted) {
        onRecordCompleted({
          id: jobId,
          filename: selectedFile?.name || 'traffic-video.mp4',
          timestamp: Date.now(),
          result,
          status: 'COMPLETED',
          durationSeconds: result.duration_seconds,
        });
      }
    }
  }, [state, result, jobId, selectedFile, onRecordCompleted]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      selectFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === 'idle' || state === 'selected' || state === 'failed') {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (state === 'uploading' || state === 'processing') {
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  const handleBrowseClick = () => {
    if (state !== 'uploading' && state !== 'processing') {
      fileInputRef.current?.click();
    }
  };

  const isBusy = state === 'uploading' || state === 'processing';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload traffic video file"
      />

      {/* Completed State: Render Full Module 5 Analysis Results Dashboard */}
      {state === 'completed' && result ? (
        <TrafficAnalysisResults
          result={result}
          filename={selectedFile?.name}
          activeJobId={jobId ?? undefined}
          sessionRecords={sessionRecords}
          onSelectSessionRecord={onSelectSessionRecord}
          onAnalyzeAnother={reset}
        />
      ) : (
        <>
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border-subtle/60">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
                Analyze Traffic Video
              </h2>
              <p className="text-sm text-muted mt-1">
                Submit traffic footage for YOLOv8 object detection and ByteTrack multi-vehicle analysis.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={onNavigateToOverview}
                disabled={isBusy}
                title={isBusy ? 'Cannot navigate while analysis is active' : undefined}
              >
                Back to Overview
              </Button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Upload / Video Player / Analysis Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Error Alert Display */}
              {error && (
                <InlineAlert
                  variant="error"
                  title={error.title || 'Analysis Error'}
                  message={error.message}
                  onClose={dismissError}
                />
              )}

              {/* Workflow Stage 1: File Selection / Dropzone */}
              {state === 'idle' && (
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>Video Upload</CardTitle>
                      <CardDescription>
                        Select or drag and drop traffic camera footage ({ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ')} up to {MAX_FILE_SIZE_MB}MB)
                      </CardDescription>
                    </div>
                    <div className="p-2 rounded-[10px] bg-raised text-periwinkle border border-border-subtle">
                      <FileVideo className="w-5 h-5" />
                    </div>
                  </CardHeader>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleBrowseClick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleBrowseClick();
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="Drop traffic video here or click to browse files"
                    className={`border-2 border-dashed rounded-[16px] p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-periwinkle ${
                      isDragOver
                        ? 'border-periwinkle bg-periwinkle/10 scale-[1.01]'
                        : 'border-border-subtle/80 hover:border-periwinkle/50 bg-raised/30 hover:bg-raised/50'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-raised border border-border-subtle flex items-center justify-center text-periwinkle mb-4 shadow-inner">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-text mb-1">
                      Select or Drop Traffic Video
                    </h3>
                    <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto mb-6">
                      Supported formats: {ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ')}. Maximum file size: {MAX_FILE_SIZE_MB}MB.
                    </p>
                    <Button
                      variant="primary"
                      icon={<UploadCloud className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrowseClick();
                      }}
                    >
                      Choose File
                    </Button>
                  </div>
                </Card>
              )}

              {/* Workflow Stage 2, 3, 4: File Selected, Uploading, or Processing */}
              {(state === 'selected' ||
                state === 'uploading' ||
                state === 'processing' ||
                (state === 'failed' && selectedFile)) && (
                <Card className="space-y-6">
                  <CardHeader>
                    <div>
                      <CardTitle>Selected Footage</CardTitle>
                      <CardDescription>Review video details before running detection</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="periwinkle">
                        {selectedFile ? getFileExtension(selectedFile.name).toUpperCase() : 'VIDEO'}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* File Info Bar */}
                  {selectedFile && (
                    <div className="p-4 rounded-[12px] bg-raised/60 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-[10px] bg-surface text-periwinkle border border-border-subtle flex-shrink-0">
                          <FileVideo className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text text-sm truncate" title={selectedFile.name}>
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted">
                            Size: {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>

                      {!isBusy && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleBrowseClick}
                            disabled={isBusy}
                          >
                            Change File
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={reset}
                            disabled={isBusy}
                            aria-label="Remove selected file"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Local Video Preview */}
                  {previewUrl && (
                    <div className="rounded-[14px] overflow-hidden border border-border-subtle bg-navy flex items-center justify-center">
                      <video
                        src={previewUrl}
                        controls
                        playsInline
                        className="w-full max-h-[360px] object-contain bg-navy"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {/* Status Region (Aria-live accessible) */}
                  <div aria-live="polite" aria-atomic="true" className="space-y-4">
                    {/* Uploading State */}
                    {state === 'uploading' && (
                      <div className="p-5 rounded-[12px] bg-raised border border-periwinkle/30 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-text flex items-center gap-2">
                            <Spinner size="sm" />
                            Uploading video to analysis engine...
                          </span>
                          <span className="font-display font-bold text-periwinkle">
                            {uploadProgress}%
                          </span>
                        </div>

                        {/* Real Upload Progress Bar */}
                        <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border-subtle">
                          <div
                            className="h-full bg-gradient-to-r from-cobalt via-periwinkle to-sky transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button variant="outline" size="sm" onClick={cancel}>
                            Cancel Upload
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Processing State */}
                    {state === 'processing' && (
                      <div className="p-5 rounded-[12px] bg-raised border border-periwinkle/30 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Spinner size="sm" />
                            <span className="font-semibold text-text">
                              {jobStatus === 'QUEUED'
                                ? 'Queued in processing pipeline...'
                                : 'Analyzing video frames (YOLOv8 + ByteTrack)...'}
                            </span>
                          </div>
                          {processingProgress !== null ? (
                            <span className="font-display font-bold text-sky">
                              {processingProgress}%
                            </span>
                          ) : (
                            <Badge variant="periwinkle" size="sm">
                              {jobStatus || 'PROCESSING'}
                            </Badge>
                          )}
                        </div>

                        {/* Progress Bar (Determinate or Indeterminate) */}
                        <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border-subtle relative">
                          {processingProgress !== null ? (
                            <div
                              className="h-full bg-sky transition-all duration-300"
                              style={{ width: `${processingProgress}%` }}
                            />
                          ) : (
                            <div className="h-full bg-periwinkle/70 w-1/3 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
                          )}
                        </div>

                        {jobId && (
                          <p className="text-[11px] text-muted font-mono">
                            Job ID: {jobId}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Selected / Failed State */}
                  {(state === 'selected' || (state === 'failed' && selectedFile)) && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <p className="text-xs text-muted">
                        Ready to process. Server will execute YOLOv8 classification and tracking.
                      </p>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full sm:w-auto"
                          icon={<Sparkles className="w-4 h-4" />}
                          onClick={startAnalysis}
                          disabled={isBusy}
                        >
                          Analyze Traffic
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Right Column: Processing Pipeline Info */}
            <Card className="flex flex-col justify-between h-fit">
              <div>
                <CardHeader>
                  <div>
                    <CardTitle className="text-base sm:text-lg">Processing Pipeline</CardTitle>
                    <CardDescription>How video footage is analyzed</CardDescription>
                  </div>
                </CardHeader>

                <div className="space-y-4 mt-2">
                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cobalt text-white flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-text">Magic-Byte Validation</p>
                      <p className="text-muted text-[11px] mt-0.5">
                        Validates binary header format to ensure MP4, MOV, AVI, MKV, or WEBM container.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cobalt text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-text">Asynchronous Job Queue</p>
                      <p className="text-muted text-[11px] mt-0.5">
                        Bounded queue prevents system overload with backpressure handling.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cobalt text-white flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-text">YOLOv8 + ByteTrack</p>
                      <p className="text-muted text-[11px] mt-0.5">
                        Vehicle classification and unique trajectory tracking per frame.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-cobalt text-white flex items-center justify-center font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-text">Adaptive Signal Logic</p>
                      <p className="text-muted text-[11px] mt-0.5">
                        Generates signal timing recommendations based on real traffic density.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border-subtle/50 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <ShieldCheck className="w-4 h-4 text-status-low flex-shrink-0" />
                  <span>Bounded queue with 429 backpressure protection</span>
                </div>
                <div className="text-[11px] text-muted/80 leading-relaxed">
                  Files are processed in isolated temporary directories and automatically cleaned up.
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
