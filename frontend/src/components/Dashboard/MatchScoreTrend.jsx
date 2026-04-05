// frontend/src/components/Dashboard/MatchScoreTrend.jsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-bg-card border border-border-primary rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-text-primary">{d.jobTitle}</p>
      <p className="text-text-secondary text-xs">{d.company}</p>
      <p className="text-blue-400 font-bold mt-1">{d.score}%</p>
      <p className="text-text-secondary text-xs mt-0.5">{new Date(d.date).toLocaleDateString()}</p>
    </div>
  );
};

export default function MatchScoreTrend({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col items-center justify-center text-text-secondary">
        <TrendingUp className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No JD analyses yet</p>
        <p className="text-xs mt-1 opacity-60">Run your first JD match to see trends</p>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const avgScore = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);
  const bestScore = Math.max(...data.map(d => d.score));

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-clash-display font-medium text-text-primary">Match Score Trend</h3>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span>Avg: <b className="text-text-primary">{avgScore}%</b></span>
          <span>Best: <b className="text-green-400">{bestScore}%</b></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" />
          <XAxis dataKey="label" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} fill="url(#scoreGradient)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'var(--color-bg-card)' }} activeDot={{ r: 6 }} />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-xs text-text-secondary mt-3 text-center">{data.length} analyses total</p>
    </div>
  );
}
