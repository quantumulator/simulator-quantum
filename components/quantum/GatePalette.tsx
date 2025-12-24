"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuantumStore } from '@/lib/store';
import { GATE_LIBRARY } from '@/lib/quantum/gates';
import { cn } from '@/lib/utils';

const GATE_CATEGORIES = {
  'Single Qubit': ['I', 'X', 'Y', 'Z', 'H', 'S', 'T'],
  'Rotations': ['Rx', 'Ry', 'Rz'],
  'Two Qubit': ['CNOT', 'CZ', 'SWAP'],
  'Three Qubit': ['Toffoli', 'Fredkin'],
};

const GATE_COLORS: Record<string, string> = {
  I: 'bg-gray-500',
  X: 'bg-red-500',
  Y: 'bg-green-500',
  Z: 'bg-blue-500',
  H: 'bg-purple-500',
  S: 'bg-yellow-500',
  T: 'bg-orange-500',
  Rx: 'bg-red-400',
  Ry: 'bg-green-400',
  Rz: 'bg-blue-400',
  CNOT: 'bg-indigo-500',
  CZ: 'bg-violet-500',
  SWAP: 'bg-pink-500',
  Toffoli: 'bg-cyan-500',
  Fredkin: 'bg-teal-500',
};

export function GatePalette() {
  const { selectedGate, setSelectedGate } = useQuantumStore();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quantum Gates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          {Object.entries(GATE_CATEGORIES).map(([category, gates]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {gates.map((gateName) => {
                  const gateInfo = GATE_LIBRARY[gateName];
                  const isSelected = selectedGate === gateName;
                  
                  return (
                    <Tooltip key={gateName}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-10 w-full font-mono font-bold",
                            isSelected && GATE_COLORS[gateName],
                            isSelected && "text-white border-0"
                          )}
                          onClick={() => setSelectedGate(isSelected ? null : gateName)}
                        >
                          {gateInfo?.symbol || gateName}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div className="space-y-1">
                          <p className="font-semibold">{gateInfo?.name}</p>
                          <p className="text-xs">{gateInfo?.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {gateInfo?.qubits} qubit{gateInfo?.qubits > 1 ? 's' : ''}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Click a gate to select, then click on the circuit to place it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
