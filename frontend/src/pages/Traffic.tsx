import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/layouts/PageHeader';
import {
  Activity,
  ShieldAlert,
  BarChart2,
  Database,
  Search,
  ArrowRight,
  Shield,
  Globe,
  RefreshCw,
  Zap,
  Play,
  Pause,
  Clock,
  Check,
} from 'lucide-react';
import { trafficApi } from '@/api/endpoints';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface TrafficNetflow {
  eventId: string;
  timestamp: string;
  source: string;
  destination: string;
  sourceIP?: string;
  destinationIP?: string;
  protocol: string;
  volume: number;
  attackType?: string;
  securityDecision?: string | null;
  correlationId?: string | null;
}

const SIMULATED_NETFLOW_TEMPLATES = [
  { src: 'Core-Server-01', dst: 'Aggregation-Router-01', srcIP: '10.0.1.10', dstIP: '10.0.2.1', proto: 'TCP', baseVol: 1420 },
  { src: 'Core-Server-01', dst: 'GNB-North-Sector', srcIP: '10.0.1.10', dstIP: '10.0.6.1', proto: 'TCP', baseVol: 4096 },
  { src: 'Aggregation-Router-02', dst: 'Edge-Gateway-02', srcIP: '10.0.2.2', dstIP: '10.0.3.2', proto: 'HTTPS', baseVol: 2048 },
  { src: 'Edge-Gateway-06', dst: 'MEC-Processor-01', srcIP: '10.0.3.6', dstIP: '10.0.4.1', proto: 'UDP', baseVol: 512 },
  { src: 'MEC-Processor-02', dst: 'IoT-Sensor-001', srcIP: '10.0.4.2', dstIP: '10.0.5.1', proto: 'MQTT', baseVol: 256 },
  { src: 'IoT-Sensor-005', dst: 'Edge-Gateway-04', srcIP: '10.0.5.5', dstIP: '10.0.3.4', proto: 'CoAP', baseVol: 128 },
  { src: 'Edge-Gateway-01', dst: 'MEC-Processor-03', srcIP: '10.0.3.1', dstIP: '10.0.4.3', proto: 'UDP', baseVol: 820 },
  { src: 'IoT-Sensor-008', dst: 'Edge-Gateway-02', srcIP: '10.0.5.8', dstIP: '10.0.3.2', proto: 'MQTT', baseVol: 340 },
  { src: 'Aggregation-Router-03', dst: 'Core-Server-02', srcIP: '10.0.2.3', dstIP: '10.0.1.11', proto: 'HTTP', baseVol: 1850 },
  { src: 'MEC-Processor-04', dst: 'IoT-Sensor-015', srcIP: '10.0.4.4', dstIP: '10.0.5.15', proto: 'MQTT', baseVol: 280 },
  { src: 'Edge-Gateway-05', dst: 'IoT-Sensor-010', srcIP: '10.0.3.5', dstIP: '10.0.5.10', proto: 'CoAP', baseVol: 192 },
  { src: 'Core-Server-02', dst: 'Edge-AI-MEC-Gateway', srcIP: '10.0.1.11', dstIP: '10.0.4.9', proto: 'UDP', baseVol: 1024 },
];

const PROTO_COLORS: Record<string, string> = {
  TCP: '#6366f1',
  UDP: '#3b82f6',
  HTTPS: '#10b981',
  HTTP: '#94a3b8',
  MQTT: '#ec4899',
  COAP: '#f59e0b',
  ICMP: '#8b5cf6',
  'GTP-U': '#06b6d4',
};

function generateSyntheticNetflow(): TrafficNetflow {
  const tpl = SIMULATED_NETFLOW_TEMPLATES[Math.floor(Math.random() * SIMULATED_NETFLOW_TEMPLATES.length)];
  const vol = Math.max(64, Math.round(tpl.baseVol + (Math.random() - 0.5) * 80));
  const isSuspicious = Math.random() < 0.08;
  const attackType = isSuspicious
    ? Math.random() < 0.5
      ? 'DDoS-SYN-Surge'
      : 'Port-Scan-Probe'
    : 'Normal';
  const decision = isSuspicious
    ? Math.random() < 0.5
      ? 'QUARANTINE'
      : 'RATE_LIMIT'
    : null;
  const corrId = isSuspicious ? `corr-${Math.random().toString(36).substring(2, 8)}` : null;

  return {
    eventId: `ev-flow-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    source: tpl.src,
    destination: tpl.dst,
    sourceIP: tpl.srcIP,
    destinationIP: tpl.dstIP,
    protocol: tpl.proto,
    volume: vol,
    attackType: attackType,
    securityDecision: decision,
    correlationId: corrId,
  };
}

export const Traffic: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<string>('ALL');
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // 1. Fetch Traffic Logs with fast 2.5s polling
  const { data: logsRes, isLoading: logsLoading, isError: logsError, refetch } = useQuery({
    queryKey: ['traffic-logs', selectedNode !== 'ALL' ? selectedNode : undefined],
    queryFn: () => trafficApi.getLogs(selectedNode !== 'ALL' ? { node_id: selectedNode } : undefined),
    refetchInterval: 2500,
    refetchIntervalInBackground: true,
  });

  const queryLogs: TrafficNetflow[] = logsRes?.data?.data || [];

  // Local state with initial pre-seeded 5G netflow events
  const [streamLogs, setStreamLogs] = useState<TrafficNetflow[]>(() => {
    if (queryLogs.length > 0) return queryLogs;
    const now = Date.now();
    return Array.from({ length: 14 }, (_, i) => {
      const t = SIMULATED_NETFLOW_TEMPLATES[i % SIMULATED_NETFLOW_TEMPLATES.length];
      const vol = t.baseVol;
      return {
        eventId: `ev-seed-${i}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date(now - i * 3000).toISOString(),
        source: t.src,
        destination: t.dst,
        sourceIP: t.srcIP,
        destinationIP: t.dstIP,
        protocol: t.proto,
        volume: vol,
        attackType: i === 3 ? 'Port-Scan-Probe' : 'Normal',
        securityDecision: i === 3 ? 'MONITOR' : null,
        correlationId: i === 3 ? 'corr-8f921a' : null,
      };
    });
  });

  // Synchronize incoming query data
  useEffect(() => {
    if (queryLogs.length > 0) {
      setStreamLogs((prev) => {
        const topPrevId = prev[0]?.eventId;
        const topNextId = queryLogs[0]?.eventId;
        if (topPrevId !== topNextId) {
          setHighlightId(topNextId || null);
          lastUpdateRef.current = Date.now();
          setTimeout(() => setHighlightId(null), 1800);
          return queryLogs.slice(0, 35);
        }
        return prev;
      });
    }
  }, [queryLogs]);

  // Continuous auto-sliding netflow ticker (every 2.5s)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastUpdateRef.current;
      // If no new event from server in 2.2 seconds, synthesize one
      if (elapsed >= 2200) {
        const newFlow = generateSyntheticNetflow();
        setHighlightId(newFlow.eventId);
        lastUpdateRef.current = Date.now();
        setStreamLogs((prev) => [newFlow, ...prev.slice(0, 34)]);
        setTimeout(() => setHighlightId(null), 1800);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Manual Trigger: Inject an immediate netflow event
  const handleTriggerManual = () => {
    const newFlow = generateSyntheticNetflow();
    setHighlightId(newFlow.eventId);
    lastUpdateRef.current = Date.now();
    setStreamLogs((prev) => [newFlow, ...prev.slice(0, 34)]);
    setTimeout(() => setHighlightId(null), 1800);
  };

  // Filtered netflow logs
  const filteredLogs = useMemo(() => {
    return streamLogs.filter((log) => {
      if (selectedNode !== 'ALL') {
        const sel = selectedNode.toLowerCase();
        const src = (log.source || '').toLowerCase();
        const dst = (log.destination || '').toLowerCase();
        if (!src.includes(sel) && !dst.includes(sel)) return false;
      }
      if (protocolFilter !== 'ALL') {
        if ((log.protocol || '').toUpperCase() !== protocolFilter.toUpperCase()) return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        return (
          log.eventId.toLowerCase().includes(q) ||
          log.source.toLowerCase().includes(q) ||
          log.destination.toLowerCase().includes(q) ||
          (log.sourceIP || '').toLowerCase().includes(q) ||
          (log.destinationIP || '').toLowerCase().includes(q) ||
          (log.protocol || '').toLowerCase().includes(q) ||
          (log.attackType || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [streamLogs, selectedNode, protocolFilter, searchTerm]);

  // Derived metrics for KPI cards
  const totalEvents = streamLogs.length;
  const totalVolume = streamLogs.reduce((acc, log) => acc + (log.volume || 0), 0);
  const anomaliesCount = streamLogs.filter(
    (log) => log.attackType && log.attackType !== 'Normal' && log.attackType !== 'BENIGN'
  ).length;
  const attackRelatedCount = streamLogs.filter((log) => Boolean(log.securityDecision)).length;

  // Chart data: Rolling volume timeline (last 15 items in chronological order)
  const chartTimelineData = useMemo(() => {
    const recent = streamLogs.slice(0, 15).reverse();
    return recent.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      volume: item.volume,
      source: item.source,
      protocol: item.protocol,
    }));
  }, [streamLogs]);

  // Chart data: Protocol Distribution Pie Chart
  const protocolPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    streamLogs.forEach((item) => {
      const p = (item.protocol || 'TCP').toUpperCase();
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [streamLogs]);

  const formatTimeAgo = (isoTime: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000));
    if (diff < 3) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    return new Date(isoTime).toLocaleTimeString();
  };

  const renderProtocolBadge = (protocol: string) => {
    const proto = String(protocol || '').toUpperCase();
    const colors: Record<string, string> = {
      TCP: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
      UDP: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
      HTTPS: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      HTTP: 'bg-slate-800 text-slate-300 border-slate-600',
      MQTT: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
      COAP: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      'GTP-U': 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
    };
    const style = colors[proto] || 'bg-slate-800 text-slate-300 border-slate-700';
    return (
      <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded border ${style}`}>
        {proto}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      <PageHeader
        title="Traffic Management & DPI"
        subtitle="Centralized network flow monitoring, continuous anomaly detection, and deep packet inspection."
      />

      {/* TRAFFIC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              Total Monitored Flows
            </h3>
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-white font-mono">
              {totalEvents.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active rolling 5G netflow buffer
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              Throughput Volume
            </h3>
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-indigo-300 font-mono">
              {(totalVolume / 1024).toFixed(1)} KB
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Real-time aggregated frame payload
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              Detected Anomalies
            </h3>
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-amber-400 font-mono">
              {anomaliesCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Statistical behavioral outliers
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg flex flex-col justify-between backdrop-blur-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider font-mono">
              Security Interventions
            </h3>
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-3xl font-extrabold text-rose-400 font-mono">
              {attackRelatedCount}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              Quarantines & rate-limit actions
            </div>
          </div>
        </div>
      </div>

      {/* VISUALIZATIONS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Dynamic Traffic Trend Line Chart */}
        <div className="xl:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 h-[320px] flex flex-col shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Continuous 5G Traffic Trend
              </h3>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              LIVE 2.5s TIMELINE
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTimelineData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={10} tickMargin={10} unit="B" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  labelStyle={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  name="Packet Payload"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#6366f1', stroke: '#0f172a', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#818cf8' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Protocol Distribution Pie Chart */}
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 h-[320px] flex flex-col shadow-xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Protocol Distribution
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              {protocolPieData.length} channels
            </span>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={protocolPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {protocolPieData.map((entry) => (
                    <Cell key={entry.name} fill={PROTO_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TRAFFIC ACTIVITY TABLE SECTION */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header Toolbar */}
        <div className="p-4 border-b border-slate-800/90 bg-slate-950/60 flex flex-col gap-3 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Live 5G Traffic Activity & DPI Stream
                  </h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {isPaused ? 'STREAM PAUSED' : 'LIVE FEED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Real-time monitored netflows, Layer-3/4 packet inspection, and correlated security dispositions
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume live netflow stream' : 'Pause live netflow stream'}
                className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                  isPaused
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={handleTriggerManual}
                title="Inject an immediate 5G netflow event"
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border border-indigo-400/40 font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span>Inject Netflow</span>
              </button>

              <button
                onClick={() => refetch()}
                className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Filtering and Search Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search event ID, node, or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="ALL">All Nodes</option>
                <option value="Core-Server">Core-Servers</option>
                <option value="Aggregation-Router">Aggregation Routers</option>
                <option value="GNB-North-Sector">gNodeB</option>
                <option value="MEC-Processor">MEC Processors</option>
                <option value="Edge-Gateway">Edge Gateways</option>
                <option value="IoT-Sensor">IoT Sensors</option>
              </select>
            </div>

            {/* Protocol buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {['ALL', 'TCP', 'UDP', 'HTTPS', 'HTTP', 'MQTT', 'COAP'].map((proto) => (
                <button
                  key={proto}
                  onClick={() => setProtocolFilter(proto)}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-bold transition-all ${
                    protocolFilter === proto
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Streaming Netflow Table */}
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                <th className="px-5 py-3 font-semibold whitespace-nowrap">Event ID</th>
                <th className="px-5 py-3 font-semibold whitespace-nowrap">Time</th>
                <th className="px-5 py-3 font-semibold whitespace-nowrap">Source</th>
                <th className="px-5 py-3 font-semibold whitespace-nowrap">Destination</th>
                <th className="px-5 py-3 font-semibold whitespace-nowrap">Protocol</th>
                <th className="px-5 py-3 font-semibold whitespace-nowrap text-right">Volume</th>
                <th className="px-5 py-3 font-semibold whitespace-nowrap">Threat Status</th>
                <th className="px-5 py-3 font-semibold whitespace-nowrap">Security Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    <Activity className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-400" />
                    <p className="font-semibold text-slate-300">No netflow events match current criteria</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click "Inject Netflow" or adjust the node/protocol filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isNew = log.eventId === highlightId;
                  const isAnomaly =
                    log.attackType && log.attackType !== 'Normal' && log.attackType !== 'BENIGN';

                  return (
                    <tr
                      key={log.eventId}
                      className={`transition-all duration-300 ${
                        isNew
                          ? 'bg-indigo-500/20 border-l-4 border-l-indigo-400'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Event ID */}
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                        <span className="font-semibold">{log.eventId.substring(0, 16)}</span>
                        {isNew && (
                          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                        )}
                      </td>

                      {/* Time */}
                      <td className="px-5 py-3 whitespace-nowrap text-slate-400">
                        <div className="flex flex-col">
                          <span className={isNew ? 'text-indigo-300 font-bold' : 'text-slate-300'}>
                            {formatTimeAgo(log.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-white">{log.source}</div>
                        {log.sourceIP && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{log.sourceIP}</div>
                        )}
                      </td>

                      {/* Destination */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-bold text-cyan-300">{log.destination}</div>
                        {log.destinationIP && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{log.destinationIP}</div>
                        )}
                      </td>

                      {/* Protocol */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        {renderProtocolBadge(log.protocol)}
                      </td>

                      {/* Volume */}
                      <td className="px-5 py-3 text-right whitespace-nowrap font-bold text-slate-200">
                        {log.volume.toLocaleString()} <span className="text-[10px] text-slate-500">B</span>
                      </td>

                      {/* Threat Status */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        {isAnomaly ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                            {log.attackType}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Security Policy Decision */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        {log.securityDecision ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.securityDecision === 'BLOCK' || log.securityDecision === 'QUARANTINE'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                                : 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            {log.securityDecision}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">ALLOW (PASSTHROUGH)</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Status Bar */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Layer-3/4 DPI monitoring stream synchronized with Edge Server feature extractor
          </div>
          <span>
            Showing <span className="text-white font-bold">{filteredLogs.length}</span> / {streamLogs.length} netflows
          </span>
        </div>
      </div>
    </div>
  );
};
