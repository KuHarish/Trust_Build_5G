/**
 * TrustChain-5G Module 3 Communication Engine Service Layer.
 * Wraps API invocations in robust async typed helpers with standardized error unwrapping.
 */

import { communicationApi, SessionQueryParams, PacketQueryParams } from '@/api/communicationApi';
import {
  CommunicationSession,
  Packet,
  LiveTrafficFeed,
  CommunicationStatistics,
  SessionListResult,
  PacketListResult,
} from '@/types/communication';
import { AxiosError } from 'axios';

export class CommunicationService {
  static async listSessions(params?: SessionQueryParams): Promise<{ data: CommunicationSession[]; totalCount: number }> {
    try {
      const response = await communicationApi.listSessions(params);
      const resData = response.data as SessionListResult;
      return {
        data: resData.data || [],
        totalCount: resData.totalCount || 0,
      };
    } catch (error) {
      throw CommunicationService.extractError(error, 'Failed to fetch communication sessions list.');
    }
  }

  static async getSession(id: string): Promise<CommunicationSession> {
    try {
      const response = await communicationApi.getSession(id);
      return response.data.data as CommunicationSession;
    } catch (error) {
      throw CommunicationService.extractError(error, `Failed to retrieve communication session [${id}].`);
    }
  }

  static async listPackets(params?: PacketQueryParams): Promise<{ data: Packet[]; totalCount: number }> {
    try {
      const response = await communicationApi.listPackets(params);
      const resData = response.data as PacketListResult;
      return {
        data: resData.data || [],
        totalCount: resData.totalCount || 0,
      };
    } catch (error) {
      throw CommunicationService.extractError(error, 'Failed to fetch transmitted packet records.');
    }
  }

  static async getPacket(id: string): Promise<Packet> {
    try {
      const response = await communicationApi.getPacket(id);
      return response.data.data as Packet;
    } catch (error) {
      throw CommunicationService.extractError(error, `Failed to retrieve packet inspection [${id}].`);
    }
  }

  static async getLiveFeed(): Promise<LiveTrafficFeed> {
    try {
      const response = await communicationApi.getLiveFeed();
      return response.data as LiveTrafficFeed;
    } catch (error) {
      throw CommunicationService.extractError(error, 'Failed to retrieve real-time topology and traffic stream.');
    }
  }

  static async getStatistics(): Promise<CommunicationStatistics> {
    try {
      const response = await communicationApi.getStatistics();
      return response.data as CommunicationStatistics;
    } catch (error) {
      throw CommunicationService.extractError(error, 'Failed to retrieve Communication Engine KPI analytics.');
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
