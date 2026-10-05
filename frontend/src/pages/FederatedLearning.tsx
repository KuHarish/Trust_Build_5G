import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/layouts/PageHeader';
import { Server, Activity, CheckCircle, RefreshCw, XCircle, Search, Filter, Cpu, Layers, Play } from 'lucide-react';
import { federatedApi } from '@/api/endpoints';
import { FederatedClientPanel, FederatedRoundVisualization, FederatedComparisonVisualization } from '@/components/federated';

export const FederatedLearning: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // 1. Fetch Federated Status (Job Status)
  const { data: statusRes, isLoading: statusLoading } = useQuery({
    queryKey: ['federated-status'],
    queryFn: () => federatedApi.getStatus(),
    refetchInterval: 10000,
  });

  // 2. Fetch Federated Clients
  const { data: clientsRes, isLoading: clientsLoading, isError: clientsError } = useQuery({
    queryKey: ['federated-clients'],
    queryFn: () => federatedApi.getClients(),
    refetchInterval: 10000,
  });

  const flStatus = statusRes?.data; // Returns { success, status, currentRound, activeClients, latestGlobalModel, ... }
  const clients = clientsRes?.data?.data || [];

  const filteredClients = useMemo(() => {
    return clients.filter((c: any) => {
      const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || c.clientId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status.toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const selectedClient = clients.find((c: any) => c.clientId === selectedClientId);

  // Derived metrics
  const activeClients = clients.filter((c: any) => c.status === 'ACTIVE' || c.status === 'TRAINING').length;
  const trainingClients = clients.filter((c: any) => c.trainingStatus === 'TRAINING').length;

  // Helpers
  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE' || status === 'TRAINING') return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">{status}</span>;
    if (status === 'IDLE' || status === 'READY') return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">{status}</span>;
    if (status === 'OFFLINE' || status === 'FAILED') return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-xs rounded-full border border-slate-500/20">{status}</span>;
    return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-xs rounded-full border border-slate-500/20">{status || 'UNKNOWN'}</span>;
  };

  const getJobBadge = (status: string) => {
    if (!status) return null;
    if (status === 'IN_PROGRESS' || status === 'RUNNING' || status === 'STARTING') return <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded border border-indigo-500/30 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> {status}</span>;
    if (status === 'COMPLETED' || status === 'SUCCESS') return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded border border-emerald-500/30 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {status}</span>;
    if (status === 'FAILED' || status === 'STOPPED') return <span className="px-2 py-1 bg-rose-500/20 text-rose-400 text-xs font-bold rounded border border-rose-500/30 flex items-center gap-1"><XCircle className="w-3 h-3"/> {status}</span>;
    return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold rounded border border-slate-500/30">{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Federated Learning Collaborative Engine" 
          subtitle="Decentralized model training across edge clients." 
        />
        <button
          onClick={() => federatedApi.startJob({
            datasetId: "CICIDS2017",
            modelName: "TrustChain_Federated_Model",
            totalClients: 5,
            minimumClients: 3,
            trainingRounds: 4,
            participationRate: 0.8,
            partitionStrategy: "IID",
            randomSeed: 42
          })}
          disabled={flStatus?.status === 'IN_PROGRESS' || flStatus?.status === 'RUNNING'}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono tracking-wide transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          <span>START FL ROUNDS</span>
        </button>
      </div>

      {/* OVERVIEW DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">FL Clients</h3>
            <div className="p-2 bg-slate-800 rounded-lg"><Server className="w-4 h-4 text-slate-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-slate-200">
              {clientsLoading ? <RefreshCw className="w-6 h-6 animate-spin text-slate-500"/> : clients.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total registered clients</div>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Clients</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity className="w-4 h-4 text-emerald-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-emerald-400">
              {clientsLoading ? <RefreshCw className="w-6 h-6 animate-spin text-slate-500"/> : activeClients}
            </div>
            <div className="text-xs text-slate-500 mt-1">{trainingClients} currently training</div>
          </div>
        </div>

        {/* Training State */}
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Training Round</h3>
            <div className="p-2 bg-indigo-500/10 rounded-lg"><RefreshCw className="w-4 h-4 text-indigo-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl font-bold text-indigo-400">
                {statusLoading ? '-' : (flStatus?.currentRound || 0)}
              </span>
              <span className="text-sm text-slate-500">/ {statusLoading ? '-' : (flStatus?.totalRounds || 0)}</span>
            </div>
            <div className="text-xs text-slate-500">
              {statusLoading ? 'Loading status...' : getJobBadge(flStatus?.status || 'IDLE')}
            </div>
          </div>
        </div>

        {/* Global Model */}
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Global Model</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Layers className="w-4 h-4 text-blue-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="text-sm font-mono text-slate-300 truncate font-bold" title={flStatus?.latestGlobalModel || 'N/A'}>
              {statusLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-500"/> : (flStatus?.latestGlobalModel || 'None Active')}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 uppercase">Latest Aggregated Model</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Client List (Left 3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="IDLE">Idle</option>
                <option value="READY">Ready</option>
                <option value="TRAINING">Training</option>
                <option value="ACTIVE">Active</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 font-medium">Client Identity</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Training State</th>
                    <th className="px-6 py-4 font-medium">Samples</th>
                    <th className="px-6 py-4 font-medium">Model Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {clientsError ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-rose-500 bg-rose-500/5">
                        <XCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        Failed to load federated clients from the backend.
                      </td>
                    </tr>
                  ) : clientsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                        Loading federated clients...
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        <Server className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        No FL clients found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client: any) => (
                      <tr 
                        key={client.clientId}
                        onClick={() => setSelectedClientId(client.clientId)}
                        className={`hover:bg-slate-800/30 cursor-pointer transition-colors ${selectedClientId === client.clientId ? 'bg-slate-800/50 border-l-2 border-l-indigo-500' : 'border-l-2 border-l-transparent'}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg">
                              <Cpu className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-200">{client.clientName}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{client.clientId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold ${client.trainingStatus === 'TRAINING' ? 'text-indigo-400' : 'text-slate-400'}`}>
                            {client.trainingStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-300 font-mono">{client.sampleCount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded">
                            v{client.modelVersion}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Client Detail Side Panel (Right 1 col) */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <FederatedClientPanel client={selectedClient} onClose={() => setSelectedClientId(null)} />
          </div>
        </div>
      </div>

      <FederatedRoundVisualization jobId={flStatus?.jobId} />
      <FederatedComparisonVisualization />
    </div>
  );
};
