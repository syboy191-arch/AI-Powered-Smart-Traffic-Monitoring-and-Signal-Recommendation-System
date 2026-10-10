import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const bgClasses = {
    default: 'bg-surface border border-border-subtle',
    raised: 'bg-raised border border-border-subtle shadow-lg shadow-navy/50',
    flat: 'bg-surface/50 border border-border-subtle/50',
  }[variant];

  return (
    <div
      className={`rounded-[16px] p-5 sm:p-6 text-text transition-all ${bgClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex items-center justify-between gap-4 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`font-display text-lg sm:text-xl font-semibold text-text ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-sm text-muted ${className}`} {...props}>
    {children}
  </p>
);
