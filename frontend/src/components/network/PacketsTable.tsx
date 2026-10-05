import React, { useState } from 'react';
import { Packet } from '@/types/communication';
import { Card, LoadingSpinner, Button } from '@/components/common';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';

interface PacketsTableProps {
  packets: Packet[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const PacketsTable: React.FC<PacketsTableProps> = ({ packets, isLoading, onRefresh }) => {
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');

  const filteredPackets = packets.filter((p) => {
    if (protocolFilter === 'ALL') return true;
    return str(p.protocol).toUpperCase() === protocolFilter;
  });

  function str(val: unknown): string {
    return String(val || '');
  }

  return (
    <div className="space-y-4">
      {/* Action and Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md shadow-lg">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {['ALL', 'TCP', 'UDP', 'HTTPS', 'HTTP', 'MQTT', 'CoAP', 'ICMP'].map((proto) => (
            <button
              key={proto}
              onClick={() => setProtocolFilter(proto)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md font-bold transition-all ${
                protocolFilter === proto
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {proto}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="font-mono text-xs text-slate-300 border-slate-700">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Packets Log
        </Button>
      </div>

      {/* Table Body */}
      <Card className="overflow-hidden border border-slate-800/80 bg-slate-900/90 shadow-xl">
        {isLoading && packets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <LoadingSpinner size="md" />
            <span className="text-xs font-mono">Streaming transmitted packet frame telemetry...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Timestamp</th>
                  <th className="px-4 py-3.5 font-bold text-center">Seq #</th>
                  <th className="px-4 py-3.5 font-bold">Source &rarr; Target</th>
                  <th className="px-4 py-3.5 font-bold text-right">Packet & Payload</th>
                  <th className="px-4 py-3.5 font-bold text-center">TTL</th>
                  <th className="px-4 py-3.5 font-bold">Protocol</th>
                  <th className="px-4 py-3.5 font-bold text-right">Latency / Bw</th>
                  <th className="px-4 py-3.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPackets.map((pkt) => {
                  const status = str(pkt.status).toUpperCase();
                  const isSuccess = status === 'SUCCESS';
                  const badge = isSuccess ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3 h-3" /> OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <AlertCircle className="w-3 h-3" /> {status}
                    </span>
                  );

                  const timestampFormatted = new Date(pkt.timestamp).toLocaleTimeString();

                  return (
                    <tr key={pkt.packetId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{timestampFormatted}</td>
                      <td className="px-4 py-3.5 text-center font-black text-indigo-400">#{pkt.sequenceNumber}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-200">
                        <span className="text-slate-300">{pkt.sourceNodeId}</span>
                        <span className="text-slate-500 mx-1.5">&rarr;</span>
                        <span className="text-emerald-400">{pkt.destinationNodeId}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">
                        <span className="font-bold text-slate-200">{pkt.packetSize} B</span>
                        <span className="text-[10px] text-slate-500 block">({pkt.payloadSize} B payload)</span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-300 font-bold">{pkt.ttl}</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-black">
                          {str(pkt.protocol)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-bold text-amber-400">{pkt.latency} ms</div>
                        <div className="text-[10px] text-slate-400">{pkt.bandwidth} Mbps</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">{badge}</td>
                    </tr>
                  );
                })}
                {filteredPackets.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      No transmitted packet frames match current protocol filter criteria.
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
