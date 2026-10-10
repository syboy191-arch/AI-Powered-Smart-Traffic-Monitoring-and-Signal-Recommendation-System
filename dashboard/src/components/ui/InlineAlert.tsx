import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface InlineAlertProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const configs = {
    info: {
      bg: 'bg-surface border-periwinkle/30 text-text',
      iconColor: 'text-periwinkle',
      icon: <Info className="w-5 h-5 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-surface border-status-medium/40 text-text',
      iconColor: 'text-status-medium',
      icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
    },
    error: {
      bg: 'bg-surface border-status-high/40 text-text',
      iconColor: 'text-status-high',
      icon: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    },
    success: {
      bg: 'bg-surface border-status-low/40 text-text',
      iconColor: 'text-status-low',
      icon: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />,
    },
  }[variant];

  return (
    <div
      className={`rounded-[12px] p-4 border flex items-start gap-3 text-sm ${configs.bg} ${className}`}
      role="alert"
    >
      <div className={configs.iconColor}>{configs.icon}</div>
      <div className="flex-1 space-y-0.5">
        {title && <h4 className="font-semibold font-display text-text">{title}</h4>}
        <p className="text-muted leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-muted hover:text-text p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-periwinkle"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
