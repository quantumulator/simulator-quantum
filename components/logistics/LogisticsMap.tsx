"use client";

import { useLogisticsStore } from "@/lib/logistics/store";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html, useTexture, Line } from "@react-three/drei";
import { useMemo, useRef, useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import * as THREE from "three";
import { LogisticsNode, Route, GeoLocation } from "@/lib/logistics/types";

const EARTH_RADIUS = 10;

// Hamburg coordinates for camera focus
const HAMBURG = { lat: 53.5511, lng: 9.9937 };

// Convert LatLng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

// Calculate camera position to look at a specific lat/lng
function getCameraPosition(lat: number, lng: number, distance: number): THREE.Vector3 {
    const target = latLngToVector3(lat, lng, EARTH_RADIUS);
    return target.clone().normalize().multiplyScalar(distance);
}

// City Map Component (2D Top-Down)
function CityMap({ problem, solution }: { problem: any; solution: any }) {
    const { center, scale } = useMemo(() => {
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        problem.nodes.forEach((n: LogisticsNode) => {
            if (n.location.lat < minLat) minLat = n.location.lat;
            if (n.location.lat > maxLat) maxLat = n.location.lat;
            if (n.location.lng < minLng) minLng = n.location.lng;
            if (n.location.lng > maxLng) maxLng = n.location.lng;
        });

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latSpan = Math.max(maxLat - minLat, 0.05);
        const s = 30 / latSpan;

        return { center: { lat: centerLat, lng: centerLng }, scale: s };
    }, [problem]);

    const project = (lat: number, lng: number): [number, number, number] => {
        const x = (lng - center.lng) * scale * 0.7;
        const z = -(lat - center.lat) * scale;
        return [x, 0, z];
    };

    return (
        <group>
            {/* Grid floor */}
            <gridHelper args={[100, 50, 0x1a1a3a, 0x0a0a1a]} position={[0, -0.1, 0]} />

            {/* Nodes */}
            {problem.nodes.map((node: LogisticsNode) => {
                const pos = project(node.location.lat, node.location.lng);
                const isDepot = node.type === 'depot';

                return (
                    <group key={node.id} position={pos}>
                        {/* Base glow */}
                        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[isDepot ? 0.8 : 0.4, 32]} />
                            <meshBasicMaterial
                                color={isDepot ? "#00ffff" : "#ff00ff"}
                                transparent
                                opacity={0.3}
                            />
                        </mesh>

                        {/* Building */}
                        <mesh position={[0, isDepot ? 1.5 : 0.6, 0]}>
                            <boxGeometry args={[0.4, isDepot ? 3 : 1.2, 0.4]} />
                            <meshStandardMaterial
                                color={isDepot ? "#00ffff" : "#ff00ff"}
                                emissive={isDepot ? "#00ffff" : "#ff00ff"}
                                emissiveIntensity={2}
                                toneMapped={false}
                            />
                        </mesh>

                        {/* Point light */}
                        <pointLight
                            position={[0, 1, 0]}
                            distance={3}
                            intensity={1}
                            color={isDepot ? "#00ffff" : "#ff00ff"}
                        />
                    </group>
                );
            })}

            {/* Routes */}
            {solution && solution.routes.map((route: Route, i: number) => (
                <CityRouteLines key={i} route={route} project={project} />
            ))}
        </group>
    );
}

function CityRouteLines({ route, project }: { route: Route; project: (lat: number, lng: number) => [number, number, number] }) {
    if (!route.segments || route.segments.length === 0) return null;

    const points = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        route.segments!.forEach(seg => {
            pts.push(new THREE.Vector3(...project(seg.from.lat, seg.from.lng)));
            pts.push(new THREE.Vector3(...project(seg.to.lat, seg.to.lng)));
        });
        return pts;
    }, [route.segments, project]);

    if (points.length < 2) return null;

    return (
        <group>
            {route.segments!.map((seg, idx) => {
                const start = new THREE.Vector3(...project(seg.from.lat, seg.from.lng));
                const end = new THREE.Vector3(...project(seg.to.lat, seg.to.lng));
                start.y = 0.5;
                end.y = 0.5;

                return (
                    <Line
                        key={idx}
                        points={[start, end]}
                        color={route.color}
                        lineWidth={3}
                        transparent
                        opacity={0.8}
                    />
                );
            })}
        </group>
    );
}

// Globe Map Component
function GlobeMap({ problem, solution }: { problem: any; solution: any }) {
    const [colorMap, bumpMap, nightMap] = useTexture([
        'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg',
        'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png',
        'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg',
    ]);

    return (
        <group>
            {/* Globe */}
            <mesh>
                <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
                <meshStandardMaterial
                    map={colorMap}
                    bumpMap={bumpMap}
                    bumpScale={0.05}
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Night lights */}
            <mesh scale={[1.002, 1.002, 1.002]}>
                <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
                <meshBasicMaterial
                    map={nightMap}
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Atmosphere */}
            <mesh scale={[1.03, 1.03, 1.03]}>
                <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
                <meshBasicMaterial
                    color="#4488ff"
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Nodes on globe */}
            {problem.nodes.map((node: LogisticsNode) => {
                const pos = latLngToVector3(node.location.lat, node.location.lng, EARTH_RADIUS + 0.15);
                const isDepot = node.type === 'depot';

                return (
                    <group key={node.id} position={pos}>
                        <mesh>
                            <sphereGeometry args={[isDepot ? 0.3 : 0.15, 16, 16]} />
                            <meshStandardMaterial
                                color={isDepot ? "#00ffff" : "#ff00ff"}
                                emissive={isDepot ? "#00ffff" : "#ff00ff"}
                                emissiveIntensity={3}
                                toneMapped={false}
                            />
                        </mesh>
                        <pointLight
                            distance={1.5}
                            intensity={isDepot ? 3 : 1}
                            color={isDepot ? "#00ffff" : "#ff00ff"}
                        />
                    </group>
                );
            })}

            {/* Route arcs */}
            {solution && solution.routes.map((route: Route, i: number) => (
                <RouteArcs key={i} route={route} />
            ))}
        </group>
    );
}

function RouteArcs({ route }: { route: Route }) {
    if (!route.segments || route.segments.length === 0) return null;

    return (
        <group>
            {route.segments.map((seg, idx) => (
                <Arc key={idx} start={seg.from} end={seg.to} color={route.color} />
            ))}
        </group>
    );
}

function Arc({ start, end, color }: { start: GeoLocation; end: GeoLocation; color: string }) {
    const points = useMemo(() => {
        const startPos = latLngToVector3(start.lat, start.lng, EARTH_RADIUS + 0.2);
        const endPos = latLngToVector3(end.lat, end.lng, EARTH_RADIUS + 0.2);

        const dist = startPos.distanceTo(endPos);
        const height = EARTH_RADIUS + 0.2 + Math.min(2, dist * 0.3);
        const mid = startPos.clone().add(endPos).multiplyScalar(0.5).normalize().multiplyScalar(height);

        const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
        return curve.getPoints(20);
    }, [start, end]);

    return (
        <Line
            points={points}
            color={color}
            lineWidth={2}
            transparent
            opacity={0.8}
        />
    );
}

// Camera Controller
function CameraController({ problem }: { problem: any }) {
    const { camera } = useThree();
    const controlsRef = useRef<any>(null);

    useEffect(() => {
        if (problem && problem.nodes.length > 0) {
            // Calculate centroid of nodes
            let sumLat = 0, sumLng = 0;
            problem.nodes.forEach((n: LogisticsNode) => {
                sumLat += n.location.lat;
                sumLng += n.location.lng;
            });
            const avgLat = sumLat / problem.nodes.length;
            const avgLng = sumLng / problem.nodes.length;

            // Position camera to look at centroid
            const targetPos = latLngToVector3(avgLat, avgLng, EARTH_RADIUS);
            const cameraPos = targetPos.clone().normalize().multiplyScalar(EARTH_RADIUS * 2.5);

            camera.position.copy(cameraPos);
            camera.lookAt(targetPos);
        }
    }, [problem, camera]);

    return null;
}

// Background particles
function BackgroundParticles() {
    const count = 1500;
    const positions = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 150;
            p[i * 3 + 1] = (Math.random() - 0.5) * 150;
            p[i * 3 + 2] = (Math.random() - 0.5) * 150;
        }
        return p;
    }, []);

    const ref = useRef<THREE.Points>(null);
    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={positions}
                    itemSize={3}
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial size={0.15} color="#00ffff" transparent opacity={0.3} sizeAttenuation />
        </points>
    );
}

// Main Export
export function LogisticsMap() {
    const { problem, solution, ui } = useLogisticsStore();

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#000510] to-[#000a20]">
            <Canvas camera={{ position: [0, 0, 30], fov: 45 }}>
                <color attach="background" args={["#000510"]} />
                <fog attach="fog" args={["#000510", 30, 150]} />

                <CameraController problem={problem} />
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                    autoRotate={!problem}
                    autoRotateSpeed={0.3}
                />

                <ambientLight intensity={0.4} />
                <directionalLight position={[50, 50, 50]} intensity={1} />
                <pointLight position={[-50, 30, -50]} intensity={0.5} color="#ff00ff" />

                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
                <BackgroundParticles />

                <Suspense fallback={
                    <Html center>
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                            <p className="text-cyan-400 text-sm font-mono">Loading globe...</p>
                        </div>
                    </Html>
                }>
                    {problem && ui.viewMode === 'globe' && <GlobeMap problem={problem} solution={solution} />}
                    {problem && ui.viewMode === 'city' && <CityMap problem={problem} solution={solution} />}
                </Suspense>

                {!problem && (
                    <Html center>
                        <div className="text-center pointer-events-none select-none">
                            <h1 className="text-5xl font-bold text-white mb-3 tracking-tighter">
                                QUANTUM LOGISTICS
                            </h1>
                            <p className="text-cyan-400 opacity-70 text-lg">
                                Describe your routing problem to begin optimization
                            </p>
                        </div>
                    </Html>
                )}
            </Canvas>
        </div>
    );
}
