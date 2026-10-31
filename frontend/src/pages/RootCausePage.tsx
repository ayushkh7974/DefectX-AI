import React, { useState, useEffect } from 'react';
import { Network, AlertOctagon, CheckCircle2, Wrench, ShieldCheck, Flame, Cpu, ArrowRight } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { RootCauseData, RootCauseAlert, RootCauseKnowledge } from '../services/types';

export const RootCausePage: React.FC = () => {
  const [rcaData, setRcaData] = useState<RootCauseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getRootCause().then(data => {
      setRcaData(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Network className="w-6 h-6 text-cyan-400" />
            <span>Root Cause Analysis & Predictive Insights</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Machine-level statistical anomaly correlations, physical defect mechanics, and corrective action protocols.
          </p>
        </div>
      </div>

      {/* Machine Investigation Alerts */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span>Machine Investigation Alerts</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rcaData?.alerts && rcaData.alerts.length > 0 ? (
            rcaData.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                } space-y-4 shadow-xl`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white font-mono">{alert.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{alert.description}</p>

                {/* Suspected Causes */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-amber-400 font-mono font-bold block mb-1 text-[11px] uppercase">
                    ⚠ Suspected Causes (Requires Physical Verification):
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    {alert.suspected_causes.map((sc, i) => (
                      <li key={i}>{sc}</li>
                    ))}
                  </ul>
                </div>

                {/* Confirmed Causes */}
                {alert.confirmed_causes.length > 0 && (
                  <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-800/40 text-xs">
                    <span className="text-rose-400 font-mono font-bold block mb-1 text-[11px] uppercase">
                      ✓ Confirmed Metallurgical Causes:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-200 text-[11px]">
                      {alert.confirmed_causes.map((cc, i) => (
                        <li key={i}>{cc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Corrective Maintenance Actions */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-emerald-400 font-mono font-bold block mb-1 text-[11px] uppercase flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Suggested Corrective Actions:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                    {alert.investigation_steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center text-xs font-mono text-slate-400">
              No active machine drift alerts detected. All casting cells within nominal statistical boundaries.
            </div>
          )}
        </div>
      </div>

      {/* Casting Defect Physics & Corrective Taxonomy */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          <span>Defect Taxonomy & Metallurgy Knowledge Base</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rcaData?.knowledge_base.map((kb, idx) => (
            <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-xs text-cyan-300 font-mono">{kb.defect_type}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Freq: {kb.common_percentage}%
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block mb-1">
                  Root Causes:
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                  {kb.suspected_causes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                  Mitigation Protocol:
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5">
                  {kb.corrective_actions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
