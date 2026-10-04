import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { federatedApi } from '@/api/endpoints';
import { RefreshCw, GitCommit, GitMerge, Server, PlayCircle, CheckCircle, XCircle, Database, Layers, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface FederatedRoundVisualizationProps {
  jobId?: string;
}

export const FederatedRoundVisualization: React.FC<FederatedRoundVisualizationProps> = ({ jobId }) => {
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  // Fetch Rounds
  const { data: roundsRes, isLoading: roundsLoading, isError: roundsError } = useQuery({
    queryKey: ['federated-rounds', jobId],
    queryFn: () => federatedApi.getRounds(jobId),
    refetchInterval: 10000,
  });

  const rounds = roundsRes?.data?.data || [];
  
  // Default to the latest round if none selected
  const displayRoundId = selectedRoundId || (rounds.length > 0 ? rounds[rounds.length - 1].roundId : null);
  const selectedRound = rounds.find((r: any) => r.roundId === displayRoundId);

  // Prepare data for the Metric Trend Chart
  const chartData = rounds.map((r: any) => ({
    name: `Round ${r.roundNumber}`,
    Accuracy: r.globalMetrics?.Accuracy || r.globalMetrics?.accuracy || null,
    F1: r.globalMetrics?.F1 || r.globalMetrics?.f1 || null,
    Loss: r.globalMetrics?.Loss || r.globalMetrics?.loss || null,
  })).filter((d: any) => d.Accuracy !== null || d.Loss !== null || d.F1 !== null);

  const getStatusIcon = (status: string) => {
    if (status === 'COMPLETED' || status === 'SUCCESS') return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (status === 'FAILED' || status === 'DROPPED') return <XCircle className="w-5 h-5 text-rose-400" />;
    if (status === 'IN_PROGRESS' || status === 'TRAINING' || status === 'AGGREGATING') return <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />;
    return <PlayCircle className="w-5 h-5 text-slate-400" />;
  };

  const formatTime = (ts: string) => {
    if (!ts) return 'N/A';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  if (roundsError) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-rose-500">
        Failed to load federated rounds from backend.
      </div>
    );
  }

  if (roundsLoading) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-slate-500 flex flex-col items-center">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 opacity-50" />
        Loading federated workflow...
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
        No federated-learning rounds are available.
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <GitCommit className="w-6 h-6 text-indigo-400" />
        Federated Training Workflow
      </h2>

      {/* ROUND TIMELINE (HORIZONTAL SCROLL) */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 overflow-x-auto custom-scrollbar">
        <div className="flex gap-4 min-w-max pb-2">
          {rounds.map((round: any, idx: number) => (
            <div key={round.roundId} className="flex items-center">
              <button 
                onClick={() => setSelectedRoundId(round.roundId)}
                className={`p-4 rounded-xl border transition-all text-left min-w-[160px] ${
                  displayRoundId === round.roundId 
                    ? 'bg-slate-800/80 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold uppercase ${displayRoundId === round.roundId ? 'text-indigo-400' : 'text-slate-400'}`}>
                    Round {round.roundNumber}
                  </span>
                  {getStatusIcon(round.status)}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mb-1">ID: {round.roundId.substring(0, 8)}...</div>
                <div className="text-[10px] text-slate-400">Model: v{round.globalModelVersion || 'N/A'}</div>
              </button>
              
              {idx < rounds.length - 1 && (
                <div className="px-3 text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedRound && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ROUND DETAILS & FEDAVG FLOW */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* FEDAVG VISUALIZATION FLOW */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-emerald-400" />
                Aggregation Flow (FedAvg)
              </h3>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-950/50 p-6 rounded-lg border border-slate-800/50">
                {/* Step 1: Clients */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 relative z-10">
                    <Server className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-bold text-slate-200">Local Training</div>
                    <div className="text-xs text-slate-400">{selectedRound.participatingClients} Clients</div>
                    <div className="text-[10px] text-slate-500">{selectedRound.totalClientSamples} Samples</div>
                  </div>
                </div>

                <div className="hidden md:block flex-1 h-0.5 bg-slate-800 relative -mt-10">
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                </div>
                <ArrowRight className="md:hidden text-slate-600 w-4 h-4 my-2" />

                {/* Step 2: Aggregation */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-indigo-500 relative z-10 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <GitMerge className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-bold text-slate-200">FedAvg Aggregation</div>
                    <div className="text-xs text-slate-400">{selectedRound.status}</div>
                    <div className="text-[10px] text-slate-500">Weights: Sample-Count</div>
                  </div>
                </div>

                <div className="hidden md:block flex-1 h-0.5 bg-slate-800 relative -mt-10">
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                </div>
                <ArrowRight className="md:hidden text-slate-600 w-4 h-4 my-2" />

                {/* Step 3: Global Model */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border-2 border-emerald-500 relative z-10 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                    <Layers className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-bold text-slate-200">Global Model</div>
                    <div className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded mt-1">v{selectedRound.globalModelVersion || 'N/A'}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {selectedRound.previousGlobalModelVersion ? `Prev: v${selectedRound.previousGlobalModelVersion}` : 'Initial Version'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* METRICS TREND CHART */}
            {chartData.length > 0 && (
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 h-[300px] flex flex-col">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Metric Progression</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickMargin={10} />
                      <YAxis stroke="#64748b" fontSize={12} tickMargin={10} domain={['auto', 'auto']} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      {chartData.some((d: any) => d.Accuracy !== null) && <Line type="monotone" dataKey="Accuracy" stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: '#34d399' }} />}
                      {chartData.some((d: any) => d.F1 !== null) && <Line type="monotone" dataKey="F1" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4, fill: '#60a5fa' }} />}
                      {chartData.some((d: any) => d.Loss !== null) && <Line type="monotone" dataKey="Loss" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* ROUND CONTEXT SIDEBAR */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Round Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Round Status</div>
                  <div className="text-sm font-bold text-slate-200">{selectedRound.status}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Started At</div>
                    <div className="text-xs text-slate-300 font-mono">{formatTime(selectedRound.trainingStart || selectedRound.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Completed At</div>
                    <div className="text-xs text-slate-300 font-mono">{formatTime(selectedRound.trainingEnd || selectedRound.completedAt)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Participating Clients</div>
                    <div className="text-lg font-bold text-indigo-400">{selectedRound.participatingClients}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Dropped/Failed</div>
                    <div className="text-lg font-bold text-rose-400">{selectedRound.droppedClients}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Agg. Duration</div>
                  <div className="text-sm font-mono text-slate-300">{selectedRound.aggregationDuration ? `${selectedRound.aggregationDuration.toFixed(2)}s` : 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Global Metrics
              </h3>
              {!selectedRound.globalMetrics || Object.keys(selectedRound.globalMetrics).length === 0 ? (
                <div className="text-sm text-slate-500 italic">No global metrics calculated for this round yet.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(selectedRound.globalMetrics).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/40 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase truncate">{key}</div>
                      <div className="text-sm font-bold text-slate-200 font-mono">
                        {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(4)) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
