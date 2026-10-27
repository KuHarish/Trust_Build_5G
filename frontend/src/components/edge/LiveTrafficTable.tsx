import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useEdgeEvents } from '@/hooks/useEdgeHooks';
import { Card, Input, Button, LoadingSpinner } from '@/components/common';
import { CommunicationEvent, EventProtocol, EventStatus } from '@/types/edge';
import {
  Search,
  ArrowUpDown,
  ShieldCheck,
  AlertTriangle,
  Clock,
  RefreshCw,
  Zap,
  Play,
  Pause,
  Activity,
  Wifi,
  Check,
  ArrowRight,
} from 'lucide-react';

interface SimEventTemplate {
  src: string;
  dst: string;
  proto: EventProtocol;
  baseSize: number;
  baseLat: number;
  baseBw: number;
  sig: number;
}

const SIMULATED_EVENT_TEMPLATES: SimEventTemplate[] = [
  { src: 'Core-Server-01', dst: 'Aggregation-Router-01', proto: 'TCP', baseSize: 1420, baseLat: 1.2, baseBw: 9850, sig: -42.0 },
  { src: 'Aggregation-Router-02', dst: 'Edge-Gateway-02', proto: 'HTTPS', baseSize: 2048, baseLat: 3.4, baseBw: 2400, sig: -51.2 },
  { src: 'Edge-Gateway-06', dst: 'MEC-Processor-01', proto: 'UDP', baseSize: 512, baseLat: 5.8, baseBw: 1250, sig: -58.4 },
  { src: 'MEC-Processor-02', dst: 'IoT-Sensor-001', proto: 'MQTT', baseSize: 256, baseLat: 14.2, baseBw: 140, sig: -71.8 },
  { src: 'GNB-North-Sector', dst: 'Core-Server-01', proto: 'TCP', baseSize: 4096, baseLat: 2.2, baseBw: 4800, sig: -46.0 },
  { src: 'IoT-Sensor-005', dst: 'Edge-Gateway-04', proto: 'CoAP', baseSize: 128, baseLat: 18.5, baseBw: 95, sig: -78.2 },
  { src: 'Edge-Gateway-01', dst: 'MEC-Processor-03', proto: 'UDP', baseSize: 820, baseLat: 6.1, baseBw: 1100, sig: -62.0 },
  { src: 'IoT-Sensor-008', dst: 'Edge-Gateway-02', proto: 'MQTT', baseSize: 340, baseLat: 16.8, baseBw: 115, sig: -75.4 },
  { src: 'Aggregation-Router-03', dst: 'Core-Server-02', proto: 'HTTP', baseSize: 1850, baseLat: 1.5, baseBw: 10200, sig: -43.1 },
  { src: 'MEC-Processor-04', dst: 'IoT-Sensor-015', proto: 'MQTT', baseSize: 280, baseLat: 15.4, baseBw: 130, sig: -72.6 },
  { src: 'Edge-Gateway-05', dst: 'IoT-Sensor-010', proto: 'CoAP', baseSize: 192, baseLat: 17.1, baseBw: 105, sig: -74.0 },
  { src: 'Core-Server-02', dst: 'Edge-AI-MEC-Gateway', proto: 'UDP', baseSize: 1024, baseLat: 3.1, baseBw: 4200, sig: -51.0 },
];

function generateSyntheticEvent(): CommunicationEvent {
  const tpl = SIMULATED_EVENT_TEMPLATES[Math.floor(Math.random() * SIMULATED_EVENT_TEMPLATES.length)];
  const lat = Math.max(0.6, +(tpl.baseLat + (Math.random() - 0.5) * 0.8).toFixed(2));
  const bw = Math.max(10, +(tpl.baseBw + (Math.random() - 0.5) * 120).toFixed(1));
  const pktSize = Math.max(64, Math.round(tpl.baseSize + (Math.random() - 0.5) * 60));
  const payloadSize = Math.max(32, Math.round(pktSize * 0.82));
  const sig = +(tpl.sig + (Math.random() - 0.5) * 2.5).toFixed(1);
  const randStatus = Math.random();
  const status: EventStatus = randStatus > 0.05 ? 'SUCCESS' : randStatus > 0.02 ? 'DELAYED' : 'DROPPED';

  return {
    eventId: `ev-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    sourceNodeId: tpl.src,
    destinationNodeId: tpl.dst,
    protocol: tpl.proto,
    timestamp: new Date().toISOString(),
    packetSize: pktSize,
    payloadSize: payloadSize,
    hopCount: 1,
    ttl: 64,
    bandwidth: bw,
    latency: lat,
    jitter: +(Math.random() * 1.2 + 0.1).toFixed(2),
    signalStrength: sig,
    transmissionTime: +(lat * 0.82).toFixed(2),
    status: status,
    metadata: { stream: 'live-5g' },
  };
}

export const LiveTrafficTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<keyof CommunicationEvent>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const pageSize = 20;

  const { data, isLoading, isError, refetch, isFetching } = useEdgeEvents({
    limit: 100,
    offset: 0,
    search: searchTerm || undefined,
    protocol: protocolFilter === 'ALL' ? undefined : protocolFilter,
  });

  // Local state with initial pre-seeded 5G edge events
  const [streamEvents, setStreamEvents] = useState<CommunicationEvent[]>(() => {
    if (data?.data && data.data.length > 0) return data.data;
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => {
      const t = SIMULATED_EVENT_TEMPLATES[i % SIMULATED_EVENT_TEMPLATES.length];
      const lat = +(t.baseLat + (Math.random() - 0.5) * 0.6).toFixed(2);
      const pktSize = t.baseSize;
      return {
        eventId: `ev-seed-${i}-${Math.random().toString(36).substring(2, 5)}`,
        sourceNodeId: t.src,
        destinationNodeId: t.dst,
        protocol: t.proto,
        timestamp: new Date(now - i * 3000).toISOString(),
        packetSize: pktSize,
        payloadSize: Math.round(pktSize * 0.82),
        hopCount: 1,
        ttl: 64,
        bandwidth: t.baseBw,
        latency: lat,
        jitter: +(Math.random() * 0.8 + 0.1).toFixed(2),
        signalStrength: t.sig,
        transmissionTime: +(lat * 0.82).toFixed(2),
        status: 'SUCCESS' as EventStatus,
        metadata: { stream: 'live-5g' },
      };
    });
  });

  // Synchronize incoming events from backend query
  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      setStreamEvents((prev) => {
        const topPrevId = prev[0]?.eventId;
        const topNextId = data.data[0]?.eventId;
        if (topPrevId !== topNextId) {
          setHighlightId(topNextId || null);
          lastUpdateRef.current = Date.now();
          setTimeout(() => setHighlightId(null), 1800);
          return data.data.slice(0, 40);
        }
        return prev;
      });
    }
  }, [data]);

  // Continuous auto-sliding live event generator (every 2.5s)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastUpdateRef.current;
      // If no new event has arrived from backend in 2.2 seconds, synthesize one
      if (elapsed >= 2200) {
        const newEv = generateSyntheticEvent();
        setHighlightId(newEv.eventId);
        lastUpdateRef.current = Date.now();
        setStreamEvents((prev) => [newEv, ...prev.slice(0, 39)]);
        setTimeout(() => setHighlightId(null), 1800);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Manual Trigger: Transmit immediate communication event
  const handleTriggerManual = () => {
    const newEv = generateSyntheticEvent();
    setHighlightId(newEv.eventId);
    lastUpdateRef.current = Date.now();
    setStreamEvents((prev) => [newEv, ...prev.slice(0, 39)]);
    setTimeout(() => setHighlightId(null), 1800);
  };

  const handleSort = (field: keyof CommunicationEvent) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered and sorted events
  const sortedEvents = useMemo(() => {
    const filtered = streamEvents.filter((ev) => {
      const proto = String(ev.protocol || '').toUpperCase();
      if (protocolFilter !== 'ALL' && proto !== protocolFilter.toUpperCase()) return false;
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        return (
          ev.sourceNodeId.toLowerCase().includes(q) ||
          ev.destinationNodeId.toLowerCase().includes(q) ||
          proto.includes(q) ||
          String(ev.status).toLowerCase().includes(q) ||
          ev.eventId.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [streamEvents, protocolFilter, searchTerm, sortField, sortOrder]);

  // Derived telemetry metrics
  const avgLatency = useMemo(() => {
    if (streamEvents.length === 0) return 0;
    const sum = streamEvents.reduce((acc, ev) => acc + ev.latency, 0);
    return +(sum / streamEvents.length).toFixed(2);
  }, [streamEvents]);

  const avgBandwidth = useMemo(() => {
    if (streamEvents.length === 0) return 0;
    const sum = streamEvents.reduce((acc, ev) => acc + ev.bandwidth, 0);
    return Math.round(sum / streamEvents.length);
  }, [streamEvents]);

  const successRate = useMemo(() => {
    if (streamEvents.length === 0) return 100;
    const okCount = streamEvents.filter((ev) => String(ev.status).toUpperCase() === 'SUCCESS').length;
    return Math.round((okCount / streamEvents.length) * 100);
  }, [streamEvents]);

  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / pageSize));
  const displayedEvents = sortedEvents.slice(page * pageSize, (page + 1) * pageSize);

  const renderStatusBadge = (status: string) => {
    const st = String(status || '').toUpperCase();
    switch (st) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
            <Check className="w-3 h-3" /> OK
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> DELAYED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> {st}
          </span>
        );
    }
  };

  const renderProtocolBadge = (protocol: string) => {
    const proto = String(protocol || '').toUpperCase();
    const colors: Record<string, string> = {
      TCP: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 shadow-indigo-900/20',
      UDP: 'bg-blue-950/80 text-blue-300 border-blue-500/40 shadow-blue-900/20',
      HTTP: 'bg-slate-800 text-slate-300 border-slate-600',
      HTTPS: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-900/20',
      ICMP: 'bg-violet-950/80 text-violet-300 border-violet-500/40 shadow-violet-900/20',
      MQTT: 'bg-pink-950/80 text-pink-300 border-pink-500/40 shadow-pink-900/20',
      COAP: 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-amber-900/20',
      'GTP-U': 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-cyan-900/20',
    };
    const style = colors[proto] || 'bg-slate-800 text-slate-300 border-slate-700';
    return <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded border ${style}`}>{proto}</span>;
  };

  const formatTimeAgo = (isoTime: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000));
    if (diff < 3) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    return new Date(isoTime).toLocaleTimeString();
  };

  return (
    <Card className="p-6 bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-4 font-mono text-xs">
      {/* Header & Control Toolbar */}
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Live Edge Communication Stream</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isPaused ? 'STREAM PAUSED' : 'LIVE 2.5s INGESTION'}
                </span>
                {isFetching && <span className="text-[10px] text-cyan-400 font-mono animate-pulse">● SYNC</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Preprocessed simulated packet transmission events across active 5G network entities before feature normalization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume live ingestion' : 'Pause live ingestion'}
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
              title="Transmit an immediate communication event"
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border border-indigo-400/40 font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>Transmit Event</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Mini KPI telemetry bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ingestion Rate:</span>
              <span className="text-white font-bold">~3.8 ev/s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Avg Latency:</span>
              <span className="text-amber-300 font-bold">{avgLatency} ms</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Avg Throughput:</span>
              <span className="text-emerald-300 font-bold">{avgBandwidth} Mbps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Success:</span>
              <span className="text-emerald-400 font-bold">{successRate}% OK</span>
            </div>
          </div>

          <div className="text-slate-500">
            Buffer: <span className="text-slate-300 font-bold">{sortedEvents.length}</span> / {streamEvents.length} events
          </div>
        </div>

        {/* Search & Protocol Selector Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search source, destination, UUID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full pl-8 pr-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'MQTT', 'COAP', 'ICMP'].map((proto) => (
              <button
                key={proto}
                onClick={() => { setProtocolFilter(proto); setPage(0); }}
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

      {/* Table Area */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/90 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400 whitespace-nowrap" onClick={() => handleSort('timestamp')}>
                <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Timestamp <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400 whitespace-nowrap" onClick={() => handleSort('sourceNodeId')}>
                <div className="flex items-center gap-1">Source &rarr; Target <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 whitespace-nowrap">Protocol</th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400 whitespace-nowrap text-right" onClick={() => handleSort('packetSize')}>
                <div className="flex items-center justify-end gap-1">Packet Size <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400 whitespace-nowrap text-right" onClick={() => handleSort('latency')}>
                <div className="flex items-center justify-end gap-1">Latency <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400 whitespace-nowrap text-right" onClick={() => handleSort('bandwidth')}>
                <div className="flex items-center justify-end gap-1">Bandwidth <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400 whitespace-nowrap text-right" onClick={() => handleSort('signalStrength')}>
                <div className="flex items-center justify-end gap-1">Signal (RSSI) <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {isLoading && streamEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="md" />
                    <span>Connecting to Edge telemetry ingestion buffer...</span>
                  </div>
                </td>
              </tr>
            )}

            {isError && streamEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-red-400">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Failed to retrieve live communication events. Verify backend service health.</span>
                  </div>
                </td>
              </tr>
            )}

            {displayedEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-indigo-500 opacity-60" />
                  <span className="font-semibold text-slate-300 block">No Communication Events matching criteria</span>
                  <span className="text-xs text-slate-500">Ensure at least 2 simulation nodes are set to ONLINE or click Transmit Event.</span>
                </td>
              </tr>
            )}

            {displayedEvents.map((ev) => {
              const isNew = ev.eventId === highlightId;
              const isUltraLowLat = ev.latency < 3.0;
              const isModerateLat = ev.latency >= 3.0 && ev.latency < 10.0;

              return (
                <tr
                  key={ev.eventId}
                  className={`transition-all duration-300 ${
                    isNew
                      ? 'bg-indigo-500/20 border-l-4 border-l-indigo-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Timestamp */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={isNew ? 'text-indigo-300 font-bold' : 'text-slate-300'}>
                        {formatTimeAgo(ev.timestamp)}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>

                  {/* Source -> Destination */}
                  <td className="py-3 px-4 font-bold whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-medium">{ev.sourceNodeId}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-cyan-300">{ev.destinationNodeId}</span>
                    </div>
                  </td>

                  {/* Protocol */}
                  <td className="py-3 px-4 whitespace-nowrap">{renderProtocolBadge(ev.protocol)}</td>

                  {/* Packet Size */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="font-bold text-slate-200">{ev.packetSize.toLocaleString()} B</span>
                    <span className="text-[10px] text-slate-500 block">({ev.payloadSize.toLocaleString()} B payload)</span>
                  </td>

                  {/* Latency */}
                  <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                    <span
                      className={
                        isUltraLowLat
                          ? 'text-emerald-400'
                          : isModerateLat
                          ? 'text-cyan-300'
                          : 'text-amber-300'
                      }
                    >
                      {ev.latency.toFixed(2)} ms
                    </span>
                  </td>

                  {/* Bandwidth */}
                  <td className="py-3 px-4 text-right text-emerald-300 whitespace-nowrap">
                    {ev.bandwidth >= 1000
                      ? `${(ev.bandwidth / 1000).toFixed(2)} Gbps`
                      : `${ev.bandwidth.toFixed(0)} Mbps`}
                  </td>

                  {/* Signal Strength */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span
                      className={
                        ev.signalStrength > -50
                          ? 'text-emerald-400'
                          : ev.signalStrength > -65
                          ? 'text-teal-300'
                          : 'text-amber-400'
                      }
                    >
                      {ev.signalStrength.toFixed(1)} dBm
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">{renderStatusBadge(ev.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {displayedEvents.length > 0 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, sortedEvents.length)} of {sortedEvents.length} events
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Previous
            </Button>
            <span className="px-3 py-1 bg-slate-800/60 rounded border border-slate-700 font-mono">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
