import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Activity, Search } from 'lucide-react';
import { TrustVisualizations } from '@/components/trust/TrustVisualizations';
import { TrustConfigurationPanel } from '@/components/trust/TrustConfigurationPanel';
import { TrustDetailsPanel } from '@/components/trust/TrustDetailsPanel';
import { trustApi } from '@/api/endpoints';
import { useQuery } from '@tanstack/react-query';
import { useNodes } from '@/hooks/useNodeHooks';
import { Card } from '@/components/common/Card';

export const TrustEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'config'>('overview');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: nodesResult } = useNodes();
  const nodes = nodesResult?.data || [];

  // Fetch overall network statistics
  const { data: statsRes } = useQuery({
    queryKey: ['trustStatistics'],
    queryFn: () => trustApi.getStatistics().then(res => res.data),
    refetchInterval: 10000,
  });
  
  const stats = statsRes?.data;

  // Fetch all profiles
  const { data: profilesRes, isLoading: profilesLoading } = useQuery({
    queryKey: ['trustProfiles'],
    queryFn: () => trustApi.getProfiles().then(res => res.data),
    refetchInterval: 5000,
  });

  const profiles = profilesRes?.data || [];

  // Default select first node
  useEffect(() => {
    if (profiles.length > 0 && !selectedNodeId) {
      setSelectedNodeId(profiles[0].nodeId);
    }
  }, [profiles, selectedNodeId]);

  // Fetch individual stats for selected node
  const { data: metricsRes } = useQuery({
    queryKey: ['trustBehavior', selectedNodeId],
    queryFn: () => trustApi.getBehavior(selectedNodeId).then(res => res.data),
    enabled: !!selectedNodeId,
    refetchInterval: 5000,
  });
  
  const { data: historyRes } = useQuery({
    queryKey: ['trustHistory', selectedNodeId],
    queryFn: () => trustApi.getHistory(selectedNodeId).then(res => res.data),
    enabled: !!selectedNodeId,
    refetchInterval: 5000,
  });

  const { data: complianceRes } = useQuery({
    queryKey: ['trustCompliance', selectedNodeId],
    queryFn: () => trustApi.getCompliance(selectedNodeId).then(res => res.data),
    enabled: !!selectedNodeId,
    refetchInterval: 10000,
  });

  const selectedProfile = profiles.find((p: any) => p.nodeId === selectedNodeId);
  const metrics = metricsRes?.data;
  const history = historyRes?.data || [];
  const compliance = complianceRes?.data;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Adaptive Trust Engine" 
        subtitle="Real-time evaluation of behavioral reliability, interaction history, and security compliance."
      />

      <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select 
            value={selectedNodeId} 
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all text-slate-200"
          >
            {profilesLoading && <option>Loading network nodes...</option>}
            {!profilesLoading && profiles.length === 0 && <option>No profiles evaluated yet</option>}
            {profiles.map((p: any) => (
              <option key={p.trustProfileId} value={p.nodeId}>{p.nodeId} (Level: {p.trustLevel})</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 border-l border-slate-700 pl-4">
          <Activity className="w-4 h-4 text-emerald-400" />
          Live Evaluator Engine Active.
        </div>
      </div>

      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'config' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
        >
          Configuration
        </button>
      </div>

      {activeTab === 'config' && (
        <TrustConfigurationPanel />
      )}

      {activeTab === 'overview' && (
      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Avg Network Trust</div>
              <div className="text-3xl font-mono text-emerald-400 mt-2">{(stats.averageTrustScore * 100).toFixed(1)}<span className="text-sm text-slate-500 ml-1">%</span></div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Trusted Nodes</div>
              <div className="text-3xl font-mono text-emerald-400 mt-2">{stats.trustedNodes}</div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Suspicious / Warning</div>
              <div className="text-3xl font-mono text-amber-400 mt-2">{stats.suspiciousNodes}</div>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Malicious / Untrusted</div>
              <div className="text-3xl font-mono text-rose-400 mt-2">{stats.maliciousNodes}</div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evaluation Timelines & Visuals */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <TrustVisualizations profiles={profiles} history={history} />

          {/* Historical Ledger Table */}
          <Card title="Recent Evaluation History Ledger" className="border-slate-800 bg-slate-900/50 backdrop-blur-md p-0 overflow-hidden">
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/40 text-slate-400 font-mono">
                    <tr>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                      <th className="px-4 py-3 font-medium">Trust Level</th>
                      <th className="px-4 py-3 font-medium">Behavior</th>
                      <th className="px-4 py-3 font-medium">History</th>
                      <th className="px-4 py-3 font-medium">Compliance</th>
                      <th className="px-4 py-3 font-medium">Trigger Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono">
                    {history.slice(0, 5).map((h: any) => (
                      <tr key={h.evaluationId} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-2.5 text-slate-300">
                          {new Date(h.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={h.trustLevel === 'TRUSTED' ? 'text-emerald-400 font-bold' : h.trustLevel === 'SUSPICIOUS' ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                            {h.trustLevel}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">{(h.behaviorScore * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-slate-300">{(h.historicalInteractionScore * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-slate-300">{(h.securityComplianceScore * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-slate-500">{h.reason}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                          Awaiting first background evaluation cycle...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </Card>
        </div>
        </div>

        {/* Global Network Node Ledger */}
        <Card title="Global Network Trust Ledger" className="border-slate-800 bg-slate-900/50 backdrop-blur-md p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/40">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by Node ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-200"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 text-slate-400 font-mono">
                <tr>
                  <th className="px-4 py-3 font-medium">Node ID</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Trust Level</th>
                  <th className="px-4 py-3 font-medium">Delta</th>
                  <th className="px-4 py-3 font-medium">B / H / C Scores</th>
                  <th className="px-4 py-3 font-medium">Last Evaluated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {profiles
                  .filter((p: any) => p.nodeId.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((p: any) => (
                  <tr key={p.trustProfileId} className="hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => { setSelectedNodeId(p.nodeId); setIsPanelOpen(true); }}>
                    <td className="px-4 py-2.5 text-slate-300 font-bold">{p.nodeId}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-200">
                      {p.currentTrustScore !== null && p.currentTrustScore !== undefined ? `${(p.currentTrustScore * 100).toFixed(1)}%` : '---'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={p.trustLevel === 'TRUSTED' ? 'text-emerald-400 font-bold' : p.trustLevel === 'SUSPICIOUS' ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                        {p.trustLevel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {p.trustDelta !== undefined && (
                        <span className={p.trustDelta > 0 ? "text-emerald-400" : p.trustDelta < 0 ? "text-rose-400" : "text-slate-500"}>
                          {p.trustDelta > 0 ? '▲' : p.trustDelta < 0 ? '▼' : '▬'} {(Math.abs(p.trustDelta) * 100).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {(p.behaviorScore * 100).toFixed(0)} / {(p.historicalInteractionScore * 100).toFixed(0)} / {(p.securityComplianceScore * 100).toFixed(0)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {p.lastEvaluation ? new Date(p.lastEvaluation).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
      )}

      {isPanelOpen && selectedNodeId && (
        <TrustDetailsPanel
          node={nodes.find((n: any) => n.nodeName === selectedNodeId) || { id: selectedNodeId, nodeName: selectedNodeId, nodeType: 'Unknown' } as any}
          trustProfile={selectedProfile}
          trustMetrics={metrics}
          compliance={compliance}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
};
