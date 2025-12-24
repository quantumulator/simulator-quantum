/**
 * Quantum Gate Definitions
 * All gates are unitary matrices that operate on quantum states
 */
import { Complex, complex, fromPolar } from './complex';
import { Matrix, identity, tensorProduct } from './matrix';

const SQRT2_INV = 1 / Math.sqrt(2);

// Single-Qubit Gates

/** Pauli-X (NOT) Gate: Bit flip */
export const X: Matrix = [
  [complex(0), complex(1)],
  [complex(1), complex(0)],
];

/** Pauli-Y Gate: Bit and phase flip */
export const Y: Matrix = [
  [complex(0), complex(0, -1)],
  [complex(0, 1), complex(0)],
];

/** Pauli-Z Gate: Phase flip */
export const Z: Matrix = [
  [complex(1), complex(0)],
  [complex(0), complex(-1)],
];

/** Hadamard Gate: Creates superposition */
export const H: Matrix = [
  [complex(SQRT2_INV), complex(SQRT2_INV)],
  [complex(SQRT2_INV), complex(-SQRT2_INV)],
];

/** S Gate (Phase Gate): π/2 phase */
export const S: Matrix = [
  [complex(1), complex(0)],
  [complex(0), complex(0, 1)],
];

/** S-dagger Gate: -π/2 phase */
export const SDag: Matrix = [
  [complex(1), complex(0)],
  [complex(0), complex(0, -1)],
];

/** T Gate: π/4 phase */
export const T: Matrix = [
  [complex(1), complex(0)],
  [complex(0), fromPolar(1, Math.PI / 4)],
];

/** T-dagger Gate: -π/4 phase */
export const TDag: Matrix = [
  [complex(1), complex(0)],
  [complex(0), fromPolar(1, -Math.PI / 4)],
];

/** Identity Gate */
export const I: Matrix = identity(2);

// Rotation Gates

/** Rx Gate: Rotation around X-axis */
export function Rx(theta: number): Matrix {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return [
    [complex(cos), complex(0, -sin)],
    [complex(0, -sin), complex(cos)],
  ];
}

/** Ry Gate: Rotation around Y-axis */
export function Ry(theta: number): Matrix {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return [
    [complex(cos), complex(-sin)],
    [complex(sin), complex(cos)],
  ];
}

/** Rz Gate: Rotation around Z-axis */
export function Rz(theta: number): Matrix {
  return [
    [fromPolar(1, -theta / 2), complex(0)],
    [complex(0), fromPolar(1, theta / 2)],
  ];
}

/** Phase Gate: Arbitrary phase */
export function Phase(phi: number): Matrix {
  return [
    [complex(1), complex(0)],
    [complex(0), fromPolar(1, phi)],
  ];
}

/** U3 Gate: Universal single-qubit gate */
export function U3(theta: number, phi: number, lambda: number): Matrix {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return [
    [complex(cos), { real: -sin * Math.cos(lambda), imag: -sin * Math.sin(lambda) }],
    [
      { real: sin * Math.cos(phi), imag: sin * Math.sin(phi) },
      { real: cos * Math.cos(phi + lambda), imag: cos * Math.sin(phi + lambda) }
    ],
  ];
}

// Two-Qubit Gates

/** CNOT (Controlled-X) Gate */
export const CNOT: Matrix = [
  [complex(1), complex(0), complex(0), complex(0)],
  [complex(0), complex(1), complex(0), complex(0)],
  [complex(0), complex(0), complex(0), complex(1)],
  [complex(0), complex(0), complex(1), complex(0)],
];

/** CZ (Controlled-Z) Gate */
export const CZ: Matrix = [
  [complex(1), complex(0), complex(0), complex(0)],
  [complex(0), complex(1), complex(0), complex(0)],
  [complex(0), complex(0), complex(1), complex(0)],
  [complex(0), complex(0), complex(0), complex(-1)],
];

/** SWAP Gate */
export const SWAP: Matrix = [
  [complex(1), complex(0), complex(0), complex(0)],
  [complex(0), complex(0), complex(1), complex(0)],
  [complex(0), complex(1), complex(0), complex(0)],
  [complex(0), complex(0), complex(0), complex(1)],
];

/** iSWAP Gate */
export const iSWAP: Matrix = [
  [complex(1), complex(0), complex(0), complex(0)],
  [complex(0), complex(0), complex(0, 1), complex(0)],
  [complex(0), complex(0, 1), complex(0), complex(0)],
  [complex(0), complex(0), complex(0), complex(1)],
];

/** Controlled-Phase Gate */
export function CPhase(phi: number): Matrix {
  return [
    [complex(1), complex(0), complex(0), complex(0)],
    [complex(0), complex(1), complex(0), complex(0)],
    [complex(0), complex(0), complex(1), complex(0)],
    [complex(0), complex(0), complex(0), fromPolar(1, phi)],
  ];
}

// Three-Qubit Gates

/** Toffoli (CCNOT) Gate */
export const Toffoli: Matrix = (() => {
  const m = identity(8);
  // Swap |110⟩ and |111⟩ components
  m[6][6] = complex(0);
  m[6][7] = complex(1);
  m[7][6] = complex(1);
  m[7][7] = complex(0);
  return m;
})();

/** Fredkin (CSWAP) Gate */
export const Fredkin: Matrix = (() => {
  const m = identity(8);
  // Swap |101⟩ and |110⟩ components when control is |1⟩
  m[5][5] = complex(0);
  m[5][6] = complex(1);
  m[6][5] = complex(1);
  m[6][6] = complex(0);
  return m;
})();

// Gate Information

export interface GateInfo {
  name: string;
  symbol: string;
  qubits: number;
  matrix: Matrix | ((params: number[]) => Matrix);
  params?: string[];
  description: string;
}

export const GATE_LIBRARY: Record<string, GateInfo> = {
  I: { name: 'Identity', symbol: 'I', qubits: 1, matrix: I, description: 'No operation' },
  X: { name: 'Pauli-X', symbol: 'X', qubits: 1, matrix: X, description: 'Bit flip (NOT gate)' },
  Y: { name: 'Pauli-Y', symbol: 'Y', qubits: 1, matrix: Y, description: 'Bit and phase flip' },
  Z: { name: 'Pauli-Z', symbol: 'Z', qubits: 1, matrix: Z, description: 'Phase flip' },
  H: { name: 'Hadamard', symbol: 'H', qubits: 1, matrix: H, description: 'Creates superposition' },
  S: { name: 'S Gate', symbol: 'S', qubits: 1, matrix: S, description: 'π/2 phase gate' },
  T: { name: 'T Gate', symbol: 'T', qubits: 1, matrix: T, description: 'π/4 phase gate' },
  Rx: { name: 'X Rotation', symbol: 'Rx', qubits: 1, matrix: (p) => Rx(p[0]), params: ['θ'], description: 'Rotation around X-axis' },
  Ry: { name: 'Y Rotation', symbol: 'Ry', qubits: 1, matrix: (p) => Ry(p[0]), params: ['θ'], description: 'Rotation around Y-axis' },
  Rz: { name: 'Z Rotation', symbol: 'Rz', qubits: 1, matrix: (p) => Rz(p[0]), params: ['θ'], description: 'Rotation around Z-axis' },
  CNOT: { name: 'CNOT', symbol: 'CX', qubits: 2, matrix: CNOT, description: 'Controlled-NOT gate' },
  CZ: { name: 'CZ', symbol: 'CZ', qubits: 2, matrix: CZ, description: 'Controlled-Z gate' },
  SWAP: { name: 'SWAP', symbol: 'SW', qubits: 2, matrix: SWAP, description: 'Swaps two qubits' },
  Toffoli: { name: 'Toffoli', symbol: 'CCX', qubits: 3, matrix: Toffoli, description: 'Controlled-controlled-NOT' },
  Fredkin: { name: 'Fredkin', symbol: 'CSW', qubits: 3, matrix: Fredkin, description: 'Controlled-SWAP' },
};
