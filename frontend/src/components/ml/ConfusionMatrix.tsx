import React from 'react';

interface ConfusionMatrixProps {
  data: {
    classes: string[];
    raw_matrix: number[][];
    normalized_matrix: number[][];
  };
}

export const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ data }) => {
  if (!data || !data.classes || data.classes.length === 0) {
    return <div className="text-slate-500 p-4 text-center border border-slate-800 border-dashed rounded-lg bg-slate-900/30">Confusion Matrix data not available.</div>;
  }

  const { classes, raw_matrix, normalized_matrix } = data;

  // Determine max value for color scaling (excluding diagonal if we want to highlight errors, but usually we just scale on the max normalized value which is 1.0)
  
  const getColor = (val: number) => {
    // val is between 0 and 1
    // Let's use a purple/indigo scale
    if (val === 0) return 'bg-slate-900 text-slate-600';
    if (val < 0.1) return 'bg-indigo-900/40 text-slate-400';
    if (val < 0.4) return 'bg-indigo-800/60 text-slate-300';
    if (val < 0.7) return 'bg-indigo-600/80 text-slate-200';
    return 'bg-indigo-500 text-white font-bold';
  };

  return (
    <div className="overflow-x-auto p-2">
      <div className="flex items-center justify-center mb-4 text-xs font-mono text-slate-400 uppercase tracking-widest">
        Predicted Class &rarr;
      </div>
      <div className="flex">
        <div className="flex flex-col justify-center mr-4 text-xs font-mono text-slate-400 uppercase tracking-widest writing-vertical-rl rotate-180">
          &larr; True Class
        </div>
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {classes.map(c => (
                <th key={`head-${c}`} className="p-2 text-xs font-mono text-slate-400 truncate max-w-[80px]" title={c}>
                  {c.length > 10 ? c.substring(0,8) + '..' : c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((c, i) => (
              <tr key={`row-${c}`}>
                <th className="p-2 text-xs font-mono text-slate-400 text-right truncate max-w-[100px]" title={c}>
                  {c.length > 12 ? c.substring(0,10) + '..' : c}
                </th>
                {classes.map((_, j) => {
                  const raw = raw_matrix[i][j];
                  const norm = normalized_matrix[i][j];
                  return (
                    <td key={`cell-${i}-${j}`} className="p-1">
                      <div 
                        className={`w-14 h-14 flex flex-col items-center justify-center rounded border border-slate-800 transition-colors ${getColor(norm)}`}
                        title={`True: ${classes[i]} -> Pred: ${classes[j]} | Count: ${raw}`}
                      >
                        <span className="text-sm">{raw}</span>
                        <span className="text-[9px] opacity-70">{(norm * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
