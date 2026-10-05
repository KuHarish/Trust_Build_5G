import React from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { ShieldCheck, ShieldAlert, Activity, Server, Clock, Fingerprint } from 'lucide-react';
import { cn } from '@/utils';

interface TrustProfileCardProps {
  profile: any;
  metrics: any;
  compliance: any;
}

export const TrustProfileCard: React.FC<TrustProfileCardProps> = ({ profile, metrics, compliance }) => {
  if (!profile) return null;

  const isTrusted = profile.trustLevel === 'TRUSTED';
  const isWarning = profile.trustLevel === 'SUSPICIOUS' || profile.trustLevel === 'WARNING';
  
  return (
    <Card className="col-span-1 border-slate-800 bg-slate-900/50 backdrop-blur-md shadow-xl">
      <div className="pb-3 border-b border-slate-800/60 bg-slate-800/30 -mx-6 -mt-6 p-6 mb-5 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isTrusted ? "bg-success/20 text-success" : isWarning ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger")}>
              {isTrusted ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg text-slate-100 font-semibold flex items-center gap-2">
                Node Trust Identity
              </h3>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{profile.nodeId}</div>
            </div>
          </div>
          <Badge variant={isTrusted ? 'success' : isWarning ? 'warning' : 'danger'} className="px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {profile.trustLevel}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Main Trust Score Display */}
        <div className="text-center w-full py-5 bg-slate-950/40 rounded-xl border border-slate-800/60 shadow-inner">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Calculated Trust Score</div>
          <div className={cn("text-5xl font-black font-mono tracking-tighter", isTrusted ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400")}>
            {profile.currentTrustScore !== undefined && profile.currentTrustScore !== null ? (profile.currentTrustScore * 100).toFixed(1) : '---'}
            <span className="text-2xl text-slate-500 ml-1 font-light">%</span>
          </div>
          
          {profile.trustDelta !== undefined && (
            <div className={cn("text-xs mt-3 flex items-center justify-center gap-1.5 font-mono font-medium", profile.trustDelta > 0 ? "text-emerald-400" : profile.trustDelta < 0 ? "text-rose-400" : "text-slate-400")}>
              <span>{profile.trustDelta > 0 ? '▲' : profile.trustDelta < 0 ? '▼' : '▬'}</span>
              <span>{Math.abs(profile.trustDelta * 100).toFixed(1)}% Shift</span>
              <span className="text-slate-500 ml-1">({profile.trustChange})</span>
            </div>
          )}
        </div>

        {/* Explanation Engine Output */}
        {profile.evaluationReason && (
          <div className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-lg text-sm text-slate-300 italic text-center shadow-sm">
            "{profile.evaluationReason}"
          </div>
        )}
        {/* Trust Dimensions */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
            <Activity className="w-4 h-4 text-accent mb-2" />
            <div className="text-2xl font-black font-mono text-slate-100">{(profile.behaviorScore * 100).toFixed(1)}<span className="text-sm text-slate-500">%</span></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Behavior</div>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
            <Server className="w-4 h-4 text-primary mb-2" />
            <div className="text-2xl font-black font-mono text-slate-100">{(profile.historicalInteractionScore * 100).toFixed(1)}<span className="text-sm text-slate-500">%</span></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">History</div>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 flex flex-col items-center justify-center text-center">
            <Fingerprint className="w-4 h-4 text-purple-400 mb-2" />
            <div className="text-2xl font-black font-mono text-slate-100">{(profile.securityComplianceScore * 100).toFixed(1)}<span className="text-sm text-slate-500">%</span></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Compliance</div>
          </div>
        </div>

        {/* Behavioral Metrics Summary */}
        {metrics && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-accent" />
              Real-Time Behavioral Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Packet Success Rate</span>
                <span className="font-mono text-slate-200">{(metrics.successfulCommunicationRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Packet Loss Rate</span>
                <span className="font-mono text-slate-200">{(metrics.packetLossRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Avg Latency</span>
                <span className="font-mono text-slate-200">{metrics.averageLatency} ms</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Avg Signal</span>
                <span className="font-mono text-slate-200">{metrics.averageSignalStrength} dBm</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/30 rounded col-span-2">
                <span className="text-slate-400">Total Packets Sent</span>
                <span className="font-mono text-slate-200">{metrics.totalPacketsSent.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Security Compliance Info */}
        {compliance && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
              Security Posture
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Status</span>
                <span className={cn("font-bold", compliance.complianceStatus === 'SECURE' ? 'text-success' : 'text-danger')}>
                  {compliance.complianceStatus}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Auth Status</span>
                <span className="text-slate-200">{compliance.authenticationStatus}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Firmware</span>
                <span className="font-mono text-slate-200">{compliance.firmwareVersion}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/30 rounded">
                <span className="text-slate-400">Config Check</span>
                <span className="text-slate-200">{compliance.configurationCompliance}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Eval Count: {profile.evaluationCount}
          </div>
          <div>
            Last: {profile.lastEvaluation ? new Date(profile.lastEvaluation).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      </div>
    </Card>
  );
};
