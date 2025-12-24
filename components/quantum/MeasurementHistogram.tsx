"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuantumStore } from '@/lib/store';
import { BarChart3, Play, RefreshCw, Download, Info } from 'lucide-react';

interface MeasurementResult {
  state: string;
  count: number;
  probability: number;
  theoretical: number;
}

export function MeasurementHistogram() {
  const { simulator, simulationResult, numQubits } = useQuantumStore();
  const [shots, setShots] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<MeasurementResult[]>([]);
  const [showTheoretical, setShowTheoretical] = useState(true);

  // Calculate theoretical probabilities from state vector
  const theoreticalProbabilities = useMemo(() => {
    if (!simulationResult?.probabilities) {
      // Default equal superposition or |0...0⟩
      const numStates = Math.pow(2, numQubits);
      return Array(numStates).fill(0).map((_, i) => ({
        state: i.toString(2).padStart(numQubits, '0'),
        probability: i === 0 ? 1 : 0
      }));
    }
    return simulationResult.probabilities.map((prob, i) => ({
      state: i.toString(2).padStart(numQubits, '0'),
      probability: prob
    }));
  }, [simulationResult, numQubits]);

  // Simulate measurements
  const runMeasurements = async () => {
    setIsRunning(true);
    
    // Simulate measurement process with artificial delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const counts: Record<string, number> = {};
    const probs = theoreticalProbabilities;
    
    // Monte Carlo simulation
    for (let i = 0; i < shots; i++) {
      const rand = Math.random();
      let cumulative = 0;
      
      for (const { state, probability } of probs) {
        cumulative += probability;
        if (rand < cumulative) {
          counts[state] = (counts[state] || 0) + 1;
          break;
        }
      }
    }
    
    // Convert to results array
    const newResults: MeasurementResult[] = probs
      .filter(p => p.probability > 0 || counts[p.state])
      .map(({ state, probability }) => ({
        state,
        count: counts[state] || 0,
        probability: (counts[state] || 0) / shots,
        theoretical: probability
      }))
      .sort((a, b) => b.count - a.count);
    
    setResults(newResults);
    setIsRunning(false);
  };

  // Export results as CSV
  const exportResults = () => {
    if (results.length === 0) return;
    
    const csv = [
      'State,Count,Measured Probability,Theoretical Probability',
      ...results.map(r => `${r.state},${r.count},${r.probability.toFixed(4)},${r.theoretical.toFixed(4)}`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum_measurements.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Find max for scaling bars
  const maxProbability = Math.max(
    ...results.map(r => Math.max(r.probability, r.theoretical)),
    0.1
  );

  // Calculate statistics
  const stats = useMemo(() => {
    if (results.length === 0) return null;
    
    const entropy = -results.reduce((sum, r) => {
      if (r.probability > 0) {
        sum += r.probability * Math.log2(r.probability);
      }
      return sum;
    }, 0);
    
    const chiSquare = results.reduce((sum, r) => {
      const expected = r.theoretical * shots;
      if (expected > 0) {
        sum += Math.pow(r.count - expected, 2) / expected;
      }
      return sum;
    }, 0);
    
    return {
      entropy: entropy.toFixed(3),
      chiSquare: chiSquare.toFixed(2),
      totalCounts: results.reduce((sum, r) => sum + r.count, 0)
    };
  }, [results, shots]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Measurement Results
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowTheoretical(!showTheoretical)}
              title="Toggle theoretical comparison"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={exportResults}
              disabled={results.length === 0}
              title="Export as CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-muted-foreground">Shots:</span>
            <Input
              type="number"
              value={shots}
              onChange={(e) => setShots(Math.max(1, Math.min(100000, parseInt(e.target.value) || 1000)))}
              className="w-24 h-7 text-xs"
              min={1}
              max={100000}
            />
          </div>
          <Button
            size="sm"
            onClick={runMeasurements}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? 'Running...' : 'Measure'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No measurements yet</p>
            <p className="text-xs mt-1">Click &quot;Measure&quot; to simulate quantum measurements</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Histogram bars */}
            <div className="space-y-2">
              {results.map((result) => (
                <div key={result.state} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold">|{result.state}⟩</span>
                    <span className="text-muted-foreground">
                      {result.count} ({(result.probability * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="relative h-6 bg-muted/30 rounded overflow-hidden">
                    {/* Measured probability bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 rounded transition-all duration-500"
                      style={{ width: `${(result.probability / maxProbability) * 100}%` }}
                    />
                    {/* Theoretical probability marker */}
                    {showTheoretical && (
                      <div
                        className="absolute inset-y-0 w-0.5 bg-yellow-400 transition-all duration-300"
                        style={{ left: `${(result.theoretical / maxProbability) * 100}%` }}
                        title={`Theoretical: ${(result.theoretical * 100).toFixed(1)}%`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            {showTheoretical && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-gradient-to-r from-primary to-purple-500 rounded" />
                  <span>Measured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-yellow-400 rounded" />
                  <span>Theoretical</span>
                </div>
              </div>
            )}
            
            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Total Shots</p>
                  <p className="font-semibold">{stats.totalCounts}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Entropy</p>
                  <p className="font-semibold">{stats.entropy}</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">χ² Stat</p>
                  <p className="font-semibold">{stats.chiSquare}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
