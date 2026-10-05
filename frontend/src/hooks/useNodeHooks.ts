/**
 * TrustChain-5G Module 1 - React Query Hooks for Network Node Management.
 * Features automatic 5000ms refetch intervals to render real-time simulation updates dynamically.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NodeService } from '@/services/nodeService';
import { NodeCreateInput, NodeUpdateInput, SimulationNodeStatus } from '@/types/node';

export const NODE_QUERY_KEYS = {
  all: ['nodes'] as const,
  list: (params?: Record<string, unknown>) => ['nodes', 'list', params] as const,
  detail: (id: string) => ['nodes', 'detail', id] as const,
  statistics: ['nodes', 'statistics'] as const,
};

export function useNodeStatistics() {
  return useQuery({
    queryKey: NODE_QUERY_KEYS.statistics,
    queryFn: () => NodeService.getStatistics(),
    refetchInterval: 5000, // Automatically poll every 5 seconds to mirror simulation updates
  });
}

export function useNodes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: NODE_QUERY_KEYS.list(params),
    queryFn: () => NodeService.listNodes(params),
    refetchInterval: 5000,
  });
}

export function useNode(id?: string) {
  return useQuery({
    queryKey: NODE_QUERY_KEYS.detail(id || ''),
    queryFn: () => NodeService.getNode(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useCreateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NodeCreateInput) => NodeService.createNode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NODE_QUERY_KEYS.all });
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NodeUpdateInput }) =>
      NodeService.updateNode(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: NODE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NODE_QUERY_KEYS.detail(id) });
    },
  });
}

export function useUpdateNodeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SimulationNodeStatus }) =>
      NodeService.updateNodeStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: NODE_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: NODE_QUERY_KEYS.detail(id) });
    },
  });
}

export function useDeleteNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NodeService.deleteNode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NODE_QUERY_KEYS.all });
    },
  });
}
