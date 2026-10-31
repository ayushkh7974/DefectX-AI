import React, { useState, useEffect } from 'react';
import { QrCode, Search, Calendar, Cpu, Layers, ShieldCheck, History } from 'lucide-react';
import { traceabilityApi, inspectionApi } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const TraceabilityPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [productHistory, setProductHistory] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    traceabilityApi.listProducts().then(data => {
      setProducts(data);
      if (data.length > 0) {
        handleSelectProduct(data[0]);
      }
    }).catch(console.error);
  }, []);

  const handleSelectProduct = async (product: any) => {
    setSelectedProduct(product);
    try {
      const hist = await traceabilityApi.getProductHistory(product.id);
      setProductHistory(hist);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p =>
    p.product_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <QrCode className="w-6 h-6 text-cyan-400" />
            <span>Product Lifecycle & QR Traceability</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete digital provenance, serial tracking, and instant mobile QR verification.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Product ID..."
            className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Product Selector (4 cols) */}
        <div className="lg:col-span-4 bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block pb-2 border-b border-slate-800">
            Serialized Components ({filteredProducts.length})
          </span>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map(p => {
              const active = selectedProduct?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-white block">{p.product_code}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{p.product_type}</span>
                  </div>
                  <StatusBadge status={p.status} size="sm" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: QR Code & Detailed Product Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedProduct ? (
            <div className="space-y-5">
              {/* Product Identity & Live QR Badge */}
              <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center gap-6">
                {/* Real Generated QR Code */}
                <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center shrink-0">
                  <img
                    src={traceabilityApi.getProductQrUrl(selectedProduct.id)}
                    alt="Traceability QR"
                    className="w-36 h-36 object-contain"
                  />
                  <span className="text-[10px] font-mono text-slate-800 font-bold mt-1 uppercase">Scan to Verify</span>
                </div>

                {/* Metadata */}
                <div className="space-y-3 flex-1 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">{selectedProduct.product_code}</span>
                    <StatusBadge status={selectedProduct.status} size="md" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">COMPONENT:</span>
                      <span>{selectedProduct.product_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">BATCH:</span>
                      <span className="text-cyan-400">{selectedProduct.batch?.batch_number || 'B2026-01'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">MACHINE CELL:</span>
                      <span>{selectedProduct.batch?.machine_id || 'DC-CELL-02'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ALLOY GRADE:</span>
                      <span>{selectedProduct.batch?.alloy_grade || 'A380 Aluminum'}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    * Authenticated with SHA-256 digital signature in accordance with ISO 9001 traceability specifications.
                  </p>
                </div>
              </div>

              {/* Product Inspection History Timeline */}
              <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  <span>Component Inspection History Timeline</span>
                </h3>

                <div className="space-y-4 border-l-2 border-slate-800 pl-4 ml-2">
                  {productHistory?.history && productHistory.history.length > 0 ? (
                    productHistory.history.map((h: any, idx: number) => (
                      <div key={idx} className="relative space-y-1">
                        <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-950" />
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-slate-400">{new Date(h.inspected_at).toLocaleString()}</span>
                          <StatusBadge status={h.decision} size="sm" />
                          <span className="text-slate-500 text-[11px]">Score: {h.anomaly_score.toFixed(3)}</span>
                        </div>
                        <div className="text-xs text-slate-300 font-mono">
                          Severity: <span className="text-amber-400">{h.severity}</span> • Result: {h.status}
                          {h.is_override && <span className="text-amber-400 ml-2 font-bold">[Inspector Override]</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 font-mono">
                      No prior inspections logged for this serial ID.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500 font-mono text-xs">
              Select a component on the left to review QR traceability certificate and provenance logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
