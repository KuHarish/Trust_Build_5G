import React from 'react';
import { cn } from '@/utils';

export interface StatusIndicatorProps {
  status: 'Active' | 'Warning' | 'Compromised' | 'Offline' | 'Maintenance' | string;
  label?: string;
  showText?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showText = true,
  className,
}) => {
  const getStatusColor = (val: string) => {
    switch (val.toLowerCase()) {
      case 'active':
      case 'healthy':
      case 'trusted':
      case 'mitigated':
        return 'bg-success shadow-[0_0_8px_#22C55E]';
      case 'warning':
      case 'moderate':
      case 'in progress':
      case 'maintenance':
        return 'bg-warning shadow-[0_0_8px_#F59E0B]';
      case 'compromised':
      case 'critical':
      case 'high':
      case 'untrusted':
      case 'quarantined':
      case 'offline':
        return 'bg-danger animate-pulse shadow-[0_0_8px_#EF4444]';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('inline-block w-2.5 h-2.5 rounded-full shrink-0', getStatusColor(status))} />
      {showText && (
        <span className="text-xs font-mono font-medium text-slate-200 tracking-wide uppercase">
          {label || status}
        </span>
      )}
    </div>
  );
};
