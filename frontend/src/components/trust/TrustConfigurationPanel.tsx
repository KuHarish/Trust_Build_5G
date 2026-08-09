import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { useForm } from 'react-hook-form';
import { trustApi } from '@/api/endpoints';
import { Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface TrustConfig {
  configurationId?: string;
  behaviorWeight: number;
  historicalWeight: number;
  complianceWeight: number;
  trustedThreshold: number;
  suspiciousThreshold: number;
  maliciousThreshold: number;
  evaluationIntervalSeconds: number;
}

export const TrustConfigurationPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const { register, handleSubmit, watch, reset } = useForm<TrustConfig>();

  const bWeight = watch('behaviorWeight') || 0;
  const hWeight = watch('historicalWeight') || 0;
  const cWeight = watch('complianceWeight') || 0;

  const totalWeight = (Number(bWeight) + Number(hWeight) + Number(cWeight)).toFixed(2);
  const isInvalidWeight = totalWeight !== '1.00';

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await trustApi.getConfiguration();
        reset(res.data.data);
      } catch (err) {
        setMessage({ text: 'Failed to load configuration.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [reset]);

  const onSubmit = async (data: TrustConfig) => {
    if (isInvalidWeight) return;
    setSaving(true);
    setMessage(null);
    try {
      await trustApi.updateConfiguration(data as unknown as Record<string, unknown>);
      setMessage({ text: 'Configuration saved successfully.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.detail || 'Failed to save configuration.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleForceEvaluation = async () => {
    setEvaluating(true);
    try {
      await trustApi.evaluateAll();
      setMessage({ text: 'Network-wide evaluation triggered successfully.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to trigger evaluation.', type: 'error' });
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 p-8 text-center animate-pulse">Loading configuration...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Algorithm Weights" className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <form id="config-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Behavior Weight</label>
                <input type="number" step="0.01" min="0" max="1" {...register('behaviorWeight', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Historical Weight</label>
                <input type="number" step="0.01" min="0" max="1" {...register('historicalWeight', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Compliance Weight</label>
                <input type="number" step="0.01" min="0" max="1" {...register('complianceWeight', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${isInvalidWeight ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'} flex items-center justify-between text-sm`}>
              <div className="flex items-center gap-2">
                {isInvalidWeight ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                <span>Total Weight: <strong>{totalWeight}</strong></span>
              </div>
              {isInvalidWeight && <span>Weights must sum exactly to 1.00</span>}
            </div>

            <h3 className="text-lg font-medium text-slate-200 pt-4 border-t border-slate-800">Classification Thresholds</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-400">Trusted (≥)</label>
                <input type="number" step="0.01" min="0" max="1" {...register('trustedThreshold', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-amber-400">Suspicious (≥)</label>
                <input type="number" step="0.01" min="0" max="1" {...register('suspiciousThreshold', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-rose-400">Malicious (≥)</label>
                <input type="number" step="0.01" min="0" max="1" {...register('maliciousThreshold', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none" />
              </div>
            </div>

            <h3 className="text-lg font-medium text-slate-200 pt-4 border-t border-slate-800">System Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Evaluation Interval (s)</label>
                <input type="number" step="1" min="1" {...register('evaluationIntervalSeconds', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none" />
              </div>
            </div>

          </form>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Configuration Actions" className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="mt-4 flex flex-col gap-4">
            <button 
              type="submit" 
              form="config-form"
              disabled={isInvalidWeight || saving}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
            
            <button 
              type="button" 
              onClick={handleForceEvaluation}
              disabled={evaluating}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
              Force Re-evaluation
            </button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
              {message.text}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
