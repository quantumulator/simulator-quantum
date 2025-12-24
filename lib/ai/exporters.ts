/**
 * Quantum Circuit Exporters
 * Export circuits to Qiskit, Cirq, Q#, and other formats
 */

import { CodeExport } from './types';

interface Gate {
  name: string;
  qubits: number[];
  params?: number[];
}

interface CircuitData {
  numQubits: number;
  gates: Gate[];
  name?: string;
}

/**
 * Parse TypeScript circuit code to extract gate operations
 */
export function parseCircuitCode(code: string): CircuitData {
  const gates: Gate[] = [];
  
  // Extract qubit count
  const qubitMatch = code.match(/QuantumSimulator\((\d+)\)/);
  const numQubits = qubitMatch ? parseInt(qubitMatch[1]) : 2;
  
  // Extract gate operations
  const gatePattern = /sim\.apply\(['"](\w+)['"]\s*(?:,\s*(\d+))?(?:\s*,\s*(\d+))?\s*(?:,\s*\[([\d.,\s]+)\])?\)/g;
  let match;
  
  while ((match = gatePattern.exec(code)) !== null) {
    const gateName = match[1];
    const qubit1 = match[2] ? parseInt(match[2]) : 0;
    const qubit2 = match[3] ? parseInt(match[3]) : undefined;
    const params = match[4] ? match[4].split(',').map(p => parseFloat(p.trim())) : undefined;
    
    const qubits = qubit2 !== undefined ? [qubit1, qubit2] : [qubit1];
    gates.push({ name: gateName, qubits, params });
  }
  
  return { numQubits, gates };
}

/**
 * Export to Qiskit (Python)
 */
export function exportToQiskit(circuit: CircuitData): CodeExport {
  const { numQubits, gates, name = 'quantum_circuit' } = circuit;
  
  let code = `"""
Quantum Circuit - Exported from Quantum Simulator
Framework: Qiskit
"""

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit import Aer, execute
from qiskit.visualization import plot_histogram, plot_bloch_multivector
import numpy as np

# Create quantum and classical registers
qr = QuantumRegister(${numQubits}, 'q')
cr = ClassicalRegister(${numQubits}, 'c')

# Create the quantum circuit
${name} = QuantumCircuit(qr, cr)

# Apply quantum gates
`;

  gates.forEach(gate => {
    const qiskitGate = mapToQiskit(gate);
    code += `${name}.${qiskitGate}\n`;
  });

  code += `
# Add measurements (optional)
# ${name}.measure(qr, cr)

# Visualization
print(${name}.draw('text'))

# Simulate the circuit
simulator = Aer.get_backend('statevector_simulator')
job = execute(${name}, simulator)
result = job.result()
statevector = result.get_statevector()

print("\\nState Vector:")
print(statevector)

# For measurement results, use qasm_simulator:
# simulator = Aer.get_backend('qasm_simulator')
# ${name}.measure_all()
# job = execute(${name}, simulator, shots=1000)
# result = job.result()
# counts = result.get_counts()
# print(counts)
# plot_histogram(counts)
`;

  return {
    language: 'qiskit',
    code,
    framework: 'Qiskit',
    version: '>=0.45.0',
    dependencies: ['qiskit', 'qiskit-aer', 'matplotlib', 'numpy'],
    runInstructions: `
# Installation
pip install qiskit qiskit-aer matplotlib

# Run the circuit
python ${name}.py

# For Jupyter notebooks, you can visualize the circuit:
# ${name}.draw('mpl')
    `.trim(),
  };
}

function mapToQiskit(gate: Gate): string {
  const { name, qubits, params } = gate;
  const q = qubits.map(q => `qr[${q}]`).join(', ');
  
  const gateMap: Record<string, string> = {
    'I': `id(${q})`,
    'X': `x(${q})`,
    'Y': `y(${q})`,
    'Z': `z(${q})`,
    'H': `h(${q})`,
    'S': `s(${q})`,
    'T': `t(${q})`,
    'Rx': `rx(${params?.[0] ?? 'np.pi/2'}, ${q})`,
    'Ry': `ry(${params?.[0] ?? 'np.pi/2'}, ${q})`,
    'Rz': `rz(${params?.[0] ?? 'np.pi/2'}, ${q})`,
    'CNOT': `cx(${q})`,
    'CX': `cx(${q})`,
    'CZ': `cz(${q})`,
    'SWAP': `swap(${q})`,
    'Toffoli': `ccx(${q})`,
    'CCX': `ccx(${q})`,
    'Fredkin': `cswap(${q})`,
    'CSWAP': `cswap(${q})`,
  };
  
  return gateMap[name] || `# Unknown gate: ${name}`;
}

/**
 * Export to Cirq (Google's quantum framework)
 */
export function exportToCirq(circuit: CircuitData): CodeExport {
  const { numQubits, gates, name = 'circuit' } = circuit;
  
  let code = `"""
Quantum Circuit - Exported from Quantum Simulator
Framework: Cirq (Google Quantum AI)
"""

import cirq
import numpy as np

# Create qubits
qubits = [cirq.LineQubit(i) for i in range(${numQubits})]

# Build the circuit
${name} = cirq.Circuit()

# Apply quantum gates
`;

  gates.forEach(gate => {
    const cirqGate = mapToCirq(gate);
    code += `${name}.append(${cirqGate})\n`;
  });

  code += `
# Print the circuit
print("Circuit:")
print(${name})

# Simulate the circuit
simulator = cirq.Simulator()

# Get the state vector
result = simulator.simulate(${name})
print("\\nState Vector:")
print(result.final_state_vector)

# For measurement-based simulation:
# ${name}.append(cirq.measure(*qubits, key='result'))
# samples = simulator.run(${name}, repetitions=1000)
# print(samples.histogram(key='result'))

# Bloch sphere visualization (single qubit)
# print(cirq.bloch_vector_from_state_vector(result.final_state_vector, 0))
`;

  return {
    language: 'cirq',
    code,
    framework: 'Cirq',
    version: '>=1.0.0',
    dependencies: ['cirq-core', 'numpy'],
    runInstructions: `
# Installation
pip install cirq-core

# Run the circuit
python ${name}_cirq.py

# For visualization
pip install cirq[contrib]
    `.trim(),
  };
}

function mapToCirq(gate: Gate): string {
  const { name, qubits, params } = gate;
  const q = qubits.map(q => `qubits[${q}]`).join(', ');
  
  const gateMap: Record<string, string> = {
    'I': `cirq.I(${q})`,
    'X': `cirq.X(${q})`,
    'Y': `cirq.Y(${q})`,
    'Z': `cirq.Z(${q})`,
    'H': `cirq.H(${q})`,
    'S': `cirq.S(${q})`,
    'T': `cirq.T(${q})`,
    'Rx': `cirq.rx(${params?.[0] ?? 'np.pi/2'})(${q})`,
    'Ry': `cirq.ry(${params?.[0] ?? 'np.pi/2'})(${q})`,
    'Rz': `cirq.rz(${params?.[0] ?? 'np.pi/2'})(${q})`,
    'CNOT': `cirq.CNOT(${q})`,
    'CX': `cirq.CNOT(${q})`,
    'CZ': `cirq.CZ(${q})`,
    'SWAP': `cirq.SWAP(${q})`,
    'Toffoli': `cirq.TOFFOLI(${q})`,
    'CCX': `cirq.TOFFOLI(${q})`,
    'Fredkin': `cirq.FREDKIN(${q})`,
    'CSWAP': `cirq.FREDKIN(${q})`,
  };
  
  return gateMap[name] || `# Unknown gate: ${name}`;
}

/**
 * Export to Q# (Microsoft Quantum Development Kit)
 */
export function exportToQSharp(circuit: CircuitData): CodeExport {
  const { numQubits, gates, name = 'QuantumCircuit' } = circuit;
  
  let code = `// Quantum Circuit - Exported from Quantum Simulator
// Framework: Q# (Microsoft Quantum Development Kit)

namespace QuantumSimulator {
    open Microsoft.Quantum.Canon;
    open Microsoft.Quantum.Intrinsic;
    open Microsoft.Quantum.Measurement;
    open Microsoft.Quantum.Math;
    
    /// # Summary
    /// Implements the quantum circuit
    operation ${name}() : Result[] {
        // Allocate ${numQubits} qubits
        use qubits = Qubit[${numQubits}];
        
        // Apply quantum gates
`;

  gates.forEach(gate => {
    const qsharpGate = mapToQSharp(gate);
    code += `        ${qsharpGate}\n`;
  });

  code += `
        // Measure all qubits
        let results = MeasureEachZ(qubits);
        
        // Reset qubits before deallocation
        ResetAll(qubits);
        
        return results;
    }
    
    /// # Summary
    /// Entry point - runs the circuit multiple times
    @EntryPoint()
    operation Main() : Unit {
        Message("Running Quantum Circuit...");
        
        // Run multiple times to see statistics
        mutable counts = [0, size = ${Math.pow(2, numQubits)}];
        for _ in 1..1000 {
            let results = ${name}();
            let index = ResultArrayAsInt(results);
            set counts w/= index <- counts[index] + 1;
        }
        
        Message("Measurement Results (1000 shots):");
        for i in 0..${Math.pow(2, numQubits) - 1} {
            if counts[i] > 0 {
                Message($"|{IntAsBinaryString(i, ${numQubits})}⟩: {counts[i]}");
            }
        }
    }
    
    /// Helper function to convert int to binary string
    function IntAsBinaryString(n : Int, bits : Int) : String {
        mutable result = "";
        mutable value = n;
        for _ in 1..bits {
            set result = (value % 2 == 0 ? "0" | "1") + result;
            set value = value / 2;
        }
        return result;
    }
}
`;

  return {
    language: 'qsharp',
    code,
    framework: 'Q# (QDK)',
    version: '>=1.0.0',
    dependencies: ['Microsoft.Quantum.Sdk'],
    runInstructions: `
# Installation
# Install .NET SDK from https://dotnet.microsoft.com/download
# Install Q# extension for VS Code

# Create a new Q# project
dotnet new console -lang Q# -o ${name}

# Replace Program.qs with the generated code
# Run the project
dotnet run
    `.trim(),
  };
}

function mapToQSharp(gate: Gate): string {
  const { name, qubits, params } = gate;
  const q = qubits.map(q => `qubits[${q}]`).join(', ');
  const q0 = `qubits[${qubits[0]}]`;
  const q1 = qubits[1] !== undefined ? `qubits[${qubits[1]}]` : '';
  const q2 = qubits[2] !== undefined ? `qubits[${qubits[2]}]` : '';
  
  const gateMap: Record<string, string> = {
    'I': `I(${q0});`,
    'X': `X(${q0});`,
    'Y': `Y(${q0});`,
    'Z': `Z(${q0});`,
    'H': `H(${q0});`,
    'S': `S(${q0});`,
    'T': `T(${q0});`,
    'Rx': `Rx(${params?.[0] ?? 'PI()/2.0'}, ${q0});`,
    'Ry': `Ry(${params?.[0] ?? 'PI()/2.0'}, ${q0});`,
    'Rz': `Rz(${params?.[0] ?? 'PI()/2.0'}, ${q0});`,
    'CNOT': `CNOT(${q0}, ${q1});`,
    'CX': `CNOT(${q0}, ${q1});`,
    'CZ': `CZ(${q0}, ${q1});`,
    'SWAP': `SWAP(${q0}, ${q1});`,
    'Toffoli': `CCNOT(${q0}, ${q1}, ${q2});`,
    'CCX': `CCNOT(${q0}, ${q1}, ${q2});`,
    'Fredkin': `Controlled SWAP([${q0}], (${q1}, ${q2}));`,
    'CSWAP': `Controlled SWAP([${q0}], (${q1}, ${q2}));`,
  };
  
  return gateMap[name] || `// Unknown gate: ${name}`;
}

/**
 * Export to OpenQASM 3.0
 */
export function exportToOpenQASM(circuit: CircuitData): CodeExport {
  const { numQubits, gates, name = 'quantum_circuit' } = circuit;
  
  let code = `// Quantum Circuit - Exported from Quantum Simulator
// Format: OpenQASM 3.0

OPENQASM 3.0;
include "stdgates.inc";

// Declare quantum register
qubit[${numQubits}] q;
// Declare classical register for measurements
bit[${numQubits}] c;

// Apply quantum gates
`;

  gates.forEach(gate => {
    const qasmGate = mapToOpenQASM(gate);
    code += `${qasmGate}\n`;
  });

  code += `
// Measure all qubits
c = measure q;
`;

  return {
    language: 'openqasm',
    code,
    framework: 'OpenQASM 3.0',
    version: '3.0',
    dependencies: [],
    runInstructions: `
# OpenQASM is a quantum assembly language standard
# You can run it with various quantum frameworks:

# With Qiskit:
from qiskit import QuantumCircuit
circuit = QuantumCircuit.from_qasm_str(qasm_code)

# With IBM Quantum:
# Upload to IBM Quantum Experience

# With Amazon Braket:
# Use the OpenQASM integration
    `.trim(),
  };
}

function mapToOpenQASM(gate: Gate): string {
  const { name, qubits, params } = gate;
  const q0 = `q[${qubits[0]}]`;
  const q1 = qubits[1] !== undefined ? `q[${qubits[1]}]` : '';
  const q2 = qubits[2] !== undefined ? `q[${qubits[2]}]` : '';
  
  const gateMap: Record<string, string> = {
    'I': `id ${q0};`,
    'X': `x ${q0};`,
    'Y': `y ${q0};`,
    'Z': `z ${q0};`,
    'H': `h ${q0};`,
    'S': `s ${q0};`,
    'T': `t ${q0};`,
    'Rx': `rx(${params?.[0] ?? 'pi/2'}) ${q0};`,
    'Ry': `ry(${params?.[0] ?? 'pi/2'}) ${q0};`,
    'Rz': `rz(${params?.[0] ?? 'pi/2'}) ${q0};`,
    'CNOT': `cx ${q0}, ${q1};`,
    'CX': `cx ${q0}, ${q1};`,
    'CZ': `cz ${q0}, ${q1};`,
    'SWAP': `swap ${q0}, ${q1};`,
    'Toffoli': `ccx ${q0}, ${q1}, ${q2};`,
    'CCX': `ccx ${q0}, ${q1}, ${q2};`,
  };
  
  return gateMap[name] || `// Unknown gate: ${name}`;
}

/**
 * Export to Pennylane (for quantum machine learning)
 */
export function exportToPennylane(circuit: CircuitData): CodeExport {
  const { numQubits, gates, name = 'quantum_circuit' } = circuit;
  
  let code = `"""
Quantum Circuit - Exported from Quantum Simulator
Framework: PennyLane (Quantum Machine Learning)
"""

import pennylane as qml
from pennylane import numpy as np

# Set up the device
dev = qml.device('default.qubit', wires=${numQubits})

@qml.qnode(dev)
def ${name}():
    """
    Quantum circuit implementation
    """
`;

  gates.forEach(gate => {
    const pennylaneGate = mapToPennylane(gate);
    code += `    ${pennylaneGate}\n`;
  });

  code += `
    # Return the state vector
    return qml.state()

# Run the circuit
state = ${name}()
print("State Vector:")
print(state)

# Print the circuit
print("\\nCircuit:")
print(qml.draw(${name})())

# For measurement probabilities:
@qml.qnode(dev)
def ${name}_probs():
`;

  gates.forEach(gate => {
    const pennylaneGate = mapToPennylane(gate);
    code += `    ${pennylaneGate}\n`;
  });

  code += `    return qml.probs(wires=range(${numQubits}))

probs = ${name}_probs()
print("\\nMeasurement Probabilities:")
for i, p in enumerate(probs):
    if p > 0.001:
        print(f"|{bin(i)[2:].zfill(${numQubits})}⟩: {p:.4f}")
`;

  return {
    language: 'pennylane',
    code,
    framework: 'PennyLane',
    version: '>=0.30.0',
    dependencies: ['pennylane', 'numpy'],
    runInstructions: `
# Installation
pip install pennylane

# Run the circuit
python ${name}_pennylane.py

# For GPU acceleration:
pip install pennylane-lightning[gpu]

# For real quantum hardware:
pip install pennylane-qiskit  # IBM Quantum
pip install amazon-braket-pennylane-plugin  # AWS Braket
    `.trim(),
  };
}

function mapToPennylane(gate: Gate): string {
  const { name, qubits, params } = gate;
  const wires = qubits.length === 1 ? qubits[0] : `[${qubits.join(', ')}]`;
  
  const gateMap: Record<string, string> = {
    'I': `qml.Identity(wires=${wires})`,
    'X': `qml.PauliX(wires=${wires})`,
    'Y': `qml.PauliY(wires=${wires})`,
    'Z': `qml.PauliZ(wires=${wires})`,
    'H': `qml.Hadamard(wires=${wires})`,
    'S': `qml.S(wires=${wires})`,
    'T': `qml.T(wires=${wires})`,
    'Rx': `qml.RX(${params?.[0] ?? 'np.pi/2'}, wires=${wires})`,
    'Ry': `qml.RY(${params?.[0] ?? 'np.pi/2'}, wires=${wires})`,
    'Rz': `qml.RZ(${params?.[0] ?? 'np.pi/2'}, wires=${wires})`,
    'CNOT': `qml.CNOT(wires=${wires})`,
    'CX': `qml.CNOT(wires=${wires})`,
    'CZ': `qml.CZ(wires=${wires})`,
    'SWAP': `qml.SWAP(wires=${wires})`,
    'Toffoli': `qml.Toffoli(wires=${wires})`,
    'CCX': `qml.Toffoli(wires=${wires})`,
    'Fredkin': `qml.CSWAP(wires=${wires})`,
    'CSWAP': `qml.CSWAP(wires=${wires})`,
  };
  
  return gateMap[name] || `# Unknown gate: ${name}`;
}

/**
 * Main export function - exports to specified language
 */
export function exportCircuit(
  circuitCode: string,
  targetLanguage: 'qiskit' | 'cirq' | 'qsharp' | 'openqasm' | 'pennylane'
): CodeExport {
  const circuit = parseCircuitCode(circuitCode);
  
  switch (targetLanguage) {
    case 'qiskit':
      return exportToQiskit(circuit);
    case 'cirq':
      return exportToCirq(circuit);
    case 'qsharp':
      return exportToQSharp(circuit);
    case 'openqasm':
      return exportToOpenQASM(circuit);
    case 'pennylane':
      return exportToPennylane(circuit);
    default:
      return exportToQiskit(circuit);
  }
}

/**
 * Get all available export formats
 */
export function getExportFormats(): { id: string; name: string; description: string }[] {
  return [
    {
      id: 'qiskit',
      name: 'Qiskit (Python)',
      description: 'IBM\'s quantum computing framework - most popular, great documentation',
    },
    {
      id: 'cirq',
      name: 'Cirq (Python)',
      description: 'Google\'s quantum framework - used for Google Quantum AI',
    },
    {
      id: 'qsharp',
      name: 'Q# (Microsoft)',
      description: 'Microsoft Quantum Development Kit - integrated with Azure Quantum',
    },
    {
      id: 'openqasm',
      name: 'OpenQASM 3.0',
      description: 'Standard quantum assembly language - portable across platforms',
    },
    {
      id: 'pennylane',
      name: 'PennyLane (Python)',
      description: 'Quantum machine learning framework - great for variational algorithms',
    },
  ];
}
