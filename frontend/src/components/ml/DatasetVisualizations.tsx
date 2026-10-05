import React from 'react';

interface DatasetVisualizationsProps {
  dataset: any;
}

export const DatasetVisualizations: React.FC<DatasetVisualizationsProps> = ({ dataset }) => {
  if (!dataset || dataset.status !== 'READY') {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-sm border border-slate-800 border-dashed rounded-xl bg-slate-900/30">
        Pipeline execution required to generate distribution visuals.
      </div>
    );
  }

  // We could use Recharts here if we had detailed classDistribution stats saved 
  // in the dataset object. For now we will render a placeholder table or simple bar.
  
  const classDist = dataset.classDistribution || {};
  const entries = Object.entries(classDist);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Class Distribution</h3>
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map(([cls, count]: [string, any]) => (
            <div key={cls} className="flex items-center text-xs font-mono">
              <div className="w-32 text-slate-400 truncate pr-2">{cls}</div>
              <div className="flex-1 bg-slate-800 h-4 rounded overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full" 
                  style={{ width: `${Math.max(1, (count / dataset.rowCount) * 100)}%` }}
                />
              </div>
              <div className="w-16 text-right text-slate-300">{count}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm">Class distribution data unavailable.</p>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
          <h4 className="text-xs font-mono text-slate-500 mb-2">Training Split</h4>
          <div className="text-lg text-emerald-400 font-bold">{dataset.trainingSamples || 'N/A'} <span className="text-sm text-slate-500 font-normal">samples</span></div>
        </div>
        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
          <h4 className="text-xs font-mono text-slate-500 mb-2">Validation / Test</h4>
          <div className="text-lg text-blue-400 font-bold">{dataset.validationSamples || 0} / {dataset.testingSamples || 0}</div>
        </div>
      </div>
    </div>
  );
};
