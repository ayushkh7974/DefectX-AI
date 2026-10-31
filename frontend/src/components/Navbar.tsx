import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Bell, Activity, Cpu, ShieldCheck } from 'lucide-react';
import { notificationsApi, modelApi } from '../services/api';
import { NotificationItem, ModelStatus } from '../services/types';

export const Navbar: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  useEffect(() => {
    notificationsApi.list().then(setNotifications).catch(() => {});
    modelApi.getStatus().then(setModelStatus).catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="flex items-center justify-between">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white font-mono">INTELLIINSPECT<span className="text-cyan-400">.AI</span></span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded">v2.0</span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">Intelligent Vision. Automated Inspection. Better Manufacturing.</p>
            </div>
          </Link>
        </div>

        {/* Center Status Badges */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Line 2 (Active Conveyor)</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Model: {modelStatus?.loaded ? 'PatchCore ResNet-18 (Online)' : 'Initializing...'}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>ISO 9001 Compliant</span>
          </div>
        </div>

        {/* Right Tools & Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              title="Factory Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono">
                  <span className="font-bold text-slate-200">System Alerts</span>
                  <span className="text-slate-500">{notifications.length} total</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2 rounded bg-slate-800/60 border border-slate-700/50 text-xs">
                      <div className="font-semibold text-slate-200 flex items-center justify-between">
                        <span>{n.title}</span>
                        <span className={`text-[10px] px-1 rounded ${n.type === 'ALERT' ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                          {n.type}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">No active alerts.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
              QA
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight">Lead QA Inspector</div>
              <div className="text-[10px] text-slate-400 leading-tight font-mono">Station #1 • Level 3</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
