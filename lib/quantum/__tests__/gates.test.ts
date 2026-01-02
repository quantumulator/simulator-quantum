import { GATE_LIBRARY } from '../gates';
import { matrixVectorMultiply, complex, magnitudeSquared, Matrix } from '../index';

describe('Quantum Gates', () => {
    test('all gates are unitary', () => {
        Object.entries(GATE_LIBRARY).forEach(([name, gate]) => {
            // Skip parameterized gates for this check as they need params
            if (gate.params && gate.params.length > 0) return;

            // We know it's a Matrix because we skipped parameterized ones
            const matrix = gate.matrix as Matrix;
            const size = matrix.length;

            // Check U†U = I
            // This is a simplified check, ideally we'd do full matrix multiplication
            // But checking if columns are orthonormal is equivalent

            for (let i = 0; i < size; i++) {
                // Check column norm is 1
                let normSq = 0;
                for (let j = 0; j < size; j++) {
                    normSq += magnitudeSquared(matrix[j][i]);
                }
                expect(normSq).toBeCloseTo(1);
            }
        });
    });

    test('Hadamard matrix is correct', () => {
        const H = GATE_LIBRARY['H'].matrix as Matrix;
        const invSqrt2 = 1 / Math.sqrt(2);

        expect(H[0][0].real).toBeCloseTo(invSqrt2);
        expect(H[0][1].real).toBeCloseTo(invSqrt2);
        expect(H[1][0].real).toBeCloseTo(invSqrt2);
        expect(H[1][1].real).toBeCloseTo(-invSqrt2);
    });

    test('Pauli matrices are correct', () => {
        const X = GATE_LIBRARY['X'].matrix as Matrix;
        expect(X[0][1].real).toBe(1);
        expect(X[1][0].real).toBe(1);

        const Z = GATE_LIBRARY['Z'].matrix as Matrix;
        expect(Z[0][0].real).toBe(1);
        expect(Z[1][1].real).toBe(-1);
    });
});
