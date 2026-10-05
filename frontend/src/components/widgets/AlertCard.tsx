import React from 'react';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ShieldAlert, AlertTriangle, ArrowUpRight, Lock } from 'lucide-react';
import { useNotification } from '@/contexts';

export const AlertCard: React.FC = () => {
  const { addNotification } = useNotification();

  const mockAlerts = [
    {
      id: 'ALRT-901',
      title: 'Anomalous SYN Flood Surge Detected',
      target: 'Sector North gNodeB (GNB-001)',
      severity: 'Critical',
      time: '2 mins ago',
      action: 'Auto-Quarantine Initiated',
      mitigationStatus: 'Mitigated'
    },
    {
      id: 'ALRT-902',
      title: 'Suspicious Gradient Outlier in Federated Round #41',
      target: 'Edge AI Server (MEC-003)',
      severity: 'High',
      time: '14 mins ago',
      action: 'Model Weight Excluded',
      mitigationStatus: 'Quarantined'
    }
  ];

  const handleMitigate = (alertId: string, title: string) => {
    addNotification(
      'Security Controller Intervention',
      `Manual verification confirmed for incident [${alertId}]: "${title}". Firewall rules updated.`,
      'success',
      6000
    );
  };

  return (
    <Card className="p-6 border-slate-800/80">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-danger/20 text-danger border border-danger/30">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-wide">Live Security Controller Alerts</h3>
            <p className="text-xs text-slate-400 font-mono">Closed-loop autonomous defensive intervention</p>
          </div>
        </div>
        <Badge variant="danger" pulse size="md">2 Action Required</Badge>
      </div>

      <div className="space-y-4">
        {mockAlerts.map((alert) => (
          <div key={alert.id} className="p-4 rounded-xl bg-slate-950 border border-danger/30 hover:border-danger/60 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">{alert.title}</h4>
                    <Badge variant="danger" size="sm">{alert.severity}</Badge>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Target Entity: <span className="text-slate-200">{alert.target}</span> • {alert.time}
                  </p>
                  <p className="text-xs font-mono text-accent mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Countermeasure: {alert.action}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-danger-light border-danger/50 hover:bg-danger/10 hover:text-white"
                onClick={() => handleMitigate(alert.id, alert.title)}
                icon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Inspect & Seal
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
