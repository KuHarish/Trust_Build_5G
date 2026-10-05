import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SimulationNode } from '@/types/node';
import { CommunicationSession } from '@/types/communication';
import { Card, LoadingSpinner, Button } from '@/components/common';
import { Share2, RefreshCw, Activity, Layers } from 'lucide-react';

interface TopologyViewProps {
  nodes: SimulationNode[];
  activeSessions: CommunicationSession[];
  isLoading: boolean;
  onRefresh?: () => void;
  trustProfiles?: any[];
}

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: '#3b82f6',
  UDP: '#6366f1',
  HTTP: '#a855f7',
  HTTPS: '#10b981',
  ICMP: '#f59e0b',
  MQTT: '#ec4899',
  CoAP: '#06b6d4',
};

export const NetworkTopologyView: React.FC<TopologyViewProps> = ({
  nodes,
  activeSessions,
  isLoading,
  onRefresh,
  trustProfiles = [],
}) => {
  // Synthesize React Flow nodes from Sprint 1.1 simulation registry
  const flowNodes: Node[] = useMemo(() => {
    const cols = 3;
    const hSpacing = 280;
    const vSpacing = 160;

    return nodes.map((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const isOnline = node.status === 'ONLINE';

      const profile = trustProfiles.find(p => p.nodeId === node.nodeName);

      // Style determination based on node category
      let borderColor = '#6366f1';
      if (node.nodeType === 'Gateway') borderColor = '#f59e0b';
      else if (node.nodeType === 'IoT Sensor') borderColor = '#10b981';
      else if (node.nodeType === 'Medical Device') borderColor = '#ef4444';
      else if (node.nodeType === 'Autonomous Vehicle') borderColor = '#06b6d4';

      if (profile) {
        if (profile.trustLevel === 'TRUSTED') borderColor = '#10b981';
        else if (profile.trustLevel === 'SUSPICIOUS' || profile.trustLevel === 'WARNING') borderColor = '#f59e0b';
        else if (profile.trustLevel === 'MALICIOUS' || profile.trustLevel === 'CRITICAL') borderColor = '#ef4444';
      }

      const scoreDisplay = profile && profile.currentTrustScore !== null && profile.currentTrustScore !== undefined 
        ? `\nTrust: ${(profile.currentTrustScore * 100).toFixed(0)}%` 
        : '';

      return {
        id: node.nodeName,
        position: { x: col * hSpacing + 60, y: row * vSpacing + 60 },
        data: { label: `${node.nodeName}\n(${node.nodeType})${scoreDisplay}` },
        style: {
          background: '#0f172a',
          border: `2px solid ${borderColor}`,
          borderRadius: '10px',
          color: isOnline ? '#f8fafc' : '#64748b',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          padding: '8px 12px',
          boxShadow: isOnline ? `0 0 15px ${borderColor}40` : 'none',
          opacity: isOnline ? 1 : 0.6,
          textAlign: 'center' as const,
          width: 180,
        },
      };
    });
  }, [nodes, trustProfiles]);

  // Synthesize animated connecting edges from Module 3 active sessions
  const flowEdges: Edge[] = useMemo(() => {
    return activeSessions
      .filter((sess) => {
        const srcExists = nodes.some((n) => n.nodeName === sess.sourceNodeId);
        const dstExists = nodes.some((n) => n.nodeName === sess.destinationNodeId);
        return srcExists && dstExists;
      })
      .map((sess) => {
        const proto = sess.protocol ? str(sess.protocol).toUpperCase() : 'TCP';
        const strokeColor = PROTOCOL_COLORS[proto] || '#6366f1';
        const strokeWidth = Math.max(2, Math.min(6, Math.round((sess.averageBandwidth || 500) / 160)));

        return {
          id: sess.sessionId,
          source: sess.sourceNodeId,
          target: sess.destinationNodeId,
          animated: true,
          label: `${sess.protocol}`,
          labelStyle: { fill: '#cbd5e1', fontWeight: 700, fontSize: 10, fontFamily: 'monospace' },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8, color: '#fff' },
          style: { stroke: strokeColor, strokeWidth },
        };
      });
  }, [activeSessions, nodes]);

  function str(val: unknown): string {
    return String(val || '');
  }

  if (isLoading && nodes.length === 0) {
    return (
      <Card className="p-16 text-center bg-slate-900/80 border border-slate-800/80">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
          <LoadingSpinner size="lg" />
          <span className="text-sm font-mono">Synthesizing interactive 3GPP and IoT animated topology layer...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Bar & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Share2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
              Live Animated 5G & IoT Topology Graph
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {flowEdges.length} ACTIVE CIRCUITS
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Edge coloring depicts transmission protocol; line thickness scales directly with throughput bandwidth.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="font-mono text-xs text-slate-300 border-slate-700">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Topology
            </Button>
          )}
        </div>
      </div>

      {/* React Flow Interactive Canvas */}
      <div className="h-[520px] w-full bg-slate-950/90 rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden relative">
        {nodes.length > 0 ? (
          <ReactFlow nodes={flowNodes} edges={flowEdges} fitView attributionPosition="bottom-right" proOptions={{ hideAttribution: true }}>
            <Background color="#334155" gap={24} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200 shadow-xl" />
            <MiniMap
              nodeColor={(n) => {
                const s = String(n.data?.label || '');
                if (s.includes('Gateway')) return '#f59e0b';
                if (s.includes('IoT Sensor')) return '#10b981';
                if (s.includes('Medical')) return '#ef4444';
                return '#6366f1';
              }}
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
            />
          </ReactFlow>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-500 font-mono">
            <Layers className="w-8 h-8 opacity-40 mb-1" />
            <span>No simulation nodes currently registered in topology registry.</span>
            <span className="text-xs text-slate-600">Register new nodes in the Registry tab to trigger live circuit pairing.</span>
          </div>
        )}

        {/* Floating Protocol Legend Badge Tray */}
        <div className="absolute bottom-4 left-4 z-10 hidden md:flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-md text-[11px] font-mono shadow-xl">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Protocols:
          </span>
          {Object.entries(PROTOCOL_COLORS).map(([proto, col]) => (
            <span key={proto} className="flex items-center gap-1 font-semibold text-slate-200">
              <div style={{ backgroundColor: col }} className="w-2.5 h-2.5 rounded-full" />
              {proto}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
