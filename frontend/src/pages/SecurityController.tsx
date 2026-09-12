import React, { useState } from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card } from '@/components/common/Card';
import { ShieldAlert, Activity, FileText, Play, CheckCircle2, XCircle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { securityApi } from '@/api/securityApi';

export const SecurityController: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DECISIONS' | 'ACTIONS' | 'POLICIES' | 'NODE_STATES' | 'AUDIT'>('DECISIONS');
  const [auditCorrelationId, setAuditCorrelationId] = useState('');
  
  // Simulator State
  const [simEvidence, setSimEvidence] = useState({
    nodeId: 'NODE-SIM-01',
    mlPrediction: 'ATTACK',
    mlConfidence: 0.95,
    trustScore: 0.2,
    trustLevel: 'MALICIOUS'
  });
  const [simResult, setSimResult] = useState<any>(null);

  const simulateMutation = useMutation({
    mutationFn: (data: { policyId: string, evidence: any }) => securityApi.simulatePolicy(data.policyId, data.evidence),
    onSuccess: (res) => setSimResult(res.data.data),
    onError: () => setSimResult({ error: 'Simulation failed' })
  });

  const { data: decisionsRes } = useQuery({
    queryKey: ['security-decisions'],
    queryFn: () => securityApi.getDecisions().then(res => res.data),
    refetchInterval: 5000
  });

  const { data: actionsRes } = useQuery({
    queryKey: ['mitigation-actions'],
    queryFn: () => securityApi.getActions().then(res => res.data),
    refetchInterval: 5000
  });

  const { data: policiesRes } = useQuery({
    queryKey: ['security-policies'],
    queryFn: () => securityApi.getPolicies().then(res => res.data)
  });

  const { data: nodeStatesRes } = useQuery({
    queryKey: ['node-states'],
    queryFn: () => securityApi.getNodeStates().then(res => res.data),
    refetchInterval: 5000
  });

  const { data: auditRes, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-timeline', auditCorrelationId],
    queryFn: () => securityApi.getAuditTimeline(auditCorrelationId).then(res => res.data),
    enabled: !!auditCorrelationId,
    refetchInterval: 5000
  });

  const decisions = decisionsRes?.data || [];
  const actions = actionsRes?.data || [];
  const policies = policiesRes?.data || [];
  const nodeStates = nodeStatesRes?.data || [];
  const auditEvents = auditRes?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Security Controller & Mitigation" 
        subtitle="Automated Policy Enforcement and Threat Isolation"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/60 border-slate-800 p-6 flex flex-col justify-center items-center text-center">
          <ShieldAlert className="w-8 h-8 text-rose-500 mb-2" />
          <h3 className="text-sm font-semibold text-slate-400">Total Mitigations</h3>
          <p className="text-3xl font-bold text-white mt-1">{actions.length}</p>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-6 flex flex-col justify-center items-center text-center">
          <Activity className="w-8 h-8 text-indigo-500 mb-2" />
          <h3 className="text-sm font-semibold text-slate-400">Total Decisions</h3>
          <p className="text-3xl font-bold text-white mt-1">{decisions.length}</p>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-6 flex flex-col justify-center items-center text-center">
          <FileText className="w-8 h-8 text-teal-500 mb-2" />
          <h3 className="text-sm font-semibold text-slate-400">Active Policies</h3>
          <p className="text-3xl font-bold text-white mt-1">{policies.length}</p>
        </Card>
      </div>

      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 w-fit">
        <button 
          onClick={() => setActiveTab('DECISIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'DECISIONS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Activity className="w-4 h-4" /> Security Decisions
        </button>
        <button 
          onClick={() => setActiveTab('ACTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ACTIONS' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <ShieldAlert className="w-4 h-4" /> Mitigation Actions
        </button>
        <button 
          onClick={() => setActiveTab('POLICIES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'POLICIES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <FileText className="w-4 h-4" /> Policies
        </button>
        <button 
          onClick={() => setActiveTab('NODE_STATES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'NODE_STATES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <Activity className="w-4 h-4" /> Node States
        </button>
        <button 
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'AUDIT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <FileText className="w-4 h-4" /> Audit Timeline
        </button>
      </div>

      {activeTab === 'DECISIONS' && (
        <Card className="bg-slate-900/60 border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Recent Security Decisions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-500 uppercase bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Node</th>
                  <th className="px-4 py-3">ML Prediction</th>
                  <th className="px-4 py-3">Trust Score</th>
                  <th className="px-4 py-3">Decision</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d: any) => (
                  <tr key={d.decisionId} className="border-b border-slate-800/50 hover:bg-slate-800/30 align-top">
                    <td className="px-4 py-3 font-mono">{new Date(d.createdAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-slate-300">
                      <div>{d.nodeId}</div>
                      {d.triggerEventId && <div className="text-[10px] text-slate-500 font-mono mt-1" title="Trigger ID">ID: {d.triggerEventId.substring(0, 8)}...</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div>{d.mlPrediction ? `${d.mlPrediction} (${d.mlConfidence?.toFixed(2) || '?'})` : 'N/A'}</div>
                      <div className={`text-[10px] mt-1 font-bold ${d.evidenceFreshness?.ML === 'STALE' ? 'text-amber-500' : d.evidenceFreshness?.ML === 'MISSING' ? 'text-slate-500' : 'text-emerald-500'}`}>{d.evidenceFreshness?.ML}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{d.trustScore !== null ? d.trustScore.toFixed(2) : 'N/A'}</div>
                      <div className={`text-[10px] mt-1 font-bold ${d.evidenceFreshness?.TRUST === 'STALE' ? 'text-amber-500' : d.evidenceFreshness?.TRUST === 'MISSING' ? 'text-slate-500' : 'text-emerald-500'}`}>{d.evidenceFreshness?.TRUST}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold ${d.decision === 'BLOCK' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : d.decision === 'QUARANTINE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : d.decision === 'RATE_LIMIT' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : d.decision === 'WARN' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}>
                        {d.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${d.severity === 'CRITICAL' ? 'text-rose-500' : d.severity === 'HIGH' ? 'text-amber-500' : d.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-slate-400'}`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs w-1/3">
                      <div className="font-bold text-slate-300 mb-1">{d.reason}</div>
                      {d.explanation && d.explanation.conflicts === "Yes" && (
                         <div className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded inline-block mb-1">CONFLICT DETECTED</div>
                      )}
                      {d.explanation && d.explanation.correlationId && (
                        <div 
                          className="text-[10px] text-indigo-400 font-mono mt-1 cursor-pointer hover:underline"
                          onClick={() => {
                            setAuditCorrelationId(d.explanation.correlationId);
                            setActiveTab('AUDIT');
                          }}
                        >
                          Trace: {d.explanation.correlationId}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {decisions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No decisions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'ACTIONS' && (
        <Card className="bg-slate-900/60 border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Mitigation Actions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-500 uppercase bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Requested At</th>
                  <th className="px-4 py-3">Node</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Result</th>
                  <th className="px-4 py-3">Blockchain TX</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a: any) => (
                  <tr key={a.actionId} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono">{new Date(a.requestedAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-slate-300">{a.nodeId}</td>
                    <td className="px-4 py-3 font-bold text-indigo-400">{a.decision}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${a.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : a.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{a.result || a.errorInformation || '...'}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                      {a.blockchainTxId || 'Pending...'}
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No mitigation actions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'POLICIES' && (
        <div className="space-y-6">
          {policies.map((p: any) => (
            <Card key={p.policyId} className="bg-slate-900/60 border-slate-800">
              <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {p.name}
                    {p.status === 'ACTIVE' ? (
                      <span className="text-[10px] uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">Active v{p.version}</span>
                    ) : (
                      <span className="text-[10px] uppercase bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded font-bold">{p.status} v{p.version}</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{p.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase">Thresholds</div>
                  <div className="text-xs font-bold text-slate-300">ML High Conf: {p.thresholds?.mlHighConfidence}</div>
                  <div className="text-xs font-bold text-slate-300">Fallback: {p.fallbackBehavior}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Policy Rules</h4>
                {p.rules && p.rules.map((r: any) => (
                  <div key={r.ruleId} className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
                    <div className="absolute top-4 right-4 text-xs font-bold text-slate-500">Priority: {r.priority}</div>
                    <div className="text-sm font-bold text-indigo-300 mb-2">{r.name}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold tracking-wider">IF ALL CONDITIONS MET</div>
                        <div className="space-y-1">
                          {r.conditions.map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 font-mono text-xs bg-slate-900/50 p-1.5 rounded">
                              <span className="text-indigo-400">{c.field}</span>
                              <span className="text-slate-500 font-bold">{c.operator}</span>
                              <span className="text-teal-400">{c.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500 mb-1 font-bold tracking-wider">THEN</div>
                        <div className="font-mono text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 p-2 rounded inline-block font-bold">
                          {r.decisionAction} <span className="text-slate-500 text-xs font-normal">({r.severity})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
          
          {policies.length > 0 && (
            <Card className="bg-slate-900/60 border-slate-800 mt-6">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                <Play className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Dry Run Simulator</h3>
                <span className="ml-2 text-[10px] uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">Safe Testing</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ML Prediction</label>
                    <select 
                      value={simEvidence.mlPrediction}
                      onChange={e => setSimEvidence({...simEvidence, mlPrediction: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="ATTACK">ATTACK</option>
                      <option value="BENIGN">BENIGN</option>
                      <option value="MISSING">MISSING</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ML Confidence (0.0 - 1.0)</label>
                    <input 
                      type="number" step="0.01" min="0" max="1"
                      value={simEvidence.mlConfidence}
                      onChange={e => setSimEvidence({...simEvidence, mlConfidence: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Trust Level</label>
                    <select 
                      value={simEvidence.trustLevel}
                      onChange={e => setSimEvidence({...simEvidence, trustLevel: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="MALICIOUS">MALICIOUS</option>
                      <option value="SUSPICIOUS">SUSPICIOUS</option>
                      <option value="TRUSTED">TRUSTED</option>
                      <option value="MISSING">MISSING</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => simulateMutation.mutate({ policyId: policies[0]?.policyId, evidence: simEvidence })}
                    disabled={simulateMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {simulateMutation.isPending ? 'Simulating...' : 'Run Simulation'} <Play className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="bg-slate-950 rounded border border-slate-800 p-4 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Simulation Result</h4>
                  
                  {simResult ? (
                    simResult.error ? (
                      <div className="text-rose-400 text-sm flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> {simResult.error}
                      </div>
                    ) : (
                      <div className="space-y-4 flex-grow">
                        {simResult.matched ? (
                          <>
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                              <CheckCircle2 className="w-5 h-5" /> Rule Matched
                            </div>
                            <div className="bg-slate-900 p-3 rounded border border-slate-800">
                              <div className="text-xs text-slate-500 mb-1">Matched Rule</div>
                              <div className="text-sm font-bold text-indigo-300">{simResult.rule?.name}</div>
                            </div>
                            <div className="bg-rose-500/10 p-3 rounded border border-rose-500/20 text-center">
                              <div className="text-xs text-rose-500/70 uppercase font-bold tracking-wider mb-1">Resulting Action</div>
                              <div className="text-xl font-bold text-rose-400">{simResult.rule?.decisionAction}</div>
                              <div className="text-xs text-rose-400/50 mt-1">Severity: {simResult.rule?.severity}</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                              <ShieldAlert className="w-5 h-5" /> No Rules Matched
                            </div>
                            <div className="bg-slate-900 p-3 rounded border border-slate-800 text-center mt-4">
                              <div className="text-xs text-slate-500 mb-1">Fallback Behavior Applied</div>
                              <div className="text-lg font-bold text-slate-300">{simResult.fallbackBehavior}</div>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-600 text-sm italic">
                      Configure evidence and run simulation to see results.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {policies.length === 0 && (
            <div className="text-center p-8 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500">
              No security policies configured.
            </div>
          )}
        </div>
      )}

      {activeTab === 'NODE_STATES' && (
        <Card className="bg-slate-900/60 border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Logical Node Security States</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-500 uppercase bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Node</th>
                  <th className="px-4 py-3">Current State</th>
                  <th className="px-4 py-3">Previous State</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {nodeStates.map((s: any) => (
                  <tr key={s.nodeId} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-slate-300">{s.nodeId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${s.currentState === 'BLOCKED' ? 'bg-rose-500/20 text-rose-400' : s.currentState === 'QUARANTINED' ? 'bg-amber-500/20 text-amber-400' : s.currentState === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {s.currentState}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.previousState}</td>
                    <td className="px-4 py-3 text-xs w-1/3 truncate">{s.reason}</td>
                    <td className="px-4 py-3 font-mono text-[10px]">{new Date(s.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {nodeStates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No nodes have recorded security states.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded text-xs text-indigo-300">
            <strong>Note:</strong> These represent <em>Logical Prototype Enforcement</em> states. Actual physical host blocking is disabled per system rules.
          </div>
        </Card>
      )}

      {activeTab === 'AUDIT' && (
        <Card className="bg-slate-900/60 border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white">Security Incident Timeline</h2>
            <div className="flex items-center gap-2 w-full md:w-96">
              <input
                type="text"
                placeholder="Enter Correlation ID..."
                value={auditCorrelationId}
                onChange={(e) => setAuditCorrelationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          
          {!auditCorrelationId ? (
            <div className="text-center p-8 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed text-slate-500">
              Enter a Correlation ID or click "Trace" on a security decision to view its full lifecycle timeline.
            </div>
          ) : auditLoading ? (
            <div className="text-center p-8 text-slate-400">Loading timeline...</div>
          ) : auditEvents.length === 0 ? (
            <div className="text-center p-8 text-slate-500">No events found for correlation ID: {auditCorrelationId}</div>
          ) : (
            <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-8">
              {auditEvents.map((e: any) => (
                <div key={e.eventId} className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-indigo-500"></div>
                  
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-indigo-300">{e.eventType}</span>
                        {e.sourceModule && <span className="text-[10px] text-slate-500 uppercase bg-slate-800/50 px-2 py-0.5 rounded">{e.sourceModule}</span>}
                      </div>
                      
                      <div className="text-sm text-slate-400 mb-2">
                        {e.decision && <span className="font-bold text-white mr-2">Decision: {e.decision}</span>}
                        {e.mitigationAction && <span className="font-bold text-white mr-2">Action: {e.mitigationAction}</span>}
                        {e.nodeId && <span>Node: {e.nodeId}</span>}
                      </div>
                      
                      <div className="text-xs text-slate-500 font-mono space-y-1">
                        {e.policyId && <div>Policy: {e.policyId} (v{e.policyVersion})</div>}
                        {e.reason && <div>Reason: {e.reason}</div>}
                        {e.result && <div>Result: {e.result}</div>}
                        {e.errorInformation && <div className="text-rose-400">Error: {e.errorInformation}</div>}
                        {e.previousSecurityState && <div>State Change: {e.previousSecurityState} &rarr; {e.newSecurityState}</div>}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500">{new Date(e.timestamp).toLocaleString()}</div>
                      <div className="mt-2">
                        {e.auditStatus === 'CONFIRMED' ? (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> AUDIT CONFIRMED
                          </div>
                        ) : e.auditStatus === 'FAILED' ? (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> AUDIT FAILED
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                            <Activity className="w-3 h-3" /> AUDIT PENDING
                          </div>
                        )}
                        {e.blockchainTxId && (
                          <div className="text-[9px] font-mono text-slate-600 mt-1 max-w-[120px] truncate" title={e.blockchainTxId}>
                            TX: {e.blockchainTxId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
