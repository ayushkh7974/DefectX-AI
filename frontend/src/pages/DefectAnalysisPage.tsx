import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FileSearch, Layers, Target, ShieldAlert, Cpu, ArrowLeft, Download, Box } from 'lucide-react';
import { inspectionApi, reportsApi } from '../services/api';
import { InspectionRecord } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';

export const DefectAnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const idParam = searchParams.get('id');

  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [inspectionsList, setInspectionsList] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await inspectionApi.getHistory(undefined, undefined, 30);
        setInspectionsList(history);
        if (history.length > 0) {
          if (idParam) {
            const detail = await inspectionApi.getDetail(parseInt(idParam));
            setInspection(detail);
          } else {
            const firstDefective = history.find(i => i.status === 'DEFECTIVE') || history[0];
            const detail = await inspectionApi.getDetail(firstDefective.id);
            setInspection(detail);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [idParam]);

  const handleSelectRecord = async (id: number) => {
    setLoading(true);
    try {
      const detail = await inspectionApi.getDetail(id);
      setInspection(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-cyan-400" />
            <span>Quantitative Defect Analysis</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Spatial contour localization, defect morphology taxonomy, and pixel-level thermal intensity mapping.
          </p>
        </div>

        {inspection && (
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                const rep = await reportsApi.generateReport(inspection.id);
                window.open(reportsApi.getDownloadUrl(rep.id), '_blank');
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download PDF Certificate</span>
            </button>
            <Link
              to={`/3d-prototype?id=${inspection.id}`}
              className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
            >
              <Box className="w-4 h-4" />
              <span>View in 3D</span>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Inspection Selector List (4 cols) */}
        <div className="lg:col-span-4 bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono">
            <span className="font-bold text-slate-300">Defect Registry</span>
            <span className="text-slate-500">{inspectionsList.length} items</span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {inspectionsList.map((item) => {
              const active = inspection?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectRecord(item.id)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
                      <span>{item.product_code}</span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {item.defect_type}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={item.recommended_decision} size="sm" />
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Score: {item.anomaly_score.toFixed(2)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Deep Defect Report & Region Table (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {inspection ? (
            <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Header Details */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-lg font-bold text-white">{inspection.product_code}</span>
                    <StatusBadge status={inspection.recommended_decision} size="md" />
                    <StatusBadge status={inspection.severity} size="md" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspected on {new Date(inspection.inspected_at).toLocaleString()} • Model: PatchCore ResNet-18
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="text-slate-500 block">Anomaly Peak Score:</span>
                  <span className={`text-base font-bold ${inspection.anomaly_score > inspection.threshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {inspection.anomaly_score.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Tolerance: {inspection.threshold.toFixed(4)}</span>
                </div>
              </div>

              {/* Side-by-side Images with zoom borders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-xs font-mono text-slate-400 block mb-2">Original Surface</span>
                  <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                    <img src={inspection.image_path} alt="Original" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <span className="text-xs font-mono text-cyan-300 block mb-2">Annotated Anomaly Heatmap</span>
                  <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                    <img src={inspection.heatmap_path || inspection.image_path} alt="Heatmap" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Localized Defect Regions Table */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Localized Defect Regions & Coordinates</span>
                </h3>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Region ID</th>
                        <th className="py-2.5 px-3">Defect Subcategory</th>
                        <th className="py-2.5 px-3">Bounding Box (X, Y, W, H)</th>
                        <th className="py-2.5 px-3">Area (px²)</th>
                        <th className="py-2.5 px-3">Peak Intensity</th>
                        <th className="py-2.5 px-3">Anomaly Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {inspection.defects && inspection.defects.length > 0 ? (
                        inspection.defects.map((def, idx) => {
                          const loc = def.location_data || {};
                          return (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="py-2.5 px-3 font-bold text-cyan-400">#{idx + 1}</td>
                              <td className="py-2.5 px-3 text-slate-200">{def.defect_type}</td>
                              <td className="py-2.5 px-3 text-slate-400">
                                [{loc.x ?? '--'}, {loc.y ?? '--'}, {loc.width ?? '--'}, {loc.height ?? '--'}]
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">{loc.area ?? '--'}</td>
                              <td className="py-2.5 px-3 text-amber-400">{loc.intensity ?? '--'}</td>
                              <td className="py-2.5 px-3 text-rose-400 font-bold">{loc.ratio ? `${loc.ratio}x` : '--'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">
                            No discrete defect regions extracted. Component exhibits uniform surface purity.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Engineering Action Advisory */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Recommended Quality Action
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {inspection.decision?.reason || 'Component meets quality thresholds.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-500 font-mono text-xs">
              Select an inspection record from the list to examine deep defect telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
