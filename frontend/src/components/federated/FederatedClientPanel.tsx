import React from 'react';
import { Cpu, XCircle, Clock, Database, BarChart2, CheckCircle, RefreshCw } from 'lucide-react';

interface FederatedClientPanelProps {
  client: any;
  onClose?: () => void;
}

export const FederatedClientPanel: React.FC<FederatedClientPanelProps> = ({ client, onClose }) => {
  if (!client) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center h-full text-slate-500 min-h-[600px]">
        <Cpu className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a federated client</p>
        <p className="text-xs mt-2 text-center">View client training state, local datasets, and recent metrics.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE' || status === 'TRAINING') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{status}</span>;
    if (status === 'IDLE' || status === 'READY') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">{status}</span>;
    if (status === 'OFFLINE' || status === 'FAILED') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">{status || 'UNKNOWN'}</span>;
  };

  const getTrainingStatusBadge = (status: string) => {
    if (status === 'TRAINING') return <span className="flex items-center gap-1 text-indigo-400 font-bold"><RefreshCw className="w-3 h-3 animate-spin"/> {status}</span>;
    if (status === 'COMPLETED') return <span className="flex items-center gap-1 text-emerald-400 font-bold"><CheckCircle className="w-3 h-3"/> {status}</span>;
    if (status === 'FAILED') return <span className="flex items-center gap-1 text-rose-400 font-bold"><XCircle className="w-3 h-3"/> {status}</span>;
    return <span className="text-slate-400 font-bold">{status}</span>;
  };

  const formatTime = (ts: string) => {
    if (!ts) return 'N/A';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700 shadow-2xl flex flex-col h-[700px] overflow-hidden">
      
      {/* HEADER / IDENTITY */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="p-2.5 bg-slate-700/50 rounded-lg">
            <Cpu className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{client.clientName}</h2>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-xs text-slate-400 font-mono truncate max-w-[150px]" title={client.clientId}>{client.clientId}</span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400">
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* OVERVIEW BAR */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-800 bg-slate-900/50">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</div>
          <div>{getStatusBadge(client.status)}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Training State</div>
          <div className="text-sm">{getTrainingStatusBadge(client.trainingStatus)}</div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* MODEL INFORMATION */}
        <section>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Local Model & Data
          </h3>
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
              <span className="text-xs text-slate-400">Dataset ID</span>
              <span className="text-xs font-mono text-slate-300 truncate max-w-[150px]" title={client.localDatasetId}>
                {client.localDatasetId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
              <span className="text-xs text-slate-400">Sample Count</span>
              <span className="text-xs font-mono text-slate-300">{client.sampleCount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
              <span className="text-xs text-slate-400">Model Version</span>
              <span className="text-xs font-mono text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded">v{client.modelVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Feature Version</span>
              <span className="text-xs font-mono text-slate-300 bg-slate-700/50 px-1.5 py-0.5 rounded">v{client.featureVersion}</span>
            </div>
          </div>
        </section>

        {/* TIMESTAMPS */}
        <section>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Activity Timeline
          </h3>
          <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-800 space-y-3">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Last Training Time</div>
              <div className="text-sm text-slate-300 font-mono">{formatTime(client.lastTrainingTime)}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Registered At</div>
                <div className="text-xs text-slate-400 font-mono">{formatTime(client.createdAt)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Last Updated</div>
                <div className="text-xs text-slate-400 font-mono">{formatTime(client.updatedAt)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* LOCAL METRICS */}
        <section>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            Local Training Metrics
          </h3>
          
          {!client.localMetrics || Object.keys(client.localMetrics).length === 0 ? (
            <div className="text-sm text-slate-500 italic bg-slate-800/30 p-4 rounded-lg border border-slate-800 text-center">
              No local metrics available yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(client.localMetrics).map(([key, value]) => (
                <div key={key} className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase mb-1">{key}</div>
                  <div className="text-lg font-bold text-slate-200">
                    {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(4)) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
      
      {/* FOOTER QUICK LINKS */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/30">
        <div className="grid grid-cols-1 gap-2">
          <a href="/ml" className="flex justify-center items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] py-2 rounded transition-colors uppercase tracking-wider">
            View Central Machine Learning Dashboard
          </a>
        </div>
      </div>
      
    </div>
  );
};
