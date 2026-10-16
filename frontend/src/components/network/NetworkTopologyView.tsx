import React, { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SimulationNode } from '@/types/node';
import { CommunicationSession } from '@/types/communication';
import { Card, LoadingSpinner, Button } from '@/components/common';
import {
  Share2,
  RefreshCw,
  Activity,
  Layers,
  Server,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

interface TopologyViewProps {
  nodes: SimulationNode[];
  activeSessions: CommunicationSession[];
  isLoading: boolean;
  onRefresh?: () => void;
  trustProfiles?: any[];
}

const PROTOCOL_CONFIG: Record<string, { color: string; label: string }> = {
  TCP: { color: '#06b6d4', label: 'TCP / GTP-U' },
  UDP: { color: '#6366f1', label: 'UDP Data' },
  HTTP: { color: '#a855f7', label: 'HTTP/2 SBA' },
  HTTPS: { color: '#10b981', label: 'HTTPS Secure' },
  ICMP: { color: '#f59e0b', label: 'ICMP Control' },
  MQTT: { color: '#ec4899', label: 'MQTT IoT' },
  COAP: { color: '#f97316', label: 'CoAP Sensor' },
};

export const NetworkTopologyView: React.FC<TopologyViewProps> = ({
  nodes,
  activeSessions,
  isLoading,
  onRefresh,
  trustProfiles = [],
}) => {
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const [sliceFilter, setSliceFilter] = useState<'ALL' | 'BACKBONE' | 'IOT'>('ALL');
  const [isBursting, setIsBursting] = useState<boolean>(false);

  // Trigger temporary burst animation
  const handleBurstTraffic = useCallback(() => {
    setIsBursting(true);
    setTimeout(() => setIsBursting(false), 4000);
  }, []);

  // Filter nodes based on slice view
  const visibleNodes = useMemo(() => {
    if (sliceFilter === 'BACKBONE') {
      return nodes.filter(
        (n) =>
          n.nodeType.includes('Core') ||
          n.nodeType.includes('Server') ||
          n.nodeType.includes('Aggregation') ||
          n.nodeType.includes('Gateway') ||
          n.nodeName.startsWith('GNB') ||
          n.nodeName.startsWith('Edge')
      );
    }
    if (sliceFilter === 'IOT') {
      return nodes.filter(
        (n) =>
          n.nodeType.includes('IoT') ||
          n.nodeType.includes('Processing') ||
          n.nodeName.startsWith('MEC') ||
          n.nodeName.startsWith('IoT')
      );
    }
    // 'ALL' - Limit max 28 most relevant nodes if registry is large to avoid unreadable clustering
    if (nodes.length > 28) {
      const core = nodes.filter((n) => n.nodeType.includes('Core') || n.nodeName.startsWith('Core')).slice(0, 2);
      const agg = nodes.filter((n) => n.nodeType.includes('Aggregation') || n.nodeName.startsWith('Agg')).slice(0, 4);
      const gw = nodes.filter((n) => n.nodeType.includes('Gateway') || n.nodeName.startsWith('Edge-Gateway') || n.nodeName.startsWith('GNB')).slice(0, 6);
      const mec = nodes.filter((n) => n.nodeType.includes('Processing') || n.nodeName.startsWith('MEC')).slice(0, 6);
      const iot = nodes.filter((n) => n.nodeType.includes('IoT') || n.nodeName.startsWith('IoT')).slice(0, 10);
      return [...core, ...agg, ...gw, ...mec, ...iot];
    }
    return nodes;
  }, [nodes, sliceFilter]);

  // Compute 5G Hierarchical Tier Positions
  const flowNodes: Node[] = useMemo(() => {
    if (visibleNodes.length === 0) return [];

    // Group nodes into 5 architectural tiers
    const tier0_core: SimulationNode[] = [];
    const tier1_agg: SimulationNode[] = [];
    const tier2_gw: SimulationNode[] = [];
    const tier3_mec: SimulationNode[] = [];
    const tier4_iot: SimulationNode[] = [];

    visibleNodes.forEach((n) => {
      const type = n.nodeType.toLowerCase();
      const name = n.nodeName.toLowerCase();

      if (type.includes('core') || name.startsWith('core')) {
        tier0_core.push(n);
      } else if (type.includes('aggregation') || name.startsWith('agg')) {
        tier1_agg.push(n);
      } else if (type.includes('gateway') || name.startsWith('edge-gateway') || name.startsWith('gnb')) {
        tier2_gw.push(n);
      } else if (type.includes('processing') || name.startsWith('mec')) {
        tier3_mec.push(n);
      } else {
        tier4_iot.push(n);
      }
    });

    const tiers = [
      { list: tier0_core, y: 50, color: '#f59e0b', tag: '5G CORE UPF/AMF' },
      { list: tier1_agg, y: 220, color: '#6366f1', tag: 'AGGREGATION ROUTER' },
      { list: tier2_gw, y: 390, color: '#06b6d4', tag: '5G gNodeB / GATEWAY' },
      { list: tier3_mec, y: 560, color: '#14b8a6', tag: 'MEC EDGE COMPUTE' },
      { list: tier4_iot, y: 730, color: '#10b981', tag: 'FIELD IOT SENSOR' },
    ];

    const generatedNodes: Node[] = [];
    const totalCanvasWidth = 1400;

    tiers.forEach((tier) => {
      const count = tier.list.length;
      if (count === 0) return;

      const spacing = totalCanvasWidth / (count + 1);

      tier.list.forEach((node, idx) => {
        const posX = spacing * (idx + 1) - 90;
        const posY = tier.y;
        const isOnline = (node.status as string) === 'ONLINE' || (node.status as string) === 'ACTIVE' || node.status === 'BUSY';

        const profile = trustProfiles.find(
          (p) => p.nodeId === node.nodeName || p.nodeId === node.id
        );

        let trustScore = 96;
        let trustColor = '#10b981';
        if (profile && profile.currentTrustScore !== undefined) {
          trustScore = Math.round(profile.currentTrustScore * 100);
          if (trustScore < 60) trustColor = '#ef4444';
          else if (trustScore < 80) trustColor = '#f59e0b';
        }

        generatedNodes.push({
          id: node.nodeName,
          position: { x: posX, y: posY },
          data: {
            rawNode: node,
            label: (
              <div
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer select-none text-left w-full space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-800 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {tier.tag}
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-slate-400">
                      {isOnline ? 'LIVE' : 'IDLE'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide truncate">
                    {node.nodeName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 pt-0.5">
                  <div>
                    <span className="text-slate-500">IP:</span> {node.ipAddress || '10.50.x.x'}
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500">LAT:</span>{' '}
                    <span className="text-cyan-400">{node.latency ? `${node.latency}ms` : '3.2ms'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono pt-0.5 border-t border-slate-800/60">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Trust:
                  </span>
                  <span className="font-bold" style={{ color: trustColor }}>
                    {trustScore}%
                  </span>
                </div>
              </div>
            ),
          },
          style: {
            background: 'rgba(15, 23, 42, 0.92)',
            border: `2px solid ${tier.color}`,
            borderRadius: '12px',
            color: '#f8fafc',
            padding: '10px 14px',
            boxShadow: isOnline
              ? `0 0 20px ${tier.color}35, inset 0 0 10px ${tier.color}15`
              : 'none',
            width: 200,
            backdropFilter: 'blur(8px)',
          },
        });
      });
    });

    return generatedNodes;
  }, [visibleNodes, trustProfiles]);

  // Synthesize and map animated 5G edges
  const flowEdges: Edge[] = useMemo(() => {
    const nodeNames = new Set(flowNodes.map((n) => n.id));
    const edges: Edge[] = [];

    // Helper to format bandwidth
    const formatBw = (bw: number) => {
      if (bw >= 1000) return `${(bw / 1000).toFixed(1)} Gbps`;
      return `${bw.toFixed(0)} Mbps`;
    };

    // 1. Map real active sessions from backend
    if (activeSessions && activeSessions.length > 0) {
      activeSessions.forEach((sess) => {
        // Resolve source and target node names
        const srcNode = nodes.find(
          (n) => n.nodeName === sess.sourceNodeId || n.id === sess.sourceNodeId
        );
        const dstNode = nodes.find(
          (n) => n.nodeName === sess.destinationNodeId || n.id === sess.destinationNodeId
        );

        const srcName = srcNode ? srcNode.nodeName : sess.sourceNodeId;
        const dstName = dstNode ? dstNode.nodeName : sess.destinationNodeId;

        if (nodeNames.has(srcName) && nodeNames.has(dstName) && srcName !== dstName) {
          const protoKey = (sess.protocol || 'TCP').toUpperCase();
          const cfg = PROTOCOL_CONFIG[protoKey] || { color: '#06b6d4', label: protoKey };
          const bw = sess.averageBandwidth || 1200;

          edges.push({
            id: `edge-${sess.sessionId || `${srcName}-${dstName}`}`,
            source: srcName,
            target: dstName,
            animated: true,
            label: `${cfg.label} • ${formatBw(bw)}`,
            labelStyle: {
              fill: '#ffffff',
              fontWeight: 700,
              fontSize: 9,
              fontFamily: 'monospace',
            },
            labelBgStyle: {
              fill: '#090d16',
              fillOpacity: 0.9,
              rx: 4,
              ry: 4,
            },
            labelBgPadding: [6, 4],
            style: {
              stroke: cfg.color,
              strokeWidth: isBursting ? 3.5 : Math.max(2, Math.min(4.5, bw / 1800)),
              strokeDasharray: isBursting ? '4, 4' : '6, 6',
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: cfg.color,
            },
          });
        }
      });
    }

    // 2. Synthesize fallback 5G structural circuits if edges are sparse
    if (edges.length < 6 && flowNodes.length > 1) {
      // Connect each tier logically
      const core = flowNodes.filter((n) => n.id.includes('Core'));
      const agg = flowNodes.filter((n) => n.id.includes('Agg'));
      const gw = flowNodes.filter((n) => n.id.includes('Gateway') || n.id.includes('GNB'));
      const mec = flowNodes.filter((n) => n.id.includes('MEC'));
      const iot = flowNodes.filter((n) => n.id.includes('IoT') || n.id.includes('Sensor'));

      // Core <-> Agg
      core.forEach((c) => {
        agg.forEach((a) => {
          edges.push({
            id: `edge-syn-${c.id}-${a.id}`,
            source: c.id,
            target: a.id,
            animated: true,
            label: 'GTP-U • 10.0 Gbps',
            labelStyle: { fill: '#ffffff', fontWeight: 700, fontSize: 9, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#090d16', fillOpacity: 0.9, rx: 4, ry: 4 },
            labelBgPadding: [6, 4],
            style: { stroke: '#06b6d4', strokeWidth: 2.8, strokeDasharray: '6, 6' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4', width: 14, height: 14 },
          });
        });
      });

      // Agg <-> Gateways
      agg.forEach((a, idx) => {
        const targetGws = gw.slice(idx * 2, idx * 2 + 2);
        targetGws.forEach((g) => {
          edges.push({
            id: `edge-syn-${a.id}-${g.id}`,
            source: a.id,
            target: g.id,
            animated: true,
            label: 'HTTP/2 SBA • 2.5 Gbps',
            labelStyle: { fill: '#ffffff', fontWeight: 700, fontSize: 9, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#090d16', fillOpacity: 0.9, rx: 4, ry: 4 },
            labelBgPadding: [6, 4],
            style: { stroke: '#10b981', strokeWidth: 2.4, strokeDasharray: '6, 6' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 14, height: 14 },
          });
        });
      });

      // Gateways <-> MEC Processors
      gw.forEach((g, idx) => {
        const targetMecs = mec.slice(idx, idx + 2);
        targetMecs.forEach((m) => {
          edges.push({
            id: `edge-syn-${g.id}-${m.id}`,
            source: g.id,
            target: m.id,
            animated: true,
            label: 'UDP • 1.2 Gbps',
            labelStyle: { fill: '#ffffff', fontWeight: 700, fontSize: 9, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#090d16', fillOpacity: 0.9, rx: 4, ry: 4 },
            labelBgPadding: [6, 4],
            style: { stroke: '#6366f1', strokeWidth: 2.2, strokeDasharray: '6, 6' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1', width: 14, height: 14 },
          });
        });
      });

      // MEC <-> IoT Sensors
      mec.forEach((m, idx) => {
        const targetIot = iot.slice(idx * 2, idx * 2 + 2);
        targetIot.forEach((i) => {
          edges.push({
            id: `edge-syn-${m.id}-${i.id}`,
            source: m.id,
            target: i.id,
            animated: true,
            label: 'MQTT • 120 Mbps',
            labelStyle: { fill: '#ffffff', fontWeight: 700, fontSize: 9, fontFamily: 'monospace' },
            labelBgStyle: { fill: '#090d16', fillOpacity: 0.9, rx: 4, ry: 4 },
            labelBgPadding: [6, 4],
            style: { stroke: '#ec4899', strokeWidth: 2.0, strokeDasharray: '6, 6' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ec4899', width: 14, height: 14 },
          });
        });
      });
    }

    return edges;
  }, [flowNodes, activeSessions, nodes, isBursting]);

  if (isLoading && nodes.length === 0) {
    return (
      <Card className="p-16 text-center bg-slate-900/80 border border-slate-800/80">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <LoadingSpinner size="lg" />
          <span className="text-sm font-mono">
            Synthesizing interactive 3GPP and IoT animated topology layer...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Bar & Legend Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800/90 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
            <Share2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Live Animated 5G & IoT Topology Graph
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{flowEdges.length} ACTIVE CIRCUITS</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Hierarchical 3GPP Release 17 Architecture: Core → Aggregation → Gateways → MEC → Field Sensors
            </p>
          </div>
        </div>

        {/* View Slice Controls & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Slice Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-mono">
            <button
              onClick={() => setSliceFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sliceFilter === 'ALL'
                  ? 'bg-primary text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FULL TOPOLOGY
            </button>
            <button
              onClick={() => setSliceFilter('BACKBONE')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sliceFilter === 'BACKBONE'
                  ? 'bg-primary text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5G BACKBONE
            </button>
            <button
              onClick={() => setSliceFilter('IOT')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sliceFilter === 'IOT'
                  ? 'bg-primary text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              IOT & MEC
            </button>
          </div>

          <button
            onClick={handleBurstTraffic}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
              isBursting
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30 animate-pulse'
                : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBursting ? 'BURSTING TRAFFIC...' : 'BURST TRAFFIC'}</span>
          </button>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="font-mono text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync
            </Button>
          )}
        </div>
      </div>

      {/* React Flow Interactive Canvas */}
      <div className="h-[560px] w-full bg-slate-950/95 rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden relative">
        {flowNodes.length > 0 ? (
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={1.8}
          >
            <Background color="#1e293b" gap={28} size={1.2} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 shadow-xl !rounded-xl" />
            <MiniMap
              nodeColor={(n) => {
                const s = String(n.id || '');
                if (s.includes('Core')) return '#f59e0b';
                if (s.includes('Agg')) return '#6366f1';
                if (s.includes('Gateway') || s.includes('GNB')) return '#06b6d4';
                if (s.includes('MEC')) return '#14b8a6';
                return '#10b981';
              }}
              style={{
                backgroundColor: '#090d16',
                border: '1px solid #1e293b',
                borderRadius: '12px',
              }}
            />
          </ReactFlow>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-slate-500 font-mono">
            <Layers className="w-10 h-10 opacity-40 text-cyan-400" />
            <span className="text-white font-bold">No nodes matched current filter slice.</span>
            <span className="text-xs text-slate-400">
              Switch filter to "FULL TOPOLOGY" to restore 5G network graph.
            </span>
          </div>
        )}

        {/* Floating Protocol Legend Badge Tray */}
        <div className="absolute bottom-4 left-4 z-10 hidden md:flex items-center gap-3.5 bg-slate-900/95 border border-slate-800 px-4 py-2.5 rounded-xl backdrop-blur-md text-[11px] font-mono shadow-2xl">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> 5G Protocols:
          </span>
          {Object.entries(PROTOCOL_CONFIG).map(([proto, cfg]) => (
            <span key={proto} className="flex items-center gap-1.5 font-semibold text-slate-200">
              <span style={{ backgroundColor: cfg.color }} className="w-2.5 h-2.5 rounded-full shadow-sm" />
              <span>{cfg.label}</span>
            </span>
          ))}
        </div>

        {/* Node Detail Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">{selectedNode.nodeName}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Device Type:</span>
                <span className="font-semibold text-cyan-300">{selectedNode.nodeType}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">IP Address:</span>
                <span className="text-white">{selectedNode.ipAddress}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {selectedNode.status}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Bandwidth:</span>
                <span className="text-white">{selectedNode.bandwidth} Mbps</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Latency:</span>
                <span className="text-amber-400">{selectedNode.latency} ms</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Signal RSSI:</span>
                <span className="text-teal-400">{selectedNode.signalStrength} dBm</span>
              </div>
              {selectedNode.batteryLevel !== undefined && (
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Battery Level:</span>
                  <span className="text-white">{selectedNode.batteryLevel}%</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Firmware: {selectedNode.firmwareVersion || 'v2.4.0-5g'}</span>
              <button
                onClick={handleBurstTraffic}
                className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 font-bold"
              >
                Pulse Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
