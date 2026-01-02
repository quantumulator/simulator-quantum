import {
    validateQubitIndex,
    validateQubitCount,
    validateGateName,
    validateGateParams,
    QuantumValidationError,
    ErrorCodes
} from '../validators';
import { GATE_LIBRARY } from '../gates';

describe('Quantum Validators', () => {
    describe('validateQubitIndex', () => {
        test('accepts valid index', () => {
            expect(() => validateQubitIndex(0, 2)).not.toThrow();
            expect(() => validateQubitIndex(1, 2)).not.toThrow();
        });

        test('rejects negative index', () => {
            try {
                validateQubitIndex(-1, 2);
                fail('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(QuantumValidationError);
                expect((e as QuantumValidationError).code).toBe(ErrorCodes.INVALID_QUBIT_INDEX);
            }
        });

        test('rejects out of bounds index', () => {
            try {
                validateQubitIndex(2, 2);
                fail('Should have thrown');
            } catch (e) {
                expect(e).toBeInstanceOf(QuantumValidationError);
                expect((e as QuantumValidationError).code).toBe(ErrorCodes.INVALID_QUBIT_INDEX);
            }
        });
    });

    describe('validateQubitCount', () => {
        test('accepts valid count', () => {
            expect(() => validateQubitCount(1)).not.toThrow();
            expect(() => validateQubitCount(20)).not.toThrow();
        });

        test('rejects too few qubits', () => {
            expect(() => validateQubitCount(0)).toThrow(QuantumValidationError);
        });

        test('rejects too many qubits', () => {
            expect(() => validateQubitCount(21)).toThrow(QuantumValidationError);
        });
    });

    describe('validateGateName', () => {
        test('accepts valid gate', () => {
            expect(validateGateName('H')).toBeDefined();
            expect(validateGateName('CNOT')).toBeDefined();
        });

        test('rejects invalid gate', () => {
            expect(() => validateGateName('INVALID')).toThrow(QuantumValidationError);
        });
    });

    describe('validateGateParams', () => {
        test('accepts valid params', () => {
            const rx = GATE_LIBRARY['Rx'];
            expect(() => validateGateParams('Rx', [Math.PI], rx)).not.toThrow();
        });

        test('rejects missing params', () => {
            const rx = GATE_LIBRARY['Rx'];
            expect(() => validateGateParams('Rx', [], rx)).toThrow(QuantumValidationError);
        });

        test('rejects invalid param values', () => {
            const rx = GATE_LIBRARY['Rx'];
            expect(() => validateGateParams('Rx', [NaN], rx)).toThrow(QuantumValidationError);
        });
    });
});
