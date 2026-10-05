import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { federatedApi } from '../../api/federatedApi';
import { mlApi } from '../../api/mlApi';
import { 
  Server, Users, Activity, Play, Square, Shield,
  Database, RefreshCw, BarChart2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const FederatedDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({
    totalClients: 5,
    participationRate: 0.8,
    minimumClients: 3,
    trainingRounds: 5,
    localEpochs: 1,
    batchSize: 32,
    learningRate: 0.01,
    partitionStrategy: 'NON_IID',
    datasetId: '',
    modelName: 'FL-Model-DDoS'
  });

  const { data: statusData } = useQuery({
    queryKey: ['federatedStatus'],
    queryFn: federatedApi.getStatus,
    refetchInterval: 3000
  });

  const { data: clientsData } = useQuery({
    queryKey: ['federatedClients'],
    queryFn: federatedApi.getClients,
    refetchInterval: 5000
  });

  const { data: roundsData } = useQuery({
    queryKey: ['federatedRounds', statusData?.jobId],
    queryFn: () => federatedApi.getRounds(statusData?.jobId),
    enabled: !!statusData?.jobId,
    refetchInterval: 5000
  });

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => mlApi.getDatasets().then((res: any) => res.data)
  });

  const startMutation = useMutation({
    mutationFn: federatedApi.startTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federatedStatus'] });
    }
  });

  const stopMutation = useMutation({
    mutationFn: federatedApi.stopTraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federatedStatus'] });
    }
  });

  const handleStart = () => {
    if (!config.datasetId) {
      alert('Please select a base dataset first.');
      return;
    }
    startMutation.mutate(config);
  };

  const status = statusData?.status || 'IDLE';
  const isRunning = status === 'STARTING' || status === 'IN_PROGRESS' || status === 'RUNNING';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Federated Learning Engine (FedAvg)
          </h2>
          <p className="text-gray-400 text-sm mt-1">Distributed Privacy-Preserving Intrusion Detection</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-slate-300 font-medium">{status}</span>
          </div>
        </div>
      </div>

      {/* Privacy Indicator */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-indigo-900/50 flex items-start gap-4">
        <Shield className="w-8 h-8 text-indigo-400 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-indigo-300 font-semibold mb-1">Privacy Guarantee Architecture</h3>
          <p className="text-sm text-slate-400 mb-2">
            Federated Learning prevents raw local training data from being sent to the aggregation server. 
            This implementation uses Federated Averaging (FedAvg) on SGDClassifier parameters.
          </p>
          <div className="flex gap-6 text-sm">
            <span className="flex items-center gap-2"><span className="text-red-400 font-bold">✗</span> Raw Data Shared: NO</span>
            <span className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Model Parameters Shared: YES</span>
            <span className="flex items-center gap-2"><span className="text-green-400 font-bold">✓</span> Training Metadata Shared: YES</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col h-full">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            Federation Control
          </h3>
          
          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Base Dataset</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                value={config.datasetId}
                onChange={e => setConfig({...config, datasetId: e.target.value})}
                disabled={isRunning}
              >
                <option value="">-- Select Processed Dataset --</option>
                {datasetsData?.data?.map((d: any) => (
                  <option key={d.datasetId} value={d.datasetId}>{d.name} ({d.datasetId.substring(0, 8)})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Total Clients</label>
                <input 
                  type="number" min="2" max="100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  value={config.totalClients}
                  onChange={e => setConfig({...config, totalClients: parseInt(e.target.value)})}
                  disabled={isRunning}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Total Rounds</label>
                <input 
                  type="number" min="1" max="100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  value={config.trainingRounds}
                  onChange={e => setConfig({...config, trainingRounds: parseInt(e.target.value)})}
                  disabled={isRunning}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Partition Strategy</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                value={config.partitionStrategy}
                onChange={e => setConfig({...config, partitionStrategy: e.target.value})}
                disabled={isRunning}
              >
                <option value="IID">IID (Uniform Random)</option>
                <option value="NON_IID">NON-IID (Label Skew)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700 flex gap-3">
            {!isRunning ? (
              <button 
                onClick={handleStart}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4" /> Start Federation
              </button>
            ) : (
              <button 
                onClick={() => stopMutation.mutate()}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col justify-center items-center text-center">
            <RefreshCw className={`w-8 h-8 text-blue-400 mb-2 ${isRunning ? 'animate-spin' : ''}`} />
            <h4 className="text-slate-400 text-sm font-medium">Current Round</h4>
            <div className="text-3xl font-bold text-white mt-1">
              {statusData?.currentRound || 0} <span className="text-lg text-slate-500">/ {statusData?.totalRounds || config.trainingRounds}</span>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col justify-center items-center text-center">
            <Users className="w-8 h-8 text-indigo-400 mb-2" />
            <h4 className="text-slate-400 text-sm font-medium">Active Clients</h4>
            <div className="text-3xl font-bold text-white mt-1">
              {statusData?.activeClients || 0}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col justify-center items-center text-center">
            <Activity className="w-8 h-8 text-green-400 mb-2" />
            <h4 className="text-slate-400 text-sm font-medium">Global Accuracy</h4>
            <div className="text-3xl font-bold text-white mt-1">
              {statusData?.latestMetrics?.accuracy ? (statusData.latestMetrics.accuracy * 100).toFixed(2) + '%' : '--'}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col justify-center items-center text-center">
            <BarChart2 className="w-8 h-8 text-purple-400 mb-2" />
            <h4 className="text-slate-400 text-sm font-medium">Global F1 Score</h4>
            <div className="text-3xl font-bold text-white mt-1">
              {statusData?.latestMetrics?.macroF1 ? (statusData.latestMetrics.macroF1 * 100).toFixed(2) + '%' : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {roundsData?.data && roundsData.data.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Global Model Performance Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roundsData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="roundNumber" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                <Legend />
                <Line type="monotone" dataKey="globalMetrics.accuracy" name="Accuracy" stroke="#4ade80" strokeWidth={2} />
                <Line type="monotone" dataKey="globalMetrics.macroF1" name="F1 Score" stroke="#c084fc" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Clients List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          Simulated Edge Clients
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-sm border-b border-slate-700">
                <th className="pb-3 font-medium">Client ID</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Samples</th>
                <th className="pb-3 font-medium">Dataset Partition</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {clientsData?.data?.length > 0 ? (
                clientsData.data.map((client: any) => (
                  <tr key={client.clientId} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="py-3 text-slate-300 font-medium">{client.clientName || client.clientId}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{client.sampleCount}</td>
                    <td className="py-3 text-slate-400 font-mono text-xs">{client.localDatasetId.split('/').pop()?.split('\\').pop()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No clients registered. Start federation to create simulated partitions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
