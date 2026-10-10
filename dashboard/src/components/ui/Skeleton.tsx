import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-raised/80 animate-pulse rounded-[8px] ${className}`}
      aria-hidden="true"
    />
  );
};

export const SkeletonKPI: React.FC = () => {
  return (
    <div className="p-5 rounded-[16px] bg-surface border border-border-subtle flex flex-col justify-between space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-[10px]" />
      </div>
      <Skeleton className="h-3 w-36" />
    </div>
  );
};

export const SkeletonChart: React.FC<{ height?: string }> = ({ height = 'h-72' }) => {
  return (
    <div className={`p-6 rounded-[16px] bg-surface border border-border-subtle flex flex-col justify-between ${height}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-60" />
        </div>
        <Skeleton className="h-8 w-24 rounded-[8px]" />
      </div>
      <div className="flex-1 flex items-end gap-4 pt-4">
        <Skeleton className="h-2/3 flex-1 rounded-t-[6px]" />
        <Skeleton className="h-5/6 flex-1 rounded-t-[6px]" />
        <Skeleton className="h-1/2 flex-1 rounded-t-[6px]" />
        <Skeleton className="h-3/4 flex-1 rounded-t-[6px]" />
      </div>
    </div>
  );
};
