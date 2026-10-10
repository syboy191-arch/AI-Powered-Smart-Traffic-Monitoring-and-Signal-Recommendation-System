import React from 'react';
import { History, Video, ArrowUpRight, BarChart2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { SessionAnalysisRecord } from '../../api/types';

export interface SessionComparisonProps {
  records: SessionAnalysisRecord[];
  activeId?: string;
  onSelectRecord?: (record: SessionAnalysisRecord) => void;
  className?: string;
}

export const SessionComparison: React.FC<SessionComparisonProps> = ({
  records,
  activeId,
  onSelectRecord,
  className = '',
}) => {
  if (!records || records.length === 0) {
    return null;
  }

  // Prepare data for the session comparison bar chart
  const chartData = records.map((rec, index) => {
    const avg = rec.result.avg_vehicles_per_frame ?? 0;
    const peak = rec.result.peak_vehicles_in_frame ?? 0;
    const label = rec.filename.length > 15 ? `${rec.filename.slice(0, 12)}...` : rec.filename;

    return {
      id: rec.id,
      name: `#${index + 1} ${label}`,
      fullName: rec.filename,
      avgVehicles: Number(avg.toFixed(2)),
      peakVehicles: peak,
      density: rec.result.density,
      isActive: rec.id === activeId,
    };
  });

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2 text-sky mb-1">
              <History className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                This Session Comparison
              </span>
            </div>
            <CardTitle>Session Run History ({records.length} Analyzed)</CardTitle>
            <CardDescription>
              In-memory comparison across all video analyses executed in this browser session
            </CardDescription>
          </div>
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-raised text-muted border border-border-subtle">
            Session Memory Only
          </span>
        </CardHeader>

        {/* Comparative Chart if multiple runs exist */}
        {records.length > 1 && (
          <div className="mt-4 p-4 rounded-[12px] bg-raised/30 border border-border-subtle">
            <div className="flex items-center justify-between mb-3 text-xs font-medium text-text">
              <span className="flex items-center gap-1.5 text-sky">
                <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
                Measured Density Comparison (avg vehicles / frame)
              </span>
              <span className="text-[10px] text-muted">Higher = more congestion</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#9FB6E6" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9FB6E6" fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-raised/95 backdrop-blur border border-border-subtle rounded-[10px] shadow-xl text-xs space-y-1 z-50">
                            <div className="font-semibold text-text">{data.fullName}</div>
                            <div className="text-sky font-mono font-bold">
                              {data.avgVehicles} avg veh/frame
                            </div>
                            <div className="text-muted text-[10px]">
                              Peak: {data.peakVehicles} veh | Density: {data.density}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgVehicles" radius={[6, 6, 0, 0]} animationDuration={600}>
                    {chartData.map((entry) => (
                      <Cell
                        key={`bar-${entry.id}`}
                        fill={entry.isActive ? '#ABD2FA' : '#3A4FE6'}
                        stroke={entry.isActive ? '#EAF2FF' : 'transparent'}
                        strokeWidth={entry.isActive ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Records Table / List */}
        <div className="mt-4 space-y-2">
          {records.map((rec, idx) => {
            const isActive = rec.id === activeId;
            const timeFormatted = new Date(rec.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={rec.id}
                onClick={() => onSelectRecord && onSelectRecord(rec)}
                onKeyDown={(e) => {
                  if (onSelectRecord && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelectRecord(rec);
                  }
                }}
                className={`p-3.5 rounded-[12px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle ${
                  isActive
                    ? 'bg-raised/90 border-sky/50 shadow-md ring-1 ring-sky/30'
                    : 'bg-surface hover:bg-raised/40 border-border-subtle cursor-pointer'
                }`}
                role={onSelectRecord ? 'button' : undefined}
                tabIndex={onSelectRecord ? 0 : undefined}
                aria-label={onSelectRecord ? `Select analysis run #${idx + 1}: ${rec.filename}` : undefined}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-cobalt text-white' : 'bg-raised text-muted'
                    }`}
                    aria-hidden="true"
                  >
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text truncate max-w-[200px] sm:max-w-[260px]">
                        {rec.filename}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky/20 text-sky border border-sky/30">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted">
                      Run #{idx + 1} • {timeFormatted}
                      {rec.result.duration_seconds
                        ? ` • ${rec.result.duration_seconds.toFixed(1)}s`
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-muted block">Measured Avg</span>
                    <span className="font-display text-sm font-bold text-text">
                      {rec.result.avg_vehicles_per_frame !== undefined
                        ? rec.result.avg_vehicles_per_frame.toFixed(2)
                        : `${rec.result.cars + rec.result.motorcycles + rec.result.buses + rec.result.trucks} det`}
                    </span>
                  </div>

                  <StatusPill density={rec.result.density} size="sm" />

                  {onSelectRecord && !isActive && (
                    <ArrowUpRight className="w-4 h-4 text-muted hover:text-sky" aria-hidden="true" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border-subtle/50 text-[11px] text-muted flex items-center justify-between">
        <span>Session Storage: Non-persistent memory</span>
        <span>Clears on page refresh</span>
      </div>
    </Card>
  );
};

export default SessionComparison;
