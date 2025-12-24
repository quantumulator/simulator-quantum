/**
 * Quantum Simulation Library
 * Core exports for quantum computing simulation
 */

// Re-export complex numbers with explicit naming to avoid conflicts
export { 
  type Complex,
  complex,
  add,
  subtract,
  multiply,
  divide,
  conjugate,
  magnitude,
  magnitudeSquared,
  phase,
  fromPolar,
  scale,
  exp,
  equals,
  toString,
  ZERO,
  ONE,
  MINUS_I,
  // Rename the imaginary unit to avoid conflict with Identity gate
  I as ComplexI,
} from './complex';

export * from './matrix';

// Re-export gates - I here is the Identity Matrix/Gate
export * from './gates';

export { QuantumSimulator } from './simulator';
export type { 
  QuantumState, 
  MeasurementResult, 
  SimulatorConfig, 
  NoiseModel,
  GateOperation,
  CircuitStep 
} from './simulator';
