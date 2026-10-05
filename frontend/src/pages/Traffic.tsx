import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/layouts/PageHeader';
import { Activity, ShieldAlert, BarChart2, Database, Filter, Search, ArrowRight, Shield, Globe, RefreshCw } from 'lucide-react';
import { trafficApi } from '@/api/endpoints';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie } from 'recharts';

export const Traffic: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<string>('ALL');
  
  // 1. Fetch Traffic Logs
  const { data: logsRes, isLoading: logsLoading, isError: logsError } = useQuery({
    queryKey: ['traffic-logs', selectedNode !== 'ALL' ? selectedNode : undefined],
    queryFn: () => trafficApi.getLogs(selectedNode !== 'ALL' ? { node_id: selectedNode } : undefined),
    refetchInterval: 10000,
  });

  // 2. Fetch Packets
  useQuery({
    queryKey: ['traffic-packets'],
    queryFn: () => trafficApi.getPackets(),
    refetchInterval: 10000,
  });

  const logs = logsRes?.data?.data || [];

  // Derived metrics (will be 0 / empty currently as API returns [])
  const totalEvents = logs.length;
  const totalVolume = logs.reduce((acc: number, log: any) => acc + (log.volume || 0), 0);
  const anomaliesCount = logs.filter((log: any) => log.detection && log.detection.status === 'ANOMALY').length;
  const attackRelatedCount = logs.filter((log: any) => log.attackType && log.attackType !== 'BENIGN').length;

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500 h-full border border-slate-800/50 rounded-xl bg-slate-900/20">
      <Database className="w-8 h-8 mb-3 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Traffic Management & DPI" 
        subtitle="Centralized network flow monitoring, anomaly detection, and deep packet inspection."
      />

      {/* TRAFFIC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Traffic Events</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Activity className="w-4 h-4 text-blue-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-slate-200">
              {logsLoading ? '-' : totalEvents === 0 ? <span className="text-sm font-mono text-slate-500">No simulation data available</span> : totalEvents.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Monitored netflows</div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Traffic Volume</h3>
            <div className="p-2 bg-indigo-500/10 rounded-lg"><BarChart2 className="w-4 h-4 text-indigo-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-indigo-400">
              {logsLoading ? '-' : totalEvents === 0 ? <span className="text-sm font-mono text-slate-500">No data</span> : `${(totalVolume / 1024 / 1024).toFixed(2)} MB`}
            </div>
            <div className="text-xs text-slate-500 mt-1">Aggregated payload bytes</div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Detected Anomalies</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg"><ShieldAlert className="w-4 h-4 text-amber-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-amber-400">
              {logsLoading ? '-' : totalEvents === 0 ? <span className="text-sm font-mono text-slate-500">No data</span> : anomaliesCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Suspicious behavior flags</div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Attack Related</h3>
            <div className="p-2 bg-rose-500/10 rounded-lg"><Shield className="w-4 h-4 text-rose-400" /></div>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-rose-400">
              {logsLoading ? '-' : totalEvents === 0 ? <span className="text-sm font-mono text-slate-500">No data</span> : attackRelatedCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Correlated security threats</div>
          </div>
        </div>
      </div>

      {/* VISUALIZATIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Traffic Trend over Time */}
        <div className="xl:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 p-5 h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Traffic Trend</h3>
            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Live Timeline</span>
          </div>
          <div className="flex-1 min-h-0">
            {logs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickMargin={10} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : renderEmptyState('No historical traffic data available for trending.')}
          </div>
        </div>

        {/* Protocol Distribution */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 h-[300px] flex flex-col">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Protocol Distribution</h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {logs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[]} // Replace with computed protocol distribution if data becomes available
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {/* {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)} */}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : renderEmptyState('No protocol data available.')}
          </div>
        </div>

      </div>

      {/* TRAFFIC ACTIVITY TABLE */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Traffic Activity
          </h3>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search event ID or IP..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select 
                value={selectedNode}
                onChange={(e) => setSelectedNode(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Nodes</option>
                <option value="GNB-001">GNB-001</option>
                <option value="UPF-001">UPF-001</option>
                <option value="MEC-003">MEC-003</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4 font-medium">Event ID</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Source</th>
                <th className="px-6 py-4 font-medium">Destination</th>
                <th className="px-6 py-4 font-medium">Protocol</th>
                <th className="px-6 py-4 font-medium">Volume</th>
                <th className="px-6 py-4 font-medium">Status/Attack</th>
                <th className="px-6 py-4 font-medium">Correlation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logsError ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-rose-500 bg-rose-500/5">
                    Failed to fetch traffic events from the server.
                  </td>
                </tr>
              ) : logsLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 opacity-50" />
                    Loading traffic stream...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    <Activity className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    No traffic events are currently available for the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.eventId || Math.random()} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{log.eventId || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs text-slate-300 font-mono">{log.timestamp || 'Unknown'}</td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-slate-300">{log.source || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.sourceIP || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-bold text-slate-300">{log.destination || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.destinationIP || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {log.protocol || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300 font-mono">
                      {log.volume !== undefined ? log.volume : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-300">
                        {log.attackType || 'Normal'}
                      </div>
                      {log.securityDecision && (
                        <div className={`text-[10px] uppercase font-bold mt-1 ${log.securityDecision === 'BLOCK' || log.securityDecision === 'QUARANTINE' ? 'text-rose-400' : 'text-blue-400'}`}>
                          {log.securityDecision}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.correlationId ? (
                        <a href={`/attacks?correlation=${log.correlationId}`} className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1">
                          {log.correlationId} <ArrowRight className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};
