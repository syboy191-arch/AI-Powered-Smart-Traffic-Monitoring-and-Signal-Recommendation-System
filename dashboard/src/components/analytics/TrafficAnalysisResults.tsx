import React, { Suspense, lazy } from 'react';
import { RefreshCw, Video } from 'lucide-react';
import { TrafficResult, SessionAnalysisRecord } from '../../api/types';
import { apiClient } from '../../api/client';
import { KPISection } from './KPISection';
import { DensityMeter } from './DensityMeter';
import { RecommendationCard } from './RecommendationCard';
import { SkeletonChart } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Badge } from '../ui/Badge';

// Lazy-load Recharts heavy visual components for bundle performance & code-splitting
const ClassBreakdownChart = lazy(() => import('./ClassBreakdownChart'));
const SessionComparison = lazy(() => import('./SessionComparison'));

export interface TrafficAnalysisResultsProps {
  result: TrafficResult;
  filename?: string;
  activeJobId?: string;
  sessionRecords?: SessionAnalysisRecord[];
  onSelectSessionRecord?: (record: SessionAnalysisRecord) => void;
  onAnalyzeAnother?: () => void;
  className?: string;
}

export const TrafficAnalysisResults: React.FC<TrafficAnalysisResultsProps> = ({
  result,
  filename,
  activeJobId,
  sessionRecords = [],
  onSelectSessionRecord,
  onAnalyzeAnother,
  className = '',
}) => {
  const hasThresholds = Boolean(
    result.thresholds &&
      typeof result.thresholds.medium === 'number' &&
      typeof result.thresholds.high === 'number'
  );
  const avgVehicles = result.avg_vehicles_per_frame ?? 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar with contextual action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-text flex items-center gap-2">
            <Video className="w-6 h-6 text-sky" />
            Analysis Results
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Detailed computer vision telemetry &amp; dynamic signal actuation plan
          </p>
        </div>

        {onAnalyzeAnother && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAnalyzeAnother}
            className="self-start sm:self-auto gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Analyze Another Video
          </Button>
        )}
      </div>

      {/* 1. KPI Row */}
      <KPISection result={result} filename={filename} />

      {/* 2. Annotated Video Player (Module 5B) */}
      {result.annotated_video && activeJobId ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-sky" />
                <span>Annotated Video Playback</span>
              </CardTitle>
              <CardDescription>
                Visual telemetry overlay with vehicle bounding boxes and ByteTrack trajectories
              </CardDescription>
            </div>
            <Badge variant="periwinkle" size="sm">
              H.264 / Byte-Range Stream
            </Badge>
          </CardHeader>
          <div className="rounded-[14px] overflow-hidden border border-border-subtle bg-navy flex items-center justify-center mt-2">
            <video
              src={apiClient.getVideoUrl(activeJobId)}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[420px] object-contain bg-navy"
            >
              Your browser does not support HTML5 video playback.
            </video>
          </div>
        </Card>
      ) : result.annotated_video === null ? (
        <div className="p-3 rounded-[10px] bg-raised/40 border border-border-subtle/60 text-xs text-muted flex items-center gap-2">
          <Video className="w-4 h-4 text-muted flex-shrink-0" />
          <span>Annotated video playback unavailable (transcoding was skipped during analysis).</span>
        </div>
      ) : null}

      {/* 3. Primary Charts & Diagnostics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Breakdown Chart (Lazy-Loaded with Suspense Fallback) */}
        <Suspense fallback={<SkeletonChart height="h-96" />}>
          <ClassBreakdownChart result={result} />
        </Suspense>

        {/* Dynamic Density Meter (using API-calibrated thresholds) */}
        {hasThresholds ? (
          <DensityMeter
            avgVehiclesPerFrame={avgVehicles}
            thresholds={result.thresholds!}
            density={result.density}
          />
        ) : (
          <RecommendationCard
            recommendation={result.recommendation}
            density={result.density}
          />
        )}
      </div>

      {/* 3. Secondary Row: Recommendation Card (if density meter took the slot above) */}
      {hasThresholds && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecommendationCard
            recommendation={result.recommendation}
            density={result.density}
          />

          {/* Session Comparison if records exist */}
          {sessionRecords.length > 0 && (
            <Suspense fallback={<SkeletonChart height="h-80" />}>
              <SessionComparison
                records={sessionRecords}
                activeId={activeJobId}
                onSelectRecord={onSelectSessionRecord}
              />
            </Suspense>
          )}
        </div>
      )}

      {/* If no thresholds, display session comparison in full/half row if present */}
      {!hasThresholds && sessionRecords.length > 0 && (
        <Suspense fallback={<SkeletonChart height="h-80" />}>
          <SessionComparison
            records={sessionRecords}
            activeId={activeJobId}
            onSelectRecord={onSelectSessionRecord}
          />
        </Suspense>
      )}
    </div>
  );
};

export default TrafficAnalysisResults;
