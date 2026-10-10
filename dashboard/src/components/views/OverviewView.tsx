import React from 'react';
import {
  Car,
  Bike,
  Bus,
  Truck,
  BarChart3,
  Lightbulb,
  UploadCloud,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { StatusPill } from '../ui/StatusPill';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { TrafficAnalysisResults } from '../analytics/TrafficAnalysisResults';
import { SessionAnalysisRecord } from '../../api/types';

export interface OverviewViewProps {
  onNavigateToAnalyze: () => void;
  sessionRecords?: SessionAnalysisRecord[];
  activeRecord?: SessionAnalysisRecord | null;
  onSelectSessionRecord?: (record: SessionAnalysisRecord) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigateToAnalyze,
  sessionRecords = [],
  activeRecord,
  onSelectSessionRecord,
}) => {
  // If we have active analysis in this browser session, show the full live telemetry dashboard
  const currentRecord = activeRecord || (sessionRecords.length > 0 ? sessionRecords[sessionRecords.length - 1] : null);

  if (currentRecord && currentRecord.result) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        <TrafficAnalysisResults
          result={currentRecord.result}
          filename={currentRecord.filename}
          activeJobId={currentRecord.id}
          sessionRecords={sessionRecords}
          onSelectSessionRecord={onSelectSessionRecord}
          onAnalyzeAnother={onNavigateToAnalyze}
        />
      </div>
    );
  }

  // Otherwise, render initial clean empty states (Module 3 requirement)
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border-subtle/60">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Traffic Overview
          </h2>
          <p className="text-sm text-muted mt-1">
            Real-time vehicle counts, density classification, and adaptive signal timing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            icon={<UploadCloud className="w-4 h-4" />}
            onClick={onNavigateToAnalyze}
          >
            Analyze Video
          </Button>
        </div>
      </div>

      {/* Density & System Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card variant="raised" className="md:col-span-2 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                Current Traffic Density
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-text mt-1">
                Awaiting Video Stream
              </h3>
              <p className="text-sm text-muted mt-1.5 max-w-xl leading-relaxed">
                Density is calculated using ByteTrack unique vehicle tracking and per-frame volume thresholds.
              </p>
            </div>
            <StatusPill density={null} size="lg" />
          </div>

          <div className="mt-6 pt-4 border-t border-border-subtle/60 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-low" /> Low (&lt; 5 veh/frame)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-medium" /> Medium (5 - 12 veh/frame)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-high" /> High (&ge; 12 veh/frame)
            </span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-periwinkle mb-2">
              <Gauge className="w-5 h-5" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Frame Analytics
              </p>
            </div>
            <h4 className="font-display text-lg font-bold text-text">
              Telemetry Status
            </h4>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              No processing metrics available. Video FPS, duration, and peak vehicle volumes will appear here after analysis.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle/40 grid grid-cols-2 gap-2 text-xs text-muted">
            <div>
              <span className="block text-[10px] uppercase">Processed FPS</span>
              <span className="font-display font-semibold text-text">—</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase">Peak In Frame</span>
              <span className="font-display font-semibold text-text">—</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 4 Vehicle Count Cards (Legacy Feature 1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base sm:text-lg font-semibold text-text">
            Vehicle Class Breakdown
          </h3>
          <span className="text-xs text-muted">Awaiting stream</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard
            title="Cars"
            value={null}
            icon={<Car className="w-5 h-5" />}
            subtitle="Passenger cars & sedans"
          />
          <StatCard
            title="Motorcycles"
            value={null}
            icon={<Bike className="w-5 h-5" />}
            subtitle="Two-wheelers & scooters"
          />
          <StatCard
            title="Buses"
            value={null}
            icon={<Bus className="w-5 h-5" />}
            subtitle="Public & transit buses"
          />
          <StatCard
            title="Trucks"
            value={null}
            icon={<Truck className="w-5 h-5" />}
            subtitle="Commercial & freight vehicles"
          />
        </div>
      </div>

      {/* Chart & AI Recommendation Grid (Legacy Features 2 & 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Distribution Bar Chart (Legacy Feature 2) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Vehicle Distribution</CardTitle>
              <CardDescription>
                Visual comparison of detected vehicle classes across the video
              </CardDescription>
            </div>
            <div className="p-2 rounded-[10px] bg-raised text-periwinkle border border-border-subtle">
              <BarChart3 className="w-5 h-5" />
            </div>
          </CardHeader>

          <EmptyState
            icon={<BarChart3 className="w-8 h-8" />}
            title="No Distribution Data"
            description="Upload a traffic video file (.mp4, .avi, .mov) to generate vehicle class comparisons and trajectory counts."
            action={
              <Button
                variant="outline"
                size="sm"
                icon={<UploadCloud className="w-4 h-4" />}
                onClick={onNavigateToAnalyze}
              >
                Upload Video
              </Button>
            }
            className="py-10 border-0 bg-transparent"
          />
        </Card>

        {/* AI Signal Recommendation Box (Legacy Feature 4) */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky" />
                  <span>AI Signal Recommendation</span>
                </CardTitle>
                <CardDescription>
                  Adaptive signal timing advisory
                </CardDescription>
              </div>
            </CardHeader>

            <div className="mt-4 p-5 rounded-[12px] bg-raised/70 border border-border-subtle flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-muted mb-3">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h4 className="font-display font-semibold text-text text-sm">
                No Active Recommendation
              </h4>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Once video analysis completes, the recommendation engine calculates optimal green-light durations based on computed traffic density.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-subtle/50 text-[11px] text-muted space-y-1">
            <p className="font-semibold text-text">Recommendation Rules:</p>
            <p>• High Density &rarr; Increase signal duration</p>
            <p>• Medium Density &rarr; Normal traffic flow</p>
            <p>• Low Density &rarr; Reduce signal waiting time</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
