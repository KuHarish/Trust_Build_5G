import React, { useState } from 'react';
import { CommunicationSession } from '@/types/communication';
import { Card, LoadingSpinner, Button } from '@/components/common';
import { RefreshCw, Activity, Clock } from 'lucide-react';

interface SessionsTableProps {
  sessions: CommunicationSession[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const SessionsTable: React.FC<SessionsTableProps> = ({ sessions, isLoading, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredSessions = sessions.filter((s) => {
    if (filterStatus === 'ALL') return true;
    const st = str(s.status).toUpperCase();
    return st === filterStatus;
  });

  function str(val: unknown): string {
    return String(val || '');
  }

  const formatDuration = (start: string, end?: string | null) => {
    try {
      const st = new Date(start).getTime();
      const et = end ? new Date(end).getTime() : Date.now();
      const diffSec = Math.max(0, Math.round((et - st) / 1000));
      return `${diffSec}s`;
    } catch {
      return 'Active';
    }
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', 'ACTIVE', 'CLOSED', 'TIMEOUT'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1 text-xs font-mono rounded-md font-bold transition-all ${
                  filterStatus === tab
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-mono pl-2">
            Showing <strong className="text-indigo-400">{filteredSessions.length}</strong> recorded sessions
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="font-mono text-xs text-slate-300 border-slate-700 self-end sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh Sessions
        </Button>
      </div>

      {/* Table Body */}
      <Card className="overflow-hidden border border-slate-800/80 bg-slate-900/90 shadow-xl">
        {isLoading && sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <LoadingSpinner size="md" />
            <span className="text-xs font-mono">Synchronizing Communication Engine connection sessions...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Session UUID</th>
                  <th className="px-4 py-3.5 font-bold">Connection Route</th>
                  <th className="px-4 py-3.5 font-bold">Protocol & Profile</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold text-right">Packets (Tx / Rx)</th>
                  <th className="px-4 py-3.5 font-bold text-right">Throughput & Latency</th>
                  <th className="px-4 py-3.5 font-bold text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSessions.map((session) => {
                  const status = str(session.status).toUpperCase();
                  const isLive = status === 'ACTIVE';
                  const statusBadge = isLive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-extrabold">
                      <Activity className="w-3 h-3 animate-pulse" /> ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      <Clock className="w-3 h-3 text-slate-400" /> CLOSED
                    </span>
                  );

                  return (
                    <tr key={session.sessionId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-300 tracking-wide truncate max-w-[130px]" title={session.sessionId}>
                        {session.sessionId.split('-')[0]}...
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 font-bold text-slate-200">
                          <span className="text-indigo-400">{session.sourceNodeId}</span>
                          <span className="text-slate-500">&rarr;</span>
                          <span className="text-emerald-400">{session.destinationNodeId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100">{str(session.protocol)}</span>
                          <span className="text-[10px] text-slate-400">{session.trafficType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{statusBadge}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-200">
                        <span>{session.packetsSent}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-emerald-400">{session.packetsReceived}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">
                        <div className="font-bold text-slate-200">{session.averageBandwidth} Mbps</div>
                        <div className="text-[10px] text-amber-400/90">{session.averageLatency} ms lat</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-indigo-300">
                        {formatDuration(session.startTime, session.endTime)}
                      </td>
                    </tr>
                  );
                })}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      No communication sessions match current status filter criteria.
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
