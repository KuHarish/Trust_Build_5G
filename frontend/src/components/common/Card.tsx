import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'none' | 'primary' | 'accent' | 'danger';
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  glow = 'none',
  title,
  subtitle,
  action,
  className,
  ...props
}) => {
  const glowClasses = {
    none: '',
    primary: 'glow-border-primary border-primary/40',
    accent: 'glow-border-accent border-accent/40',
    danger: 'glow-border-danger border-danger/40',
  };

  return (
    <div
      className={cn(
        hoverEffect ? 'glass-card-hover' : 'glass-card',
        'p-6 relative overflow-hidden',
        glowClasses[glow],
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-4 border-b border-slate-800/80 pb-3">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100 tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
