import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, Eye, Calendar, Printer } from 'lucide-react';
import { inspectionApi, reportsApi } from '../services/api';
import { InspectionRecord } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';

export const ReportsPage: React.FC = () => {
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  useEffect(() => {
    inspectionApi.getHistory(undefined, undefined, 50).then(data => {
      setInspections(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleDownloadReport = async (inspectionId: number) => {
    setGeneratingId(inspectionId);
    try {
      const rep = await reportsApi.generateReport(inspectionId);
      window.open(reportsApi.getDownloadUrl(rep.id), '_blank');
    } catch (err) {
      alert('Failed to generate PDF report.');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>Official QA Inspection Certificates</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated PDF compliance certificates compliant with ISO 9001:2015 and ASTM E155 casting standards.
          </p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Available Inspection Records ({inspections.length})
          </span>
          <span className="text-xs font-mono text-cyan-400">PDF Generator Engine: Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Product ID</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Defect Category</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Date Inspected</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inspections.map(insp => (
                <tr key={insp.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-cyan-300">{insp.product_code}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={insp.status} size="sm" />
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={insp.recommended_decision} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-slate-300">{insp.defect_type}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={insp.severity} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-cyan-400">
                    {(insp.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {new Date(insp.inspected_at).toLocaleDateString()} {new Date(insp.inspected_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDownloadReport(insp.id)}
                      disabled={generatingId === insp.id}
                      className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 rounded-lg border border-cyan-500/30 text-[11px] font-bold transition inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{generatingId === insp.id ? 'Generating...' : 'Download PDF'}</span>
                    </button>
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
