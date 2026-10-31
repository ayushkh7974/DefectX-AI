import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConveyorProps {
  isMoving?: boolean;
}

export const ConveyorBelt: React.FC<ConveyorProps> = ({ isMoving = true }) => {
  const rollerGroupRef = useRef<THREE.Group>(null);
  const beltTextureRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    if (rollerGroupRef.current && isMoving) {
      rollerGroupRef.current.children.forEach((roller) => {
        roller.rotation.x += delta * 3.5;
      });
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Conveyor Belt Rubber Bed */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.12, 10]} />
        <meshStandardMaterial
          ref={beltTextureRef}
          color="#1e293b"
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {/* Guide Rails (Left & Right) */}
      <mesh position={[-2.15, 0.25, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 10.2]} />
        <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[2.15, 0.25, 0]} castShadow>
        <boxGeometry args={[0.1, 0.4, 10.2]} />
        <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rotating Metal Rollers */}
      <group ref={rollerGroupRef}>
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((z, idx) => (
          <mesh key={idx} position={[0, -0.12, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 4.0, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Support Legs */}
      {[-3.5, 0, 3.5].map((z, idx) => (
        <group key={idx}>
          {/* Left Leg */}
          <mesh position={[-2.0, -1.1, z]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 2.0, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Right Leg */}
          <mesh position={[2.0, -1.1, z]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 2.0, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Horizontal brace */}
          <mesh position={[0, -1.8, z]}>
            <boxGeometry args={[3.9, 0.08, 0.08]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* Factory Floor */}
      <mesh position={[0, -2.1, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#0a0f1d" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Industrial Safety Stripe Borders */}
      <mesh position={[-2.8, -2.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 12]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
      <mesh position={[2.8, -2.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 12]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
    </group>
  );
};
