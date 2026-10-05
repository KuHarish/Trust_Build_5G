import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { securityApi } from '@/api';
import { ShieldAlert, ShieldCheck, Activity, Brain, Server, Clock, ServerCrash, FileCode } from 'lucide-react';

interface TimelineProps {
  correlationId: string;
}

export const SecurityTraceTimeline: React.FC<TimelineProps> = ({ correlationId }) => {
  const [showRaw, setShowRaw] = useState(false);

  const { data: timelineRes, isLoading, error } = useQuery({
    queryKey: ['audit-timeline', correlationId],
    queryFn: () => securityApi.getAuditTimeline(correlationId).then(res => res.data),
    enabled: !!correlationId
  });

  if (isLoading) {
    return <div className="p-4 text-center text-slate-500 animate-pulse text-xs">Tracing security correlation...</div>;
  }

  if (error || !timelineRes?.data || timelineRes.data.length === 0) {
    return (
      <div className="p-3 bg-slate-900/50 rounded-lg text-slate-500 text-xs text-center border border-dashed border-slate-700">
        No additional trace events found for {correlationId}.
      </div>
    );
  }

  const events = timelineRes.data;

  const getIconForType = (type: string) => {
    if (type.includes('ATTACK')) return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    if (type.includes('TRUST')) return <Activity className="w-4 h-4 text-indigo-400" />;
    if (type.includes('DECISION')) return <Brain className="w-4 h-4 text-purple-400" />;
    if (type.includes('MITIGATION')) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (type.includes('FAILED')) return <ServerCrash className="w-4 h-4 text-orange-500" />;
    return <Server className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-950/80 rounded border border-slate-800">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Correlation Trace</div>
        <div className="relative border-l border-slate-700 ml-3 space-y-4 pb-2">
          {events.map((evt: any, idx: number) => (
            <div key={evt.eventId || idx} className="relative pl-6">
              <div className="absolute -left-[9px] top-1 bg-slate-900 rounded-full border border-slate-700 p-0.5">
                {getIconForType(evt.eventType)}
              </div>
              <div className="text-xs font-medium text-slate-300">
                {evt.eventType.replace(/_/g, ' ')}
              </div>
              
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(evt.timestamp).toLocaleTimeString()}
              </div>
              
              {/* Contextual payload snippet */}
              <div className="mt-1.5 p-2 bg-slate-900/50 rounded text-[10px] font-mono text-slate-400">
                {evt.eventType.includes('ATTACK') && evt.payload?.confidence && (
                  <div>Confidence: {(evt.payload.confidence * 100).toFixed(1)}%</div>
                )}
                {evt.eventType.includes('DECISION') && evt.payload?.decision && (
                  <div className="text-purple-300">Action: {evt.payload.decision}</div>
                )}
                {evt.eventType.includes('TRUST') && evt.payload?.trustScore && (
                  <div className="text-indigo-300">Score: {evt.payload.trustScore}</div>
                )}
                {evt.eventType.includes('MITIGATION') && evt.payload?.status && (
                  <div className={evt.payload.status === 'COMPLETED' ? 'text-emerald-300' : 'text-amber-300'}>
                    Status: {evt.payload.status}
                  </div>
                )}
                <div className="text-slate-500 mt-1">Status: {evt.auditStatus}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => setShowRaw(!showRaw)}
          className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          <FileCode className="w-3 h-3" />
          {showRaw ? 'Hide Raw Data' : 'View Raw Data'}
        </button>
      </div>

      {showRaw && (
        <div className="p-2 bg-slate-950 rounded border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
          <pre className="text-[9px] text-emerald-400 font-mono">
            {JSON.stringify(events, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
