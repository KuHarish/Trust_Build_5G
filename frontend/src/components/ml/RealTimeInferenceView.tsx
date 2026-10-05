import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import axios from 'axios';
import { Cpu, Zap, Server, ShieldAlert, ShieldCheck } from 'lucide-react';

export const RealTimeInferenceView: React.FC = () => {
  const [inferenceResult, setInferenceResult] = useState<any>(null);

  // We fetch the active model from registry endpoint (we'll assume the registry returns active models)
  const { data: modelsData } = useQuery({
    queryKey: ['ml-models'],
    queryFn: () => axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ml/models`).then(res => res.data)
  });

  const activeModel = modelsData?.data?.find((m: any) => m.isActive);

  const evaluateMutation = useMutation({
    mutationFn: () => axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/ml/evaluate`, {
      features: {
        "Destination Port": 80,
        "Flow Duration": 12345,
        "Total Fwd Packets": 2,
        "Total Backward Packets": 0,
        "Fwd Packet Length Max": 100,
        "Bwd Packet Length Max": 0
      }
    }).then(res => res.data),
    onSuccess: (data) => {
      setInferenceResult(data);
    }
  });

  const handleSimulateInference = () => {
    evaluateMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3 text-slate-300">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold">Real-Time Threat Detection</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/70 border-slate-800">
          <h3 className="text-md font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" /> Currently Active Model
          </h3>
          
          {activeModel ? (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Model Name</span>
                <span className="font-mono text-slate-300">{activeModel.modelName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Training Type</span>
                <span className={`font-bold ${activeModel.trainingType === 'FEDERATED' ? 'text-teal-400' : 'text-indigo-400'}`}>
                  {activeModel.trainingType}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Algorithm</span>
                <span className="text-slate-300">{activeModel.algorithm}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Dataset</span>
                <span className="text-slate-300">{activeModel.datasetId}</span>
              </div>
            </div>
          ) : (
            <div className="text-amber-500 text-sm">
              No active model selected. Go to the Registry to activate one.
            </div>
          )}
        </Card>

        <Card className="bg-slate-900/70 border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" /> Inference Engine
            </h3>
            <Button 
              onClick={handleSimulateInference} 
              disabled={evaluateMutation.isPending || !activeModel}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Simulate Traffic
            </Button>
          </div>

          {inferenceResult ? (
            <div className="space-y-4">
              {inferenceResult.success ? (
                <>
                  <div className={`p-4 rounded-xl flex items-center gap-4 ${inferenceResult.data.predictedClass.toLowerCase().includes('benign') || inferenceResult.data.predictedClass === '0' ? 'bg-emerald-950/50 border border-emerald-900/50' : 'bg-rose-950/50 border border-rose-900/50'}`}>
                    {inferenceResult.data.predictedClass.toLowerCase().includes('benign') || inferenceResult.data.predictedClass === '0' ? (
                      <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <ShieldAlert className="w-8 h-8 text-rose-500" />
                    )}
                    <div>
                      <div className="text-xs text-slate-500">Classification Result</div>
                      <div className={`text-lg font-bold ${inferenceResult.data.predictedClass.toLowerCase().includes('benign') || inferenceResult.data.predictedClass === '0' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {inferenceResult.data.predictedClass}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Model Used:</span>
                      <span className="text-slate-200">{inferenceResult.data.modelId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="text-slate-200">{(inferenceResult.data.confidence * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span className="text-slate-200">{inferenceResult.data.latencyMs.toFixed(2)} ms</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-rose-500 p-4 bg-rose-950/30 rounded border border-rose-900/50">
                  {inferenceResult.message}
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 border border-slate-800 border-dashed rounded-xl">
              Click Simulate Traffic to test the active model.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
