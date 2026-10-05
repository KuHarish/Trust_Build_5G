import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Server, Shield, ShieldAlert, Clock, Activity, AlertTriangle, 
  XCircle, Link as LinkIcon, RefreshCw
} from 'lucide-react';
import { trustApi, attacksApi, securityApi } from '@/api/endpoints';

// Types passed from parent
interface EnrichedNode {
  _id: string;
  nodeName: string;
  nodeType: string;
  status: string;
  lastSeen: string;
  trustScore?: number;
  trustLevel?: string;
  securityState?: string;
}

interface NodeSecurityPanelProps {
  node: EnrichedNode | undefined;
  onClose?: () => void;
}

export const NodeSecurityPanel: React.FC<NodeSecurityPanelProps> = ({ node, onClose }) => {
  if (!node) {
    return (
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center h-full text-slate-500">
        <Server className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a node from the topology</p>
        <p className="text-xs mt-2">View detailed security and trust context</p>
      </div>
    );
  }

  // 1. Fetch Trust History
  const { data: trustHistRes, isLoading: trustLoading, isError: trustError } = useQuery({
    queryKey: ['trust-history', node._id],
    queryFn: () => trustApi.getHistory(node._id),
    refetchInterval: 10000,
  });

  // 2. Fetch Attack History
  const { data: attacksRes, isLoading: attacksLoading, isError: attacksError } = useQuery({
    queryKey: ['node-attacks', node._id],
    queryFn: () => attacksApi.list({ node_id: node._id }),
    refetchInterval: 10000,
  });

  // 3. Fetch Audit / Timeline History (Security Decisions, Mitigations, Blockchain events)
  const { data: auditRes, isLoading: auditLoading, isError: auditError } = useQuery({
    queryKey: ['node-audit', node._id],
    queryFn: () => securityApi.getNodeAuditHistory(node._id),
    refetchInterval: 10000,
  });

  const trustHistory = trustHistRes?.data?.data || [];
  const attacks = attacksRes?.data?.data || [];
  const auditEvents = auditRes?.data?.data || [];

  // Group events by correlationId for the incident timeline
  const incidents = useMemo(() => {
    const map = new Map<string, any[]>();
    auditEvents.forEach((ev: any) => {
      const cid = ev.correlationId || ev.eventId;
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid)!.push(ev);
    });
    
    // Sort by most recent event in the incident
    return Array.from(map.entries()).sort((a, b) => {
      const aTime = Math.max(...a[1].map(e => new Date(e.timestamp).getTime()));
      const bTime = Math.max(...b[1].map(e => new Date(e.timestamp).getTime()));
      return bTime - aTime;
    });
  }, [auditEvents]);

  // Derived Summary metrics
  const totalDetections = attacks.length;
  const activeIncidents = incidents.filter(([_, evs]) => 
    !evs.some(e => e.eventType === 'MITIGATION_COMPLETED' || e.eventType === 'INCIDENT_RESOLVED')
  ).length;
  const successfulMitigations = auditEvents.filter((e: any) => e.eventType === 'MITIGATION_COMPLETED').length;
  const failedMitigations = auditEvents.filter((e: any) => e.eventType === 'MITIGATION_FAILED').length;

  // Helpers
  const getStatusBadge = (status: string) => {
    if (status?.toUpperCase() === 'ONLINE') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{status}</span>;
    if (status?.toUpperCase() === 'OFFLINE') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{status || 'UNKNOWN'}</span>;
  };

  const getTrustBadge = (level: string = 'UNKNOWN') => {
    if (level === 'TRUSTED') return <span className="text-emerald-400 font-bold">{level}</span>;
    if (level === 'SUSPICIOUS') return <span className="text-amber-400 font-bold">{level}</span>;
    if (level === 'MALICIOUS') return <span className="text-rose-400 font-bold">{level}</span>;
    return <span className="text-slate-400 font-bold">{level}</span>;
  };

  const getSecurityBadge = (state: string = 'NORMAL') => {
    if (state === 'NORMAL') return <span className="text-emerald-400 font-bold">{state}</span>;
    return (
      <span className="flex items-center gap-1 text-rose-400 font-bold">
        <ShieldAlert className="w-3 h-3" />
        {state}
      </span>
    );
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700 shadow-2xl flex flex-col h-[800px] overflow-hidden">
      
      {/* HEADER / IDENTITY */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <div className="p-2.5 bg-slate-700/50 rounded-lg">
            <Server className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{node.nodeName || node._id}</h2>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-xs text-slate-400 font-mono">{node._id}</span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-300">{node.nodeType}</span>
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
          <div>{getStatusBadge(node.status)}</div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last Seen: {formatTime(node.lastSeen)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Risk Profile</div>
          <div className="text-sm">Trust: {node.trustScore !== undefined ? node.trustScore.toFixed(2) : 'N/A'} — {getTrustBadge(node.trustLevel)}</div>
          <div className="text-sm mt-1">Security: {getSecurityBadge(node.securityState)}</div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* SUMMARY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Detections</div>
            <div className="text-lg font-bold text-slate-200">{totalDetections}</div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Active Incidents</div>
            <div className={`text-lg font-bold ${activeIncidents > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{activeIncidents}</div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Mitigated</div>
            <div className="text-lg font-bold text-emerald-400">{successfulMitigations}</div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Failed</div>
            <div className={`text-lg font-bold ${failedMitigations > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{failedMitigations}</div>
          </div>
        </div>

        {/* TRUST HISTORY */}
        <section>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Trust History
          </h3>
          {trustError ? (
            <div className="text-sm text-rose-400 bg-rose-500/10 p-3 rounded border border-rose-500/20">
              ⚠ Unable to load trust history.
            </div>
          ) : trustLoading ? (
            <div className="text-sm text-slate-500 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin"/> Loading...</div>
          ) : trustHistory.length === 0 ? (
            <div className="text-sm text-slate-500 italic">Trust history unavailable.</div>
          ) : (
            <div className="space-y-2">
              {trustHistory.slice(0, 3).map((record: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-slate-800/30 p-2 rounded border border-slate-800">
                  <div className="text-xs font-mono text-slate-400">{formatTime(record.timestamp)}</div>
                  <div className="text-xs">
                    {record.trustScore.toFixed(2)} — {getTrustBadge(record.trustLevel)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RECENT DETECTIONS */}
        <section>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Recent Detections
          </h3>
          {attacksError ? (
            <div className="text-sm text-rose-400 bg-rose-500/10 p-3 rounded border border-rose-500/20">
              ⚠ Unable to load attack history.
            </div>
          ) : attacksLoading ? (
            <div className="text-sm text-slate-500 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin"/> Loading...</div>
          ) : attacks.length === 0 ? (
            <div className="text-sm text-slate-500 italic">No attacks recorded for this node.</div>
          ) : (
            <div className="space-y-2">
              {attacks.slice(0, 3).map((attack: any) => (
                <div key={attack._id} className="bg-slate-800/30 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-bold text-rose-400">{attack.attackType}</div>
                    <div className="text-[10px] font-mono text-slate-400">{formatTime(attack.detectionTime)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>Confidence: {(attack.confidenceScore * 100).toFixed(1)}%</div>
                    <div>Severity: {attack.severity}</div>
                    <div className="col-span-2 text-[10px] font-mono truncate text-slate-500 mt-1">
                      CORR: {attack.correlationId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECURITY TIMELINE (INCIDENTS) */}
        <section>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Security Event Timeline
          </h3>
          {auditError ? (
            <div className="text-sm text-rose-400 bg-rose-500/10 p-3 rounded border border-rose-500/20">
              ⚠ Unable to load security history.
            </div>
          ) : auditLoading ? (
            <div className="text-sm text-slate-500 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin"/> Loading...</div>
          ) : incidents.length === 0 ? (
            <div className="text-sm text-slate-500 italic">Not recorded.</div>
          ) : (
            <div className="space-y-6 border-l-2 border-slate-800 ml-2 pl-4 py-2">
              {incidents.slice(0, 3).map(([corrId, events]) => (
                <div key={corrId} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                  <div className="text-xs font-mono text-indigo-400 mb-2">Incident {corrId}</div>
                  
                  <div className="space-y-3">
                    {/* Reverse sort the inner events to show chronological top-to-bottom within the incident block */}
                    {events.sort((a,b)=>new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((ev: any, idx: number) => (
                      <div key={ev.eventId || idx} className="text-xs flex flex-col gap-1 border-l border-slate-700/50 pl-3 ml-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300">{ev.eventType}</span>
                          <span className="text-[10px] font-mono text-slate-500">{formatTime(ev.timestamp)}</span>
                        </div>
                        
                        {/* Contextual payload details based on event type */}
                        {ev.decision && (
                          <div className="text-amber-400">Decision: {ev.decision}</div>
                        )}
                        {ev.mitigationAction && (
                          <div className="text-blue-400">Action: {ev.mitigationAction} ({ev.status || 'REQUESTED'})</div>
                        )}
                        {ev.newSecurityState && (
                          <div className="text-slate-400">State Change: {ev.previousSecurityState || 'NORMAL'} → {ev.newSecurityState}</div>
                        )}
                        {ev.auditStatus === 'CONFIRMED' && ev.blockchainTxId && (
                          <div className="text-emerald-400 flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3" />
                            Blockchain Audit: {ev.blockchainTxId.substring(0, 16)}...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* FOOTER QUICK LINKS */}
      <div className="p-4 border-t border-slate-800 bg-slate-800/30">
        <div className="grid grid-cols-2 gap-2">
          <a href={`/trust?node=${node._id}`} className="flex justify-center items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] py-2 rounded transition-colors uppercase tracking-wider">
            View Trust
          </a>
          <a href={`/security?node=${node._id}`} className="flex justify-center items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] py-2 rounded transition-colors uppercase tracking-wider">
            View Security
          </a>
          <a href={`/attacks?node=${node._id}`} className="flex justify-center items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] py-2 rounded transition-colors uppercase tracking-wider">
            View Attacks
          </a>
          <a href={`/blockchain`} className="flex justify-center items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] py-2 rounded transition-colors uppercase tracking-wider">
            View Blockchain
          </a>
        </div>
      </div>

    </div>
  );
};
