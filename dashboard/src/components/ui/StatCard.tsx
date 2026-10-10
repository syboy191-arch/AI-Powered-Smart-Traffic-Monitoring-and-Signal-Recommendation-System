import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  subtitle?: React.ReactNode;
  trend?: string;
  loading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  loading = false,
  className = '',
}) => {
  const displayValue = value !== null && value !== undefined ? value : '—';

  return (
    <Card className={`relative overflow-hidden group hover:border-periwinkle/30 transition-all ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted tracking-wide">{title}</p>
          <div className="flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-16 bg-raised animate-pulse rounded-md" />
            ) : (
              <span className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-text tracking-tight">
                {displayValue}
              </span>
            )}
            {trend && <span className="text-xs text-muted">{trend}</span>}
          </div>
        </div>
        <div className="p-2.5 sm:p-3 rounded-[12px] bg-raised text-periwinkle border border-border-subtle group-hover:text-sky transition-colors">
          {icon}
        </div>
      </div>
      {subtitle && <p className="mt-3 text-xs text-muted/80">{subtitle}</p>}
    </Card>
  );
};
