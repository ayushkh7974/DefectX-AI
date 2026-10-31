import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Sliders, Bell, Cpu, User, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [lowRatio, setLowRatio] = useState(1.15);
  const [highRatio, setHighRatio] = useState(1.45);
  const [autoDecision, setAutoDecision] = useState(true);
  const [saveHeatmaps, setSaveHeatmaps] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [inspectorName, setInspectorName] = useState('Lead QA Inspector');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            <span>Inspection Engine & Calibration Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure anomaly sensitivity, severity boundary multipliers, and hardware notification triggers.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-mono">
          ✓ Configuration updated and applied to vision inference pipeline.
        </div>
      )}

      {/* Model Calibration Parameters */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>AI Decision & Severity Thresholds</span>
        </h2>

        <div className="space-y-4">
          {/* Confidence Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300">Minimum Accept Confidence Threshold:</span>
              <span className="text-cyan-400 font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={confidenceThreshold}
              onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-[11px] text-slate-500">
              Inspections with confidence below this threshold are routed to MANUAL REVIEW.
            </span>
          </div>

          {/* Severity Multipliers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Low-to-Medium Severity Anomaly Ratio
              </label>
              <input
                type="number"
                step="0.05"
                value={lowRatio}
                onChange={e => setLowRatio(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 1.15x Anomaly Threshold</span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                High / Critical Severity Rejection Ratio
              </label>
              <input
                type="number"
                step="0.05"
                value={highRatio}
                onChange={e => setHighRatio(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 1.45x Anomaly Threshold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Automation Preferences */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2 pb-2 border-b border-slate-800">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span>Automation & Factory Line Triggers</span>
        </h2>

        <div className="space-y-3 font-mono text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-bold block">Autonomous Verdict Execution</span>
              <span className="text-slate-500 text-[11px]">Directly route parts without waiting for manual confirmation</span>
            </div>
            <input
              type="checkbox"
              checked={autoDecision}
              onChange={e => setAutoDecision(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-bold block">Save High-Resolution Anomaly Heatmaps</span>
              <span className="text-slate-500 text-[11px]">Store thermal visualization for long-term ISO compliance</span>
            </div>
            <input
              type="checkbox"
              checked={saveHeatmaps}
              onChange={e => setSaveHeatmaps(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <span className="text-slate-200 font-bold block">Audible Conveyor Defect Alarm</span>
              <span className="text-slate-500 text-[11px]">Trigger factory floor acoustic horn on CRITICAL / HIGH severity defects</span>
            </div>
            <input
              type="checkbox"
              checked={audioAlerts}
              onChange={e => setAudioAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-800 border-slate-700"
            />
          </label>
        </div>
      </div>

      {/* Inspector Profile */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2 pb-2 border-b border-slate-800">
          <User className="w-4 h-4 text-cyan-400" />
          <span>Operator & Quality Inspector Profile</span>
        </h2>

        <div>
          <label className="block text-xs font-mono text-slate-300 mb-1">Lead Inspector Name</label>
          <input
            type="text"
            value={inspectorName}
            onChange={e => setInspectorName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>
    </div>
  );
};
