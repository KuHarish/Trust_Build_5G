import React, { useState } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ShieldAlert, RefreshCw, Clock, Filter, AlertOctagon, Brain, Server, ShieldCheck, ExternalLink, Activity } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { attacksApi } from '@/api';
import { SecurityTraceTimeline } from '@/components/blockchain/SecurityTraceTimeline';
import { Link } from 'react-router-dom';

export const Attacks: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAttackId, setSelectedAttackId] = useState<string | null>(null);
  
  // Filters
  const [filterAttackType, setFilterAttackType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterNodeId, setFilterNodeId] = useState<string>('');

  const { data: logsRes, isLoading, error } = useQuery({
    queryKey: ['attack-logs', currentPage, filterAttackType, filterSeverity, filterNodeId],
    queryFn: () => attacksApi.list({ 
      page: currentPage, 
      limit: 15,
      attack_type: filterAttackType || undefined,
      severity: filterSeverity || undefined,
      node_id: filterNodeId || undefined
    }).then(res => res.data),
    refetchInterval: 5000 // Real-time polling
  });

  const { data: detailsRes, isLoading: detailsLoading } = useQuery({
    queryKey: ['attack-details', selectedAttackId],
    queryFn: () => selectedAttackId ? attacksApi.getDetails(selectedAttackId).then(res => res.data) : null,
    enabled: !!selectedAttackId
  });

  const attacks = logsRes?.data || [];
  const totalCount = logsRes?.total_count || 0;
  const attackDetails = detailsRes?.data;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['attack-logs'] });
    if (selectedAttackId) {
      queryClient.invalidateQueries({ queryKey: ['attack-details', selectedAttackId] });
      queryClient.invalidateQueries({ queryKey: ['audit-timeline'] });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getMitigationStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'text-emerald-400';
    if (status === 'FAILED') return 'text-rose-400';
    if (status === 'PENDING') return 'text-amber-400 animate-pulse';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn relative">
      <PageHeader 
        title="Attacks / Forensic Log" 
        subtitle="Investigate cyber attacks, ML threat detections, trust evaluations, and automated mitigations."
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 gap-4">
        <div className="flex items-center gap-3 text-slate-300">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-bold">Threat Detection Pipeline</h2>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full border border-slate-700">
            {totalCount} Total Incidents
          </span>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-lg border border-slate-800 shrink-0">
            <Filter className="w-4 h-4 text-slate-500 ml-2" />
            
            <select 
              value={filterAttackType}
              onChange={(e) => { setFilterAttackType(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-300 outline-none p-1 border-r border-slate-800"
            >
              <option value="">All Types</option>
              <option value="DDoS">DDoS</option>
              <option value="DoS">DoS</option>
              <option value="MitM">MitM</option>
              <option value="Botnet">Botnet</option>
              <option value="Brute Force">Brute Force</option>
            </select>
            
            <select 
              value={filterSeverity}
              onChange={(e) => { setFilterSeverity(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-300 outline-none p-1 border-r border-slate-800"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <input 
              type="text" 
              placeholder="Node ID..."
              value={filterNodeId}
              onChange={(e) => { setFilterNodeId(e.target.value); setCurrentPage(1); }}
              className="bg-transparent text-xs text-slate-300 outline-none p-1 w-24"
            />
          </div>
          
          <Button onClick={handleRefresh} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ATTACKS TABLE */}
        <div className="xl:col-span-2">
          <Card title="Detection Log" className="bg-slate-900/70 border-slate-800 overflow-hidden">
            {error ? (
              <div className="p-12 text-center text-rose-500 border border-dashed border-rose-900/50 rounded-lg m-4 bg-rose-950/20">
                <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-medium">Unable to load attack records</h3>
                <p className="mt-1 text-sm text-rose-400/80">Check the backend connection and try again.</p>
                <Button onClick={handleRefresh} className="mt-4 bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-xs">Retry</Button>
              </div>
            ) : isLoading && attacks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <RefreshCw className="w-8 h-8 animate-spin mb-4 text-slate-600" />
                Loading detection logs...
              </div>
            ) : attacks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 border border-dashed border-slate-700 rounded-lg m-4">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20 text-emerald-500" />
                <h3 className="text-lg font-medium text-slate-400">No attacks detected</h3>
                <p className="mt-1 text-sm">No attack records match the current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/40 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Node</th>
                      <th className="px-4 py-3 font-medium">Attack (ML)</th>
                      <th className="px-4 py-3 font-medium text-center">Confidence</th>
                      <th className="px-4 py-3 font-medium text-center">Trust Score</th>
                      <th className="px-4 py-3 font-medium">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {attacks.map((attack: any) => (
                      <tr 
                        key={attack._id} 
                        onClick={() => setSelectedAttackId(attack._id)}
                        className={`cursor-pointer transition-colors ${
                          selectedAttackId === attack._id 
                            ? 'bg-rose-900/20 border-l-2 border-rose-500' 
                            : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                          {new Date(attack.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-indigo-300">
                          {attack.target_node_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{attack.attack_type}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getSeverityColor(attack.severity)}`}>
                              {attack.severity}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {attack.confidence_score !== null && attack.confidence_score !== undefined ? (
                            <span className="text-emerald-400 font-mono text-xs">{(attack.confidence_score * 100).toFixed(1)}%</span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {attack.trust_score !== null && attack.trust_score !== undefined ? (
                            <div className="flex flex-col items-center">
                              <span className="text-slate-300 font-mono text-xs">{attack.trust_score.toFixed(2)}</span>
                              <span className={`text-[9px] ${attack.trust_level === 'MALICIOUS' ? 'text-rose-400' : 'text-slate-400'}`}>
                                {attack.trust_level}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Unavailable</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-300">{attack.decision}</span>
                            <span className={`text-[10px] ${getMitigationStatusColor(attack.mitigation_status)}`}>
                              {attack.mitigation_status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalCount > 15 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/30">
                <div className="text-xs text-slate-500">
                  Showing page {currentPage} of {Math.ceil(totalCount / 15)}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage * 15 >= totalCount}
                    className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* INVESTIGATION VIEW */}
        <div className="xl:col-span-1">
          {selectedAttackId ? (
            <Card title="Incident Investigation" className="bg-slate-900/90 border-slate-800 sticky top-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
              {detailsLoading ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <RefreshCw className="w-6 h-6 animate-spin mb-3 text-slate-600" />
                  Loading forensic details...
                </div>
              ) : !attackDetails ? (
                <div className="p-8 text-center text-rose-400 text-sm">
                  Details not found for this incident.
                </div>
              ) : (
                <div className="overflow-y-auto custom-scrollbar pr-2 pb-4 space-y-6 flex-1 mt-4">
                  
                  {/* Base Information */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-rose-400">{attackDetails.attack_type}</h3>
                        <div className="text-xs text-slate-400 mt-1 font-mono">ID: {attackDetails._id}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wider font-bold ${getSeverityColor(attackDetails.severity)}`}>
                        {attackDetails.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800/80">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Detected At</div>
                        <div className="text-xs font-mono text-slate-300 mt-1">{new Date(attackDetails.timestamp).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><Server className="w-3 h-3"/> Target Node</div>
                        <div className="text-xs font-mono text-indigo-400 mt-1">{attackDetails.target_node_id}</div>
                      </div>
                    </div>
                  </div>

                  {/* ML Confidence */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1"><Brain className="w-3 h-3"/> ML Detection</h4>
                    <div className="p-3 bg-slate-800/30 rounded border border-slate-700/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-400">Model Confidence</span>
                        <span className="text-xs font-mono text-emerald-400">{attackDetails.confidence_score ? (attackDetails.confidence_score * 100).toFixed(1) + '%' : 'N/A'}</span>
                      </div>
                      {/* Note: We do not fake model versions if backend doesn't provide it in this payload */}
                      <div className="text-[10px] text-slate-500 italic mt-2">Correlated via ML engine prediction.</div>
                    </div>
                  </div>

                  {/* Trust Evaluation */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Trust State</h4>
                    {attackDetails.trust_score !== null && attackDetails.trust_score !== undefined ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-800/30 rounded border border-slate-700/50 text-center">
                          <div className="text-[10px] text-slate-500 uppercase">Trust Score</div>
                          <div className="text-lg font-mono text-slate-200 mt-1">{attackDetails.trust_score.toFixed(2)}</div>
                        </div>
                        <div className="p-3 bg-slate-800/30 rounded border border-slate-700/50 text-center">
                          <div className="text-[10px] text-slate-500 uppercase">Trust Level</div>
                          <div className={`text-sm font-bold mt-2 ${attackDetails.trust_level === 'MALICIOUS' ? 'text-rose-400' : 'text-emerald-400'}`}>{attackDetails.trust_level}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 italic">Trust information unavailable for this incident.</div>
                    )}
                  </div>

                  {/* Security Decision */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Security Decision</h4>
                    <div className="p-3 bg-slate-800/30 rounded border border-slate-700/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Action Decided</span>
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{attackDetails.decision}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Policy Matched</span>
                        <span className="text-[10px] font-mono text-slate-300">{attackDetails.explanation?.matchedPolicy || attackDetails.policy_id || 'Unknown'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded mt-2 border border-slate-800">
                        <span className="text-slate-500 block mb-1">Reason:</span>
                        {attackDetails.reason}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mitigation */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Mitigation Status</h4>
                    <div className="p-3 bg-slate-800/30 rounded border border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Current State</span>
                        <span className={`text-xs font-bold ${getMitigationStatusColor(attackDetails.mitigation_status)}`}>
                          {attackDetails.mitigation_status}
                        </span>
                      </div>
                      {attackDetails.mitigation_status === 'FAILED' && attackDetails.mitigation_action?.errorInformation && (
                        <div className="mt-2 text-[10px] text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-900/50 font-mono">
                          {attackDetails.mitigation_action.errorInformation}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Forensic Trace Timeline */}
                  {attackDetails.correlation_id && (
                    <div className="pt-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Incident Trace Timeline</span>
                        <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">CORR: {attackDetails.correlation_id.substring(0,8)}...</span>
                      </h4>
                      <SecurityTraceTimeline correlationId={attackDetails.correlation_id} />
                      
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <Link to="/blockchain" className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs transition-colors">
                          <ExternalLink className="w-3 h-3" />
                          View in Blockchain Explorer
                        </Link>
                      </div>
                    </div>
                  )}
                  
                </div>
              )}
            </Card>
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500 sticky top-6">
              <div className="text-center">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Select an attack to view forensic details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
