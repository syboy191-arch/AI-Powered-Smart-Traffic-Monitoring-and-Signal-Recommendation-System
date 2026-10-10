import React from 'react';
import { DensityLevel } from '../../api/types';

export interface StatusPillProps {
  density?: DensityLevel | string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  density,
  className = '',
  size = 'md',
}) => {
  if (!density) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium text-xs sm:text-sm bg-raised/50 text-muted border border-border-subtle ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-muted/40" aria-hidden="true" />
        No Data
      </span>
    );
  }

  const normalized = density.toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs sm:text-sm',
    lg: 'px-4 py-1.5 text-sm sm:text-base',
  }[size];

  let config = {
    bg: 'bg-status-low/15 border-status-low/40',
    text: 'text-status-low',
    dot: 'bg-status-low',
    label: 'Low Density',
  };

  if (normalized === 'MEDIUM') {
    config = {
      bg: 'bg-status-medium/15 border-status-medium/40',
      text: 'text-status-medium',
      dot: 'bg-status-medium',
      label: 'Medium Density',
    };
  } else if (normalized === 'HIGH') {
    config = {
      bg: 'bg-status-high/15 border-status-high/40',
      text: 'text-status-high',
      dot: 'bg-status-high',
      label: 'High Density',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold border ${config.bg} ${config.text} ${sizeClasses} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
