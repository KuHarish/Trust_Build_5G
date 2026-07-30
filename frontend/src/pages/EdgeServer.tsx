import React, { useState } from 'react';
import { EdgeSummaryCards, LiveTrafficTable, ExtractedFeaturesTable, EdgeVisualizations } from '@/components/edge';
import { Server, Activity, Cpu, ShieldCheck } from 'lucide-react';

export const EdgeServer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'features'>('live');

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Module Banner & Title */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800/90 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-widest bg-indigo-600/30 text-indigo-300 rounded border border-indigo-500/50 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" /> MODULE 2: EDGE SERVER & FEATURE EXTRACTION
              </span>
              <span className="px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-widest bg-emerald-600/20 text-emerald-300 rounded border border-emerald-500/40 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> 5G INGESTION ONLINE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Edge Traffic Intelligence & Preprocessing Engine
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Ingests live communication events from simulated 5G network nodes, calculates geographical RF attenuation via the Haversine formula, and mathematically synthesizes zero-to-one normalized feature tensors for downstream AI/ML and Adaptive Trust evaluation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 shadow-inner shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Downstream Pipeline:</span>
            </div>
            <span className="text-indigo-300 font-bold">MOD 3 & MOD 4 Ready</span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <EdgeSummaryCards />

      {/* Interactive Visualizations */}
      <EdgeVisualizations />

      {/* Navigation Tab Switcher */}
      <div className="pt-2">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-lg ${
              activeTab === 'live'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-indigo-900/30 font-bold'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Activity className={`w-4 h-4 ${activeTab === 'live' ? 'text-white' : 'text-indigo-400'}`} />
            Live Communication Stream
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-lg ${
              activeTab === 'features'
                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-indigo-900/30 font-bold'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Cpu className={`w-4 h-4 ${activeTab === 'features' ? 'text-white' : 'text-purple-400'}`} />
            Extracted Feature Tensors
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'live' ? <LiveTrafficTable /> : <ExtractedFeaturesTable />}
    </div>
  );
};
