import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'periwinkle' | 'sky';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs sm:text-sm',
  }[size];

  const variantClasses = {
    default: 'bg-raised text-text border border-border-subtle',
    outline: 'bg-transparent text-muted border border-border-subtle',
    periwinkle: 'bg-periwinkle/15 text-periwinkle border border-periwinkle/30',
    sky: 'bg-sky/15 text-sky border border-sky/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
