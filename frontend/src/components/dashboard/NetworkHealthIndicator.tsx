import React from 'react';
import { NetworkHealthStatus } from '../../types/dashboard';
import { ShieldAlert, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

interface Props {
  health: NetworkHealthStatus;
}

export const NetworkHealthIndicator: React.FC<Props> = ({ health }) => {
  const getStatusBadge = () => {
    switch (health.status) {
      case 'Healthy':
        return {
          color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          label: 'NOMINAL (HEALTHY)',
        };
      case 'Warning':
        return {
          color: 'text-amber-400 border-amber-500/30 bg-amber-950/30',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />,
          label: 'DEGRADED (WARNING)',
        };
      case 'Critical':
      default:
        return {
          color: 'text-rose-400 border-rose-500/30 bg-rose-950/30',
          icon: <ShieldAlert className="w-6 h-6 text-rose-500 animate-bounce" />,
          label: 'UNSTABLE (CRITICAL)',
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white tracking-wide">3GPP Network Health Diagnostics</h3>
          </div>
          <p className="text-xs text-slate-400">
            Real-time determination evaluating radio reachability, propagation delay, packet loss, and capacity.
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl border font-mono font-bold flex items-center gap-3 ${badge.color}`}>
          {badge.icon}
          <span>{badge.label}</span>
          <span className="ml-2 px-2 py-0.5 rounded bg-slate-900 text-slate-200 text-sm font-black border border-slate-700">
            {health.healthScore}/100
          </span>
        </div>
      </div>

      {/* Criteria Breakdown Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Node Availability</span>
            <span className="font-mono font-bold text-emerald-400">{health.criteria.availability}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${health.criteria.availability}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Average Latency</span>
            <span className="font-mono font-bold text-amber-400">{health.criteria.latency} ms</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (health.criteria.latency / 100) * 100)}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Est. Packet Loss</span>
            <span className="font-mono font-bold text-rose-400">{health.criteria.packetLoss}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, health.criteria.packetLoss * 4)}%` }} />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Bandwidth Load</span>
            <span className="font-mono font-bold text-blue-400">{health.criteria.bandwidthUtilization}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${health.criteria.bandwidthUtilization}%` }} />
          </div>
        </div>
      </div>

      {/* Diagnostic Messages */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Determinations</span>
        <div className="flex flex-wrap gap-2">
          {health.criteria.details.map((note, idx) => (
            <div
              key={idx}
              className="px-3 py-1 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 border border-slate-800 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {note}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
