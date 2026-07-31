import React, { useState } from 'react';
import { useNodes, useNodeStatistics, useCreateNode, useUpdateNode, useDeleteNode, useUpdateNodeStatus } from '@/hooks/useNodeHooks';
import { useCommunicationSessions, useCommunicationPackets, useLiveTrafficFeed } from '@/hooks/useCommunicationHooks';
import { NodeSummaryCards } from '@/components/network/NodeSummaryCards';
import { NodeTable } from '@/components/network/NodeTable';
import { NodeDetailsPanel } from '@/components/network/NodeDetailsPanel';
import { NodeFormModal, DeleteConfirmationModal } from '@/components/network/NodeModal';
import { NetworkTopologyView } from '@/components/network/NetworkTopologyView';
import { SessionsTable } from '@/components/network/SessionsTable';
import { PacketsTable } from '@/components/network/PacketsTable';
import { CommunicationVisualizations } from '@/components/network/CommunicationVisualizations';
import { SimulationNode, NodeCreateInput, SimulationNodeStatus } from '@/types/node';
import { Button } from '@/components/common/Button';
import { Radio, Plus, Activity, Share2, Zap, Server } from 'lucide-react';

type TabView = 'TOPOLOGY' | 'SESSIONS' | 'PACKETS' | 'REGISTRY';

export const Network: React.FC = () => {
  // Navigation state
  const [activeTab, setActiveTab] = useState<TabView>('TOPOLOGY');

  // Module 1 Node Management Hooks
  const { data: statsData, isLoading: statsLoading } = useNodeStatistics();
  const { data: nodesResult, isLoading: nodesLoading, isError: nodesError, refetch: refetchNodes } = useNodes();
  const createMutation = useCreateNode();
  const updateMutation = useUpdateNode();
  const deleteMutation = useDeleteNode();
  const statusMutation = useUpdateNodeStatus();

  // Module 3 Communication Engine Hooks
  const { data: liveFeed, isLoading: liveLoading, refetch: refetchLive } = useLiveTrafficFeed();
  const { data: sessionsRes, isLoading: sessionsLoading, refetch: refetchSessions } = useCommunicationSessions({ limit: 60 });
  const { data: packetsRes, isLoading: packetsLoading, refetch: refetchPackets } = useCommunicationPackets({ limit: 60 });

  // Local UI Modal & Drawer State
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<SimulationNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<SimulationNode | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const nodesList = nodesResult?.data || [];
  const activeSessions = liveFeed?.activeSessions || [];
  const sessionsList = sessionsRes?.data || [];
  const packetsList = packetsRes?.data || [];

  // Handlers for Node Registry
  const handleCreateOrUpdate = async (data: NodeCreateInput) => {
    setModalError(null);
    try {
      if (editingNode) {
        await updateMutation.mutateAsync({ id: editingNode.id, data });
        setEditingNode(null);
        if (selectedNode?.id === editingNode.id) {
          setSelectedNode({ ...editingNode, ...data } as SimulationNode);
        }
      } else {
        await createMutation.mutateAsync(data);
        setIsAddModalOpen(false);
      }
      refetchNodes();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save node modifications.';
      setModalError(errorMsg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNode) return;
    try {
      await deleteMutation.mutateAsync(deletingNode.id);
      if (selectedNode?.id === deletingNode.id) {
        setSelectedNode(null);
      }
      setDeletingNode(null);
      refetchNodes();
    } catch (err: unknown) {
      console.error('Delete failed:', err);
    }
  };

  const handleStatusToggle = async (node: SimulationNode, newStatus: SimulationNodeStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await statusMutation.mutateAsync({ id: node.id, status: newStatus });
      if (selectedNode?.id === node.id) {
        setSelectedNode({ ...selectedNode, status: newStatus });
      }
      refetchNodes();
    } catch (err: unknown) {
      console.error('Status patch failed:', err);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* Page Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl font-sans">
                5G Network Topology & Communication Engine
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                MODULE 3 LIVE
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400 font-mono">
              Real-time 3GPP and IoT device interaction circuits with automatic Edge Server event ingestion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setModalError(null);
              setIsAddModalOpen(true);
            }}
            className="shadow-lg hover:shadow-indigo-500/20 transition-all font-semibold font-mono text-xs"
          >
            <Plus className="w-4 h-4 mr-2" /> Register Simulation Node
          </Button>
        </div>
      </div>

      {/* Glassmorphic Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <button
          onClick={() => setActiveTab('TOPOLOGY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
            activeTab === 'TOPOLOGY'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Share2 className="w-4 h-4 text-emerald-400" /> Live Topology Map
        </button>

        <button
          onClick={() => setActiveTab('SESSIONS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
            activeTab === 'SESSIONS'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-400" /> Active Sessions
          {sessionsList.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-indigo-300 font-bold border border-slate-700">
              {sessionsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PACKETS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
            activeTab === 'PACKETS'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" /> Packets Log
        </button>

        <button
          onClick={() => setActiveTab('REGISTRY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
            activeTab === 'REGISTRY'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Server className="w-4 h-4 text-purple-400" /> Node Registry & Config
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 text-purple-300 font-bold border border-slate-700">
            {nodesList.length}
          </span>
        </button>
      </div>

      {/* Dynamic Tab Workspace Render */}
      <div className="mt-2 space-y-6">
        {activeTab === 'TOPOLOGY' && (
          <div className="space-y-6">
            <CommunicationVisualizations />
            <NetworkTopologyView
              nodes={nodesList}
              activeSessions={activeSessions}
              isLoading={nodesLoading || liveLoading}
              onRefresh={() => {
                refetchNodes();
                refetchLive();
              }}
            />
          </div>
        )}

        {activeTab === 'SESSIONS' && (
          <div className="space-y-6">
            <CommunicationVisualizations />
            <SessionsTable
              sessions={sessionsList}
              isLoading={sessionsLoading}
              onRefresh={refetchSessions}
            />
          </div>
        )}

        {activeTab === 'PACKETS' && (
          <div className="space-y-6">
            <CommunicationVisualizations />
            <PacketsTable
              packets={packetsList}
              isLoading={packetsLoading}
              onRefresh={refetchPackets}
            />
          </div>
        )}

        {activeTab === 'REGISTRY' && (
          <div className="space-y-6">
            <NodeSummaryCards statistics={statsData} isLoading={statsLoading} />
            <div className="space-y-3">
              <h2 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
                <span>Registered 5G Entities ({nodesList.length} total)</span>
                <span className="text-[11px] text-slate-500 font-normal">Click any row to open property inspector</span>
              </h2>
              <NodeTable
                nodes={nodesList}
                isLoading={nodesLoading}
                isError={nodesError}
                onRefresh={refetchNodes}
                onRowClick={(node) => setSelectedNode(node)}
                onEdit={(node, e) => {
                  e.stopPropagation();
                  setModalError(null);
                  setEditingNode(node);
                }}
                onDelete={(node, e) => {
                  e.stopPropagation();
                  setDeletingNode(node);
                }}
                onStatusToggle={handleStatusToggle}
              />
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Inspection Detail Tray */}
      <NodeDetailsPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onEdit={(node) => {
          setSelectedNode(null);
          setModalError(null);
          setEditingNode(node);
        }}
        onDelete={(node) => {
          setSelectedNode(null);
          setDeletingNode(node);
        }}
      />

      {/* Add & Edit Node Modal */}
      <NodeFormModal
        isOpen={isAddModalOpen || !!editingNode}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingNode(null);
          setModalError(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingNode}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        errorMessage={modalError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingNode}
        onClose={() => setDeletingNode(null)}
        onConfirm={handleDeleteConfirm}
        nodeName={deletingNode?.nodeName}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
