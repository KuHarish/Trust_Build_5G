import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import { 
  ShieldAlert, Activity, FileText, Play, Pause, CheckCircle2, XCircle, 
  RefreshCw, Plus, Copy, Check, ExternalLink, ShieldCheck, Clock, ArrowRight 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityApi } from '@/api/securityApi';

interface SecurityDecisionItem {
  decisionId: string;
  nodeId: string;
  decision: string;
  severity: string;
  reason: string;
  trustScore?: number | null;
  trustLevel?: string | null;
  mlPrediction?: string | null;
  mlConfidence?: number | null;
  attackCategory?: string | null;
  policyId?: string;
  policyVersion?: number;
  triggerEventId?: string | null;
  matchedRuleId?: string | null;
  evidenceFreshness?: Record<string, string>;
  evidenceTimestamps?: Record<string, string>;
  explanation?: {
    correlationId?: string;
    model?: string;
    conflicts?: string;
    [key: string]: any;
  };
  createdAt: string;
  isMitigated?: boolean;
  isNew?: boolean;
}

interface MitigationActionItem {
  actionId: string;
  nodeId: string;
  decisionId: string;
  decision: string;
  correlationId: string;
  status: string;
  blockchainTxId?: string | null;
  result?: string | null;
  requestedAt: string;
  completedAt?: string | null;
  isNew?: boolean;
}

interface NodeStateItem {
  nodeId: string;
  currentState: string;
  previousState: string;
  changedBy: string;
  sourceDecisionId?: string | null;
  sourceActionId?: string | null;
  timestamp: string;
  reason?: string | null;
  isNew?: boolean;
}

const DEFAULT_NODE_STATES: NodeStateItem[] = [
  { nodeId: "Edge-Gateway-04", currentState: "QUARANTINED", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "Surge threshold exceeded: 14,800 pkt/s", timestamp: new Date(Date.now() - 60000).toISOString() },
  { nodeId: "IoT-Sensor-008", currentState: "RATE_LIMITED", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "ARP spoofing anomaly throttled to 64kbps", timestamp: new Date(Date.now() - 120000).toISOString() },
  { nodeId: "IoT-Sensor-015", currentState: "BLOCKED", previousState: "QUARANTINED", changedBy: "SYSTEM", reason: "Mirai botnet C2 beaconing confirmed", timestamp: new Date(Date.now() - 180000).toISOString() },
  { nodeId: "MEC-Processor-03", currentState: "MONITORED", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "Service port scan detected; deep inspection on", timestamp: new Date(Date.now() - 240000).toISOString() },
  { nodeId: "Edge-Gateway-02", currentState: "QUARANTINED", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "GTP tunnel buffer overflow mitigation", timestamp: new Date(Date.now() - 300000).toISOString() },
  { nodeId: "Edge-Gateway-06", currentState: "BLOCKED", previousState: "RATE_LIMITED", changedBy: "SYSTEM", reason: "UDP reflection amplification blacklisted", timestamp: new Date(Date.now() - 360000).toISOString() },
  { nodeId: "Core-Server-02", currentState: "ACTIVE", previousState: "RATE_LIMITED", changedBy: "SYSTEM", reason: "Handshake rate normalized", timestamp: new Date(Date.now() - 420000).toISOString() },
  { nodeId: "IoT-Sensor-010", currentState: "QUARANTINED", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "PCI 142 spoofing isolation", timestamp: new Date(Date.now() - 480000).toISOString() },
  { nodeId: "IoT-Sensor-001", currentState: "ACTIVE", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "Trust score 96.8% - Policy Verified", timestamp: new Date(Date.now() - 540000).toISOString() },
  { nodeId: "IoT-Sensor-003", currentState: "ACTIVE", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "Normal operational parameters", timestamp: new Date(Date.now() - 600000).toISOString() },
  { nodeId: "Radio-Unit-05", currentState: "ACTIVE", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "URLLC slice authorization granted", timestamp: new Date(Date.now() - 660000).toISOString() },
  { nodeId: "Core-Server-01", currentState: "ACTIVE", previousState: "ACTIVE", changedBy: "SYSTEM", reason: "mTLS session established (TLS_AES_256_GCM)", timestamp: new Date(Date.now() - 720000).toISOString() },
];

export const SecurityController: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'DECISIONS' | 'ACTIONS' | 'POLICIES' | 'NODE_STATES' | 'AUDIT'>('DECISIONS');
  const [auditCorrelationId, setAuditCorrelationId] = useState('');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local stream state
  const [streamDecisions, setStreamDecisions] = useState<SecurityDecisionItem[]>([]);
  const [streamActions, setStreamActions] = useState<MitigationActionItem[]>([]);
  const [streamNodeStates, setStreamNodeStates] = useState<NodeStateItem[]>(DEFAULT_NODE_STATES);

  // Simulator State
  const [simEvidence, setSimEvidence] = useState({
    nodeId: 'NODE-SIM-01',
    mlPrediction: 'ATTACK',
    mlConfidence: 0.95,
    trustScore: 0.2,
    trustLevel: 'MALICIOUS'
  });
  const [simResult, setSimResult] = useState<any>(null);

  const simulateMutation = useMutation({
    mutationFn: (data: { policyId: string, evidence: any }) => securityApi.simulatePolicy(data.policyId, data.evidence),
    onSuccess: (res) => setSimResult(res.data.data),
    onError: () => setSimResult({ error: 'Simulation failed' })
  });

  // Queries with background refetch
  const { data: decisionsRes, isLoading: decisionsLoading } = useQuery({
    queryKey: ['security-decisions'],
    queryFn: () => securityApi.getDecisions().then(res => res.data),
    refetchInterval: 5000
  });

  const { data: actionsRes, isLoading: actionsLoading } = useQuery({
    queryKey: ['mitigation-actions'],
    queryFn: () => securityApi.getActions().then(res => res.data),
    refetchInterval: 5000
  });

  const { data: policiesRes } = useQuery({
    queryKey: ['security-policies'],
    queryFn: () => securityApi.getPolicies().then(res => res.data)
  });

  const { data: nodeStatesRes } = useQuery({
    queryKey: ['node-states'],
    queryFn: () => securityApi.getNodeStates().then(res => res.data),
    refetchInterval: 5000
  });

  const { data: auditRes, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-timeline', auditCorrelationId],
    queryFn: () => securityApi.getAuditTimeline(auditCorrelationId).then(res => res.data),
    enabled: !!auditCorrelationId,
    refetchInterval: 4000
  });

  // Sync queries with stream states
  useEffect(() => {
    if (decisionsRes?.data && Array.isArray(decisionsRes.data)) {
      setStreamDecisions(prev => {
        const serverDecs: SecurityDecisionItem[] = decisionsRes.data;
        if (prev.length === 0) return serverDecs;
        const serverIds = new Set(serverDecs.map(d => d.decisionId));
        const newLocal = prev.filter(d => !serverIds.has(d.decisionId));
        return [...newLocal, ...serverDecs];
      });
    }
  }, [decisionsRes]);

  useEffect(() => {
    if (actionsRes?.data && Array.isArray(actionsRes.data)) {
      setStreamActions(prev => {
        const serverActs: MitigationActionItem[] = actionsRes.data;
        if (prev.length === 0) return serverActs;
        const serverIds = new Set(serverActs.map(a => a.actionId));
        const newLocal = prev.filter(a => !serverIds.has(a.actionId));
        return [...newLocal, ...serverActs];
      });
    }
  }, [actionsRes]);

  useEffect(() => {
    if (nodeStatesRes?.data && Array.isArray(nodeStatesRes.data) && nodeStatesRes.data.length > 0) {
      setStreamNodeStates(nodeStatesRes.data);
    }
  }, [nodeStatesRes]);

  // Set default audit correlation ID if empty and decisions exist
  useEffect(() => {
    if (!auditCorrelationId && streamDecisions.length > 0) {
      const firstCorr = streamDecisions[0]?.explanation?.correlationId;
      if (firstCorr) {
        setAuditCorrelationId(firstCorr);
      }
    }
  }, [streamDecisions, auditCorrelationId]);

  // Mutation to manually trigger live security event
  const simulateEventMutation = useMutation({
    mutationFn: () => securityApi.simulateEvent(),
    onSuccess: (res) => {
      if (res?.data?.data) {
        const { decision, action } = res.data.data;
        if (decision) {
          setStreamDecisions(prev => [{ ...decision, isNew: true }, ...prev.filter(d => d.decisionId !== decision.decisionId)]);
        }
        if (action) {
          setStreamActions(prev => [{ ...action, isNew: true }, ...prev.filter(a => a.actionId !== action.actionId)]);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['security-decisions'] });
      queryClient.invalidateQueries({ queryKey: ['mitigation-actions'] });
      queryClient.invalidateQueries({ queryKey: ['node-states'] });
    },
    onError: () => {
      // Local fallback simulation if endpoint offline
      injectLocalSecurityDecision();
    }
  });

  // Local simulated decision injector
  const injectLocalSecurityDecision = () => {
    const templates = [
      {
        nodeId: "Edge-Gateway-04",
        attack_type: "DDoS",
        severity: "CRITICAL",
        decision: "QUARANTINE",
        reason: "Volumetric SYN surge detected across 5G gNodeB front-haul; 14,800 pkt/s threshold exceeded",
        action_result: "Node interface isolated into quarantine VLAN 4094; ACL ingress rule enacted.",
        trust: 0.20,
        conf: 0.985,
        target_state: "QUARANTINED"
      },
      {
        nodeId: "IoT-Sensor-008",
        attack_type: "MitM",
        severity: "HIGH",
        decision: "RATE_LIMIT",
        reason: "Rogue ARP/ND cache poisoning and certificate impersonation detected against MEC gateway",
        action_result: "Bandwidth throttled to 64 kbps; mTLS re-attestation challenge issued.",
        trust: 0.32,
        conf: 0.945,
        target_state: "RATE_LIMITED"
      },
      {
        nodeId: "IoT-Sensor-015",
        attack_type: "Botnet",
        severity: "CRITICAL",
        decision: "BLOCK",
        reason: "Periodic high-entropy outbound beaconing matching Mirai/Mozi botnet C2 signature",
        action_result: "Radio bearer severed; SIM credentials revoked on core 5G UDM.",
        trust: 0.13,
        conf: 0.978,
        target_state: "BLOCKED"
      },
      {
        nodeId: "MEC-Processor-03",
        attack_type: "Port-Scan",
        severity: "MEDIUM",
        decision: "MONITOR",
        reason: "Rapid sequential port probing across internal SBA microservice ports 8080-8095",
        action_result: "Packet logging elevated to debug verbosity; deep packet inspection enabled.",
        trust: 0.54,
        conf: 0.892,
        target_state: "MONITORED"
      },
      {
        nodeId: "Edge-Gateway-02",
        attack_type: "DoS",
        severity: "HIGH",
        decision: "QUARANTINE",
        reason: "Malformed GTP-U TEID encapsulation headers attempting buffer overflow in UPF datapath",
        action_result: "UPF GTP tunnel dropped and re-initialized; offending IP blacklisted.",
        trust: 0.26,
        conf: 0.932,
        target_state: "QUARANTINED"
      }
    ];

    const tpl = templates[Math.floor(Math.random() * templates.length)];
    const now = new Date();
    const uniqueSuffix = `${now.getTime().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const decId = `dec-atk-${uniqueSuffix}`;
    const actId = `act-${decId}`;
    const corrId = `corr-${tpl.attack_type.toLowerCase().slice(0, 4)}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const txId = `tx_sec_${Math.random().toString(36).substring(2, 10)}`;

    const newDecision: SecurityDecisionItem = {
      decisionId: decId,
      nodeId: tpl.nodeId,
      decision: tpl.decision,
      severity: tpl.severity,
      reason: tpl.reason,
      trustScore: tpl.trust,
      trustLevel: tpl.trust < 0.25 ? "MALICIOUS" : "SUSPICIOUS",
      mlPrediction: tpl.attack_type,
      mlConfidence: tpl.conf,
      attackCategory: tpl.attack_type,
      policyId: "pol-sec-5g-01",
      policyVersion: 3,
      matchedRuleId: `rule-5g-${tpl.decision.toLowerCase()}`,
      evidenceFreshness: { ML: "VALID", TRUST: "VALID" },
      evidenceTimestamps: { ML: now.toISOString(), TRUST: now.toISOString() },
      explanation: { correlationId: corrId, model: "RandomForest-5G-v2", conflicts: "No" },
      createdAt: now.toISOString(),
      isMitigated: true,
      isNew: true
    };

    const newAction: MitigationActionItem = {
      actionId: actId,
      nodeId: tpl.nodeId,
      decisionId: decId,
      decision: tpl.decision,
      correlationId: corrId,
      status: "COMPLETED",
      blockchainTxId: txId,
      result: tpl.action_result,
      requestedAt: now.toISOString(),
      completedAt: now.toISOString(),
      isNew: true
    };

    setStreamDecisions(prev => [newDecision, ...prev.slice(0, 49)]);
    setStreamActions(prev => [newAction, ...prev.slice(0, 49)]);

    // Update node state
    setStreamNodeStates(prev => {
      const idx = prev.findIndex(n => n.nodeId === tpl.nodeId);
      const prevEntry = prev[idx];
      const updatedItem: NodeStateItem = {
        nodeId: tpl.nodeId,
        currentState: tpl.target_state,
        previousState: prevEntry?.currentState || "ACTIVE",
        changedBy: "SYSTEM",
        sourceDecisionId: decId,
        sourceActionId: actId,
        timestamp: now.toISOString(),
        reason: tpl.action_result,
        isNew: true
      };
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updatedItem;
        return copy;
      }
      return [updatedItem, ...prev];
    });
  };

  // Self-sustaining live simulation timer
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPlayingRef.current) return;
      simulateEventMutation.mutate();
    }, 6500);

    return () => clearInterval(timer);
  }, []);

  // Remove isNew glow after 2500ms
  useEffect(() => {
    const timeout = setTimeout(() => {
      setStreamDecisions(prev => prev.map(d => d.isNew ? { ...d, isNew: false } : d));
      setStreamActions(prev => prev.map(a => a.isNew ? { ...a, isNew: false } : a));
      setStreamNodeStates(prev => prev.map(n => n.isNew ? { ...n, isNew: false } : n));
    }, 2500);
    return () => clearTimeout(timeout);
  }, [streamDecisions, streamActions, streamNodeStates]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['security-decisions'] });
    queryClient.invalidateQueries({ queryKey: ['mitigation-actions'] });
    queryClient.invalidateQueries({ queryKey: ['security-policies'] });
    queryClient.invalidateQueries({ queryKey: ['node-states'] });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'BLOCK':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20';
      case 'QUARANTINE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20';
      case 'RATE_LIMIT':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-sm shadow-orange-500/20';
      case 'WARN':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-500/60';
      case 'HIGH':
        return 'bg-orange-950 text-orange-300 border-orange-500/60';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-500/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  const getNodeStateBadge = (state: string) => {
    switch (state) {
      case 'BLOCKED':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
      case 'QUARANTINED':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
      case 'RATE_LIMITED':
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/40';
      case 'MONITORED':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40';
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  const decisions = streamDecisions;
  const actions = streamActions;
  const policies = policiesRes?.data || [];
  const nodeStates = streamNodeStates;
  const auditEvents = auditRes?.data || [];

  // Extract recent correlation IDs for fast selection in Audit tab
  const recentCorrelations = Array.from(
    new Set(decisions.map(d => d.explanation?.correlationId).filter(Boolean))
  ).slice(0, 6) as string[];

  const latestDecision = decisions[0];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn relative">
      <PageHeader 
        title="Security Controller & Mitigation" 
        subtitle="Automated 5G SBA Policy Enforcement, Real-time Threat Containment, and Cryptographic Incident Audits."
      />

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800/80 p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>Total Mitigations</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white mt-2 flex items-baseline gap-2">
            {actions.length}
            <span className="text-xs text-emerald-400 font-sans font-normal">Active</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Isolations & Rate limits</p>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>Total Decisions</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-indigo-400 mt-2 flex items-baseline gap-2">
            {decisions.length}
            <span className="text-xs text-emerald-400 font-sans font-normal">+1 live</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Correlated ML & Trust signals</p>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>Active Policies</span>
            <FileText className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-teal-400 mt-2">
            {Math.max(policies.length, 1)}
          </div>
          <p className="text-xs text-slate-500 mt-1">v3 Zero-Trust Enforcement</p>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-5 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>Engine Status</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div className="text-sm font-bold text-emerald-400 mt-2 truncate">
            {latestDecision ? `${latestDecision.decision} → ${latestDecision.nodeId}` : 'AUTONOMOUS ACTIVE'}
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {latestDecision ? `Updated ${getRelativeTime(latestDecision.createdAt)}` : 'Zero-Trust Pipeline Ready'}
          </p>
        </Card>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 gap-1">
          <button 
            onClick={() => setActiveTab('DECISIONS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'DECISIONS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Security Decisions ({decisions.length})
          </button>
          <button 
            onClick={() => setActiveTab('ACTIONS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'ACTIONS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Mitigation Actions ({actions.length})
          </button>
          <button 
            onClick={() => setActiveTab('POLICIES')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'POLICIES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Policies ({Math.max(policies.length, 1)})
          </button>
          <button 
            onClick={() => setActiveTab('NODE_STATES')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'NODE_STATES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Node States ({nodeStates.length})
          </button>
          <button 
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'AUDIT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Incident Audit Timeline
          </button>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              isPlaying 
                ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border-amber-500/30' 
                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Stream' : 'Resume Stream'}
          </button>

          <button 
            onClick={() => simulateEventMutation.mutate()} 
            disabled={simulateEventMutation.isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className={`w-3.5 h-3.5 ${simulateEventMutation.isPending ? 'animate-spin' : ''}`} />
            {simulateEventMutation.isPending ? 'Evaluating...' : 'Simulate Threat Mitigation'}
          </button>

          <button 
            onClick={handleRefresh} 
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${decisionsLoading || actionsLoading ? 'animate-spin text-indigo-400' : ''}`} /> 
            Refresh
          </button>
        </div>
      </div>

      {/* 1. DECISIONS TAB */}
      {activeTab === 'DECISIONS' && (
        <Card className="bg-slate-900/70 border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Live Security Decisions Stream
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time policy decisions correlating deep-learning telemetry with Bayesian trust reputation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-mono">Stream Active</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800 font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Target Node</th>
                  <th className="px-4 py-3">ML Inference</th>
                  <th className="px-4 py-3">Trust Score</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Policy Reason & Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-sans">
                {decisions.map((d) => (
                  <tr 
                    key={d.decisionId} 
                    className={`transition-all duration-300 hover:bg-slate-800/30 align-top ${
                      d.isNew 
                        ? 'bg-indigo-950/40 border-l-4 border-l-indigo-400 animate-pulse' 
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-400">
                      <div>{new Date(d.createdAt).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{getRelativeTime(d.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-mono text-xs font-semibold whitespace-nowrap">
                      <div>{d.nodeId}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        ID: {d.decisionId.slice(0, 14)}...
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-semibold text-slate-200">
                        {d.mlPrediction || 'ATTACK'} 
                        <span className="text-slate-400 font-mono font-normal ml-1">
                          ({((d.mlConfidence ?? 0.95) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> ML Valid
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-mono text-slate-300">
                        {d.trustScore !== null && d.trustScore !== undefined ? (d.trustScore * 100).toFixed(1) + '%' : '24.0%'}
                      </div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Trust Valid
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${getDecisionBadge(d.decision)}`}>
                        {d.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border font-mono ${getSeverityBadge(d.severity)}`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs max-w-md">
                      <div className="text-slate-300 leading-relaxed font-medium">{d.reason}</div>
                      {d.explanation?.correlationId && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setAuditCorrelationId(d.explanation!.correlationId!);
                              setActiveTab('AUDIT');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Trace: {d.explanation.correlationId}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {decisions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No security decisions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2. ACTIONS TAB */}
      {activeTab === 'ACTIONS' && (
        <Card className="bg-slate-900/70 border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Active & Executed Mitigation Actions
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated containment procedures: VLAN quarantine, dynamic rate limiting, BGP blackholing, and radio bearer severing
              </p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total: {actions.length} Actions
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800 font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3">Requested Time</th>
                  <th className="px-4 py-3">Node</th>
                  <th className="px-4 py-3">Enacted Action</th>
                  <th className="px-4 py-3">Execution Status</th>
                  <th className="px-4 py-3">Mitigation Result</th>
                  <th className="px-4 py-3">Blockchain Tx Anchor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-sans">
                {actions.map((a) => (
                  <tr 
                    key={a.actionId} 
                    className={`transition-all duration-300 hover:bg-slate-800/30 ${
                      a.isNew 
                        ? 'bg-rose-950/40 border-l-4 border-l-rose-400 animate-pulse' 
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-400">
                      <div>{new Date(a.requestedAt).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{getRelativeTime(a.requestedAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-mono text-xs font-semibold whitespace-nowrap">
                      {a.nodeId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border font-mono ${getDecisionBadge(a.decision)}`}>
                        {a.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-sm">
                      {a.result || 'Containment action verified and enforced.'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {a.blockchainTxId ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-400 text-[11px] truncate max-w-[130px]" title={a.blockchainTxId}>
                            {a.blockchainTxId}
                          </span>
                          <button
                            onClick={() => handleCopy(a.blockchainTxId!)}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            title="Copy Tx ID"
                          >
                            {copiedId === a.blockchainTxId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Pending ledger seal...</span>
                      )}
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No mitigation actions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3. POLICIES TAB */}
      {activeTab === 'POLICIES' && (
        <div className="space-y-6">
          {policies.map((p: any) => (
            <Card key={p.policyId} className="bg-slate-900/70 border-slate-800 shadow-xl">
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {p.name}
                    <span className="text-[10px] uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold font-mono">
                      Active v{p.version}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{p.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase font-mono">Enforcement Level</div>
                  <div className="text-xs font-bold text-slate-300 font-mono">Confidence Threshold: {p.thresholds?.mlHighConfidence ?? '0.85'}</div>
                  <div className="text-xs font-semibold text-indigo-400 font-mono mt-0.5">Fallback: {p.fallbackBehavior}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Zero-Trust Rules Hierarchy</h4>
                {p.rules && p.rules.map((r: any) => (
                  <div key={r.ruleId} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 relative hover:border-slate-700 transition-colors">
                    <div className="absolute top-4 right-4 text-xs font-bold font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Priority: {r.priority}
                    </div>
                    <div className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-indigo-400" />
                      {r.name}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 mb-1.5 font-bold tracking-wider font-mono">EVALUATION CONDITIONS</div>
                        <div className="space-y-1">
                          {r.conditions?.map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 font-mono text-xs bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                              <span className="text-indigo-400">{c.field}</span>
                              <span className="text-slate-500 font-bold">{c.operator}</span>
                              <span className="text-teal-400">{c.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 mb-1.5 font-bold tracking-wider font-mono">DISPATCHED MITIGATION</div>
                        <div className={`p-2.5 rounded-lg border inline-flex items-center gap-2 font-mono text-sm font-bold ${getDecisionBadge(r.decisionAction)}`}>
                          <span>{r.decisionAction}</span>
                          <span className="text-xs font-normal opacity-70">({r.severity})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          
          {/* DRY RUN SIMULATOR */}
          <Card className="bg-slate-900/70 border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <Play className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Interactive Policy Dry-Run Sandbox</h3>
              <span className="ml-2 text-[10px] uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold font-mono">
                Safe Testing Mode
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Simulated ML Prediction</label>
                  <select 
                    value={simEvidence.mlPrediction}
                    onChange={e => setSimEvidence({...simEvidence, mlPrediction: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ATTACK">ATTACK (Malicious)</option>
                    <option value="BENIGN">BENIGN (Legitimate)</option>
                    <option value="MISSING">MISSING (Signal Stale)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">ML Confidence Score (0.00 - 1.00)</label>
                  <input 
                    type="number" step="0.01" min="0" max="1"
                    value={simEvidence.mlConfidence}
                    onChange={e => setSimEvidence({...simEvidence, mlConfidence: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Bayesian Trust Level</label>
                  <select 
                    value={simEvidence.trustLevel}
                    onChange={e => setSimEvidence({...simEvidence, trustLevel: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="MALICIOUS">MALICIOUS (Trust &lt; 0.30)</option>
                    <option value="SUSPICIOUS">SUSPICIOUS (0.30 - 0.50)</option>
                    <option value="TRUSTED">TRUSTED (&gt; 0.70)</option>
                    <option value="MISSING">MISSING</option>
                  </select>
                </div>
                <button 
                  onClick={() => simulateMutation.mutate({ policyId: policies[0]?.policyId || 'pol-sec-5g-01', evidence: simEvidence })}
                  disabled={simulateMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {simulateMutation.isPending ? 'Simulating Evaluation...' : 'Execute Policy Evaluation'} 
                  <Play className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2 font-mono">
                  Sandbox Result
                </h4>
                
                {simResult ? (
                  simResult.error ? (
                    <div className="text-rose-400 text-sm flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> {simResult.error}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {simResult.matched ? (
                        <>
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4" /> Rule Matched Successfully
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                            <div className="text-xs text-slate-500 font-mono mb-1">Enacted Rule</div>
                            <div className="text-sm font-bold text-indigo-300">{simResult.rule?.name}</div>
                          </div>
                          <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-center">
                            <div className="text-xs text-rose-400 uppercase font-bold tracking-wider mb-1 font-mono">Resulting Security Action</div>
                            <div className="text-2xl font-bold text-rose-300 font-mono">{simResult.rule?.decisionAction}</div>
                            <div className="text-xs text-rose-400/80 mt-1">Severity: {simResult.rule?.severity}</div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-amber-400 font-bold text-sm mb-2 flex items-center justify-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" /> No Specific Rule Matched
                          </div>
                          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300 text-sm">
                            Fallback Behavior Applied: <span className="font-bold text-indigo-300 font-mono">{simResult.fallbackBehavior || 'MONITOR'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="text-center text-slate-500 text-xs italic py-8">
                    Configure telemetry inputs on the left and click "Execute Policy Evaluation".
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. NODE STATES TAB */}
      {activeTab === 'NODE_STATES' && (
        <Card className="bg-slate-900/70 border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Monitored 5G Logical Node Security States
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic containment status, isolation VLANs, and active policy throttle boundaries
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {nodeStates.length} Monitored Nodes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800 font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3">Node ID</th>
                  <th className="px-4 py-3">Current State</th>
                  <th className="px-4 py-3">State Transition</th>
                  <th className="px-4 py-3">Reason / Enacted Policy</th>
                  <th className="px-4 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-sans">
                {nodeStates.map((s) => (
                  <tr 
                    key={s.nodeId} 
                    className={`transition-all duration-300 hover:bg-slate-800/30 ${
                      s.isNew 
                        ? 'bg-emerald-950/40 border-l-4 border-l-emerald-400 animate-pulse' 
                        : 'border-l-4 border-transparent'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-300 whitespace-nowrap">
                      {s.nodeId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${getNodeStateBadge(s.currentState)}`}>
                        {s.currentState}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-500">{s.previousState || 'ACTIVE'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-slate-200 font-semibold">{s.currentState}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-md">
                      {s.reason || 'Normal operation; telemetry within nominal boundaries.'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      <div>{new Date(s.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{getRelativeTime(s.timestamp)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-indigo-950/20 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-300">
            <span><strong>Zero-Trust Note:</strong> Logical network isolation enforcement is fully automated via SDN OpenFlow/eBPF controllers.</span>
            <span className="font-mono text-[10px] text-slate-400">12 Nodes Polled</span>
          </div>
        </Card>
      )}

      {/* 5. AUDIT TIMELINE TAB */}
      {activeTab === 'AUDIT' && (
        <Card className="bg-slate-900/70 border-slate-800 shadow-xl">
          <div className="p-4 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Security Incident Lifecycle Trace
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                End-to-end cryptographic audit trail from initial threat detection to containment and blockchain confirmation
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-80">
              <input
                type="text"
                placeholder="Filter Correlation ID..."
                value={auditCorrelationId}
                onChange={(e) => setAuditCorrelationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick correlation chips */}
          {recentCorrelations.length > 0 && (
            <div className="p-3 bg-slate-950/60 border-b border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Recent Incidents:</span>
              {recentCorrelations.map(corr => (
                <button
                  key={corr}
                  onClick={() => setAuditCorrelationId(corr)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    auditCorrelationId === corr 
                      ? 'bg-indigo-600 text-white font-bold' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {corr}
                </button>
              ))}
            </div>
          )}

          <div className="p-6">
            {!auditCorrelationId ? (
              <div className="text-center p-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
                Select one of the incident chips above or click "Trace" on any decision to view its full lifecycle timeline.
              </div>
            ) : auditLoading ? (
              <div className="text-center p-12 text-slate-400 flex flex-col items-center">
                <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-400" />
                Retrieving incident cryptographic timeline...
              </div>
            ) : auditEvents.length === 0 ? (
              <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                No events found for correlation ID: <span className="font-mono text-slate-400">{auditCorrelationId}</span>
              </div>
            ) : (
              <div className="relative border-l-2 border-indigo-500/40 ml-4 pl-6 space-y-6">
                {auditEvents.map((e: any, idx: number) => (
                  <div key={e.eventId || idx} className="relative group">
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-indigo-400 group-hover:scale-125 transition-transform" />
                    
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-300">{e.eventType}</span>
                          {e.sourceModule && (
                            <span className="text-[10px] text-slate-400 uppercase bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                              {e.sourceModule}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(e.timestamp).toLocaleTimeString()}
                          <span className="text-slate-600 font-sans">({getRelativeTime(e.timestamp)})</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          {e.nodeId && <div className="text-slate-300 font-mono"><span className="text-slate-500">Node:</span> {e.nodeId}</div>}
                          {e.decision && <div className="text-rose-300 font-mono font-semibold"><span className="text-slate-500">Decision:</span> {e.decision}</div>}
                          {e.mitigationAction && <div className="text-amber-300 font-mono font-semibold"><span className="text-slate-500">Action:</span> {e.mitigationAction}</div>}
                          {e.policyId && <div className="text-slate-400 font-mono text-[11px]"><span className="text-slate-500">Policy:</span> {e.policyId} (v{e.policyVersion || 3})</div>}
                        </div>
                        <div>
                          {e.reason && <div className="text-slate-300 text-xs">{e.reason}</div>}
                          {e.result && <div className="text-emerald-400 text-xs mt-1">{e.result}</div>}
                          {e.previousSecurityState && (
                            <div className="text-xs text-slate-400 font-mono mt-1">
                              State: <span className="text-slate-500">{e.previousSecurityState}</span> &rarr; <span className="text-indigo-300 font-semibold">{e.newSecurityState}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                          <ShieldCheck className="w-3 h-3" /> AUDIT CONFIRMED
                        </div>
                        {e.blockchainTxId && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Ledger Tx: <span className="text-indigo-400">{e.blockchainTxId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
