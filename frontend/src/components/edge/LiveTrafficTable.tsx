import React, { useState } from 'react';
import { useEdgeEvents } from '@/hooks/useEdgeHooks';
import { Card, Input, Select, Button, LoadingSpinner } from '@/components/common';
import { CommunicationEvent } from '@/types/edge';
import { Search, ArrowUpDown, ShieldCheck, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const LiveTrafficTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<keyof CommunicationEvent>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 20;

  const { data, isLoading, isError, refetch, isFetching } = useEdgeEvents({
    limit: 100,
    offset: 0,
    search: searchTerm || undefined,
    protocol: protocolFilter === 'All' ? undefined : protocolFilter,
  });

  const handleSort = (field: keyof CommunicationEvent) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedEvents = React.useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [data, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil((data?.totalCount || 0) / pageSize));
  const displayedEvents = sortedEvents.slice(page * pageSize, (page + 1) * pageSize);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">SUCCESS</span>;
      case 'DELAYED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-900/60 text-amber-300 border border-amber-500/30">DELAYED</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-red-900/60 text-red-300 border border-red-500/30">{status}</span>;
    }
  };

  const renderProtocolBadge = (protocol: string) => {
    const colors: Record<string, string> = {
      TCP: 'bg-blue-950/80 text-blue-300 border-blue-600/40',
      UDP: 'bg-indigo-950/80 text-indigo-300 border-indigo-600/40',
      HTTP: 'bg-purple-950/80 text-purple-300 border-purple-600/40',
      HTTPS: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40',
      ICMP: 'bg-amber-950/80 text-amber-300 border-amber-600/40',
      MQTT: 'bg-pink-950/80 text-pink-300 border-pink-600/40',
      CoAP: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/40',
    };
    const style = colors[protocol] || 'bg-slate-800 text-slate-300 border-slate-600';
    return <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded border ${style}`}>{protocol}</span>;
  };

  return (
    <Card className="p-6 bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl">
      {/* Header & Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Live Communication Stream</h3>
            {isFetching && <span className="text-[10px] text-emerald-400 font-mono animate-pulse px-2 py-0.5 rounded bg-emerald-950/50">SYNCING...</span>}
          </div>
          <p className="text-xs text-slate-400">Preprocessed simulated packet transmission events across active 5G network entities.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search nodes or UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="w-56 bg-slate-950/90 text-sm"
          />
          <Select
            value={protocolFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setProtocolFilter(e.target.value); setPage(0); }}
            className="w-36 bg-slate-950/90 text-sm"
            options={[
              { label: 'All Protocols', value: 'All' },
              { label: 'TCP', value: 'TCP' },
              { label: 'UDP', value: 'UDP' },
              { label: 'HTTP', value: 'HTTP' },
              { label: 'HTTPS', value: 'HTTPS' },
              { label: 'ICMP', value: 'ICMP' },
              { label: 'MQTT', value: 'MQTT' },
              { label: 'CoAP', value: 'CoAP' },
            ]}
          />
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/90 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-800">
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400" onClick={() => handleSort('timestamp')}>
                <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Timestamp <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400" onClick={() => handleSort('sourceNodeId')}>
                <div className="flex items-center gap-1">Source Node <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400" onClick={() => handleSort('destinationNodeId')}>
                <div className="flex items-center gap-1">Destination Node <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4">Protocol</th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400" onClick={() => handleSort('packetSize')}>
                <div className="flex items-center gap-1">Packet Size <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400" onClick={() => handleSort('latency')}>
                <div className="flex items-center gap-1">Latency <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400" onClick={() => handleSort('bandwidth')}>
                <div className="flex items-center gap-1">Bandwidth <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-indigo-400" onClick={() => handleSort('signalStrength')}>
                <div className="flex items-center gap-1">Signal (dBm) <ArrowUpDown className="w-3 h-3 ml-1 opacity-60" /></div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm font-sans text-slate-200">
            {isLoading && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="md" />
                    <span>Connecting to Edge telemetry ingestion buffer...</span>
                  </div>
                </td>
              </tr>
            )}

            {isError && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-red-400">
                  <div className="flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span>Failed to retrieve live communication events. Verify backend service health.</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !isError && displayedEvents.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-indigo-500 opacity-60" />
                  <span className="font-semibold text-slate-300 block">No Communication Events matching criteria</span>
                  <span className="text-xs text-slate-500">Ensure at least 2 simulation nodes are set to ONLINE to begin automatic traffic transmission.</span>
                </td>
              </tr>
            )}

            {!isLoading && !isError && displayedEvents.map((ev) => (
              <tr key={ev.eventId} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-slate-400 whitespace-nowrap">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </td>
                <td className="py-3 px-4 font-mono font-medium text-indigo-300">{ev.sourceNodeId}</td>
                <td className="py-3 px-4 font-mono font-medium text-cyan-300">{ev.destinationNodeId}</td>
                <td className="py-3 px-4">{renderProtocolBadge(ev.protocol)}</td>
                <td className="py-3 px-4 font-mono text-slate-300">{ev.packetSize} B</td>
                <td className="py-3 px-4 font-mono text-amber-300">{ev.latency} ms</td>
                <td className="py-3 px-4 font-mono text-emerald-300">{ev.bandwidth} Mbps</td>
                <td className="py-3 px-4 font-mono text-purple-300">{ev.signalStrength}</td>
                <td className="py-3 px-4 text-center">{renderStatusBadge(ev.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !isError && displayedEvents.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
          <span>Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data?.totalCount || 0)} of {data?.totalCount || 0} events</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
              Previous
            </Button>
            <span className="px-3 py-1 bg-slate-800/60 rounded border border-slate-700 font-mono">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
