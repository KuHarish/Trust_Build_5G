import React from 'react';
import { SystemOverview } from '../../types/dashboard';
import { Radio, Wifi, Layers, Activity, Cpu, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

interface Props {
  overview: SystemOverview;
}

export const OverviewKpiSection: React.FC<Props> = ({ overview }) => {
  const kpis = [
    {
      label: 'Active Entities & Status',
      value: `${overview.onlineNodes} / ${overview.totalNodes}`,
      subtext: `${overview.offlineNodes} offline/idle`,
      icon: <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />,
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-950/10',
    },
    {
      label: 'Active Circuits',
      value: overview.activeSessions.toLocaleString(),
      subtext: 'Online 5G peer sessions',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-950/10',
    },
    {
      label: 'Traffic Velocity',
      value: `${overview.packetsPerSecond.toFixed(1)} PPS`,
      subtext: `${overview.eventsPerSecond.toFixed(1)} events/sec ingested`,
      icon: <Activity className="w-5 h-5 text-indigo-400" />,
      border: 'border-indigo-500/20',
      bg: 'bg-indigo-950/10',
    },
    {
      label: 'Feature Extraction Rate',
      value: `${overview.featureExtractionRate.toFixed(1)} /s`,
      subtext: 'Mod 2 preprocessing feed',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      border: 'border-purple-500/20',
      bg: 'bg-purple-950/10',
    },
    {
      label: 'Average Transit Latency',
      value: `${overview.averageLatency.toFixed(2)} ms`,
      subtext: 'Haversine GPS propagation',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      border: 'border-amber-500/20',
      bg: 'bg-amber-950/10',
    },
    {
      label: 'Channel Bandwidth',
      value: `${overview.averageBandwidth.toFixed(1)} Mbps`,
      subtext: 'Mean throughput utilization',
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
      border: 'border-blue-500/20',
      bg: 'bg-blue-950/10',
    },
    {
      label: 'Received Signal Strength',
      value: `${overview.averageSignalStrength.toFixed(1)} dBm`,
      subtext: 'CellULAR RSSI reception',
      icon: <Wifi className="w-5 h-5 text-teal-400" />,
      border: 'border-teal-500/20',
      bg: 'bg-teal-950/10',
    },
    {
      label: 'Integration Scope',
      value: 'Mod 1 + Mod 2 + Mod 3',
      subtext: 'No ML / No Attacks (Sprint 1)',
      icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
      border: 'border-rose-500/20',
      bg: 'bg-rose-950/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className={`p-4 rounded-xl border ${kpi.border} ${kpi.bg} backdrop-blur-md shadow-lg flex flex-col justify-between transition-all hover:scale-[1.02] duration-200`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{kpi.label}</span>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">{kpi.icon}</div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-white">{kpi.value}</div>
            <div className="text-xs font-medium text-slate-500 mt-1">{kpi.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
