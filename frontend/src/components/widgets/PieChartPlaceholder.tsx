import React from 'react';
import { Card } from '@/components/common/Card';
import { PieChart, Shield } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export const PieChartPlaceholder: React.FC = () => {
  const data = {
    labels: ['Normal Benign Packets', 'DDoS SYN Flood Attempts', 'MitM Signalling Interception', 'Model Poisoning Rejection'],
    datasets: [
      {
        data: [84, 9, 4, 3],
        backgroundColor: ['#22C55E', '#EF4444', '#F59E0B', '#14B8A6'],
        borderColor: '#0F172A',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94A3B8',
          font: { family: 'Outfit', size: 11 },
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#E2E8F0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => ` ${context.label || ''}: ${context.raw || 0}%`,
        },
      },
    },
    cutout: '68%',
  };

  return (
    <Card className="h-[380px] flex flex-col border-slate-800/80">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold text-slate-100">Intrusion Detection Taxonomy</h3>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono text-accent">
          <Shield className="w-3.5 h-3.5" /> 100% Monitored
        </div>
      </div>
      <div className="flex-1 w-full min-h-[260px] relative flex items-center justify-center">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">84%</span>
          <span className="text-[10px] uppercase tracking-wider text-success font-semibold font-mono">Secure Traffic</span>
        </div>
      </div>
    </Card>
  );
};
