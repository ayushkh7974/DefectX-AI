import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'text-cyan-400'
}) => {
  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-sm border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-200 shadow-lg relative overflow-hidden group">
      {/* Background glow accent */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 ${accentColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">{value}</div>
        {trend && (
          <span
            className={`text-xs font-mono font-medium flex items-center gap-0.5 ${
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};
