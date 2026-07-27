import React, { useState } from 'react';
import { useAuth, useNotification } from '@/contexts';
import { Avatar, Badge } from '@/components/common';
import { UserRole } from '@/types';
import {
  Shield,
  Search,
  Bell,
  CheckCircle2,
  Menu,
  ChevronDown,
  LogOut,
  UserCheck,
  Radio,
  Sliders
} from 'lucide-react';
import { cn } from '@/utils';

export interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, currentRole, switchRole, logout } = useAuth();
  const { notifications, clearAll } = useNotification();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const availableRoles: UserRole[] = ['Administrator', 'Researcher', 'Viewer'];

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left section: Hamburger & Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors focus:outline-none"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
              TrustChain-5G <span className="text-primary text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30">5G ADVANCED</span>
            </span>
          </div>
        </div>
      </div>

      {/* Middle section: Enterprise Search bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search network nodes, threat alerts, or blockchain seals... (Press Ctrl+K)"
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all font-sans"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            Ctrl+K
          </span>
        </div>
      </div>

      {/* Right section: Notifications & Profile Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Notification Popover Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationMenu((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger animate-ping" />
            )}
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Active Security Alarms ({notifications.length})
                </span>
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-[11px] text-primary hover:underline font-mono">
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-mono">
                    Zero unhandled threat incidents.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3.5 hover:bg-slate-800/40 transition-colors text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{n.title}</span>
                        <Badge variant={n.type === 'danger' ? 'danger' : 'success'} size="sm">New</Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown with Mock Role Switching */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotificationMenu(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all focus:outline-none"
          >
            <Avatar src={user?.avatarUrl} size="sm" status="online" />
            <div className="hidden lg:flex flex-col text-left mr-1">
              <span className="text-xs font-bold text-slate-100 font-sans leading-tight">{user?.username || 'Operator'}</span>
              <span className="text-[10px] text-primary font-mono font-medium">{currentRole}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs font-sans">
              <div className="p-3 border-b border-slate-800/80 mb-2">
                <p className="font-semibold text-slate-200">{user?.email}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{user?.department}</p>
              </div>

              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1">
                Switch Security Clearance (Mock RBAC)
              </div>
              {availableRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setShowProfileMenu(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors font-mono',
                    currentRole === r ? 'bg-primary/20 text-white font-semibold border border-primary/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {r === 'Administrator' && <Sliders className="w-3.5 h-3.5 text-danger" />}
                    {r === 'Researcher' && <Radio className="w-3.5 h-3.5 text-accent" />}
                    {r === 'Viewer' && <UserCheck className="w-3.5 h-3.5 text-primary" />}
                    {r}
                  </span>
                  {currentRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-800/80 my-2 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-danger-light hover:bg-danger/10 hover:text-danger font-medium transition-colors font-mono"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
