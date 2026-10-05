import React from 'react';
import { useDashboardStatistics } from '../../hooks/useDashboardHooks';
import { TrendingUp, BarChart2, Radio } from 'lucide-react';

export const DashboardCharts: React.FC = () => {
  const { data: stats, isLoading } = useDashboardStatistics();

  if (isLoading || !stats || !stats.success) {
    return (
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 h-80 flex flex-col items-center justify-center text-slate-500 text-xs font-mono space-y-3">
        <Radio className="w-8 h-8 animate-spin opacity-40 text-primary" />
        <span>Synchronizing live time-series analytics tensors...</span>
      </div>
    );
  }

  const renderSparkline = (values: number[], colorClass: string) => {
    if (!values || values.length === 0) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const widthPerStep = 100 / Math.max(values.length - 1, 1);

    const points = values
      .map((val, idx) => {
        const x = idx * widthPerStep;
        const y = 100 - ((val - min) / range) * 85 - 5;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <div className="w-full h-full relative flex items-end">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-24 overflow-visible">
          <polyline fill="none" stroke="currentColor" strokeWidth="2.5" className={colorClass} points={points} />
          {values.map((val, idx) => {
            const x = idx * widthPerStep;
            const y = 100 - ((val - min) / range) * 85 - 5;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="1.8"
                className={`fill-slate-950 stroke-[2] stroke-current ${colorClass}`}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const protocols = Object.entries(stats.protocolDistribution || {});
  const totalProto = protocols.reduce((acc, curr) => acc + curr[1], 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2-Column Real-time Trend Charts */}
      <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Real-Time Telemetry & Traffic Oscillations</h3>
              <p className="text-xs text-slate-400">Live 3GPP channel dynamics sampled directly from background simulation cycles</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-400">
            AUTO-SYNC 4000ms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-semibold">Packets Per Second (PPS)</span>
              <span className="text-emerald-400 font-bold">
                {stats.packetsPerSecondTrend.values.slice(-1)[0]?.toFixed(1)} PPS
              </span>
            </div>
            <div className="py-2">{renderSparkline(stats.packetsPerSecondTrend.values, 'text-emerald-400')}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-semibold">Bandwidth Throughput</span>
              <span className="text-blue-400 font-bold">
                {stats.bandwidthUsageTrend.values.slice(-1)[0]?.toFixed(1)} Mbps
              </span>
            </div>
            <div className="py-2">{renderSparkline(stats.bandwidthUsageTrend.values, 'text-blue-400')}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-semibold">Haversine Latency Trend</span>
              <span className="text-amber-400 font-bold">
                {stats.latencyTrend.values.slice(-1)[0]?.toFixed(2)} ms
              </span>
            </div>
            <div className="py-2">{renderSparkline(stats.latencyTrend.values, 'text-amber-400')}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-semibold">RSSI Signal Trend</span>
              <span className="text-teal-400 font-bold">
                {stats.signalStrengthTrend.values.slice(-1)[0]?.toFixed(1)} dBm
              </span>
            </div>
            <div className="py-2">{renderSparkline(stats.signalStrengthTrend.values, 'text-teal-400')}</div>
          </div>
        </div>
      </div>

      {/* 1-Column Protocol Frequency Distribution */}
      <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <BarChart2 className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Protocol Frequency</h3>
            <p className="text-xs text-slate-400">Communication frame protocol mix</p>
          </div>
        </div>

        <div className="space-y-3.5 flex-1">
          {protocols.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
              No protocol frames captured in session logs.
            </div>
          ) : (
            protocols.map(([proto, count], idx) => {
              const pct = Math.round((count / totalProto) * 100);
              const colors = ['bg-cyan-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-teal-500'];
              const col = colors[idx % colors.length];

              return (
                <div key={proto} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-white">{proto}</span>
                    <span className="text-slate-400">
                      {count} pkts ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${col} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono text-center">
          Monitoring {totalProto.toLocaleString()} cumulative frames across Module 2 & 3 queues.
        </div>
      </div>
    </div>
  );
};
