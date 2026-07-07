'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function FloatingGeometry({ position, color, shape }: { position: [number, number, number]; color: string; shape: 'octa' | 'dodeca' | 'icosa' }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.4;
      meshRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position}>
        {shape === 'octa' && <octahedronGeometry args={[0.6]} />}
        {shape === 'dodeca' && <dodecahedronGeometry args={[0.5]} />}
        {shape === 'icosa' && <icosahedronGeometry args={[0.55]} />}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          wireframe={true}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

export default function FloatingNodes() {
  const nodes = useMemo(() => [
    { pos: [-2.5, 1.2, -1] as [number, number, number], color: '#8b5cf6', shape: 'octa' as const },
    { pos: [2.8, -1.0, -1.5] as [number, number, number], color: '#3b82f6', shape: 'dodeca' as const },
    { pos: [1.5, 1.8, -2] as [number, number, number], color: '#06b6d4', shape: 'icosa' as const },
    { pos: [-1.8, -1.5, -0.5] as [number, number, number], color: '#a855f7', shape: 'dodeca' as const },
  ], []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#8b5cf6" />
        <pointLight position={[-5, -5, 5]} intensity={0.8} color="#3b82f6" />
        
        {nodes.map((node, idx) => (
          <FloatingGeometry key={idx} position={node.pos} color={node.color} shape={node.shape} />
        ))}
      </Canvas>
    </div>
  );
}
