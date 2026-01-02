"use client";

/**
 * Circuit Storage Hook
 * Handles saving, loading, and managing quantum circuits
 */

import { useState, useCallback, useEffect } from 'react';
import type { CircuitGate } from '@/lib/store';

export interface SavedCircuit {
    id: string;
    name: string;
    description?: string;
    numQubits: number;
    gates: CircuitGate[];
    createdAt: string;
    updatedAt: string;
}

interface CircuitStorageState {
    savedCircuits: SavedCircuit[];
    recentCircuits: SavedCircuit[];
    isLoading: boolean;
    error: string | null;
}

const STORAGE_KEY = 'quantum-simulator-circuits';
const RECENT_KEY = 'quantum-simulator-recent';
const MAX_RECENT = 5;

/**
 * Generate a unique ID for circuits
 */
function generateId(): string {
    return `circuit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse<T>(str: string | null, fallback: T): T {
    if (!str) return fallback;
    try {
        return JSON.parse(str) as T;
    } catch {
        return fallback;
    }
}

/**
 * Hook for managing circuit storage
 */
export function useCircuitStorage() {
    const [state, setState] = useState<CircuitStorageState>({
        savedCircuits: [],
        recentCircuits: [],
        isLoading: true,
        error: null,
    });

    // Load saved circuits on mount
    useEffect(() => {
        try {
            const saved = safeJsonParse<SavedCircuit[]>(
                localStorage.getItem(STORAGE_KEY),
                []
            );
            const recent = safeJsonParse<SavedCircuit[]>(
                localStorage.getItem(RECENT_KEY),
                []
            );
            setState({
                savedCircuits: saved,
                recentCircuits: recent.slice(0, MAX_RECENT),
                isLoading: false,
                error: null,
            });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: 'Failed to load saved circuits',
            }));
        }
    }, []);

    /**
     * Save a new circuit
     */
    const saveCircuit = useCallback(
        (
            name: string,
            numQubits: number,
            gates: CircuitGate[],
            description?: string
        ): SavedCircuit => {
            const now = new Date().toISOString();
            const newCircuit: SavedCircuit = {
                id: generateId(),
                name,
                description,
                numQubits,
                gates: gates.map((g) => ({ ...g })), // Deep copy
                createdAt: now,
                updatedAt: now,
            };

            setState((prev) => {
                const updated = [...prev.savedCircuits, newCircuit];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return { ...prev, savedCircuits: updated };
            });

            addToRecent(newCircuit);
            return newCircuit;
        },
        []
    );

    /**
     * Update an existing circuit
     */
    const updateCircuit = useCallback(
        (
            id: string,
            updates: Partial<Pick<SavedCircuit, 'name' | 'description' | 'numQubits' | 'gates'>>
        ): SavedCircuit | null => {
            let updated: SavedCircuit | null = null;

            setState((prev) => {
                const index = prev.savedCircuits.findIndex((c) => c.id === id);
                if (index === -1) return prev;

                updated = {
                    ...prev.savedCircuits[index],
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };

                const newCircuits = [...prev.savedCircuits];
                newCircuits[index] = updated;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newCircuits));
                return { ...prev, savedCircuits: newCircuits };
            });

            return updated;
        },
        []
    );

    /**
     * Delete a saved circuit
     */
    const deleteCircuit = useCallback((id: string): boolean => {
        let deleted = false;

        setState((prev) => {
            const filtered = prev.savedCircuits.filter((c) => c.id !== id);
            if (filtered.length !== prev.savedCircuits.length) {
                deleted = true;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

                // Also remove from recent
                const recentFiltered = prev.recentCircuits.filter((c) => c.id !== id);
                localStorage.setItem(RECENT_KEY, JSON.stringify(recentFiltered));

                return {
                    ...prev,
                    savedCircuits: filtered,
                    recentCircuits: recentFiltered,
                };
            }
            return prev;
        });

        return deleted;
    }, []);

    /**
     * Add circuit to recent list
     */
    const addToRecent = useCallback((circuit: SavedCircuit) => {
        setState((prev) => {
            const filtered = prev.recentCircuits.filter((c) => c.id !== circuit.id);
            const updated = [circuit, ...filtered].slice(0, MAX_RECENT);
            localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
            return { ...prev, recentCircuits: updated };
        });
    }, []);

    /**
     * Export circuit as JSON file
     */
    const exportCircuit = useCallback((circuit: SavedCircuit) => {
        const data = JSON.stringify(circuit, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${circuit.name.replace(/\s+/g, '_')}.qsim.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, []);

    /**
     * Import circuit from JSON file
     */
    const importCircuit = useCallback(
        async (file: File): Promise<SavedCircuit | null> => {
            try {
                const text = await file.text();
                const data = JSON.parse(text);

                // Validate required fields
                if (!data.name || !data.numQubits || !Array.isArray(data.gates)) {
                    throw new Error('Invalid circuit file format');
                }

                const now = new Date().toISOString();
                const imported: SavedCircuit = {
                    id: generateId(),
                    name: data.name,
                    description: data.description,
                    numQubits: data.numQubits,
                    gates: data.gates,
                    createdAt: now,
                    updatedAt: now,
                };

                setState((prev) => {
                    const updated = [...prev.savedCircuits, imported];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                    return { ...prev, savedCircuits: updated, error: null };
                });

                addToRecent(imported);
                return imported;
            } catch (error) {
                setState((prev) => ({
                    ...prev,
                    error: error instanceof Error ? error.message : 'Failed to import circuit',
                }));
                return null;
            }
        },
        [addToRecent]
    );

    /**
     * Generate shareable URL for circuit
     */
    const generateShareUrl = useCallback((circuit: SavedCircuit): string => {
        const compressed = btoa(JSON.stringify({
            n: circuit.name,
            q: circuit.numQubits,
            g: circuit.gates.map((g) => ({
                t: g.gate,
                q: g.qubits,
                p: g.params,
            })),
        }));

        const baseUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/simulator`
            : '/simulator';

        return `${baseUrl}?circuit=${compressed}`;
    }, []);

    /**
     * Load circuit from URL parameter
     */
    const loadFromUrl = useCallback((encoded: string): SavedCircuit | null => {
        try {
            const decoded = JSON.parse(atob(encoded));
            const now = new Date().toISOString();

            return {
                id: generateId(),
                name: decoded.n || 'Imported Circuit',
                numQubits: decoded.q || 2,
                gates: (decoded.g || []).map((g: { t: string; q: number[]; p?: number[] }, i: number) => ({
                    id: `imported-${i}`,
                    gate: g.t,
                    qubits: g.q,
                    params: g.p,
                    step: i,
                })),
                createdAt: now,
                updatedAt: now,
            };
        } catch {
            return null;
        }
    }, []);

    /**
     * Clear all saved circuits
     */
    const clearAll = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(RECENT_KEY);
        setState({
            savedCircuits: [],
            recentCircuits: [],
            isLoading: false,
            error: null,
        });
    }, []);

    return {
        ...state,
        saveCircuit,
        updateCircuit,
        deleteCircuit,
        exportCircuit,
        importCircuit,
        generateShareUrl,
        loadFromUrl,
        clearAll,
    };
}
