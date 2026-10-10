import React from 'react';
import { LayoutDashboard, Video, ShieldCheck } from 'lucide-react';

export type NavTab = 'overview' | 'analyze';

export interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" aria-hidden="true" />,
      description: 'Traffic metrics & signal recommendation',
    },
    {
      id: 'analyze' as NavTab,
      label: 'Analyze Video',
      icon: <Video className="w-5 h-5" aria-hidden="true" />,
      description: 'Upload & process traffic footage',
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40 w-64 bg-surface border-r border-border-subtle p-4 flex flex-col justify-between
          transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:w-60 lg:w-64 md:h-[calc(100vh-4rem)]
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-muted tracking-wider uppercase">
              Navigation
            </p>
            <nav className="space-y-1.5" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                    className={`
                      w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-sm font-medium transition-all text-left cursor-pointer
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-periwinkle
                      ${
                        isActive
                          ? 'bg-cobalt text-white shadow-md shadow-cobalt/20 font-semibold'
                          : 'text-muted hover:text-text hover:bg-raised/60'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-white' : 'text-periwinkle'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-border-subtle">
          <div className="p-3 rounded-[12px] bg-raised/50 border border-border-subtle/50 text-xs text-muted flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-periwinkle flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-text">Spring Boot + YOLO</p>
              <p className="text-[11px] text-muted">Backend connected</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
