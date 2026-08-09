import React, { useState } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Database, Plus, Settings, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mlApi, DatasetProcessRequest } from '@/api/mlApi';
import { DatasetVisualizations } from '@/components/ml/DatasetVisualizations';

export const MachineLearning: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  
  const { data: datasetsRes, isLoading } = useQuery({
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
      name: "CICIDS2017",
      description: "Intrusion Detection Evaluation Dataset",
      source: "Canadian Institute for Cybersecurity",
      filePath: "cicids2017.csv",
      format: "CSV",
      labelColumn: "Label"
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Machine Learning Pipeline" 
        subtitle="Dataset Registration, Preprocessing & Feature Management"
      />

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
        <div className="col-span-1 space-y-4">
          {isLoading && <p className="text-slate-500">Loading datasets...</p>}
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
          {datasets.length === 0 && !isLoading && (
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
  );
};
