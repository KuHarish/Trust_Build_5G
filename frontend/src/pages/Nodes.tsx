import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nodesApi, trustApi, securityApi, communicationApi } from '@/api/endpoints';
import { Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/layouts/PageHeader';
import { Button } from '@/components/common/Button';
import { NetworkTopology } from '@/components/network/NetworkTopology';
import { NodeSecurityPanel } from '@/components/network/NodeSecurityPanel';

// -- TS Interfaces --
interface SimulationNode {
  _id: string; // from by_alias=True mapping
  nodeName: string;
  nodeType: string;
  status: string;
  ipAddress: string;
  macAddress: string;
  deviceCategory: string;
  signalStrength: number;
  bandwidth: number;
  latency: number;
  batteryLevel: number;
  lastSeen: string;
  createdAt: string;
  latitude: number;
  longitude: number;
}

interface TrustProfile {
  nodeId: string;
  trustScore: number;
  trustLevel: string;
}

interface NodeSecurityState {
  nodeId: string;
  logicalState: string;
  activeMitigations: number;
}

interface EnrichedNode extends SimulationNode {
  trustScore?: number;
  trustLevel?: string;
  securityState?: string;
}

export const Nodes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // 1. Fetch backend node registry
  const { data: nodesRes, isLoading: nodesLoading, isError: nodesError, refetch: refetchNodes } = useQuery({
    queryKey: ['nodes-sim'],
    queryFn: () => nodesApi.list(),
    refetchInterval: 10000, // Background real-time simulation updates
  });

  // 2. Fetch Module 3 Trust profiles
  const { data: trustRes } = useQuery({
    queryKey: ['trust-profiles'],
    queryFn: () => trustApi.getProfiles(),
    refetchInterval: 10000,
  });

  // 3. Fetch Module 6 Security States
  const { data: securityRes } = useQuery({
    queryKey: ['security-states'],
    queryFn: () => securityApi.getNodeStates(),
    refetchInterval: 10000,
  });

  // 4. Fetch Module 3 Communication Edges (Live Feed)
  const { data: liveFeedRes } = useQuery({
    queryKey: ['communication-live'],
    queryFn: () => communicationApi.getLiveFeed(),
    refetchInterval: 5000, // Real-time
  });

  const rawNodes: SimulationNode[] = nodesRes?.data?.data || [];
  const trustProfiles: TrustProfile[] = trustRes?.data?.data || [];
  const securityStates: NodeSecurityState[] = securityRes?.data?.data || [];
  const activeSessions = liveFeedRes?.data?.activeSessions || [];

  // Data Enrichment Foundation (Merges Simulator + Trust + Security)
  const enrichedNodes = useMemo(() => {
    return rawNodes.map((node) => {
      const trust = trustProfiles.find(t => t.nodeId === node._id);
      const sec = securityStates.find(s => s.nodeId === node._id);
      return {
        ...node,
        trustScore: trust?.trustScore,
        trustLevel: trust?.trustLevel,
        securityState: sec?.logicalState || 'NORMAL'
      } as EnrichedNode;
    });
  }, [rawNodes, trustProfiles, securityStates]);

  // Frontend filtering and search
  const filteredNodes = useMemo(() => {
    return enrichedNodes.filter(node => {
      const matchesSearch = searchTerm === '' || 
        node._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        node.nodeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || node.nodeType === filterType;
      return matchesSearch && matchesType;
    });
  }, [enrichedNodes, searchTerm, filterType]);

  const filteredSessions = useMemo(() => {
    const validNodeIds = new Set(filteredNodes.map(n => n._id));
    return activeSessions.filter((s: any) => 
      s.sourceNodeId !== s.destinationNodeId &&
      validNodeIds.has(s.sourceNodeId) && 
      validNodeIds.has(s.destinationNodeId)
    );
  }, [activeSessions, filteredNodes]);

  const selectedNode = enrichedNodes.find(n => n._id === selectedNodeId);



  return (
    <div className="space-y-6">
      <PageHeader 
        title="Network Nodes & Topology" 
        subtitle="Foundation layer for 5G network entities, integrating trust and security state across Modules 2, 3, and 6."
      />

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-1 gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Node ID or Name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="Smartphone">Smartphone</option>
            <option value="Edge Device">Edge Device</option>
            <option value="IoT Sensor">IoT Sensor</option>
            <option value="Gateway">Gateway</option>
          </select>
        </div>
        <Button variant="outline" onClick={() => refetchNodes()} className="shrink-0 gap-2">
          <RefreshCw className={`w-4 h-4 ${nodesLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {nodesError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span>Unable to load network nodes. Check backend connection.</span>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetchNodes()}>Retry</Button>
        </div>
      )}

      {/* Main Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Node List (Left 3 cols) */}
        <div className="xl:col-span-3">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden h-[600px]">
            {nodesLoading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 mb-3 opacity-50 animate-spin" />
                Loading network nodes and topology...
              </div>
            ) : (
              <NetworkTopology 
                nodes={filteredNodes} 
                sessions={filteredSessions} 
                selectedNodeId={selectedNodeId} 
                onNodeSelect={setSelectedNodeId} 
              />
            )}
          </div>
        </div>

        {/* Node Detail Side Panel (Right 1 col) */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <NodeSecurityPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />
          </div>
        </div>

      </div>
    </div>
  );
};
