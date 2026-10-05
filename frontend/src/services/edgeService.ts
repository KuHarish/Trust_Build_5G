/**
 * TrustChain-5G Module 2 Edge Server Service Layer.
 * Wraps API communications into typed async helper calls with standardized error handling.
 */

import { edgeApi } from '@/api/edgeApi';
import { CommunicationEvent, NetworkFeature, EdgeStatistics, EventFilterParams } from '@/types/edge';
import { AxiosError } from 'axios';

export class EdgeService {
  static async getStatistics(): Promise<EdgeStatistics> {
    try {
      const response = await edgeApi.getStatistics();
      return response.data as EdgeStatistics;
    } catch (error) {
      throw EdgeService.extractError(error, 'Failed to fetch Edge Server statistics.');
    }
  }

  static async listEvents(params?: EventFilterParams): Promise<{ data: CommunicationEvent[]; totalCount: number }> {
    try {
      const response = await edgeApi.listEvents(params);
      return {
        data: response.data.data as CommunicationEvent[],
        totalCount: response.data.total_count || 0,
      };
    } catch (error) {
      throw EdgeService.extractError(error, 'Failed to list communication events.');
    }
  }

  static async getEvent(id: string): Promise<CommunicationEvent> {
    try {
      const response = await edgeApi.getEvent(id);
      return response.data.data as CommunicationEvent;
    } catch (error) {
      throw EdgeService.extractError(error, `Failed to retrieve event [${id}].`);
    }
  }

  static async deleteEvent(id: string): Promise<string> {
    try {
      await edgeApi.deleteEvent(id);
      return id;
    } catch (error) {
      throw EdgeService.extractError(error, `Failed to delete event [${id}].`);
    }
  }

  static async listFeatures(): Promise<{ data: NetworkFeature[]; totalCount: number }> {
    try {
      const response = await edgeApi.listFeatures();
      return {
        data: response.data.data as NetworkFeature[],
        totalCount: response.data.total_count || 0,
      };
    } catch (error) {
      throw EdgeService.extractError(error, 'Failed to retrieve extracted features registry.');
    }
  }

  static async getNodeFeature(nodeId: string): Promise<NetworkFeature> {
    try {
      const response = await edgeApi.getNodeFeature(nodeId);
      return response.data.data as NetworkFeature;
    } catch (error) {
      throw EdgeService.extractError(error, `Failed to fetch features for node [${nodeId}].`);
    }
  }

  private static extractError(error: unknown, fallbackMessage: string): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message;
      if (detail && typeof detail === 'string') {
        return new Error(detail);
      }
    }
    return error instanceof Error ? error : new Error(fallbackMessage);
  }
}
