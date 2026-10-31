import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Sliders, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { InspectionStation3D } from '../visualization3d/InspectionStation3D';
import { inspectionApi } from '../services/api';
import { InspectionRecord } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';

export const Visualization3DPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const inspectionIdParam = searchParams.get('id');

  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModel, setActiveModel] = useState<'impeller' | 'flange' | 'casing'>('impeller');

  useEffect(() => {
    inspectionApi.getHistory(undefined, undefined, 20).then(data => {
      setInspections(data);
      if (data.length > 0) {
        if (inspectionIdParam) {
          const match = data.find(i => i.id === parseInt(inspectionIdParam));
          setSelectedInspection(match || data[0]);
        } else {
          setSelectedInspection(data[0]);
        }
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [inspectionIdParam]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Box className="w-6 h-6 text-cyan-400" />
            <span>Interactive 3D Inspection Station</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time digital twin mapping 2D AI defect localization coordinates onto mechanical casting CAD geometries.
          </p>
        </div>

        {/* Selected Component Status */}
        {selectedInspection && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-mono text-xs">
            <span className="text-slate-400">Inspecting:</span>
            <span className="font-bold text-cyan-300">{selectedInspection.product_code}</span>
            <StatusBadge status={selectedInspection.recommended_decision} size="sm" />
          </div>
        )}
      </div>

      {/* Main 3D Viewport */}
      <InspectionStation3D
        status={selectedInspection?.status || 'OK'}
        decision={selectedInspection?.recommended_decision || 'ACCEPT'}
        severity={selectedInspection?.severity || 'NONE'}
        confidence={selectedInspection?.confidence || 0.95}
        defectRegions={selectedInspection?.regions || []}
        activeModelType={activeModel}
        onModelChange={setActiveModel}
      />

      {/* Component Queue Bar (Pick another inspection to test 3D scene reactivity) */}
      <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Select Component from Inspection Queue
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any component below to observe real-time 3D station reactivity (Andon beacons, defect markers, laser scan)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{inspections.length} recorded</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {inspections.map((insp) => {
            const isSelected = selectedInspection?.id === insp.id;
            return (
              <button
                key={insp.id}
                onClick={() => setSelectedInspection(insp)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-white truncate">{insp.product_code}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      insp.recommended_decision === 'ACCEPT'
                        ? 'bg-emerald-400'
                        : insp.recommended_decision === 'REJECT'
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  <div>Defect: {insp.defect_type.slice(0, 14)}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Score: {insp.anomaly_score.toFixed(2)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
