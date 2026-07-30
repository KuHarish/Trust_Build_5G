import React, { useState } from 'react';
import { useNodes, useNodeStatistics, useCreateNode, useUpdateNode, useDeleteNode, useUpdateNodeStatus } from '@/hooks/useNodeHooks';
import { NodeSummaryCards } from '@/components/network/NodeSummaryCards';
import { NodeTable } from '@/components/network/NodeTable';
import { NodeDetailsPanel } from '@/components/network/NodeDetailsPanel';
import { NodeFormModal, DeleteConfirmationModal } from '@/components/network/NodeModal';
import { SimulationNode, NodeCreateInput, SimulationNodeStatus } from '@/types/node';
import { Button } from '@/components/common/Button';
import { Radio, Plus, Activity, ShieldCheck, Cpu } from 'lucide-react';

export const Network: React.FC = () => {
  // React Query Hooks with automatic 5000ms telemetry refetching
  const { data: statsData, isLoading: statsLoading } = useNodeStatistics();
  const { data: nodesResult, isLoading: nodesLoading, isError: nodesError, refetch: refetchNodes } = useNodes();
  const createMutation = useCreateNode();
  const updateMutation = useUpdateNode();
  const deleteMutation = useDeleteNode();
  const statusMutation = useUpdateNodeStatus();

  // Local UI State
  const [selectedNode, setSelectedNode] = useState<SimulationNode | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<SimulationNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<SimulationNode | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const nodesList = nodesResult?.data || [];

  // Handlers
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
    <div className="space-y-6 text-slate-100 pb-10">
      {/* Page Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 shadow-inner">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                5G Network Node Command & Simulation
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold animate-pulse">
                5S TELEMETRY SYNC
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400 font-mono">
              Live virtual 3GPP & IoT radio topology registry with automated background telemetry synthesis (Module 1).
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
            className="shadow-lg hover:shadow-blue-500/20 transition-all font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> Register Simulation Node
          </Button>
        </div>
      </div>

      {/* KPI Summary Widget */}
      <NodeSummaryCards statistics={statsData} isLoading={statsLoading} />

      {/* Feature Pills / Telemetry Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs font-mono">
            <span className="text-white font-bold block">Dynamic Telemetry Engine</span>
            <span className="text-slate-400">Randomized signal, latency & battery variations</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-xs font-mono">
            <span className="text-white font-bold block">MongoDB & Fallback Sync</span>
            <span className="text-slate-400">Motor asynchronous database persistence</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-mono">
            <span className="text-white font-bold block">Sprint 1.1 Controlled Bounds</span>
            <span className="text-slate-400">Zero packet routing or ML attacks injected</span>
          </div>
        </div>
      </div>

      {/* Main Node Registry Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
          <span>Active 5G Entities Registry ({nodesList.length} total)</span>
          <span className="text-[11px] text-slate-500 font-normal">Click any row to open slide-over property inspector</span>
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
