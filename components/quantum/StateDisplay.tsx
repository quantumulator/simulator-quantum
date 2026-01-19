"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuantumStore } from '@/lib/store';
import { toString } from '@/lib/quantum/complex';
import { BarChart3, Target } from 'lucide-react';

export function StateDisplay() {
  const { simulationResult, numQubits, runMeasurement } = useQuantumStore();

  const stateEntries = useMemo(() => {
    if (!simulationResult?.sparseState) return [];

    return simulationResult.sparseState
      .map((entry) => ({
        index: entry.index,
        label: `|${entry.index.toString(2).padStart(numQubits, '0')}⟩`,
        amplitude: entry.amplitude,
        probability: entry.probability,
      }))
      .sort((a, b) => b.probability - a.probability);
  }, [simulationResult, numQubits]);

  const measurementEntries = useMemo(() => {
    if (!simulationResult?.measurements) return [];

    const total = Array.from(simulationResult.measurements.values())
      .reduce((sum, count) => sum + count, 0);

    return Array.from(simulationResult.measurements.entries())
      .map(([bitstring, count]) => ({
        bitstring: `|${bitstring}⟩`,
        count,
        frequency: count / total,
      }))
      .sort((a, b) => b.count - a.count);
  }, [simulationResult?.measurements]);

  if (!simulationResult) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quantum State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Run a simulation to see results
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quantum State</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runMeasurement(1000)}
          >
            <Target className="h-4 w-4 mr-2" />
            Measure (1000 shots)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* State Vector Display */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            State Vector
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stateEntries.map(entry => (
              <div key={entry.index} className="flex items-center gap-3">
                <span className="font-mono text-sm w-20">{entry.label}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${entry.probability * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono w-24 text-right">
                  {(entry.probability * 100).toFixed(1)}%
                </span>
                <span className="text-xs font-mono w-32 text-muted-foreground">
                  {toString(entry.amplitude, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Measurement Results */}
        {measurementEntries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Measurement Results
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {measurementEntries.map(entry => (
                <div key={entry.bitstring} className="flex items-center gap-3">
                  <span className="font-mono text-sm w-20">{entry.bitstring}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${entry.frequency * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-16 text-right">
                    {entry.count} ({(entry.frequency * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bloch Coordinates */}
        {simulationResult.blochCoordinates && (
          <div>
            <h4 className="text-sm font-medium mb-3">Bloch Coordinates</h4>
            <div className="grid grid-cols-2 gap-2">
              {simulationResult.blochCoordinates.map((coords, i) => (
                <div key={i} className="text-xs font-mono bg-muted p-2 rounded">
                  <span className="text-muted-foreground">q{i}:</span>{' '}
                  ({coords.x.toFixed(3)}, {coords.y.toFixed(3)}, {coords.z.toFixed(3)})
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
