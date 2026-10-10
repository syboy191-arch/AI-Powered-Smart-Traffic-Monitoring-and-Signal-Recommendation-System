import React from 'react';
import { Card } from './Card';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card className={`text-center py-12 px-6 flex flex-col items-center justify-center ${className}`}>
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-raised/80 border border-border-subtle flex items-center justify-center text-periwinkle mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="font-display text-lg sm:text-xl font-semibold text-text mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-1">{action}</div>}
    </Card>
  );
};
