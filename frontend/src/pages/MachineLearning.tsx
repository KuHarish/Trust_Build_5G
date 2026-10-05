import React, { useState } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Database, Plus, Settings, Play, CheckCircle, AlertTriangle, Cpu, List } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mlApi, DatasetProcessRequest } from '@/api/mlApi';
import { DatasetVisualizations } from '@/components/ml/DatasetVisualizations';
import { ModelTrainingView } from '@/components/ml/ModelTrainingView';
import { ModelRegistryView } from '@/components/ml/ModelRegistryView';
import { PerformanceDashboard } from '@/components/ml/PerformanceDashboard';
import { FederatedDashboard } from '@/components/federated/FederatedDashboard';
import { ExperimentDashboard } from '@/components/ml/ExperimentDashboard';
import { RealTimeInferenceView } from '@/components/ml/RealTimeInferenceView';
import { Network, Activity, Zap } from 'lucide-react';

export const MachineLearning: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'DATASETS' | 'TRAINING' | 'REGISTRY' | 'FEDERATED' | 'EXPERIMENTS' | 'INFERENCE'>('DATASETS');
  
  // Datasets state
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  const { data: datasetsRes, isLoading: datasetsLoading } = useQuery({
    queryKey: ['ml-datasets'],
    queryFn: () => mlApi.getDatasets().then(res => res.data)
  });

  const datasets = datasetsRes?.data || [];
  const selectedDataset = datasets.find((d: any) => d.datasetId === selectedDatasetId);

  const registerMutation = useMutation({
    mutationFn: (data: any) => mlApi.registerDataset(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-datasets'] });
    }
  });

  const processMutation = useMutation({
    mutationFn: ({ id, config }: { id: string, config: DatasetProcessRequest }) => 
      mlApi.processDataset(id, config).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-datasets'] });
    }
  });

  const handleRegisterDummy = () => {
    registerMutation.mutate({
      name: "CICIDS2017-DDoS",
      description: "Intrusion Detection Evaluation Dataset (Friday DDoS)",
      source: "Canadian Institute for Cybersecurity",
      filePath: "cicids2017/MachineLearningCVE/Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
      format: "CSV",
      labelColumn: " Label"
    });
  };

  const handleProcess = () => {
    if (!selectedDatasetId) return;
    processMutation.mutate({
      id: selectedDatasetId,
      config: {
        removeDuplicates: true,
        encodeCategorical: true,
        scaleNumerical: true,
        scalerType: "StandardScaler",
        testSize: 0.15,
        valSize: 0.15
      }
    });
  };

  const handleModelSelect = (id: string) => {
    setSelectedModelId(id);
    // Open details modal or just show inline. We can show it inline below registry.
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Machine Learning Engine" 
        subtitle="End-to-End IDS Model Pipeline & Registry"
      />

      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 w-fit">
        <button 
          onClick={() => setActiveTab('DATASETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'DATASETS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Database className="w-4 h-4" /> Datasets
        </button>
        <button 
          onClick={() => setActiveTab('TRAINING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'TRAINING' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Cpu className="w-4 h-4" /> Model Training
        </button>
        <button 
          onClick={() => { setActiveTab('REGISTRY'); setSelectedModelId(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'REGISTRY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <List className="w-4 h-4" /> Registry
        </button>
        <button 
          onClick={() => setActiveTab('FEDERATED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'FEDERATED' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Network className="w-4 h-4" /> Federated Learning
        </button>
        <button 
          onClick={() => setActiveTab('EXPERIMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'EXPERIMENTS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Activity className="w-4 h-4" /> Experiments
        </button>
        <button 
          onClick={() => setActiveTab('INFERENCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'INFERENCE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Zap className="w-4 h-4" /> Inference
        </button>
      </div>

      {activeTab === 'DATASETS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3 text-slate-300">
              <Database className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold">Registered Datasets</h2>
            </div>
            <Button onClick={handleRegisterDummy} disabled={registerMutation.isPending} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Register Local Dataset
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {datasetsLoading && <p className="text-slate-500">Loading datasets...</p>}
              {datasets.map((d: any) => (
                <Card 
                  key={d.datasetId} 
                  className={`cursor-pointer transition-all border ${selectedDatasetId === d.datasetId ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                  onClick={() => setSelectedDatasetId(d.datasetId)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-md font-bold text-slate-200">{d.name}</h3>
                      <p className="text-xs text-slate-400">{d.description}</p>
                    </div>
                    {d.status === 'READY' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : d.status === 'FAILED' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                    ) : d.status === 'PROCESSING' ? (
                      <Settings className="w-5 h-5 text-amber-500 animate-spin" />
                    ) : (
                      <Database className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                    <div>Rows: {d.rowCount || 'Unknown'}</div>
                    <div>Feat: {d.featureCount || 'Unknown'}</div>
                  </div>
                  <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
                    Status: <span className={d.status === 'READY' ? 'text-emerald-400' : 'text-slate-300'}>{d.status}</span>
                  </div>
                </Card>
              ))}
              {datasets.length === 0 && !datasetsLoading && (
                <div className="text-center p-8 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500">
                  No datasets registered yet.
                </div>
              )}
            </div>

            <div className="col-span-2">
              {selectedDataset ? (
                <div className="space-y-6">
                  <Card className="bg-slate-900/70 border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedDataset.name} <span className="text-sm font-normal text-slate-500">v{selectedDataset.version}</span></h2>
                        <div className="text-xs font-mono text-slate-400 mt-1">Source: {selectedDataset.filePath}</div>
                      </div>
                      <Button 
                        onClick={handleProcess} 
                        disabled={processMutation.isPending || selectedDataset.status === 'PROCESSING'}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Play className="w-4 h-4 mr-2" /> 
                        {processMutation.isPending ? 'Processing...' : 'Run ML Pipeline'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 font-mono text-sm mb-6">
                      <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                        <div className="text-slate-500 text-xs mb-1 uppercase">Total Samples</div>
                        <div className="text-emerald-400 text-lg">{selectedDataset.rowCount}</div>
                      </div>
                      <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                        <div className="text-slate-500 text-xs mb-1 uppercase">Features</div>
                        <div className="text-blue-400 text-lg">{selectedDataset.featureCount}</div>
                      </div>
                      <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                        <div className="text-slate-500 text-xs mb-1 uppercase">Classes</div>
                        <div className="text-purple-400 text-lg">{selectedDataset.classCount}</div>
                      </div>
                    </div>

                    <DatasetVisualizations dataset={selectedDataset} />

                  </Card>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500">
                  Select a dataset to view preprocessing details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'TRAINING' && (
        <ModelTrainingView />
      )}

      {activeTab === 'REGISTRY' && (
        <div className="space-y-6">
          <ModelRegistryView onSelectModel={handleModelSelect} />
          {selectedModelId && (
            <PerformanceDashboard modelId={selectedModelId} />
          )}
        </div>
      )}

      {activeTab === 'FEDERATED' && (
        <FederatedDashboard />
      )}

      {activeTab === 'EXPERIMENTS' && (
        <ExperimentDashboard />
      )}

      {activeTab === 'INFERENCE' && (
        <RealTimeInferenceView />
      )}

    </div>
  );
};
