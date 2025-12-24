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
  
  // Actions
  initSimulator: (numQubits: number) => void;
  addGate: (gate: string, qubits: number[], params?: number[]) => void;
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
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useQuantumStore = create<QuantumStore>((set, get) => ({
  // Initial State
  simulator: null,
  numQubits: 2,
  circuitGates: [],
  simulationResult: null,
  isRunning: false,
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

  // Actions
  initSimulator: (numQubits: number) => {
    const simulator = new QuantumSimulator(numQubits);
    set({ 
      simulator, 
      numQubits, 
      circuitGates: [],
      simulationResult: null,
    });
  },

  addGate: (gate: string, qubits: number[], params?: number[]) => {
    const { circuitGates, simulator } = get();
    if (!simulator) return;
    
    const maxStep = circuitGates.length > 0 
      ? Math.max(...circuitGates.map(g => g.step))
      : -1;
    
    const newGate: CircuitGate = {
      id: generateId(),
      gate,
      qubits,
      params,
      step: maxStep + 1,
    };
    
    set({ circuitGates: [...circuitGates, newGate] });
  },

  removeGate: (gateId: string) => {
    const { circuitGates } = get();
    set({ circuitGates: circuitGates.filter(g => g.id !== gateId) });
  },

  clearCircuit: () => {
    const { numQubits } = get();
    const simulator = new QuantumSimulator(numQubits);
    set({ 
      simulator, 
      circuitGates: [],
      simulationResult: null,
    });
  },

  runSimulation: () => {
    const { numQubits, circuitGates } = get();
    set({ isRunning: true });
    
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
      set({ isRunning: false });
    }
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
      
      const simulator = new QuantumSimulator(numQubits);
      set({ simulator, numQubits, circuitGates: gates });
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
      selectedGate: null,
      selectedQubits: [],
    });
  },
}));
