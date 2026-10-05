import React from 'react';
import { Card } from '@/components/common/Card';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, Legend } from 'recharts';

interface TrustVisualizationsProps {
  profiles: any[];
  history: any[];
}

export const TrustVisualizations: React.FC<TrustVisualizationsProps> = ({ profiles, history }) => {
  // Aggregate profiles for distribution chart
  const behaviorDistribution = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 },
  ];

  profiles.forEach(p => {
    const s = p.behaviorScore * 100;
    if (s <= 20) behaviorDistribution[0].count++;
    else if (s <= 40) behaviorDistribution[1].count++;
    else if (s <= 60) behaviorDistribution[2].count++;
    else if (s <= 80) behaviorDistribution[3].count++;
    else behaviorDistribution[4].count++;
  });

  // Parse history chart (take last 20 evaluations, reverse for chronological order)
  const historyData = history.slice(0, 20).reverse().map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    behavior: parseFloat((h.behaviorScore * 100).toFixed(1)),
    interaction: parseFloat((h.historicalInteractionScore * 100).toFixed(1)),
    compliance: parseFloat((h.securityComplianceScore * 100).toFixed(1)),
    trust: h.trustScore !== null ? parseFloat((h.trustScore * 100).toFixed(1)) : null,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Historical Evaluation Timeline (Selected Node)" className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="h-64 mt-2">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={8} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" name="Trust Score" dataKey="trust" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Behavior" dataKey="behavior" stroke="#0ea5e9" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  <Line type="monotone" name="History" dataKey="interaction" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  <Line type="monotone" name="Compliance" dataKey="compliance" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                No evaluation history recorded yet.
              </div>
            )}
          </div>
      </Card>

      <Card title="Network-wide Behavior Distribution" className="border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={behaviorDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickMargin={8} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Nodes" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </Card>
    </div>
  );
};
