/**
 * Core Quantum Simulator
 * Optimized for performance using Float64Array state vectors.
 * Supports up to 30 qubits in desktop mode.
 */
import { Complex, ZERO, ONE } from './complex';
import { Matrix } from './matrix';
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
  depolarizing?: number;
  amplitude_damping?: number;
  phase_damping?: number;
  readout_error?: number;
}

export interface GateOperation {
  gate: string;
  qubits: number[];
  params?: number[];
}

export class QuantumSimulator {
  private numQubits: number;
  // State is stored as a Float64Array: [re0, im0, re1, im1, ...]
  private state: Float64Array;
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
    // 2 values per amplitude (real and imaginary)
    this.state = new Float64Array(stateSize * 2);
    this.state[0] = 1.0; // Initial state |0...0>
  }

  getState(): Complex[] {
    const size = Math.pow(2, this.numQubits);
    // Limit result size to prevent crashing the UI for massive qubit counts
    const resultSize = Math.min(size, 1024 * 16);
    const result: Complex[] = [];
    for (let i = 0; i < resultSize; i++) {
      result.push({ real: this.state[2 * i], imag: this.state[2 * i + 1] });
    }
    return result;
  }

  /**
   * Returns a sparse representation of the state for the UI
   */
  getSparseState(maxElements = 1000): { index: number; amplitude: Complex; probability: number }[] {
    const size = Math.pow(2, this.numQubits);
    const results: { index: number; amplitude: Complex; probability: number }[] = [];

    for (let i = 0; i < size; i++) {
      const re = this.state[2 * i];
      const im = this.state[2 * i + 1];
      const prob = re * re + im * im;

      if (prob > 1e-10) {
        results.push({
          index: i,
          amplitude: { real: re, imag: im },
          probability: prob
        });
        if (results.length >= maxElements) break;
      }
    }
    return results;
  }

  getProbabilities(): number[] {
    const size = Math.pow(2, this.numQubits);
    const resultSize = Math.min(size, 1024 * 16);
    const probs = new Float64Array(resultSize);
    for (let i = 0; i < resultSize; i++) {
      const re = this.state[2 * i];
      const im = this.state[2 * i + 1];
      probs[i] = re * re + im * im;
    }
    return Array.from(probs);
  }

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
    if (!gateInfo) throw new Error(`Unknown gate: ${gateName}`);

    let matrix: Matrix;
    if (typeof gateInfo.matrix === 'function') {
      matrix = gateInfo.matrix(params && params.length > 0 ? params : [0]);
    } else {
      matrix = gateInfo.matrix;
    }

    if (gateInfo.qubits === 1) {
      this.applySingleQubitGate(matrix, qubits[0]);
    } else if (gateInfo.qubits === 2) {
      this.applyTwoQubitGate(matrix, qubits[0], qubits[1]);
    } else {
      this.applyMultiQubitGate(matrix, qubits);
    }
  }

  private applySingleQubitGate(gate: Matrix, qubit: number): void {
    const n = this.numQubits;
    const size = Math.pow(2, n);
    const mask = 1 << (n - 1 - qubit);

    // Extract matrix elements for speed
    const g00_re = gate[0][0].real, g00_im = gate[0][0].imag;
    const g01_re = gate[0][1].real, g01_im = gate[0][1].imag;
    const g10_re = gate[1][0].real, g10_im = gate[1][0].imag;
    const g11_re = gate[1][1].real, g11_im = gate[1][1].imag;

    for (let i = 0; i < size; i++) {
      if ((i & mask) === 0) {
        const i0 = 2 * i;
        const i1 = 2 * (i | mask);

        const v0_re = this.state[i0];
        const v0_im = this.state[i0 + 1];
        const v1_re = this.state[i1];
        const v1_im = this.state[i1 + 1];

        // i0 = g00*v0 + g01*v1
        this.state[i0] = (g00_re * v0_re - g00_im * v0_im) + (g01_re * v1_re - g01_im * v1_im);
        this.state[i0 + 1] = (g00_re * v0_im + g00_im * v0_re) + (g01_re * v1_im + g01_im * v1_re);

        // i1 = g10*v0 + g11*v1
        this.state[i1] = (g10_re * v0_re - g10_im * v0_im) + (g11_re * v1_re - g11_im * v1_im);
        this.state[i1 + 1] = (g10_re * v0_im + g10_im * v0_re) + (g11_re * v1_im + g11_im * v1_re);
      }
    }
  }

  private applyTwoQubitGate(gate: Matrix, q1: number, q2: number): void {
    const n = this.numQubits;
    const size = Math.pow(2, n);
    const m1 = 1 << (n - 1 - q1);
    const m2 = 1 << (n - 1 - q2);

    for (let i = 0; i < size; i++) {
      if ((i & m1) === 0 && (i & m2) === 0) {
        const i00 = i;
        const i01 = i | m2;
        const i10 = i | m1;
        const i11 = i | m1 | m2;

        const indices = [i00, i01, i10, i11];
        const v_re = indices.map(idx => this.state[2 * idx]);
        const v_im = indices.map(idx => this.state[2 * idx + 1]);

        for (let row = 0; row < 4; row++) {
          let target_re = 0, target_im = 0;
          for (let col = 0; col < 4; col++) {
            const g_re = gate[row][col].real;
            const g_im = gate[row][col].imag;
            target_re += (g_re * v_re[col] - g_im * v_im[col]);
            target_im += (g_re * v_im[col] + g_im * v_re[col]);
          }
          const target_idx = indices[row];
          this.state[2 * target_idx] = target_re;
          this.state[2 * target_idx + 1] = target_im;
        }
      }
    }
  }

  private applyMultiQubitGate(gate: Matrix, qubits: number[]): void {
    const n = this.numQubits;
    const size = Math.pow(2, n);
    const gateSize = Math.pow(2, qubits.length);
    const masks = qubits.map(q => 1 << (n - 1 - q));
    const totalMask = masks.reduce((a, b) => a | b, 0);

    for (let i = 0; i < size; i++) {
      if ((i & totalMask) === 0) {
        const subIndices = new Int32Array(gateSize);
        for (let j = 0; j < gateSize; j++) {
          let idx = i;
          for (let k = 0; k < qubits.length; k++) {
            if ((j >> (qubits.length - 1 - k)) & 1) {
              idx |= masks[k];
            }
          }
          subIndices[j] = idx;
        }

        const v_re = new Float64Array(gateSize);
        const v_im = new Float64Array(gateSize);
        for (let j = 0; j < gateSize; j++) {
          v_re[j] = this.state[2 * subIndices[j]];
          v_im[j] = this.state[2 * subIndices[j] + 1];
        }

        for (let row = 0; row < gateSize; row++) {
          let target_re = 0, target_im = 0;
          for (let col = 0; col < gateSize; col++) {
            const g_re = gate[row][col].real;
            const g_im = gate[row][col].imag;
            target_re += (g_re * v_re[col] - g_im * v_im[col]);
            target_im += (g_re * v_im[col] + g_im * v_re[col]);
          }
          this.state[2 * subIndices[row]] = target_re;
          this.state[2 * subIndices[row] + 1] = target_im;
        }
      }
    }
  }

  getBlochCoordinates(qubit: number): { x: number; y: number; z: number } {
    const n = this.numQubits;
    const size = Math.pow(2, n);
    let rho00 = 0, rho11 = 0;
    let rho01_re = 0, rho01_im = 0;
    const mask = 1 << (n - 1 - qubit);

    for (let i = 0; i < size; i++) {
      const re = this.state[2 * i];
      const im = this.state[2 * i + 1];
      const prob = re * re + im * im;
      if ((i & mask) === 0) {
        rho00 += prob;
        const j = i | mask;
        const re_j = this.state[2 * j];
        const im_j = this.state[2 * j + 1];
        // rho01 = state[i] * conj(state[j])
        rho01_re += (re * re_j + im * im_j);
        rho01_im += (im * re_j - re * im_j);
      } else {
        rho11 += prob;
      }
    }

    return {
      x: 2 * rho01_re,
      y: 2 * rho01_im,
      z: rho00 - rho11,
    };
  }

  sample(shots: number): Map<string, number> {
    const size = Math.pow(2, this.numQubits);
    const probs = new Float64Array(size);
    for (let i = 0; i < size; i++) {
      probs[i] = this.state[2 * i] * this.state[2 * i] + this.state[2 * i + 1] * this.state[2 * i + 1];
    }

    const results = new Map<string, number>();
    for (let shot = 0; shot < shots; shot++) {
      const rnd = Math.random();
      let cumulative = 0;
      for (let i = 0; i < size; i++) {
        cumulative += probs[i];
        if (rnd < cumulative) {
          const bits = i.toString(2).padStart(this.numQubits, '0');
          results.set(bits, (results.get(bits) || 0) + 1);
          break;
        }
      }
    }
    return results;
  }
}
