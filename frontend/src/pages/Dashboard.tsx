import React from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import {
  MetricCard,
  LineChartPlaceholder,
  PieChartPlaceholder,
  NetworkStatusCard,
  AlertCard,
  ActivityTable,
} from '@/components/widgets';
import { MOCK_DASHBOARD_METRICS } from '@/constants';
import { Button } from '@/components/common';
import { RefreshCw, Download, Radio } from 'lucide-react';
import { useNotification } from '@/contexts';

export const Dashboard: React.FC = () => {
  const { addNotification } = useNotification();

  const handleRefreshSimulation = () => {
    addNotification(
      'Telemetry Stream Synchronized',
      'Refreshed all 5G slicing monitors and threat classification KPIs with simulated data.',
      'info',
      4000
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Command Header */}
      <PageHeader
        title="5G Cybersecurity Command & Control"
        subtitle="Real-time multi-slice threat surveillance, adaptive Bayesian trust scoring, and federated AI defense."
        badgeText="Active Surveillance (Sprint 0 Mock)"
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSimulation}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Sync Telemetry
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => addNotification('Export Notice', 'Exported 24h diagnostic audit summary to JSON report.', 'success')}
              icon={<Download className="w-4 h-4" />}
            >
              Export Report
            </Button>
          </div>
        }
      />

      {/* Top Row: KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_DASHBOARD_METRICS.map((metric) => (
          <MetricCard
            key={metric.id}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            isPositive={metric.isPositive}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Middle Row: Interactive Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineChartPlaceholder />
        </div>
        <div className="lg:col-span-1">
          <PieChartPlaceholder />
        </div>
      </div>

      {/* Third Row: 5G Network Slice Status & Live Threat Alarms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NetworkStatusCard />
        </div>
        <div className="lg:col-span-1">
          <AlertCard />
        </div>
      </div>

      {/* Bottom Row: Cross-Module Platform Audit Table */}
      <div className="w-full">
        <ActivityTable />
      </div>

      {/* Footer architectural note */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center flex items-center justify-center gap-3 text-xs font-mono text-slate-400">
        <Radio className="w-4 h-4 text-primary animate-ping" />
        <span>All data rendered on this Command & Control view is operating on Sprint 0 foundational mock telemetry. Active 3GPP network simulations will connect during upcoming sprints.</span>
      </div>
    </div>
  );
};
