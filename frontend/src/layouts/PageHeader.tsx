import React from 'react';
import { Badge } from '@/components/common/Badge';
import { Shield, Sparkles } from 'lucide-react';
import { cn } from '@/utils';

export interface PageHeaderProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badgeText = 'Sprint 0 Architecture Ready',
  action,
  className,
}) => {
  return (
    <div className={cn('mb-6 pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/50 backdrop-blur-sm', className)}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary shrink-0" /> {title}
          </h1>
          {badgeText && (
            <Badge variant="primary" size="md" className="gap-1 shadow-inner">
              <Sparkles className="w-3.5 h-3.5" /> {badgeText}
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
