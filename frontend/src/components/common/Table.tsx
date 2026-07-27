import React from 'react';
import { cn } from '@/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No telemetry records found for this timeframe.',
  onRowClick,
  className,
}: TableProps<T>): React.ReactElement {
  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50 shadow-inner', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-mono tracking-wider text-slate-400 uppercase">
            {columns.map((col, idx) => (
              <th key={idx} className={cn('py-3.5 px-4 font-semibold text-slate-300', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm font-sans">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-xs tracking-wider uppercase font-mono">Loading data network stream...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center text-slate-400 font-mono text-xs">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={keyExtractor(item, idx)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  'transition-colors duration-150 text-slate-200',
                  onRowClick ? 'cursor-pointer hover:bg-slate-800/60' : 'hover:bg-slate-900/40'
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn('py-3.5 px-4 whitespace-nowrap', col.className)}>
                    {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey] ?? '—') : '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
