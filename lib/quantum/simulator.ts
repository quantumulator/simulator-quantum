/**
 * Core Quantum Simulator
 * Simulates quantum states and operations using state vector representation
 */
import { Complex, complex, magnitude, magnitudeSquared, scale, multiply, add, ZERO, ONE } from './complex';
import { Matrix, matrixVectorMultiply, tensorProduct, identity } from './matrix';
import * as Gates from './gates';

export interface QuantumState {
  numQubits: number;
  stateVector: Complex[];
}

export interface MeasurementResult {
  outcome: number;
  probability: number;
  collapsedState: Complex[];
}

export interface SimulatorConfig {
  numQubits: number;
  noiseModel?: NoiseModel;
}

export interface NoiseModel {
  depolarizing?: number;  // Depolarizing probability
  amplitude_damping?: number;  // T1 decay
  phase_damping?: number;  // T2 dephasing
  readout_error?: number;  // Measurement error
}

export interface GateOperation {
  gate: string;
  qubits: number[];
  params?: number[];
}

export interface CircuitStep {
  operations: GateOperation[];
}

export class QuantumSimulator {
  private state: Complex[];
  private numQubits: number;
  private history: Complex[][] = [];
  private operations: GateOperation[] = [];
  private noiseModel?: NoiseModel;

  constructor(config: SimulatorConfig | number) {
    if (typeof config === 'number') {
      this.numQubits = config;
      this.noiseModel = undefined;
    } else {
      this.numQubits = config.numQubits;
      this.noiseModel = config.noiseModel;
    }

    const stateSize = Math.pow(2, this.numQubits);
    this.state = Array(stateSize).fill(null).map(() => ({ ...ZERO }));
    this.state[0] = { ...ONE }; // Initialize to |0...0⟩
    this.history.push([...this.state]);
  }

  /**
   * Get the current state vector
   */
  getState(): Complex[] {
    return [...this.state];
  }

  /**
   * Get number of qubits
   */
  getNumQubits(): number {
    return this.numQubits;
  }

  /**
   * Get operation history
   */
  getOperations(): GateOperation[] {
    return [...this.operations];
  }

  /**
   * Get state history
   */
  getHistory(): Complex[][] {
    return this.history.map(s => [...s]);
  }

  /**
   * Initialize to a specific computational basis state
   */
  initialize(basisState: string | number): void {
    const stateSize = Math.pow(2, this.numQubits);
    this.state = Array(stateSize).fill(null).map(() => ({ ...ZERO }));

    let index: number;
    if (typeof basisState === 'string') {
      // Parse state like "|00⟩" or "|101⟩"
      const bits = basisState.replace(/[|⟩>]/g, '');
      index = parseInt(bits, 2);
    } else {
      index = basisState;
    }

    if (index >= 0 && index < stateSize) {
      this.state[index] = { ...ONE };
    }

    this.history = [[...this.state]];
    this.operations = [];
  }

  /**
   * Set arbitrary state vector (must be normalized)
   */
  setState(stateVector: Complex[]): void {
    const expectedSize = Math.pow(2, this.numQubits);
    if (stateVector.length !== expectedSize) {
      throw new Error(`State vector must have ${expectedSize} elements`);
    }

    // Verify normalization
    const norm = stateVector.reduce((sum, amp) => sum + magnitudeSquared(amp), 0);
    if (Math.abs(norm - 1) > 1e-6) {
      throw new Error(`State vector must be normalized (norm = ${norm})`);
    }

    this.state = stateVector.map(c => ({ ...c }));
    this.history.push([...this.state]);
  }

  /**
   * Apply a single-qubit gate
   */
  applySingleQubitGate(gate: Matrix, qubit: number): void {
    if (qubit < 0 || qubit >= this.numQubits) {
      throw new Error(`Invalid qubit index: ${qubit}`);
    }

    // Build the full operator using tensor products
    let fullOperator = qubit === 0 ? gate : identity(2);

    for (let i = 1; i < this.numQubits; i++) {
      const nextOp = i === qubit ? gate : identity(2);
      fullOperator = tensorProduct(fullOperator, nextOp);
    }

    this.state = matrixVectorMultiply(fullOperator, this.state);
    this.history.push([...this.state]);
  }

  /**
   * Apply a two-qubit gate
   */
  applyTwoQubitGate(gate: Matrix, qubit1: number, qubit2: number): void {
    if (qubit1 < 0 || qubit1 >= this.numQubits ||
      qubit2 < 0 || qubit2 >= this.numQubits) {
      throw new Error(`Invalid qubit indices: ${qubit1}, ${qubit2}`);
    }

    if (qubit1 === qubit2) {
      throw new Error('Two-qubit gate must operate on different qubits');
    }

    const n = this.numQubits;
    const stateSize = Math.pow(2, n);
    const newState: Complex[] = Array(stateSize).fill(null).map(() => ({ ...ZERO }));

    // Determine if we need to reorder qubits
    const [control, target] = [Math.min(qubit1, qubit2), Math.max(qubit1, qubit2)];
    const needsSwap = qubit1 > qubit2;

    for (let i = 0; i < stateSize; i++) {
      // Extract bits for the two qubits
      const bit1 = (i >> (n - 1 - qubit1)) & 1;
      const bit2 = (i >> (n - 1 - qubit2)) & 1;

      // Original 2-qubit state index
      const twoQubitIndex = needsSwap ? (bit2 * 2 + bit1) : (bit1 * 2 + bit2);

      for (let j = 0; j < 4; j++) {
        const newBit1 = needsSwap ? (j & 1) : ((j >> 1) & 1);
        const newBit2 = needsSwap ? ((j >> 1) & 1) : (j & 1);

        // Build new full state index
        let newIndex = i;
        // Clear and set bit1 position
        newIndex &= ~(1 << (n - 1 - qubit1));
        newIndex |= (newBit1 << (n - 1 - qubit1));
        // Clear and set bit2 position
        newIndex &= ~(1 << (n - 1 - qubit2));
        newIndex |= (newBit2 << (n - 1 - qubit2));

        const gateElement = gate[j][twoQubitIndex];
        newState[newIndex] = add(newState[newIndex], multiply(gateElement, this.state[i]));
      }
    }

    this.state = newState;
    this.history.push([...this.state]);
  }

  /**
   * High-level gate application
   */
  apply(gateName: string, ...qubits: number[]): void;
  apply(gateName: string, params: number[], ...qubits: number[]): void;
  apply(gateName: string, ...args: (number | number[])[]): void {
    let params: number[] = [];
    let qubits: number[];

    if (Array.isArray(args[0])) {
      params = args[0] as number[];
      qubits = args.slice(1) as number[];
    } else {
      qubits = args as number[];
    }

    const gateInfo = Gates.GATE_LIBRARY[gateName];
    if (!gateInfo) {
      throw new Error(`Unknown gate: ${gateName}`);
    }

    let matrix: Matrix;
    if (typeof gateInfo.matrix === 'function') {
      // Ensure params is an array and has at least one value if required
      const p = (params && params.length > 0) ? params : [0];
      matrix = gateInfo.matrix(p);
    } else {
      matrix = gateInfo.matrix;
    }

    // Safety check for NaN in matrix
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (isNaN(matrix[i][j].real) || isNaN(matrix[i][j].imag)) {
          throw new Error(`Gate ${gateName} produced NaN matrix elements with params ${JSON.stringify(params)}`);
        }
      }
    }

    this.operations.push({ gate: gateName, qubits, params });

    if (gateInfo.qubits === 1) {
      this.applySingleQubitGate(matrix, qubits[0]);
    } else if (gateInfo.qubits === 2) {
      this.applyTwoQubitGate(matrix, qubits[0], qubits[1]);
    } else {
      // For 3+ qubit gates, use general approach
      this.applyMultiQubitGate(matrix, qubits);
    }
  }

  /**
   * Apply arbitrary multi-qubit gate
   */
  private applyMultiQubitGate(gate: Matrix, qubits: number[]): void {
    // Simplified implementation for multi-qubit gates
    // Full implementation would require more complex permutation logic
    const n = this.numQubits;
    const stateSize = Math.pow(2, n);
    const gateSize = Math.pow(2, qubits.length);
    const newState: Complex[] = Array(stateSize).fill(null).map(() => ({ ...ZERO }));

    for (let i = 0; i < stateSize; i++) {
      // Extract the bits corresponding to the gate qubits
      let gateIndex = 0;
      for (let q = 0; q < qubits.length; q++) {
        const bit = (i >> (n - 1 - qubits[q])) & 1;
        gateIndex |= (bit << (qubits.length - 1 - q));
      }

      for (let j = 0; j < gateSize; j++) {
        // Build new index with updated qubit values
        let newIndex = i;
        for (let q = 0; q < qubits.length; q++) {
          const newBit = (j >> (qubits.length - 1 - q)) & 1;
          newIndex &= ~(1 << (n - 1 - qubits[q]));
          newIndex |= (newBit << (n - 1 - qubits[q]));
        }

        const gateElement = gate[j][gateIndex];
        newState[newIndex] = add(newState[newIndex], multiply(gateElement, this.state[i]));
      }
    }

    this.state = newState;
    this.history.push([...this.state]);
  }

  /**
   * Measure a single qubit
   */
  measure(qubit: number): MeasurementResult {
    if (qubit < 0 || qubit >= this.numQubits) {
      throw new Error(`Invalid qubit index: ${qubit}`);
    }

    const n = this.numQubits;
    const stateSize = Math.pow(2, n);

    // Calculate probabilities for |0⟩ and |1⟩
    let prob0 = 0;
    let prob1 = 0;

    for (let i = 0; i < stateSize; i++) {
      const bit = (i >> (n - 1 - qubit)) & 1;
      const prob = magnitudeSquared(this.state[i]);
      if (bit === 0) {
        prob0 += prob;
      } else {
        prob1 += prob;
      }
    }

    // Random measurement outcome
    const random = Math.random();
    const outcome = random < prob0 ? 0 : 1;
    const probability = outcome === 0 ? prob0 : prob1;

    // Collapse the state
    const normFactor = 1 / Math.sqrt(probability);
    const collapsedState: Complex[] = [];

    for (let i = 0; i < stateSize; i++) {
      const bit = (i >> (n - 1 - qubit)) & 1;
      if (bit === outcome) {
        collapsedState.push(scale(this.state[i], normFactor));
      } else {
        collapsedState.push({ ...ZERO });
      }
    }

    this.state = collapsedState;
    this.history.push([...this.state]);
    this.operations.push({ gate: 'MEASURE', qubits: [qubit] });

    return { outcome, probability, collapsedState: [...this.state] };
  }

  /**
   * Measure all qubits
   */
  measureAll(): number[] {
    const results: number[] = [];
    for (let i = 0; i < this.numQubits; i++) {
      results.push(this.measure(i).outcome);
    }
    return results;
  }

  /**
   * Get probability distribution without collapsing
   */
  getProbabilities(): number[] {
    return this.state.map(amp => magnitudeSquared(amp));
  }

  /**
   * Get probability of measuring a specific outcome
   */
  getProbability(outcome: number): number {
    if (outcome < 0 || outcome >= this.state.length) {
      return 0;
    }
    return magnitudeSquared(this.state[outcome]);
  }

  /**
   * Sample measurements without affecting state
   */
  sample(shots: number): Map<string, number> {
    const probabilities = this.getProbabilities();
    const results = new Map<string, number>();

    for (let shot = 0; shot < shots; shot++) {
      const random = Math.random();
      let cumulative = 0;

      for (let i = 0; i < probabilities.length; i++) {
        cumulative += probabilities[i];
        if (random < cumulative) {
          const bitstring = i.toString(2).padStart(this.numQubits, '0');
          results.set(bitstring, (results.get(bitstring) || 0) + 1);
          break;
        }
      }
    }

    return results;
  }

  /**
   * Calculate fidelity between current state and target state
   */
  fidelity(targetState: Complex[]): number {
    if (targetState.length !== this.state.length) {
      throw new Error('State dimensions must match');
    }

    let overlap = ZERO;
    for (let i = 0; i < this.state.length; i++) {
      overlap = add(overlap, multiply(
        { real: targetState[i].real, imag: -targetState[i].imag },
        this.state[i]
      ));
    }

    return magnitudeSquared(overlap);
  }

  /**
   * Reset to |0...0⟩
   */
  reset(): void {
    const stateSize = Math.pow(2, this.numQubits);
    this.state = Array(stateSize).fill(null).map(() => ({ ...ZERO }));
    this.state[0] = { ...ONE };
    this.history = [[...this.state]];
    this.operations = [];
  }

  /**
   * Get Bloch sphere coordinates for a single qubit
   * Only valid for single-qubit states or reduced density matrices
   */
  getBlochCoordinates(qubit: number): { x: number; y: number; z: number } {
    if (this.numQubits === 1) {
      const alpha = this.state[0];
      const beta = this.state[1];

      // Bloch sphere coordinates
      // |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩
      const theta = 2 * Math.acos(Math.min(1, magnitude(alpha)));
      const phi = Math.atan2(beta.imag, beta.real) - Math.atan2(alpha.imag, alpha.real);

      return {
        x: Math.sin(theta) * Math.cos(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(theta),
      };
    }

    // For multi-qubit systems, compute reduced density matrix
    // Simplified: trace out other qubits
    const n = this.numQubits;
    const stateSize = Math.pow(2, n);

    let rho00 = 0, rho11 = 0;
    let rho01: Complex = { ...ZERO };

    for (let i = 0; i < stateSize; i++) {
      const bit = (i >> (n - 1 - qubit)) & 1;
      const prob = magnitudeSquared(this.state[i]);

      if (bit === 0) rho00 += prob;
      else rho11 += prob;
    }

    // Cross terms (simplified)
    for (let i = 0; i < stateSize; i++) {
      const bit_i = (i >> (n - 1 - qubit)) & 1;
      if (bit_i === 0) {
        const j = i | (1 << (n - 1 - qubit));
        const contrib = multiply(
          { real: this.state[i].real, imag: -this.state[i].imag },
          this.state[j]
        );
        rho01 = add(rho01, contrib);
      }
    }

    return {
      x: 2 * rho01.real,
      y: 2 * rho01.imag,
      z: rho00 - rho11,
    };
  }
}

export { Gates };
