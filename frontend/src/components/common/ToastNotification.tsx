import React from 'react';
import { useNotification } from '@/contexts';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils';

export const ToastNotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  const iconMap = {
    success: <ShieldCheck className="w-5 h-5 text-success shrink-0" />,
    danger: <ShieldAlert className="w-5 h-5 text-danger shrink-0 animate-bounce" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borderMap = {
    success: 'border-success/40 bg-slate-900/95',
    danger: 'border-danger/40 bg-slate-900/95 shadow-lg shadow-danger/10',
    warning: 'border-warning/40 bg-slate-900/95',
    info: 'border-blue-500/40 bg-slate-900/95',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto p-4 rounded-xl border backdrop-blur-lg shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3',
            borderMap[toast.type]
          )}
        >
          {iconMap[toast.type]}
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold text-slate-100">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => removeNotification(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
