import React from 'react';
import { LucideIcon, FolderOpen, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-10 text-center glass-card border-dashed border-slate-800 rounded-2xl my-6', className)}>
      <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-4 shadow-inner text-primary">
        <Icon className="w-8 h-8 text-primary/80 animate-pulse" />
      </div>
      <h3 className="text-base font-semibold text-slate-100 tracking-wide">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} icon={<ArrowRight className="w-4 h-4" />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
