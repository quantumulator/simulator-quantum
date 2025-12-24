"use client";

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuantumStore } from '@/lib/store';
import { RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff, Play, Pause, Info } from 'lucide-react';

interface BlochSphereProps {
  coordinates: { x: number; y: number; z: number };
  qubitIndex: number;
  showTrail?: boolean;
  isAnimating?: boolean;
  highlightedAxis?: 'x' | 'y' | 'z' | null;
}

function BlochSphereMesh({ coordinates, qubitIndex, showTrail = true, isAnimating = true, highlightedAxis }: BlochSphereProps) {
  const arrowRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Vector3[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  // Track state history for trail
  const currentPos = useMemo(() => 
    new THREE.Vector3(coordinates.x, coordinates.z, coordinates.y),
    [coordinates]
  );

  // Add to trail
  if (showTrail && trailRef.current.length < 100) {
    const lastPos = trailRef.current[trailRef.current.length - 1];
    if (!lastPos || lastPos.distanceTo(currentPos) > 0.01) {
      trailRef.current.push(currentPos.clone());
    }
  }

  // Animate the state vector
  useFrame((state) => {
    if (arrowRef.current && isAnimating) {
      const t = state.clock.elapsedTime;
      arrowRef.current.rotation.y = Math.sin(t * 0.5) * 0.02;
    }
  });

  // Calculate arrow direction
  const direction = new THREE.Vector3(coordinates.x, coordinates.z, coordinates.y);
  const length = direction.length();
  
  // Axis lines with highlighting
  const axisLength = 1.3;
  const xColor = highlightedAxis === 'x' ? '#ff6b6b' : '#ef4444';
  const yColor = highlightedAxis === 'y' ? '#6bff6b' : '#22c55e';
  const zColor = highlightedAxis === 'z' ? '#6b6bff' : '#3b82f6';
  const xWidth = highlightedAxis === 'x' ? 3 : 1;
  const yWidth = highlightedAxis === 'y' ? 3 : 1;
  const zWidth = highlightedAxis === 'z' ? 3 : 1;
  
  // Calculate spherical coordinates for display
  const theta = Math.acos(coordinates.z);
  const phi = Math.atan2(coordinates.y, coordinates.x);
  const thetaDeg = (theta * 180 / Math.PI).toFixed(1);
  const phiDeg = (phi * 180 / Math.PI).toFixed(1);
  
  return (
    <group>
      {/* Glow effect for sphere */}
      <mesh scale={1.05}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.05}
        />
      </mesh>
      
      {/* Wireframe sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#4a5568"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Solid sphere for reference */}
      <mesh>
        <sphereGeometry args={[0.98, 32, 32]} />
        <meshBasicMaterial
          color="#1a1a2e"
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* X axis (red) with interaction */}
      <group onPointerEnter={() => setHovered('x')} onPointerLeave={() => setHovered(null)}>
        <Line
          points={[[-axisLength, 0, 0], [axisLength, 0, 0]]}
          color={hovered === 'x' ? '#ff8888' : xColor}
          lineWidth={hovered === 'x' ? 2 : xWidth}
        />
        <Text position={[axisLength + 0.2, 0, 0]} fontSize={0.15} color={xColor}>
          X
        </Text>
        {hovered === 'x' && (
          <Html position={[axisLength + 0.4, 0.3, 0]}>
            <div className="bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap">
              X-axis: Superposition phase
            </div>
          </Html>
        )}
      </group>

      {/* Y axis (green) with interaction */}
      <group onPointerEnter={() => setHovered('y')} onPointerLeave={() => setHovered(null)}>
        <Line
          points={[[0, 0, -axisLength], [0, 0, axisLength]]}
          color={hovered === 'y' ? '#88ff88' : yColor}
          lineWidth={hovered === 'y' ? 2 : yWidth}
        />
        <Text position={[0, 0, axisLength + 0.2]} fontSize={0.15} color={yColor}>
          Y
        </Text>
        {hovered === 'y' && (
          <Html position={[0, 0.3, axisLength + 0.3]}>
            <div className="bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap">
              Y-axis: Imaginary phase
            </div>
          </Html>
        )}
      </group>

      {/* Z axis (blue) with interaction */}
      <group onPointerEnter={() => setHovered('z')} onPointerLeave={() => setHovered(null)}>
        <Line
          points={[[0, -axisLength, 0], [0, axisLength, 0]]}
          color={hovered === 'z' ? '#8888ff' : zColor}
          lineWidth={hovered === 'z' ? 2 : zWidth}
        />
        <Text position={[0, axisLength + 0.2, 0]} fontSize={0.15} color={zColor}>
          |0⟩
        </Text>
        <Text position={[0, -axisLength - 0.2, 0]} fontSize={0.15} color={zColor}>
          |1⟩
        </Text>
        {hovered === 'z' && (
          <Html position={[0.3, axisLength, 0]}>
            <div className="bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap">
              Z-axis: Basis states |0⟩ ↔ |1⟩
            </div>
          </Html>
        )}
      </group>

      {/* Trail visualization */}
      {showTrail && trailRef.current.length > 1 && (
        <Line
          points={trailRef.current.map(v => [v.x, v.y, v.z] as [number, number, number])}
          color="#8b5cf6"
          lineWidth={1}
          transparent
          opacity={0.4}
          dashed
          dashSize={0.05}
          gapSize={0.03}
        />
      )}

      {/* State vector arrow */}
      <group ref={arrowRef}>
        {length > 0.01 && (
          <>
            <Line
              points={[[0, 0, 0], [coordinates.x, coordinates.z, coordinates.y]]}
              color="#8b5cf6"
              lineWidth={3}
            />
            {/* Arrow head with glow */}
            <mesh position={[coordinates.x, coordinates.z, coordinates.y]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="#8b5cf6" />
            </mesh>
            <mesh position={[coordinates.x, coordinates.z, coordinates.y]} scale={1.5}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
            </mesh>
            
            {/* Coordinates display */}
            <Html position={[coordinates.x + 0.2, coordinates.z + 0.2, coordinates.y]}>
              <div className="bg-black/80 text-white text-xs p-1.5 rounded font-mono whitespace-nowrap">
                θ={thetaDeg}° φ={phiDeg}°
              </div>
            </Html>
          </>
        )}
      </group>

      {/* Qubit label */}
      <Text position={[0, -1.6, 0]} fontSize={0.2} color="#888">
        q{qubitIndex}
      </Text>

      {/* Equator circle */}
      <Line
        points={Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return [Math.cos(angle), 0, Math.sin(angle)] as [number, number, number];
        })}
        color="#666"
        lineWidth={1}
      />
      
      {/* Meridian circles */}
      <Line
        points={Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return [Math.cos(angle), Math.sin(angle), 0] as [number, number, number];
        })}
        color="#444"
        lineWidth={0.5}
        transparent
        opacity={0.5}
      />
      <Line
        points={Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return [0, Math.sin(angle), Math.cos(angle)] as [number, number, number];
        })}
        color="#444"
        lineWidth={0.5}
        transparent
        opacity={0.5}
      />
    </group>
  );
}

// Camera controls component
function CameraController({ onReset }: { onReset: boolean }) {
  const { camera } = useThree();
  
  React.useEffect(() => {
    if (onReset) {
      camera.position.set(3, 2, 3);
      camera.lookAt(0, 0, 0);
    }
  }, [onReset, camera]);
  
  return null;
}

export function BlochSphere() {
  const { simulationResult, numQubits } = useQuantumStore();
  const [showTrail, setShowTrail] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  const [resetCamera, setResetCamera] = useState(false);
  const [highlightedAxis, setHighlightedAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const blochCoordinates = useMemo(() => {
    if (!simulationResult?.blochCoordinates) {
      // Default to |0⟩ state for all qubits
      return Array(numQubits).fill({ x: 0, y: 0, z: 1 });
    }
    return simulationResult.blochCoordinates;
  }, [simulationResult, numQubits]);

  // Calculate grid layout
  const cols = Math.min(numQubits, 4);
  const rows = Math.ceil(numQubits / cols);
  
  const handleResetCamera = () => {
    setResetCamera(true);
    setTimeout(() => setResetCamera(false), 100);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Bloch Sphere
            <span className="text-xs font-normal text-muted-foreground">
              ({numQubits} qubit{numQubits > 1 ? 's' : ''})
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowTrail(!showTrail)}
              title={showTrail ? "Hide trail" : "Show trail"}
            >
              {showTrail ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsAnimating(!isAnimating)}
              title={isAnimating ? "Pause animation" : "Resume animation"}
            >
              {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleResetCamera}
              title="Reset camera"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowInfo(!showInfo)}
              title="Toggle info"
            >
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Axis highlight buttons */}
        <div className="flex gap-1 mt-2">
          <Button
            variant={highlightedAxis === 'x' ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setHighlightedAxis(highlightedAxis === 'x' ? null : 'x')}
            style={{ backgroundColor: highlightedAxis === 'x' ? '#ef4444' : undefined }}
          >
            X
          </Button>
          <Button
            variant={highlightedAxis === 'y' ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setHighlightedAxis(highlightedAxis === 'y' ? null : 'y')}
            style={{ backgroundColor: highlightedAxis === 'y' ? '#22c55e' : undefined }}
          >
            Y
          </Button>
          <Button
            variant={highlightedAxis === 'z' ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setHighlightedAxis(highlightedAxis === 'z' ? null : 'z')}
            style={{ backgroundColor: highlightedAxis === 'z' ? '#3b82f6' : undefined }}
          >
            Z
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div 
          className="w-full bg-background rounded-lg overflow-hidden"
          style={{ height: '100%', minHeight: '200px' }}
        >
          <Canvas
            camera={{ position: [3, 2, 3], fov: 50 }}
            style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)' }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={0.8} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
            
            <CameraController onReset={resetCamera} />
            
            {blochCoordinates.map((coords, index) => {
              const col = index % cols;
              const row = Math.floor(index / cols);
              const spacing = 3.5;
              const offsetX = (col - (cols - 1) / 2) * spacing;
              const offsetY = (row - (rows - 1) / 2) * -spacing;
              
              return (
                <group key={index} position={[offsetX, offsetY, 0]}>
                  <BlochSphereMesh 
                    coordinates={coords} 
                    qubitIndex={index}
                    showTrail={showTrail}
                    isAnimating={isAnimating}
                    highlightedAxis={highlightedAxis}
                  />
                </group>
              );
            })}
            
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={20}
              dampingFactor={0.05}
              enableDamping
            />
          </Canvas>
        </div>
        
        {showInfo && (
          <div className="mt-3 text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg space-y-1">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Purple arrow shows the current quantum state
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              |0⟩ is at the north pole, |1⟩ at the south pole
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Superposition states lie on the equator
            </p>
            <p className="text-muted-foreground/70 mt-2">
              💡 Drag to rotate, scroll to zoom, click axes for info
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
