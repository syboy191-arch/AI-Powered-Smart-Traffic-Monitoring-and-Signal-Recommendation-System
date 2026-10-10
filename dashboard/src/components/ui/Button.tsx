import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-[10px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer select-none';

  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs',
    md: 'min-h-[44px] px-4 py-2 text-sm',
    lg: 'min-h-[48px] px-6 py-3 text-base',
  }[size];

  const variantClasses = {
    primary: 'bg-cobalt text-white hover:bg-cobalt/90 shadow-md shadow-cobalt/20',
    secondary: 'bg-raised text-text hover:bg-raised/80 border border-border-subtle',
    outline: 'bg-transparent text-periwinkle border border-periwinkle/40 hover:bg-periwinkle/10 hover:border-periwinkle',
    ghost: 'bg-transparent text-muted hover:text-text hover:bg-raised/50',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={size === 'lg' ? 'md' : 'sm'} /> : icon}
      {children}
    </button>
  );
};
