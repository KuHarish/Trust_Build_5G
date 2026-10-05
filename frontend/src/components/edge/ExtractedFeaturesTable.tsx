import React, { useState } from 'react';
import { useEdgeFeatures } from '@/hooks/useEdgeHooks';
import { Card, Input, Button, LoadingSpinner } from '@/components/common';
import { Search, RefreshCw, Cpu, CheckCircle2, Sliders } from 'lucide-react';

export const ExtractedFeaturesTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNormalized, setShowNormalized] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useEdgeFeatures();

  const filteredFeatures = React.useMemo(() => {
    if (!data?.data) return [];
    if (!searchTerm) return data.data;
    const s = searchTerm.toLowerCase();
    return data.data.filter(f => f.nodeId.toLowerCase().includes(s));
  }, [data, searchTerm]);

  return (
    <Card className="p-6 bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl">
      {/* Header & Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 tracking-wide flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" /> Extracted Node Feature Matrices
            </h3>
            {isFetching && <span className="text-[10px] text-emerald-400 font-mono animate-pulse px-2 py-0.5 rounded bg-emerald-950/50">UPDATING...</span>}
          </div>
          <p className="text-xs text-slate-400">
            Mathematically aggregated rolling feature tensors formatted for immediate ingestion by Module 3 (Trust) and Module 4 (AI/FL).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Filter node ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="w-48 bg-slate-950/90 text-sm"
          />
          <Button
            variant={showNormalized ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowNormalized(!showNormalized)}
            className="flex items-center gap-1.5 font-medium text-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showNormalized ? 'Showing [0,1] Normalized' : 'Show Normalized Vectors'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/90 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-4">Node Designation</th>
              <th className="py-3 px-4 text-right">Comm Count</th>
              <th className="py-3 px-4 text-right">{showNormalized ? 'Norm Latency [0,1]' : 'Avg Latency'}</th>
              <th className="py-3 px-4 text-right">{showNormalized ? 'Norm Bandwidth [0,1]' : 'Avg Bandwidth'}</th>
              <th className="py-3 px-4 text-right">{showNormalized ? 'Norm Signal [0,1]' : 'Signal Strength'}</th>
              <th className="py-3 px-4 text-right">{showNormalized ? 'Norm Jitter [0,1]' : 'Avg Jitter'}</th>
              <th className="py-3 px-4 text-right">Success Rate</th>
              <th className="py-3 px-4 text-right">Avg Packet Size</th>
              <th className="py-3 px-4 text-center">Downstream Ready</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm font-sans text-slate-200">
            {isLoading && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="md" />
                    <span>Calculating running average feature matrices...</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !isError && filteredFeatures.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <span className="font-semibold text-slate-300 block">No extracted node features registered</span>
                  <span className="text-xs text-slate-500">Feature matrices populate automatically as communication events are ingested by the Edge Server.</span>
                </td>
              </tr>
            )}

            {!isLoading && !isError && filteredFeatures.map((f) => (
              <tr key={f.nodeId} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-300">{f.nodeId}</td>
                <td className="py-3 px-4 font-mono text-right text-slate-300">{f.communicationCount.toLocaleString()}</td>
                
                {/* Latency */}
                <td className="py-3 px-4 font-mono text-right text-amber-300">
                  {showNormalized ? (f.normalizedFeatures?.norm_latency ?? 0.0).toFixed(4) : `${f.avgLatency.toFixed(1)} ms`}
                </td>

                {/* Bandwidth */}
                <td className="py-3 px-4 font-mono text-right text-emerald-300">
                  {showNormalized ? (f.normalizedFeatures?.norm_bandwidth ?? 0.0).toFixed(4) : `${f.avgBandwidth.toFixed(1)} Mbps`}
                </td>

                {/* Signal */}
                <td className="py-3 px-4 font-mono text-right text-purple-300">
                  {showNormalized ? (f.normalizedFeatures?.norm_signal ?? 0.0).toFixed(4) : `${f.avgSignalStrength.toFixed(1)} dBm`}
                </td>

                {/* Jitter */}
                <td className="py-3 px-4 font-mono text-right text-blue-300">
                  {showNormalized ? (f.normalizedFeatures?.norm_jitter ?? 0.0).toFixed(4) : `${f.avgJitter.toFixed(2)} ms`}
                </td>

                {/* Success Rate */}
                <td className="py-3 px-4 font-mono text-right font-bold text-emerald-400">
                  {(f.transmissionSuccessRate * 100).toFixed(1)}%
                </td>

                {/* Avg Packet Size */}
                <td className="py-3 px-4 font-mono text-right text-slate-300">
                  {f.avgPacketSize.toFixed(0)} B
                </td>

                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-600/40">
                    <CheckCircle2 className="w-3 h-3 text-indigo-400" /> MOD 3/4 READY
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
