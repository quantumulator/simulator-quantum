import { create } from 'zustand';
import { LogisticsProblem, LogisticsSolution, SolverState, UIState, LogisticsNode } from './types';

interface LogisticsStore {
    // Problem State
    problem: LogisticsProblem | null;
    isLoading: boolean;
    error: string | null;

    // Solver State
    solution: LogisticsSolution | null;
    solverState: SolverState;

    // UI State
    ui: UIState;

    // Actions
    setProblem: (problem: LogisticsProblem) => void;
    setSolution: (solution: LogisticsSolution) => void;
    updateSolverState: (update: Partial<SolverState>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // UI Actions
    setViewMode: (mode: UIState['viewMode']) => void;
    setSelectedNode: (nodeId: string | null) => void;
    toggleHeatmap: () => void;
    reset: () => void;
}

const DEFAULT_SOLVER_STATE: SolverState = {
    isRunning: false,
    iteration: 0,
    temperature: 500,
    currentCost: 0,
    bestCost: Infinity,
    acceptanceProbability: 0,
    history: [],
};

const DEFAULT_UI_STATE: UIState = {
    viewMode: 'city', // Start with the detailed city view
    selectedNodeId: null,
    showHeatmap: false,
};

export const useLogisticsStore = create<LogisticsStore>((set) => ({
    problem: null,
    isLoading: false,
    error: null,

    solution: null,
    solverState: DEFAULT_SOLVER_STATE,
    ui: DEFAULT_UI_STATE,

    setProblem: (problem) => set({ problem, error: null }),

    setSolution: (solution) => set({ solution }),

    updateSolverState: (update) => set((state) => {
        // Determine if we should append to history (throttle to avoid massive arrays)
        const newHistory = [...state.solverState.history];
        if (update.currentCost !== undefined && update.iteration !== undefined) {
            // Keep history manageable, e.g., every 10th iteration or if cost changes significantly
            if (update.iteration % 5 === 0 || update.currentCost < state.solverState.bestCost) {
                newHistory.push({ iteration: update.iteration, cost: update.currentCost });
            }
        }

        return {
            solverState: {
                ...state.solverState,
                ...update,
                history: newHistory,
            }
        };
    }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    setViewMode: (viewMode) => set((state) => ({ ui: { ...state.ui, viewMode } })),

    setSelectedNode: (selectedNodeId) => set((state) => ({ ui: { ...state.ui, selectedNodeId } })),

    toggleHeatmap: () => set((state) => ({ ui: { ...state.ui, showHeatmap: !state.ui.showHeatmap } })),

    reset: () => set({
        problem: null,
        solution: null,
        solverState: DEFAULT_SOLVER_STATE,
        error: null,
        isLoading: false,
    }),
}));
