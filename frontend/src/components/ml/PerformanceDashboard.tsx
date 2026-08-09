import React from 'react';
import { Card } from '@/components/common/Card';
import { useQuery } from '@tanstack/react-query';
import { mlModelApi } from '@/api/mlModelApi';
import { ConfusionMatrix } from './ConfusionMatrix';

interface PerformanceDashboardProps {
  modelId: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ modelId }) => {

  const { data: modelRes, isLoading: modelLoading } = useQuery({
    queryKey: ['ml-model', modelId],
    queryFn: () => mlModelApi.getModel(modelId).then(res => res.data)
  });

  const { data: cmRes, isLoading: cmLoading } = useQuery({
    queryKey: ['ml-model-cm', modelId],
    queryFn: () => mlModelApi.getConfusionMatrix(modelId).then(res => res.data),
    enabled: !!modelId
  });

  if (modelLoading || cmLoading) {
    return <div className="text-slate-500 font-mono p-8 text-center animate-pulse">Loading model performance metrics...</div>;
  }

  const model = modelRes?.data;
  const metrics = model?.metrics || {};
  const perClass = metrics.perClass || {};
  const cmData = cmRes;

  return (
    <div className="space-y-6 mt-6 border-t border-slate-800 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Model Evaluation</h2>
          <p className="text-xs text-slate-500 font-mono">Detailed performance analysis on holdout test set.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Accuracy</div>
          <div className="text-3xl font-bold text-blue-400">{(metrics.accuracy * 100).toFixed(2)}%</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Macro F1</div>
          <div className="text-3xl font-bold text-emerald-400">{(metrics.macroF1 * 100).toFixed(2)}%</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Weighted F1</div>
          <div className="text-3xl font-bold text-indigo-400">{(metrics.weightedF1 * 100).toFixed(2)}%</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-center items-center">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">ROC-AUC</div>
          <div className="text-3xl font-bold text-purple-400">{metrics.rocAuc ? (metrics.rocAuc).toFixed(4) : 'N/A'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/70 border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Confusion Matrix</h3>
          <ConfusionMatrix data={cmData} />
        </Card>

        <Card className="bg-slate-900/70 border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Class Performance</h3>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[10px] font-mono text-slate-500 uppercase bg-slate-950 sticky top-0">
                <tr>
                  <th className="px-2 py-2">Class</th>
                  <th className="px-2 py-2">Precision</th>
                  <th className="px-2 py-2">Recall</th>
                  <th className="px-2 py-2">F1</th>
                  <th className="px-2 py-2">Support</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono">
                {Object.entries(perClass).map(([cls, stat]: [string, any]) => (
                  <tr key={cls} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-2 py-2 truncate max-w-[120px]" title={cls}>{cls}</td>
                    <td className="px-2 py-2 text-indigo-300">{(stat.precision * 100).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-blue-300">{(stat.recall * 100).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-emerald-300">{(stat.f1 * 100).toFixed(1)}%</td>
                    <td className="px-2 py-2 text-slate-500">{stat.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
