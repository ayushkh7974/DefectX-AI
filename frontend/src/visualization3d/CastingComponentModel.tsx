import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DefectRegion } from '../services/types';

interface CastingComponentProps {
  modelType?: 'impeller' | 'flange' | 'casing';
  isRotating?: boolean;
  status?: 'OK' | 'DEFECTIVE' | 'PENDING';
  severity?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  defectRegions?: DefectRegion[];
}

export const CastingComponentModel: React.FC<CastingComponentProps> = ({
  modelType = 'impeller',
  isRotating = true,
  status = 'OK',
  severity = 'NONE',
  defectRegions = []
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth rotation
  useFrame((_, delta) => {
    if (groupRef.current && isRotating) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  // Industrial cast iron material
  const castMaterial = new THREE.MeshStandardMaterial({
    color: '#475569',
    metalness: 0.82,
    roughness: 0.38,
  });

  const machinedMaterial = new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    metalness: 0.95,
    roughness: 0.22,
  });

  // Defect marker color
  const markerColor = severity === 'HIGH' ? '#ef4444' : (severity === 'MEDIUM' ? '#f59e0b' : '#38bdf8');

  return (
    <group ref={groupRef} position={[0, 0.42, 0]}>
      {modelType === 'impeller' && (
        <group>
          {/* Central Hub */}
          <mesh castShadow receiveShadow material={machinedMaterial}>
            <cylinderGeometry args={[0.35, 0.45, 0.5, 32]} />
          </mesh>

          {/* Central Bore / Shaft Hole */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.52, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* Keyway slot */}
          <mesh position={[0.16, 0.05, 0]}>
            <boxGeometry args={[0.08, 0.52, 0.06]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>

          {/* Base Shroud Plate */}
          <mesh position={[0, -0.22, 0]} castShadow receiveShadow material={castMaterial}>
            <cylinderGeometry args={[1.5, 1.55, 0.12, 48]} />
          </mesh>

          {/* Upper Outer Ring */}
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow material={machinedMaterial}>
            <cylinderGeometry args={[1.45, 1.48, 0.08, 48]} />
          </mesh>

          {/* 6 Curved Impeller Vanes / Blades */}
          {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <group key={idx} rotation={[0, rad, 0]}>
                <mesh position={[0.85, 0, 0]} rotation={[0, 0.45, 0]} castShadow material={castMaterial}>
                  <boxGeometry args={[0.95, 0.32, 0.06]} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {modelType === 'flange' && (
        <group>
          <mesh castShadow receiveShadow material={castMaterial}>
            <cylinderGeometry args={[1.4, 1.4, 0.3, 36]} />
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow material={machinedMaterial}>
            <cylinderGeometry args={[0.7, 0.7, 0.35, 36]} />
          </mesh>
          {/* Bolt holes */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * 1.05;
            const z = Math.sin(rad) * 1.05;
            return (
              <mesh key={idx} position={[x, 0.05, z]}>
                <cylinderGeometry args={[0.1, 0.1, 0.32, 16]} />
                <meshStandardMaterial color="#090d16" roughness={0.9} />
              </mesh>
            );
          })}
        </group>
      )}

      {modelType === 'casing' && (
        <group>
          <mesh castShadow receiveShadow material={castMaterial}>
            <cylinderGeometry args={[1.2, 1.35, 0.8, 32]} />
          </mesh>
          {/* Cooling Fins */}
          {[-0.25, -0.1, 0.05, 0.2].map((y, idx) => (
            <mesh key={idx} position={[0, y, 0]} material={castMaterial}>
              <cylinderGeometry args={[1.38, 1.38, 0.04, 32]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 3D Localized Defect Markers mapped to component surface */}
      {status === 'DEFECTIVE' && defectRegions.length > 0 && defectRegions.map((region, idx) => {
        // Map 2D image coordinates (0-512) to radial 3D coordinates on the component
        const normX = (region.x / 512) - 0.5;
        const normY = (region.y / 512) - 0.5;
        const radius = 0.5 + Math.sqrt(normX * normX + normY * normY) * 1.4;
        const angle = Math.atan2(normY, normX);
        const posX = Math.cos(angle) * Math.min(radius, 1.4);
        const posZ = Math.sin(angle) * Math.min(radius, 1.4);

        return (
          <group key={idx} position={[posX, 0.15, posZ]}>
            {/* Glowing defect sphere */}
            <mesh>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={2.5}
                roughness={0.1}
              />
            </mesh>
            {/* Pulsing indicator ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
              <ringGeometry args={[0.08, 0.14, 24]} />
              <meshBasicMaterial color={markerColor} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}

      {/* Illustrative marker if defective without regions */}
      {status === 'DEFECTIVE' && defectRegions.length === 0 && (
        <group position={[0.75, 0.15, 0.55]}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color={markerColor} emissive={markerColor} emissiveIntensity={2.2} />
          </mesh>
        </group>
      )}
    </group>
  );
};
