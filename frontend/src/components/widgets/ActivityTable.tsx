import React from 'react';
import { Card } from '@/components/common/Card';
import { Table, Column } from '@/components/common/Table';
import { Badge } from '@/components/common/Badge';
import { StatusIndicator } from '@/components/common/StatusIndicator';
import { Activity } from 'lucide-react';

interface ActivityLogItem {
  id: string;
  timestamp: string;
  node: string;
  eventType: string;
  module: string;
  status: string;
  trustImpact: string;
}

export const ActivityTable: React.FC = () => {
  const mockActivityData: ActivityLogItem[] = [
    { id: '1', timestamp: '11:25:04', node: 'Tokyo Sector GNB-01', eventType: 'DDoS Traffic Spike Rejection', module: 'ML-Intrusion-Engine', status: 'Active', trustImpact: '+0.2%' },
    { id: '2', timestamp: '11:24:50', node: 'Core UPF Gateway 4', eventType: 'Federated Gradient Synthesis', module: 'FL-Aggregator', status: 'Active', trustImpact: '+1.0%' },
    { id: '3', timestamp: '11:22:15', node: 'Edge Server MEC-03', eventType: 'Outlier Gradient Signature', module: 'Adaptive Trust Engine', status: 'Warning', trustImpact: '-14.8%' },
    { id: '4', timestamp: '11:19:40', node: 'IoT Sensor Cluster 12', eventType: 'Blockchain Trust Ledger Seal (Block #8451)', module: 'Blockchain Storage', status: 'Active', trustImpact: '0.0%' },
  ];

  const columns: Column<ActivityLogItem>[] = [
    { header: 'Time', accessorKey: 'timestamp', className: 'font-mono text-xs text-slate-400 w-24' },
    { header: '5G Node / Entity', accessorKey: 'node', className: 'font-semibold text-slate-200' },
    { header: 'Event Classification', accessorKey: 'eventType', className: 'text-slate-300 font-sans' },
    {
      header: 'Evaluating Subsystem',
      cell: (item) => (
        <Badge variant={item.module.includes('Blockchain') ? 'accent' : item.module.includes('ML') ? 'primary' : 'secondary'} size="sm">
          {item.module}
        </Badge>
      ),
    },
    {
      header: 'System Status',
      cell: (item) => <StatusIndicator status={item.status} />,
    },
    {
      header: 'Trust Delta',
      cell: (item) => (
        <span className={item.trustImpact.startsWith('-') ? 'text-danger font-mono font-bold' : 'text-success font-mono font-bold'}>
          {item.trustImpact}
        </span>
      ),
    },
  ];

  return (
    <Card className="p-6 border-slate-800/80">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/20 text-accent border border-accent/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-wide">Platform Audit & Telemetry Activity Stream</h3>
            <p className="text-xs text-slate-400 font-mono">Cross-module correlation between ML intrusions, Trust evaluations & Blockchain seals</p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">Auto-Scroll Enabled</Badge>
      </div>
      <Table<ActivityLogItem>
        columns={columns}
        data={mockActivityData}
        keyExtractor={(item) => item.id}
        emptyMessage="No recent platform telemetry activities logged."
      />
    </Card>
  );
};
