import React from 'react';
import { Card, LoadingSpinner } from '@/components/common';
import { useEdgeStatistics } from '@/hooks/useEdgeHooks';
import { Activity, Radio, Cpu, Layers, Signal, Database } from 'lucide-react';

export const EdgeSummaryCards: React.FC = () => {
  const { data: stats, isLoading, isError } = useEdgeStatistics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 animate-pulse">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="h-28 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-sm flex items-center gap-3">
        <Activity className="w-5 h-5 text-red-400" />
        <span>Failed to sync live Edge Server traffic statistics. Ensure backend simulation loop is active.</span>
      </div>
    );
  }

  // Find top protocol by distribution frequency
  const topProtocol = Object.entries(stats.protocolDistribution || {}).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Card 1: Total Ingested Events */}
      <Card hoverEffect={true} className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Events</span>
          <Database className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
          {stats.totalEvents.toLocaleString()}
        </div>
        <span className="text-[11px] text-indigo-300/80 mt-1 block">3GPP / IoT Ingestion Engine</span>
      </Card>

      {/* Card 2: Events Per Second */}
      <Card hoverEffect={true} className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Velocity (EPS)</span>
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        </div>
        <div className="text-2xl font-black text-emerald-300 font-mono tracking-tight">
          {stats.eventsPerSecond} <span className="text-xs text-slate-400 font-sans font-normal">evt/s</span>
        </div>
        <span className="text-[11px] text-emerald-300/80 mt-1 block">Live 4.0s Simulation Loop</span>
      </Card>

      {/* Card 3: Average Latency */}
      <Card hoverEffect={true} className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</span>
          <Radio className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-black text-amber-300 font-mono tracking-tight">
          {stats.averageLatency} <span className="text-xs text-slate-400 font-sans font-normal">ms</span>
        </div>
        <span className="text-[11px] text-amber-300/80 mt-1 block">Haversine Proximity Delayed</span>
      </Card>

      {/* Card 4: Average Bandwidth */}
      <Card hoverEffect={true} className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Bandwidth</span>
          <Cpu className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-2xl font-black text-blue-300 font-mono tracking-tight">
          {stats.averageBandwidth} <span className="text-xs text-slate-400 font-sans font-normal">Mbps</span>
        </div>
        <span className="text-[11px] text-blue-300/80 mt-1 block">5G eMBB / uRLLC Allocated</span>
      </Card>

      {/* Card 5: Average Signal Strength */}
      <Card hoverEffect={true} className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signal (RSSI)</span>
          <Signal className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">
          {stats.averageSignalStrength} <span className="text-xs text-slate-400 font-sans font-normal">dBm</span>
        </div>
        <span className="text-[11px] text-purple-300/80 mt-1 block">Nominal RF Range (-30 to -100)</span>
      </Card>

      {/* Card 6: Top Protocol */}
      <Card hoverEffect={true} className="p-4 bg-gradient-to-br from-slate-900 via-slate-900 to-pink-950/40 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Protocol</span>
          <Layers className="w-4 h-4 text-pink-400" />
        </div>
        <div className="text-2xl font-black text-pink-300 font-mono tracking-tight">
          {topProtocol[0]}
        </div>
        <span className="text-[11px] text-pink-300/80 mt-1 block">{topProtocol[1]} Total Transmissions</span>
      </Card>
    </div>
  );
};
