"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Loader2, Play, Map as MapIcon, Globe, BarChart3, FileText } from 'lucide-react';
import { useLogisticsStore } from '@/lib/logistics/store';
import { parseLogisticsRequest } from '@/lib/logistics/agent';
import { solveVRP, SolverResult } from '@/lib/logistics/solver';

export function LogisticsInput() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<SolverResult | null>(null);
    const {
        setProblem,
        setSolution,
        setLoading,
        isLoading,
        problem,
        solverState,
        updateSolverState,
        ui,
        setViewMode,
        reset
    } = useLogisticsStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        reset();
        setResult(null);
        setLoading(true);

        try {
            const parsed = await parseLogisticsRequest(input, {
                apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
                    (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || undefined : undefined)
            });
            setProblem(parsed);
        } catch (err) {
            console.error("Failed to parse:", err);
        } finally {
            setLoading(false);
        }
    };

    const runOptimization = async () => {
        if (!problem) return;

        updateSolverState({ isRunning: true, history: [], currentCost: 0, bestCost: Infinity });

        try {
            const solverResult = await solveVRP(problem, (state) => {
                updateSolverState({
                    iteration: state.iteration,
                    currentCost: state.cost,
                    temperature: state.temp,
                    bestCost: state.bestCost
                });
            });

            setSolution(solverResult);
            setResult(solverResult);
            updateSolverState({ isRunning: false, currentCost: solverResult.totalCost });
        } catch (err) {
            console.error("Solver error:", err);
            updateSolverState({ isRunning: false });
        }
    };

    return (
        <div className="fixed bottom-6 left-6 right-6 z-50 flex flex-col gap-4 pointer-events-none">
            {/* Results Banner */}
            {result && (
                <div className="mx-auto max-w-xl bg-gradient-to-r from-green-900/80 to-emerald-900/80 backdrop-blur-xl border border-green-500/30 rounded-xl p-4 pointer-events-auto animate-fadeIn">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-green-400 font-bold text-lg">
                                    {result.improvementPercent.toFixed(1)}% Improvement
                                </p>
                                <p className="text-green-300/70 text-sm">
                                    vs Greedy Baseline
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-6 text-sm">
                            <div className="text-center">
                                <p className="text-gray-400">Baseline</p>
                                <p className="text-red-400 font-mono">{result.baselineCost.toFixed(1)} km</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400">Optimized</p>
                                <p className="text-green-400 font-mono">{result.totalCost.toFixed(1)} km</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400">Saved</p>
                                <p className="text-cyan-400 font-mono">{result.improvement.toFixed(1)} km</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Bar */}
            <div className="mx-auto flex gap-2 pointer-events-auto">
                <button
                    onClick={() => setViewMode('globe')}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${ui.viewMode === 'globe' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-black/40 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                    title="Globe View"
                >
                    <Globe className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setViewMode('city')}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${ui.viewMode === 'city' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-black/40 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                    title="City Map View"
                >
                    <MapIcon className="w-6 h-6" />
                </button>
                {problem && (
                    <button
                        onClick={runOptimization}
                        disabled={solverState.isRunning}
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 backdrop-blur-md overflow-hidden relative group"
                    >
                        {solverState.isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                        <span>{solverState.isRunning ? 'OPTIMIZING...' : 'RUN SOLVER'}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                    </button>
                )}
            </div>

            {/* Input Bar */}
            <div className="mx-auto w-full max-w-2xl pointer-events-auto">
                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                        <button type="button" className="p-4 text-gray-400 hover:text-white transition-colors" title="Upload CSV">
                            <Upload className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Describe your logistics problem (e.g., 'Optimize routes for 5 trucks with 30 stops in Hamburg')"
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 p-4 font-mono text-sm"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input}
                            className="p-4 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>

            {/* Quick Templates */}
            {!problem && (
                <div className="mx-auto flex gap-2 pointer-events-auto">
                    {[
                        { label: 'Hamburg Demo', query: 'Optimize routes for 4 trucks delivering to 20 locations in Hamburg' },
                        { label: 'Berlin Fleet', query: 'Route 6 vehicles to 40 customer locations across Berlin' },
                        { label: 'Munich Delivery', query: 'Last-mile delivery for 50 packages with 5 vans in Munich' },
                    ].map((template, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(template.query)}
                            className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-all"
                        >
                            {template.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
