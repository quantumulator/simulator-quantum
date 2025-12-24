/**
 * AI Agent Core - Improved Implementation
 * A streamlined, reliable AI agent system for quantum computing
 */

import {
  IntentClassification,
  AgentResponse,
  SkillLevel,
  AIProvider,
  QuizQuestion,
  VisualizationHint,
} from './types';

// Improved System Prompts
const SYSTEM_PROMPTS = {
  main: `You are an expert quantum computing assistant powering an interactive quantum simulator. Your role is to:

1. **Generate accurate quantum circuits** based on user requests
2. **Explain quantum concepts** clearly at the appropriate skill level
3. **Answer questions** about quantum computing accurately
4. **Help debug and optimize** quantum circuits

IMPORTANT RESPONSE GUIDELINES:
- Be helpful, accurate, and educational
- Use proper markdown formatting for readability
- When providing code, always use TypeScript with our simulator API
- Adapt explanations to the user's skill level

QUANTUM SIMULATOR API:
\`\`\`typescript
const sim = new QuantumSimulator(numQubits);
sim.apply('GateName', qubitIndex);           // Single-qubit gate
sim.apply('GateName', control, target);       // Two-qubit gate
sim.apply('Rx', qubitIndex, theta);          // Parameterized gate
sim.measure(qubitIndex);                      // Measurement
\`\`\`

Available Gates: I, X, Y, Z, H, S, T, Rx, Ry, Rz, CNOT, CZ, SWAP, Toffoli, Fredkin

When generating circuit code, wrap it in:
\`\`\`typescript
// code here
\`\`\``,

  codeAssistant: `You are a quantum computing code assistant. Help users with:
1. Writing and completing quantum circuit code
2. Debugging quantum algorithms
3. Optimizing circuits for efficiency
4. Explaining what code does

ALWAYS provide complete, working code using our QuantumSimulator API.
Format code blocks with \`\`\`typescript ... \`\`\`

Be concise but thorough. Include comments explaining each step.`,

  questionAnswering: `You are a quantum computing expert. Answer questions accurately and clearly.

For technical questions:
- Provide accurate, well-researched answers
- Include relevant formulas when appropriate (use LaTeX: $formula$)
- Cite quantum computing principles

For conceptual questions:
- Start with intuition before formalism
- Use analogies when helpful
- Correct common misconceptions

Format your responses with proper markdown for readability.`,
};

// Common quantum computing knowledge for fallback
const QUANTUM_KNOWLEDGE = {
  concepts: {
    superposition: `## Quantum Superposition

Superposition is the ability of a quantum system to exist in multiple states simultaneously until measured.

**Mathematical Description:**
A qubit in superposition is described as: $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$

where $|\\alpha|^2 + |\\beta|^2 = 1$ and $|\\alpha|^2$, $|\\beta|^2$ represent measurement probabilities.

**Key Points:**
- Unlike classical bits (0 OR 1), qubits can be 0 AND 1 simultaneously
- Measurement collapses the superposition to a definite state
- The Hadamard gate (H) creates equal superposition

**Circuit to Create Superposition:**
\`\`\`typescript
const sim = new QuantumSimulator(1);
sim.apply('H', 0); // Creates |+⟩ = (|0⟩ + |1⟩)/√2
\`\`\``,

    entanglement: `## Quantum Entanglement

Entanglement is a quantum correlation between particles where the state of one instantly affects the other, regardless of distance.

**The Bell State:**
$|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$

**Key Properties:**
- Measuring one qubit instantly determines the other
- Cannot send information faster than light (no-signaling theorem)
- Essential for quantum teleportation and cryptography

**Creating Entanglement:**
\`\`\`typescript
const sim = new QuantumSimulator(2);
sim.apply('H', 0);      // Superposition
sim.apply('CNOT', 0, 1); // Entangle
\`\`\`

When measured, both qubits always show the same value (00 or 11).`,

    measurement: `## Quantum Measurement

Measurement is the process of observing a quantum state, which causes it to collapse from superposition to a definite value.

**Born Rule:**
The probability of measuring state $|x\\rangle$ is $P(x) = |\\langle x|\\psi\\rangle|^2$

**Key Properties:**
- Measurement is irreversible
- Destroys superposition and entanglement
- Results are probabilistic but predictable

**Example:**
\`\`\`typescript
const sim = new QuantumSimulator(1);
sim.apply('H', 0);       // 50% |0⟩, 50% |1⟩
const result = sim.measure(0); // Collapses to 0 or 1
\`\`\``,
  },

  gates: {
    hadamard: `## Hadamard Gate (H)

The Hadamard gate creates superposition by rotating the qubit state.

**Matrix:**
$H = \\frac{1}{\\sqrt{2}} \\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}$

**Effect:**
- $H|0\\rangle = |+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)$
- $H|1\\rangle = |-\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)$

**Properties:**
- Self-inverse: $H^2 = I$
- Creates equal superposition from basis states
- On Bloch sphere: 180° rotation about the X+Z axis

\`\`\`typescript
sim.apply('H', 0); // Apply Hadamard to qubit 0
\`\`\``,

    cnot: `## CNOT Gate (Controlled-NOT)

The CNOT gate flips the target qubit if the control qubit is |1⟩.

**Matrix:**
$CNOT = \\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & 0 \\end{pmatrix}$

**Truth Table:**
| Control | Target | Output |
|---------|--------|--------|
| 0 | 0 | 00 |
| 0 | 1 | 01 |
| 1 | 0 | 11 |
| 1 | 1 | 10 |

**Usage:**
\`\`\`typescript
sim.apply('CNOT', 0, 1); // Control: qubit 0, Target: qubit 1
\`\`\`

Essential for creating entanglement when combined with Hadamard.`,

    pauliX: `## Pauli-X Gate (NOT Gate)

The Pauli-X gate flips the qubit state (quantum NOT gate).

**Matrix:**
$X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$

**Effect:**
- $X|0\\rangle = |1\\rangle$
- $X|1\\rangle = |0\\rangle$

**On Bloch Sphere:** 180° rotation about the X-axis

\`\`\`typescript
sim.apply('X', 0); // Flip qubit 0
\`\`\``,
  },

  algorithms: {
    bellState: `## Bell State Circuit

Creates a maximally entangled state of two qubits.

**Circuit:**
\`\`\`typescript
const sim = new QuantumSimulator(2);
sim.apply('H', 0);       // Create superposition
sim.apply('CNOT', 0, 1); // Create entanglement
\`\`\`

**Result:** $|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$

When measured, both qubits always have the same value.`,

    grover: `## Grover's Search Algorithm

Searches an unsorted database in O(√N) instead of O(N).

**Steps:**
1. Initialize all qubits in superposition
2. Apply oracle (marks target state)
3. Apply diffusion operator
4. Repeat √N times

**Circuit (2 qubits, searching for |11⟩):**
\`\`\`typescript
const sim = new QuantumSimulator(2);

// Initialize
sim.apply('H', 0);
sim.apply('H', 1);

// Oracle (marks |11⟩)
sim.apply('CZ', 0, 1);

// Diffusion
sim.apply('H', 0);
sim.apply('H', 1);
sim.apply('X', 0);
sim.apply('X', 1);
sim.apply('CZ', 0, 1);
sim.apply('X', 0);
sim.apply('X', 1);
sim.apply('H', 0);
sim.apply('H', 1);
\`\`\``,

    teleportation: `## Quantum Teleportation

Transfers a quantum state from one qubit to another using entanglement.

**Protocol:**
1. Create Bell pair between qubits 1 and 2
2. Perform Bell measurement on qubits 0 and 1
3. Apply corrections to qubit 2 based on measurement

**Circuit:**
\`\`\`typescript
const sim = new QuantumSimulator(3);

// Prepare state to teleport (example: |+⟩)
sim.apply('H', 0);

// Create Bell pair
sim.apply('H', 1);
sim.apply('CNOT', 1, 2);

// Bell measurement
sim.apply('CNOT', 0, 1);
sim.apply('H', 0);

// Measure qubits 0 and 1, apply corrections to qubit 2
\`\`\``,

    ghz: `## GHZ State

Generalized Bell state for multiple qubits.

**State:** $|GHZ\\rangle = \\frac{1}{\\sqrt{2}}(|00...0\\rangle + |11...1\\rangle)$

**Circuit:**
\`\`\`typescript
const sim = new QuantumSimulator(3);

sim.apply('H', 0);       // Superposition on first qubit
sim.apply('CNOT', 0, 1); // Entangle second
sim.apply('CNOT', 0, 2); // Entangle third
\`\`\`

All qubits are maximally entangled - measuring any qubit determines all others.`,
  },
};

// Detect intent from message
function detectIntent(message: string): IntentClassification {
  const lower = message.toLowerCase();
  
  // Detect if it's a question
  const isQuestion = lower.includes('?') || 
    lower.startsWith('what') || 
    lower.startsWith('how') || 
    lower.startsWith('why') || 
    lower.startsWith('can') ||
    lower.startsWith('does') ||
    lower.startsWith('is ') ||
    lower.startsWith('are ');
  
  // Detect if asking to create/build something
  const isCreation = lower.includes('create') || 
    lower.includes('make') || 
    lower.includes('build') || 
    lower.includes('generate') ||
    lower.includes('show me') ||
    lower.includes('give me');
  
  // Detect if explanation request
  const isExplanation = lower.includes('explain') || 
    lower.includes('describe') || 
    lower.includes('tell me about') ||
    lower.includes('what is');
  
  // Detect specific algorithms/concepts
  const algorithms = ['bell state', 'grover', 'shor', 'teleportation', 'ghz', 'qft', 'fourier'];
  const concepts = ['superposition', 'entanglement', 'measurement', 'qubit', 'gate'];
  const gates = ['hadamard', 'cnot', 'pauli', 'x gate', 'y gate', 'z gate', 'h gate'];
  
  const foundAlgorithms = algorithms.filter(a => lower.includes(a));
  const foundConcepts = concepts.filter(c => lower.includes(c));
  const foundGates = gates.filter(g => lower.includes(g.replace(' gate', '')));
  
  // Extract qubit count
  const qubitMatch = message.match(/(\d+)\s*qubit/i);
  const qubits = qubitMatch ? parseInt(qubitMatch[1]) : undefined;
  
  // Determine primary intent
  let primary: 'create_circuit' | 'explain_concept' | 'analyze_circuit' | 'learn' | 'debug' = 'create_circuit';
  let confidence = 0.8;
  
  if (isExplanation || (isQuestion && foundConcepts.length > 0)) {
    primary = 'explain_concept';
    confidence = 0.9;
  } else if (isCreation || foundAlgorithms.length > 0) {
    primary = 'create_circuit';
    confidence = 0.9;
  } else if (isQuestion) {
    primary = 'explain_concept';
    confidence = 0.85;
  }
  
  // Infer skill level from language
  const advancedTerms = ['unitary', 'hermitian', 'density matrix', 'fidelity', 'tomography'];
  const intermediateTerms = ['amplitude', 'phase', 'eigenvalue', 'basis'];
  
  let context: SkillLevel = 'beginner';
  if (advancedTerms.some(t => lower.includes(t))) context = 'advanced';
  else if (intermediateTerms.some(t => lower.includes(t))) context = 'intermediate';
  
  return {
    primary,
    confidence,
    entities: {
      algorithms: foundAlgorithms,
      concepts: foundConcepts,
      gates: foundGates,
      qubits,
    },
    context,
    suggestedActions: [],
  };
}

// Get knowledge-based response (no API needed)
function getKnowledgeResponse(message: string, skillLevel: SkillLevel): AgentResponse | null {
  const lower = message.toLowerCase();
  
  // Check for concept explanations
  for (const [key, content] of Object.entries(QUANTUM_KNOWLEDGE.concepts)) {
    if (lower.includes(key)) {
      return {
        success: true,
        content,
        circuitCode: extractCode(content),
      };
    }
  }
  
  // Check for gate explanations
  for (const [key, content] of Object.entries(QUANTUM_KNOWLEDGE.gates)) {
    if (lower.includes(key) || lower.includes(key.replace('pauli', '').toLowerCase())) {
      return {
        success: true,
        content,
        circuitCode: extractCode(content),
      };
    }
  }
  
  // Check for algorithm requests
  for (const [key, content] of Object.entries(QUANTUM_KNOWLEDGE.algorithms)) {
    if (lower.includes(key.toLowerCase().replace(/([A-Z])/g, ' $1').trim())) {
      return {
        success: true,
        content,
        circuitCode: extractCode(content),
      };
    }
  }
  
  // Common variations
  if (lower.includes('bell') && (lower.includes('state') || lower.includes('circuit'))) {
    return {
      success: true,
      content: QUANTUM_KNOWLEDGE.algorithms.bellState,
      circuitCode: extractCode(QUANTUM_KNOWLEDGE.algorithms.bellState),
    };
  }
  
  return null;
}

// Extract code from markdown content
function extractCode(content: string): string | undefined {
  const match = content.match(/```typescript\n([\s\S]*?)```/);
  return match ? match[1].trim() : undefined;
}

// Main agent function - processes requests
export async function processAIRequest(
  message: string,
  options: {
    skillLevel?: SkillLevel;
    currentCircuit?: string;
    history?: { role: string; content: string }[];
    provider?: AIProvider;
    model?: string;
    apiKey?: string;
  } = {}
): Promise<AgentResponse> {
  const { 
    skillLevel = 'beginner', 
    history = [], 
    provider = 'gemini', 
    model,
    apiKey 
  } = options;
  
  // First, try knowledge-based response (works offline)
  const knowledgeResponse = getKnowledgeResponse(message, skillLevel);
  if (knowledgeResponse && !apiKey) {
    return knowledgeResponse;
  }
  
  // If API key available, use AI for better responses
  if (apiKey) {
    try {
      const aiResponse = await callAIProvider(message, {
        provider,
        model,
        apiKey,
        history,
        skillLevel,
      });
      return aiResponse;
    } catch (error) {
      console.warn('AI API call failed, using fallback:', error);
      // Fall back to knowledge response or generic
      if (knowledgeResponse) return knowledgeResponse;
    }
  }
  
  // Fallback for unknown queries
  if (knowledgeResponse) return knowledgeResponse;
  
  return {
    success: true,
    content: `I'd be happy to help with your quantum computing question!

**What I can help with:**
- **Create circuits**: "Create a Bell state", "Show me Grover's algorithm"
- **Explain concepts**: "Explain superposition", "What is entanglement?"
- **Gate information**: "How does the Hadamard gate work?"

To get AI-powered responses, add your API key in Settings.

Try asking: "Create a Bell state" or "Explain quantum entanglement"`,
    suggestions: [
      'Create a Bell state',
      'Explain superposition',
      'What is quantum entanglement?',
      'Show me Grover\'s algorithm',
    ],
  };
}

// Call AI provider API
async function callAIProvider(
  message: string,
  options: {
    provider: AIProvider;
    model?: string;
    apiKey: string;
    history: { role: string; content: string }[];
    skillLevel: SkillLevel;
  }
): Promise<AgentResponse> {
  const { provider, model, apiKey, history, skillLevel } = options;
  
  const systemPrompt = `${SYSTEM_PROMPTS.main}

Current user skill level: ${skillLevel}
Adjust your explanations accordingly.`;
  
  let response: { content: string; circuitCode?: string };
  
  switch (provider) {
    case 'gemini':
      response = await callGemini(message, apiKey, history, systemPrompt, model);
      break;
    case 'openai':
      response = await callOpenAI(message, apiKey, history, systemPrompt, model);
      break;
    case 'anthropic':
      response = await callAnthropic(message, apiKey, history, systemPrompt, model);
      break;
    default:
      throw new Error('Unknown AI provider');
  }
  
  return {
    success: true,
    content: response.content,
    circuitCode: response.circuitCode,
  };
}

async function callGemini(
  message: string,
  apiKey: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  model: string = 'gemini-2.0-flash-exp'
): Promise<{ content: string; circuitCode?: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          { role: 'user', parts: [{ text: message }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }
  
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const codeMatch = content.match(/```typescript\n([\s\S]*?)```/);
  
  return {
    content,
    circuitCode: codeMatch ? codeMatch[1].trim() : undefined,
  };
}

async function callOpenAI(
  message: string,
  apiKey: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  model: string = 'gpt-4o'
): Promise<{ content: string; circuitCode?: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const codeMatch = content.match(/```typescript\n([\s\S]*?)```/);
  
  return {
    content,
    circuitCode: codeMatch ? codeMatch[1].trim() : undefined,
  };
}

async function callAnthropic(
  message: string,
  apiKey: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  model: string = 'claude-sonnet-4-20250514'
): Promise<{ content: string; circuitCode?: string }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        ...history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }
  
  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const codeMatch = content.match(/```typescript\n([\s\S]*?)```/);
  
  return {
    content,
    circuitCode: codeMatch ? codeMatch[1].trim() : undefined,
  };
}

// Code assistant for inline help
export async function getCodeAssistance(
  prompt: string,
  currentCode: string,
  options: {
    provider?: AIProvider;
    model?: string;
    apiKey?: string;
  } = {}
): Promise<string> {
  const { provider = 'gemini', model, apiKey } = options;
  
  if (!apiKey) {
    // Return helpful fallback
    const lower = prompt.toLowerCase();
    
    if (lower.includes('bell') || lower.includes('entangle')) {
      return `// Bell State
sim.apply('H', 0);
sim.apply('CNOT', 0, 1);`;
    }
    if (lower.includes('superposition')) {
      return `// Create superposition
sim.apply('H', 0);`;
    }
    if (lower.includes('measure')) {
      return `// Measure all qubits
const result = sim.measure(0);`;
    }
    
    return `// Quantum circuit code
sim.apply('H', 0);
sim.apply('CNOT', 0, 1);`;
  }
  
  const systemPrompt = `${SYSTEM_PROMPTS.codeAssistant}

Current code:
\`\`\`typescript
${currentCode}
\`\`\`

User request: ${prompt}

Respond with ONLY the code to add or modify. No explanations.`;
  
  try {
    let response: { content: string };
    
    switch (provider) {
      case 'gemini':
        response = await callGemini(prompt, apiKey, [], systemPrompt, model);
        break;
      case 'openai':
        response = await callOpenAI(prompt, apiKey, [], systemPrompt, model);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt, apiKey, [], systemPrompt, model);
        break;
      default:
        throw new Error('Unknown provider');
    }
    
    // Extract just the code
    const codeMatch = response.content.match(/```(?:typescript)?\n?([\s\S]*?)```/);
    return codeMatch ? codeMatch[1].trim() : response.content.trim();
  } catch (error) {
    console.error('Code assistance error:', error);
    return `// Error getting AI assistance
sim.apply('H', 0);`;
  }
}
