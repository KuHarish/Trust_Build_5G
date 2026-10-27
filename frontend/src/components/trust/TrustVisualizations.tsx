import React from 'react';
import { Card } from '@/components/common/Card';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, Legend, Cell } from 'recharts';

interface TrustVisualizationsProps {
  profiles: any[];
  history: any[];
  selectedNodeName?: string;
}

export const TrustVisualizations: React.FC<TrustVisualizationsProps> = ({ profiles, history, selectedNodeName }) => {
  // Aggregate profiles for distribution chart
  const trustDistribution = [
    { range: '0-20% (Malicious)', count: 0, color: '#f43f5e' },
    { range: '21-40% (Untrusted)', count: 0, color: '#fb7185' },
    { range: '41-60% (Suspicious)', count: 0, color: '#f59e0b' },
    { range: '61-80% (Questionable)', count: 0, color: '#38bdf8' },
    { range: '81-100% (Trusted)', count: 0, color: '#10b981' },
  ];

  profiles.forEach(p => {
    const s = (p.currentTrustScore !== null && p.currentTrustScore !== undefined ? p.currentTrustScore : p.behaviorScore) * 100;
    if (s <= 20) trustDistribution[0].count++;
    else if (s <= 40) trustDistribution[1].count++;
    else if (s <= 60) trustDistribution[2].count++;
    else if (s <= 80) trustDistribution[3].count++;
    else trustDistribution[4].count++;
  });

  // Parse history chart (take last 20 evaluations, reverse for chronological order)
  const historyData = history.slice(0, 20).reverse().map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    behavior: parseFloat(((h.behaviorScore ?? 1.0) * 100).toFixed(1)),
    interaction: parseFloat(((h.historicalInteractionScore ?? 1.0) * 100).toFixed(1)),
    compliance: parseFloat(((h.securityComplianceScore ?? 1.0) * 100).toFixed(1)),
    trust: h.trustScore !== null && h.trustScore !== undefined ? parseFloat((h.trustScore * 100).toFixed(1)) : null,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card 
        title={`Historical Evaluation Timeline ${selectedNodeName ? `(${selectedNodeName})` : ''}`}
        subtitle="Tracking multi-dimensional trust drift & dynamic convergence"
        className="border-slate-800 bg-slate-900/50 backdrop-blur-md"
      >
        <div className="h-64 mt-2">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={8} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" name="Composite Trust" dataKey="trust" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Behavioral Score" dataKey="behavior" stroke="#0ea5e9" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" name="Interaction History" dataKey="interaction" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" name="Security Compliance" dataKey="compliance" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                No evaluation history recorded yet.
              </div>
            )}
          </div>
      </Card>

      <Card 
        title="Network Trust Score Distribution" 
        subtitle="Tier population spread across Malicious, Suspicious, and Trusted bounds"
        className="border-slate-800 bg-slate-900/50 backdrop-blur-md"
      >
        <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trustDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="range" stroke="#64748b" fontSize={9} tickMargin={8} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.5 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Nodes in Tier" radius={[4, 4, 0, 0]} barSize={36}>
                  {trustDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </Card>
    </div>
  );
};
