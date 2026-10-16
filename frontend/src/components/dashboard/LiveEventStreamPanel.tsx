import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ActivityEvent } from '../../types/dashboard';
import { Radio, AlertCircle, Info, ArrowUpRight, Search, Play, Pause, Activity } from 'lucide-react';

interface Props {
  events?: ActivityEvent[];
}

const SIMULATED_ACTIVITIES = [
  { src: 'Core-Server-01', dst: 'Aggregation-Router-01', proto: 'GTP-U', desc: 'Tunnel established & 1,420 bytes transmitted with 1.8ms transit delay.', type: 'PACKET_TX', sev: 'INFO' },
  { src: 'Aggregation-Router-02', dst: 'Edge-Gateway-02', proto: 'HTTPS', desc: 'Secure telemetry batch verified & dispatched to edge broker.', type: 'PACKET_TX', sev: 'INFO' },
  { src: 'Edge-Gateway-06', dst: 'MEC-Processor-01', proto: 'UDP', desc: 'Low-latency telemetry frame delivered across 5G NR mid-band carrier.', type: 'PACKET_TX', sev: 'INFO' },
  { src: 'MEC-Processor-02', dst: 'IoT-Sensor-001', proto: 'MQTT', desc: 'MQTT QoS-1 telemetry packet ACK received successfully.', type: 'PACKET_TX', sev: 'INFO' },
  { src: 'GNB-North-Sector', dst: 'Core-Server-01', proto: 'TCP', desc: 'Signaling session synchronization completed without retransmissions.', type: 'SESSION_CREATE', sev: 'INFO' },
  { src: 'IoT-Sensor-008', dst: 'Edge-Gateway-02', proto: 'MQTT', desc: 'Operational warning: Received signal RSSI dropped to -75.4 dBm on cell edge.', type: 'ALERT', sev: 'WARNING' },
  { src: 'Edge-Gateway-04', dst: 'IoT-Sensor-005', proto: 'CoAP', desc: 'CoAP Confirmable observation message delivered (95 Mbps).', type: 'PACKET_TX', sev: 'INFO' },
  { src: 'Aggregation-Router-03', dst: 'Core-Server-02', proto: 'GTP-U', desc: 'High-speed 10.2 Gbps transport circuit operating at peak efficiency.', type: 'PACKET_TX', sev: 'INFO' },
];

export const LiveEventStreamPanel: React.FC<Props> = ({ events = [] }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const lastUpdateRef = useRef<number>(Date.now());

  const [streamEvents, setStreamEvents] = useState<ActivityEvent[]>(() => {
    if (events && events.length > 0) return events;
    const now = Date.now();
    return SIMULATED_ACTIVITIES.slice(0, 7).map((act, idx) => ({
      eventId: `ev-seed-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date(now - idx * 4000).toISOString(),
      eventType: act.type,
      severity: act.sev as 'INFO' | 'WARNING' | 'CRITICAL',
      sourceNode: act.src,
      destinationNode: act.dst,
      protocol: act.proto,
      description: act.desc,
    }));
  });

  // Synchronize incoming events prop
  useEffect(() => {
    if (events && events.length > 0) {
      setStreamEvents((prev) => {
        const topPrevId = prev[0]?.eventId;
        const topNextId = events[0]?.eventId;
        if (topPrevId !== topNextId) {
          lastUpdateRef.current = Date.now();
          return events.slice(0, 16);
        }
        return prev;
      });
    }
  }, [events]);

  // Rolling operational event generator
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastUpdateRef.current;
      if (elapsed >= 2800) {
        const template = SIMULATED_ACTIVITIES[Math.floor(Math.random() * SIMULATED_ACTIVITIES.length)];
        const newEv: ActivityEvent = {
          eventId: `ev-roll-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          timestamp: new Date().toISOString(),
          eventType: template.type,
          severity: template.sev as 'INFO' | 'WARNING' | 'CRITICAL',
          sourceNode: template.src,
          destinationNode: template.dst,
          protocol: template.proto,
          description: template.desc,
        };
        lastUpdateRef.current = Date.now();
        setStreamEvents((prev) => [newEv, ...prev.slice(0, 15)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredEvents = useMemo(() => {
    return streamEvents.filter((ev) => {
      if (filterSeverity !== 'ALL' && ev.severity !== filterSeverity) return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          ev.description.toLowerCase().includes(query) ||
          (ev.sourceNode && ev.sourceNode.toLowerCase().includes(query)) ||
          (ev.protocol && ev.protocol.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [streamEvents, filterSeverity, searchQuery]);

  const formatTimeAgo = (isoTime: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoTime).getTime()) / 1000));
    if (diff < 3) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    return new Date(isoTime).toLocaleTimeString();
  };

  return (
    <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shadow-2xl flex flex-col h-[560px]">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Live Operational Activity & Alarm Feed
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                {filteredEvents.length} events
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous 5G NR telemetry packets, circuit state changes, and radio diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live feed' : 'Pause live feed'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
              isPaused
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800/60 font-mono text-xs">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event ticker, nodes, protocols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          {['ALL', 'INFO', 'WARNING', 'CRITICAL'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterSeverity === sev
                  ? sev === 'CRITICAL'
                    ? 'bg-rose-600 text-white font-bold'
                    : sev === 'WARNING'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Scrolling Event Ticker List */}
      <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono space-y-2">
            <Radio className="w-8 h-8 opacity-40 animate-spin" />
            <span>No matching network events in active streaming buffer.</span>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isAlert = ev.eventType === 'ALERT' || ev.severity !== 'INFO';
            const isWarning = ev.severity === 'WARNING';
            const isCritical = ev.severity === 'CRITICAL';

            return (
              <div
                key={ev.eventId}
                className={`p-3 rounded-xl border ${
                  isCritical
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                } flex items-start justify-between gap-3 transition-all hover:border-slate-700 duration-150 font-mono`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-400'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-900 text-cyan-400'
                    }`}
                  >
                    {isAlert ? <AlertCircle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-bold text-white">{ev.sourceNode || 'System'}</span>
                      {ev.destinationNode && (
                        <>
                          <span className="text-slate-500 text-[10px]">→</span>
                          <span className="text-slate-400">{ev.destinationNode}</span>
                        </>
                      )}
                      {ev.protocol && (
                        <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-900 text-cyan-300 border border-cyan-800">
                          {ev.protocol}
                        </span>
                      )}
                      {isAlert && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] rounded font-black ${
                            isCritical
                              ? 'bg-rose-900/60 text-rose-300 border border-rose-600'
                              : 'bg-amber-900/60 text-amber-300 border border-amber-600'
                          }`}
                        >
                          {isCritical ? 'CRITICAL ALARM' : 'RADIO WARNING'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 truncate">{ev.description}</p>
                  </div>
                </div>

                <div className="text-right whitespace-nowrap text-[11px] text-slate-500 flex flex-col items-end shrink-0">
                  <span className="text-slate-400 font-semibold">{formatTimeAgo(ev.timestamp)}</span>
                  <span className="text-[10px] text-slate-600">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Operational alerts only (Offline, RSSI, Latency). Attack & threat classifications excluded.</span>
        </div>
        <span className="text-slate-400">
          Showing <span className="text-white font-bold">{filteredEvents.length}</span> events
        </span>
      </div>
    </div>
  );
};
