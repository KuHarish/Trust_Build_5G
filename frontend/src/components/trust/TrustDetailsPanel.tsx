import React from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { TrustScore } from '@/components/trust/TrustScore';
import {
  X,
  ShieldCheck,
  Activity,
  Server,
  Clock,
  Fingerprint,
  Radio,
  MapPin
} from 'lucide-react';
import { cn } from '@/utils';
import { SimulationNode } from '@/types/node';

interface TrustDetailsPanelProps {
  node: SimulationNode | null;
  trustProfile: any | null; // Using any for now to avoid strict typing issues
  trustMetrics: any | null;
  compliance: any | null;
  onClose: () => void;
}

export const TrustDetailsPanel: React.FC<TrustDetailsPanelProps> = ({
  node,
  trustProfile,
  trustMetrics,
  compliance,
  onClose,
}) => {
  if (!node || !trustProfile) return null;

  const isTrusted = trustProfile.trustLevel === 'TRUSTED';
  const isWarning = trustProfile.trustLevel === 'SUSPICIOUS' || trustProfile.trustLevel === 'WARNING';
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl p-6 text-slate-200 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-xl border", isTrusted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : isWarning ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400")}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {node.nodeName} Trust Details
                </h2>
                <span className="font-mono text-xs text-slate-400">{node.deviceCategory} ({node.nodeType})</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Trust Score */}
          <div className="mt-6 text-center w-full py-6 bg-slate-950/50 rounded-2xl border border-slate-800/80 shadow-inner">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Calculated Trust Score</div>
            
            <TrustScore score={trustProfile.currentTrustScore} level={trustProfile.trustLevel} size="lg" className="border-0 shadow-lg" />
            
            {trustProfile.trustDelta !== undefined && (
              <div className={cn("text-sm mt-4 flex items-center justify-center gap-2 font-mono font-medium", trustProfile.trustDelta > 0 ? "text-emerald-400" : trustProfile.trustDelta < 0 ? "text-rose-400" : "text-slate-400")}>
                <span>{trustProfile.trustDelta > 0 ? '▲' : trustProfile.trustDelta < 0 ? '▼' : '▬'}</span>
                <span>{Math.abs(trustProfile.trustDelta * 100).toFixed(1)}% Shift</span>
                <span className="text-slate-500 ml-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {trustProfile.trustChange || 'No Change'}
                </span>
              </div>
            )}
          </div>

          {/* Explanation Engine Output */}
          {trustProfile.evaluationReason && (
            <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-200 italic shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              "{trustProfile.evaluationReason}"
            </div>
          )}

          {/* Trust Dimensions */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <Activity className="w-5 h-5 text-cyan-400 mb-2" />
              <div className="text-2xl font-black font-mono text-slate-100">{(trustProfile.behaviorScore * 100).toFixed(1)}<span className="text-sm text-slate-500">%</span></div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-bold">Behavior</div>
            </div>
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <Server className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-2xl font-black font-mono text-slate-100">{(trustProfile.historicalInteractionScore * 100).toFixed(1)}<span className="text-sm text-slate-500">%</span></div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-bold">History</div>
            </div>
            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <Fingerprint className="w-5 h-5 text-purple-400 mb-2" />
              <div className="text-2xl font-black font-mono text-slate-100">{(trustProfile.securityComplianceScore * 100).toFixed(1)}<span className="text-sm text-slate-500">%</span></div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-bold">Compliance</div>
            </div>
          </div>

          {/* Node Identity & Metadata */}
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Network Identity
            </h3>
            <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">UUID:</span>
                <span className="text-blue-400 font-bold break-all max-w-[280px] text-right">{node.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IP Address (IPv4/v6):</span>
                <span className="text-emerald-400 font-bold">{node.ipAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" /> GPS Coordinates:
                </span>
                <span className="text-white">Lat: {node.latitude}, Lng: {node.longitude}</span>
              </div>
            </div>

            {/* Behavioral Metrics Summary */}
            {trustMetrics && (
              <>
                <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  Real-Time Behavioral Telemetry
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Packet Success</span>
                    <span className="text-slate-200">{(trustMetrics.successfulCommunicationRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Packet Loss</span>
                    <span className="text-slate-200">{(trustMetrics.packetLossRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Avg Latency</span>
                    <span className="text-slate-200">{trustMetrics.averageLatency} ms</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Avg Signal</span>
                    <span className="text-slate-200">{trustMetrics.averageSignalStrength} dBm</span>
                  </div>
                </div>
              </>
            )}

            {/* Security Compliance Info */}
            {compliance && (
              <>
                <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase mt-4">
                  Security Posture
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Status</span>
                    <span className={cn("font-bold", compliance.complianceStatus === 'SECURE' ? 'text-emerald-400' : 'text-rose-400')}>
                      {compliance.complianceStatus}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Auth Status</span>
                    <span className="text-slate-200">{compliance.authenticationStatus}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Firmware</span>
                    <span className="text-slate-200">{compliance.firmwareVersion}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-800/30 rounded border border-slate-800/60">
                    <span className="text-slate-400">Config Check</span>
                    <span className="text-slate-200">{compliance.configurationCompliance}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Last Evaluated: {trustProfile.lastEvaluation ? new Date(trustProfile.lastEvaluation).toLocaleTimeString() : 'N/A'}</span>
          </div>
          <Button variant="outline" onClick={onClose} size="sm">
            Close Panel
          </Button>
        </div>
      </div>
    </div>
  );
};
