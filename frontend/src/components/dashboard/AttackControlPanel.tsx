import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { simulationApi } from '../../api/endpoints';
import { Crosshair, ShieldAlert } from 'lucide-react';
import { useNotification } from '../../contexts';
import { SimulationNode } from '../../types/node';

interface Props {
  nodes: SimulationNode[];
}

export const AttackControlPanel: React.FC<Props> = ({ nodes }) => {
  const { addNotification } = useNotification();
  
  const [targetNode, setTargetNode] = useState<string>('');
  const [attackType, setAttackType] = useState<string>('DDoS');
  const [intensity, setIntensity] = useState<string>('MEDIUM');
  const [duration, setDuration] = useState<number>(30);

  const attackMutation = useMutation({
    mutationFn: (data: any) => simulationApi.triggerAttack(data).then((r) => r.data),
    onSuccess: () => {
      addNotification(
        'Simulated Attack Launched',
        `Initiated ${attackType} on node ${targetNode}. ML & Trust engines will evaluate traffic.`,
        'warning',
        5000
      );
    },
    onError: (err: any) => {
      addNotification('Attack Launch Failed', err.message || 'Unknown error occurred', 'danger');
    }
  });

  const handleLaunchAttack = () => {
    if (!targetNode) {
      addNotification('Target Required', 'Please select a compromised node for the attack scenario.', 'danger');
      return;
    }
    
    attackMutation.mutate({
      attackerNodeId: targetNode,
      attackType,
      intensity,
      duration
    });
  };

  return (
    <div className="p-6 rounded-2xl border border-rose-800/50 bg-rose-950/20 backdrop-blur-xl shadow-xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <ShieldAlert className="w-48 h-48 text-rose-500" />
      </div>

      <div className="flex items-center gap-2.5 border-b border-rose-900/50 pb-4">
        <Crosshair className="w-5 h-5 text-rose-500" />
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Threat & Attack Simulator</h3>
          <p className="text-xs text-rose-400/70">Inject manual attack scenarios to trigger ML detection & Trust evaluation pipelines</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300">Compromised Node (Attacker)</label>
          <select 
            value={targetNode}
            onChange={(e) => setTargetNode(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 outline-none"
          >
            <option value="">-- Select Compromised Node --</option>
            {nodes.map(n => (
              <option key={n.id} value={n.id}>{n.nodeName} ({n.nodeType})</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300">Attack Vector Profile</label>
          <select 
            value={attackType}
            onChange={(e) => setAttackType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 outline-none"
          >
            <option value="DDoS">DDoS (High Traffic Volumetric)</option>
            <option value="Port Scan">Reconnaissance (Port Scan)</option>
            <option value="Botnet">Botnet Command & Control</option>
            <option value="Data Exfiltration">Data Exfiltration</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300">Attack Intensity</label>
          <select 
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 outline-none"
          >
            <option value="LOW">Low (Stealthy)</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High (Aggressive)</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-slate-300">Duration (Seconds)</label>
          <input 
            type="number" 
            min="10" max="300"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-rose-500 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleLaunchAttack}
          disabled={attackMutation.isPending || !targetNode}
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-mono tracking-wide transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{attackMutation.isPending ? 'LAUNCHING...' : 'LAUNCH CYBER ATTACK'}</span>
        </button>
      </div>
    </div>
  );
};
