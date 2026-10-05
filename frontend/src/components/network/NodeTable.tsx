import React, { useState, ChangeEvent } from 'react';
import { SimulationNode, SimulationNodeStatus } from '@/types/node';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Battery,
  BatteryCharging,
  Wifi,
  RefreshCw,
} from 'lucide-react';

interface NodeTableProps {
  nodes: SimulationNode[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  onRowClick: (node: SimulationNode) => void;
  onEdit: (node: SimulationNode, e: React.MouseEvent) => void;
  onDelete: (node: SimulationNode, e: React.MouseEvent) => void;
  onStatusToggle: (node: SimulationNode, newStatus: SimulationNodeStatus, e: React.MouseEvent) => void;
}

export const NodeTable: React.FC<NodeTableProps> = ({
  nodes,
  isLoading,
  isError,
  onRefresh,
  onRowClick,
  onEdit,
  onDelete,
  onStatusToggle,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<keyof SimulationNode>('nodeName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Handle column sort toggle
  const handleSort = (field: keyof SimulationNode) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter & Search Logic
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      search.trim() === '' ||
      node.nodeName.toLowerCase().includes(search.toLowerCase()) ||
      node.id.toLowerCase().includes(search.toLowerCase()) ||
      node.ipAddress.toLowerCase().includes(search.toLowerCase()) ||
      node.macAddress.toLowerCase().includes(search.toLowerCase()) ||
      node.nodeType.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || node.nodeType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || node.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sorting Logic
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (aValue === undefined || bValue === undefined) return 0;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedNodes.length / pageSize));
  const displayedNodes = sortedNodes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadgeVariant = (status: SimulationNodeStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'success';
      case 'BUSY':
        return 'accent';
      case 'SLEEPING':
        return 'primary';
      case 'MAINTENANCE':
        return 'warning';
      case 'OFFLINE':
      default:
        return 'danger';
    }
  };

  if (isLoading && nodes.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center border border-slate-800 bg-slate-900/50 rounded-xl">
        <LoadingSpinner size="lg" label="Synchronizing 5G Network Nodes & Telemetry Streams..." />
      </div>
    );
  }

  if (isError && nodes.length === 0) {
    return (
      <div className="py-16 text-center border border-rose-500/30 bg-rose-950/20 rounded-xl">
        <p className="text-rose-400 font-semibold mb-4">Unable to reach TrustChain-5G Simulation Engine API.</p>
        <Button variant="outline" size="sm" onClick={onRefresh} className="border-rose-500 text-rose-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Search & Filter Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search by Node ID, Name, IP, or MAC..."
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <Select
              value={typeFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              options={[
                { label: 'All Device Types', value: 'ALL' },
                { label: 'Smartphone', value: 'Smartphone' },
                { label: 'IoT Sensor', value: 'IoT Sensor' },
                { label: 'Edge Device', value: 'Edge Device' },
                { label: 'Gateway', value: 'Gateway' },
                { label: 'Autonomous Vehicle', value: 'Autonomous Vehicle' },
                { label: 'Industrial Device', value: 'Industrial Device' },
                { label: 'Medical Device', value: 'Medical Device' },
                { label: 'Drone', value: 'Drone' },
              ]}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Online', value: 'ONLINE' },
              { label: 'Offline', value: 'OFFLINE' },
              { label: 'Busy', value: 'BUSY' },
              { label: 'Sleeping', value: 'SLEEPING' },
              { label: 'Maintenance', value: 'MAINTENANCE' },
            ]}
          />
          <Button variant="ghost" size="sm" onClick={onRefresh} title="Force Telemetry Sync">
            <RefreshCw className="w-4 h-4 text-slate-400 hover:text-white" />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      {displayedNodes.length === 0 ? (
        <EmptyState
          title="No Matching Network Nodes"
          description="We couldn't find any simulation entities matching your search or active filter thresholds."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setTypeFilter('ALL');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-mono tracking-wider text-slate-400 uppercase select-none">
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('id')}>
                  Node ID <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('nodeName')}>
                  Node Name <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('nodeType')}>
                  Type <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                  Status <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('signalStrength')}>
                  Signal (dBm) <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('batteryLevel')}>
                  Battery <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('latency')}>
                  Latency <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('bandwidth')}>
                  Bandwidth <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('lastSeen')}>
                  Last Seen <ArrowUpDown className="inline w-3 h-3 ml-1" />
                </th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {displayedNodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => onRowClick(node)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="py-3 px-4 font-mono text-xs text-blue-400 group-hover:underline">
                    {node.id.substring(0, 8)}...
                  </td>
                  <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                    <span className="truncate max-w-[160px]">{node.nodeName}</span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{node.nodeType}</span>
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={node.status}
                      onChange={(e) => onStatusToggle(node, e.target.value as SimulationNodeStatus, e as unknown as React.MouseEvent)}
                      className="bg-transparent border-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                    >
                      <option className="bg-slate-900 text-emerald-400" value="ONLINE">ONLINE</option>
                      <option className="bg-slate-900 text-rose-400" value="OFFLINE">OFFLINE</option>
                      <option className="bg-slate-900 text-amber-400" value="BUSY">BUSY</option>
                      <option className="bg-slate-900 text-blue-400" value="SLEEPING">SLEEPING</option>
                      <option className="bg-slate-900 text-purple-400" value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                    <Badge variant={getStatusBadgeVariant(node.status)} className="ml-1 pointer-events-none">
                      {node.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300 flex items-center gap-1.5">
                    <Wifi className={`w-3.5 h-3.5 ${node.signalStrength >= -75 ? 'text-emerald-400' : 'text-amber-400'}`} />
                    {node.signalStrength}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      {node.batteryLevel < 20 ? (
                        <BatteryCharging className="w-4 h-4 text-rose-400 animate-bounce" />
                      ) : (
                        <Battery className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>{Math.round(node.batteryLevel)}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">
                    <span className={node.latency > 25 ? 'text-amber-400 font-bold' : 'text-slate-300'}>{node.latency} ms</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-300">{node.bandwidth} Mbps</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">
                    {new Date(node.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => onEdit(node, e)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                      title="Edit Node"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => onDelete(node, e)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/30"
                      title="Delete Node"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {sortedNodes.length > pageSize && (
        <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedNodes.length)} of {sortedNodes.length} nodes
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="px-2 font-bold text-white">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
