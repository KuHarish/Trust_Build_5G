import React from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card, Input, Select, Button, StatusIndicator } from '@/components/common';
import { useTheme, useSettings, useNotification } from '@/contexts';
import { Save, Moon, Volume2, Database, Shield, Sliders } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { autoRefreshInterval, setAutoRefreshInterval, enableSimulationSound, toggleSimulationSound } = useSettings();
  const { addNotification } = useNotification();

  const handleSave = () => {
    addNotification(
      'Settings Committed',
      'Platform configuration preferences saved to local enterprise state.',
      'success',
      4000
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Command & Control Settings"
        subtitle="Configure platform simulation preferences, polling intervals, API connection endpoints, and visual appearance."
        badgeText="System Configuration"
        action={
          <Button variant="primary" size="sm" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
            Save Preferences
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual & Audio Aesthetics Card */}
        <Card title="Appearance & Interface Aesthetics" subtitle="Customize dashboard theme and notification feedback">
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">Dark Cybersecurity Mode</h4>
                  <p className="text-xs text-slate-400">Mandatory state-of-the-art dark theme palette</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="font-mono text-xs">
                {theme === 'dark' ? 'Dark (Active)' : 'Light (Dev Mode)'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-accent" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">Audio Alarm Beeps (Future Sprint)</h4>
                  <p className="text-xs text-slate-400">Acoustic alert triggers upon Critical threat detection</p>
                </div>
              </div>
              <Button
                variant={enableSimulationSound ? 'accent' : 'secondary'}
                size="sm"
                onClick={toggleSimulationSound}
                className="font-mono text-xs"
              >
                {enableSimulationSound ? 'Enabled' : 'Muted'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Telemetry Polling & Simulation Config Card */}
        <Card title="Simulation & Telemetry Parameters" subtitle="Adjust real-time polling frequency and default slice focus">
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5 font-bold">
                Dashboard Telemetry Sync Interval
              </label>
              <Select
                options={[
                  { label: 'Every 2 Seconds (Real-time Fast)', value: 2 },
                  { label: 'Every 5 Seconds (Standard)', value: 5 },
                  { label: 'Every 15 Seconds (Low Bandwidth)', value: 15 },
                  { label: 'Manual Refresh Only', value: 0 },
                ]}
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                helperText="Controls data refresh rate for simulated KPI cards and line charts."
              />
            </div>

            <Input
              label="Backend FastAPI Endpoint Gateway URL"
              defaultValue="http://localhost:8000/api/v1"
              helperText="Target REST interface for asynchronous Motor DB communication."
            />
          </div>
        </Card>

        {/* Database & Architecture Status Card */}
        <Card title="System Database & Subsystem Diagnostic" subtitle="Operational status of backend foundation modules" className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300"><Database className="w-4 h-4 text-primary" /> Motor DB Client</span>
              <StatusIndicator status="Active" label="Async Pool Ready" />
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300"><Shield className="w-4 h-4 text-success" /> JWT Security Auth</span>
              <StatusIndicator status="Active" label="RBAC Active" />
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300"><Sliders className="w-4 h-4 text-accent" /> Sprint 0 Scaffolding</span>
              <StatusIndicator status="Active" label="Zero Breaks" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
