import React from 'react';
import { Card } from '@/components/common/Card';
import { NodeStatistics } from '@/types/node';
import { Radio, CheckCircle2, XCircle, Activity, Layers } from 'lucide-react';

interface NodeSummaryCardsProps {
  statistics?: NodeStatistics;
  isLoading?: boolean;
}

export const NodeSummaryCards: React.FC<NodeSummaryCardsProps> = ({ statistics, isLoading = false }) => {
  if (isLoading || !statistics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-pulse">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="h-32 rounded-xl border border-slate-800 bg-slate-900/50" />
        ))}
      </div>
    );
  }

  const getSignalColor = (signal: number) => {
    if (signal >= -65) return 'text-emerald-400';
    if (signal >= -85) return 'text-amber-400';
    return 'text-rose-400';
  };

  // Convert nodeTypes object to a top 3 sorted array
  const topTypes = Object.entries(statistics.nodeTypes || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Nodes */}
      <Card hoverEffect={true} className="p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Total Nodes</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold tracking-tight text-white">{statistics.totalNodes.toLocaleString()}</span>
          <p className="mt-1 text-xs text-slate-400 font-mono">Active 5G Simulation Units</p>
        </div>
      </Card>

      {/* Online Nodes */}
      <Card hoverEffect={true} className="p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Online Nodes</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-emerald-400">{statistics.onlineNodes.toLocaleString()}</span>
          <span className="text-xs text-slate-400">
            ({statistics.totalNodes > 0 ? Math.round((statistics.onlineNodes / statistics.totalNodes) * 100) : 0}%)
          </span>
        </div>
        <p className="mt-1 text-xs text-emerald-500/80 font-mono">Real-time Telemetry Synced</p>
      </Card>

      {/* Offline Nodes */}
      <Card hoverEffect={true} className="p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Offline Nodes</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-3xl font-extrabold tracking-tight text-rose-400">{statistics.offlineNodes.toLocaleString()}</span>
          <p className="mt-1 text-xs text-slate-400 font-mono">Unreachable / Disconnected</p>
        </div>
      </Card>

      {/* Average Signal Strength */}
      <Card hoverEffect={true} className="p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Avg Signal (dBm)</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className={`text-3xl font-extrabold tracking-tight ${getSignalColor(statistics.averageSignalStrength)}`}>
            {statistics.averageSignalStrength}
          </span>
          <span className="text-sm font-bold text-slate-400">dBm</span>
        </div>
        <p className="mt-1 text-xs text-slate-400 font-mono">Nominal Radio Reception</p>
      </Card>

      {/* Node Type Distribution */}
      <Card hoverEffect={true} className="p-5 border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono tracking-wider uppercase text-slate-400">Type Distribution</span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 space-y-1">
          {topTypes.length === 0 ? (
            <span className="text-xs text-slate-500 font-mono">No nodes active</span>
          ) : (
            topTypes.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 truncate max-w-[120px]">{type}:</span>
                <span className="font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  {count}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
