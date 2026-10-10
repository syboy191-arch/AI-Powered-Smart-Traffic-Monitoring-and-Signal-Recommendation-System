import React from 'react';
import {
  Activity,
  Maximize2,
  Car,
  FileVideo,
  CheckCircle2,
  Layers,
  Sparkles,
  Timer,
} from 'lucide-react';
import { TrafficResult } from '../../api/types';
import { StatCard } from '../ui/StatCard';
import { StatusPill } from '../ui/StatusPill';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export interface KPISectionProps {
  result: TrafficResult;
  filename?: string;
  className?: string;
}

export const KPISection: React.FC<KPISectionProps> = ({
  result,
  filename,
  className = '',
}) => {
  const hasAvg = result.avg_vehicles_per_frame !== undefined;
  const hasPeak = result.peak_vehicles_in_frame !== undefined;
  const hasUnique = Boolean(result.unique_vehicles && result.unique_vehicles.total > 0);
  const totalDetections = result.cars + result.motorcycles + result.buses + result.trucks;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Average Vehicles Per Frame */}
        {hasAvg && (
          <StatCard
            title="Avg Vehicles / Frame"
            value={
              <AnimatedNumber
                value={result.avg_vehicles_per_frame!}
                decimals={2}
                duration={1.2}
              />
            }
            subtitle="Mean per-frame vehicle density"
            icon={<Activity className="w-5 h-5 text-sky" />}
          />
        )}

        {/* 2. Peak Vehicles in a Single Frame */}
        {hasPeak && (
          <StatCard
            title="Peak Vehicles in Frame"
            value={
              <AnimatedNumber
                value={result.peak_vehicles_in_frame!}
                decimals={0}
                duration={1.0}
              />
            }
            subtitle="Highest observed frame concentration"
            icon={<Maximize2 className="w-5 h-5 text-periwinkle" />}
          />
        )}

        {/* 3. Estimated Unique Vehicles (ByteTrack tracked) */}
        {hasUnique && (
          <StatCard
            title="Estimated Unique Vehicles"
            value={
              <AnimatedNumber
                value={result.unique_vehicles!.total}
                decimals={0}
                duration={1.2}
              />
            }
            subtitle={
              <span>
                {result.unique_vehicles!.cars} cars • {result.unique_vehicles!.motorcycles} moto •{' '}
                {result.unique_vehicles!.buses} bus • {result.unique_vehicles!.trucks} truck
              </span>
            }
            icon={<Car className="w-5 h-5 text-sky" />}
          />
        )}

        {/* 4. Cumulative Detection Events */}
        <StatCard
          title="Cumulative Detections"
          value={
            <AnimatedNumber
              value={totalDetections}
              decimals={0}
              duration={1.0}
            />
          }
          subtitle="Sum of bounding box events across frames"
          icon={<Layers className="w-5 h-5 text-muted" />}
        />
      </div>

      {/* Secondary Context & Meta Row: Density, Recommendation, Video & Processing Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Traffic Density & Classification */}
        <div className="p-4 rounded-[16px] bg-surface border border-border-subtle flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider block">
              Density Level
            </span>
            <div className="flex items-center gap-2">
              <StatusPill density={result.density} size="md" />
            </div>
            <span className="text-[11px] text-muted block">
              Calibrated against runtime thresholds
            </span>
          </div>
          <div className="p-3 rounded-[12px] bg-raised/60 border border-border-subtle text-periwinkle">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Video File & Telemetry Status */}
        <div className="p-4 rounded-[16px] bg-surface border border-border-subtle flex items-center justify-between">
          <div className="space-y-1 overflow-hidden">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider block">
              Video Source
            </span>
            <div className="font-medium text-sm text-text truncate max-w-[200px]" title={filename}>
              {filename || 'Uploaded Source'}
            </div>
            <div className="text-[11px] text-muted flex items-center gap-2">
              {result.duration_seconds !== undefined && (
                <span>{result.duration_seconds.toFixed(1)}s</span>
              )}
              {result.frames_processed !== undefined && (
                <span>• {result.frames_processed} frames</span>
              )}
              {result.fps !== undefined && <span>• {result.fps.toFixed(1)} FPS</span>}
            </div>
          </div>
          <div className="p-3 rounded-[12px] bg-raised/60 border border-border-subtle text-sky shrink-0">
            <FileVideo className="w-5 h-5" />
          </div>
        </div>

        {/* Execution & Processing Status */}
        <div className="p-4 rounded-[16px] bg-surface border border-border-subtle flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <span className="text-xs text-muted uppercase font-semibold tracking-wider block">
              Processing Status
            </span>
            <div className="flex items-center gap-2 text-status-low font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Analysis Complete (100%)</span>
            </div>
            <span className="text-[11px] text-muted block">
              Inference pipeline successfully finished
            </span>
          </div>
          <div className="p-3 rounded-[12px] bg-raised/60 border border-border-subtle text-status-low shrink-0">
            <Timer className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
