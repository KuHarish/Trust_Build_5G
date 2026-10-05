import React, { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  Handle,
  Position,
  NodeProps,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Server, Activity, Cpu, Smartphone, Wifi, RadioTower, ShieldAlert } from 'lucide-react';

interface EnrichedNode {
  _id: string;
  nodeName: string;
  nodeType: string;
  status: string;
  ipAddress: string;
  macAddress: string;
  deviceCategory: string;
  trustScore?: number;
  trustLevel?: string;
  securityState?: string;
  latitude?: number;
  longitude?: number;
}

interface ActiveSession {
  sessionId: string;
  sourceNodeId: string;
  destinationNodeId: string;
  protocol: string;
  status: string;
}

interface NetworkTopologyProps {
  nodes: EnrichedNode[];
  sessions: ActiveSession[];
  selectedNodeId: string | null;
  onNodeSelect: (id: string) => void;
}

// ---------------------------------------------------------------------------
// CUSTOM NODE COMPONENT
// ---------------------------------------------------------------------------
const CustomTopologyNode = ({ data, selected }: NodeProps) => {
  const { node } = data as { node: EnrichedNode };
  
  const getIcon = () => {
    const type = node.nodeType?.toLowerCase() || '';
    if (type.includes('gateway') || type.includes('upf') || type.includes('smf')) return <Cpu className="w-5 h-5 text-indigo-400" />;
    if (type.includes('edge')) return <Server className="w-5 h-5 text-blue-400" />;
    if (type.includes('smartphone') || type.includes('device')) return <Smartphone className="w-5 h-5 text-slate-400" />;
    if (type.includes('sensor')) return <Wifi className="w-5 h-5 text-emerald-400" />;
    if (type.includes('gnb') || type.includes('base station') || type.includes('radio')) return <RadioTower className="w-5 h-5 text-purple-400" />;
    return <Server className="w-5 h-5 text-slate-400" />;
  };

  const getStatusColor = () => {
    if (node.status?.toUpperCase() === 'ONLINE') return 'bg-emerald-500 shadow-emerald-500/50';
    if (node.status?.toUpperCase() === 'OFFLINE') return 'bg-slate-500';
    return 'bg-amber-500 shadow-amber-500/50';
  };

  const getTrustBorder = () => {
    if (node.trustLevel === 'MALICIOUS') return 'border-rose-500 ring-2 ring-rose-500/20';
    if (node.trustLevel === 'SUSPICIOUS') return 'border-amber-500 ring-2 ring-amber-500/20';
    return 'border-slate-700';
  };

  const getSecurityBadge = () => {
    if (!node.securityState || node.securityState === 'NORMAL') return null;
    return (
      <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 z-10">
        <ShieldAlert className="w-2.5 h-2.5" />
        {node.securityState}
      </div>
    );
  };

  return (
    <div className={`
      relative bg-slate-900 border-2 rounded-xl p-3 min-w-[140px] transition-all shadow-xl
      ${getTrustBorder()}
      ${selected ? 'ring-4 ring-blue-500/30 border-blue-500 scale-105 z-50' : 'hover:border-slate-500 hover:shadow-slate-800/50'}
    `}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-600 border-none" />
      
      {getSecurityBadge()}
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-slate-800/50 rounded-lg shrink-0">
          {getIcon()}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-200 truncate">{node.nodeName || node._id}</span>
          <span className="text-[10px] text-slate-500 font-mono truncate">{node._id}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full shadow-sm ${getStatusColor()}`} />
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{node.status}</span>
        </div>
        
        {node.trustScore !== undefined && (
          <div className={`text-[10px] font-mono font-bold ${
            node.trustLevel === 'MALICIOUS' ? 'text-rose-400' :
            node.trustLevel === 'SUSPICIOUS' ? 'text-amber-400' :
            'text-emerald-400'
          }`}>
            T:{node.trustScore.toFixed(0)}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-600 border-none" />
    </div>
  );
};

const nodeTypes = {
  networkNode: CustomTopologyNode,
};

// ---------------------------------------------------------------------------
// MAIN TOPOLOGY COMPONENT
// ---------------------------------------------------------------------------
export const NetworkTopology: React.FC<NetworkTopologyProps> = ({ nodes, sessions, selectedNodeId, onNodeSelect }) => {
  const [rfNodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Transform raw data into React Flow format
  useEffect(() => {
    // 1. Calculate bounding box for geographic mapping
    const lats = nodes.map(n => n.latitude || 0);
    const lngs = nodes.map(n => n.longitude || 0);
    const minLat = Math.min(...lats, 0);
    const maxLat = Math.max(...lats, 0);
    const minLng = Math.min(...lngs, 0);
    const maxLng = Math.max(...lngs, 0);
    
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;

    // We will map into an 800x800 abstract grid
    const GRID_SIZE = 800;

    const flowNodes = nodes.map((node, index) => {
      // Automatic Layout: 
      // If lat/lng exists, use it. Otherwise, fallback to a circular layout to avoid overlaps.
      let x, y;
      
      if (node.latitude !== undefined && node.longitude !== undefined) {
        // Map longitude to X, latitude to Y (inverted so north is up)
        x = ((node.longitude - minLng) / lngRange) * GRID_SIZE;
        y = (1 - ((node.latitude - minLat) / latRange)) * GRID_SIZE;
        
        // Add a slight jitter based on ID hash to prevent exact overlap
        const hash = node._id.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
        x += (hash % 40) - 20;
        y += ((hash >> 4) % 40) - 20;
      } else {
        // Circular fallback
        const radius = Math.max(300, nodes.length * 20);
        const angle = (index / nodes.length) * 2 * Math.PI;
        x = GRID_SIZE/2 + radius * Math.cos(angle);
        y = GRID_SIZE/2 + radius * Math.sin(angle);
      }

      return {
        id: node._id,
        type: 'networkNode',
        position: { x, y },
        data: { node },
        selected: selectedNodeId === node._id,
      };
    });

    const flowEdges = sessions.map((session, index) => {
      return {
        id: session.sessionId || `edge-${index}`,
        source: session.sourceNodeId,
        target: session.destinationNodeId,
        animated: session.status === 'ACTIVE',
        type: 'smoothstep',
        style: {
          stroke: session.status === 'ACTIVE' ? '#3b82f6' : '#475569',
          strokeWidth: session.status === 'ACTIVE' ? 2 : 1,
          opacity: session.status === 'ACTIVE' ? 0.8 : 0.3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: session.status === 'ACTIVE' ? '#3b82f6' : '#475569',
        },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [nodes, sessions, setNodes, setEdges, selectedNodeId]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    onNodeSelect(node.id);
  }, [onNodeSelect]);

  const onPaneClick = useCallback(() => {
    // Optional: unselect when clicking canvas
    // onNodeSelect(null);
  }, []);

  return (
    <div className="w-full h-[600px] bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden relative">
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <Activity className="w-12 h-12 mb-4 opacity-20" />
          <p>No network nodes available for topology generation.</p>
        </div>
      ) : (
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="bg-slate-900 border-slate-800 fill-slate-400 shadow-xl rounded-lg overflow-hidden" showInteractive={false} />
          
          <Panel position="top-right" className="bg-slate-900/80 backdrop-blur border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-2 text-slate-300">
            <h4 className="font-bold border-b border-slate-700 pb-1 mb-2">Topology Legend</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Online</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500" /> Offline</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Degraded / Busy</div>
              <div className="h-px bg-slate-800 my-1"></div>
              <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-blue-500" /> Active Session (Animated)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-slate-600" /> Inactive Edge</div>
              <div className="h-px bg-slate-800 my-1"></div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 border-2 border-rose-500 rounded-sm" /> Malicious Trust</div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-rose-500" /> Security Intervention
              </div>
            </div>
          </Panel>
          
          {sessions.length === 0 && (
            <Panel position="bottom-center" className="bg-amber-900/30 text-amber-500/80 border border-amber-900/50 px-4 py-2 rounded-lg backdrop-blur text-xs mb-4">
              Relationship data is currently unavailable. No connections displayed.
            </Panel>
          )}
        </ReactFlow>
      )}
    </div>
  );
};
