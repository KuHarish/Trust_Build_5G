import React, { useState } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { useLiveDashboardStream, useNodes, useCommunicationSessions } from '@/hooks';
import { SimulationNode } from '@/types/node';
import { CommunicationSession } from '@/types/communication';
import {
  OverviewKpiSection,
  NetworkHealthIndicator,
  LiveEventStreamPanel,
  FeatureExtractionPanel,
  SimulationControlConsole,
  DashboardCharts,
} from '@/components/dashboard';
import { NetworkTopologyView } from '@/components/network/NetworkTopologyView';
import { dashboardService } from '@/services/dashboardService';
import { Button } from '@/components/common';
import { RefreshCw, Download, Radio, Activity, Share2, Sliders, Cpu, Filter } from 'lucide-react';
import { useNotification } from '@/contexts';

export const Dashboard: React.FC = () => {
  const { liveData, isLoading, connectionType, refetch } = useLiveDashboardStream();
  const { data: nodesData } = useNodes({ limit: 100 });
  const { data: sessionsData } = useCommunicationSessions({ limit: 100, status: 'ACTIVE' });
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState<'overview' | 'topology' | 'streams' | 'controls'>('overview');
  const [filterNodeType, setFilterNodeType] = useState<string>('ALL');
  const [filterProtocol, setFilterProtocol] = useState<string>('ALL');

  const handleRefresh = () => {
    refetch();
    addNotification(
      'Telemetry Synchronized',
      'Refreshed all live KPI tensors and radio operational states.',
      'info',
      3500
    );
  };

  const handleExport = (resource: 'sessions' | 'packets' | 'features', format: 'csv' | 'json') => {
    dashboardService.triggerExportDownload(resource, format);
    addNotification('Export Download Started', `Generating ${resource.toUpperCase()} log report (${format.toUpperCase()})...`, 'success');
  };

  // Filter topology nodes based on UI selections
  const allNodes: SimulationNode[] = nodesData?.data || [];
  const filteredNodes = allNodes.filter((n: SimulationNode) => {
    if (filterNodeType !== 'ALL' && n.nodeType !== filterNodeType) return false;
    return true;
  });

  const allSessions: CommunicationSession[] = sessionsData?.data || [];
  const filteredSessions = allSessions.filter((s: CommunicationSession) => {
    if (filterProtocol !== 'ALL' && s.protocol !== filterProtocol) return false;
    return true;
  });

  if (isLoading || !liveData || !liveData.success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 text-slate-400 font-mono animate-in fade-in duration-300">
        <Radio className="w-12 h-12 text-primary animate-ping" />
        <p className="text-sm font-bold text-white tracking-widest uppercase">Initializing Centralized Command Stream...</p>
        <p className="text-xs text-slate-500">Connecting to asynchronous WebSocket and Server-Sent Events daemon feeds</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Master Command Header with Live Connection Badge */}
      <PageHeader
        title="5G Cybersecurity Command & Control (Mod 4 Integration)"
        subtitle="Live multi-slice radio telemetry monitoring, automated traffic generators, and mathematical feature extraction."
        badgeText={`STREAMING: ${connectionType.toUpperCase()}`}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative group">
              <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/20">
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT DATA ▾</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-50 space-y-1 text-xs font-mono">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase">Communication Sessions</div>
                <button onClick={() => handleExport('sessions', 'csv')} className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200">Sessions (CSV)</button>
                <button onClick={() => handleExport('sessions', 'json')} className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200">Sessions (JSON)</button>
                <div className="border-t border-slate-800 my-1" />
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase">Packet & Feature Logs</div>
                <button onClick={() => handleExport('packets', 'csv')} className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200">Packets (CSV)</button>
                <button onClick={() => handleExport('features', 'csv')} className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200">Features (CSV)</button>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh} icon={<RefreshCw className="w-4 h-4" />}>
              Sync Stream
            </Button>
          </div>
        }
      />

      {/* Top KPI Summary Ribbon */}
      <OverviewKpiSection overview={liveData.overview} />

      {/* Glassmorphic Command Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md shadow-inner">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wide transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>OVERVIEW & ANALYTICS</span>
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wide transition-all ${
              activeTab === 'topology'
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>ANIMATED TOPOLOGY</span>
          </button>

          <button
            onClick={() => setActiveTab('streams')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wide transition-all ${
              activeTab === 'streams'
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>LIVE EVENT & FEATURE STREAMS</span>
          </button>

          <button
            onClick={() => setActiveTab('controls')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wide transition-all ${
              activeTab === 'controls'
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>SIMULATION CONTROLS</span>
          </button>
        </div>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <NetworkHealthIndicator health={liveData.health} />
          <DashboardCharts />
        </div>
      )}

      {activeTab === 'topology' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Bar for Topology */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">Topology Filter Filters:</span>
              <select
                value={filterNodeType}
                onChange={(e) => setFilterNodeType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
              >
                <option value="ALL">Node Type: ALL</option>
                <option value="Gateway">Gateways</option>
                <option value="IoT Sensor">IoT Sensors</option>
                <option value="Medical Device">Medical Devices</option>
              </select>

              <select
                value={filterProtocol}
                onChange={(e) => setFilterProtocol(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
              >
                <option value="ALL">Protocol: ALL</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="MQTT">MQTT</option>
                <option value="CoAP">CoAP</option>
              </select>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Displaying <span className="text-white font-bold">{filteredNodes.length}</span> nodes &{' '}
              <span className="text-white font-bold">{filteredSessions.length}</span> active circuits
            </div>
          </div>

          <NetworkTopologyView
            nodes={filteredNodes}
            activeSessions={filteredSessions}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>
      )}

      {activeTab === 'streams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <LiveEventStreamPanel events={liveData.recentEvents} />
          <FeatureExtractionPanel features={liveData.recentFeatures} />
        </div>
      )}

      {activeTab === 'controls' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <SimulationControlConsole status={liveData.simulationStatus} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NetworkHealthIndicator health={liveData.health} />
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col justify-center space-y-3 font-mono text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Domain Scoping Notice
              </span>
              <p>
                Sprint 1 completes the integration of <strong>Module 1 (Node Management)</strong>,{' '}
                <strong>Module 2 (Edge Server Feature Extraction)</strong>, and <strong>Module 3 (Communication Engine)</strong>.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500">
                <li>No Machine Learning or Federated Learning algorithms deployed.</li>
                <li>No Trust Evaluation Bayesian formulas or Blockchain ledgers executed.</li>
                <li>No Attack Vectors or Security Policy interventions active.</li>
              </ul>
              <p className="text-slate-500 text-[11px] border-t border-slate-900 pt-2">
                All data displayed represents clean, production-grade integration of simulated 3GPP and IoT telemetry feeds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
