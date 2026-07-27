import React from 'react';
import { Card } from '@/components/common/Card';
import { StatusIndicator } from '@/components/common/StatusIndicator';
import { Badge } from '@/components/common/Badge';
import { Radio, ShieldCheck, Zap, Server, RefreshCw } from 'lucide-react';

export const NetworkStatusCard: React.FC = () => {
  const sliceMetrics = [
    { name: 'eMBB (Enhanced Mobile Broadband)', status: 'Active', load: '64%', latency: '1.2ms', trust: 99 },
    { name: 'uRLLC (Ultra-Reliable Low Latency)', status: 'Active', load: '32%', latency: '0.4ms', trust: 100 },
    { name: 'mMTC (Massive Machine-Type IoT)', status: 'Warning', load: '88%', latency: '14.5ms', trust: 78 },
  ];

  return (
    <Card className="p-6 border-slate-800/80">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/20 text-primary border border-primary/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-wide">5G Network Slicing & Core Status</h3>
            <p className="text-xs text-slate-400 font-mono">Autonomous Adaptive Trust Engine Surveillance</p>
          </div>
        </div>
        <Badge variant="success" pulse size="md">Core Architecture Secure</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5 mb-2">
            <Server className="w-3.5 h-3.5 text-primary" /> Active Base Stations (gNodeB)
          </span>
          <span className="text-2xl font-bold font-mono text-slate-100">42 / 42 Online</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-accent" /> Consensus Sealing Time
          </span>
          <span className="text-2xl font-bold font-mono text-accent">1.02s per block</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-success" /> Global Trust Level
          </span>
          <span className="text-2xl font-bold font-mono text-success">96.8% (Tier 1)</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-mono uppercase text-slate-400 font-semibold mb-2 flex items-center justify-between">
          <span>Active Virtual Network Slices</span>
          <span className="flex items-center gap-1 text-slate-500"><RefreshCw className="w-3 h-3" /> Auto-sync 5s</span>
        </div>
        {sliceMetrics.map((slice, idx) => (
          <div key={idx} className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-3">
              <StatusIndicator status={slice.status} showText={false} />
              <span className="text-sm font-medium text-slate-200">{slice.name}</span>
            </div>
            <div className="flex items-center gap-6 font-mono text-xs">
              <span className="text-slate-400">Load: <b className="text-slate-200">{slice.load}</b></span>
              <span className="text-slate-400">Latency: <b className="text-primary-light">{slice.latency}</b></span>
              <Badge variant={slice.trust >= 90 ? 'success' : 'warning'} className="font-mono">
                Trust: {slice.trust}%
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
