import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanEye,
  Box,
  FileSearch,
  CheckCircle2,
  BarChart3,
  Network,
  QrCode,
  FileText,
  Cpu,
  Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Live Inspection', path: '/inspection', icon: ScanEye },
  { name: '3D Virtual Cell', path: '/3d-prototype', icon: Box },
  { name: 'Defect Analysis', path: '/defect-analysis', icon: FileSearch },
  { name: 'Decision Center', path: '/decision-center', icon: CheckCircle2 },
  { name: 'Quality Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Root Cause (RCA)', path: '/root-cause', icon: Network },
  { name: 'QR Traceability', path: '/traceability', icon: QrCode },
  { name: 'PDF Reports', path: '/reports', icon: FileText },
  { name: 'AI Performance', path: '/model-performance', icon: Cpu },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800/80 min-h-[calc(100vh-61px)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
          Inspection Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/10 text-cyan-300 font-semibold border border-cyan-500/30 shadow-md shadow-cyan-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Production Line Hardware Footnote */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span>Camera FPS:</span>
          <span className="text-cyan-400 font-bold">39.0 FPS</span>
        </div>
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span>Inference Latency:</span>
          <span className="text-emerald-400 font-bold">25.6 ms</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Accuracy:</span>
          <span className="text-indigo-400 font-bold">96.9%</span>
        </div>
      </div>
    </aside>
  );
};
