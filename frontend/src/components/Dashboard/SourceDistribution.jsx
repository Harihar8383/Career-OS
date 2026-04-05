// frontend/src/components/Dashboard/SourceDistribution.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Bot, FileSearch, PenLine } from 'lucide-react';

const SOURCE_CONFIG = [
  { key: 'hunter', label: 'Job Hunter', color: '#3b82f6', icon: Bot },
  { key: 'matcher', label: 'JD Matcher', color: '#8b5cf6', icon: FileSearch },
  { key: 'manual', label: 'Manual', color: '#6b7280', icon: PenLine },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-2.5 shadow-xl text-sm">
      <p className="font-semibold text-text-primary">{d.name}</p>
      <p className="text-text-secondary">{d.value} jobs</p>
    </div>
  );
};

export default function SourceDistribution({ distribution = {} }) {
  const total = Object.values(distribution).reduce((s, v) => s + v, 0);

  if (total === 0) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col items-center justify-center text-text-secondary">
        <PenLine className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No tracked jobs yet</p>
      </div>
    );
  }

  const chartData = SOURCE_CONFIG
    .map(s => ({ name: s.label, value: distribution[s.key] || 0, color: s.color }))
    .filter(d => d.value > 0);

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full">
      <h3 className="text-lg font-clash-display font-medium text-text-primary mb-2">Job Sources</h3>

      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {SOURCE_CONFIG.map(s => {
            const count = distribution[s.key] || 0;
            if (count === 0) return null;
            const pct = Math.round((count / total) * 100);
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <Icon className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-xs text-text-primary font-medium flex-1">{s.label}</span>
                <span className="text-xs text-text-secondary tabular-nums">{count}</span>
                <span className="text-[10px] text-text-secondary tabular-nums w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
