import React, { useState } from 'react';
import { SimulationStatus } from '../../types/dashboard';
import { useSimulationControlMutation } from '../../hooks/useDashboardHooks';
import { Play, Pause, RotateCcw, FastForward, Sliders, CheckCircle } from 'lucide-react';
import { useNotification } from '../../contexts';

interface Props {
  status: SimulationStatus;
}

export const SimulationControlConsole: React.FC<Props> = ({ status }) => {
  const controlMutation = useSimulationControlMutation();
  const { addNotification } = useNotification();

  const [speed, setSpeed] = useState<number>(status.speedMultiplier || 1.0);
  const [packetFreq, setPacketFreq] = useState<number>(status.packetFrequency || 3.5);

  const handleAction = (action: 'START' | 'PAUSE' | 'RESUME' | 'RESET') => {
    controlMutation.mutate(
      { action },
      {
        onSuccess: () => {
          addNotification(
            'Simulation Daemon Updated',
            `Executed [${action}] across Module 1, 2, and 3 background traffic loops.`,
            'info',
            3500
          );
        },
      }
    );
  };

  const handleApplyTuning = () => {
    controlMutation.mutate(
      { action: 'TUNING', speedMultiplier: speed, packetFrequency: packetFreq },
      {
        onSuccess: () => {
          addNotification(
            'Simulation Parameters Adjusted',
            `Speed scaling updated to ${speed}x (Intervals: ~${packetFreq}s).`,
            'success',
            3500
          );
        },
      }
    );
  };

  const isPlaying = status.running && !status.paused;

  return (
    <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Simulation Engine Command Console</h3>
            <p className="text-xs text-slate-400">Control active automated traffic generators across all integrated modules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase border ${
              isPlaying
                ? 'bg-emerald-950 text-emerald-400 border-emerald-600 animate-pulse'
                : 'bg-amber-950 text-amber-400 border-amber-600'
            }`}
          >
            {isPlaying ? 'ENGINE ACTIVE (RUNNING)' : 'ENGINE SUSPENDED (PAUSED)'}
          </span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          disabled={isPlaying}
          onClick={() => handleAction('START')}
          className={`py-2.5 px-4 rounded-xl border font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            isPlaying
              ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/30'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-400" />
          <span>START SIM</span>
        </button>

        <button
          disabled={!isPlaying}
          onClick={() => handleAction('PAUSE')}
          className={`py-2.5 px-4 rounded-xl border font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            !isPlaying
              ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
              : 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30'
          }`}
        >
          <Pause className="w-4 h-4 text-amber-400" />
          <span>PAUSE SIM</span>
        </button>

        <button
          onClick={() => handleAction(isPlaying ? 'PAUSE' : 'RESUME')}
          className="py-2.5 px-4 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600/30 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <FastForward className="w-4 h-4 text-indigo-400" />
          <span>{isPlaying ? 'PAUSE TRAFFIC' : 'RESUME TRAFFIC'}</span>
        </button>

        <button
          onClick={() => handleAction('RESET')}
          className="py-2.5 px-4 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/50 hover:bg-rose-600/30 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>RESET DEFAULTS</span>
        </button>
      </div>

      {/* Sliders and Tuning Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold">Simulation Velocity Multiplier</span>
            <span className="text-indigo-400 font-black px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800">
              {speed}x speed
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.5"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-[11px] text-slate-500 font-mono">
            Scales background traffic tick execution speed across simulated node telemetry.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold">Communication Traffic Interval</span>
            <span className="text-cyan-400 font-black px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              {packetFreq}s intervals
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="10.0"
            step="0.5"
            value={packetFreq}
            onChange={(e) => setPacketFreq(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <p className="text-[11px] text-slate-500 font-mono">
            Defines delay in seconds between simulated packet transmissions and session spawning.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleApplyTuning}
          disabled={controlMutation.isPending}
          className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold font-mono tracking-wide transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>APPLY TUNING PARAMETERS</span>
        </button>
      </div>
    </div>
  );
};
