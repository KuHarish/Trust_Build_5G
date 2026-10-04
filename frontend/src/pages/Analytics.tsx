import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/layouts/PageHeader';
import { 
  BarChart3, Activity, Shield, ShieldAlert, Target, Network, Database
} from 'lucide-react';
import { 
  analyticsApi, attacksApi, trafficApi
} from '@/api/endpoints';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

export const Analytics: React.FC = () => {
  const [timeWindow, setTimeWindow] = useState('24h');

  // Fetch Summary
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary', timeWindow],
    queryFn: () => analyticsApi.getSummary(timeWindow).then(r => r.data),
    refetchInterval: 30000
  });

  // Fetch Attacks
  const { data: attacksRes } = useQuery({
    queryKey: ['analytics-attacks'],
    queryFn: () => attacksApi.list({ limit: 200 }).then(r => r.data),
    refetchInterval: 30000
  });

  // Fetch Traffic
  const { data: trafficRes } = useQuery({
    queryKey: ['analytics-traffic'],
    queryFn: () => trafficApi.getLogs({ limit: 100 }).then(r => r.data),
    refetchInterval: 30000
  });

  // Removed unimplemented trust endpoint call

  // Processing Summary
  const summary = summaryRes?.data || {
    network_health_score: 0,
    total_monitored_nodes: 0,
    total_security_events: 0,
    mitigated_attacks_24h: 0,
    traffic_events_sampled: 0,
    blockchain_sealed_transactions: 0
  };

  // Processing Attacks for Charts
  const attacks = attacksRes?.data || [];
  
  const attackTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    attacks.forEach((a: any) => {
      counts[a.attackType || 'Unknown'] = (counts[a.attackType || 'Unknown'] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [attacks]);

  const severityData = useMemo(() => {
    const counts: Record<string, number> = {};
    attacks.forEach((a: any) => {
      counts[a.severity || 'UNKNOWN'] = (counts[a.severity || 'UNKNOWN'] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [attacks]);

  const decisionData = useMemo(() => {
    const counts: Record<string, number> = {};
    attacks.forEach((a: any) => {
      counts[a.decisionAction || 'UNKNOWN'] = (counts[a.decisionAction || 'UNKNOWN'] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [attacks]);

  // Traffic events over time
  const traffic = trafficRes?.data || [];
  const trafficTimeData = useMemo(() => {
    const counts: Record<string, number> = {};
    traffic.forEach((t: any) => {
      if (t.timestamp) {
        const d = new Date(t.timestamp);
        const timeKey = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        counts[timeKey] = (counts[timeKey] || 0) + 1;
      }
    });
    return Object.keys(counts).sort().map(k => ({ time: k, events: counts[k] })).slice(-20);
  }, [traffic]);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const SEVERITY_COLORS: Record<string, string> = {
    'CRITICAL': '#f43f5e',
    'HIGH': '#f97316',
    'MEDIUM': '#eab308',
    'LOW': '#10b981',
    'UNKNOWN': '#64748b'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Analytics & Historical Trends"
        subtitle="System-wide metrics and multi-module correlation analysis."
      />

      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-lg">
        <div className="text-sm text-slate-400 font-medium px-2">Time Window Filter</div>
        <div className="flex gap-2">
          {['1h', '6h', '24h', '7d', '30d'].map((window) => (
            <button
              key={window}
              onClick={() => setTimeWindow(window)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${timeWindow === window ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              {window.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {summaryLoading ? (
        <div className="text-center py-12 text-slate-500 animate-pulse">Aggregating historical data...</div>
      ) : (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Network Health" value={`${summary.network_health_score}%`} icon={Activity} color="text-emerald-400" />
            <KpiCard title="Active Nodes" value={summary.total_monitored_nodes} icon={Network} color="text-indigo-400" />
            <KpiCard title="Security Events" value={summary.total_security_events} icon={ShieldAlert} color="text-rose-400" />
            <KpiCard title="Mitigations" value={summary.mitigated_attacks_24h} icon={Shield} color="text-orange-400" />
            <KpiCard title="Traffic Events" value={summary.traffic_events_sampled} icon={BarChart3} color="text-sky-400" />
            <KpiCard title="Blockchain Tx" value={summary.blockchain_sealed_transactions} icon={Database} color="text-fuchsia-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attack Types Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" /> Attack Type Distribution
              </h3>
              {attackTypeData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attackTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No historical data available</div>
              )}
            </div>

            {/* Severity Distribution */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Attack Severity
              </h3>
              {severityData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No historical data available</div>
              )}
            </div>
            
            {/* Mitigation Decisions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" /> Automated Security Decisions
              </h3>
              {decisionData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={decisionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No historical data available</div>
              )}
            </div>

            {/* Traffic Over Time */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-300 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" /> Traffic Event Trend (Recent)
              </h3>
              {trafficTimeData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficTimeData}>
                      <defs>
                        <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      />
                      <Area type="monotone" dataKey="events" stroke="#38bdf8" fillOpacity={1} fill="url(#colorEvents)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No historical data available</div>
              )}
            </div>

          </div>

          <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-800">
            Analytics based on active backend telemetry pipelines across Modules 1-6.
          </div>
        </>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between h-28">
    <div className="flex items-center justify-between">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</div>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);
