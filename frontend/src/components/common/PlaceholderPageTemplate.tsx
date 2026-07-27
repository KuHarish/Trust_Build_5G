import React from 'react';
import { PageHeader } from '@/layouts/PageHeader';
import { Card, Button, Badge, StatusIndicator } from '@/components/common';
import { LucideIcon, Terminal, Layers, ShieldCheck, BookOpen } from 'lucide-react';
import { useNotification } from '@/contexts';

export interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  moduleName: string;
  icon: LucideIcon;
  features: string[];
  architectureNote?: string;
  accentColor?: 'primary' | 'accent' | 'success' | 'warning' | 'danger';
}

export const PlaceholderPageTemplate: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  moduleName,
  icon: Icon,
  features,
  architectureNote = 'Scaffold ready in FastAPI backend and React Vite frontend. Active business logic scheduled for future sprints.',
  accentColor = 'primary',
}) => {
  const { addNotification } = useNotification();

  const handleDemoProbe = () => {
    addNotification(
      `Subsystem Diagnostic: ${moduleName}`,
      `Verified REST endpoint routing (/api/v1/${moduleName.toLowerCase()}) and MongoDB schema binding. Zero architectural breaks detected.`,
      'success',
      5000
    );
  };

  const badgeColorMap = {
    primary: 'text-primary border-primary/30 bg-primary/10',
    accent: 'text-accent border-accent/30 bg-accent/10',
    success: 'text-success border-success/30 bg-success/10',
    warning: 'text-warning border-warning/30 bg-warning/10',
    danger: 'text-danger border-danger/30 bg-danger/10',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={title}
        subtitle={subtitle}
        badgeText={`${moduleName} Module Scaffold`}
        action={
          <Button variant="primary" size="sm" onClick={handleDemoProbe} icon={<Terminal className="w-4 h-4" />}>
            Probe Endpoint Routing
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Architectural Description & Features Scheduled */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-slate-800/80 bg-slate-900/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-primary">
              <Icon className="w-64 h-64 -mr-16 -mt-16" />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl border ${badgeColorMap[accentColor]} shadow-lg`}>
                <Icon className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <Badge variant="outline" size="sm">Sprint 0 Architectural Deliverable</Badge>
                <h2 className="text-xl font-bold text-white mt-1">{moduleName} Architecture & Specifications</h2>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-sans mb-6">
              The <b>{moduleName}</b> layer is integrated directly into the TrustChain-5G platform foundation. In Sprint 0, all MongoDB data collections, Pydantic DTO models, and asynchronous FastAPI routers have been configured with zero coupling to unfinished algorithms, ensuring clean separation of concerns and limitless scalability.
            </p>

            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Future Sprint Roadmap Capabilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {features.map((feat, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-all">
                    <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary-light flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 leading-relaxed font-sans">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <StatusIndicator status="Active" label="Backend Route Ready" />
              <span className="flex items-center gap-1.5 text-accent"><ShieldCheck className="w-4 h-4" /> Enterprise Type-Safe</span>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Illustration Placeholder & Coming Soon Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[360px] bg-gradient-to-b from-slate-900/90 to-slate-950">
            <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center mb-6 shadow-inner text-primary">
              <Icon className="w-12 h-12 text-primary/80 animate-bounce" />
            </div>
            <Badge variant="accent" pulse size="md" className="mb-3 font-mono">
              ⚡ Coming Soon in Upcoming Sprints
            </Badge>
            <h3 className="text-base font-bold text-white mb-2">Module Development Active</h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed px-2">
              {architectureNote}
            </p>
            <div className="w-full mt-6 pt-6 border-t border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-xs text-slate-300"
                onClick={() => addNotification('Documentation Reference', `See docs/${moduleName.toLowerCase()}.md or open OpenAPI /docs in your browser.`, 'info')}
                icon={<BookOpen className="w-3.5 h-3.5" />}
              >
                View Architecture Docs
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
