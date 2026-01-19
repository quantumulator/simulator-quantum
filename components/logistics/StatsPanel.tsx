"use client";

import { useLogisticsStore } from "@/lib/logistics/store";
import { useEffect, Suspense, useRef, useMemo } from "react";
import { Loader2, TrendingDown } from "lucide-react";
import { SolverResult } from "@/lib/logistics/solver";

export function StatsPanel() {
    const { problem, solverState, solution } = useLogisticsStore();

    if (!problem) return null;

    const status = solverState.isRunning ? 'OPTIMIZING' : (solution ? 'COMPLETED' : 'READY');
    const statusColor = solverState.isRunning ? 'text-yellow-400' : (solution ? 'text-green-400' : 'text-cyan-400');

    const solverResult = solution as SolverResult | null;

    return (
        <div className="fixed top-6 right-6 z-50 w-72 space-y-3 pointer-events-none">
            {/* Main Status Card */}
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 pointer-events-auto">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Operation Status</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${solverState.isRunning ? 'bg-yellow-400 animate-pulse' : (solution ? 'bg-green-400' : 'bg-cyan-400')}`} />
                        <span className={`font-bold ${statusColor}`}>{status}</span>
                    </div>
                    {solverState.isRunning && (
                        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    )}
                </div>
            </div>

            {/* Problem Stats */}
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 pointer-events-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="text-base">🚛</span> Fleet
                        </p>
                        <p className="text-2xl font-bold text-white">{problem.vehicles.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <span className="text-base">📍</span> Stops
                        </p>
                        <p className="text-2xl font-bold text-white">{problem.nodes.filter(n => n.type === 'customer').length}</p>
                    </div>
                </div>
            </div>

            {/* Solver Metrics */}
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-4 pointer-events-auto">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Quantum Annealing
                </h3>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Current Cost</span>
                        <span className="text-white font-mono">
                            {solverState.currentCost > 0 ? `${solverState.currentCost.toFixed(1)} km` : '—'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Best Cost</span>
                        <span className="text-green-400 font-mono font-bold">
                            {solverState.bestCost < Infinity ? `${solverState.bestCost.toFixed(1)} km` : '—'}
                        </span>
                    </div>

                    {/* Temperature Bar */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Temperature</span>
                            <span className="text-orange-400 font-mono">{solverState.temperature.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 via-orange-500 to-red-500 transition-all duration-300"
                                style={{ width: `${Math.min(100, (solverState.temperature / 500) * 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Iteration</span>
                        <span className="text-gray-400 font-mono">{solverState.iteration} / 3000</span>
                    </div>
                </div>
            </div>

            {/* Improvement Card */}
            {solverResult && solverResult.improvementPercent > 0 && (
                <div className="bg-gradient-to-br from-green-900/60 to-emerald-900/60 backdrop-blur-xl border border-green-500/30 rounded-lg p-4 pointer-events-auto">
                    <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">
                        Optimization Result
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-400">
                            {solverResult.improvementPercent.toFixed(1)}%
                        </span>
                        <span className="text-green-300/70 text-sm">better than greedy</span>
                    </div>
                    <p className="text-green-300/60 text-xs mt-2">
                        Saved {solverResult.improvement.toFixed(1)} km across {solverResult.routes.length} routes
                    </p>
                </div>
            )}
        </div>
    );
}
