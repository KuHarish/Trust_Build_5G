import React from 'react';
import { ExtractedFeatureItem } from '../../types/dashboard';
import { Cpu } from 'lucide-react';

interface Props {
  features: ExtractedFeatureItem[];
}

export const FeatureExtractionPanel: React.FC<Props> = ({ features }) => {
  return (
    <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl flex flex-col h-[520px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Live Edge Feature Extraction Stream (Module 2)</h3>
            <p className="text-xs text-slate-400">Real-time mathematically preprocessed parameter tensors before AI routing</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
          LIVE MATRICES ({features.length})
        </span>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto mt-4">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/80 sticky top-0">
              <th className="py-2.5 px-3">Protocol</th>
              <th className="py-2.5 px-3">Source & Target</th>
              <th className="py-2.5 px-3 text-right">Size (B)</th>
              <th className="py-2.5 px-3 text-right">Latency</th>
              <th className="py-2.5 px-3 text-right">Bandwidth</th>
              <th className="py-2.5 px-3 text-right">Signal</th>
              <th className="py-2.5 px-3 text-right">Count</th>
              <th className="py-2.5 px-3 text-right">Extracted At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {features.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 font-mono">
                  Awaiting background Edge Server telemetry cycles...
                </td>
              </tr>
            ) : (
              features.map((feat) => (
                <tr key={feat.featureId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{feat.protocol}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-white font-medium">{feat.sourceNode}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span className="text-slate-400">{feat.destinationNode}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{feat.packetSize}</td>
                  <td className="py-2.5 px-3 text-right text-amber-300 font-bold">{feat.latency.toFixed(2)} ms</td>
                  <td className="py-2.5 px-3 text-right text-blue-300">{feat.bandwidth.toFixed(1)} Mbps</td>
                  <td className="py-2.5 px-3 text-right text-teal-300">{feat.signalStrength.toFixed(1)} dBm</td>
                  <td className="py-2.5 px-3 text-right font-black text-purple-400">#{feat.communicationCount}</td>
                  <td className="py-2.5 px-3 text-right text-[11px] text-slate-500">
                    {new Date(feat.extractionTime).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
