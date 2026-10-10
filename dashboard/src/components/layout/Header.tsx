import React from 'react';
import { Activity, Menu, X, Cpu } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface HeaderProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-navy/95 backdrop-blur border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[10px] bg-raised text-text border border-border-subtle hover:bg-raised/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-cobalt flex items-center justify-center text-white shadow-md shadow-cobalt/30" aria-hidden="true">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base sm:text-lg font-bold text-text leading-tight tracking-tight">
              SmartTraffic <span className="text-periwinkle">AI</span>
            </h1>
            <p className="hidden sm:block text-[11px] text-muted leading-none font-medium">
              Traffic Monitoring & Signal Recommendation
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-raised/60 border border-border-subtle text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-status-low" aria-hidden="true" />
          <span>System Online</span>
        </div>
        <Badge variant="periwinkle" size="sm" className="hidden xs:inline-flex">
          <Activity className="w-3 h-3" aria-hidden="true" />
          <span>YOLOv8 + ByteTrack</span>
        </Badge>
      </div>
    </header>
  );
};
