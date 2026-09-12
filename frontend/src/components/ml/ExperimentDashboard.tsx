import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { mlApi } from '../../api/mlApi';
import { experimentApi } from '../../api/experimentApi';
import { Activity, Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ExperimentDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);

  const { data: expsData, isLoading: expsLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: () => experimentApi.listExperiments().then(res => res.data)
  });

  const { data: comparisonData, isLoading: compLoading } = useQuery({
    queryKey: ['experimentComparison', selectedExpId],
    queryFn: () => experimentApi.getComparison(selectedExpId!).then(res => res.data),
    enabled: !!selectedExpId
  });

  const { data: datasetsRes } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => mlApi.getDatasets().then(res => res.data)
  });
  
  const datasets = datasetsRes?.data || [];
  const experiments = expsData?.data || [];

  const createExpMutation = useMutation({
    mutationFn: (data: any) => experimentApi.createExperiment(data).then(res => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      runExpMutation.mutate(data.data.experimentId);
    }
  });

  const runExpMutation = useMutation({
    mutationFn: (id: string) => experimentApi.runExperiment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
    }
  });

  const handleCreateMockExperiment = () => {
    // Ideally we would select models from dropdown, but we will use dummy logic to find a centralized and federated model for a dataset
    createExpMutation.mutate({
      name: "Comparative Analysis " + Math.floor(Math.random() * 100),
      description: "Comparing RF vs FedAvg",
      datasetId: datasets.length > 0 ? datasets[0].datasetId : "N/A",
      centralizedModelId: "centralized-model", // Replace with real dropdown select
      federatedModelId: "federated-model" // Replace with real dropdown select
    });
  };

  const renderComparisonChart = () => {
    if (!comparisonData?.data?.metricDifferences) return null;
    const diffs = comparisonData.data.metricDifferences;
    const chartData = Object.keys(diffs).map(k => ({
      metric: k,
      Centralized: diffs[k].centralizedMetric,
      Federated: diffs[k].federatedMetric
    })).filter(d => !d.metric.includes("time") && !d.metric.includes("latency"));

    return (
      <div className="h-64 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="metric" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
            <Legend />
            <Bar dataKey="Centralized" fill="#6366f1" />
            <Bar dataKey="Federated" fill="#14b8a6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3 text-slate-300">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold">ML Comparative Experiments</h2>
        </div>
        <Button onClick={handleCreateMockExperiment} disabled={createExpMutation.isPending} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Experiment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4 max-h-[800px] overflow-y-auto pr-2">
          {expsLoading && <p className="text-slate-500">Loading experiments...</p>}
          {experiments.map((e: any) => (
            <Card 
              key={e.experimentId} 
              className={`cursor-pointer transition-all border ${selectedExpId === e.experimentId ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
              onClick={() => setSelectedExpId(e.experimentId)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-md font-bold text-slate-200">{e.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">C: {e.centralizedModelId}</p>
                  <p className="text-xs text-slate-400">F: {e.federatedModelId}</p>
                </div>
                {e.status === 'COMPLETED' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-500 animate-spin" />
                )}
              </div>
            </Card>
          ))}
          {experiments.length === 0 && !expsLoading && (
            <div className="text-center p-8 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500">
              No experiments run yet.
            </div>
          )}
        </div>

        <div className="col-span-2">
          {selectedExpId && comparisonData?.success ? (
            <Card className="bg-slate-900/70 border-slate-800">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                <h2 className="text-xl font-bold text-white">Experiment Results</h2>
                <Button className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                  <FileText className="w-4 h-4 mr-2" /> Export JSON
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Centralized Model</h3>
                  <div className="bg-slate-950 rounded p-3 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                    {Object.entries(comparisonData.data.centralizedMetrics || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}:</span>
                        <span className="text-indigo-400">{(v as number).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Federated Model</h3>
                  <div className="bg-slate-950 rounded p-3 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                    {Object.entries(comparisonData.data.federatedMetrics || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}:</span>
                        <span className="text-teal-400">{(v as number).toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {renderComparisonChart()}

              {comparisonData.data.communicationInformation && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Federated Communication Info</h3>
                  <div className="bg-slate-950 rounded p-3 border border-slate-800 text-xs font-mono text-slate-400">
                    <pre>{JSON.stringify(comparisonData.data.communicationInformation, null, 2)}</pre>
                  </div>
                </div>
              )}
            </Card>
          ) : selectedExpId && compLoading ? (
            <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500">
              Loading comparison...
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500">
              Select an experiment to view comparison details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
