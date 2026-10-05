import React from 'react';
import { SimulationNode } from '@/types/node';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import {
  X,
  Radio,
  Network,
  MapPin,
  Clock,
  Battery,
  Activity,
  Cpu,
  Edit2,
  Trash2,
  Share2,
} from 'lucide-react';

interface NodeDetailsPanelProps {
  node: SimulationNode | null;
  onClose: () => void;
  onEdit: (node: SimulationNode) => void;
  onDelete: (node: SimulationNode) => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shadow-2xl p-6 text-slate-200 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">{node.nodeName}</h2>
                <span className="font-mono text-xs text-slate-400">{node.deviceCategory}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Badge & Actions */}
          <div className="mt-4 flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Status:</span>
              <Badge variant={node.status === 'ONLINE' ? 'success' : 'warning'} size="md">
                {node.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(node)} className="text-xs">
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDelete(node)} className="text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          </div>

          {/* Core Telemetry Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> <span>Signal Strength</span>
              </div>
              <span className="text-lg font-bold text-white">{node.signalStrength} dBm</span>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-emerald-400" /> <span>Battery Level</span>
              </div>
              <span className="text-lg font-bold text-white">{Math.round(node.batteryLevel)}%</span>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> <span>Latency</span>
              </div>
              <span className="text-lg font-bold text-white">{node.latency} ms</span>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
              <div className="text-slate-400 mb-1 flex items-center gap-1">
                <Network className="w-3.5 h-3.5 text-purple-400" /> <span>Bandwidth</span>
              </div>
              <span className="text-lg font-bold text-white">{node.bandwidth} Mbps</span>
            </div>
          </div>

          {/* Detailed Specifications List */}
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Network Identity & Positioning
            </h3>
            <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">UUID:</span>
                <span className="text-blue-400 font-bold break-all max-w-[280px] text-right">{node.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Node Type:</span>
                <span className="text-white">{node.nodeType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IP Address (IPv4/v6):</span>
                <span className="text-emerald-400 font-bold">{node.ipAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hardware MAC Address:</span>
                <span className="text-amber-400 font-bold">{node.macAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" /> GPS Coordinates:
                </span>
                <span className="text-white">Lat: {node.latitude}, Lng: {node.longitude}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" /> Firmware Version:
                </span>
                <span className="text-white font-bold">{node.firmwareVersion}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Share2 className="w-3 h-3 text-purple-400" /> Simulated Connections:
                </span>
                <span className="text-purple-300 font-bold">{node.connections} active relays</span>
              </div>
            </div>

            {/* Timestamps */}
            <h3 className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Telemetry Lifecycle Timestamps
            </h3>
            <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Last Telemetry Heartbeat:</span>
                <span className="text-emerald-400 font-bold">{new Date(node.lastSeen).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registered at:</span>
                <span className="text-slate-300">{new Date(node.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Attribute Modification:</span>
                <span className="text-slate-300">{new Date(node.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-800 pt-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close Panel
          </Button>
        </div>
      </div>
    </div>
  );
};
