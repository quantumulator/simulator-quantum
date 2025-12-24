/**
 * Complex number representation for quantum state amplitudes
 */
export interface Complex {
  real: number;
  imag: number;
}

export function complex(real: number, imag: number = 0): Complex {
  return { real, imag };
}

export function add(a: Complex, b: Complex): Complex {
  return { real: a.real + b.real, imag: a.imag + b.imag };
}

export function subtract(a: Complex, b: Complex): Complex {
  return { real: a.real - b.real, imag: a.imag - b.imag };
}

export function multiply(a: Complex, b: Complex): Complex {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

export function divide(a: Complex, b: Complex): Complex {
  const denominator = b.real * b.real + b.imag * b.imag;
  return {
    real: (a.real * b.real + a.imag * b.imag) / denominator,
    imag: (a.imag * b.real - a.real * b.imag) / denominator,
  };
}

export function conjugate(a: Complex): Complex {
  return { real: a.real, imag: -a.imag };
}

export function magnitude(a: Complex): number {
  return Math.sqrt(a.real * a.real + a.imag * a.imag);
}

export function magnitudeSquared(a: Complex): number {
  return a.real * a.real + a.imag * a.imag;
}

export function phase(a: Complex): number {
  return Math.atan2(a.imag, a.real);
}

export function fromPolar(r: number, theta: number): Complex {
  return { real: r * Math.cos(theta), imag: r * Math.sin(theta) };
}

export function scale(a: Complex, scalar: number): Complex {
  return { real: a.real * scalar, imag: a.imag * scalar };
}

export function exp(a: Complex): Complex {
  const expReal = Math.exp(a.real);
  return {
    real: expReal * Math.cos(a.imag),
    imag: expReal * Math.sin(a.imag),
  };
}

export function equals(a: Complex, b: Complex, epsilon: number = 1e-10): boolean {
  return Math.abs(a.real - b.real) < epsilon && Math.abs(a.imag - b.imag) < epsilon;
}

export function toString(a: Complex, precision: number = 4): string {
  const realStr = a.real.toFixed(precision);
  const imagStr = Math.abs(a.imag).toFixed(precision);
  
  if (Math.abs(a.imag) < 1e-10) {
    return realStr;
  }
  if (Math.abs(a.real) < 1e-10) {
    return a.imag >= 0 ? `${imagStr}i` : `-${imagStr}i`;
  }
  return a.imag >= 0 ? `${realStr} + ${imagStr}i` : `${realStr} - ${imagStr}i`;
}

// Common complex numbers
export const ZERO: Complex = { real: 0, imag: 0 };
export const ONE: Complex = { real: 1, imag: 0 };
export const I: Complex = { real: 0, imag: 1 };
export const MINUS_I: Complex = { real: 0, imag: -1 };
