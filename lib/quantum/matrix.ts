/**
 * Matrix operations for quantum gate manipulation
 */
import { Complex, complex, multiply, add, conjugate, ZERO } from './complex';

export type Matrix = Complex[][];

export function createMatrix(rows: number, cols: number, init: Complex = ZERO): Matrix {
  return Array(rows).fill(null).map(() => 
    Array(cols).fill(null).map(() => ({ ...init }))
  );
}

export function identity(n: number): Matrix {
  const result = createMatrix(n, n);
  for (let i = 0; i < n; i++) {
    result[i][i] = complex(1, 0);
  }
  return result;
}

export function matrixMultiply(a: Matrix, b: Matrix): Matrix {
  const rowsA = a.length;
  const colsA = a[0].length;
  const colsB = b[0].length;
  
  const result = createMatrix(rowsA, colsB);
  
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = ZERO;
      for (let k = 0; k < colsA; k++) {
        sum = add(sum, multiply(a[i][k], b[k][j]));
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

export function matrixVectorMultiply(m: Matrix, v: Complex[]): Complex[] {
  const rows = m.length;
  const result: Complex[] = [];
  
  for (let i = 0; i < rows; i++) {
    let sum = ZERO;
    for (let j = 0; j < v.length; j++) {
      sum = add(sum, multiply(m[i][j], v[j]));
    }
    result.push(sum);
  }
  
  return result;
}

export function conjugateTranspose(m: Matrix): Matrix {
  const rows = m.length;
  const cols = m[0].length;
  const result = createMatrix(cols, rows);
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = conjugate(m[i][j]);
    }
  }
  
  return result;
}

export function tensorProduct(a: Matrix, b: Matrix): Matrix {
  const rowsA = a.length;
  const colsA = a[0].length;
  const rowsB = b.length;
  const colsB = b[0].length;
  
  const result = createMatrix(rowsA * rowsB, colsA * colsB);
  
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsA; j++) {
      for (let k = 0; k < rowsB; k++) {
        for (let l = 0; l < colsB; l++) {
          result[i * rowsB + k][j * colsB + l] = multiply(a[i][j], b[k][l]);
        }
      }
    }
  }
  
  return result;
}

export function isUnitary(m: Matrix, epsilon: number = 1e-10): boolean {
  const n = m.length;
  const mDagger = conjugateTranspose(m);
  const product = matrixMultiply(mDagger, m);
  const id = identity(n);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const diff = Math.abs(product[i][j].real - id[i][j].real) + 
                   Math.abs(product[i][j].imag - id[i][j].imag);
      if (diff > epsilon) return false;
    }
  }
  
  return true;
}

export function trace(m: Matrix): Complex {
  let sum = ZERO;
  const n = Math.min(m.length, m[0].length);
  for (let i = 0; i < n; i++) {
    sum = add(sum, m[i][i]);
  }
  return sum;
}
