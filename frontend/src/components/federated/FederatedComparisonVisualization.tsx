import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { experimentsApi } from '@/api/endpoints';
import { RefreshCw, Scale, Info, TrendingUp, TrendingDown, Minus, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export const FederatedComparisonVisualization: React.FC = () => {
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);

  // 1. Fetch Experiments
  const { data: expsRes, isLoading: expsLoading, isError: expsError } = useQuery({
    queryKey: ['ml-experiments'],
    queryFn: () => experimentsApi.listExperiments(),
    refetchInterval: 15000,
  });

  const experiments = expsRes?.data?.data || [];
  const completedExperiments = experiments.filter((e: any) => e.status === 'COMPLETED');
  
  const displayExpId = selectedExpId || (completedExperiments.length > 0 ? completedExperiments[0].experimentId : null);

  // 2. Fetch Comparison for selected experiment
  const { data: compRes, isLoading: compLoading, isError: compError } = useQuery({
    queryKey: ['ml-experiment-comparison', displayExpId],
    queryFn: () => experimentsApi.getComparison(displayExpId!),
    enabled: !!displayExpId,
    refetchInterval: false, // completed experiment won't change
  });

  const comparison = compRes?.data?.data;

  if (expsError) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-rose-500">
        Failed to load ML experiments from backend.
      </div>
    );
  }

  if (expsLoading) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-slate-500 flex flex-col items-center">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 opacity-50" />
        Loading comparative evaluation data...
      </div>
    );
  }

  if (completedExperiments.length === 0) {
    return (
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-slate-500">
        No completed ML experiments available for comparison.
      </div>
    );
  }

  const formatMetric = (val: number | undefined) => {
    if (val === undefined || val === null) return 'N/A';
    return (val % 1 === 0 ? val : val.toFixed(4));
  };

  const getDiffIndicator = (diff: number | undefined, isLoss: boolean = false) => {
    if (diff === undefined || diff === null) return null;
    const isPositive = diff > 0;
    const isNeutral = Math.abs(diff) < 0.0001;
    
    // For Loss, negative diff is good (lower loss). For F1/Accuracy, positive diff is good.
    const isGood = isNeutral ? null : (isLoss ? !isPositive : isPositive);

    if (isNeutral) return <Minus className="w-3 h-3 text-slate-400" />;
    return isPositive ? (
      <TrendingUp className={`w-3 h-3 ${isGood ? 'text-emerald-400' : 'text-rose-400'}`} />
    ) : (
      <TrendingDown className={`w-3 h-3 ${isGood ? 'text-emerald-400' : 'text-rose-400'}`} />
    );
  };

  // Prepare Chart Data
  const chartData: any[] = [];
  if (comparison && comparison.centralizedMetrics && comparison.federatedMetrics) {
    const keys = Array.from(new Set([...Object.keys(comparison.centralizedMetrics), ...Object.keys(comparison.federatedMetrics)]));
    keys.forEach(k => {
      // Exclude metrics that are vastly different scales if needed, but for F1, Accuracy, Loss it is fine.
      chartData.push({
        name: k.toUpperCase(),
        Centralized: comparison.centralizedMetrics[k] || 0,
        Federated: comparison.federatedMetrics[k] || 0,
      });
    });
  }

  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-slate-800/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-emerald-400" />
          Centralized ML vs Federated Learning
        </h2>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Evaluation</span>
          <select 
            value={displayExpId || ''}
            onChange={(e) => setSelectedExpId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[250px]"
          >
            {completedExperiments.map((e: any) => (
              <option key={e.experimentId} value={e.experimentId}>{e.name} (v{e.experimentId.substring(0,6)})</option>
            ))}
          </select>
        </div>
      </div>

      {compLoading ? (
        <div className="bg-slate-900/50 p-12 rounded-xl border border-slate-800 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
          Loading comparison metrics...
        </div>
      ) : compError || !comparison ? (
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-center text-rose-500">
          Failed to load comparison details.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Validity Warning */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <span className="font-bold text-blue-400 mr-2">Comparison Validity:</span>
              This evaluation compares Centralized ML and Federated Learning models trained on the same foundational dataset parameters. Results are directly comparable, but note that Federated Learning communication overhead represents a real-world architectural difference.
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* SIDE-BY-SIDE METRICS TABLE */}
            <div className="xl:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Evaluation Metrics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-medium w-1/4">Metric</th>
                      <th className="px-6 py-4 font-medium w-1/4">Centralized ML</th>
                      <th className="px-6 py-4 font-medium w-1/4">Federated Learning</th>
                      <th className="px-6 py-4 font-medium w-1/4">Observed Gap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {Object.keys(comparison.metricDifferences || {}).length > 0 ? (
                      Object.entries(comparison.metricDifferences).map(([metric, diff]: [string, any]) => {
                        const isLoss = metric.toLowerCase().includes('loss');
                        return (
                          <tr key={metric} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-slate-300 uppercase">{metric}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-300 font-mono">
                              {formatMetric(diff.centralizedMetric)}
                            </td>
                            <td className="px-6 py-4 text-slate-300 font-mono">
                              {formatMetric(diff.federatedMetric)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold font-mono ${diff.absoluteDifference === 0 ? 'text-slate-500' : (diff.absoluteDifference > 0 ? (isLoss ? 'text-rose-400' : 'text-emerald-400') : (isLoss ? 'text-emerald-400' : 'text-rose-400'))}`}>
                                  {diff.absoluteDifference > 0 ? '+' : ''}{formatMetric(diff.absoluteDifference)}
                                </span>
                                {getDiffIndicator(diff.absoluteDifference, isLoss)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                ({diff.relativeDifference > 0 ? '+' : ''}{formatMetric(diff.relativeDifference * 100)}%)
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          Comparison metrics unavailable from backend.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Training Architecture</h3>
                <div className="space-y-4">
                  <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Layers className="w-3 h-3"/> Centralized ML</div>
                    <div className="text-xs text-slate-300">Data merged at central server.</div>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded border border-slate-800 border-l-2 border-l-indigo-500">
                    <div className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Layers className="w-3 h-3"/> Federated Learning</div>
                    <div className="text-xs text-slate-300">Raw data remains at edge clients.</div>
                    {comparison.communicationInformation && (
                      <div className="mt-2 text-[10px] text-slate-500 font-mono">
                        {comparison.communicationInformation.rounds || 0} Rounds • {comparison.communicationInformation.participatingClients || 0} Clients
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 h-[250px] flex flex-col">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visual Metric Gap</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={5} />
                        <YAxis stroke="#64748b" fontSize={10} domain={[0, 1]} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                          labelStyle={{ fontSize: '12px', color: '#94a3b8' }}
                          cursor={{fill: '#1e293b', opacity: 0.4}}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="Centralized" fill="#64748b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Federated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
