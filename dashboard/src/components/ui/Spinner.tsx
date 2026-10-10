import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  label = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-label={label}>
      <div
        className={`${sizeClasses} rounded-full border-border-subtle border-t-periwinkle animate-spin`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};
