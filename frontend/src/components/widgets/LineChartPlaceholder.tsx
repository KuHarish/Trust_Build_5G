import React from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Activity } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register lightweight Chart.js modules once cleanly to ensure zero breaking renders
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const LineChartPlaceholder: React.FC = () => {
  const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'];

  const data = {
    labels,
    datasets: [
      {
        label: '5G Radio Throughput (Gbps)',
        data: [12.4, 15.1, 28.6, 42.1, 38.4, 31.2, 45.8],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.12)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563EB',
        pointBorderColor: '#0F172A',
        pointHoverRadius: 6,
      },
      {
        label: 'Anomalous Threat Traffic (%)',
        data: [0.8, 1.2, 1.5, 8.4, 2.1, 1.1, 0.9],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#0F172A',
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94A3B8',
          font: { family: 'Outfit', size: 11 },
          boxWidth: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F8FAFC',
        bodyColor: '#E2E8F0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(30, 41, 59, 0.4)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(30, 41, 59, 0.4)' },
        ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
  };

  return (
    <Card className="h-[380px] flex flex-col border-slate-800/80">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Live 5G Slice Telemetry & Threat Inflow</h3>
            <p className="text-xs text-slate-400 font-mono">Real-time simulation packet sampling (Sprint 0 Mock data)</p>
          </div>
        </div>
        <Badge variant="primary" pulse>Live Simulation Ready</Badge>
      </div>
      <div className="flex-1 w-full min-h-[260px]">
        <Line data={data} options={options} />
      </div>
    </Card>
  );
};
