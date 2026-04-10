// frontend/src/components/Dashboard/MatchScoreTrend.jsx
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { Target, Sparkles, Briefcase } from 'lucide-react';

// Sleek, minimal pill-shaped tooltip
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  // Determine dot color based on score threshold
  const dotColor = d.score >= 75 ? 'bg-emerald-400' : d.score >= 50 ? 'bg-amber-400' : 'bg-rose-400';
  const glowColor = d.score >= 75 ? 'shadow-[0_0_8px_rgba(52,211,153,0.5)]' : d.score >= 50 ? 'shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'shadow-[0_0_8px_rgba(244,63,94,0.5)]';

  return (
    <div className="bg-bg-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 shadow-2xl min-w-[200px]">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/70">
          {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-white tabular-nums">{d.score}%</span>
          <div className={`w-2 h-2 rounded-full ${dotColor} ${glowColor}`} />
        </div>
      </div>

      <p className="font-semibold text-sm text-white leading-tight mb-1 truncate">
        {d.jobTitle}
      </p>
      <div className="flex items-center gap-1.5 text-text-secondary text-xs">
        <Briefcase className="w-3 h-3 opacity-50" />
        <span className="truncate opacity-80">{d.company}</span>
      </div>
    </div>
  );
};

export default function MatchScoreTrend({ data = [] }) {
  // Premium Empty State
  if (!data || data.length === 0) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-3xl p-6 h-full flex flex-col relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <h3 className="text-2xl font-clash-display font-medium text-text-primary leading-none mb-2">
          Match Score Trend
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-2 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] relative z-10 border border-transparent group-hover:border-border-primary/50 transition-colors duration-500">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
            <div className="relative w-14 h-14 bg-bg-card border border-border-primary rounded-2xl flex items-center justify-center shadow-sm">
              <Target className="w-6 h-6 text-text-secondary" />
            </div>
          </div>
          <p className="text-sm font-semibold text-text-primary">Awaiting Data</p>
          <p className="text-xs text-text-secondary mt-1.5 max-w-[220px] leading-relaxed">
            Run your first AI resume match to visualize your compatibility trend over time.
          </p>
        </div>
      </div>
    );
  }

  // Get up to the 10 most recent scores
  const sortedData = [...data]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10);

  const chartData = sortedData.map((d, index) => {
    const currentDate = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const prevDate = index > 0 ? new Date(sortedData[index - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

    return {
      ...d,
      displayLabel: currentDate === prevDate ? '' : currentDate,
      index
    };
  });

  const avgScore = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);
  const bestScore = Math.max(...data.map(d => d.score));

  return (
    <div className="bg-bg-card border border-border-primary rounded-3xl p-6 h-full flex flex-col shadow-sm relative overflow-hidden">
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Editorial Style Header */}
      <div className="flex items-end justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-clash-display font-medium text-text-primary leading-none mb-2">
            Match Score Trend
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Evaluation History</span>
          </div>
        </div>

        {/* Stark, minimalist typography for metrics */}
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mb-1 opacity-60">Average</p>
            <p className="text-2xl font-black text-text-primary tabular-nums leading-none">
              {avgScore}<span className="text-sm text-text-secondary font-semibold ml-0.5">%</span>
            </p>
          </div>
          <div className="w-[1px] h-8 bg-border-primary self-center" />
          <div>
            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest mb-1 opacity-60">Peak</p>
            <p className="text-2xl font-black text-emerald-500 tabular-nums leading-none">
              {bestScore}<span className="text-sm text-emerald-500/60 font-semibold ml-0.5">%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 min-h-[200px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              {/* Complex gradient for deep visual hierarchy */}
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>

              {/* Real SVG Glow Filter for the line */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Highly subtle dotted grid */}
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.06} strokeDasharray="1 6" />

            {/* Benchmark Line - Tells the user what "Good" looks like */}
            <ReferenceLine
              y={75}
              stroke="currentColor"
              strokeOpacity={0.15}
              strokeDasharray="4 4"
              label={{
                position: 'insideBottomLeft',
                value: 'TARGET MATCH (75%)',
                fill: 'currentColor',
                opacity: 0.4,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
            />

            <XAxis
              dataKey="index"
              tickFormatter={(val) => chartData[val]?.displayLabel || ''}
              tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              minTickGap={10}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'currentColor', strokeOpacity: 0.1, strokeWidth: 1, strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />

            <Area
              type="monotoneX"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorScore)"
              animationDuration={1000}
              animationEasing="ease-out"
              activeDot={{
                r: 6,
                fill: '#ffffff',
                stroke: '#3b82f6',
                strokeWidth: 3
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}