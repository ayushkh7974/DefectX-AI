import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ScanEye,
  Box
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { analyticsApi, inspectionApi } from '../services/api';
import { OverviewStats, DefectDistributionItem, TrendItem, InspectionRecord } from '../services/types';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [defects, setDefects] = useState<DefectDistributionItem[]>([]);
  const [recentInspections, setRecentInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, trendsData, defectsData, historyData] = await Promise.all([
          analyticsApi.getOverview(),
          analyticsApi.getTrends(),
          analyticsApi.getDefects(),
          inspectionApi.getHistory(undefined, undefined, 8)
        ]);
        setStats(statsData);
        setTrends(trendsData);
        setDefects(defectsData);
        setRecentInspections(historyData);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Overview Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time quality assurance telemetry for automated mechanical casting cell.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/inspection"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            <ScanEye className="w-4 h-4" />
            <span>Launch Live Inspection</span>
          </Link>
          <Link
            to="/3d-prototype"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition"
          >
            <Box className="w-4 h-4 text-cyan-400" />
            <span>3D Virtual Cell</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Inspected"
          value={stats?.total_inspected ?? '--'}
          subtitle="Continuous automated throughput"
          icon={Layers}
          accentColor="text-cyan-400"
        />
        <MetricCard
          title="Accepted (Yield)"
          value={`${stats?.accepted_count ?? 0} (${stats?.today_yield ?? 100}%)`}
          subtitle="Passes ISO 9001 tolerance"
          icon={CheckCircle2}
          accentColor="text-emerald-400"
        />
        <MetricCard
          title="Rejected Products"
          value={stats?.rejected_count ?? '--'}
          subtitle="Critical porosity / cracks"
          icon={XCircle}
          accentColor="text-rose-400"
        />
        <MetricCard
          title="Manual Review"
          value={stats?.manual_review_count ?? '--'}
          subtitle="Pending inspector confirmation"
          icon={AlertTriangle}
          accentColor="text-amber-400"
        />
        <MetricCard
          title="Defect Rate"
          value={`${stats?.defect_rate ?? 0}%`}
          subtitle={`Avg Latency: ${stats?.avg_inference_ms ?? 25.6} ms`}
          icon={TrendingUp}
          accentColor="text-indigo-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Quality Trend (2 cols) */}
        <div className="lg:col-span-2 bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Production Quality Trend</h2>
              <p className="text-xs text-slate-400">Accepted vs Rejected casting volume over time</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">Live 14-Day Rolling Window</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.length > 0 ? trends : [
                { date: 'Day 1', accepted: 42, rejected: 2 },
                { date: 'Day 2', accepted: 48, rejected: 3 },
                { date: 'Day 3', accepted: 55, rejected: 1 },
                { date: 'Day 4', accepted: 60, rejected: 4 },
                { date: 'Day 5', accepted: 52, rejected: 2 },
                { date: 'Day 6', accepted: 58, rejected: 3 },
                { date: 'Day 7', accepted: 64, rejected: 2 }
              ]}>
                <defs>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="accepted" stroke="#10b981" fillOpacity={1} fill="url(#colorAccepted)" name="Accepted" />
                <Area type="monotone" dataKey="rejected" stroke="#ef4444" fillOpacity={1} fill="url(#colorRejected)" name="Rejected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Distribution Donut (1 col) */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white font-mono">Defect Distribution</h2>
            <p className="text-xs text-slate-400">Classification by anomaly morphology</p>
          </div>
          <div className="h-52 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defects.length > 0 ? defects : [
                    { defect_type: 'Pinhole / Blowhole', percentage: 38 },
                    { defect_type: 'Surface Crack', percentage: 28 },
                    { defect_type: 'Molding Burr / Fin', percentage: 20 },
                    { defect_type: 'Shrinkage Cavity', percentage: 14 }
                  ]}
                  dataKey="percentage"
                  nameKey="defect_type"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {(defects.length > 0 ? defects : [1,2,3,4]).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono">Recent Inspections</h2>
            <p className="text-xs text-slate-400">Live feed from continuous vision station</p>
          </div>
          <Link to="/inspection" className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            <span>View Full History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Product ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Defect Type</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Anomaly Score</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentInspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-cyan-300">{insp.product_code}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={insp.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-slate-300">{insp.defect_type}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={insp.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className={insp.anomaly_score > insp.threshold ? 'text-rose-400' : 'text-emerald-400'}>
                      {insp.anomaly_score.toFixed(3)}
                    </span>
                    <span className="text-slate-500 text-[10px] ml-1">/ {insp.threshold.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={insp.recommended_decision} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {new Date(insp.inspected_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/defect-analysis?id=${insp.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[11px] transition"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
              {recentInspections.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No inspection records found. Launch an inspection above to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
