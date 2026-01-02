/**
 * Global Quantum Simulator Store
 * Manages application state using Zustand
 */
import { create } from 'zustand';
import { QuantumSimulator, GateOperation, Complex } from '@/lib/quantum';
import type { QuizQuestion, SkillLevel } from '@/lib/ai/types';

export interface CircuitGate {
  id: string;
  gate: string;
  qubits: number[];
  params?: number[];
  step: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  circuitCode?: string;
  quiz?: QuizQuestion;
}

export interface SimulationResult {
  stateVector: Complex[];
  probabilities: number[];
  measurements?: Map<string, number>;
  blochCoordinates?: { x: number; y: number; z: number }[];
}

interface QuantumStore {
  // Simulator
  simulator: QuantumSimulator | null;
  numQubits: number;
  circuitGates: CircuitGate[];
  simulationResult: SimulationResult | null;
  isRunning: boolean;
  _lastRunId: number;

  // UI State
  selectedGate: string | null;
  selectedQubits: number[];
  showCodeEditor: boolean;
  activeTab: 'circuit' | 'visualization' | 'results';

  // Chat
  messages: Message[];
  isAiLoading: boolean;

  // Settings
  aiProvider: 'gemini' | 'openai' | 'anthropic';
  aiModel: string;
  apiKey: string;

  // History for undo/redo
  history: CircuitGate[][];
  historyIndex: number;

  // Actions
  initSimulator: (numQubits: number) => void;
  addGate: (gate: string, qubits: number[], params?: number[], step?: number) => void;
  removeGate: (gateId: string) => void;
  clearCircuit: () => void;
  runSimulation: () => void;
  runMeasurement: (shots: number) => void;
  setSelectedGate: (gate: string | null) => void;
  setSelectedQubits: (qubits: number[]) => void;
  toggleCodeEditor: () => void;
  setActiveTab: (tab: 'circuit' | 'visualization' | 'results') => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setAiLoading: (loading: boolean) => void;
  setAiProvider: (provider: 'gemini' | 'openai' | 'anthropic') => void;
  setAiModel: (model: string) => void;
  setApiKey: (key: string) => void;
  loadCircuitFromCode: (code: string) => void;
  reset: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useQuantumStore = create<QuantumStore>((set, get) => ({
  // Initial State
  simulator: null,
  numQubits: 2,
  circuitGates: [],
  simulationResult: null,
  isRunning: false,
  _lastRunId: 0,
  selectedGate: null,
  selectedQubits: [],
  showCodeEditor: false,
  activeTab: 'circuit',
  messages: [{
    id: generateId(),
    role: 'system',
    content: 'Welcome to the Quantum Simulator! Ask me to create quantum circuits, explain concepts, or run experiments.',
    timestamp: new Date(),
  }],
  isAiLoading: false,
  aiProvider: 'gemini',
  aiModel: 'gemini-2.0-flash-exp',
  apiKey: '',

  // History for undo/redo
  history: [[]],
  historyIndex: 0,

  // Actions
  initSimulator: (numQubits: number) => {
    const { history, historyIndex } = get();
    const simulator = new QuantumSimulator(numQubits);
    const newHistory = [...history.slice(0, historyIndex + 1), []];
    const trimmedHistory = newHistory.slice(-50);

    set({
      simulator,
      numQubits,
      circuitGates: [],
      simulationResult: null,
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1,
    });
  },

  addGate: (gate: string, qubits: number[], params?: number[], step?: number) => {
    const { circuitGates, simulator, history, historyIndex } = get();
    if (!simulator) return;

    let targetStep = step;
    if (targetStep === undefined) {
      targetStep = circuitGates.length > 0
        ? Math.max(...circuitGates.map(g => g.step)) + 1
        : 0;
    }

    const newGate: CircuitGate = {
      id: generateId(),
      gate,
      qubits,
      params,
      step: targetStep,
    };

    const newGates = [...circuitGates, newGate];
    // Truncate history after current index and add new state
    const newHistory = [...history.slice(0, historyIndex + 1), newGates.map(g => ({ ...g }))];
    // Keep only last 50 states
    const trimmedHistory = newHistory.slice(-50);

    set({
      circuitGates: newGates,
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1,
    });
  },

  removeGate: (gateId: string) => {
    const { circuitGates, history, historyIndex } = get();
    const newGates = circuitGates.filter(g => g.id !== gateId);
    const newHistory = [...history.slice(0, historyIndex + 1), newGates.map(g => ({ ...g }))];
    const trimmedHistory = newHistory.slice(-50);

    set({
      circuitGates: newGates,
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1,
    });
  },

  clearCircuit: () => {
    const { numQubits, history, historyIndex } = get();
    const simulator = new QuantumSimulator(numQubits);
    const newHistory = [...history.slice(0, historyIndex + 1), []];
    const trimmedHistory = newHistory.slice(-50);

    set({
      simulator,
      circuitGates: [],
      simulationResult: null,
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1,
    });
  },

  runSimulation: () => {
    const { numQubits, circuitGates } = get();
    if (circuitGates.length === 0) {
      set({ simulationResult: null, isRunning: false });
      return;
    }

    const runId = Math.random();
    set({ isRunning: true, _lastRunId: runId });

    // Use setTimeout to allow UI to update and show loading state
    setTimeout(() => {
      // Check if this is still the latest run
      if (get()._lastRunId !== runId) return;

      try {
        const simulator = new QuantumSimulator(numQubits);

        // Sort gates by step and apply
        const sortedGates = [...circuitGates].sort((a, b) => a.step - b.step);

        for (const gate of sortedGates) {
          if (gate.params && gate.params.length > 0) {
            simulator.apply(gate.gate, gate.params, ...gate.qubits);
          } else {
            simulator.apply(gate.gate, ...gate.qubits);
          }
        }

        const stateVector = simulator.getState();
        const probabilities = simulator.getProbabilities();

        // Calculate Bloch coordinates for each qubit
        const blochCoordinates = [];
        for (let i = 0; i < numQubits; i++) {
          blochCoordinates.push(simulator.getBlochCoordinates(i));
        }

        if (get()._lastRunId !== runId) return;

        set({
          simulator,
          simulationResult: {
            stateVector,
            probabilities,
            blochCoordinates,
          },
          isRunning: false,
        });
      } catch (error) {
        console.error('Simulation error:', error);
        if (get()._lastRunId === runId) {
          set({
            isRunning: false,
            simulationResult: null
          });
        }
      }
    }, 0);
  },

  runMeasurement: (shots: number) => {
    const { simulator } = get();
    if (!simulator) return;

    const measurements = simulator.sample(shots);

    set(state => ({
      simulationResult: state.simulationResult
        ? { ...state.simulationResult, measurements }
        : null,
    }));
  },

  setSelectedGate: (gate: string | null) => set({ selectedGate: gate }),

  setSelectedQubits: (qubits: number[]) => set({ selectedQubits: qubits }),

  toggleCodeEditor: () => set(state => ({ showCodeEditor: !state.showCodeEditor })),

  setActiveTab: (tab: 'circuit' | 'visualization' | 'results') => set({ activeTab: tab }),

  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    set(state => ({ messages: [...state.messages, newMessage] }));
  },

  setAiLoading: (loading: boolean) => set({ isAiLoading: loading }),

  setAiProvider: (provider: 'gemini' | 'openai' | 'anthropic') => set({ aiProvider: provider }),

  setAiModel: (model: string) => set({ aiModel: model }),

  setApiKey: (key: string) => set({ apiKey: key }),

  loadCircuitFromCode: (code: string) => {
    // Parse and load circuit from code string
    // This is a simplified parser - full implementation would use AST
    try {
      const lines = code.split('\n');
      const gatePattern = /sim\.apply\(['"](\w+)['"],?\s*(.+)?\)/;
      const numQubitsPattern = /QuantumSimulator\((\d+)\)/;

      let numQubits = 2;
      const gates: CircuitGate[] = [];
      let step = 0;

      for (const line of lines) {
        const qubitsMatch = line.match(numQubitsPattern);
        if (qubitsMatch) {
          numQubits = parseInt(qubitsMatch[1]);
        }

        const gateMatch = line.match(gatePattern);
        if (gateMatch) {
          const gateName = gateMatch[1];
          const argsStr = gateMatch[2];
          const args = argsStr
            ? argsStr.split(',').map(a => parseInt(a.trim())).filter(n => !isNaN(n))
            : [];

          gates.push({
            id: generateId(),
            gate: gateName,
            qubits: args,
            step: step++,
          });
        }
      }

      const { history, historyIndex } = get();
      const newHistory = [...history.slice(0, historyIndex + 1), gates.map(g => ({ ...g }))];
      const trimmedHistory = newHistory.slice(-50);

      const simulator = new QuantumSimulator(numQubits);
      set({
        simulator,
        numQubits,
        circuitGates: gates,
        simulationResult: null,
        history: trimmedHistory,
        historyIndex: trimmedHistory.length - 1,
      });
    } catch (error) {
      console.error('Failed to parse circuit code:', error);
    }
  },

  reset: () => {
    set({
      simulator: new QuantumSimulator(2),
      numQubits: 2,
      circuitGates: [],
      simulationResult: null,
      isRunning: false,
      _lastRunId: 0,
      selectedGate: null,
      selectedQubits: [],
      history: [[]],
      historyIndex: 0,
    });
  },

  // Undo/Redo Actions
  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousGates = history[newIndex];
      set({
        circuitGates: previousGates.map(g => ({ ...g })),
        historyIndex: newIndex,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextGates = history[newIndex];
      set({
        circuitGates: nextGates.map(g => ({ ...g })),
        historyIndex: newIndex,
      });
    }
  },

  canUndo: () => {
    return get().historyIndex > 0;
  },

  canRedo: () => {
    const { historyIndex, history } = get();
    return historyIndex < history.length - 1;
  },
}));
