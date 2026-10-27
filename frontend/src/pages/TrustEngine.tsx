import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Play, 
  Pause, 
  RefreshCw, 
  Zap, 
  Radio, 
  Eye
} from 'lucide-react';
import { TrustVisualizations } from '@/components/trust/TrustVisualizations';
import { TrustConfigurationPanel } from '@/components/trust/TrustConfigurationPanel';
import { TrustDetailsPanel } from '@/components/trust/TrustDetailsPanel';
import { trustApi } from '@/api/endpoints';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNodes } from '@/hooks/useNodeHooks';
import { Card } from '@/components/common/Card';

export const TrustEngine: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'config'>('overview');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'TRUSTED' | 'SUSPICIOUS' | 'MALICIOUS'>('ALL');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);

  const { data: nodesResult } = useNodes();
  const nodes = nodesResult?.data || [];

  const getNodeName = (id: string) => {
    const match = nodes.find((n: any) => n.id === id || n.nodeName === id);
    return match ? match.nodeName : id;
  };

  const getNodeCategory = (id: string) => {
    const match = nodes.find((n: any) => n.id === id || n.nodeName === id);
    return match ? `${match.deviceCategory || match.nodeType || '5G Node'}` : '5G Telemetry Node';
  };

  // Fetch overall network statistics with 3s live polling
  const { data: statsRes } = useQuery({
    queryKey: ['trustStatistics'],
    queryFn: () => trustApi.getStatistics().then(res => res.data),
    refetchInterval: isStreaming ? 3000 : false,
  });
  
  const stats = statsRes?.data;

  // Fetch all profiles with 3s live polling
  const { data: profilesRes, isLoading: profilesLoading } = useQuery({
    queryKey: ['trustProfiles'],
    queryFn: () => trustApi.getProfiles().then(res => res.data),
    refetchInterval: isStreaming ? 3000 : false,
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
    refetchInterval: isStreaming ? 3000 : false,
  });
  
  const { data: historyRes } = useQuery({
    queryKey: ['trustHistory', selectedNodeId],
    queryFn: () => trustApi.getHistory(selectedNodeId).then(res => res.data),
    enabled: !!selectedNodeId,
    refetchInterval: isStreaming ? 3000 : false,
  });

  const { data: complianceRes } = useQuery({
    queryKey: ['trustCompliance', selectedNodeId],
    queryFn: () => trustApi.getCompliance(selectedNodeId).then(res => res.data),
    enabled: !!selectedNodeId,
    refetchInterval: isStreaming ? 5000 : false,
  });

  const selectedProfile = profiles.find((p: any) => p.nodeId === selectedNodeId);
  const metrics = metricsRes?.data;
  const history = historyRes?.data || [];
  const compliance = complianceRes?.data;

  const handleEvaluateAll = async () => {
    try {
      setIsEvaluating(true);
      setEvaluationFeedback("Triggering full network evaluation cycle...");
      await trustApi.evaluateAll();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trustStatistics'] }),
        queryClient.invalidateQueries({ queryKey: ['trustProfiles'] }),
        queryClient.invalidateQueries({ queryKey: ['trustHistory'] }),
        queryClient.invalidateQueries({ queryKey: ['trustBehavior'] })
      ]);
      setEvaluationFeedback("Network-wide trust evaluation recalculated!");
      setTimeout(() => setEvaluationFeedback(null), 3000);
    } catch (err) {
      setEvaluationFeedback("Evaluation triggered. Updating telemetry...");
      setTimeout(() => setEvaluationFeedback(null), 2500);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleEvaluateSingle = async (nodeId: string) => {
    try {
      setEvaluationFeedback(`Evaluating ${getNodeName(nodeId)}...`);
      await trustApi.evaluateNode(nodeId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trustProfiles'] }),
        queryClient.invalidateQueries({ queryKey: ['trustHistory', nodeId] }),
        queryClient.invalidateQueries({ queryKey: ['trustBehavior', nodeId] }),
        queryClient.invalidateQueries({ queryKey: ['trustStatistics'] })
      ]);
      setEvaluationFeedback(`${getNodeName(nodeId)} evaluated successfully!`);
      setTimeout(() => setEvaluationFeedback(null), 3000);
    } catch (err) {
      setTimeout(() => setEvaluationFeedback(null), 2000);
    }
  };

  // Filter profiles based on search and selected tier pill
  const filteredProfiles = profiles.filter((p: any) => {
    const name = getNodeName(p.nodeId).toLowerCase();
    const id = p.nodeId.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || id.includes(query);
    if (!matchesSearch) return false;

    if (tierFilter === 'TRUSTED') return p.trustLevel === 'TRUSTED';
    if (tierFilter === 'SUSPICIOUS') return p.trustLevel === 'SUSPICIOUS' || p.trustLevel === 'QUESTIONABLE';
    if (tierFilter === 'MALICIOUS') return p.trustLevel === 'MALICIOUS';
    return true;
  });

  const trustedCount = profiles.filter((p: any) => p.trustLevel === 'TRUSTED').length;
  const suspiciousCount = profiles.filter((p: any) => p.trustLevel === 'SUSPICIOUS' || p.trustLevel === 'QUESTIONABLE').length;
  const maliciousCount = profiles.filter((p: any) => p.trustLevel === 'MALICIOUS').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Adaptive Trust Engine" 
        subtitle="Dynamic continuous evaluation of behavioral reliability, interaction history, and zero-trust policy conformance."
      />

      {/* Control & Live Streaming Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          {/* Node Selector with Human-Friendly Names */}
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select 
              value={selectedNodeId} 
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 text-xs font-mono rounded-lg pl-9 pr-4 py-2 text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner"
            >
              {profilesLoading && <option>Loading network nodes...</option>}
              {!profilesLoading && profiles.length === 0 && <option>No profiles evaluated yet</option>}
              {profiles.map((p: any) => {
                const displayName = getNodeName(p.nodeId);
                const scorePercent = p.currentTrustScore !== null && p.currentTrustScore !== undefined 
                  ? `${(p.currentTrustScore * 100).toFixed(0)}%` 
                  : '---';
                return (
                  <option key={p.trustProfileId || p.nodeId} value={p.nodeId}>
                    {displayName} [{scorePercent}] ({p.trustLevel})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => handleEvaluateSingle(selectedNodeId)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all shadow-sm"
            title="Force immediate evaluation cycle for this specific node"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Evaluate Node</span>
          </button>
        </div>

        {/* Global Evaluation & Streaming Controls */}
        <div className="flex items-center gap-3">
          {evaluationFeedback && (
            <span className="text-xs font-mono text-emerald-400 animate-pulse bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              {evaluationFeedback}
            </span>
          )}

          {/* Live Streaming Indicator */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isStreaming 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
            }`}
          >
            {isStreaming ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>STREAMING (3s)</span>
                <Pause className="w-3 h-3 ml-1" />
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                <span>PAUSED</span>
                <Play className="w-3 h-3 ml-1 text-slate-300" />
              </>
            )}
          </button>

          {/* Evaluate All Nodes Action */}
          <button
            onClick={handleEvaluateAll}
            disabled={isEvaluating}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>Evaluate All</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
        >
          <Radio className="w-4 h-4" />
          <span>Real-time Overview & Ledger</span>
        </button>
        <button 
          onClick={() => setActiveTab('config')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'config' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'}`}
        >
          Configuration Weights & Thresholds
        </button>
      </div>

      {activeTab === 'config' && (
        <TrustConfigurationPanel />
      )}

      {activeTab === 'overview' && (
      <div className="space-y-6">
        {/* Dynamic Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/60 border-slate-800 p-4 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Network Trust</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-mono border border-emerald-500/20">
                  Adaptive
                </span>
              </div>
              <div className="text-3xl font-mono text-emerald-400 mt-2 font-bold flex items-baseline">
                {(stats.averageTrustScore * 100).toFixed(1)}
                <span className="text-sm text-slate-500 ml-1">%</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                <span>{stats.totalNodesEvaluated} Nodes Evaluated</span>
              </div>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 p-4 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Trusted Nodes</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-mono text-emerald-400 mt-2 font-bold">
                {stats.trustedNodes}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                <span className="text-emerald-400/80 font-semibold">{((stats.trustedNodes / (stats.totalNodesEvaluated || 1)) * 100).toFixed(0)}%</span> of total network
              </div>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 p-4 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Suspicious / Warning</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-mono text-amber-400 mt-2 font-bold">
                {stats.suspiciousNodes}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                <span className="text-amber-400/80 font-semibold">{((stats.suspiciousNodes / (stats.totalNodesEvaluated || 1)) * 100).toFixed(0)}%</span> anomaly flagged
              </div>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800 p-4 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Malicious / Untrusted</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-mono text-rose-400 mt-2 font-bold">
                {stats.maliciousNodes}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                <span className="text-rose-400/80 font-semibold">{((stats.maliciousNodes / (stats.totalNodesEvaluated || 1)) * 100).toFixed(0)}%</span> quarantine isolated
              </div>
            </Card>
          </div>
        )}

        {/* Visualizations: Dynamic Timeline Chart & Network Distribution */}
        <TrustVisualizations 
          profiles={profiles} 
          history={history} 
          selectedNodeName={getNodeName(selectedNodeId)} 
        />

        {/* Historical Ledger Table */}
        <Card 
          title={`Recent Evaluation Ledger (${getNodeName(selectedNodeId)})`} 
          subtitle="Chronological audit records showing dimension scores, deltas, and triggering reasons"
          className="border-slate-800 bg-slate-900/60 backdrop-blur-md p-0 overflow-hidden shadow-md"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Trust Score</th>
                  <th className="px-4 py-3 font-medium">Level</th>
                  <th className="px-4 py-3 font-medium">Delta</th>
                  <th className="px-4 py-3 font-medium">Behavior (B)</th>
                  <th className="px-4 py-3 font-medium">History (H)</th>
                  <th className="px-4 py-3 font-medium">Compliance (C)</th>
                  <th className="px-4 py-3 font-medium">Diagnostic Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.slice(0, 8).map((h: any, idx: number) => {
                  const score = h.trustScore !== null && h.trustScore !== undefined ? (h.trustScore * 100).toFixed(1) : '---';
                  const isTrusted = h.trustLevel === 'TRUSTED';
                  const isSuspicious = h.trustLevel === 'SUSPICIOUS' || h.trustLevel === 'QUESTIONABLE';
                  const delta = h.trustDelta || 0;
                  return (
                    <tr key={h.evaluationId || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2.5 text-slate-400">
                        {new Date(h.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-100">
                        {score}%
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isTrusted 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : isSuspicious 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {isTrusted && <ShieldCheck className="w-2.5 h-2.5" />}
                          {isSuspicious && <AlertTriangle className="w-2.5 h-2.5" />}
                          {!isTrusted && !isSuspicious && <ShieldAlert className="w-2.5 h-2.5" />}
                          {h.trustLevel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`font-semibold flex items-center gap-1 ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-500"}`}>
                          {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '▬ '}
                          {(Math.abs(delta) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">{(h.behaviorScore * 100).toFixed(0)}%</td>
                      <td className="px-4 py-2.5 text-slate-300">{(h.historicalInteractionScore * 100).toFixed(0)}%</td>
                      <td className="px-4 py-2.5 text-slate-300">{(h.securityComplianceScore * 100).toFixed(0)}%</td>
                      <td className="px-4 py-2.5 text-slate-400 italic max-w-xs truncate" title={h.reason}>
                        {h.reason || 'Normal cyclic telemetry validation'}
                      </td>
                    </tr>
                  );
                })}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                      Awaiting evaluation telemetry cycle for selected node...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Global Network Node Ledger with Filter Pills */}
        <Card 
          title="Global Network Trust Ledger" 
          subtitle="Real-time multi-dimensional scoring of all simulated 5G endpoints"
          className="border-slate-800 bg-slate-900/60 backdrop-blur-md p-0 overflow-hidden shadow-md"
        >
          {/* Filter Bar & Search */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by Node Name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs rounded-lg pl-9 pr-4 py-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-200 font-mono shadow-inner"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTierFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  tierFilter === 'ALL'
                    ? 'bg-slate-800 border-slate-600 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({profiles.length})
              </button>
              <button
                onClick={() => setTierFilter('TRUSTED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  tierFilter === 'TRUSTED'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold'
                    : 'bg-slate-900 border-slate-800 text-emerald-500/70 hover:text-emerald-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trusted ({trustedCount})</span>
              </button>
              <button
                onClick={() => setTierFilter('SUSPICIOUS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  tierFilter === 'SUSPICIOUS'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold'
                    : 'bg-slate-900 border-slate-800 text-amber-500/70 hover:text-amber-400'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspicious ({suspiciousCount})</span>
              </button>
              <button
                onClick={() => setTierFilter('MALICIOUS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  tierFilter === 'MALICIOUS'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 font-bold'
                    : 'bg-slate-900 border-slate-800 text-rose-500/70 hover:text-rose-400'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Malicious ({maliciousCount})</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Node Identity</th>
                  <th className="px-4 py-3 font-medium">Calculated Trust</th>
                  <th className="px-4 py-3 font-medium">Trust Level</th>
                  <th className="px-4 py-3 font-medium">Shift Delta</th>
                  <th className="px-4 py-3 font-medium">B / H / C Profile</th>
                  <th className="px-4 py-3 font-medium">Last Evaluated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {filteredProfiles.map((p: any) => {
                  const displayName = getNodeName(p.nodeId);
                  const category = getNodeCategory(p.nodeId);
                  const isTrusted = p.trustLevel === 'TRUSTED';
                  const isSuspicious = p.trustLevel === 'SUSPICIOUS' || p.trustLevel === 'QUESTIONABLE';
                  const isMalicious = p.trustLevel === 'MALICIOUS';
                  const score = p.currentTrustScore !== null && p.currentTrustScore !== undefined ? p.currentTrustScore : 0.0;
                  const delta = p.trustDelta || 0;
                  const isSelected = selectedNodeId === p.nodeId;

                  return (
                    <tr 
                      key={p.trustProfileId || p.nodeId} 
                      className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-800/40 border-l-2 border-emerald-500' : ''
                      }`}
                      onClick={() => { setSelectedNodeId(p.nodeId); }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-200">{displayName}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{category}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isTrusted ? 'bg-emerald-500' : isSuspicious ? 'bg-amber-500' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(0, score * 100))}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-100">{(score * 100).toFixed(1)}%</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          isTrusted 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : isSuspicious 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {isTrusted && <ShieldCheck className="w-3 h-3" />}
                          {isSuspicious && <AlertTriangle className="w-3 h-3" />}
                          {isMalicious && <ShieldAlert className="w-3 h-3" />}
                          {p.trustLevel}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`font-semibold flex items-center gap-1 ${
                          delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-500"
                        }`}>
                          {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '▬ '}
                          {(Math.abs(delta) * 100).toFixed(1)}%
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        <span className="text-cyan-400">{(p.behaviorScore * 100).toFixed(0)}</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-blue-400">{(p.historicalInteractionScore * 100).toFixed(0)}</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-purple-400">{(p.securityComplianceScore * 100).toFixed(0)}</span>
                      </td>

                      <td className="px-4 py-3 text-slate-400">
                        {p.lastEvaluation ? new Date(p.lastEvaluation).toLocaleTimeString() : 'N/A'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEvaluateSingle(p.nodeId)}
                            title="Evaluate single node immediately"
                            className="p-1.5 hover:bg-slate-700/60 rounded text-slate-400 hover:text-amber-400 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedNodeId(p.nodeId); setIsPanelOpen(true); }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-sans border border-slate-700 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {/* Details Slide-Over Panel */}
      {isPanelOpen && selectedNodeId && (
        <TrustDetailsPanel
          node={nodes.find((n: any) => n.nodeName === selectedNodeId || n.id === selectedNodeId) || { id: selectedNodeId, nodeName: getNodeName(selectedNodeId), nodeType: '5G Node' } as any}
          trustProfile={selectedProfile}
          trustMetrics={metrics}
          compliance={compliance}
          onClose={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  );
};
