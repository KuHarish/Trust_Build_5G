import React, { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Play, Activity, Clock, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mlModelApi } from '@/api/mlModelApi';
import { mlApi } from '@/api/mlApi';

export const ModelTrainingView: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [modelName, setModelName] = useState('RF-IDS-v1');
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState<number | ''>('');
  
  const { data: datasetsRes } = useQuery({
    queryKey: ['ml-datasets'],
    queryFn: () => mlApi.getDatasets().then(res => res.data)
  });
  
  const { data: jobsRes } = useQuery({
    queryKey: ['ml-jobs'],
    queryFn: () => mlModelApi.getJobs().then(res => res.data),
    refetchInterval: 5000 // Poll every 5s
  });

  const datasets = datasetsRes?.data || [];
  const readyDatasets = datasets.filter((d: any) => d.status === 'READY');
  const jobs = jobsRes?.data || [];
  const activeJobs = jobs.filter((j: any) => j.status === 'PENDING' || j.status === 'IN_PROGRESS');

  const trainMutation = useMutation({
    mutationFn: (data: any) => mlModelApi.trainModel(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-jobs'] });
    }
  });

  const handleTrain = () => {
    if (!selectedDataset) return;
    trainMutation.mutate({
      datasetId: selectedDataset,
      modelName,
      description: "Random Forest Baseline",
      parameters: {
        n_estimators: nEstimators,
        max_depth: maxDepth === '' ? null : maxDepth,
        random_state: 42
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-slate-900/70 border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Train New Model</h3>
        
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Dataset</label>
          <select 
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
          >
            <option value="">Select a processed dataset...</option>
            {readyDatasets.map((d: any) => (
              <option key={d.datasetId} value={d.datasetId}>{d.name} v{d.version}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Model Name</label>
          <input 
            type="text" 
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">n_estimators</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300"
              value={nEstimators}
              onChange={(e) => setNEstimators(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">max_depth</label>
            <input 
              type="number" 
              placeholder="None"
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300"
              value={maxDepth}
              onChange={(e) => setMaxDepth(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>

        <Button 
          onClick={handleTrain} 
          disabled={!selectedDataset || trainMutation.isPending || activeJobs.length > 0} 
          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
        >
          <Play className="w-4 h-4 mr-2" /> Start Training Job
        </Button>
      </Card>

      <Card className="bg-slate-900/70 border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2">Active Jobs</h3>
        {activeJobs.length === 0 ? (
          <div className="text-slate-500 text-sm font-mono text-center p-8 bg-slate-950/50 rounded-lg border border-slate-800 border-dashed">
            No training jobs running.
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job: any) => (
              <div key={job.jobId} className="p-4 bg-slate-950 rounded-lg border border-indigo-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-indigo-400">{job.currentStep}</span>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Activity className="w-3 h-3 animate-pulse text-emerald-500" />
                    {job.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }}></div>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-3">
                  <Clock className="w-3 h-3" /> {new Date(job.startedAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 mt-6">Recent History</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {jobs.filter((j: any) => j.status === 'COMPLETED' || j.status === 'FAILED').map((job: any) => (
            <div key={job.jobId} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-slate-400 truncate w-32">{job.modelId.split('-')[0]}...</span>
              {job.status === 'COMPLETED' ? (
                <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">COMPLETED</span>
              ) : (
                <span className="text-xs text-rose-500 bg-rose-500/10 px-2 py-1 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> FAILED
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
