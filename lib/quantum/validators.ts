/**
 * Quantum Simulator Input Validators
 * Provides robust validation for all quantum operations
 */

import { Complex, magnitudeSquared } from './complex';
import { GATE_LIBRARY, GateInfo } from './gates';

// Validation error class for specific quantum errors
export class QuantumValidationError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'QuantumValidationError';
    }
}

// Error codes
export const ErrorCodes = {
    INVALID_QUBIT_INDEX: 'INVALID_QUBIT_INDEX',
    INVALID_QUBIT_COUNT: 'INVALID_QUBIT_COUNT',
    INVALID_GATE: 'INVALID_GATE',
    INVALID_GATE_PARAMS: 'INVALID_GATE_PARAMS',
    INVALID_STATE_VECTOR: 'INVALID_STATE_VECTOR',
    STATE_NOT_NORMALIZED: 'STATE_NOT_NORMALIZED',
    DUPLICATE_QUBITS: 'DUPLICATE_QUBITS',
    INSUFFICIENT_QUBITS: 'INSUFFICIENT_QUBITS',
    MEMORY_LIMIT: 'MEMORY_LIMIT',
} as const;

// Configuration limits
export const LIMITS = {
    MAX_QUBITS: 20, // 2^20 = 1M amplitudes, ~16MB memory
    MIN_QUBITS: 1,
    MAX_CIRCUIT_DEPTH: 1000,
    MAX_SHOTS: 100000,
    NORMALIZATION_TOLERANCE: 1e-6,
} as const;

/**
 * Validate qubit index is within bounds
 */
export function validateQubitIndex(
    index: number,
    numQubits: number,
    context: string = 'operation'
): void {
    if (!Number.isInteger(index)) {
        throw new QuantumValidationError(
            `Qubit index must be an integer, got ${index}`,
            ErrorCodes.INVALID_QUBIT_INDEX,
            { index, context }
        );
    }

    if (index < 0 || index >= numQubits) {
        throw new QuantumValidationError(
            `Qubit index ${index} out of range [0, ${numQubits - 1}] for ${context}`,
            ErrorCodes.INVALID_QUBIT_INDEX,
            { index, numQubits, context }
        );
    }
}

/**
 * Validate qubit count is within limits
 */
export function validateQubitCount(numQubits: number): void {
    if (!Number.isInteger(numQubits)) {
        throw new QuantumValidationError(
            `Number of qubits must be an integer, got ${numQubits}`,
            ErrorCodes.INVALID_QUBIT_COUNT,
            { numQubits }
        );
    }

    if (numQubits < LIMITS.MIN_QUBITS) {
        throw new QuantumValidationError(
            `Number of qubits must be at least ${LIMITS.MIN_QUBITS}`,
            ErrorCodes.INVALID_QUBIT_COUNT,
            { numQubits, min: LIMITS.MIN_QUBITS }
        );
    }

    if (numQubits > LIMITS.MAX_QUBITS) {
        throw new QuantumValidationError(
            `Number of qubits (${numQubits}) exceeds maximum of ${LIMITS.MAX_QUBITS}. ` +
            `This would require ${Math.pow(2, numQubits)} amplitudes (~${(Math.pow(2, numQubits) * 16 / 1024 / 1024).toFixed(1)}MB memory)`,
            ErrorCodes.MEMORY_LIMIT,
            { numQubits, max: LIMITS.MAX_QUBITS }
        );
    }
}

/**
 * Validate gate name exists
 */
export function validateGateName(gateName: string): GateInfo {
    const gateInfo = GATE_LIBRARY[gateName];

    if (!gateInfo) {
        const availableGates = Object.keys(GATE_LIBRARY).join(', ');
        throw new QuantumValidationError(
            `Unknown gate "${gateName}". Available gates: ${availableGates}`,
            ErrorCodes.INVALID_GATE,
            { gateName, availableGates: Object.keys(GATE_LIBRARY) }
        );
    }

    return gateInfo;
}

/**
 * Validate gate parameters
 */
export function validateGateParams(
    gateName: string,
    params: number[] | undefined,
    gateInfo: GateInfo
): void {
    const requiredParams = gateInfo.params?.length ?? 0;
    const providedParams = params?.length ?? 0;

    if (requiredParams > 0 && providedParams === 0) {
        throw new QuantumValidationError(
            `Gate "${gateName}" requires ${requiredParams} parameter(s): ${gateInfo.params?.join(', ')}`,
            ErrorCodes.INVALID_GATE_PARAMS,
            { gateName, required: gateInfo.params, provided: params }
        );
    }

    if (params) {
        for (let i = 0; i < params.length; i++) {
            if (typeof params[i] !== 'number' || !Number.isFinite(params[i])) {
                throw new QuantumValidationError(
                    `Invalid parameter value at index ${i}: ${params[i]}. Must be a finite number.`,
                    ErrorCodes.INVALID_GATE_PARAMS,
                    { gateName, paramIndex: i, value: params[i] }
                );
            }
        }
    }
}

/**
 * Validate qubit array for multi-qubit gates
 */
export function validateQubitArray(
    qubits: number[],
    requiredCount: number,
    numQubits: number,
    gateName: string
): void {
    if (qubits.length !== requiredCount) {
        throw new QuantumValidationError(
            `Gate "${gateName}" requires ${requiredCount} qubit(s), but ${qubits.length} provided`,
            ErrorCodes.INSUFFICIENT_QUBITS,
            { gateName, required: requiredCount, provided: qubits.length }
        );
    }

    // Check for duplicates
    const uniqueQubits = new Set(qubits);
    if (uniqueQubits.size !== qubits.length) {
        throw new QuantumValidationError(
            `Duplicate qubit indices in gate "${gateName}": [${qubits.join(', ')}]`,
            ErrorCodes.DUPLICATE_QUBITS,
            { gateName, qubits }
        );
    }

    // Validate each qubit index
    for (const qubit of qubits) {
        validateQubitIndex(qubit, numQubits, `gate ${gateName}`);
    }
}

/**
 * Validate state vector
 */
export function validateStateVector(
    stateVector: Complex[],
    numQubits: number
): void {
    const expectedSize = Math.pow(2, numQubits);

    if (!Array.isArray(stateVector)) {
        throw new QuantumValidationError(
            'State vector must be an array',
            ErrorCodes.INVALID_STATE_VECTOR,
            { type: typeof stateVector }
        );
    }

    if (stateVector.length !== expectedSize) {
        throw new QuantumValidationError(
            `State vector has ${stateVector.length} elements, expected ${expectedSize} for ${numQubits} qubits`,
            ErrorCodes.INVALID_STATE_VECTOR,
            { size: stateVector.length, expected: expectedSize, numQubits }
        );
    }

    // Check each amplitude
    for (let i = 0; i < stateVector.length; i++) {
        const amp = stateVector[i];
        if (
            typeof amp !== 'object' ||
            typeof amp.real !== 'number' ||
            typeof amp.imag !== 'number' ||
            !Number.isFinite(amp.real) ||
            !Number.isFinite(amp.imag)
        ) {
            throw new QuantumValidationError(
                `Invalid amplitude at index ${i}: must be complex number {real, imag}`,
                ErrorCodes.INVALID_STATE_VECTOR,
                { index: i, value: amp }
            );
        }
    }

    // Check normalization
    const norm = stateVector.reduce((sum, amp) => sum + magnitudeSquared(amp), 0);
    if (Math.abs(norm - 1) > LIMITS.NORMALIZATION_TOLERANCE) {
        throw new QuantumValidationError(
            `State vector is not normalized (|ψ|² = ${norm.toFixed(6)}, expected 1)`,
            ErrorCodes.STATE_NOT_NORMALIZED,
            { norm, tolerance: LIMITS.NORMALIZATION_TOLERANCE }
        );
    }
}

/**
 * Validate measurement shots
 */
export function validateShots(shots: number): void {
    if (!Number.isInteger(shots) || shots < 1) {
        throw new QuantumValidationError(
            `Number of shots must be a positive integer, got ${shots}`,
            ErrorCodes.INVALID_QUBIT_COUNT,
            { shots }
        );
    }

    if (shots > LIMITS.MAX_SHOTS) {
        throw new QuantumValidationError(
            `Number of shots (${shots}) exceeds maximum of ${LIMITS.MAX_SHOTS}`,
            ErrorCodes.MEMORY_LIMIT,
            { shots, max: LIMITS.MAX_SHOTS }
        );
    }
}

/**
 * Validate basis state string (e.g., "|00⟩", "|101⟩")
 */
export function validateBasisState(
    state: string,
    numQubits: number
): number {
    const cleaned = state.replace(/[|⟩<>]/g, '');

    if (!/^[01]+$/.test(cleaned)) {
        throw new QuantumValidationError(
            `Invalid basis state "${state}". Must contain only 0s and 1s.`,
            ErrorCodes.INVALID_STATE_VECTOR,
            { state }
        );
    }

    if (cleaned.length !== numQubits) {
        throw new QuantumValidationError(
            `Basis state "${state}" has ${cleaned.length} bits, expected ${numQubits}`,
            ErrorCodes.INVALID_STATE_VECTOR,
            { state, bits: cleaned.length, expected: numQubits }
        );
    }

    return parseInt(cleaned, 2);
}

/**
 * Validate full gate operation before execution
 */
export function validateGateOperation(
    gateName: string,
    qubits: number[],
    params: number[] | undefined,
    numQubits: number
): GateInfo {
    const gateInfo = validateGateName(gateName);
    validateGateParams(gateName, params, gateInfo);
    validateQubitArray(qubits, gateInfo.qubits, numQubits, gateName);
    return gateInfo;
}
