/**
 * TrustChain-5G Module 2 - React Query Hooks for Edge Server & Feature Extraction.
 * Integrates automatic 5000ms polling intervals to keep tables and charts synchronized with backend traffic simulations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EdgeService } from '@/services/edgeService';
import { EventFilterParams } from '@/types/edge';

export const EDGE_QUERY_KEYS = {
  all: ['edge'] as const,
  statistics: ['edge', 'statistics'] as const,
  eventsList: (params?: EventFilterParams) => ['edge', 'events', params] as const,
  featuresList: ['edge', 'features'] as const,
  nodeFeature: (nodeId: string) => ['edge', 'features', nodeId] as const,
};

export function useEdgeStatistics() {
  return useQuery({
    queryKey: EDGE_QUERY_KEYS.statistics,
    queryFn: () => EdgeService.getStatistics(),
    refetchInterval: 5000,
  });
}

export function useEdgeEvents(params?: EventFilterParams) {
  return useQuery({
    queryKey: EDGE_QUERY_KEYS.eventsList(params),
    queryFn: () => EdgeService.listEvents(params),
    refetchInterval: 5000,
  });
}

export function useEdgeFeatures() {
  return useQuery({
    queryKey: EDGE_QUERY_KEYS.featuresList,
    queryFn: () => EdgeService.listFeatures(),
    refetchInterval: 5000,
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EdgeService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EDGE_QUERY_KEYS.all });
    },
  });
}
