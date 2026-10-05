/**
 * TrustChain-5G Module 1 Network Node Service Layer.
 * Abstracts API calls into clean asynchronous domain functions with robust error transformation.
 */

import { simulationNodeApi } from '@/api/nodeApi';
import { SimulationNode, NodeCreateInput, NodeUpdateInput, NodeStatistics, SimulationNodeStatus } from '@/types/node';
import { AxiosError } from 'axios';

export class NodeService {
  static async getStatistics(): Promise<NodeStatistics> {
    try {
      const response = await simulationNodeApi.getStatistics();
      return response.data.data as NodeStatistics;
    } catch (error) {
      throw NodeService.extractError(error, 'Failed to fetch network telemetry statistics.');
    }
  }

  static async listNodes(params?: Record<string, unknown>): Promise<{ data: SimulationNode[]; totalCount: number }> {
    try {
      const response = await simulationNodeApi.listNodes(params);
      return {
        data: response.data.data as SimulationNode[],
        totalCount: response.data.total_count || 0,
      };
    } catch (error) {
      throw NodeService.extractError(error, 'Failed to retrieve simulation nodes registry.');
    }
  }

  static async getNode(id: string): Promise<SimulationNode> {
    try {
      const response = await simulationNodeApi.getNode(id);
      return response.data.data as SimulationNode;
    } catch (error) {
      throw NodeService.extractError(error, `Failed to retrieve node ID [${id}].`);
    }
  }

  static async createNode(data: NodeCreateInput): Promise<SimulationNode> {
    try {
      const response = await simulationNodeApi.createNode(data);
      return response.data.data as SimulationNode;
    } catch (error) {
      throw NodeService.extractError(error, 'Failed to register new simulation node.');
    }
  }

  static async updateNode(id: string, data: NodeUpdateInput): Promise<SimulationNode> {
    try {
      const response = await simulationNodeApi.updateNode(id, data);
      return response.data.data as SimulationNode;
    } catch (error) {
      throw NodeService.extractError(error, `Failed to update node ID [${id}].`);
    }
  }

  static async updateNodeStatus(id: string, status: SimulationNodeStatus): Promise<SimulationNode> {
    try {
      const response = await simulationNodeApi.updateStatus(id, status);
      return response.data.data as SimulationNode;
    } catch (error) {
      throw NodeService.extractError(error, `Failed to patch status on node ID [${id}].`);
    }
  }

  static async deleteNode(id: string): Promise<string> {
    try {
      await simulationNodeApi.deleteNode(id);
      return id;
    } catch (error) {
      throw NodeService.extractError(error, `Failed to delete node ID [${id}].`);
    }
  }

  private static extractError(error: unknown, fallbackMessage: string): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message;
      if (detail && typeof detail === 'string') {
        return new Error(detail);
      }
      if (Array.isArray(detail)) {
        // FastAPI Pydantic validation error parsing
        const msg = detail.map((err: { msg?: string; loc?: string[] }) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        return new Error(msg || fallbackMessage);
      }
    }
    return error instanceof Error ? error : new Error(fallbackMessage);
  }
}
