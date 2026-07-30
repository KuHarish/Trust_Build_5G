import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { DashboardLiveResponse, SimulationControlRequest } from '../types/dashboard';

/**
 * Custom React Query & WebSocket Live Streaming Hook for Sprint 1.4 Centralized Dashboard.
 * Automatically synchronizes with backend WebSocket / SSE stream without manual page refreshing.
 */
export const useLiveDashboardStream = () => {
  const [liveData, setLiveData] = useState<DashboardLiveResponse | null>(null);
  const [connectionType, setConnectionType] = useState<'websocket' | 'sse' | 'polling' | 'connecting'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  // Initial fetch and automatic polling fallback via React Query
  const fallbackQuery = useQuery({
    queryKey: ['dashboard-live-feed'],
    queryFn: () => dashboardService.getLiveFeed(),
    refetchInterval: connectionType === 'polling' ? 3000 : false,
    staleTime: 2000,
  });

  useEffect(() => {
    if (fallbackQuery.data && (!liveData || connectionType === 'polling')) {
      setLiveData(fallbackQuery.data);
    }
  }, [fallbackQuery.data, liveData, connectionType]);

  const establishWebSocket = useCallback(() => {
    const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
      .replace(/^http/, 'ws') + '/api/dashboard/ws';

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionType('websocket');
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as DashboardLiveResponse;
          setLiveData(parsed);
        } catch (e) {
          console.error('Error parsing dashboard WebSocket frame:', e);
        }
      };

      ws.onerror = () => {
        // On error, revert to SSE or React Query polling
        setConnectionType('polling');
      };

      ws.onclose = () => {
        // Retry connection or revert to polling
        setConnectionType('polling');
      };
    } catch (err) {
      setConnectionType('polling');
    }
  }, []);

  useEffect(() => {
    establishWebSocket();
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [establishWebSocket]);

  return {
    liveData: liveData || fallbackQuery.data || null,
    isLoading: !liveData && fallbackQuery.isLoading,
    isError: fallbackQuery.isError,
    connectionType,
    refetch: fallbackQuery.refetch,
  };
};

export const useDashboardStatistics = () => {
  return useQuery({
    queryKey: ['dashboard-statistics-trends'],
    queryFn: () => dashboardService.getStatistics(),
    refetchInterval: 5000, // Refetch chart series every 5s
  });
};

export const useSimulationControlMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cmd: SimulationControlRequest) => dashboardService.controlSimulation(cmd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-live-feed'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-statistics-trends'] });
    },
  });
};
