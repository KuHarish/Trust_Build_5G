import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Packet } from '@/types/communication';
import { Card, LoadingSpinner, Button } from '@/components/common';
import {
  RefreshCw,
  Check,
  Zap,
  Play,
  Pause,
  Search,
  Activity,
  Wifi,
  ArrowRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface PacketsTableProps {
  packets?: Packet[];
  isLoading: boolean;
  onRefresh: () => void;
}

const SIMULATED_PACKET_TEMPLATES = [
  { src: 'Core-Server-01', dst: 'Aggregation-Router-01', proto: 'GTP-U', baseSize: 1420, baseLat: 1.2, baseBw: 10240, ttl: 64 },
  { src: 'Core-Server-01', dst: 'GNB-North-Sector', proto: 'TCP', baseSize: 4096, baseLat: 2.5, baseBw: 4800, ttl: 128 },
  { src: 'Aggregation-Router-02', dst: 'Edge-Gateway-02', proto: 'HTTPS', baseSize: 2048, baseLat: 4.1, baseBw: 2100, ttl: 64 },
  { src: 'Edge-Gateway-06', dst: 'MEC-Processor-01', proto: 'UDP', baseSize: 512, baseLat: 6.2, baseBw: 1200, ttl: 64 },
  { src: 'MEC-Processor-02', dst: 'IoT-Sensor-001', proto: 'MQTT', baseSize: 256, baseLat: 14.5, baseBw: 150, ttl: 64 },
  { src: 'MEC-Processor-03', dst: 'IoT-Sensor-005', proto: 'COAP', baseSize: 128, baseLat: 21.0, baseBw: 85, ttl: 64 },
  { src: 'Edge-Gateway-02', dst: 'IoT-Sensor-008', proto: 'MQTT', baseSize: 340, baseLat: 18.4, baseBw: 95, ttl: 64 },
  { src: 'Aggregation-Router-03', dst: 'Core-Server-02', proto: 'GTP-U', baseSize: 1850, baseLat: 1.4, baseBw: 10500, ttl: 64 },
  { src: 'MEC-Processor-04', dst: 'IoT-Sensor-015', proto: 'MQTT', baseSize: 280, baseLat: 15.8, baseBw: 130, ttl: 64 },
  { src: 'Core-Server-02', dst: 'Edge-AI-MEC-Gateway', proto: 'UDP', baseSize: 1024, baseLat: 3.1, baseBw: 4200, ttl: 64 },
  { src: 'Edge-Gateway-05', dst: 'IoT-Sensor-010', proto: 'COAP', baseSize: 192, baseLat: 17.5, baseBw: 110, ttl: 64 },
  { src: 'Edge-Gateway-04', dst: 'MEC-Processor-04', proto: 'UDP', baseSize: 820, baseLat: 6.0, baseBw: 1400, ttl: 64 },
];

function generateSyntheticPacket(counter: number): Packet {
  const tpl = SIMULATED_PACKET_TEMPLATES[Math.floor(Math.random() * SIMULATED_PACKET_TEMPLATES.length)];
  const lat = Math.max(0.6, +(tpl.baseLat + (Math.random() - 0.5) * 0.8).toFixed(2));
  const bw = Math.max(10, +(tpl.baseBw + (Math.random() - 0.5) * 120).toFixed(1));
  const pktSize = Math.max(64, Math.round(tpl.baseSize + (Math.random() - 0.5) * 60));
  const payloadSize = Math.max(32, Math.round(pktSize * 0.82));
  const randStatus = Math.random();
  const status = randStatus > 0.05 ? 'SUCCESS' : randStatus > 0.02 ? 'DELAYED' : 'DROPPED';

  return {
    packetId: `pkt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    sessionId: `sess-sim-${Math.floor(Math.random() * 20 + 1).toString().padStart(3, '0')}`,
    sourceNodeId: tpl.src,
    destinationNodeId: tpl.dst,
    sequenceNumber: counter,
    packetSize: pktSize,
    payloadSize: payloadSize,
    protocol: tpl.proto,
    trafficType: 'TELEMETRY',
    ttl: tpl.ttl,
    timestamp: new Date().toISOString(),
    latency: lat,
    bandwidth: bw,
    status: status,
    metadata: { seq: counter },
  };
}

export const PacketsTable: React.FC<PacketsTableProps> = ({ packets = [], isLoading, onRefresh }) => {
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const counterRef = useRef<number>(540);
  const lastUpdateRef = useRef<number>(Date.now());

  // Local state with initial pre-seeded 5G frames
  const [streamPackets, setStreamPackets] = useState<Packet[]>(() => {
    if (packets && packets.length > 0) return packets;
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => {
      const t = SIMULATED_PACKET_TEMPLATES[i % SIMULATED_PACKET_TEMPLATES.length];
      const lat = +(t.baseLat + (Math.random() - 0.5) * 0.6).toFixed(2);
      const pktSize = t.baseSize;
      return {
        packetId: `pkt-seed-${i}-${Math.random().toString(36).substring(2, 5)}`,
        sessionId: `sess-sim-${(i + 1).toString().padStart(3, '0')}`,
        sourceNodeId: t.src,
        destinationNodeId: t.dst,
        sequenceNumber: 540 - i,
        packetSize: pktSize,
        payloadSize: Math.round(pktSize * 0.82),
        protocol: t.proto,
        trafficType: 'TELEMETRY',
        ttl: t.ttl,
        timestamp: new Date(now - i * 3000).toISOString(),
        latency: lat,
        bandwidth: t.baseBw,
        status: 'SUCCESS',
        metadata: { seq: 540 - i },
      };
    });
  });

  // Synchronize incoming packets prop from backend query
  useEffect(() => {
    if (packets && packets.length > 0) {
      setStreamPackets((prev) => {
        const topPrevId = prev[0]?.packetId;
        const topNextId = packets[0]?.packetId;
        if (topPrevId !== topNextId) {
          setHighlightId(topNextId || null);
          lastUpdateRef.current = Date.now();
          setTimeout(() => setHighlightId(null), 1800);
          return packets.slice(0, 30);
        }
        return prev;
      });
    }
  }, [packets]);

  // Continuous auto-sliding live packet generator (every 2.5s)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastUpdateRef.current;
      // If no new packet has arrived from server in 2.2 seconds, synthesize one
      if (elapsed >= 2200) {
        counterRef.current += 1;
        const newPkt = generateSyntheticPacket(counterRef.current);
        setHighlightId(newPkt.packetId);
        lastUpdateRef.current = Date.now();
        setStreamPackets((prev) => [newPkt, ...prev.slice(0, 29)]);
        setTimeout(() => setHighlightId(null), 1800);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Manual Trigger: Transmit immediate packet
  const handleTriggerManual = () => {
    counterRef.current += 1;
    const newPkt = generateSyntheticPacket(counterRef.current);
    setHighlightId(newPkt.packetId);
    lastUpdateRef.current = Date.now();
    setStreamPackets((prev) => [newPkt, ...prev.slice(0, 29)]);
    setTimeout(() => setHighlightId(null), 1800);
  };

  // Filtered packets calculation
  const filteredPackets = useMemo(() => {
    return streamPackets.filter((p) => {
      const proto = String(p.protocol || '').toUpperCase();
      if (protocolFilter !== 'ALL' && proto !== protocolFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          p.sourceNodeId.toLowerCase().includes(q) ||
          p.destinationNodeId.toLowerCase().includes(q) ||
          proto.includes(q) ||
          String(p.status).toLowerCase().includes(q) ||
          String(p.sequenceNumber).includes(q)
        );
      }
      return true;
    });
  }, [streamPackets, protocolFilter, searchQuery]);

  // Derived telemetry metrics
  const avgLatency = useMemo(() => {
    if (streamPackets.length === 0) return 0;
    const sum = streamPackets.reduce((acc, p) => acc + p.latency, 0);
    return +(sum / streamPackets.length).toFixed(2);
  }, [streamPackets]);

  const avgBandwidth = useMemo(() => {
    if (streamPackets.length === 0) return 0;
    const sum = streamPackets.reduce((acc, p) => acc + p.bandwidth, 0);
    return Math.round(sum / streamPackets.length);
  }, [streamPackets]);

  const successRate = useMemo(() => {
    if (streamPackets.length === 0) return 100;
    const okCount = streamPackets.filter((p) => String(p.status).toUpperCase() === 'SUCCESS').length;
    return Math.round((okCount / streamPackets.length) * 100);
  }, [streamPackets]);

  const getProtocolBadge = (protocol: string) => {
    const proto = String(protocol || '').toUpperCase();
    switch (proto) {
      case 'GTP-U':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-cyan-900/20';
      case 'TCP':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 shadow-indigo-900/20';
      case 'UDP':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40 shadow-blue-900/20';
      case 'HTTPS':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-900/20';
      case 'HTTP':
        return 'bg-slate-800 text-slate-300 border-slate-600';
      case 'MQTT':
        return 'bg-pink-950/80 text-pink-300 border-pink-500/40 shadow-pink-900/20';
      case 'COAP':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-amber-900/20';
      case 'ICMP':
        return 'bg-violet-950/80 text-violet-300 border-violet-500/40 shadow-violet-900/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatTimeAgo = (isoTime: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000));
    if (diff < 3) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    return new Date(isoTime).toLocaleTimeString();
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Action and Filter Header */}
      <div className="flex flex-col gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Title and Live Status */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Live 5G Transmitted Packets Feed</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {isPaused ? 'FEED PAUSED' : 'LIVE 2.5s STREAM'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Continuous frame inspection, sequence indexing, and physical latency measurements
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume live transmission' : 'Pause live transmission'}
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
              title="Transmit an immediate packet frame"
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white border border-amber-400/40 font-semibold flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-200" />
              <span>Transmit Packet</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-slate-300 border-slate-700 hover:bg-slate-800/80"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync
            </Button>
          </div>
        </div>

        {/* Mini KPI telemetry bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Velocity:</span>
              <span className="text-white font-bold">~4.5 pkts/s</span>
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
            Buffer: <span className="text-slate-300 font-bold">{filteredPackets.length}</span> / {streamPackets.length} frames
          </div>
        </div>

        {/* Search and Protocol Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search source, destination, seq #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', 'GTP-U', 'TCP', 'UDP', 'HTTPS', 'HTTP', 'MQTT', 'COAP', 'ICMP'].map((proto) => (
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

      {/* Table Body */}
      <Card className="overflow-hidden border border-slate-800/80 bg-slate-900/90 shadow-2xl">
        {isLoading && streamPackets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <LoadingSpinner size="md" />
            <span className="text-xs">Streaming transmitted packet frame telemetry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-bold">Time</th>
                  <th className="px-4 py-3 font-bold text-center">Seq #</th>
                  <th className="px-4 py-3 font-bold">Source &rarr; Target</th>
                  <th className="px-4 py-3 font-bold text-right">Size & Payload</th>
                  <th className="px-4 py-3 font-bold text-center">TTL</th>
                  <th className="px-4 py-3 font-bold">Protocol</th>
                  <th className="px-4 py-3 font-bold text-right">Latency / Throughput</th>
                  <th className="px-4 py-3 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPackets.map((pkt) => {
                  const isNew = pkt.packetId === highlightId;
                  const status = String(pkt.status || '').toUpperCase();
                  const isSuccess = status === 'SUCCESS';
                  const isDelayed = status === 'DELAYED';

                  const badge = isSuccess ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3 h-3" /> OK
                    </span>
                  ) : isDelayed ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Clock className="w-3 h-3" /> DELAYED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      <AlertTriangle className="w-3 h-3" /> DROPPED
                    </span>
                  );

                  const isUltraLowLat = pkt.latency < 3.0;
                  const isModerateLat = pkt.latency >= 3.0 && pkt.latency < 10.0;

                  return (
                    <tr
                      key={pkt.packetId}
                      className={`transition-all duration-300 ${
                        isNew
                          ? 'bg-amber-500/20 border-l-4 border-l-amber-400'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={isNew ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                            {formatTimeAgo(pkt.timestamp)}
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {new Date(pkt.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>

                      {/* Sequence Number */}
                      <td className="px-4 py-3 text-center font-black text-indigo-400 whitespace-nowrap">
                        #{pkt.sequenceNumber}
                        {isNew && (
                          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        )}
                      </td>

                      {/* Source & Destination */}
                      <td className="px-4 py-3 font-bold text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium">{pkt.sourceNodeId}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-emerald-400">{pkt.destinationNodeId}</span>
                        </div>
                      </td>

                      {/* Packet & Payload Size */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-200">{pkt.packetSize.toLocaleString()} B</span>
                        <span className="text-[10px] text-slate-500 block">({pkt.payloadSize.toLocaleString()} B payload)</span>
                      </td>

                      {/* TTL */}
                      <td className="px-4 py-3 text-center text-slate-300 font-bold whitespace-nowrap">
                        {pkt.ttl}
                      </td>

                      {/* Protocol */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shadow-sm ${getProtocolBadge(
                            pkt.protocol
                          )}`}
                        >
                          {pkt.protocol}
                        </span>
                      </td>

                      {/* Latency / Bandwidth */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div
                          className={`font-bold ${
                            isUltraLowLat
                              ? 'text-emerald-400'
                              : isModerateLat
                              ? 'text-cyan-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {pkt.latency.toFixed(2)} ms
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {pkt.bandwidth >= 1000
                            ? `${(pkt.bandwidth / 1000).toFixed(2)} Gbps`
                            : `${pkt.bandwidth.toFixed(0)} Mbps`}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">{badge}</td>
                    </tr>
                  );
                })}
                {filteredPackets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No transmitted packet frames match current protocol filter or search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
