import { QuantumSimulator } from '../simulator';
import { Complex } from '../complex';

describe('QuantumSimulator', () => {
    let simulator: QuantumSimulator;

    beforeEach(() => {
        simulator = new QuantumSimulator(2);
    });

    test('initializes with correct number of qubits', () => {
        expect(simulator.getNumQubits()).toBe(2);
        const state = simulator.getState();
        expect(state.length).toBe(4); // 2^2 = 4 amplitudes

        // Should be initialized to |00>
        expect(state[0].real).toBeCloseTo(1);
        expect(state[0].imag).toBeCloseTo(0);
        expect(state[1].real).toBeCloseTo(0);
        expect(state[2].real).toBeCloseTo(0);
        expect(state[3].real).toBeCloseTo(0);
    });

    test('applies Hadamard gate correctly', () => {
        // Apply H to qubit 0 (MSB): |00> -> (|0> + |1>)/sqrt(2) (x) |0> = (|00> + |10>) / sqrt(2)
        simulator.apply('H', 0);

        const state = simulator.getState();
        const invSqrt2 = 1 / Math.sqrt(2);

        // |00> at index 0
        expect(state[0].real).toBeCloseTo(invSqrt2);
        // |01> at index 1
        expect(state[1].real).toBeCloseTo(0);
        // |10> at index 2
        expect(state[2].real).toBeCloseTo(invSqrt2);
        // |11> at index 3
        expect(state[3].real).toBeCloseTo(0);
    });

    test('applies Pauli-X gate correctly', () => {
        // Apply X to qubit 1 (LSB): |00> -> |01>
        simulator.apply('X', 1);
        const state = simulator.getState();

        expect(state[0].real).toBeCloseTo(0);
        expect(state[1].real).toBeCloseTo(1); // |01>
        expect(state[2].real).toBeCloseTo(0);
        expect(state[3].real).toBeCloseTo(0);
    });

    test('applies CNOT gate correctly', () => {
        // Prepare |10> state: Apply X to qubit 0
        simulator.apply('X', 0);

        // Apply CNOT(0, 1) - Control 0, Target 1
        // |10> -> |11>
        simulator.apply('CNOT', 0, 1);

        const state = simulator.getState();
        expect(state[3].real).toBeCloseTo(1); // |11> is index 3
        expect(state[2].real).toBeCloseTo(0); // |10> should be empty
    });

    test('calculates probabilities correctly', () => {
        // Create superposition: H on qubit 0 -> (|00> + |10>) / sqrt(2)
        simulator.apply('H', 0);

        const probabilities = simulator.getProbabilities();

        expect(probabilities[0]).toBeCloseTo(0.5); // |00>
        expect(probabilities[1]).toBeCloseTo(0);   // |01>
        expect(probabilities[2]).toBeCloseTo(0.5); // |10>
        expect(probabilities[3]).toBeCloseTo(0);   // |11>
    });

    test('performs measurement correctly', () => {
        // Create superposition: H on qubit 0
        simulator.apply('H', 0);

        // Measure qubit 0
        const result = simulator.measure(0);

        // Outcome should be 0 or 1
        expect([0, 1]).toContain(result.outcome);

        // Probability should be 0.5
        expect(result.probability).toBeCloseTo(0.5);

        // State should collapse
        const state = simulator.getState();
        if (result.outcome === 0) {
            // Collapsed to |00>
            expect(state[0].real).toBeCloseTo(1);
            expect(state[2].real).toBeCloseTo(0);
        } else {
            // Collapsed to |10>
            expect(state[0].real).toBeCloseTo(0);
            expect(state[2].real).toBeCloseTo(1);
        }
    });
});
