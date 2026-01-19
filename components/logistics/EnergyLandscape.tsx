"use client";

import { useLogisticsStore } from "@/lib/logistics/store";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

function SolutionParticle({ state }: { state: any }) {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state, delta) => {
        if (mesh.current) {
            mesh.current.rotation.x += delta;
            mesh.current.rotation.y += delta;
        }
    });

    if (!state.currentCost) return null;

    // Use current cost to determine height/position
    // Normalized cost for visualization
    const y = Math.max(0, (5000 - state.currentCost) / 1000);

    return (
        <mesh ref={mesh} position={[0, y, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
        </mesh>
    );
}

function LandscapeMesh() {
    // Generate a procedural terrain representing the cost function
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(10, 10, 32, 32);
        const count = geo.attributes.position.count;
        for (let i = 0; i < count; i++) {
            const x = geo.attributes.position.getX(i);
            const y = geo.attributes.position.getY(i);
            // Create a "valley" shape
            const dist = Math.sqrt(x * x + y * y);
            const z = Math.sin(dist * 2) * 0.5 + Math.random() * 0.1;
            geo.attributes.position.setZ(i, z);
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <primitive object={geometry} />
            <meshStandardMaterial color="#220033" wireframe />
        </mesh>
    );
}

export function EnergyLandscape() {
    const { solverState, ui } = useLogisticsStore();

    if (ui.viewMode !== 'energy') return null;

    return (
        <div className="absolute inset-0 bg-black z-10">
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#ff00ff" />
                <OrbitControls />

                <LandscapeMesh />
                <SolutionParticle state={solverState} />

                {/* History Trail */}
                {solverState.history.map((h, i) => (
                    <mesh key={i} position={[(i - solverState.history.length / 2) * 0.1, (5000 - h.cost) / 1000, 0]}>
                        <sphereGeometry args={[0.05]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
                    </mesh>
                ))}

            </Canvas>
        </div>
    );
}


