import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { TrafficResult } from '../../api/types';

export interface ClassBreakdownChartProps {
  result: TrafficResult;
  className?: string;
}

type MetricMode = 'detections' | 'unique';
type ChartType = 'donut' | 'bar';

interface ClassDataPoint {
  name: string;
  key: string;
  count: number;
  percentage: number;
  color: string;
}

const CLASS_COLORS: Record<string, string> = {
  cars: '#3A4FE6', // Cobalt tint for dark contrast
  motorcycles: '#7692FF', // Periwinkle
  buses: '#ABD2FA', // Sky
  trucks: '#9FB6E6', // Neutral
};

const CLASS_LABELS: Record<string, string> = {
  cars: 'Cars',
  motorcycles: 'Motorcycles',
  buses: 'Buses',
  trucks: 'Trucks',
};

// Custom tooltip styling matching the dark theme
const CustomTooltip = ({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ payload: ClassDataPoint }>;
  mode: MetricMode;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const unitLabel = mode === 'unique' ? 'estimated unique vehicles' : 'cumulative detections';

    return (
      <div className="p-3 bg-raised/95 backdrop-blur border border-border-subtle rounded-[10px] shadow-xl text-xs space-y-1 z-50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-semibold text-text">{data.name}</span>
        </div>
        <div className="text-text font-display font-bold text-sm">
          {data.count.toLocaleString()}{' '}
          <span className="text-xs font-normal text-muted">({data.percentage.toFixed(1)}%)</span>
        </div>
        <div className="text-[10px] text-muted capitalize">{unitLabel}</div>
      </div>
    );
  }
  return null;
};

export const ClassBreakdownChart: React.FC<ClassBreakdownChartProps> = ({
  result,
  className = '',
}) => {
  const hasUnique = Boolean(result.unique_vehicles && result.unique_vehicles.total > 0);
  const [metricMode, setMetricMode] = useState<MetricMode>('detections');
  const [chartType, setChartType] = useState<ChartType>('donut');

  // Compute data based on selected mode
  const currentSource: Record<string, number> =
    metricMode === 'unique' && result.unique_vehicles
      ? {
          cars: result.unique_vehicles.cars,
          motorcycles: result.unique_vehicles.motorcycles,
          buses: result.unique_vehicles.buses,
          trucks: result.unique_vehicles.trucks,
        }
      : {
          cars: result.cars,
          motorcycles: result.motorcycles,
          buses: result.buses,
          trucks: result.trucks,
        };

  const totalCount = Object.values(currentSource).reduce((sum, val) => sum + (val || 0), 0);

  const data: ClassDataPoint[] = Object.entries(currentSource).map(([key, count]) => {
    const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return {
      name: CLASS_LABELS[key] || key,
      key,
      count: count || 0,
      percentage: pct,
      color: CLASS_COLORS[key] || '#9FB6E6',
    };
  });

  const cardTitle = metricMode === 'unique' ? 'Estimated Unique Vehicles by Class' : 'Detections by Class';

  return (
    <Card className={`flex flex-col justify-between ${className}`}>
      <div>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2 text-sky mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Class Distribution
              </span>
            </div>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>
              {metricMode === 'unique'
                ? 'ByteTrack tracked unique vehicle counts and proportional composition'
                : 'Cumulative frame-by-frame detection events across all processed video frames'}
            </CardDescription>
          </div>

          {/* Controls: Metric Toggle & Chart Type */}
          <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
            {hasUnique && (
              <div className="p-0.5 bg-surface rounded-[10px] border border-border-subtle flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setMetricMode('detections')}
                  className={`px-2.5 py-1 rounded-[8px] font-medium transition-all ${
                    metricMode === 'detections'
                      ? 'bg-cobalt text-white shadow-sm'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Detections
                </button>
                <button
                  type="button"
                  onClick={() => setMetricMode('unique')}
                  className={`px-2.5 py-1 rounded-[8px] font-medium transition-all ${
                    metricMode === 'unique'
                      ? 'bg-cobalt text-white shadow-sm'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Estimated Unique
                </button>
              </div>
            )}

            <div className="p-0.5 bg-surface rounded-[10px] border border-border-subtle flex items-center text-xs">
              <button
                type="button"
                onClick={() => setChartType('donut')}
                className={`p-1.5 rounded-[8px] transition-all ${
                  chartType === 'donut'
                    ? 'bg-raised text-sky shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
                title="Donut view"
                aria-label="Donut chart view"
              >
                <PieIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-[8px] transition-all ${
                  chartType === 'bar'
                    ? 'bg-raised text-sky shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
                title="Bar chart view"
                aria-label="Bar chart view"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Chart Viewport */}
        <div className="mt-4 h-64 w-full">
          {totalCount === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted">
              No detections recorded in this session.
            </div>
          ) : chartType === 'donut' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="count"
                  animationDuration={800}
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.key}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip mode={metricMode} />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <XAxis type="number" stroke="#9FB6E6" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#9FB6E6"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip mode={metricMode} />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={800}>
                  {data.map((entry) => (
                    <Cell key={`bar-${entry.key}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend / Metrics List */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {data.map((item) => (
            <div
              key={item.key}
              className="p-2.5 rounded-[10px] bg-raised/40 border border-border-subtle flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-text truncate">{item.name}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-display text-base font-bold text-text">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-[11px] text-muted">{item.percentage.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-border-subtle/50 text-[11px] text-muted flex items-center justify-between">
        <span>
          Total {metricMode === 'unique' ? 'Estimated Unique Vehicles' : 'Cumulative Detections'}:
        </span>
        <span className="font-mono font-bold text-text">{totalCount.toLocaleString()}</span>
      </div>
    </Card>
  );
};

export default ClassBreakdownChart;
