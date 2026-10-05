import React, { HTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'warning' | 'success' | 'outline';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  pulse = false,
  className,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-primary/15 text-blue-400 border border-primary/30',
    secondary: 'bg-slate-800 text-slate-300 border border-slate-700',
    accent: 'bg-accent/15 text-accent-light border border-accent/30',
    danger: 'bg-danger/15 text-danger-light border border-danger/30',
    warning: 'bg-warning/15 text-warning-light border border-warning/30',
    success: 'bg-success/15 text-success-light border border-success/30',
    outline: 'bg-transparent text-slate-400 border border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold font-mono tracking-wide',
    md: 'text-xs px-2.5 py-1 font-semibold font-mono tracking-wider',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full uppercase transition-all',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
      )}
      {children}
    </span>
  );
};
