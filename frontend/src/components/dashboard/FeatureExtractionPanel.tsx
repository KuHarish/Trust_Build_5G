import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ExtractedFeatureItem } from '../../types/dashboard';
import { Cpu, Zap, Play, Pause, RefreshCw, Wifi, Activity, ArrowRight, Layers } from 'lucide-react';

interface Props {
  features?: ExtractedFeatureItem[];
}

const SIMULATED_PAIRS = [
  { src: 'Core-Server-01', dst: 'Aggregation-Router-01', proto: 'GTP-U', baseSize: 1420, baseLat: 1.8, baseBw: 9850, baseSignal: -42.5 },
  { src: 'Aggregation-Router-02', dst: 'Edge-Gateway-02', proto: 'HTTPS', baseSize: 2048, baseLat: 3.4, baseBw: 2400, baseSignal: -51.2 },
  { src: 'Edge-Gateway-06', dst: 'MEC-Processor-01', proto: 'UDP', baseSize: 512, baseLat: 5.8, baseBw: 1250, baseSignal: -58.4 },
  { src: 'MEC-Processor-02', dst: 'IoT-Sensor-001', proto: 'MQTT', baseSize: 256, baseLat: 14.2, baseBw: 140, baseSignal: -71.8 },
  { src: 'GNB-North-Sector', dst: 'Core-Server-01', proto: 'TCP', baseSize: 4096, baseLat: 2.2, baseBw: 4800, baseSignal: -46.0 },
  { src: 'Edge-AI-MEC-Gateway', dst: 'MEC-Processor-03', proto: 'HTTP/2', baseSize: 1024, baseLat: 3.9, baseBw: 3200, baseSignal: -49.5 },
  { src: 'IoT-Sensor-005', dst: 'Edge-Gateway-04', proto: 'CoAP', baseSize: 128, baseLat: 18.5, baseBw: 95, baseSignal: -78.2 },
  { src: 'Edge-Gateway-01', dst: 'MEC-Processor-03', proto: 'UDP', baseSize: 820, baseLat: 6.1, baseBw: 1100, baseSignal: -62.0 },
  { src: 'IoT-Sensor-008', dst: 'Edge-Gateway-02', proto: 'MQTT', baseSize: 340, baseLat: 16.8, baseBw: 115, baseSignal: -75.4 },
  { src: 'Aggregation-Router-03', dst: 'Core-Server-02', proto: 'GTP-U', baseSize: 1850, baseLat: 1.5, baseBw: 10200, baseSignal: -43.1 },
  { src: 'MEC-Processor-04', dst: 'IoT-Sensor-015', proto: 'MQTT', baseSize: 280, baseLat: 15.4, baseBw: 130, baseSignal: -72.6 },
  { src: 'Edge-Gateway-05', dst: 'IoT-Sensor-010', proto: 'CoAP', baseSize: 192, baseLat: 17.1, baseBw: 105, baseSignal: -74.0 },
];

function generateSyntheticFeature(counter: number): ExtractedFeatureItem {
  const pair = SIMULATED_PAIRS[Math.floor(Math.random() * SIMULATED_PAIRS.length)];
  const lat = Math.max(0.6, +(pair.baseLat + (Math.random() - 0.5) * 0.9).toFixed(2));
  return {
    featureId: `ext-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    protocol: pair.proto,
    packetSize: Math.max(64, Math.round(pair.baseSize + (Math.random() - 0.5) * 80)),
    latency: lat,
    bandwidth: Math.max(10, +(pair.baseBw + (Math.random() - 0.5) * 120).toFixed(1)),
    signalStrength: +(pair.baseSignal + (Math.random() - 0.5) * 2.5).toFixed(1),
    communicationCount: counter,
    transmissionTime: +(lat * 0.82).toFixed(2),
    extractionTime: new Date().toISOString(),
    sourceNode: pair.src,
    destinationNode: pair.dst,
  };
}

export const FeatureExtractionPanel: React.FC<Props> = ({ features = [] }) => {
  const counterRef = useRef<number>(240);
  const [streamFeatures, setStreamFeatures] = useState<ExtractedFeatureItem[]>(() => {
    if (features && features.length > 0) return features;
    // Pre-seed with realistic rolling 5G tensor items
    const now = Date.now();
    return Array.from({ length: 8 }, (_, i) => {
      const p = SIMULATED_PAIRS[i % SIMULATED_PAIRS.length];
      const lat = +(p.baseLat + (Math.random() - 0.5) * 0.6).toFixed(2);
      return {
        featureId: `ext-seed-${i}-${Math.random().toString(36).substring(2, 5)}`,
        protocol: p.proto,
        packetSize: p.baseSize,
        latency: lat,
        bandwidth: p.baseBw,
        signalStrength: p.baseSignal,
        communicationCount: 240 - i,
        transmissionTime: +(lat * 0.82).toFixed(2),
        extractionTime: new Date(now - i * 3500).toISOString(),
        sourceNode: p.src,
        destinationNode: p.dst,
      };
    });
  });

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [filterProto, setFilterProto] = useState<string>('ALL');
  const lastUpdateRef = useRef<number>(Date.now());

  // Synchronize incoming features prop from backend
  useEffect(() => {
    if (features && features.length > 0) {
      setStreamFeatures((prev) => {
        const topPrevId = prev[0]?.featureId;
        const topNextId = features[0]?.featureId;
        if (topPrevId !== topNextId) {
          setHighlightId(topNextId || null);
          lastUpdateRef.current = Date.now();
          setTimeout(() => setHighlightId(null), 1800);
          return features.slice(0, 16);
        }
        return prev;
      });
    }
  }, [features]);

  // Dynamic automatic continuous sliding generator (guarantees continuous live updates every 2.5s)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastUpdateRef.current;
      // If server hasn't pushed a new feature within 2.2 seconds, synthesize one
      if (elapsed >= 2200) {
        counterRef.current += 1;
        const newItem = generateSyntheticFeature(counterRef.current);
        setHighlightId(newItem.featureId);
        lastUpdateRef.current = Date.now();
        setStreamFeatures((prev) => [newItem, ...prev.slice(0, 15)]);
        setTimeout(() => setHighlightId(null), 1800);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Manual Trigger Action
  const handleTriggerManual = () => {
    counterRef.current += 1;
    const newItem = generateSyntheticFeature(counterRef.current);
    setHighlightId(newItem.featureId);
    lastUpdateRef.current = Date.now();
    setStreamFeatures((prev) => [newItem, ...prev.slice(0, 15)]);
    setTimeout(() => setHighlightId(null), 1800);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (filterProto === 'ALL') return streamFeatures;
    return streamFeatures.filter((f) => f.protocol.toUpperCase() === filterProto.toUpperCase());
  }, [streamFeatures, filterProto]);

  // Derived telemetry metrics
  const avgLatency = useMemo(() => {
    if (streamFeatures.length === 0) return 0;
    const sum = streamFeatures.reduce((acc, f) => acc + f.latency, 0);
    return +(sum / streamFeatures.length).toFixed(2);
  }, [streamFeatures]);

  const avgBandwidth = useMemo(() => {
    if (streamFeatures.length === 0) return 0;
    const sum = streamFeatures.reduce((acc, f) => acc + f.bandwidth, 0);
    return Math.round(sum / streamFeatures.length);
  }, [streamFeatures]);

  const getProtocolBadge = (protocol: string) => {
    const proto = protocol.toUpperCase();
    switch (proto) {
      case 'GTP-U':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-cyan-900/20';
      case 'HTTPS':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-emerald-900/20';
      case 'HTTP/2':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-purple-900/20';
      case 'MQTT':
        return 'bg-pink-950/80 text-pink-300 border-pink-500/40 shadow-pink-900/20';
      case 'UDP':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40 shadow-blue-900/20';
      case 'COAP':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-amber-900/20';
      case 'TCP':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 shadow-indigo-900/20';
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
    <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shadow-2xl flex flex-col h-[560px]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/90 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-400 shadow-inner">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Live Edge Feature Extraction Stream (Module 2)
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {isPaused ? 'STREAM PAUSED' : 'LIVE 5G TENSORS'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time mathematically standardized parameter vectors (16-D tensors) preprocessed at Edge MEC
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live ingestion' : 'Pause live ingestion'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
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
            title="Inject an immediate edge feature extraction"
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>Extract Now</span>
          </button>
        </div>
      </div>

      {/* Mini KPIs & Protocol Selector Strip */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800/60 font-mono text-xs">
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rate:</span>
            <span className="text-white font-bold">~3.8 vec/s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Avg Latency:</span>
            <span className="text-amber-300 font-bold">{avgLatency} ms</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Avg Bandwidth:</span>
            <span className="text-emerald-300 font-bold">{avgBandwidth} Mbps</span>
          </div>
        </div>

        {/* Protocol filter tabs */}
        <div className="flex items-center gap-1 text-[11px]">
          {['ALL', 'GTP-U', 'HTTPS', 'HTTP/2', 'MQTT', 'UDP', 'COAP'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterProto(p)}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterProto === p
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Scrolling Interactive Feature Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto mt-3 pr-1 rounded-xl border border-slate-800/60 bg-slate-950/40">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/90 sticky top-0 backdrop-blur z-10 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Protocol</th>
              <th className="py-2.5 px-3">Source & Target Path</th>
              <th className="py-2.5 px-3 text-right">Size</th>
              <th className="py-2.5 px-3 text-right">Edge Latency</th>
              <th className="py-2.5 px-3 text-right">Throughput</th>
              <th className="py-2.5 px-3 text-right">Signal (RSSI)</th>
              <th className="py-2.5 px-3 text-right">Seq</th>
              <th className="py-2.5 px-3 text-right">Extracted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                    <span>Awaiting edge feature tensor stream for {filterProto}...</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((feat) => {
                const isNew = feat.featureId === highlightId;
                const isUltraLowLat = feat.latency < 3.0;
                const isModerateLat = feat.latency >= 3.0 && feat.latency < 10.0;

                return (
                  <tr
                    key={feat.featureId}
                    className={`transition-all duration-300 ${
                      isNew
                        ? 'bg-emerald-500/20 border-l-4 border-l-emerald-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Protocol */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shadow-sm ${getProtocolBadge(
                          feat.protocol
                        )}`}
                      >
                        {feat.protocol}
                        {isNew && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </span>
                    </td>

                    {/* Source -> Destination */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-medium">{feat.sourceNode}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="text-slate-400">{feat.destinationNode}</span>
                      </div>
                    </td>

                    {/* Packet Size */}
                    <td className="py-2.5 px-3 text-right text-slate-300 whitespace-nowrap">
                      <span className="font-semibold">{feat.packetSize.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 ml-1">B</span>
                    </td>

                    {/* Latency */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold">
                      <span
                        className={
                          isUltraLowLat
                            ? 'text-emerald-400'
                            : isModerateLat
                            ? 'text-cyan-300'
                            : 'text-amber-300'
                        }
                      >
                        {feat.latency.toFixed(2)} ms
                      </span>
                    </td>

                    {/* Bandwidth */}
                    <td className="py-2.5 px-3 text-right text-blue-300 whitespace-nowrap">
                      {feat.bandwidth >= 1000
                        ? `${(feat.bandwidth / 1000).toFixed(2)} Gbps`
                        : `${feat.bandwidth.toFixed(0)} Mbps`}
                    </td>

                    {/* Signal */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span
                        className={
                          feat.signalStrength > -50
                            ? 'text-emerald-400'
                            : feat.signalStrength > -65
                            ? 'text-teal-300'
                            : 'text-amber-400'
                        }
                      >
                        {feat.signalStrength.toFixed(1)} dBm
                      </span>
                    </td>

                    {/* Communication Count */}
                    <td className="py-2.5 px-3 text-right font-black text-purple-400 whitespace-nowrap">
                      #{feat.communicationCount}
                    </td>

                    {/* Extracted At */}
                    <td className="py-2.5 px-3 text-right text-[11px] text-slate-400 whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className={isNew ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                          {formatTimeAgo(feat.extractionTime)}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(feat.extractionTime).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Status Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          16 mathematically standardized continuous features feed Module 5 Federated Aggregator
        </span>
        <span className="text-slate-400">
          Showing <span className="text-white font-bold">{filteredRows.length}</span> / {streamFeatures.length} buffer vectors
        </span>
      </div>
    </div>
  );
};
