import React from 'react';
import { useEdgeStatistics, useEdgeEvents } from '@/hooks/useEdgeHooks';
import { Card, LoadingSpinner } from '@/components/common';
import { PieChart, TrendingUp, BarChart3 } from 'lucide-react';

export const EdgeVisualizations: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useEdgeStatistics();
  const { data: eventsData } = useEdgeEvents({ limit: 40 });

  if (statsLoading || !stats) {
    return (
      <Card className="p-12 text-center bg-slate-900/80 border border-slate-800/80">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <LoadingSpinner size="lg" />
          <span className="text-sm font-mono">Synthesizing interactive Edge Server telemetry visualizations...</span>
        </div>
      </Card>
    );
  }

  // Calculate Protocol Distribution percentages for visual bar bars and circular representation
  const totalProtocolEvents = Object.values(stats.protocolDistribution || {}).reduce((a, b) => a + b, 0) || 1;
  const protocolEntries = Object.entries(stats.protocolDistribution || {}).map(([proto, count]) => ({
    proto,
    count,
    percentage: Math.round((count / totalProtocolEvents) * 100),
  })).sort((a, b) => b.count - a.count);

  const colors = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#06B6D4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Traffic Timeline & Throughput Oscillation */}
      <Card className="p-5 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md lg:col-span-2 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Live Throughput & Latency Timeline
            </h4>
            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
              WINDOW: PAST 40 BATCHES
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Real-time visual representation of bandwidth channel saturation vs transit latency fluctuations across simulated 5G slices.
          </p>
        </div>

        {/* Custom SVG Line Visualization */}
        <div className="h-48 w-full relative flex items-end justify-between px-2 pb-2 pt-8 border-b border-slate-800 bg-gradient-to-t from-slate-950/80 to-transparent rounded-lg overflow-hidden">
          {eventsData?.data && eventsData.data.length > 0 ? (
            <div className="w-full h-full flex items-end justify-between gap-1">
              {eventsData.data.slice(0, 30).reverse().map((ev, i) => {
                // Height percentage normalized against max bandwidth (1000 Mbps)
                const heightPct = Math.max(15, Math.min(95, Math.round((ev.bandwidth / 1000) * 100)));
                const isDelayed = ev.status !== 'SUCCESS';
                return (
                  <div key={ev.eventId || i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 hidden group-hover:flex flex-col bg-slate-950 text-[10px] text-slate-200 p-1.5 rounded border border-indigo-500/60 shadow-xl font-mono z-20 whitespace-nowrap">
                      <span>{ev.protocol} | {ev.bandwidth} Mbps</span>
                      <span className="text-amber-300">Lat: {ev.latency} ms</span>
                    </div>
                    {/* Bar representation */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[12px] rounded-t transition-all duration-300 ${
                        isDelayed
                          ? 'bg-gradient-to-t from-amber-700 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                          : 'bg-gradient-to-t from-indigo-700 via-indigo-500 to-emerald-400 group-hover:brightness-125'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
              Awaiting real-time simulation tick telemetry...
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 font-mono">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-indigo-500" /> Nominal 5G Throughput</span>
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-amber-400" /> Proximity Delay Spike</span>
          <span>Avg Bandwidth: {stats.averageBandwidth} Mbps</span>
        </div>
      </Card>

      {/* 2. Protocol Distribution Breakdown */}
      <Card className="p-5 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-400" /> Protocol Composition
            </h4>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Proportional frequency distribution across supported transport and IoT application layer protocols.
          </p>

          {/* Progress stack representation */}
          <div className="w-full h-4 rounded-full bg-slate-950 overflow-hidden flex mb-6 border border-slate-800">
            {protocolEntries.map((entry, idx) => (
              <div
                key={entry.proto}
                style={{ width: `${entry.percentage}%`, backgroundColor: colors[idx % colors.length] }}
                title={`${entry.proto}: ${entry.percentage}%`}
                className="h-full transition-all duration-500"
              />
            ))}
          </div>
        </div>

        {/* Legend table */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {protocolEntries.map((entry, idx) => (
            <div key={entry.proto} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div style={{ backgroundColor: colors[idx % colors.length] }} className="w-2.5 h-2.5 rounded-full" />
                <span className="font-bold text-slate-200">{entry.proto}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">{entry.count} pkts</span>
                <span className="w-10 text-right font-bold text-indigo-300">{entry.percentage}%</span>
              </div>
            </div>
          ))}
          {protocolEntries.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs font-mono">No protocol telemetry logged yet.</div>
          )}
        </div>
      </Card>

      {/* 3. Signal Strength & Jitter Distribution */}
      <Card className="p-5 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md lg:col-span-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" /> RF Signal Strength (RSSI) & Jitter Matrix
            </h4>
            <p className="text-xs text-slate-400">
              Distribution of received power levels (-30 dBm optimal to -100 dBm edge boundary) across active communicating node pairs.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-slate-300">Excellent (&gt;-60 dBm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded bg-amber-500" />
              <span className="text-slate-300">Moderate (-60 to -85 dBm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded bg-red-500" />
              <span className="text-slate-300">Weak (&lt;-85 dBm)</span>
            </div>
          </div>
        </div>

        {/* Horizontal visual bars from recent event stream */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pt-2">
          {eventsData?.data ? eventsData.data.slice(0, 8).map((ev, idx) => {
            const signal = ev.signalStrength;
            const statusColor = signal >= -60 ? 'text-emerald-400 bg-emerald-950/40 border-emerald-600/30' : signal >= -85 ? 'text-amber-400 bg-amber-950/40 border-amber-600/30' : 'text-red-400 bg-red-950/40 border-red-600/30';
            return (
              <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 truncate">
                  <span>{ev.sourceNodeId.split('-').pop()}</span>
                  <span>&rarr;</span>
                  <span>{ev.destinationNodeId.split('-').pop()}</span>
                </div>
                <div className={`text-center py-1.5 my-1 rounded border font-mono font-black text-sm ${statusColor}`}>
                  {signal} dBm
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>Jitter</span>
                  <span className="text-indigo-300">{ev.jitter} ms</span>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-6 text-center text-slate-500 text-xs font-mono">
              Awaiting node RF handshakes...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
