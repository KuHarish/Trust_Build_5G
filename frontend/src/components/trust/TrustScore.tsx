import React from 'react';
import { cn } from '@/utils';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface TrustScoreProps {
  score: number | null | undefined;
  level: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrustScore: React.FC<TrustScoreProps> = ({ score, level, showIcon = true, size = 'md', className }) => {
  const isTrusted = level === 'TRUSTED';
  const isSuspicious = level === 'SUSPICIOUS' || level === 'WARNING';
  const isMalicious = level === 'MALICIOUS' || level === 'CRITICAL';

  const colorClass = isTrusted
    ? 'text-emerald-400'
    : isSuspicious
    ? 'text-amber-400'
    : 'text-rose-400';

  const bgClass = isTrusted
    ? 'bg-emerald-400/10 border-emerald-400/30'
    : isSuspicious
    ? 'bg-amber-400/10 border-amber-400/30'
    : 'bg-rose-400/10 border-rose-400/30';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 rounded',
    md: 'text-sm px-3 py-1 rounded-lg',
    lg: 'text-2xl px-4 py-2 rounded-xl'
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className={cn("inline-flex items-center gap-1.5 border font-mono font-bold tracking-tight", bgClass, colorClass, sizeClasses[size], className)}>
      {showIcon && (
        isTrusted ? <ShieldCheck className={iconSize} /> :
        isSuspicious ? <ShieldAlert className={iconSize} /> :
        <ShieldX className={iconSize} />
      )}
      <span>{score !== null && score !== undefined ? (score * 100).toFixed(1) + '%' : '---'}</span>
      {size !== 'sm' && <span className="opacity-70 text-[0.8em] uppercase ml-1">({level})</span>}
    </div>
  );
};
