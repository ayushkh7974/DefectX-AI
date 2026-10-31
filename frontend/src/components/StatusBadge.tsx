import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size];

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'ACCEPT' || s === 'OK' || s === 'HEALTHY' || s === 'PASS') {
    colorClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (s === 'REJECT' || s === 'DEFECTIVE' || s === 'HIGH' || s === 'CRITICAL' || s === 'FAIL') {
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (s === 'MANUAL_REVIEW' || s === 'MEDIUM' || s === 'WARNING' || s === 'WARN') {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (s === 'LOW' || s === 'INFO') {
    colorClasses = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wide ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {s.replace('_', ' ')}
    </span>
  );
};
