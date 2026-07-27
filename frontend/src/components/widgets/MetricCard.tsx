import React from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/utils';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive?: boolean;
  icon?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon = 'Activity',
  className,
}) => {
  // Dynamically resolve lucide icon from string name
  const IconComponent = ((LucideIcons as unknown) as Record<string, React.ComponentType<{ className?: string }>>)[icon] || LucideIcons.Activity;

  return (
    <Card hoverEffect className={cn('flex flex-col justify-between p-5 border-slate-800/80', className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">{title}</span>
        <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-primary shrink-0 shadow-inner">
          <IconComponent className="w-5 h-5 text-primary" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-white tracking-tight font-sans mb-2">
          {value}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPositive ? 'success' : 'danger'} size="sm" className="font-mono text-[10px]">
            {isPositive ? '▲' : '▼'} {change}
          </Badge>
          <span className="text-[11px] text-slate-500 font-sans">vs average</span>
        </div>
      </div>
    </Card>
  );
};
