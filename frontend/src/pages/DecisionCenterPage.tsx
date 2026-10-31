import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Filter, History, SlidersHorizontal, UserCheck } from 'lucide-react';
import { decisionsApi, inspectionApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const DecisionCenterPage: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW'>('ALL');
  const [selectedDecision, setSelectedDecision] = useState<any | null>(null);
  const [overrideModal, setOverrideModal] = useState(false);
  const [newDecision, setNewDecision] = useState<'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW'>('ACCEPT');
  const [overrideReason, setOverrideReason] = useState('');
  const [reviewerName, setReviewerName] = useState('Lead QA Inspector');

  const loadDecisions = () => {
    decisionsApi.getHistory(50).then(data => {
      setDecisions(data);
    }).catch(console.error);
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const filteredDecisions = filter === 'ALL'
    ? decisions
    : decisions.filter(d => d.decision === filter);

  const handleOpenOverride = (dec: any) => {
    setSelectedDecision(dec);
    setNewDecision(dec.decision);
    setOverrideReason(dec.override_reason || '');
    setOverrideModal(true);
  };

  const handleSaveOverride = async () => {
    if (!selectedDecision) return;
    try {
      await decisionsApi.overrideDecision(
        selectedDecision.id,
        newDecision,
        overrideReason || 'Reviewed and approved by QA supervisor.',
        reviewerName
      );
      setOverrideModal(false);
      loadDecisions();
    } catch (err) {
      alert('Failed to override decision.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Smart Decision Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated verdict triage, ISO conformance verification, and human-in-the-loop QA sign-off.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
          {(['ALL', 'ACCEPT', 'MANUAL_REVIEW', 'REJECT'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === f ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Triage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-emerald-400 font-bold block uppercase">Auto-Accepted</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {decisions.filter(d => d.decision === 'ACCEPT').length}
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400/80" />
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-amber-400 font-bold block uppercase">Manual Review Queue</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {decisions.filter(d => d.decision === 'MANUAL_REVIEW').length}
            </span>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-400/80" />
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-rose-400 font-bold block uppercase">Mandatory Scrapped</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {decisions.filter(d => d.decision === 'REJECT').length}
            </span>
          </div>
          <XCircle className="w-8 h-8 text-rose-400/80" />
        </div>
      </div>

      {/* Decisions History Table */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Inspection Decision Audit Trail</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">{filteredDecisions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Product ID</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Approved By</th>
                <th className="py-2.5 px-3">Override Status</th>
                <th className="py-2.5 px-3">Decision Rationale</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDecisions.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-cyan-300">{d.product_code}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={d.decision} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={d.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-slate-300">{d.approved_by}</td>
                  <td className="py-3 px-3">
                    {d.is_override ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">
                        MANUAL OVERRIDE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        AI AUTOMATED
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-xs truncate" title={d.reason}>
                    {d.reason}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {new Date(d.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleOpenOverride(d)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-700 text-[11px] transition"
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDecisions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No decisions found for current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModal && selectedDecision && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <span>Modify Decision: {selectedDecision.product_code}</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">New Verdict</label>
              <div className="grid grid-cols-3 gap-2">
                {(['ACCEPT', 'MANUAL_REVIEW', 'REJECT'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setNewDecision(d)}
                    className={`py-2 text-xs font-mono font-bold rounded-lg border transition ${
                      newDecision === d
                        ? (d === 'ACCEPT' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : d === 'REJECT' ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-amber-500/20 border-amber-500 text-amber-300')
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Inspector Full Name / Credentials</label>
              <input
                type="text"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Audit Justification Notes</label>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                rows={3}
                placeholder="Reason for changing AI decision..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setOverrideModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOverride}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs font-mono"
              >
                Save Decision & Update State
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
