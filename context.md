# Quantum Simulator - Project Context

## Project Overview

An open-source, AI-powered quantum computing simulator built with Next.js, TypeScript, and Three.js. The platform enables users to learn quantum computing concepts through interactive experimentation, leveraging AI to generate accurate quantum simulations that mimic real quantum computer behavior.

## Vision & Goals

### Primary Objectives
- **Educational Excellence**: Provide an intuitive platform for learning quantum computing concepts
- **Real-World Accuracy**: Simulate quantum behavior as accurately as possible within classical computing constraints
- **AI-Powered Generation**: Use AI to generate custom quantum circuits, experiments, and simulations based on natural language requests
- **Maximum Modularity**: Build a highly customizable system with interchangeable blocks, visualizations, and components
- **Interactive Learning**: Leverage 3D visualization and real-time feedback for enhanced understanding

### Target Audience
- Students learning quantum computing fundamentals
- Researchers prototyping quantum algorithms
- Educators creating quantum computing curriculum
- Developers exploring quantum-classical hybrid systems

## Technical Architecture

### Core Stack
```
Frontend Framework: Next.js 14+ (App Router)
Language: TypeScript (strict mode)
3D Graphics: Three.js (r128+)
State Management: React Context + Zustand
Styling: Tailwind CSS
UI Components: Radix UI + shadcn/ui
```

### AI Integration Layer
```
Primary Model: Gemini 3 Flash Preview
Supported Providers:
  - Google (Gemini Flash, Pro)
  - OpenAI (GPT-4o, GPT-4 Turbo)
  - Anthropic (Claude Sonnet, Opus)
  - Custom (User API keys)
```

### Quantum Simulation Engine
```
Core: Custom TypeScript quantum state simulator
Linear Algebra: math.js for complex number operations
Visualization: Three.js for state representation
Measurement: Probabilistic collapse simulation
```

## Key Features

### 1. Natural Language Interface
Users can describe quantum experiments in plain English:
- "Create a quantum teleportation circuit"
- "Show me Grover's algorithm for 3 qubits"
- "Simulate a quantum random walk"

### 2. Modular Block System

#### Circuit Blocks
- **Single-Qubit Gates**: X, Y, Z, H, S, T, Rx, Ry, Rz
- **Multi-Qubit Gates**: CNOT, CZ, SWAP, Toffoli, Fredkin
- **Custom Gates**: User-defined unitary matrices
- **Measurement**: Computational basis, arbitrary basis

#### Visualization Blocks
- **Bloch Sphere**: Interactive 3D single-qubit state visualization
- **State Vector**: Complex amplitude display
- **Density Matrix**: Mixed state representation
- **Probability Distribution**: Measurement outcome histograms
- **Circuit Diagram**: Dynamic circuit builder

#### Analysis Blocks
- **Fidelity Calculator**: Compare states and operations
- **Entanglement Metrics**: Von Neumann entropy, concurrence
- **Gate Decomposition**: Break complex gates into primitives
- **Error Analysis**: Noise and decoherence simulation

#### Report Blocks
- **Experiment Summary**: Auto-generated documentation
- **Performance Metrics**: Gate count, depth, execution time
- **Statistical Analysis**: Repeated measurement statistics
- **Export Options**: PDF, JSON, Python/Qiskit code

### 3. Quantum State Representation

```typescript
interface QuantumState {
  numQubits: number;
  stateVector: Complex[]; // 2^n complex amplitudes
  density?: Complex[][]; // For mixed states
  basis: 'computational' | 'custom';
}

interface Complex {
  real: number;
  imag: number;
}
```

### 4. Simulation Accuracy

#### What We Simulate Accurately
- Pure quantum states (state vectors)
- Unitary gate operations
- Measurement probabilities
- Quantum entanglement
- Superposition principles
- Gate composition and equivalence

#### Real-World Limitations We Model
- **Decoherence**: Time-based state degradation (T1, T2)
- **Gate Errors**: Imperfect unitary operations
- **Readout Errors**: Measurement bit-flip probability
- **Crosstalk**: Inter-qubit interference
- **Finite Connectivity**: Hardware topology constraints

#### What We Simplify
- We run on classical hardware (no true quantum speedup)
- Limited to ~20 qubits due to exponential state space
- Approximations for noise models
- Simplified error correction codes

### 5. 3D Visualization System

#### Three.js Integration
```typescript
// Core visualization components
- BlochSphere3D: Single qubit state on Bloch sphere
- QuantumGate3D: Animated gate operations
- EntanglementViz: Multi-qubit correlations
- CircuitFlow: 3D circuit execution flow
- WaveFunction: Probability amplitude landscape
```

#### Interaction Features
- Orbit controls for 360° viewing
- Click-to-select qubits
- Drag-and-drop gates
- Real-time state updates
- Animation of quantum evolution

## AI Agent System

### Prompt Engineering Strategy

#### System Context
```
You are a quantum computing expert and educator. Your role is to:
1. Generate accurate quantum circuits based on user requests
2. Explain quantum concepts clearly and correctly
3. Provide working TypeScript/JavaScript code for quantum simulations
4. Suggest educational next steps and experiments
```

#### Code Generation Templates
- Gate application functions
- State initialization
- Measurement procedures
- Circuit composition
- Visualization setup

#### Validation Layer
- Verify unitary matrices (U†U = I)
- Check state vector normalization
- Validate qubit indices
- Ensure measurement basis orthonormality

### Multi-Model Support

#### Provider Configuration
```typescript
interface AIProvider {
  name: 'gemini' | 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  model: string;
  endpoint?: string; // For custom providers
}
```

#### Model Selection Strategy
- **Fast Prototyping**: Gemini Flash (default)
- **Complex Circuits**: GPT-4o or Claude Opus
- **Budget Conscious**: Gemini Flash or custom local models
- **Maximum Accuracy**: Claude Opus for validation

## User Workflows

### Beginner Flow
1. User opens app with sample circuits
2. Selects "Single Qubit Basics" tutorial
3. AI generates interactive Hadamard gate demo
4. User manipulates Bloch sphere
5. Measures qubit, sees collapse
6. AI explains measurement results

### Intermediate Flow
1. User asks: "Create Bell state circuit"
2. AI generates CNOT circuit with H gate
3. User adds measurement blocks
4. Runs simulation 1000 times
5. Views correlation histogram
6. AI explains entanglement properties
7. User exports to Qiskit Python code

### Advanced Flow
1. User describes: "Implement Shor's algorithm for N=15"
2. AI generates full circuit with quantum Fourier transform
3. User customizes gate implementation
4. Adds realistic noise model (IBM topology)
5. Analyzes success probability
6. AI suggests error mitigation strategies
7. Generates comprehensive report

## Project Structure

```
quantum-simulator/
├── app/
│   ├── api/
│   │   ├── ai/              # AI provider integrations
│   │   └── quantum/         # Quantum computation endpoints
│   ├── components/
│   │   ├── blocks/          # Modular UI blocks
│   │   ├── quantum/         # Quantum-specific components
│   │   ├── visualizations/  # 3D and 2D visualizations
│   │   └── ui/              # General UI components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   └── lib/
│       ├── quantum/         # Core quantum simulation engine
│       ├── ai/              # AI integration utilities
│       └── utils/           # Helper functions
├── public/
│   └── assets/              # Static assets
└── docs/                    # Documentation
```

## Performance Considerations

### Optimization Strategies
- **Web Workers**: Run quantum simulations in background threads
- **WebGL/GPU.js**: Accelerate matrix operations on GPU
- **Lazy Loading**: Load visualization libraries on demand
- **State Caching**: Memoize expensive quantum operations
- **Progressive Rendering**: Stream large circuit visualizations

### Scalability Limits
- **Client-side**: Up to 12-15 qubits (web browser limits)
- **With Web Workers**: 15-20 qubits
- **Server-side Option**: For larger simulations (future roadmap)

## Accessibility & UX

### Design Principles
- **Progressive Disclosure**: Start simple, reveal complexity as needed
- **Multiple Representations**: Same concept shown different ways
- **Immediate Feedback**: Real-time updates on all interactions
- **Guided Exploration**: AI suggests relevant next steps
- **Error Recovery**: Clear error messages with fix suggestions

### Accessibility Features
- Keyboard navigation for all controls
- Screen reader support for quantum states
- High contrast visualization modes
- Adjustable animation speeds
- Alternative text representations

## Future Roadmap

### Phase 1 (MVP)
- Basic single and two-qubit gates
- Bloch sphere visualization
- Simple circuits (Bell states, teleportation)
- Gemini Flash integration

### Phase 2
- Full gate library
- Circuit optimization
- Noise simulation
- Multiple visualization modes
- Multi-provider AI support

### Phase 3
- Quantum algorithms library
- Advanced error models
- Collaborative features
- Export to real quantum hardware (IBM, Rigetti)
- Educational curriculum integration

### Phase 4
- Quantum machine learning toolkit
- Variational quantum algorithms
- Quantum chemistry simulations
- Community circuit library
- Research paper integration

## Technical Challenges & Solutions

### Challenge: Exponential State Space
**Solution**: Implement sparse state representation, limit to 20 qubits, offer cloud compute for larger simulations

### Challenge: Accurate Noise Models
**Solution**: Use published error rates from real quantum hardware, implement Kraus operators for channels

### Challenge: AI Code Generation Accuracy
**Solution**: Validate all generated circuits, unit tests for quantum operations, sandbox execution

### Challenge: 3D Performance
**Solution**: Level-of-detail rendering, instanced geometries, offscreen canvas for complex states

## Security & Privacy

### API Key Management
- Store keys encrypted in browser localStorage
- Never send keys to our servers
- Option to use server-side proxy with encrypted keys
- Clear warnings about API costs

### Data Privacy
- All quantum simulations run client-side by default
- No user data collection without explicit consent
- Open-source codebase for transparency
- Option to self-host entire platform

## Contributing Guidelines

### Code Standards
- TypeScript strict mode
- Comprehensive unit tests (Jest + Testing Library)
- Quantum operation tests with known results
- E2E tests for critical user flows
- Documentation for all public APIs

### Quantum Accuracy
- All gates must preserve norm
- Use established quantum computing textbooks as reference
- Cite academic papers for algorithms
- Benchmark against Qiskit/Cirq when possible

## License & Attribution

**License**: MIT (open-source, commercial use allowed)

**Dependencies**:
- Three.js (MIT)
- Next.js (MIT)
- math.js (Apache 2.0)
- All other dependencies listed in package.json

**Academic Citation**:
Users should cite relevant quantum computing papers when using specific algorithms implemented in the simulator.

## Success Metrics

### Educational Impact
- User engagement time on platform
- Circuit complexity progression over time
- Tutorial completion rates
- Community-shared circuits

### Technical Performance
- Simulation accuracy vs. Qiskit
- Rendering frame rate (target: 60 FPS)
- Time to interactive (target: <2s)
- AI response quality ratings

## Community & Support

### Documentation
- Interactive tutorials
- Video walkthroughs
- API reference
- Quantum computing primer

### Support Channels
- GitHub Issues for bugs
- Discussions for questions
- Discord community
- Stack Overflow tag

---

**Note**: This is a living document that will evolve as the project develops. All contributors should familiarize themselves with this context before making significant architectural decisions.