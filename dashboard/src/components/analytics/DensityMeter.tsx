import React from 'react';
import { Gauge, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Thresholds, DensityLevel } from '../../api/types';
import { StatusPill } from '../ui/StatusPill';

export interface DensityMeterProps {
  avgVehiclesPerFrame: number;
  thresholds: Thresholds;
  density: DensityLevel;
  className?: string;
}

export const DensityMeter: React.FC<DensityMeterProps> = ({
  avgVehiclesPerFrame,
  thresholds,
  density,
  className = '',
}) => {
  const { medium, high } = thresholds;

  // Compute maximum scale value dynamically (at least high * 1.5 or avg * 1.25)
  const maxScale = Math.max(Math.ceil(high * 1.5), Math.ceil(avgVehiclesPerFrame * 1.2), 20);

  // Segment widths as percentage of total scale
  const lowWidthPct = (medium / maxScale) * 100;
  const mediumWidthPct = ((high - medium) / maxScale) * 100;
  const highWidthPct = 100 - lowWidthPct - mediumWidthPct;

  // Marker position clamped between 0% and 100%
  const markerPositionPct = Math.min(100, Math.max(0, (avgVehiclesPerFrame / maxScale) * 100));

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2 text-sky mb-1">
              <Gauge className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Density Threshold Calibration
              </span>
            </div>
            <CardTitle>Dynamic Density Meter</CardTitle>
            <CardDescription>
              Mean vehicles per frame positioned against active API thresholds
            </CardDescription>
          </div>
          <StatusPill density={density} size="sm" />
        </CardHeader>

        {/* Current Metric Display */}
        <div className="mt-4 p-4 rounded-[12px] bg-raised/50 border border-border-subtle flex items-center justify-between">
          <div>
            <span className="text-xs text-muted block">Measured Density</span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-text">
              {avgVehiclesPerFrame.toFixed(2)}
            </span>
            <span className="text-xs text-muted ml-1.5">vehicles / frame</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted block">Active Classification</span>
            <span className="font-display text-base font-semibold text-text">
              {density} DENSITY
            </span>
          </div>
        </div>

        {/* Segmented Meter Bar with Indicator */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted">
            <span>0</span>
            <span>Medium cutoff: {medium}</span>
            <span>High cutoff: {high}</span>
            <span>Max: {maxScale}</span>
          </div>

          {/* Bar track */}
          <div className="relative h-4 rounded-full overflow-hidden flex bg-surface border border-border-subtle shadow-inner">
            {/* Low Zone */}
            <div
              style={{ width: `${lowWidthPct}%` }}
              className="h-full bg-status-low/70 border-r border-navy/40"
              title={`Low Density: < ${medium} veh/frame`}
            />
            {/* Medium Zone */}
            <div
              style={{ width: `${mediumWidthPct}%` }}
              className="h-full bg-status-medium/70 border-r border-navy/40"
              title={`Medium Density: ${medium} - ${high} veh/frame`}
            />
            {/* High Zone */}
            <div
              style={{ width: `${highWidthPct}%` }}
              className="h-full bg-status-high/70"
              title={`High Density: ≥ ${high} veh/frame`}
            />
          </div>

          {/* Marker Position Pointer */}
          <div className="relative w-full h-6">
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-out"
              style={{ left: `${markerPositionPct}%` }}
            >
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-text" />
              <span className="text-[10px] font-mono font-bold bg-raised px-1.5 py-0.5 rounded text-text border border-border-subtle mt-0.5 whitespace-nowrap shadow-md">
                {avgVehiclesPerFrame.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Legend / Explanation */}
      <div className="mt-6 pt-3 border-t border-border-subtle/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-periwinkle" />
          <span>API-calibrated thresholds:</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-low" /> &lt; {medium} (Low)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-medium" /> {medium}–{high} (Med)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-high" /> &ge; {high} (High)
          </span>
        </div>
      </div>
    </Card>
  );
};
