import React from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { CheckCircle, BarChart2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mlModelApi } from '@/api/mlModelApi';

interface ModelRegistryViewProps {
  onSelectModel: (modelId: string) => void;
}

export const ModelRegistryView: React.FC<ModelRegistryViewProps> = ({ onSelectModel }) => {
  const queryClient = useQueryClient();

  const { data: modelsRes, isLoading } = useQuery({
    queryKey: ['ml-models'],
    queryFn: () => mlModelApi.getModels().then(res => res.data),
    refetchInterval: 10000
  });

  const models = modelsRes?.data || [];

  const activateMutation = useMutation({
    mutationFn: (modelId: string) => mlModelApi.activateModel(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-models'] });
    }
  });

  const handleActivate = (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to activate this model? It will archive the current active model.")) {
      activateMutation.mutate(modelId);
    }
  };

  if (isLoading) {
    return <div className="text-slate-500 font-mono p-4">Loading models...</div>;
  }

  return (
    <Card className="bg-slate-900/70 border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
            <tr>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Algorithm</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Macro F1</th>
              <th className="px-4 py-3">Accuracy</th>
              <th className="px-4 py-3">Training Size</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center p-8 text-slate-500 border-b border-slate-800 border-dashed">
                  No models trained yet.
                </td>
              </tr>
            )}
            {models.map((model: any) => (
              <tr 
                key={model.modelId} 
                className={`border-b border-slate-800 hover:bg-slate-800/30 cursor-pointer transition-colors ${model.isActive ? 'bg-indigo-500/5' : ''}`}
                onClick={() => onSelectModel(model.modelId)}
              >
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-200">{model.modelName}</div>
                  <div className="text-[10px] font-mono text-slate-500">v{model.version}</div>
                </td>
                <td className="px-4 py-3 text-xs font-mono">{model.algorithm}</td>
                <td className="px-4 py-3">
                  {model.isActive ? (
                    <Badge variant="success" className="animate-pulse">ACTIVE</Badge>
                  ) : model.status === 'ARCHIVED' ? (
                    <Badge variant="outline" className="text-slate-500">ARCHIVED</Badge>
                  ) : model.status === 'EVALUATED' || model.status === 'VALIDATED' ? (
                    <Badge variant="accent">READY</Badge>
                  ) : (
                    <Badge variant="warning">{model.status}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-emerald-400">
                  {model.metrics?.macroF1 ? (model.metrics.macroF1 * 100).toFixed(2) + '%' : '-'}
                </td>
                <td className="px-4 py-3 font-mono text-blue-400">
                  {model.metrics?.accuracy ? (model.metrics.accuracy * 100).toFixed(2) + '%' : '-'}
                </td>
                <td className="px-4 py-3 font-mono text-slate-400">{model.trainingSamples}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {!model.isActive && (model.status === 'EVALUATED' || model.status === 'VALIDATED') && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={(e) => handleActivate(model.modelId, e)}
                        disabled={activateMutation.isPending}
                        className="text-xs flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" /> Activate
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="primary"
                      onClick={(e) => { e.stopPropagation(); onSelectModel(model.modelId); }}
                      className="text-xs flex items-center gap-1"
                    >
                      <BarChart2 className="w-3 h-3" /> Details
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
