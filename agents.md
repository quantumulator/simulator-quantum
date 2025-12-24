# AI Agent System - Quantum Simulator

## Overview

The AI agent system powers the natural language interface that generates quantum circuits, simulations, and educational content. This document details the architecture, prompt engineering strategies, and implementation patterns for creating accurate, safe, and educational quantum computing experiences.

## Agent Architecture

### Multi-Agent System

```
User Input
    ↓
[Intent Classifier Agent]
    ↓
┌─────────────┬──────────────┬─────────────┬──────────────┐
│   Circuit   │ Explanation  │ Analysis    │ Validation   │
│   Generator │    Agent     │   Agent     │   Agent      │
└─────────────┴──────────────┴─────────────┴──────────────┘
    ↓              ↓               ↓              ↓
         [Orchestrator Agent]
                ↓
         [Response Formatter]
                ↓
            UI Updates
```

## Agent Roles & Responsibilities

### 1. Intent Classifier Agent

**Purpose**: Understand user intent and route to appropriate specialized agents

**Input**: Raw user message
**Output**: Intent classification + extracted parameters

```typescript
interface IntentClassification {
  primary: 'create_circuit' | 'explain_concept' | 'analyze_circuit' | 
           'modify_circuit' | 'run_experiment' | 'debug' | 'learn';
  confidence: number;
  entities: {
    gates?: string[];
    algorithms?: string[];
    qubits?: number;
    concepts?: string[];
    modifications?: string[];
  };
  context: 'beginner' | 'intermediate' | 'advanced';
}
```

**Prompt Template**:
```
You are a quantum computing intent classifier. Analyze the user's message and extract:
1. Primary intent (circuit creation, explanation, analysis, etc.)
2. Quantum entities mentioned (gates, algorithms, concepts)
3. User expertise level based on language used
4. Any specific parameters (qubit count, gate types)

User message: "{user_input}"
Previous context: {conversation_history}

Respond ONLY with JSON in this format:
{
  "primary": "intent_type",
  "confidence": 0.95,
  "entities": {...},
  "context": "expertise_level"
}
```

### 2. Circuit Generator Agent

**Purpose**: Generate quantum circuits from natural language descriptions

**Capabilities**:
- Create circuits from scratch
- Implement known algorithms
- Compose custom gate sequences
- Generate circuits for educational demonstrations

**Prompt Template**:
```typescript
const circuitGeneratorPrompt = `
You are a quantum circuit designer. Generate TypeScript code for a quantum circuit.

RULES:
1. Use our quantum simulation library (imported as 'QuantumSimulator')
2. All gates must preserve unitarity
3. Include comments explaining each step
4. Normalize state vectors
5. Handle edge cases (invalid qubit indices, etc.)

Available Gates:
- Single-qubit: H, X, Y, Z, S, T, Rx(theta), Ry(theta), Rz(theta)
- Two-qubit: CNOT, CZ, SWAP
- Multi-qubit: Toffoli, Fredkin
- Measurement: measure(qubit, basis?)

Request: {user_request}
Number of qubits: {num_qubits}
Complexity level: {complexity}

Generate code in this format:
\`\`\`typescript
import { QuantumSimulator, Gates } from '@/lib/quantum';

export function generateCircuit() {
  const sim = new QuantumSimulator({num_qubits});
  
  // Step 1: Initialize state
  sim.initialize('|0...0>'); // or specific state
  
  // Step 2: Apply gates
  // [Your gates here with explanatory comments]
  
  // Step 3: Return circuit
  return {
    simulator: sim,
    metadata: {
      description: "...",
      algorithm: "...",
      expected_result: "..."
    }
  };
}
\`\`\`

IMPORTANT: 
- Verify all matrix operations are unitary
- Explain quantum principles at work
- Suggest visualizations for key states
- Include measurement strategy
`;
```

**Example Interactions**:

```typescript
// User: "Create a Bell state"
const bellStateResponse = `
\`\`\`typescript
export function generateCircuit() {
  const sim = new QuantumSimulator(2);
  sim.initialize('|00>');
  
  // Apply Hadamard to qubit 0 to create superposition
  // |0> → (|0> + |1>)/√2
  sim.apply(Gates.H, 0);
  
  // Apply CNOT with qubit 0 as control, qubit 1 as target
  // Creates entanglement: (|00> + |11>)/√2
  sim.apply(Gates.CNOT, 0, 1);
  
  return {
    simulator: sim,
    metadata: {
      description: "Bell state (maximally entangled state)",
      algorithm: "Bell state preparation",
      expected_result: "50% |00>, 50% |11> when measured"
    }
  };
}
\`\`\`

This creates a maximally entangled Bell state. When measured, you'll see 
perfect correlation: both qubits always have the same value.

Suggested visualizations:
1. Bloch sphere for qubit 0 after Hadamard
2. State vector before and after CNOT
3. Measurement histogram over 1000 runs
`;
```

### 3. Explanation Agent

**Purpose**: Provide clear, accurate quantum computing explanations

**Teaching Strategies**:
- Use multiple representations (math, metaphor, visualization)
- Build on prior knowledge
- Address common misconceptions
- Provide interactive examples

**Prompt Template**:
```
You are a quantum computing educator. Explain concepts clearly and accurately.

User expertise: {expertise_level}
Topic: {topic}
Context: {related_circuit_or_context}

Guidelines:
1. Start with intuition, then formalism
2. Use analogies appropriate for expertise level
3. Correct common misconceptions
4. Suggest hands-on experiments
5. Link to visualization opportunities

For beginners: Focus on concepts, light on math
For intermediate: Balance concepts and formalism
For advanced: Rigorous treatment, edge cases

Concept to explain: {concept}
Related circuit: {circuit_code}
```

**Example**:
```
User: "Why does measurement collapse the state?"

Response structure:
1. Intuitive explanation
2. What happens mathematically
3. Why it's weird/counterintuitive
4. Interactive demonstration idea
5. Further reading
```

### 4. Analysis Agent

**Purpose**: Analyze circuits and provide insights

**Analysis Types**:
- Circuit complexity metrics
- Entanglement analysis
- Gate equivalence
- Optimization suggestions
- Error susceptibility

**Prompt Template**:
```
You are a quantum circuit analyzer. Provide detailed analysis of this circuit.

Circuit code: {circuit_code}
Analysis type: {analysis_type}

Analyze:
1. Circuit depth and gate count
2. Entanglement structure (which qubits are entangled)
3. Potential optimizations (gate cancellations, decompositions)
4. Critical gates (those most sensitive to errors)
5. Expected measurement statistics

Provide:
- Quantitative metrics
- Visual recommendations
- Optimization suggestions
- Educational insights

Format response as JSON:
{
  "metrics": {...},
  "insights": [...],
  "optimizations": [...],
  "visualizations": [...]
}
```

### 5. Validation Agent

**Purpose**: Verify generated code and circuits for correctness

**Validation Checks**:
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

enum ValidationCheck {
  UNITARITY = 'unitarity',        // Gates preserve norm
  NORMALIZATION = 'normalization', // State vectors normalized
  QUBIT_BOUNDS = 'qubit_bounds',   // Valid qubit indices
  GATE_SYNTAX = 'gate_syntax',     // Correct gate parameters
  MATRIX_HERMITIAN = 'hermitian',  // Where required
  COMPOSITION = 'composition',     // Gate composition rules
}
```

**Prompt Template**:
```
You are a quantum circuit validator. Check this circuit for errors.

Circuit code: {circuit_code}

Verify:
1. All gates are unitary (U†U = I)
2. State vectors are normalized (Σ|αᵢ|² = 1)
3. Qubit indices are valid (0 ≤ qubit < num_qubits)
4. Gate parameters are in valid ranges
5. No conflicting operations

For each issue found:
- Severity: error (breaks simulation) or warning (suboptimal)
- Location: line number or gate
- Explanation: what's wrong
- Fix suggestion: how to correct it

Respond in JSON format:
{
  "valid": boolean,
  "errors": [{severity, location, message, fix}],
  "warnings": [...],
  "suggestions": [...]
}
```

## Specialized Agent Workflows

### Algorithm Implementation Workflow

```
User: "Implement Grover's algorithm for 3 qubits"
    ↓
[Intent Classifier] → create_circuit, algorithm=grover, qubits=3
    ↓
[Circuit Generator]
    ↓
1. Generate oracle for marked state
2. Generate diffusion operator  
3. Calculate optimal iterations: π/4 * √(2^n)
4. Compose full circuit
5. Add measurements
    ↓
[Validation Agent] → Verify unitarity, check iterations
    ↓
[Explanation Agent] → Explain each component
    ↓
[Analysis Agent] → Calculate success probability
    ↓
[Response Formatter] → Present complete package
```

### Educational Tutorial Workflow

```
User: "Teach me about quantum entanglement"
    ↓
[Intent Classifier] → learn, concept=entanglement
    ↓
[Explanation Agent]
    ↓
1. Assess user level
2. Generate conceptual explanation
3. Create simple example (Bell state)
    ↓
[Circuit Generator] → Create demonstration circuit
    ↓
[Orchestrator] → Sequence interactive steps:
    - Explain concept
    - Show circuit
    - Run simulation
    - Visualize correlations
    - Present quiz question
    ↓
[Response Formatter] → Progressive disclosure
```

### Debugging Workflow

```
User: "My circuit gives unexpected results"
    ↓
[Intent Classifier] → debug + circuit_context
    ↓
[Analysis Agent]
    ↓
1. Examine circuit structure
2. Check gate sequence
3. Simulate step-by-step
4. Compare expected vs actual
    ↓
[Validation Agent] → Look for common errors
    ↓
[Explanation Agent] → Explain what's happening
    ↓
Suggest fixes:
    - Gate order issues
    - Missing gates
    - Wrong parameters
    - Measurement timing
```

## AI Provider Integration

### Provider Abstraction Layer

```typescript
interface AIProvider {
  generateCircuit(params: CircuitGenerationParams): Promise<CircuitCode>;
  explainConcept(params: ExplanationParams): Promise<Explanation>;
  analyzeCircuit(params: AnalysisParams): Promise<Analysis>;
  validateCircuit(params: ValidationParams): Promise<ValidationResult>;
}

class GeminiProvider implements AIProvider {
  constructor(private apiKey: string, private model: string) {}
  
  async generateCircuit(params: CircuitGenerationParams) {
    const prompt = this.buildCircuitPrompt(params);
    const response = await this.callGeminiAPI(prompt);
    return this.parseCircuitResponse(response);
  }
  
  private buildCircuitPrompt(params: CircuitGenerationParams): string {
    return `${SYSTEM_PROMPT}\n\n${circuitGeneratorPrompt(params)}`;
  }
}

// Similar implementations for OpenAI, Anthropic, Custom
```

### Model Selection Strategy

```typescript
interface ModelConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'custom';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const MODEL_RECOMMENDATIONS = {
  quick_prototyping: {
    provider: 'gemini',
    model: 'gemini-3-flash-preview',
    temperature: 0.3,
    maxTokens: 2048
  },
  complex_algorithms: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.2,
    maxTokens: 4096
  },
  educational_content: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5',
    temperature: 0.5,
    maxTokens: 3000
  },
  code_validation: {
    provider: 'gemini',
    model: 'gemini-3-flash-preview',
    temperature: 0.1,
    maxTokens: 1024
  }
};
```

## Prompt Engineering Patterns

### 1. Few-Shot Learning

```typescript
const fewShotExamples = [
  {
    input: "Create a Hadamard gate",
    output: `
sim.apply(Gates.H, 0); // Hadamard: (|0⟩+|1⟩)/√2
// Creates equal superposition
    `
  },
  {
    input: "Create CNOT between qubits 0 and 1",
    output: `
sim.apply(Gates.CNOT, 0, 1); // Control: 0, Target: 1
// If qubit 0 is |1⟩, flip qubit 1
    `
  }
];

// Include in prompt for consistent formatting
```

### 2. Chain-of-Thought Prompting

```
For complex algorithms, use step-by-step reasoning:

"Let's implement Grover's algorithm step by step:

Step 1: Initialize
- Start with n qubits in |0...0⟩
- Apply Hadamard to all qubits → equal superposition

Step 2: Oracle
- Mark the target state by phase flip
- Use controlled-Z gates based on target

Step 3: Diffusion
- Apply H to all qubits
- Apply X to all qubits
- Multi-controlled Z (flip phase of |0...0⟩)
- Apply X to all qubits
- Apply H to all qubits

Step 4: Repeat
- Repeat oracle + diffusion π/4 * √(2^n) times

Step 5: Measure
- Measure all qubits
- Target state has high probability

Now implement this:
[Generated code follows this structure]"
```

### 3. Constrained Generation

```
CONSTRAINTS for code generation:
1. MUST use only available gates
2. MUST check qubit indices
3. MUST include error handling
4. MUST explain each step
5. MUST NOT use deprecated syntax
6. MUST follow TypeScript strict mode

VALIDATE before returning:
- Syntax check
- Type check
- Quantum physics check
- Security check (no eval, no arbitrary code execution)
```

### 4. Iterative Refinement

```typescript
async function generateWithRefinement(userRequest: string) {
  // First pass: Generate initial circuit
  let circuit = await agent.generateCircuit(userRequest);
  
  // Validate
  const validation = await agent.validate(circuit);
  
  if (!validation.valid) {
    // Refinement pass: Fix errors
    circuit = await agent.refineCircuit(circuit, validation.errors);
  }
  
  // Optimize
  const optimized = await agent.optimizeCircuit(circuit);
  
  // Final validation
  const finalValidation = await agent.validate(optimized);
  
  return {
    circuit: optimized,
    validation: finalValidation,
    metadata: await agent.analyzeCircuit(optimized)
  };
}
```

## Safety & Security

### Code Execution Sandboxing

```typescript
class SafeExecutionEnvironment {
  private allowedAPIs = [
    'QuantumSimulator',
    'Gates',
    'Math',
    'Complex',
    'Array',
    'Object'
  ];
  
  async executeCircuit(code: string): Promise<ExecutionResult> {
    // Parse AST
    const ast = parse(code);
    
    // Check for dangerous patterns
    const securityCheck = this.securityAudit(ast);
    if (!securityCheck.safe) {
      throw new SecurityError(securityCheck.issues);
    }
    
    // Execute in Web Worker
    const worker = new Worker('/quantum-worker.js');
    const result = await this.runInWorker(worker, code);
    
    return result;
  }
  
  private securityAudit(ast: AST): SecurityCheck {
    const dangerousPatterns = [
      'eval', 'Function', 'require', 'import',
      'fetch', 'XMLHttpRequest', '__proto__',
      'localStorage', 'sessionStorage', 'indexedDB'
    ];
    
    // Check AST for dangerous patterns
    // Return { safe: boolean, issues: string[] }
  }
}
```

### Input Validation

```typescript
interface ValidationRules {
  maxQubits: 20;
  maxGates: 1000;
  maxCircuitDepth: 500;
  timeoutMs: 30000;
  memoryLimitMB: 500;
}

function validateUserInput(input: string): ValidationResult {
  // Check for injection attempts
  if (containsSQLInjection(input) || containsScriptInjection(input)) {
    return { valid: false, reason: 'Potential security issue' };
  }
  
  // Check reasonable limits
  const qubitCount = extractQubitCount(input);
  if (qubitCount > ValidationRules.maxQubits) {
    return { 
      valid: false, 
      reason: `Maximum ${ValidationRules.maxQubits} qubits supported` 
    };
  }
  
  return { valid: true };
}
```

### Rate Limiting & Cost Control

```typescript
interface UsageLimits {
  freeUser: {
    requestsPerHour: 20,
    maxTokensPerRequest: 2000,
    maxQubits: 12
  },
  paidUser: {
    requestsPerHour: 200,
    maxTokensPerRequest: 4000,
    maxQubits: 20
  }
}

class RateLimiter {
  async checkLimit(userId: string, requestType: string): Promise<boolean> {
    const usage = await this.getUsage(userId);
    const limits = this.getLimits(userId);
    
    if (usage.requestsThisHour >= limits.requestsPerHour) {
      throw new RateLimitError('Hourly limit exceeded');
    }
    
    await this.incrementUsage(userId);
    return true;
  }
  
  async estimateCost(request: CircuitGenerationParams): Promise<number> {
    const estimatedTokens = this.estimateTokens(request);
    const provider = request.aiProvider;
    const cost = this.calculateCost(provider, estimatedTokens);
    return cost;
  }
}
```

## Error Handling & Recovery

### Graceful Degradation

```typescript
class AgentOrchestrator {
  async handleRequest(request: UserRequest): Promise<Response> {
    try {
      // Try primary AI provider
      return await this.primaryAgent.process(request);
    } catch (error) {
      if (error instanceof APIError) {
        // Fallback to secondary provider
        console.warn('Primary provider failed, trying fallback');
        return await this.fallbackAgent.process(request);
      }
      
      if (error instanceof RateLimitError) {
        // Use cached response if available
        const cached = await this.cache.get(request);
        if (cached) return cached;
        
        // Otherwise return helpful error
        return this.createRateLimitResponse(error);
      }
      
      // Last resort: deterministic response
      return this.deterministicFallback(request);
    }
  }
  
  private deterministicFallback(request: UserRequest): Response {
    // For common requests, use pre-generated circuits
    if (request.matches('bell state')) {
      return this.preGeneratedCircuits.bellState;
    }
    
    // Provide helpful error message
    return {
      error: true,
      message: 'AI generation temporarily unavailable',
      suggestion: 'Try a pre-built circuit or check back soon'
    };
  }
}
```

## Testing & Quality Assurance

### Agent Testing Framework

```typescript
describe('Circuit Generator Agent', () => {
  it('generates valid Bell state circuit', async () => {
    const agent = new CircuitGeneratorAgent(mockProvider);
    const result = await agent.generate({
      request: 'Create a Bell state',
      qubits: 2
    });
    
    // Verify code compiles
    expect(result.code).toCompile();
    
    // Verify quantum correctness
    const sim = executeCircuit(result.code);
    const state = sim.getState();
    expect(state).toMatchBellState();
    
    // Verify explanation quality
    expect(result.explanation).toContain('entanglement');
    expect(result.explanation.length).toBeGreaterThan(100);
  });
  
  it('handles invalid requests gracefully', async () => {
    const agent = new CircuitGeneratorAgent(mockProvider);
    const result = await agent.generate({
      request: 'Create a 1000 qubit circuit', // Invalid
      qubits: 1000
    });
    
    expect(result.error).toBe(true);
    expect(result.message).toContain('Maximum');
  });
});
```

### Quantum Correctness Tests

```typescript
describe('Quantum Physics Validation', () => {
  it('all generated gates are unitary', () => {
    const gates = generatedCircuit.gates;
    gates.forEach(gate => {
      const U = gate.matrix;
      const UDagger = conjugateTranspose(U);
      const product = matrixMultiply(UDagger, U);
      expect(product).toBeIdentityMatrix();
    });
  });
  
  it('state vectors remain normalized', () => {
    const states = simulationHistory.states;
    states.forEach(state => {
      const norm = calculateNorm(state);
      expect(norm).toBeCloseTo(1.0, 10);
    });
  });
});
```

## Performance Optimization

### Caching Strategy

```typescript
class AgentCache {
  private cache = new Map<string, CachedResponse>();
  
  async get(request: UserRequest): Promise<Response | null> {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    
    if (cached && !this.isExpired(cached)) {
      return cached.response;
    }
    
    return null;
  }
  
  async set(request: UserRequest, response: Response): Promise<void> {
    const key = this.generateKey(request);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      ttl: this.calculateTTL(request)
    });
  }
  
  private calculateTTL(request: UserRequest): number {
    // Static content (algorithms) cache longer
    if (request.isAlgorithm) return 24 * 60 * 60 * 1000; // 24h
    
    // Explanations cache medium
    if (request.isExplanation) return 60 * 60 * 1000; // 1h
    
    // Custom circuits don't cache
    return 0;
  }
}
```

### Parallel Processing

```typescript
async function processComplexRequest(request: UserRequest) {
  // Process independent tasks in parallel
  const [circuit, explanation, analysis] = await Promise.all([
    circuitAgent.generate(request),
    explanationAgent.explain(request),
    analysisAgent.analyze(request)
  ]);
  
  // Combine results
  return {
    circuit,
    explanation,
    analysis,
    visualizations: await generateVisualizations(circuit)
  };
}
```

## Monitoring & Analytics

### Agent Performance Metrics

```typescript
interface AgentMetrics {
  requestCount: number;
  averageLatency: number;
  successRate: number;
  errorRate: number;
  tokenUsage: number;
  costPerRequest: number;
}

class MetricsCollector {
  track(event: AgentEvent) {
    this.increment(`${event.agent}.${event.type}`);
    this.timing(`${event.agent}.latency`, event.duration);
    
    if (event.error) {
      this.increment(`${event.agent}.errors`);
      this.log('error', event.error);
    }
  }
  
  async generateReport(): Promise<AgentReport> {
    return {
      timestamp: Date.now(),
      metrics: await this.aggregateMetrics(),
      insights: await this.generateInsights(),
      recommendations: await this.generateRecommendations()
    };
  }
}
```

## Future Enhancements

### Multi-Agent Collaboration

```
Complex Request
    ↓
[Coordinator Agent]
    ↓
┌─────────┬──────────┬──────────┐
│ Agent A │ Agent B  │ Agent C  │
└────┬────┴────┬─────┴────┬─────┘
     └──────┬──┴──────────┘
            ↓
    [Synthesis Agent]
            ↓
      Final Response
```

### Learning from Feedback

```typescript
class AdaptiveAgent {
  async learnFromFeedback(feedback: UserFeedback) {
    // Store feedback
    await this.feedbackDB.store(feedback);
    
    // Analyze patterns
    const patterns = await this.analyzePatterns();
    
    // Update prompts
    if (patterns.lowQuality.includes('explanations')) {
      this.updateExplanationPrompt(patterns.suggestions);
    }
    
    // A/B test improvements
    await this.scheduleTesting(patterns.improvements);
  }
}
```

### Specialized Domain Agents

- **Quantum Chemistry Agent**: Molecular simulation circuits
- **Quantum ML Agent**: Variational algorithms, QML
- **Quantum Optimization Agent**: QAOA, VQE
- **Error Correction Agent**: Stabilizer codes, logical qubits

---

**Version**: 1.0
**Last Updated**: Initial Draft
**Maintainer**: Development Team