/**
 * TrustChain-5G Module 3 - React Query Hooks for Communication Engine & Traffic Generation.
 * Incorporates automatic 4000ms polling synchronization intervals to keep animated topology maps and tables real-time.
 */

import { useQuery } from '@tanstack/react-query';
import { CommunicationService } from '@/services/communicationService';
import { SessionQueryParams, PacketQueryParams } from '@/api/communicationApi';

export const COMM_QUERY_KEYS = {
  all: ['communication'] as const,
  sessions: (params?: SessionQueryParams) => ['communication', 'sessions', params] as const,
  session: (id: string) => ['communication', 'sessions', id] as const,
  packets: (params?: PacketQueryParams) => ['communication', 'packets', params] as const,
  packet: (id: string) => ['communication', 'packets', id] as const,
  liveFeed: ['communication', 'live'] as const,
  statistics: ['communication', 'statistics'] as const,
};

export function useCommunicationSessions(params?: SessionQueryParams) {
  return useQuery({
    queryKey: COMM_QUERY_KEYS.sessions(params),
    queryFn: () => CommunicationService.listSessions(params),
    refetchInterval: 4000,
  });
}

export function useCommunicationSession(id: string) {
  return useQuery({
    queryKey: COMM_QUERY_KEYS.session(id),
    queryFn: () => CommunicationService.getSession(id),
    enabled: !!id,
  });
}

export function useCommunicationPackets(params?: PacketQueryParams) {
  return useQuery({
    queryKey: COMM_QUERY_KEYS.packets(params),
    queryFn: () => CommunicationService.listPackets(params),
    refetchInterval: 4000,
  });
}

export function useCommunicationPacket(id: string) {
  return useQuery({
    queryKey: COMM_QUERY_KEYS.packet(id),
    queryFn: () => CommunicationService.getPacket(id),
    enabled: !!id,
  });
}

export function useLiveTrafficFeed() {
  return useQuery({
    queryKey: COMM_QUERY_KEYS.liveFeed,
    queryFn: () => CommunicationService.getLiveFeed(),
    refetchInterval: 3500,
  });
}

export function useCommunicationStatistics() {
  return useQuery({
    queryKey: COMM_QUERY_KEYS.statistics,
    queryFn: () => CommunicationService.getStatistics(),
    refetchInterval: 4000,
  });
}
