/**
 * AI Agent System - Core Implementation
 * Multi-agent orchestrator with specialized agents for quantum computing tasks
 */

import {
  IntentClassification,
  AgentResponse,
  CircuitGenerationParams,
  ExplanationParams,
  AnalysisParams,
  ValidationResult,
  SkillLevel,
  AIProvider,
  CircuitMetrics,
  QuizQuestion,
  VisualizationHint,
} from './types';

// System prompts for each agent
const SYSTEM_PROMPTS = {
  intentClassifier: `You are a quantum computing intent classifier. Analyze the user's message and extract:
1. Primary intent (create_circuit, explain_concept, analyze_circuit, modify_circuit, run_experiment, debug, learn, export_code, optimize)
2. Quantum entities mentioned (gates, algorithms, concepts)
3. User expertise level based on language used (beginner, intermediate, advanced)
4. Any specific parameters (qubit count, gate types, target language)

Respond ONLY with JSON in this exact format:
{
  "primary": "intent_type",
  "confidence": 0.95,
  "entities": {
    "gates": [],
    "algorithms": [],
    "qubits": null,
    "concepts": [],
    "targetLanguage": null
  },
  "context": "beginner|intermediate|advanced",
  "suggestedActions": []
}`,

  circuitGenerator: `You are an expert quantum circuit designer. Generate TypeScript code for quantum circuits.

RULES:
1. Use our QuantumSimulator library
2. All gates must be unitary
3. Include detailed comments explaining each step
4. Handle edge cases properly
5. Generate educational, well-documented code

Available Gates: I, X, Y, Z, H, S, T, Rx, Ry, Rz, CNOT, CZ, SWAP, Toffoli, Fredkin

ALWAYS respond with:
1. Circuit code in TypeScript format
2. Step-by-step explanation
3. Expected results
4. Visualization suggestions
5. Learning points for the user's level`,

  explanationAgent: `You are a quantum computing educator. Explain concepts clearly and accurately.

Guidelines:
1. Start with intuition, then add formalism
2. Use analogies appropriate for the skill level
3. Correct common misconceptions
4. Suggest hands-on experiments
5. Include visualization opportunities

For beginners: Focus on concepts, minimal math, lots of analogies
For intermediate: Balance concepts and formalism, practical examples
For advanced: Rigorous treatment, edge cases, research connections`,

  analysisAgent: `You are a quantum circuit analyzer. Provide detailed analysis including:
1. Circuit depth and gate count
2. Entanglement structure
3. Potential optimizations
4. Critical gates for error sensitivity
5. Expected measurement statistics

Format as JSON with metrics, insights, optimizations, and visualizations.`,

  validationAgent: `You are a quantum circuit validator. Check for:
1. Unitary gates (U†U = I)
2. Normalized state vectors
3. Valid qubit indices
4. Correct gate parameters
5. No conflicting operations

Report errors, warnings, and suggestions in JSON format.`,

  codeAssistant: `You are an AI coding assistant for quantum computing. Help users:
1. Complete quantum circuit code
2. Fix errors and bugs
3. Optimize circuits
4. Add comments and documentation
5. Convert between quantum languages

Be helpful, concise, and educational.`,
};

// Few-shot examples for consistent output
const FEW_SHOT_EXAMPLES = {
  bellState: {
    request: "Create a Bell state",
    code: `const sim = new QuantumSimulator(2);

// Step 1: Apply Hadamard to qubit 0
// Creates superposition: |0⟩ → (|0⟩ + |1⟩)/√2
sim.apply('H', 0);

// Step 2: Apply CNOT (control: 0, target: 1)
// Creates entanglement: (|00⟩ + |11⟩)/√2
sim.apply('CNOT', 0, 1);`,
    explanation: "A Bell state is a maximally entangled state of two qubits. When measured, both qubits always show the same value.",
  },
  superposition: {
    request: "Create superposition",
    code: `const sim = new QuantumSimulator(1);

// Apply Hadamard gate to create equal superposition
// |0⟩ → (|0⟩ + |1⟩)/√2
sim.apply('H', 0);`,
    explanation: "The Hadamard gate creates an equal superposition, giving 50% probability of measuring 0 or 1.",
  },
};

export class IntentClassifierAgent {
  async classify(
    message: string,
    history: string[] = [],
    provider: AIProvider = 'gemini',
    apiKey?: string
  ): Promise<IntentClassification> {
    // Quick pattern matching for common intents (works offline)
    const lowerMessage = message.toLowerCase();
    
    // Pattern-based classification (fallback / demo mode)
    if (lowerMessage.includes('create') || lowerMessage.includes('make') || lowerMessage.includes('build')) {
      return this.createCircuitIntent(message);
    }
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
      return this.explainIntent(message);
    }
    if (lowerMessage.includes('analyze') || lowerMessage.includes('check') || lowerMessage.includes('evaluate')) {
      return this.analyzeIntent(message);
    }
    if (lowerMessage.includes('export') || lowerMessage.includes('convert') || lowerMessage.includes('qiskit') || lowerMessage.includes('cirq')) {
      return this.exportIntent(message);
    }
    if (lowerMessage.includes('learn') || lowerMessage.includes('teach') || lowerMessage.includes('tutorial')) {
      return this.learnIntent(message);
    }
    
    // If API key available, use AI for classification
    if (apiKey) {
      return await this.aiClassify(message, history, provider, apiKey);
    }
    
    // Default fallback
    return this.createCircuitIntent(message);
  }

  private createCircuitIntent(message: string): IntentClassification {
    const gates = this.extractGates(message);
    const qubits = this.extractQubits(message);
    const algorithms = this.extractAlgorithms(message);
    
    return {
      primary: 'create_circuit',
      confidence: 0.85,
      entities: { gates, algorithms, qubits, concepts: [] },
      context: this.inferSkillLevel(message),
      suggestedActions: ['Create circuit', 'Run simulation', 'Visualize'],
    };
  }

  private explainIntent(message: string): IntentClassification {
    const concepts = this.extractConcepts(message);
    
    return {
      primary: 'explain_concept',
      confidence: 0.9,
      entities: { concepts, gates: [], algorithms: [] },
      context: this.inferSkillLevel(message),
      suggestedActions: ['Explain with examples', 'Show visualization', 'Interactive demo'],
    };
  }

  private analyzeIntent(message: string): IntentClassification {
    return {
      primary: 'analyze_circuit',
      confidence: 0.85,
      entities: { gates: [], algorithms: [], concepts: [] },
      context: this.inferSkillLevel(message),
      suggestedActions: ['Analyze complexity', 'Check entanglement', 'Optimize'],
    };
  }

  private exportIntent(message: string): IntentClassification {
    let targetLanguage: 'qsharp' | 'qiskit' | 'cirq' | 'typescript' = 'qiskit';
    if (message.toLowerCase().includes('q#') || message.toLowerCase().includes('qsharp')) {
      targetLanguage = 'qsharp';
    } else if (message.toLowerCase().includes('cirq')) {
      targetLanguage = 'cirq';
    }
    
    return {
      primary: 'export_code',
      confidence: 0.9,
      entities: { targetLanguage, gates: [], algorithms: [], concepts: [] },
      context: this.inferSkillLevel(message),
      suggestedActions: [`Export to ${targetLanguage}`, 'Copy code', 'Download'],
    };
  }

  private learnIntent(message: string): IntentClassification {
    const concepts = this.extractConcepts(message);
    
    return {
      primary: 'learn',
      confidence: 0.85,
      entities: { concepts, gates: [], algorithms: [] },
      context: 'beginner',
      suggestedActions: ['Start tutorial', 'Show examples', 'Practice exercise'],
    };
  }

  private extractGates(message: string): string[] {
    const gatePatterns = ['hadamard', 'cnot', 'pauli', 'x gate', 'y gate', 'z gate', 'h gate', 'swap', 'toffoli', 'rotation'];
    return gatePatterns.filter(g => message.toLowerCase().includes(g.replace(' gate', '')));
  }

  private extractQubits(message: string): number | undefined {
    const match = message.match(/(\d+)\s*qubit/i);
    return match ? parseInt(match[1]) : undefined;
  }

  private extractAlgorithms(message: string): string[] {
    const algorithms = ['grover', 'shor', 'deutsch', 'bernstein-vazirani', 'simon', 'qft', 'quantum fourier', 'teleportation', 'bell state', 'ghz'];
    return algorithms.filter(a => message.toLowerCase().includes(a));
  }

  private extractConcepts(message: string): string[] {
    const concepts = ['superposition', 'entanglement', 'measurement', 'decoherence', 'interference', 'phase', 'amplitude', 'qubit', 'quantum state'];
    return concepts.filter(c => message.toLowerCase().includes(c));
  }

  private inferSkillLevel(message: string): SkillLevel {
    const advancedTerms = ['unitary', 'hermitian', 'density matrix', 'kraus', 'lindblad', 'fidelity', 'tomography'];
    const intermediateTerms = ['entanglement', 'phase', 'amplitude', 'oracle', 'eigenvalue'];
    
    if (advancedTerms.some(t => message.toLowerCase().includes(t))) return 'advanced';
    if (intermediateTerms.some(t => message.toLowerCase().includes(t))) return 'intermediate';
    return 'beginner';
  }

  private async aiClassify(
    message: string,
    history: string[],
    provider: AIProvider,
    apiKey: string
  ): Promise<IntentClassification> {
    // This would call the actual AI API
    // For now, fall back to pattern matching
    return this.createCircuitIntent(message);
  }
}

export class CircuitGeneratorAgent {
  async generate(params: CircuitGenerationParams): Promise<AgentResponse> {
    const { request, numQubits = 2, complexity = 'beginner' } = params;
    const lowerRequest = request.toLowerCase();

    // Match common circuit patterns
    if (lowerRequest.includes('bell state') || lowerRequest.includes('entangle')) {
      return this.generateBellState(complexity);
    }
    if (lowerRequest.includes('superposition') || lowerRequest.includes('hadamard')) {
      return this.generateSuperposition(numQubits, complexity);
    }
    if (lowerRequest.includes('grover')) {
      return this.generateGrover(numQubits, complexity);
    }
    if (lowerRequest.includes('teleport')) {
      return this.generateTeleportation(complexity);
    }
    if (lowerRequest.includes('ghz')) {
      return this.generateGHZ(numQubits, complexity);
    }
    if (lowerRequest.includes('qft') || lowerRequest.includes('fourier')) {
      return this.generateQFT(numQubits, complexity);
    }

    // Default: simple circuit with requested gates
    return this.generateCustomCircuit(request, numQubits, complexity);
  }

  private generateBellState(level: SkillLevel): AgentResponse {
    const code = `const sim = new QuantumSimulator(2);

// Create Bell State |Φ+⟩ = (|00⟩ + |11⟩)/√2
// This is a maximally entangled state

// Step 1: Apply Hadamard to qubit 0
// |00⟩ → (|00⟩ + |10⟩)/√2
sim.apply('H', 0);

// Step 2: Apply CNOT with control=0, target=1
// (|00⟩ + |10⟩)/√2 → (|00⟩ + |11⟩)/√2
sim.apply('CNOT', 0, 1);`;

    const explanations: Record<SkillLevel, string> = {
      beginner: `🎉 **Bell State Created!**

Think of it like this: You have two coins that are magically connected. When you flip one and it lands on heads, the other one ALWAYS lands on heads too - no matter how far apart they are!

**What happened:**
1. We put the first qubit in a "maybe" state (both 0 and 1 at once)
2. We connected it to the second qubit
3. Now they're "entangled" - they'll always match!

**Try this:** Run the simulation and measure both qubits. You'll always see 00 or 11, never 01 or 10!`,

      intermediate: `**Bell State |Φ+⟩ Created**

This circuit creates maximally entangled qubits using:
1. **Hadamard (H)**: Creates superposition |0⟩ → (|0⟩ + |1⟩)/√2
2. **CNOT**: Entangles the qubits via controlled operation

The resulting state (|00⟩ + |11⟩)/√2 exhibits:
- Maximum entanglement (concurrence = 1)
- Perfect correlation in measurements
- Violation of Bell inequalities`,

      advanced: `**Bell State |Φ+⟩ = (|00⟩ + |11⟩)/√2**

Circuit depth: 2, Gate count: 2 (1 single-qubit, 1 two-qubit)

This maximally entangled state has:
- Von Neumann entropy S(ρ_A) = 1 (maximum for 2D)
- Concurrence C = 1
- Violates CHSH inequality with S = 2√2 ≈ 2.83

The reduced density matrices are maximally mixed: ρ_A = ρ_B = I/2

Applications: Quantum teleportation, superdense coding, BB84 QKD`,
    };

    return {
      success: true,
      content: explanations[level],
      circuitCode: code,
      explanation: explanations[level],
      visualization: [
        { type: 'bloch', qubit: 0, description: 'Qubit 0 after Hadamard', timing: 'during' },
        { type: 'statevector', description: 'Final entangled state', timing: 'after' },
        { type: 'histogram', description: 'Measurement correlations', timing: 'after' },
      ],
      nextSteps: [
        'Try measuring both qubits to see correlation',
        'Create other Bell states: |Φ-⟩, |Ψ+⟩, |Ψ-⟩',
        'Use this for quantum teleportation',
      ],
      quiz: level === 'beginner' ? {
        question: 'If you measure the first qubit and get 1, what will the second qubit be?',
        options: ['Always 0', 'Always 1', 'Random', 'Depends on timing'],
        correctIndex: 1,
        explanation: 'In a Bell state, qubits are perfectly correlated. Both always show the same value!',
        difficulty: 'beginner',
      } : undefined,
    };
  }

  private generateSuperposition(numQubits: number, level: SkillLevel): AgentResponse {
    let code = `const sim = new QuantumSimulator(${numQubits});\n\n// Create equal superposition on all qubits\n`;
    
    for (let i = 0; i < numQubits; i++) {
      code += `sim.apply('H', ${i});  // Qubit ${i}: |0⟩ → (|0⟩ + |1⟩)/√2\n`;
    }

    const totalStates = Math.pow(2, numQubits);
    
    return {
      success: true,
      content: level === 'beginner' 
        ? `🌟 **Superposition Created!**\n\nEach qubit is now in BOTH states at once! With ${numQubits} qubits, we're exploring ${totalStates} possibilities simultaneously.\n\nThis is quantum parallelism - the source of quantum computing's power!`
        : `**${numQubits}-Qubit Superposition**\n\nCreated state: |ψ⟩ = (1/√${totalStates}) Σ|x⟩ where x ranges over all ${numQubits}-bit strings.\n\nEach computational basis state has equal probability 1/${totalStates}.`,
      circuitCode: code,
      visualization: [
        { type: 'bloch', qubit: 0, description: 'Each qubit on the equator', timing: 'after' },
        { type: 'histogram', description: 'Equal probability distribution', timing: 'after' },
      ],
      nextSteps: ['Add more gates to explore', 'Measure to collapse the superposition', 'Learn about interference'],
    };
  }

  private generateGrover(numQubits: number, level: SkillLevel): AgentResponse {
    const code = `const sim = new QuantumSimulator(${numQubits});

// Grover's Algorithm - Quantum Search
// Finds marked item in O(√N) vs classical O(N)

// Step 1: Initialize superposition
${Array.from({length: numQubits}, (_, i) => `sim.apply('H', ${i});`).join('\n')}

// Step 2: Oracle - marks the target state |${Array(numQubits).fill('1').join('')}⟩
// Using controlled-Z as oracle
${numQubits >= 2 ? `sim.apply('CZ', 0, 1);` : `sim.apply('Z', 0);`}

// Step 3: Diffusion operator (amplitude amplification)
${Array.from({length: numQubits}, (_, i) => `sim.apply('H', ${i});`).join('\n')}
${Array.from({length: numQubits}, (_, i) => `sim.apply('X', ${i});`).join('\n')}
${numQubits >= 2 ? `sim.apply('CZ', 0, 1);` : `sim.apply('Z', 0);`}
${Array.from({length: numQubits}, (_, i) => `sim.apply('X', ${i});`).join('\n')}
${Array.from({length: numQubits}, (_, i) => `sim.apply('H', ${i});`).join('\n')}`;

    return {
      success: true,
      content: level === 'beginner'
        ? `🔍 **Grover's Search Algorithm!**\n\nImagine finding a name in a phone book. Classically, you check each page. Quantumly, you check ALL pages at once and amplify the right answer!\n\nWith ${numQubits} qubits searching ${Math.pow(2, numQubits)} items, Grover's needs only ~${Math.ceil(Math.PI/4 * Math.sqrt(Math.pow(2, numQubits)))} steps instead of ${Math.pow(2, numQubits)}!`
        : `**Grover's Algorithm (${numQubits} qubits)**\n\nSearching through N=${Math.pow(2, numQubits)} items.\nOptimal iterations: ⌊π/4 × √N⌋ = ${Math.floor(Math.PI/4 * Math.sqrt(Math.pow(2, numQubits)))}\n\nThe circuit implements one Grover iteration: Oracle + Diffusion.`,
      circuitCode: code,
      visualization: [
        { type: 'histogram', description: 'Amplitude amplification over iterations', timing: 'after' },
        { type: 'statevector', description: 'Watch the target amplitude grow', timing: 'during' },
      ],
      nextSteps: ['Run multiple iterations', 'Try different oracle targets', 'Compare success probability'],
    };
  }

  private generateTeleportation(level: SkillLevel): AgentResponse {
    const code = `const sim = new QuantumSimulator(3);

// Quantum Teleportation Protocol
// Teleports the state of qubit 0 to qubit 2

// Step 1: Prepare state to teleport on qubit 0
// Let's teleport |+⟩ state as an example
sim.apply('H', 0);

// Step 2: Create Bell pair between qubits 1 and 2
sim.apply('H', 1);
sim.apply('CNOT', 1, 2);

// Step 3: Bell measurement on qubits 0 and 1
sim.apply('CNOT', 0, 1);
sim.apply('H', 0);

// After measurement, apply corrections to qubit 2:
// If qubit 1 = 1: Apply X to qubit 2
// If qubit 0 = 1: Apply Z to qubit 2
// (Simulated by conditional gates in real implementation)`;

    return {
      success: true,
      content: level === 'beginner'
        ? `📡 **Quantum Teleportation!**\n\nThis is like sending a secret message, but the message is a quantum state!\n\n**The trick:**\n1. Share an entangled pair with your friend\n2. Entangle your message qubit with your half\n3. Measure and tell your friend the results\n4. They decode the message!\n\n*No actual matter moves - just quantum information!*`
        : `**Quantum Teleportation Protocol**\n\nThis protocol transfers an arbitrary quantum state |ψ⟩ = α|0⟩ + β|1⟩ from Alice to Bob using:\n- 1 shared Bell pair\n- 2 classical bits of communication\n- LOCC (Local Operations + Classical Communication)\n\nFidelity: 100% (perfect in ideal case)`,
      circuitCode: code,
      visualization: [
        { type: 'entanglement', description: 'Bell pair between qubits 1-2', timing: 'before' },
        { type: 'statevector', description: 'State transfer visualization', timing: 'after' },
      ],
      nextSteps: ['Try teleporting different initial states', 'Add measurement and corrections', 'Explore superdense coding'],
    };
  }

  private generateGHZ(numQubits: number, level: SkillLevel): AgentResponse {
    let code = `const sim = new QuantumSimulator(${numQubits});

// GHZ State - Generalized Bell state for ${numQubits} qubits
// Creates: (|${'0'.repeat(numQubits)}⟩ + |${'1'.repeat(numQubits)}⟩)/√2

// Step 1: Hadamard on first qubit
sim.apply('H', 0);

// Step 2: Chain of CNOTs to entangle all qubits
`;
    for (let i = 0; i < numQubits - 1; i++) {
      code += `sim.apply('CNOT', ${i}, ${i + 1});\n`;
    }

    return {
      success: true,
      content: level === 'beginner'
        ? `🔗 **GHZ State Created!**\n\nYou've made ${numQubits} qubits ALL connected! They're now in a state where they're either ALL 0 or ALL 1.\n\nThis is like having ${numQubits} coins that magically always land on the same side!`
        : `**GHZ State (${numQubits} qubits)**\n\n|GHZ⟩ = (|${'0'.repeat(numQubits)}⟩ + |${'1'.repeat(numQubits)}⟩)/√2\n\nThis is a maximally entangled state demonstrating genuine multipartite entanglement. Used in quantum error correction and multi-party protocols.`,
      circuitCode: code,
      visualization: [
        { type: 'entanglement', description: 'Multi-qubit entanglement graph', timing: 'after' },
        { type: 'histogram', description: 'All-0 and all-1 outcomes only', timing: 'after' },
      ],
      nextSteps: ['Measure all qubits', 'Compare with W state', 'Explore error effects'],
    };
  }

  private generateQFT(numQubits: number, level: SkillLevel): AgentResponse {
    let code = `const sim = new QuantumSimulator(${numQubits});

// Quantum Fourier Transform
// The quantum analog of the classical DFT

`;
    for (let i = 0; i < numQubits; i++) {
      code += `// QFT on qubit ${i}\n`;
      code += `sim.apply('H', ${i});\n`;
      for (let j = i + 1; j < numQubits; j++) {
        const k = j - i + 1;
        code += `sim.apply('Rz', [${Math.PI / Math.pow(2, k)}], ${j}); // R${k} controlled by ${i}\n`;
      }
      code += '\n';
    }
    code += '// Swap qubits to reverse order\n';
    for (let i = 0; i < Math.floor(numQubits / 2); i++) {
      code += `sim.apply('SWAP', ${i}, ${numQubits - 1 - i});\n`;
    }

    return {
      success: true,
      content: level === 'beginner'
        ? `🌊 **Quantum Fourier Transform!**\n\nThis transforms quantum states from "number space" to "frequency space" - like how music apps show sound frequencies!\n\nIt's a key ingredient in Shor's algorithm for breaking encryption!`
        : `**Quantum Fourier Transform (${numQubits} qubits)**\n\nTransforms computational basis states to Fourier basis:\n|j⟩ → (1/√N) Σₖ exp(2πijk/N)|k⟩\n\nCircuit depth: O(n²), Gates: O(n²)\nKey component of phase estimation and Shor's algorithm.`,
      circuitCode: code,
      visualization: [
        { type: 'statevector', description: 'Phase distribution visualization', timing: 'after' },
      ],
      nextSteps: ['Apply to different initial states', 'Combine with phase estimation', 'Learn about inverse QFT'],
    };
  }

  private generateCustomCircuit(request: string, numQubits: number, level: SkillLevel): AgentResponse {
    let code = `const sim = new QuantumSimulator(${numQubits});\n\n`;
    
    // Parse request for gates
    const gateMap: Record<string, string> = {
      'x': 'X', 'not': 'X',
      'y': 'Y',
      'z': 'Z',
      'h': 'H', 'hadamard': 'H',
      's': 'S',
      't': 'T',
      'cnot': 'CNOT', 'cx': 'CNOT',
      'cz': 'CZ',
      'swap': 'SWAP',
    };

    Object.entries(gateMap).forEach(([key, gate]) => {
      if (request.toLowerCase().includes(key)) {
        code += `sim.apply('${gate}', 0);\n`;
      }
    });

    if (code.trim().endsWith(`(${numQubits});`)) {
      code += `// Add your gates here\nsim.apply('H', 0);\n`;
    }

    return {
      success: true,
      content: `**Custom Circuit Created**\n\nI've created a basic circuit based on your request. Feel free to modify it!`,
      circuitCode: code,
      nextSteps: ['Add more gates', 'Adjust qubit count', 'Run and visualize'],
    };
  }
}

export class ExplanationAgent {
  explain(params: ExplanationParams): AgentResponse {
    const { topic, skillLevel, includeExamples = true, includeQuiz = true } = params;
    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes('superposition')) {
      return this.explainSuperposition(skillLevel, includeQuiz);
    }
    if (lowerTopic.includes('entanglement')) {
      return this.explainEntanglement(skillLevel, includeQuiz);
    }
    if (lowerTopic.includes('measurement') || lowerTopic.includes('collapse')) {
      return this.explainMeasurement(skillLevel, includeQuiz);
    }
    if (lowerTopic.includes('qubit')) {
      return this.explainQubit(skillLevel, includeQuiz);
    }
    if (lowerTopic.includes('hadamard') || lowerTopic.includes('h gate')) {
      return this.explainHadamard(skillLevel, includeQuiz);
    }

    return this.genericExplanation(topic, skillLevel);
  }

  private explainSuperposition(level: SkillLevel, includeQuiz: boolean): AgentResponse {
    const explanations: Record<SkillLevel, string> = {
      beginner: `## 🌈 What is Superposition?

Imagine a coin spinning in the air. While it's spinning, it's not heads OR tails - it's kind of both at once! That's like superposition.

**In quantum computing:**
- A regular bit is either 0 OR 1
- A qubit in superposition is 0 AND 1 at the same time!

**Why it matters:**
When we do calculations, a qubit in superposition explores multiple answers simultaneously. It's like having a magical assistant who reads all books in a library at once!

**Try it yourself:**
Apply a Hadamard gate (H) to put a qubit in superposition. When you measure it, you'll randomly get 0 or 1 - each with 50% probability.

🎯 **Key Point:** Superposition is fragile. As soon as you look (measure), the qubit "decides" to be 0 or 1.`,

      intermediate: `## Superposition

A qubit in superposition exists in a linear combination of basis states:

|ψ⟩ = α|0⟩ + β|1⟩

where α and β are complex amplitudes satisfying |α|² + |β|² = 1.

**Key Properties:**
- |α|² gives probability of measuring 0
- |β|² gives probability of measuring 1
- Phase (arg of α, β) matters for interference

**Creating Superposition:**
The Hadamard gate H transforms:
- |0⟩ → (|0⟩ + |1⟩)/√2
- |1⟩ → (|0⟩ - |1⟩)/√2

**Applications:**
- Quantum parallelism in algorithms
- Interference for amplitude amplification
- Quantum random number generation`,

      advanced: `## Superposition - Formal Treatment

A pure quantum state in a d-dimensional Hilbert space is a unit vector:

|ψ⟩ = Σᵢ αᵢ|i⟩ where Σᵢ|αᵢ|² = 1

**Density Matrix Representation:**
Pure state: ρ = |ψ⟩⟨ψ|
Coherent superposition: off-diagonal elements ρᵢⱼ ≠ 0

**Decoherence:**
Environmental interaction causes superposition decay:
ρᵢⱼ(t) = ρᵢⱼ(0)e^(-t/T₂) for i ≠ j

**Quantum Computing Context:**
Superposition enables exponential parallelism: n qubits represent 2ⁿ states simultaneously. However, measurement collapses to one outcome, requiring clever algorithm design (Grover, Shor) to extract useful information.`,
    };

    const quiz: QuizQuestion = {
      question: 'What happens when you measure a qubit in superposition?',
      options: [
        'It stays in superposition',
        'It randomly becomes 0 or 1 (collapses)',
        'It becomes exactly 0.5',
        'It disappears'
      ],
      correctIndex: 1,
      explanation: 'Measurement causes the qubit to "collapse" into either |0⟩ or |1⟩, with probabilities determined by the amplitudes.',
      difficulty: level,
    };

    return {
      success: true,
      content: explanations[level],
      explanation: explanations[level],
      visualization: [
        { type: 'bloch', description: 'See superposition on the Bloch sphere equator', timing: 'after' },
      ],
      quiz: includeQuiz ? quiz : undefined,
      nextSteps: ['Create a superposition with H gate', 'Measure to see collapse', 'Learn about interference'],
    };
  }

  private explainEntanglement(level: SkillLevel, includeQuiz: boolean): AgentResponse {
    const explanations: Record<SkillLevel, string> = {
      beginner: `## 🔗 What is Entanglement?

Imagine two magical dice. When you roll them - no matter how far apart - they ALWAYS show the same number. If one shows 3, the other shows 3 too. Instantly. Always.

**That's entanglement!**

In quantum computing, when qubits are entangled:
- They become connected in a special way
- Measuring one instantly affects the other
- This works even if they're on opposite sides of the universe!

**How to create it:**
1. Put one qubit in superposition (H gate)
2. Use CNOT to connect them
3. Now they're entangled!

**Why it's useful:**
- Quantum teleportation
- Super-secure communication
- Faster algorithms

🎯 **Fun Fact:** Einstein called this "spooky action at a distance"!`,

      intermediate: `## Quantum Entanglement

Entanglement is a correlation between quantum systems that cannot be explained by classical physics.

**Mathematical Definition:**
A state |ψ⟩ is entangled if it cannot be written as a product state:
|ψ⟩ ≠ |φ₁⟩ ⊗ |φ₂⟩

**Bell States (maximally entangled):**
- |Φ⁺⟩ = (|00⟩ + |11⟩)/√2
- |Φ⁻⟩ = (|00⟩ - |11⟩)/√2
- |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2
- |Ψ⁻⟩ = (|01⟩ - |10⟩)/√2

**Properties:**
- Non-local correlations
- Monogamy of entanglement
- Cannot be used for FTL communication (no-signaling)

**Quantifying Entanglement:**
- Concurrence: C ∈ [0, 1]
- Entanglement entropy: S(ρ_A) = -Tr(ρ_A log ρ_A)`,

      advanced: `## Entanglement - Formal Framework

**Schmidt Decomposition:**
Any bipartite pure state can be written as:
|ψ⟩ = Σᵢ √λᵢ |uᵢ⟩|vᵢ⟩

where λᵢ are Schmidt coefficients. State is entangled iff more than one λᵢ > 0.

**Mixed State Entanglement:**
Entanglement witnesses, PPT criterion, entanglement measures (negativity, relative entropy of entanglement).

**Bell Inequality Violation:**
CHSH inequality: |S| ≤ 2 (classical)
Quantum: S_max = 2√2 (Tsirelson bound)

**Applications:**
- Quantum error correction (stabilizer codes)
- Measurement-based quantum computing
- Quantum communication complexity`,
    };

    const quiz: QuizQuestion = {
      question: 'In a Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2, if you measure the first qubit and get 0, what will the second qubit be?',
      options: ['Random (50/50)', 'Definitely 0', 'Definitely 1', 'In superposition'],
      correctIndex: 1,
      explanation: 'In |Φ⁺⟩, the qubits are perfectly correlated. Measuring 0 on the first qubit instantly means the second is also 0.',
      difficulty: level,
    };

    return {
      success: true,
      content: explanations[level],
      explanation: explanations[level],
      visualization: [
        { type: 'entanglement', description: 'Visualize qubit correlations', timing: 'after' },
        { type: 'histogram', description: 'See correlated measurement outcomes', timing: 'after' },
      ],
      quiz: includeQuiz ? quiz : undefined,
      nextSteps: ['Create a Bell state', 'Verify correlation by measurement', 'Try quantum teleportation'],
    };
  }

  private explainMeasurement(level: SkillLevel, includeQuiz: boolean): AgentResponse {
    return {
      success: true,
      content: level === 'beginner'
        ? `## 📏 Quantum Measurement\n\nMeasurement is like opening a mystery box - once you look, the mystery is gone!\n\nBefore measuring, a qubit can be in superposition (0 AND 1). When you measure:\n- The qubit "picks" either 0 or 1\n- This choice is random (but probabilities are predictable)\n- You can't go back to superposition\n\n**Key insight:** Measurement changes the system. This is fundamentally different from classical physics where observation doesn't affect reality.`
        : `## Quantum Measurement\n\n**Born Rule:**\nP(m) = |⟨m|ψ⟩|² \n\n**Post-measurement state:**\n|ψ⟩ → |m⟩ (projection onto eigenstate)\n\nMeasurement is an irreversible, probabilistic process described by positive operator-valued measures (POVMs) in the general case.`,
      visualization: [
        { type: 'bloch', description: 'Watch state collapse to pole', timing: 'during' },
        { type: 'histogram', description: 'Statistical measurement outcomes', timing: 'after' },
      ],
      quiz: includeQuiz ? {
        question: 'Can you reverse a quantum measurement?',
        options: ['Yes, with another measurement', 'Yes, with a unitary gate', 'No, it\'s irreversible', 'Only sometimes'],
        correctIndex: 2,
        explanation: 'Measurement is fundamentally irreversible. It destroys quantum information (superposition/entanglement).',
        difficulty: level,
      } : undefined,
      nextSteps: ['Create superposition and measure', 'Observe statistical patterns', 'Learn about the Born rule'],
    };
  }

  private explainQubit(level: SkillLevel, includeQuiz: boolean): AgentResponse {
    return {
      success: true,
      content: level === 'beginner'
        ? `## 🔮 What is a Qubit?\n\nA qubit is the quantum version of a regular bit!\n\n**Classical bit:** Either 0 or 1 (like a light switch)\n**Qubit:** Can be 0, 1, or BOTH at once (superposition)\n\n**Physical examples:**\n- Electron spin (up/down)\n- Photon polarization (horizontal/vertical)\n- Superconducting circuits\n\n**Special powers:**\n- Superposition: Be in multiple states\n- Entanglement: Connect with other qubits\n- Interference: Amplitudes can add or cancel\n\n🎯 The Bloch sphere helps us visualize qubit states in 3D!`
        : `## The Qubit\n\n|ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1\n\n**Bloch Sphere Representation:**\n|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩\n\n- θ: polar angle (0 = |0⟩, π = |1⟩)\n- φ: azimuthal angle (relative phase)\n\n**Operations:** Unitary 2×2 matrices (SU(2) group)`,
      visualization: [
        { type: 'bloch', description: 'Explore the Bloch sphere', timing: 'after' },
      ],
      quiz: includeQuiz ? {
        question: 'How many values can a qubit hold simultaneously?',
        options: ['2', 'Infinite (continuous superposition)', '4', '1'],
        correctIndex: 1,
        explanation: 'A qubit exists in a continuous superposition of |0⟩ and |1⟩, parameterized by two angles on the Bloch sphere.',
        difficulty: level,
      } : undefined,
      nextSteps: ['Explore the Bloch sphere', 'Apply gates and watch state change', 'Learn about superposition'],
    };
  }

  private explainHadamard(level: SkillLevel, includeQuiz: boolean): AgentResponse {
    return {
      success: true,
      content: level === 'beginner'
        ? `## ⚡ The Hadamard Gate (H)\n\nThe H gate is like a magic wand that creates superposition!\n\n**What it does:**\n- |0⟩ → "half 0, half 1" (both at once!)\n- |1⟩ → "half 0, half 1" but with a twist\n\n**Visual:** On the Bloch sphere, H rotates the state from the north pole to the equator.\n\n**Fun fact:** Apply H twice and you're back where you started! H × H = I\n\n🎯 **Try it:** Add an H gate and watch the Bloch sphere!`
        : `## Hadamard Gate\n\nH = (1/√2) | 1   1 |\n         | 1  -1 |\n\n**Action:**\n- H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2\n- H|1⟩ = |−⟩ = (|0⟩ - |1⟩)/√2\n\n**Properties:**\n- Self-inverse: H² = I\n- Changes computational to Hadamard basis\n- Essential for creating superposition`,
      circuitCode: `sim.apply('H', 0); // Creates superposition`,
      visualization: [
        { type: 'bloch', qubit: 0, description: 'Watch the rotation from |0⟩ to |+⟩', timing: 'during' },
      ],
      quiz: includeQuiz ? {
        question: 'What happens if you apply H gate twice to |0⟩?',
        options: ['Get |1⟩', 'Get back |0⟩', 'Get superposition', 'Random result'],
        correctIndex: 1,
        explanation: 'H is self-inverse: H×H = I (identity). So H(H|0⟩) = |0⟩',
        difficulty: level,
      } : undefined,
      nextSteps: ['Try H gate on |0⟩ and |1⟩', 'Combine with other gates', 'Create entanglement with H+CNOT'],
    };
  }

  private genericExplanation(topic: string, level: SkillLevel): AgentResponse {
    return {
      success: true,
      content: `## ${topic}\n\nI'd be happy to explain "${topic}"! This is an interesting quantum computing concept.\n\n${level === 'beginner' 
        ? 'Let me break it down in simple terms...' 
        : 'Here are the key technical details...'}\n\nWould you like me to:\n1. Show a circuit demonstrating this concept?\n2. Provide a more detailed explanation?\n3. Give you an interactive exercise?`,
      nextSteps: ['Ask for a demonstration', 'Try a related exercise', 'Explore connected concepts'],
    };
  }
}

export class AnalysisAgent {
  analyze(params: AnalysisParams): AgentResponse {
    const { circuitCode, analysisType } = params;
    
    // Parse the circuit code to extract metrics
    const metrics = this.extractMetrics(circuitCode);
    const insights = this.generateInsights(metrics);
    const optimizations = this.suggestOptimizations(circuitCode, metrics);

    return {
      success: true,
      content: `## Circuit Analysis\n\n${this.formatAnalysis(metrics, insights)}`,
      analysis: {
        metrics,
        insights,
        optimizations,
        educationalNotes: [
          'Circuit depth affects error accumulation',
          'Two-qubit gates are typically more error-prone',
          'Consider gate decomposition for hardware compatibility',
        ],
      },
      visualization: [
        { type: 'circuit', description: 'Annotated circuit diagram', timing: 'after' },
      ],
    };
  }

  private extractMetrics(code: string): CircuitMetrics {
    const lines = code.split('\n');
    let gateCount = 0;
    let twoQubitGates = 0;
    let singleQubitGates = 0;
    let measurementCount = 0;
    
    const twoQubitGateNames = ['CNOT', 'CZ', 'SWAP', 'CX'];
    
    lines.forEach(line => {
      if (line.includes("sim.apply(")) {
        gateCount++;
        if (twoQubitGateNames.some(g => line.includes(g))) {
          twoQubitGates++;
        } else if (line.includes('measure')) {
          measurementCount++;
        } else {
          singleQubitGates++;
        }
      }
    });

    const qubitMatch = code.match(/QuantumSimulator\((\d+)\)/);
    const qubitCount = qubitMatch ? parseInt(qubitMatch[1]) : 2;

    return {
      gateCount,
      depth: Math.ceil(gateCount / qubitCount), // Simplified estimate
      qubitCount,
      twoQubitGates,
      singleQubitGates,
      measurementCount,
    };
  }

  private generateInsights(metrics: CircuitMetrics): string[] {
    const insights: string[] = [];
    
    if (metrics.twoQubitGates > 0) {
      insights.push(`Contains ${metrics.twoQubitGates} two-qubit gates - qubits may be entangled`);
    }
    if (metrics.depth > 10) {
      insights.push('High circuit depth may accumulate errors on real hardware');
    }
    if (metrics.twoQubitGates > metrics.singleQubitGates) {
      insights.push('Circuit is heavily entangling - good for quantum advantage');
    }
    if (metrics.gateCount < 5) {
      insights.push('Simple circuit - great for learning basics!');
    }

    return insights;
  }

  private suggestOptimizations(code: string, metrics: CircuitMetrics): { type: string; description: string; originalGates: string; optimizedGates: string; improvement: string }[] {
    const optimizations: { type: string; description: string; originalGates: string; optimizedGates: string; improvement: string }[] = [];

    // Check for common patterns
    if (code.includes("'H'") && code.includes("'H'")) {
      const hCount = (code.match(/'H'/g) || []).length;
      if (hCount >= 2) {
        optimizations.push({
          type: 'gate_cancellation',
          description: 'Adjacent Hadamard gates cancel out (H·H = I)',
          originalGates: 'H, H',
          optimizedGates: '(none)',
          improvement: 'Removes 2 gates',
        });
      }
    }

    if (code.includes("'X'") && code.includes("'X'")) {
      optimizations.push({
        type: 'gate_cancellation',
        description: 'Adjacent X gates cancel out (X·X = I)',
        originalGates: 'X, X',
        optimizedGates: '(none)',
        improvement: 'Removes 2 gates',
      });
    }

    return optimizations;
  }

  private formatAnalysis(metrics: CircuitMetrics, insights: string[]): string {
    return `**Circuit Metrics:**
- Total gates: ${metrics.gateCount}
- Circuit depth: ~${metrics.depth}
- Qubits: ${metrics.qubitCount}
- Single-qubit gates: ${metrics.singleQubitGates}
- Two-qubit gates: ${metrics.twoQubitGates}

**Insights:**
${insights.map(i => `• ${i}`).join('\n')}`;
  }
}

export class ValidationAgent {
  validate(circuitCode: string): ValidationResult {
    const errors: { severity: 'error'; location: string; message: string; fix?: string }[] = [];
    const warnings: { severity: 'warning'; location: string; message: string; suggestion?: string }[] = [];
    const suggestions: string[] = [];

    const lines = circuitCode.split('\n');
    let qubitCount = 2;

    // Extract qubit count
    const qubitMatch = circuitCode.match(/QuantumSimulator\((\d+)\)/);
    if (qubitMatch) {
      qubitCount = parseInt(qubitMatch[1]);
    }

    lines.forEach((line, index) => {
      // Check for valid qubit indices
      const applyMatch = line.match(/sim\.apply\(['"](\w+)['"],?\s*(\d+)(?:,\s*(\d+))?\)/);
      if (applyMatch) {
        const qubit1 = parseInt(applyMatch[2]);
        const qubit2 = applyMatch[3] ? parseInt(applyMatch[3]) : null;

        if (qubit1 >= qubitCount) {
          errors.push({
            severity: 'error',
            location: `Line ${index + 1}`,
            message: `Qubit index ${qubit1} exceeds simulator size (${qubitCount} qubits)`,
            fix: `Use qubit index 0-${qubitCount - 1}`,
          });
        }

        if (qubit2 !== null && qubit2 >= qubitCount) {
          errors.push({
            severity: 'error',
            location: `Line ${index + 1}`,
            message: `Qubit index ${qubit2} exceeds simulator size (${qubitCount} qubits)`,
            fix: `Use qubit index 0-${qubitCount - 1}`,
          });
        }

        if (qubit2 !== null && qubit1 === qubit2) {
          errors.push({
            severity: 'error',
            location: `Line ${index + 1}`,
            message: 'Two-qubit gate cannot have same control and target',
            fix: 'Use different qubit indices',
          });
        }
      }
    });

    // Add suggestions
    if (!circuitCode.includes("'H'")) {
      suggestions.push('Consider adding Hadamard gates to create superposition');
    }
    if (!circuitCode.includes('CNOT') && !circuitCode.includes('CZ')) {
      suggestions.push('Add two-qubit gates to create entanglement');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
}

// Main Agent Orchestrator
export class AgentOrchestrator {
  private intentClassifier = new IntentClassifierAgent();
  private circuitGenerator = new CircuitGeneratorAgent();
  private explanationAgent = new ExplanationAgent();
  private analysisAgent = new AnalysisAgent();
  private validationAgent = new ValidationAgent();

  async processRequest(
    message: string,
    context: {
      history?: string[];
      currentCircuit?: string;
      skillLevel?: SkillLevel;
      provider?: AIProvider;
      model?: string;
      apiKey?: string;
    } = {}
  ): Promise<AgentResponse> {
    const { history = [], skillLevel = 'beginner', provider = 'gemini', model, apiKey } = context;

    try {
      // Step 1: Classify intent
      const intent = await this.intentClassifier.classify(message, history, provider, apiKey);

      // Step 2: Route to appropriate agent
      switch (intent.primary) {
        case 'create_circuit':
          const circuitResponse = await this.circuitGenerator.generate({
            request: message,
            numQubits: intent.entities.qubits,
            complexity: skillLevel,
          });
          
          // Validate generated circuit
          if (circuitResponse.circuitCode) {
            const validation = this.validationAgent.validate(circuitResponse.circuitCode);
            if (!validation.valid) {
              circuitResponse.content += '\n\n⚠️ **Validation Notes:**\n' + 
                validation.errors.map(e => `• ${e.message}`).join('\n');
            }
          }
          
          return circuitResponse;

        case 'explain_concept':
          return this.explanationAgent.explain({
            topic: message,
            skillLevel,
            includeExamples: true,
            includeQuiz: skillLevel === 'beginner',
          });

        case 'analyze_circuit':
          if (context.currentCircuit) {
            return this.analysisAgent.analyze({
              circuitCode: context.currentCircuit,
              analysisType: 'full',
            });
          }
          return {
            success: false,
            content: 'Please create or load a circuit first to analyze it.',
            suggestions: ['Create a Bell state', 'Load an example circuit'],
          };

        case 'learn':
          return this.explanationAgent.explain({
            topic: message,
            skillLevel: 'beginner',
            includeExamples: true,
            includeQuiz: true,
          });

        case 'export_code':
          return {
            success: true,
            content: 'I can export your circuit to Qiskit, Cirq, or Q#. Which format would you prefer?',
            suggestions: ['Export to Qiskit (Python)', 'Export to Cirq', 'Export to Q#'],
          };

        default:
          // Try to be helpful
          return await this.circuitGenerator.generate({
            request: message,
            complexity: skillLevel,
          });
      }
    } catch (error) {
      // Handle API errors gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('rate') || 
                          errorMessage.includes('quota') ||
                          errorMessage.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit) {
        console.log('[AgentOrchestrator] Rate limit hit, using fallback response');
        
        // Try to use local processing (no API calls)
        return await this.getFallbackResponse(message, skillLevel);
      }
      
      console.error('[AgentOrchestrator] Error:', error);
      return {
        success: false,
        content: `I encountered an issue: ${errorMessage}\n\nPlease try again or explore the circuit builder directly.`,
        suggestions: ['Try again', 'Build circuit manually', 'View tutorials'],
      };
    }
  }
  
  // Fallback response using local processing (no API)
  private async getFallbackResponse(message: string, skillLevel: SkillLevel): Promise<AgentResponse> {
    const lowerMessage = message.toLowerCase();
    
    // Try circuit generation fallback
    const circuitFallback = await this.circuitGenerator.generate({
      request: message,
      complexity: skillLevel,
    });
    
    // If it's a question about concepts, use explanation agent
    if (lowerMessage.includes('what') || lowerMessage.includes('how') || 
        lowerMessage.includes('why') || lowerMessage.includes('explain')) {
      return this.explanationAgent.explain({
        topic: message,
        skillLevel,
        includeExamples: true,
        includeQuiz: false,
      });
    }
    
    return circuitFallback;
  }
}

// Export singleton instance
export const agentOrchestrator = new AgentOrchestrator();
