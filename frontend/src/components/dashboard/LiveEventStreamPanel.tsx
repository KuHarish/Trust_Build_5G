import React, { useState } from 'react';
import { ActivityEvent } from '../../types/dashboard';
import { Radio, AlertCircle, Info, ArrowUpRight, Search } from 'lucide-react';

interface Props {
  events: ActivityEvent[];
}

export const LiveEventStreamPanel: React.FC<Props> = ({ events }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((ev) => {
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

  return (
    <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl flex flex-col h-[520px]">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="text-base font-bold text-white tracking-wide">Live Operational Activity & Alarm Feed</h3>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono text-slate-300">
            {filteredEvents.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-primary w-44"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-primary font-mono"
          >
            <option value="ALL">Severity: ALL</option>
            <option value="INFO">INFO ONLY</option>
            <option value="WARNING">WARNINGS</option>
            <option value="CRITICAL">CRITICALS</option>
          </select>
        </div>
      </div>

      {/* Scrolling Event Ticker List */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono space-y-2">
            <Radio className="w-8 h-8 opacity-40 animate-spin" />
            <span>No matching network events in active streaming buffer.</span>
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const isAlert = ev.eventType === 'ALERT' || ev.severity !== 'INFO';
            return (
              <div
                key={ev.eventId}
                className={`p-3 rounded-xl border ${
                  isAlert
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                } flex items-start justify-between gap-4 transition-all hover:border-slate-700 duration-150`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${isAlert ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-cyan-400'}`}>
                    {isAlert ? <AlertCircle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-white">{ev.sourceNode || 'System'}</span>
                      {ev.protocol && (
                        <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-900 text-cyan-300 border border-cyan-800">
                          {ev.protocol}
                        </span>
                      )}
                      {ev.eventType === 'ALERT' && (
                        <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-900/60 text-amber-300 border border-amber-600 font-black">
                          OPERATIONAL ALERT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{ev.description}</p>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap text-[11px] font-mono text-slate-500">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer warning preserving domain limits */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Operational alerts only (Offline, RSSI, Latency). Attack & threat classifications excluded per Sprint 1 scope.</span>
        </div>
      </div>
    </div>
  );
};
