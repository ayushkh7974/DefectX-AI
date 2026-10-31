import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { CastingComponentModel } from './CastingComponentModel';
import { ConveyorBelt } from './ConveyorBelt';
import { DefectRegion } from '../services/types';

interface InspectionStation3DProps {
  status?: 'OK' | 'DEFECTIVE' | 'PENDING';
  decision?: 'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW' | 'PENDING';
  severity?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  confidence?: number;
  defectRegions?: DefectRegion[];
  activeModelType?: 'impeller' | 'flange' | 'casing';
  onModelChange?: (type: 'impeller' | 'flange' | 'casing') => void;
}

// Optical camera gantry and laser scanning beam
const InspectionGantry: React.FC<{ isScanning: boolean; decision: string }> = ({ isScanning, decision }) => {
  const laserRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (laserRef.current && isScanning) {
      laserRef.current.position.z = Math.sin(state.clock.elapsedTime * 2.5) * 1.2;
    }
  });

  const beamColor = decision === 'REJECT' ? '#ef4444' : (decision === 'MANUAL_REVIEW' ? '#f59e0b' : '#06b6d4');

  return (
    <group position={[0, 0, 0]}>
      {/* Gantry Arch Frame */}
      <mesh position={[-2.4, 1.8, 0]} castShadow>
        <boxGeometry args={[0.2, 4.0, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[2.4, 1.8, 0]} castShadow>
        <boxGeometry args={[0.2, 4.0, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[5.0, 0.25, 0.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Industrial Optical Inspection Camera Rig */}
      <group position={[0, 3.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.6, 0.8]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Camera Lens */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.22, 0.25, 0.2, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* LED Ring Light */}
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.38, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Sweeping Laser Beam Sheet */}
      {isScanning && (
        <mesh ref={laserRef} position={[0, 1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 0.08]} />
          <meshBasicMaterial color={beamColor} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Andon Signal Light Tower */}
      <group position={[2.4, 3.8, 0]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        {/* Red Light */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 16]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={decision === 'REJECT' ? 3.0 : 0.2}
          />
        </mesh>
        {/* Amber / Yellow Light */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 16]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={decision === 'MANUAL_REVIEW' ? 3.0 : 0.2}
          />
        </mesh>
        {/* Green Light */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 16]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={decision === 'ACCEPT' ? 3.0 : 0.2}
          />
        </mesh>
      </group>
    </group>
  );
};

export const InspectionStation3D: React.FC<InspectionStation3DProps> = ({
  status = 'OK',
  decision = 'ACCEPT',
  severity = 'NONE',
  confidence = 0.95,
  defectRegions = [],
  activeModelType = 'impeller',
  onModelChange
}) => {
  const [isRotating, setIsRotating] = useState(true);
  const [isScanning, setIsScanning] = useState(true);
  const [modelType, setModelType] = useState<'impeller' | 'flange' | 'casing'>(activeModelType);

  const handleModelSelect = (type: 'impeller' | 'flange' | 'casing') => {
    setModelType(type);
    if (onModelChange) onModelChange(type);
  };

  return (
    <div className="relative w-full h-[580px] bg-[#070b14] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* 3D Scene Controls HUD */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition ${
            isRotating ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}
        >
          {isRotating ? 'Auto-Rotate: ON' : 'Auto-Rotate: OFF'}
        </button>

        <button
          onClick={() => setIsScanning(!isScanning)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition ${
            isScanning ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800/80 text-slate-400 border-slate-700'
          }`}
        >
          {isScanning ? 'Laser Scan: ACTIVE' : 'Laser Scan: OFF'}
        </button>

        {/* Component Selector */}
        <div className="flex bg-slate-900/80 border border-slate-700 rounded-lg p-0.5">
          {(['impeller', 'flange', 'casing'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleModelSelect(t)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition ${
                modelType === t ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Quality Telemetry HUD (Top Right) */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg max-w-xs text-xs">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-slate-400 uppercase tracking-wider font-mono text-[10px]">3D Station Telemetry</span>
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase text-[11px] ${
              decision === 'ACCEPT'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : decision === 'REJECT'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {decision}
          </span>
        </div>

        <div className="space-y-1 font-mono text-[11px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Component:</span>
            <span className="text-slate-200 capitalize">{modelType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Defect State:</span>
            <span className={status === 'DEFECTIVE' ? 'text-rose-400' : 'text-emerald-400'}>{status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Severity:</span>
            <span className="text-amber-400">{severity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Confidence:</span>
            <span className="text-cyan-400">{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">3D Markers:</span>
            <span className="text-slate-200">{defectRegions.length > 0 ? `${defectRegions.length} Localized` : 'None'}</span>
          </div>
        </div>

        {status === 'DEFECTIVE' && defectRegions.length > 0 && (
          <p className="mt-2 text-[10px] text-cyan-400/90 italic">
            * Pulsing 3D pins mapped to localized anomaly coordinates
          </p>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none text-[11px] font-mono text-slate-500">
        Left Click + Drag to Rotate • Right Click to Pan • Scroll to Zoom
      </div>

      {/* 3D Canvas */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3.8, 3.2, 4.5]} fov={45} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={2.5}
          maxDistance={12}
        />

        {/* Industrial Studio Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[6, 9, 6]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-4, 4, -4]} intensity={0.6} color="#0284c7" />
        <pointLight position={[0, 3.2, 0]} intensity={1.5} color="#ffffff" distance={6} />

        {/* Virtual Conveyor Assembly */}
        <ConveyorBelt isMoving={isRotating} />

        {/* Inspection Camera Gantry & Scanning Laser */}
        <InspectionGantry isScanning={isScanning} decision={decision} />

        {/* Mechanical Casting Component with 3D Defect Markers */}
        <CastingComponentModel
          modelType={modelType}
          isRotating={isRotating}
          status={status}
          severity={severity}
          defectRegions={defectRegions}
        />

        {/* Floor Grid */}
        <Grid
          position={[0, -2.08, 0]}
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#1e293b"
          sectionSize={2.0}
          sectionThickness={1.2}
          sectionColor="#0ea5e9"
          fadeDistance={25}
        />
      </Canvas>
    </div>
  );
};
