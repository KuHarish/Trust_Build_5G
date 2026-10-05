import React from 'react';
import { useCommunicationStatistics } from '@/hooks/useCommunicationHooks';
import { Card, LoadingSpinner } from '@/components/common';
import { Activity, Zap, TrendingUp, Cpu, Radio } from 'lucide-react';

export const CommunicationVisualizations: React.FC = () => {
  const { data: stats, isLoading } = useCommunicationStatistics();

  if (isLoading || !stats) {
    return (
      <Card className="p-12 text-center bg-slate-900/80 border border-slate-800/80">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <LoadingSpinner size="md" />
          <span className="text-xs font-mono">Synthesizing live Communication Engine telemetry analytics...</span>
        </div>
      </Card>
    );
  }

  // Calculate Protocol Distribution percentages
  const totalPkts = Object.values(stats.protocolDistribution || {}).reduce((a, b) => a + b, 0) || 1;
  const protocolEntries = Object.entries(stats.protocolDistribution || {}).map(([proto, count]) => ({
    proto,
    count,
    percentage: Math.round((count / totalPkts) * 100),
  })).sort((a, b) => b.count - a.count);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-bold">Active Sessions</span>
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {stats.activeSessions} <span className="text-xs text-emerald-400 font-normal">LIVE</span>
          </div>
          <div className="w-full bg-slate-950 h-1 rounded mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full w-full animate-pulse" />
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-bold">Packet Velocity</span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {stats.packetsPerSecond} <span className="text-xs text-slate-400 font-normal">pkts/sec</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Total volume: {stats.totalPackets} transmitted
          </p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-bold">Avg Latency</span>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-indigo-400 tracking-tight">
            {stats.averageLatency} <span className="text-xs text-slate-400 font-normal">ms</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Haversine geographic RF routing
          </p>
        </Card>

        <Card className="p-4 bg-slate-900/90 border border-slate-800/80 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-bold">Channel Capacity</span>
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {stats.averageBandwidth} <span className="text-xs text-slate-400 font-normal">Mbps</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Avg Session Life: {stats.averageSessionDuration}s
          </p>
        </Card>
      </div>

      {/* Protocol Breakdown & Analytics Chart Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md lg:col-span-2 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-2 font-mono uppercase tracking-wide">
              <Cpu className="w-4 h-4 text-indigo-400" /> Real-Time Traffic Protocol Composition Bar
            </h4>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Distribution of transported telemetry and file transfer traffic generated across active node circuits.
            </p>

            <div className="w-full h-5 rounded-full bg-slate-950 overflow-hidden flex mb-6 border border-slate-800 shadow-inner">
              {protocolEntries.map((entry, idx) => (
                <div
                  key={entry.proto}
                  style={{ width: `${entry.percentage}%`, backgroundColor: colors[idx % colors.length] }}
                  title={`${entry.proto}: ${entry.percentage}% (${entry.count} pkts)`}
                  className="h-full transition-all duration-500 flex items-center justify-center text-[10px] font-mono font-bold text-slate-950 overflow-hidden"
                >
                  {entry.percentage > 8 && entry.proto}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
            {protocolEntries.map((entry, idx) => (
              <div key={entry.proto} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60 font-mono text-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-slate-200">{entry.proto}</span>
                  <div style={{ backgroundColor: colors[idx % colors.length] }} className="w-2 h-2 rounded-full" />
                </div>
                <div className="text-right text-sm font-black text-indigo-300">{entry.percentage}%</div>
              </div>
            ))}
            {protocolEntries.length === 0 && (
              <div className="col-span-full text-center py-4 text-slate-500 text-xs font-mono">
                No active traffic generated in simulation yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100 mb-2 font-mono uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Module 3 Architecture
            </h4>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Every simulated session and packet generated by this Communication Engine is simultaneously forwarded directly into Sprint 1.2 Edge Server feature extraction APIs, ensuring real-time mathematical parameter convergence without duplicating calculation pipelines.
            </p>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold flex items-center justify-between">
            <span>Edge Server Feed:</span>
            <span className="font-extrabold animate-pulse text-white">ONLINE & SYNCED</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
