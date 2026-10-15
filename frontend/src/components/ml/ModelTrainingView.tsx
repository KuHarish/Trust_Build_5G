import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Play, Activity, Clock, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mlModelApi } from '@/api/mlModelApi';
import { mlApi } from '@/api/mlApi';

interface ModelTrainingViewProps {
  initialDatasetId?: string;
  onNavigateToDatasets?: () => void;
}

export const ModelTrainingView: React.FC<ModelTrainingViewProps> = ({ initialDatasetId, onNavigateToDatasets }) => {
  const queryClient = useQueryClient();
  const [selectedDataset, setSelectedDataset] = useState<string>(initialDatasetId || '');
  const [modelName, setModelName] = useState('RF-IDS-v1');
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState<number | ''>('');
  
  const { data: datasetsRes, isLoading: datasetsLoading } = useQuery({
    queryKey: ['ml-datasets'],
    queryFn: () => mlApi.getDatasets().then(res => res.data)
  });
  
  const { data: jobsRes } = useQuery({
    queryKey: ['ml-jobs'],
    queryFn: () => mlModelApi.getJobs().then(res => res.data),
    refetchInterval: 3000 // Poll every 3s
  });

  const datasets = datasetsRes?.data || [];
  const readyDatasets = datasets.filter((d: any) => d.status === 'READY');
  const unreadyDatasets = datasets.filter((d: any) => d.status !== 'READY');
  const currentDataset = datasets.find((d: any) => d.datasetId === selectedDataset);
  const isSelectedReady = currentDataset?.status === 'READY';

  const jobs = jobsRes?.data || [];
  const activeJobs = jobs.filter((j: any) => j.status === 'PENDING' || j.status === 'IN_PROGRESS');

  // Auto-select dataset when available
  useEffect(() => {
    if (initialDatasetId && datasets.some((d: any) => d.datasetId === initialDatasetId)) {
      setSelectedDataset(initialDatasetId);
    } else if (!selectedDataset) {
      if (readyDatasets.length > 0) {
        setSelectedDataset(readyDatasets[0].datasetId);
      } else if (datasets.length > 0) {
        setSelectedDataset(datasets[0].datasetId);
      }
    }
  }, [initialDatasetId, datasets, readyDatasets.length, selectedDataset]);

  const trainMutation = useMutation({
    mutationFn: (data: any) => mlModelApi.trainModel(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
    }
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => 
      mlApi.processDataset(id, {
        removeDuplicates: true,
        encodeCategorical: true,
        scaleNumerical: true,
        scalerType: "StandardScaler",
        testSize: 0.15,
        valSize: 0.15
      }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-datasets'] });
    }
  });

  const handleTrain = () => {
    if (!selectedDataset || !isSelectedReady) return;
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
        <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
          <span>Train New Model</span>
          {isSelectedReady && (
            <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Ready to Train
            </span>
          )}
        </h3>
        
        {datasets.length === 0 && !datasetsLoading && (
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-center space-y-3">
            <p className="text-slate-400 text-sm">No datasets registered yet.</p>
            {onNavigateToDatasets && (
              <Button onClick={onNavigateToDatasets} className="bg-indigo-600 hover:bg-indigo-700 text-xs flex items-center gap-1.5 mx-auto">
                <Database className="w-3.5 h-3.5" /> Go to Datasets to Register
              </Button>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Dataset</label>
          <select 
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
          >
            <option value="">-- Choose a Dataset --</option>
            {readyDatasets.length > 0 && (
              <optgroup label="Ready for Training">
                {readyDatasets.map((d: any) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.name} v{d.version} ({d.rowCount ? `${d.rowCount.toLocaleString()} samples` : 'Ready'})
                  </option>
                ))}
              </optgroup>
            )}
            {unreadyDatasets.length > 0 && (
              <optgroup label="Needs Preprocessing">
                {unreadyDatasets.map((d: any) => (
                  <option key={d.datasetId} value={d.datasetId}>
                    {d.name} v{d.version} ({d.status} - Unprocessed)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Notice for unready dataset */}
        {currentDataset && !isSelectedReady && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>Dataset status is <strong>{currentDataset.status}</strong>. Preprocess it first to generate splits.</span>
            </div>
            <Button
              onClick={() => processMutation.mutate(currentDataset.datasetId)}
              disabled={processMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1 flex items-center gap-1 flex-shrink-0"
            >
              <Play className="w-3 h-3" />
              {processMutation.isPending ? 'Processing...' : 'Preprocess Now'}
            </Button>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Model Name</label>
          <input 
            type="text" 
            className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">n_estimators</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              value={nEstimators}
              onChange={(e) => setNEstimators(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">max_depth</label>
            <input 
              type="number" 
              placeholder="None (Full Depth)"
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              value={maxDepth}
              onChange={(e) => setMaxDepth(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>

        {trainMutation.isError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Failed to start training: {(trainMutation.error as any)?.response?.data?.detail || (trainMutation.error as any)?.message || 'Unknown error'}</span>
          </div>
        )}

        {trainMutation.isSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Training job queued successfully! Real-time progress is shown on the right.</span>
          </div>
        )}

        <Button 
          onClick={handleTrain} 
          disabled={!selectedDataset || !isSelectedReady || trainMutation.isPending || activeJobs.length > 0} 
          className={`w-full mt-4 flex items-center justify-center gap-2 font-medium transition-all ${
            !selectedDataset || !isSelectedReady || activeJobs.length > 0
              ? 'bg-slate-800 text-slate-400 border border-slate-700' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30'
          }`}
        >
          {trainMutation.isPending ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Queueing Training Job...</span>
            </>
          ) : activeJobs.length > 0 ? (
            <>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Training Job In Progress...</span>
            </>
          ) : !selectedDataset ? (
            <>
              <Play className="w-4 h-4 text-slate-500" />
              <span>Select a Dataset to Train</span>
            </>
          ) : !isSelectedReady ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Preprocess Dataset Before Training</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-white fill-current" />
              <span>Start Training Job</span>
            </>
          )}
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
