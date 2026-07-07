'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Inner rotating wireframe core
function OrbCore() {
  const coreRef = useRef<THREE.Mesh>(null!);
  const outerRef = useRef<THREE.Mesh>(null!);
  const ringRef1 = useRef<THREE.Mesh>(null!);
  const ringRef2 = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const { pointer } = state;
    
    // Smooth idle rotation + mouse interaction
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.3;
      coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, pointer.y * 0.4, 0.05);
      coreRef.current.rotation.z = THREE.MathUtils.lerp(coreRef.current.rotation.z, -pointer.x * 0.4, 0.05);
    }
    
    if (outerRef.current) {
      outerRef.current.rotation.y -= delta * 0.2;
      outerRef.current.rotation.x = THREE.MathUtils.lerp(outerRef.current.rotation.x, -pointer.y * 0.3, 0.05);
    }

    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * 0.5;
      ringRef1.current.rotation.x += delta * 0.1;
    }

    if (ringRef2.current) {
      ringRef2.current.rotation.z -= delta * 0.4;
      ringRef2.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group>
      {/* Center glowing solid sphere */}
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshPhysicalMaterial
          color="#4f46e5"
          emissive="#6366f1"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* Inner Wireframe Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.3, 24, 24]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          wireframe={true}
          transparent={true}
          opacity={0.7}
        />
      </mesh>

      {/* Outer Cybernetic Mesh */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#2563eb"
          emissiveIntensity={0.4}
          wireframe={true}
          transparent={true}
          opacity={0.4}
        />
      </mesh>

      {/* Orbiting Torus Ring 1 */}
      <mesh ref={ringRef1} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.2, 0.015, 16, 100]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.6} />
      </mesh>

      {/* Orbiting Torus Ring 2 */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[2.6, 0.012, 16, 100]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// Surrounding floating data particles
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null!);
  
  // Generate random spherical coordinates for 400 particles
  const particlePositions = useMemo(() => {
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x -= delta * 0.03;
    }
  });

  return (
    <Points ref={pointsRef} positions={particlePositions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#c084fc"
        size={0.035}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
}

export default function CyberneticOrb() {
  return (
    <div className="hero-3d-container">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#8b5cf6" />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#3b82f6" />
        <pointLight position={[0, 5, -5]} intensity={0.8} color="#06b6d4" />

        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.8}>
          <OrbCore />
          <ParticleField />
        </Float>
      </Canvas>
    </div>
  );
}
