import React from 'react';
import { NavLink } from 'react-router-dom';
import { SIDEBAR_NAVIGATION } from '@/constants';
import { Badge } from '@/components/common/Badge';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/utils';

export interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-20 h-[calc(100vh-4rem)] w-64 bg-slate-950/95 backdrop-blur-lg border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static',
        !isOpen && '-translate-x-full'
      )}
    >
      <div className="p-3 overflow-y-auto space-y-1 my-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-500">
          Command & Navigation
        </div>
        {SIDEBAR_NAVIGATION.map((item) => {
          // Dynamically map icon name
          const IconComponent = ((LucideIcons as unknown) as Record<string, React.ComponentType<{ className?: string }>>)[item.iconName] || LucideIcons.HelpCircle;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 font-sans',
                  isActive
                    ? 'bg-gradient-to-r from-primary/20 to-transparent text-white font-bold border-l-4 border-primary shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )
              }
            >
              <div className="flex items-center gap-3">
                <IconComponent className="w-4 h-4 shrink-0 opacity-90" />
                <span className="tracking-wide">{item.label}</span>
              </div>
              {item.badge && (
                <Badge
                  variant={item.badgeColor || 'primary'}
                  size="sm"
                  className="font-mono text-[10px] py-0.5 px-1.5 shadow-none"
                >
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer system status indicator */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 m-3 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold font-mono text-slate-300 uppercase">Core Platform Status</span>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_#22C55E]" />
        </div>
        <p className="text-[10px] text-slate-500 font-mono">
          Sprint 0 Foundation Online<br />
          v0.1.0-sprint.0 (Decoupled)
        </p>
      </div>
    </aside>
  );
};
