/**
 * AI Chat API Route
 * Handles requests to various AI providers for quantum circuit generation
 * Includes error handling, rate limiting awareness, and fallback responses
 */
import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
  messages?: { role: string; content: string }[];
  provider: 'gemini' | 'openai' | 'anthropic';
  model?: string;  // Add model selection
  apiKey?: string;
  history?: { role: string; content: string }[];
}

interface AIResponse {
  content: string;
  circuitCode?: string;
  provider?: string;
  cached?: boolean;
}

// Simple in-memory cache for common requests
const responseCache = new Map<string, { response: AIResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback responses for common quantum computing requests
const FALLBACK_RESPONSES: Record<string, AIResponse> = {
  'bell state': {
    content: `## Bell State Circuit

A Bell state is a maximally entangled quantum state of two qubits. Here's how to create one:

**Circuit:**
1. Apply Hadamard (H) gate to qubit 0 → Creates superposition
2. Apply CNOT gate with qubit 0 as control and qubit 1 as target → Creates entanglement

**Result:** The state (|00⟩ + |11⟩)/√2

When measured, both qubits will always have the same value (both 0 or both 1), demonstrating quantum entanglement.

**Try it:** Run the circuit and observe the measurement histogram!`,
    circuitCode: `const sim = new QuantumSimulator(2);
// Create superposition on qubit 0
sim.apply('H', 0);
// Entangle qubits 0 and 1
sim.apply('CNOT', 0, 1);`,
    provider: 'fallback'
  },
  'superposition': {
    content: `## Quantum Superposition

Superposition is when a qubit exists in multiple states simultaneously until measured.

**Creating Superposition:**
Apply the Hadamard (H) gate to transform |0⟩ into (|0⟩ + |1⟩)/√2

**Code:**
\`\`\`typescript
sim.apply('H', 0);  // Creates equal superposition
\`\`\`

**On the Bloch Sphere:** The state moves from the north pole (|0⟩) to the equator.

**Key Insight:** Unlike classical bits that are definitely 0 or 1, a qubit in superposition has probability amplitudes for both states.`,
    circuitCode: `const sim = new QuantumSimulator(1);
// Apply Hadamard to create superposition
sim.apply('H', 0);`,
    provider: 'fallback'
  },
  'hadamard': {
    content: `## Hadamard Gate (H)

The Hadamard gate is one of the most important quantum gates. It creates superposition.

**Matrix:**
\`\`\`
H = 1/√2 × [1   1]
          [1  -1]
\`\`\`

**Effect:**
- |0⟩ → (|0⟩ + |1⟩)/√2
- |1⟩ → (|0⟩ - |1⟩)/√2

**Key Properties:**
- Creates equal superposition from basis states
- H² = I (applying twice returns to original state)
- Self-inverse: H = H†

**Usage:** Essential for quantum algorithms like Grover's and QFT.`,
    circuitCode: `const sim = new QuantumSimulator(1);
sim.apply('H', 0);`,
    provider: 'fallback'
  },
  'entanglement': {
    content: `## Quantum Entanglement

Entanglement is a quantum phenomenon where two or more qubits become correlated in ways impossible classically.

**Creating Entanglement:**
1. Put one qubit in superposition: H gate
2. Use it to control another qubit: CNOT gate

**The Bell State:**
\`\`\`
|Φ+⟩ = (|00⟩ + |11⟩)/√2
\`\`\`

**What makes it special:**
- Measuring one qubit instantly determines the other
- This correlation persists regardless of distance
- Cannot be explained by classical physics

**Applications:** Quantum teleportation, superdense coding, quantum cryptography.`,
    circuitCode: `const sim = new QuantumSimulator(2);
sim.apply('H', 0);
sim.apply('CNOT', 0, 1);`,
    provider: 'fallback'
  },
  'grover': {
    content: `## Grover's Search Algorithm

Grover's algorithm provides quadratic speedup for searching unsorted databases.

**Classical:** O(N) queries needed
**Quantum:** O(√N) queries with Grover's

**Steps:**
1. **Initialize:** Apply H to all qubits → equal superposition
2. **Oracle:** Mark the target state with phase flip
3. **Diffusion:** Amplify marked state amplitude
4. **Repeat:** √N times for optimal probability

**For 2 qubits (4 items):** Only 1 iteration needed!`,
    circuitCode: `const sim = new QuantumSimulator(2);
// Initialize: Equal superposition
sim.apply('H', 0);
sim.apply('H', 1);
// Oracle: Mark |11⟩ (example)
sim.apply('CZ', 0, 1);
// Diffusion operator
sim.apply('H', 0);
sim.apply('H', 1);
sim.apply('X', 0);
sim.apply('X', 1);
sim.apply('CZ', 0, 1);
sim.apply('X', 0);
sim.apply('X', 1);
sim.apply('H', 0);
sim.apply('H', 1);`,
    provider: 'fallback'
  }
};

const SYSTEM_PROMPT = `You are an expert quantum computing assistant powering an interactive quantum simulator. Your role is to:

1. **Generate accurate quantum circuits** based on user requests
2. **Explain quantum concepts** clearly and correctly
3. **Answer questions** about quantum computing thoroughly
4. **Help debug and optimize** quantum circuits

IMPORTANT RESPONSE GUIDELINES:
- Be helpful, accurate, and educational
- Use proper markdown formatting for readability
- When providing code, always use TypeScript with our simulator API
- Adapt explanations based on the complexity of the question

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
\`\`\`

Always provide complete, working examples and explain the quantum concepts involved.`;

// Helper to check for fallback matches
function findFallbackResponse(message: string): AIResponse | null {
  const lowerMessage = message.toLowerCase();
  
  for (const [key, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lowerMessage.includes(key)) {
      return response;
    }
  }
  
  return null;
}

// Helper to generate cache key
function getCacheKey(message: string, provider: string): string {
  return `${provider}:${message.toLowerCase().trim().slice(0, 100)}`;
}

// Helper to check if response is in cache
function getCachedResponse(key: string): AIResponse | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.response, cached: true };
  }
  if (cached) {
    responseCache.delete(key);
  }
  return null;
}

// Helper to cache response
function cacheResponse(key: string, response: AIResponse): void {
  // Limit cache size
  if (responseCache.size > 100) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }
  responseCache.set(key, { response, timestamp: Date.now() });
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, messages, provider, model, apiKey, history } = body;
    
    // Get the actual message content
    const userMessage = message || messages?.find(m => m.role === 'user')?.content || '';
    const chatHistory = history || messages?.filter(m => m.role !== 'system') || [];

    // Check cache first
    const cacheKey = getCacheKey(userMessage, provider);
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    // If no API key, try fallback responses
    if (!apiKey) {
      const fallback = findFallbackResponse(userMessage);
      if (fallback) {
        return NextResponse.json(fallback);
      }
      
      return NextResponse.json({
        content: `I'd love to help with your quantum computing question! To get personalized AI responses, please add your API key in Settings.

In the meantime, here are some things you can try:
- **"Create a Bell state"** - Learn about entanglement
- **"Explain superposition"** - Understand quantum basics
- **"Show Grover's algorithm"** - See quantum speedup
- **"What does the Hadamard gate do?"** - Learn about quantum gates

You can also explore the circuit builder and drag gates onto the qubits to experiment!`,
        provider: 'fallback'
      });
    }

    let response: AIResponse;

    try {
      switch (provider) {
        case 'gemini':
          response = await callGemini(userMessage, apiKey, chatHistory, model);
          break;
        case 'openai':
          response = await callOpenAI(userMessage, apiKey, chatHistory, model);
          break;
        case 'anthropic':
          response = await callAnthropic(userMessage, apiKey, chatHistory, model);
          break;
        default:
          throw new Error('Invalid provider');
      }
      
      // Cache successful response
      cacheResponse(cacheKey, response);
      
      return NextResponse.json(response);
    } catch (providerError) {
      // Check if it's a rate limit error
      const errorMessage = providerError instanceof Error ? providerError.message : '';
      const isRateLimit = errorMessage.includes('429') || 
                          errorMessage.includes('rate') || 
                          errorMessage.includes('quota') ||
                          errorMessage.includes('RESOURCE_EXHAUSTED');
      
      // Log appropriately based on error type
      if (isRateLimit) {
        console.log(`[${provider}] Rate limit reached, using fallback response`);
      } else {
        console.error(`[${provider}] API Error:`, providerError);
      }
      
      // Try fallback for rate limit or other errors
      const fallback = findFallbackResponse(userMessage);
      if (fallback) {
        return NextResponse.json({
          ...fallback,
          content: `${isRateLimit ? '⚠️ *API rate limit reached. Here\'s a helpful response:*\n\n' : ''}${fallback.content}`
        });
      }
      
      // Return error with helpful message
      return NextResponse.json({
        content: isRateLimit 
          ? `⚠️ **Rate Limit Reached**

The AI provider is temporarily limiting requests. Please wait a moment and try again.

**While you wait, you can:**
- Explore the circuit builder
- Try pre-built example circuits
- Read the tutorial content

*Tip: Add different API keys for multiple providers in Settings to switch between them.*`
          : `I encountered an issue processing your request. Let me help you another way:

**Try asking about:**
- Creating a Bell state for entanglement
- Understanding quantum superposition
- The Hadamard gate and quantum gates
- Grover's search algorithm

Or use the circuit builder to experiment directly!`,
        provider: 'fallback',
        error: true
      });
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        content: 'Sorry, I encountered an error. Please try again.'
      },
      { status: 500 }
    );
  }
}

async function callGemini(
  message: string,
  apiKey: string,
  history: { role: string; content: string }[],
  model: string = 'gemini-2.0-flash-exp'
): Promise<{ content: string; circuitCode?: string }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }],
          },
          ...history.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
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
  
  // Extract circuit code if present
  const codeMatch = content.match(/```typescript\n([\s\S]*?)```/);
  const circuitCode = codeMatch ? codeMatch[1].trim() : undefined;

  return { content, circuitCode };
}

async function callOpenAI(
  message: string,
  apiKey: string,
  history: { role: string; content: string }[],
  model: string = 'gpt-4o'
): Promise<{ content: string; circuitCode?: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  const codeMatch = content.match(/```typescript\n([\s\S]*?)```/);
  const circuitCode = codeMatch ? codeMatch[1].trim() : undefined;

  return { content, circuitCode };
}

async function callAnthropic(
  message: string,
  apiKey: string,
  history: { role: string; content: string }[],
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
      model: model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        ...history.map((m) => ({
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
  const circuitCode = codeMatch ? codeMatch[1].trim() : undefined;

  return { content, circuitCode };
}
