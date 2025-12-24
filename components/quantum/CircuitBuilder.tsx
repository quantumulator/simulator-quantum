"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQuantumStore, CircuitGate } from '@/lib/store';
import { GATE_LIBRARY } from '@/lib/quantum/gates';
import { cn } from '@/lib/utils';
import { 
  Trash2, 
  Play, 
  RotateCcw, 
  Plus, 
  Minus, 
  ZoomIn, 
  ZoomOut,
  Undo2,
  Redo2,
  GripVertical,
  Info
} from 'lucide-react';

const GATE_COLORS: Record<string, { bg: string; glow: string }> = {
  I: { bg: 'bg-gray-500', glow: 'shadow-gray-500/30' },
  X: { bg: 'bg-red-500', glow: 'shadow-red-500/30' },
  Y: { bg: 'bg-green-500', glow: 'shadow-green-500/30' },
  Z: { bg: 'bg-blue-500', glow: 'shadow-blue-500/30' },
  H: { bg: 'bg-purple-500', glow: 'shadow-purple-500/30' },
  S: { bg: 'bg-yellow-500', glow: 'shadow-yellow-500/30' },
  T: { bg: 'bg-orange-500', glow: 'shadow-orange-500/30' },
  Rx: { bg: 'bg-red-400', glow: 'shadow-red-400/30' },
  Ry: { bg: 'bg-green-400', glow: 'shadow-green-400/30' },
  Rz: { bg: 'bg-blue-400', glow: 'shadow-blue-400/30' },
  CNOT: { bg: 'bg-indigo-500', glow: 'shadow-indigo-500/30' },
  CZ: { bg: 'bg-violet-500', glow: 'shadow-violet-500/30' },
  SWAP: { bg: 'bg-pink-500', glow: 'shadow-pink-500/30' },
  Toffoli: { bg: 'bg-cyan-500', glow: 'shadow-cyan-500/30' },
  Fredkin: { bg: 'bg-teal-500', glow: 'shadow-teal-500/30' },
  MEASURE: { bg: 'bg-gray-700', glow: 'shadow-gray-700/30' },
};

const GATE_DESCRIPTIONS: Record<string, string> = {
  H: 'Creates superposition',
  X: 'Bit flip (NOT gate)',
  Y: 'Bit + phase flip',
  Z: 'Phase flip',
  S: 'π/2 phase shift',
  T: 'π/4 phase shift',
  CNOT: 'Conditional flip',
  CZ: 'Conditional phase',
  SWAP: 'Swap qubit states',
};

interface ParamDialogProps {
  open: boolean;
  onClose: () => void;
  gateName: string;
  onConfirm: (params: number[]) => void;
}

function ParamDialog({ open, onClose, gateName, onConfirm }: ParamDialogProps) {
  const [theta, setTheta] = useState(Math.PI / 4);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{gateName} Parameters</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label className="text-sm font-medium">θ (theta): {(theta / Math.PI).toFixed(2)}π</label>
          <Slider
            value={[theta]}
            onValueChange={(v) => setTheta(v[0])}
            min={0}
            max={2 * Math.PI}
            step={Math.PI / 16}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onConfirm([theta]); onClose(); }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CircuitBuilder() {
  const {
    numQubits,
    circuitGates,
    selectedGate,
    addGate,
    removeGate,
    clearCircuit,
    runSimulation,
    isRunning,
    initSimulator,
    setSelectedGate,
  } = useQuantumStore();

  const [paramDialog, setParamDialog] = useState<{
    open: boolean;
    qubit: number;
    gateName: string;
  }>({ open: false, qubit: 0, gateName: '' });
  
  const [zoom, setZoom] = useState(1);
  const [hoveredGate, setHoveredGate] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ qubit: number; step: number } | null>(null);
  const [history, setHistory] = useState<CircuitGate[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate circuit layout
  const maxStep = circuitGates.length > 0 
    ? Math.max(...circuitGates.map(g => g.step)) + 1
    : 0;
  const displaySteps = Math.max(maxStep + 2, 10);
  
  const cellSize = 80;

  // Save to history for undo/redo
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...circuitGates]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, circuitGates]);

  const handleQubitClick = (qubit: number, step: number) => {
    if (!selectedGate) return;

    const gateInfo = GATE_LIBRARY[selectedGate];
    if (!gateInfo) return;

    // Check if gate needs parameters
    if (gateInfo.params && gateInfo.params.length > 0) {
      setParamDialog({ open: true, qubit, gateName: selectedGate });
      return;
    }

    // Handle multi-qubit gates
    if (gateInfo.qubits === 1) {
      addGate(selectedGate, [qubit]);
    } else if (gateInfo.qubits === 2) {
      const target = (qubit + 1) % numQubits;
      addGate(selectedGate, [qubit, target]);
    } else if (gateInfo.qubits === 3) {
      const target1 = (qubit + 1) % numQubits;
      const target2 = (qubit + 2) % numQubits;
      addGate(selectedGate, [qubit, target1, target2]);
    }

    setSelectedGate(null);
    saveToHistory();
  };

  const handleDragOver = (e: React.DragEvent, qubit: number, step: number) => {
    e.preventDefault();
    setDragOver({ qubit, step });
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, qubit: number) => {
    e.preventDefault();
    const gateName = e.dataTransfer.getData('gate');
    if (gateName) {
      const gateInfo = GATE_LIBRARY[gateName];
      if (gateInfo) {
        if (gateInfo.qubits === 1) {
          addGate(gateName, [qubit]);
        } else if (gateInfo.qubits === 2) {
          const target = (qubit + 1) % numQubits;
          addGate(gateName, [qubit, target]);
        }
        saveToHistory();
      }
    }
    setDragOver(null);
  };

  const handleParamConfirm = (params: number[]) => {
    addGate(paramDialog.gateName, [paramDialog.qubit], params);
    setSelectedGate(null);
    saveToHistory();
  };

  const handleAddQubit = () => {
    if (numQubits < 8) {
      initSimulator(numQubits + 1);
    }
  };

  const handleRemoveQubit = () => {
    if (numQubits > 1) {
      initSimulator(numQubits - 1);
    }
  };
  
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));

  // Group gates by step for rendering
  const gatesByPosition = new Map<string, CircuitGate>();
  circuitGates.forEach(gate => {
    gate.qubits.forEach(q => {
      gatesByPosition.set(`${q}-${gate.step}`, gate);
    });
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Circuit Builder
            <span className="text-xs font-normal text-muted-foreground">
              {circuitGates.length} gate{circuitGates.length !== 1 ? 's' : ''}
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-4 bg-border mx-1" />
            
            {/* Qubit controls */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRemoveQubit}
              disabled={numQubits <= 1}
              title="Remove qubit"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium w-14 text-center">
              {numQubits} qubit{numQubits > 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleAddQubit}
              disabled={numQubits >= 8}
              title="Add qubit"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {selectedGate && (
          <div className="flex items-center gap-2 mt-2 text-xs bg-primary/10 text-primary p-2 rounded-lg">
            <Info className="h-4 w-4" />
            <span>Click on a qubit wire to place <strong>{selectedGate}</strong> gate</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 ml-auto text-xs"
              onClick={() => setSelectedGate(null)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto pb-4 bg-muted/20 rounded-lg p-6"
        >
          <div className="min-w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {/* Qubit labels and wires */}
            {Array.from({ length: numQubits }).map((_, qubit) => (
              <div key={qubit} className="flex items-center h-20 gap-4 mb-2">
                {/* Qubit label */}
                <div className="w-16 text-base font-mono text-right pr-3 flex items-center justify-end gap-1">
                  <span className="text-muted-foreground">|</span>
                  <span className="text-primary font-bold">q{qubit}</span>
                  <span className="text-muted-foreground">⟩</span>
                </div>
                
                {/* Wire and gates */}
                <div 
                  className="relative flex items-center"
                  onDragOver={(e) => handleDragOver(e, qubit, 0)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, qubit)}
                >
                  {/* Background wire with gradient */}
                  <div 
                    className="absolute left-0 right-0 h-[2px] qubit-wire"
                    style={{ width: `${displaySteps * cellSize}px`, top: '50%', transform: 'translateY(-50%)' }}
                  />
                  
                  {/* Gate slots */}
                  {Array.from({ length: displaySteps }).map((_, step) => {
                    const gate = gatesByPosition.get(`${qubit}-${step}`);
                    const isPrimaryQubit = gate?.qubits[0] === qubit;
                    const isDropTarget = dragOver?.qubit === qubit && dragOver?.step === step;
                    const gateColor = gate ? GATE_COLORS[gate.gate] : null;
                    
                    return (
                      <div
                        key={step}
                        className={cn(
                          "relative flex items-center justify-center transition-all duration-150",
                          "cursor-pointer rounded-md",
                          !gate && "hover:bg-primary/5",
                          selectedGate && !gate && "ring-1 ring-primary/20 ring-inset",
                          isDropTarget && "bg-primary/10 ring-2 ring-primary"
                        )}
                        style={{ width: cellSize, height: 64 }}
                        onClick={() => !gate && handleQubitClick(qubit, step)}
                        onDragOver={(e) => handleDragOver(e, qubit, step)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, qubit)}
                      >
                        {gate && isPrimaryQubit && (
                          <div
                            className={cn(
                              "w-14 h-14 rounded-lg flex items-center justify-center",
                              "text-white font-mono font-bold text-base",
                              "shadow-lg transition-all duration-200",
                              "cursor-pointer hover:scale-105 hover:shadow-xl group",
                              "relative z-10",
                              gateColor?.bg || 'bg-gray-500',
                              gateColor?.glow || 'shadow-gray-500/30'
                            )}
                            onMouseEnter={() => setHoveredGate(gate.id)}
                            onMouseLeave={() => setHoveredGate(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGate(gate.id);
                              saveToHistory();
                            }}
                            title={GATE_DESCRIPTIONS[gate.gate] || gate.gate}
                          >
                            <span className="group-hover:hidden">
                              {GATE_LIBRARY[gate.gate]?.symbol || gate.gate}
                            </span>
                            <Trash2 className="h-5 w-5 hidden group-hover:block text-white/90" />
                          </div>
                        )}
                        
                        {/* Connection line for multi-qubit gates */}
                        {gate && !isPrimaryQubit && (
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 border-foreground bg-background",
                            "shadow-sm relative z-10"
                          )} />
                        )}
                        
                        {/* Vertical connection for multi-qubit gates */}
                        {gate && gate.qubits.length > 1 && isPrimaryQubit && (
                          <div 
                            className="absolute left-1/2 w-[2px] bg-foreground -translate-x-1/2 z-0"
                            style={{
                              top: '50%',
                              height: `${(Math.max(...gate.qubits) - Math.min(...gate.qubits)) * 82}px`
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Initial state indicator */}
                <div className="w-10 text-sm text-muted-foreground font-mono">|0⟩</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pt-4 border-t flex-shrink-0">
          <Button
            onClick={() => {
              runSimulation();
              saveToHistory();
            }}
            disabled={isRunning || circuitGates.length === 0}
            className="flex-1 gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running...' : 'Run Simulation'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearCircuit();
              saveToHistory();
            }}
            disabled={circuitGates.length === 0}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        </div>

        <ParamDialog
          open={paramDialog.open}
          onClose={() => setParamDialog({ ...paramDialog, open: false })}
          gateName={paramDialog.gateName}
          onConfirm={handleParamConfirm}
        />
      </CardContent>
    </Card>
  );
}
