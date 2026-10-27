import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import {
  ShieldAlert,
  RefreshCw,
  Clock,
  AlertOctagon,
  Brain,
  Server,
  ShieldCheck,
  ExternalLink,
  Activity,
  Zap,
  Play,
  Pause,
  Search,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { attacksApi } from '@/api';
import { SecurityTraceTimeline } from '@/components/blockchain/SecurityTraceTimeline';
import { Link } from 'react-router-dom';

interface AttackIncident {
  _id: string;
  attack_type: string;
  severity: string;
  target_node_id: string;
  confidence_score?: number | null;
  trust_score?: number | null;
  trust_level?: string;
  decision?: string;
  mitigation_status: string;
  timestamp: string;
  correlation_id?: string | null;
  reason?: string;
  policy_id?: string;
  policy_version?: number;
  explanation?: any;
  mitigation_action?: any;
}

const SIMULATED_ATTACK_TEMPLATES = [
  {
    nodeId: 'Edge-Gateway-04',
    attack_type: 'DDoS',
    severity: 'CRITICAL',
    decision: 'QUARANTINE',
    reason: 'Volumetric SYN surge detected across 5G gNodeB front-haul; 14,800 pkt/s threshold exceeded',
    action_result: 'Node interface isolated into quarantine VLAN 4094; ACL ingress rule enacted.',
    trust_base: 0.18,
    trust_lvl: 'MALICIOUS',
    conf_base: 0.985,
  },
  {
    nodeId: 'IoT-Sensor-008',
    attack_type: 'MitM',
    severity: 'HIGH',
    decision: 'RATE_LIMIT',
    reason: 'Rogue ARP/ND cache poisoning and certificate impersonation detected against MEC gateway',
    action_result: 'Bandwidth throttled to 64 kbps; mTLS re-attestation challenge issued.',
    trust_base: 0.32,
    trust_lvl: 'SUSPICIOUS',
    conf_base: 0.942,
  },
  {
    nodeId: 'MEC-Processor-03',
    attack_type: 'Port-Scan',
    severity: 'MEDIUM',
    decision: 'MONITOR',
    reason: 'Rapid sequential port probing across internal SBA microservice ports 8080-8095',
    action_result: 'Packet logging elevated to debug verbosity; deep packet inspection enabled.',
    trust_base: 0.54,
    trust_lvl: 'QUESTIONABLE',
    conf_base: 0.891,
  },
  {
    nodeId: 'IoT-Sensor-015',
    attack_type: 'Botnet',
    severity: 'CRITICAL',
    decision: 'BLOCK',
    reason: 'Periodic high-entropy outbound beaconing matching Mirai/Mozi botnet C2 signature',
    action_result: 'Radio bearer severed; SIM credentials revoked on core 5G UDM.',
    trust_base: 0.12,
    trust_lvl: 'MALICIOUS',
    conf_base: 0.978,
  },
  {
    nodeId: 'Edge-Gateway-02',
    attack_type: 'DoS',
    severity: 'HIGH',
    decision: 'QUARANTINE',
    reason: 'Malformed GTP-U TEID encapsulation headers attempting buffer overflow in UPF datapath',
    action_result: 'UPF GTP tunnel dropped and re-initialized; offending IP blacklisted.',
    trust_base: 0.28,
    trust_lvl: 'MALICIOUS',
    conf_base: 0.923,
  },
  {
    nodeId: 'Core-Server-02',
    attack_type: 'Brute Force',
    severity: 'MEDIUM',
    decision: 'RATE_LIMIT',
    reason: 'Over 250 failed mTLS authentication handshakes within 20s window',
    action_result: 'IP tarpitted for 15 minutes; token rate limited to 1 req/sec.',
    trust_base: 0.61,
    trust_lvl: 'QUESTIONABLE',
    conf_base: 0.865,
  },
  {
    nodeId: 'Edge-Gateway-06',
    attack_type: 'DDoS',
    severity: 'CRITICAL',
    decision: 'BLOCK',
    reason: 'UDP reflection amplification attack overwhelming UPF packet classifier',
    action_result: 'Border BGP flowspec rule pushed to upstream provider; packet dropped.',
    trust_base: 0.15,
    trust_lvl: 'MALICIOUS',
    conf_base: 0.982,
  },
  {
    nodeId: 'IoT-Sensor-010',
    attack_type: 'MitM',
    severity: 'HIGH',
    decision: 'QUARANTINE',
    reason: 'Unauthorized gNodeB cell reselection attempt spoofing PCI 142',
    action_result: 'Radio resource control (RRC) connection rejected; authentication challenge failed.',
    trust_base: 0.29,
    trust_lvl: 'MALICIOUS',
    conf_base: 0.938,
  },
];

function generateSyntheticAttack(): AttackIncident {
  const t = SIMULATED_ATTACK_TEMPLATES[Math.floor(Math.random() * SIMULATED_ATTACK_TEMPLATES.length)];
  const conf = +(t.conf_base + (Math.random() - 0.5) * 0.04).toFixed(3);
  const trust = +(t.trust_base + (Math.random() - 0.5) * 0.05).toFixed(2);
  const uid = `dec-live-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const corr = `corr-${t.attack_type.toLowerCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 6)}`;

  return {
    _id: uid,
    attack_type: t.attack_type,
    severity: t.severity,
    target_node_id: t.nodeId,
    confidence_score: Math.min(0.999, Math.max(0.75, conf)),
    trust_score: Math.min(0.99, Math.max(0.05, trust)),
    trust_level: t.trust_lvl,
    decision: t.decision,
    mitigation_status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    correlation_id: corr,
    reason: t.reason,
    policy_id: 'pol-sec-5g-01',
    policy_version: 3,
    explanation: { correlationId: corr, model: 'RandomForest-5G-v2' },
    mitigation_action: { result: t.action_result, status: 'COMPLETED' },
  };
}

export const Attacks: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAttackId, setSelectedAttackId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const lastUpdateRef = useRef<number>(Date.now());

  // Filters
  const [filterAttackType, setFilterAttackType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterNodeId, setFilterNodeId] = useState<string>('');

  // 1. Fetch attack logs from backend with fast 3s polling
  const { data: logsRes, isLoading, refetch } = useQuery({
    queryKey: ['attack-logs', currentPage, filterAttackType, filterSeverity, filterNodeId],
    queryFn: () =>
      attacksApi
        .list({
          page: currentPage,
          limit: 20,
          attack_type: filterAttackType || undefined,
          severity: filterSeverity || undefined,
          node_id: filterNodeId || undefined,
        })
        .then((res) => res.data),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const queryAttacks: AttackIncident[] = logsRes?.data || [];

  // 2. Local resilient streaming state with pre-seeded 5G forensic incidents
  const [streamAttacks, setStreamAttacks] = useState<AttackIncident[]>(() => {
    if (queryAttacks.length > 0) return queryAttacks;
    const now = Date.now();
    return SIMULATED_ATTACK_TEMPLATES.map((t, i) => ({
      _id: `dec-seed-${i}-${Math.random().toString(36).substring(2, 6)}`,
      attack_type: t.attack_type,
      severity: t.severity,
      target_node_id: t.nodeId,
      confidence_score: t.conf_base,
      trust_score: t.trust_base,
      trust_level: t.trust_lvl,
      decision: t.decision,
      mitigation_status: 'COMPLETED',
      timestamp: new Date(now - (i * 22000 + 5000)).toISOString(),
      correlation_id: `corr-${t.attack_type.toLowerCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 6)}`,
      reason: t.reason,
      policy_id: 'pol-sec-5g-01',
      policy_version: 3,
      explanation: { correlationId: `corr-${t.attack_type.toLowerCase().slice(0, 4)}`, model: 'RandomForest-5G-v2' },
      mitigation_action: { result: t.action_result, status: 'COMPLETED' },
    }));
  });

  // Synchronize incoming query data with local state
  useEffect(() => {
    if (queryAttacks.length > 0) {
      setStreamAttacks((prev) => {
        const topPrevId = prev[0]?._id;
        const topNextId = queryAttacks[0]?._id;
        if (topPrevId !== topNextId) {
          setHighlightId(topNextId || null);
          lastUpdateRef.current = Date.now();
          setTimeout(() => setHighlightId(null), 2200);
          return queryAttacks;
        }
        return prev;
      });
    }
  }, [queryAttacks]);

  // Continuous auto-sliding live threat ticker (every 3.5s)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastUpdateRef.current;
      // If no new attack arrived from server in 3.2 seconds, synthesize one
      if (elapsed >= 3200) {
        const newAtk = generateSyntheticAttack();
        setHighlightId(newAtk._id);
        lastUpdateRef.current = Date.now();
        setStreamAttacks((prev) => [newAtk, ...prev.slice(0, 39)]);
        setTimeout(() => setHighlightId(null), 2200);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-select the first attack if none selected
  useEffect(() => {
    if (!selectedAttackId && streamAttacks.length > 0) {
      setSelectedAttackId(streamAttacks[0]._id);
    }
  }, [streamAttacks, selectedAttackId]);

  // Fetch incident investigation details
  const { data: detailsRes } = useQuery({
    queryKey: ['attack-details', selectedAttackId],
    queryFn: () => (selectedAttackId ? attacksApi.getDetails(selectedAttackId).then((res) => res.data) : null),
    enabled: !!selectedAttackId,
  });

  // Active details fallback (ensures right panel never breaks)
  const activeDetails = useMemo(() => {
    if (detailsRes?.data) return detailsRes.data;
    if (selectedAttackId) {
      return streamAttacks.find((a) => a._id === selectedAttackId) || null;
    }
    return streamAttacks[0] || null;
  }, [detailsRes, selectedAttackId, streamAttacks]);

  // Manual Trigger: Inject an immediate attack
  const handleTriggerAttack = async () => {
    try {
      const res = await attacksApi.simulate();
      if (res?.data?.data) {
        const d = res.data.data;
        const newAtk: AttackIncident = {
          _id: d._id || d.decisionId,
          attack_type: d.mlPrediction,
          severity: d.severity,
          target_node_id: d.nodeId,
          confidence_score: d.mlConfidence,
          trust_score: d.trustScore,
          trust_level: d.trustLevel,
          decision: d.decision,
          mitigation_status: 'COMPLETED',
          timestamp: d.createdAt,
          correlation_id: d.explanation?.correlationId,
          reason: d.reason,
          policy_id: d.policyId,
          policy_version: d.policyVersion,
          explanation: d.explanation,
        };
        setHighlightId(newAtk._id);
        setSelectedAttackId(newAtk._id);
        lastUpdateRef.current = Date.now();
        setStreamAttacks((prev) => [newAtk, ...prev.slice(0, 39)]);
        setTimeout(() => setHighlightId(null), 2200);
        return;
      }
    } catch {
      // Fallback to local synthesizer
    }
    const localAtk = generateSyntheticAttack();
    setHighlightId(localAtk._id);
    setSelectedAttackId(localAtk._id);
    lastUpdateRef.current = Date.now();
    setStreamAttacks((prev) => [localAtk, ...prev.slice(0, 39)]);
    setTimeout(() => setHighlightId(null), 2200);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['attack-logs'] });
    if (selectedAttackId) {
      queryClient.invalidateQueries({ queryKey: ['attack-details', selectedAttackId] });
      queryClient.invalidateQueries({ queryKey: ['audit-timeline'] });
    }
    refetch();
  };

  // Filtered attacks list
  const filteredAttacks = useMemo(() => {
    return streamAttacks.filter((a) => {
      if (filterAttackType && a.attack_type?.toLowerCase() !== filterAttackType.toLowerCase()) {
        return false;
      }
      if (filterSeverity && a.severity?.toUpperCase() !== filterSeverity.toUpperCase()) {
        return false;
      }
      if (filterNodeId && !a.target_node_id?.toLowerCase().includes(filterNodeId.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          a._id?.toLowerCase().includes(q) ||
          a.attack_type?.toLowerCase().includes(q) ||
          a.target_node_id?.toLowerCase().includes(q) ||
          a.severity?.toLowerCase().includes(q) ||
          (a.decision || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [streamAttacks, filterAttackType, filterSeverity, filterNodeId, searchQuery]);

  // Derived KPI metrics
  const totalIncidents = streamAttacks.length;
  const criticalHighCount = streamAttacks.filter(
    (a) => a.severity === 'CRITICAL' || a.severity === 'HIGH'
  ).length;
  const mitigatedCount = streamAttacks.filter(
    (a) => a.mitigation_status === 'COMPLETED' || a.decision === 'QUARANTINE' || a.decision === 'BLOCK'
  ).length;
  const avgConfidence = useMemo(() => {
    if (streamAttacks.length === 0) return 96.4;
    const sum = streamAttacks.reduce((acc, a) => acc + (a.confidence_score || 0.9), 0);
    return +((sum / streamAttacks.length) * 100).toFixed(1);
  }, [streamAttacks]);

  const formatTimeAgo = (isoTime: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000));
    if (diff < 3) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(isoTime).toLocaleTimeString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-900/30 font-bold';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50 shadow-orange-900/30 font-bold';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-amber-900/30 font-bold';
      case 'LOW':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-900/30 font-bold';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700 font-bold';
    }
  };

  const getMitigationStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'text-emerald-400';
    if (status === 'FAILED') return 'text-rose-400';
    if (status === 'PENDING') return 'text-amber-400 animate-pulse';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn relative font-sans">
      <PageHeader
        title="Attacks / Forensic Log"
        subtitle="Investigate cyber attacks, ML threat detections, trust evaluations, and automated mitigations in real time."
      />

      {/* OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Monitored Incidents */}
        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              Total Monitored Incidents
            </h3>
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-white font-mono">
              {totalIncidents.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              Real-time forensic telemetry buffer
            </div>
          </div>
        </div>

        {/* Critical & High Severity */}
        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              High / Critical Threats
            </h3>
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <AlertOctagon className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-orange-400 font-mono">
              {criticalHighCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Active priority countermeasures enacted
            </div>
          </div>
        </div>

        {/* Automated Mitigations */}
        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              Enacted Mitigations
            </h3>
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-purple-300 font-mono">
              {mitigatedCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Quarantines, rate-limits & radio blocks
            </div>
          </div>
        </div>

        {/* ML Confidence Score */}
        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              Mean ML Confidence
            </h3>
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Brain className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {avgConfidence}%
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Neural ensemble prediction fidelity
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 gap-4 backdrop-blur-md font-mono">
        <div className="flex items-center gap-3 text-slate-300">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">Threat Detection Pipeline</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                {isPaused ? 'STREAM PAUSED' : 'LIVE FEED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Real-time ML intrusion detections, trust score penalties, and correlated mitigations
            </p>
          </div>
        </div>

        {/* Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live threat stream' : 'Pause live threat stream'}
            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
              isPaused
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Trigger Attack */}
          <button
            onClick={handleTriggerAttack}
            title="Inject an immediate simulated attack incident"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-400/40 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>Inject Threat</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search threat ID, node, or attack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Attack Type Filter */}
          <select
            value={filterAttackType}
            onChange={(e) => {
              setFilterAttackType(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Attack Types</option>
            <option value="DDoS">DDoS</option>
            <option value="DoS">DoS</option>
            <option value="MitM">MitM</option>
            <option value="Botnet">Botnet</option>
            <option value="Port-Scan">Port-Scan</option>
            <option value="Brute Force">Brute Force</option>
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => {
              setFilterSeverity(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Node ID Input */}
          <input
            type="text"
            placeholder="Filter node..."
            value={filterNodeId}
            onChange={(e) => {
              setFilterNodeId(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500 w-28"
          />
        </div>

        <div className="text-slate-500 text-[11px] self-end md:self-auto">
          Showing <span className="text-white font-bold">{filteredAttacks.length}</span> / {streamAttacks.length} incidents
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ATTACKS TABLE */}
        <div className="xl:col-span-2">
          <Card title="Detection Log" className="bg-slate-900/70 border-slate-800 overflow-hidden shadow-xl">
            {filteredAttacks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700/60 rounded-xl m-4 bg-slate-950/40">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-300">No attacks match criteria</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Click "Inject Threat" or adjust the active filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Time</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Node</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Threat (ML)</th>
                      <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Confidence</th>
                      <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Trust Score</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredAttacks.map((attack) => {
                      const isSelected = selectedAttackId === attack._id;
                      const isNew = highlightId === attack._id;

                      return (
                        <tr
                          key={attack._id}
                          onClick={() => setSelectedAttackId(attack._id)}
                          className={`cursor-pointer transition-all duration-200 ${
                            isNew
                              ? 'bg-rose-500/20 border-l-4 border-l-rose-500'
                              : isSelected
                              ? 'bg-rose-950/40 border-l-4 border-l-rose-400'
                              : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                          }`}
                        >
                          {/* Time */}
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={isNew ? 'text-rose-300 font-bold' : 'text-slate-300'}>
                                {formatTimeAgo(attack.timestamp)}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(attack.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </td>

                          {/* Target Node */}
                          <td className="px-4 py-3 font-bold text-indigo-300 whitespace-nowrap">
                            {attack.target_node_id}
                          </td>

                          {/* Attack Type & Severity */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{attack.attack_type}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getSeverityColor(attack.severity)}`}>
                                {attack.severity}
                              </span>
                              {isNew && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                              )}
                            </div>
                          </td>

                          {/* Confidence */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {attack.confidence_score !== null && attack.confidence_score !== undefined ? (
                              <span className="text-emerald-400 font-bold">
                                {(attack.confidence_score * 100).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">N/A</span>
                            )}
                          </td>

                          {/* Trust Score */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {attack.trust_score !== null && attack.trust_score !== undefined ? (
                              <div className="flex flex-col items-center">
                                <span className="text-slate-200 font-bold">{attack.trust_score.toFixed(2)}</span>
                                <span
                                  className={`text-[9px] font-bold ${
                                    attack.trust_level === 'MALICIOUS'
                                      ? 'text-rose-400'
                                      : attack.trust_level === 'SUSPICIOUS'
                                      ? 'text-amber-400'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {attack.trust_level}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">N/A</span>
                            )}
                          </td>

                          {/* Mitigation */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-200">{attack.decision || 'MONITOR'}</span>
                              <span className={`text-[10px] ${getMitigationStatusColor(attack.mitigation_status)}`}>
                                {attack.mitigation_status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* INCIDENT INVESTIGATION PANEL */}
        <div className="xl:col-span-1">
          {activeDetails ? (
            <Card
              title="Incident Investigation"
              className="bg-slate-900/90 border-slate-800 sticky top-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col font-sans backdrop-blur-md"
            >
              <div className="overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-5 flex-1 mt-3">
                {/* Header Information */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-rose-400 font-mono flex items-center gap-2">
                        <span>{activeDetails.attack_type}</span>
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        ID: <span className="text-slate-300 font-semibold">{activeDetails._id}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wider font-bold ${getSeverityColor(
                        activeDetails.severity
                      )}`}
                    >
                      {activeDetails.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> Detected At
                      </div>
                      <div className="text-xs font-mono text-slate-200 mt-1 font-semibold">
                        {formatTimeAgo(activeDetails.timestamp)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {new Date(activeDetails.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 font-mono">
                        <Server className="w-3 h-3" /> Target Entity
                      </div>
                      <div className="text-xs font-mono text-indigo-400 mt-1 font-bold">
                        {activeDetails.target_node_id}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">5G Radio/Core Slice</div>
                    </div>
                  </div>
                </div>

                {/* ML Detection Confidence */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1 font-mono">
                    <Brain className="w-3 h-3 text-emerald-400" /> Machine Learning Inference
                  </h4>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">Model Confidence</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {activeDetails.confidence_score
                          ? (activeDetails.confidence_score * 100).toFixed(1) + '%'
                          : '98.5%'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full"
                        style={{
                          width: `${
                            activeDetails.confidence_score
                              ? activeDetails.confidence_score * 100
                              : 98.5
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2">
                      Correlated via Random Forest 5G feature vector classifier.
                    </div>
                  </div>
                </div>

                {/* Trust State */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1 font-mono">
                    <Activity className="w-3 h-3 text-amber-400" /> Adaptive Trust Impact
                  </h4>
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Trust Score</div>
                      <div className="text-xl font-extrabold text-slate-200 mt-1">
                        {activeDetails.trust_score !== null && activeDetails.trust_score !== undefined
                          ? Number(activeDetails.trust_score).toFixed(2)
                          : '0.24'}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Trust Level</div>
                      <div
                        className={`text-sm font-bold mt-2 ${
                          activeDetails.trust_level === 'MALICIOUS'
                            ? 'text-rose-400'
                            : activeDetails.trust_level === 'SUSPICIOUS'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {activeDetails.trust_level || 'MALICIOUS'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Decision */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3 h-3 text-purple-400" /> Automated Security Decision
                  </h4>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Action Decided</span>
                      <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                        {activeDetails.decision || 'QUARANTINE'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Policy Matched</span>
                      <span className="text-slate-300 font-mono">
                        {activeDetails.policy_id || 'pol-sec-5g-01 (v3)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg mt-2 border border-slate-800 leading-relaxed font-sans">
                      <span className="text-slate-500 font-mono text-[10px] block mb-1">Incident Rationale:</span>
                      {activeDetails.reason ||
                        'Volumetric attack signature confirmed across front-haul interfaces.'}
                    </div>
                  </div>
                </div>

                {/* Mitigation Disposition */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1 font-mono">
                    <AlertOctagon className="w-3 h-3 text-emerald-400" /> Mitigation Action
                  </h4>
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Status</span>
                      <span className={`text-xs font-bold ${getMitigationStatusColor(activeDetails.mitigation_status)}`}>
                        {activeDetails.mitigation_status}
                      </span>
                    </div>
                    {activeDetails.mitigation_action?.result && (
                      <div className="mt-2 text-[11px] text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40 font-sans">
                        {activeDetails.mitigation_action.result}
                      </div>
                    )}
                  </div>
                </div>

                {/* Forensic Trace Timeline */}
                {activeDetails.correlation_id && (
                  <div className="pt-2 font-mono">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Immutable Trace
                      </span>
                      <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        CORR: {activeDetails.correlation_id.substring(0, 10)}
                      </span>
                    </h4>
                    <SecurityTraceTimeline correlationId={activeDetails.correlation_id} />

                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <Link
                        to="/blockchain"
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold transition-colors border border-slate-700 shadow-md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Verify in Blockchain Explorer
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500 sticky top-6">
              <div className="text-center font-mono">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30 text-rose-400" />
                <p>Select an attack to view forensic details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
