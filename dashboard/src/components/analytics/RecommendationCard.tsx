import React from 'react';
import { Lightbulb, Clock, ArrowRightCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { DensityLevel } from '../../api/types';

export interface RecommendationCardProps {
  recommendation: string;
  density: DensityLevel;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  density,
  className = '',
}) => {
  // Strategy helper for contextual timing guidance
  const getTimingStrategy = (lvl: DensityLevel) => {
    switch (lvl) {
      case 'HIGH':
        return {
          title: 'Extended Green Phase Prioritization',
          targetGreen: '~60s Green Phase',
          action: 'Maximize throughput on current bottleneck lane',
          activeLight: 'green',
        };
      case 'MEDIUM':
        return {
          title: 'Moderate Green Phase Extension',
          targetGreen: '~45s Green Phase',
          action: 'Adjust phase slightly to prevent queue buildup',
          activeLight: 'yellow',
        };
      case 'LOW':
      default:
        return {
          title: 'Standard Interval Cycle',
          targetGreen: '~30s Green Phase',
          action: 'Maintain standard balanced cycle times',
          activeLight: 'green',
        };
    }
  };

  const strategy = getTimingStrategy(density);

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2 text-sky mb-1">
              <Lightbulb className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Signal Automation
              </span>
            </div>
            <CardTitle>AI Recommendation</CardTitle>
            <CardDescription>
              Real-time adaptive timing recommendation based on active traffic load
            </CardDescription>
          </div>
          <StatusPill density={density} size="sm" />
        </CardHeader>

        {/* Highlighted Recommendation Box */}
        <div className="mt-4 p-5 rounded-[12px] bg-gradient-to-br from-raised to-surface border border-periwinkle/30 shadow-lg relative overflow-hidden">
          <div className="flex items-start gap-4">
            {/* Visual Traffic Light widget */}
            <div className="p-2 bg-navy/90 rounded-[10px] border border-border-subtle flex flex-col items-center gap-1.5 shadow-inner shrink-0">
              <span
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  density === 'HIGH'
                    ? 'bg-status-high shadow-[0_0_8px_#F87171]'
                    : 'bg-status-high/20'
                }`}
                title="Red / Stop phase indicator"
              />
              <span
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  density === 'MEDIUM'
                    ? 'bg-status-medium shadow-[0_0_8px_#FBBF24]'
                    : 'bg-status-medium/20'
                }`}
                title="Amber / Transition phase indicator"
              />
              <span
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  density === 'LOW' || density === 'HIGH'
                    ? 'bg-status-low shadow-[0_0_8px_#34D399]'
                    : 'bg-status-low/20'
                }`}
                title="Green / Go phase indicator"
              />
            </div>

            <div className="flex-1 space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-periwinkle">
                Recommended Action
              </span>
              <p className="text-base sm:text-lg font-medium text-text leading-snug">
                {recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Adaptive Timing Strategy Details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-[10px] bg-raised/40 border border-border-subtle flex items-center gap-3">
            <Clock className="w-4 h-4 text-sky shrink-0" />
            <div>
              <span className="text-[11px] text-muted block">Target Timing</span>
              <span className="text-xs font-semibold text-text">{strategy.targetGreen}</span>
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-raised/40 border border-border-subtle flex items-center gap-3">
            <ArrowRightCircle className="w-4 h-4 text-periwinkle shrink-0" />
            <div>
              <span className="text-[11px] text-muted block">Objective</span>
              <span className="text-xs font-semibold text-text truncate block">
                {strategy.action}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-3 border-t border-border-subtle/50 text-[11px] text-muted flex items-center justify-between">
        <span>Control Mode: Dynamic Actuation</span>
        <span className="font-mono text-periwinkle">Status: Advisory</span>
      </div>
    </Card>
  );
};
