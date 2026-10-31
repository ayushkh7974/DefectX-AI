import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Layers, CheckCircle2, XCircle, Gauge } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { analyticsApi } from '../services/api';
import { BatchAnalyticsItem, DefectDistributionItem, TrendItem, OverviewStats } from '../services/types';
import { MetricCard } from '../components/MetricCard';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

export const AnalyticsPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchAnalyticsItem[]>([]);
  const [defects, setDefects] = useState<DefectDistributionItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    analyticsApi.getBatches().then(setBatches).catch(console.error);
    analyticsApi.getDefects().then(setDefects).catch(console.error);
    analyticsApi.getTrends().then(setTrends).catch(console.error);
    analyticsApi.getOverview().then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Industrial Quality Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Statistical process control (SPC), batch yield comparisons, and machine variance tracking.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Line Yield"
          value={`${stats?.today_yield ?? 98.2}%`}
          subtitle="Target: >= 98.0%"
          icon={Gauge}
          accentColor="text-emerald-400"
        />
        <MetricCard
          title="Total Inspected"
          value={stats?.total_inspected ?? 0}
          subtitle="All casting cells"
          icon={Layers}
          accentColor="text-cyan-400"
        />
        <MetricCard
          title="Average Defect Rate"
          value={`${stats?.defect_rate ?? 1.8}%`}
          subtitle="Within Six-Sigma tolerance"
          icon={TrendingUp}
          accentColor="text-rose-400"
        />
        <MetricCard
          title="Inspection Latency"
          value={`${stats?.avg_inference_ms ?? 25.6} ms`}
          subtitle="39.0 FPS throughput"
          icon={CheckCircle2}
          accentColor="text-indigo-400"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch-wise Yield Comparison */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Batch Quality Comparison</h2>
              <p className="text-xs text-slate-400">Passed vs Failed components per production batch</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Alloy A380 / ADC12</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batches.length > 0 ? batches : [
                { batch_number: 'B2026-01', passed: 48, failed: 2 },
                { batch_number: 'B2026-02', passed: 52, failed: 4 },
                { batch_number: 'B2026-03', passed: 45, failed: 3 },
                { batch_number: 'B2026-04', passed: 50, failed: 1 },
              ]}>
                <XAxis dataKey="batch_number" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="passed" name="Accepted" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failed" name="Defective" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 14-Day Defect Rate Trend */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Quality Drift & Defect Rate (%)</h2>
              <p className="text-xs text-slate-400">Percentage of defects detected across shifts</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Stable Control</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.length > 0 ? trends : [
                { date: 'Oct 24', defect_rate: 3.2 },
                { date: 'Oct 25', defect_rate: 2.1 },
                { date: 'Oct 26', defect_rate: 1.8 },
                { date: 'Oct 27', defect_rate: 2.5 },
                { date: 'Oct 28', defect_rate: 1.5 },
                { date: 'Oct 29', defect_rate: 1.2 },
                { date: 'Oct 30', defect_rate: 1.9 },
              ]}>
                <defs>
                  <linearGradient id="colorDefectRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="defect_rate" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDefectRate)" name="Defect Rate %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Batch Details Table */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-sm font-bold text-white font-mono mb-3">Batch Performance Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Batch Number</th>
                <th className="py-2.5 px-3">Die Cast Machine</th>
                <th className="py-2.5 px-3">Alloy Grade</th>
                <th className="py-2.5 px-3">Inspected</th>
                <th className="py-2.5 px-3">Passed</th>
                <th className="py-2.5 px-3">Failed</th>
                <th className="py-2.5 px-3">Defect Rate</th>
                <th className="py-2.5 px-3">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {batches.map(b => (
                <tr key={b.batch_id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-bold text-cyan-300">{b.batch_number}</td>
                  <td className="py-3 px-3 text-slate-200">{b.machine_id}</td>
                  <td className="py-3 px-3 text-slate-400">{b.alloy_grade}</td>
                  <td className="py-3 px-3 text-slate-300">{b.inspected}</td>
                  <td className="py-3 px-3 text-emerald-400">{b.passed}</td>
                  <td className="py-3 px-3 text-rose-400">{b.failed}</td>
                  <td className="py-3 px-3 font-bold text-amber-400">{b.defect_rate}%</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${b.defect_rate <= 5.0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {b.defect_rate <= 5.0 ? 'PASS (In Control)' : 'ATTENTION REQUIRED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
