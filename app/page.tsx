import Link from "next/link";
import { Atom, ArrowRight, Code, BarChart3, Sparkles, Github, BookOpen, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Atom className="h-8 w-8 text-purple-500" />
            <span className="text-xl font-bold">Quantum Simulator</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/simulator" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Simulator
            </Link>
            <a 
              href="https://github.com/quantumulator/simulator-quantum" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Quantum Computing Education
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Learn Quantum Computing
            <br />
            <span className="text-purple-500">Interactively</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            An open-source quantum simulator that lets you build, visualize, and experiment 
            with quantum circuits. Powered by AI to help you understand complex concepts.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/simulator"
              className="inline-flex items-center gap-2 px-8 py-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              Launch Simulator
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://github.com/quantumulator/simulator-quantum"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
            >
              <Github className="h-5 w-5" />
              View Source
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="p-8 rounded-2xl bg-card border">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Cpu className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real Quantum Simulation</h3>
            <p className="text-muted-foreground">
              Accurate simulation of quantum states, gates, and measurements. Supports up to 
              20 qubits with state vector representation.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI-Powered Assistant</h3>
            <p className="text-muted-foreground">
              Ask questions in natural language. Generate circuits, get explanations, 
              and learn quantum concepts with AI guidance.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <BarChart3 className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3D Visualization</h3>
            <p className="text-muted-foreground">
              Interactive Bloch sphere, probability distributions, and state vector displays. 
              See quantum states come to life.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Code className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Code Editor</h3>
            <p className="text-muted-foreground">
              Write quantum circuits in TypeScript with full syntax highlighting. 
              Export to Python/Qiskit for use on real quantum hardware.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <BookOpen className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Educational Content</h3>
            <p className="text-muted-foreground">
              Built-in tutorials, algorithm examples, and concept explanations. 
              Perfect for students and researchers alike.
            </p>
          </div>
          
          <div className="p-8 rounded-2xl bg-card border">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
              <Github className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Open Source</h3>
            <p className="text-muted-foreground">
              Fully open source under MIT license. Contribute, customize, and 
              extend the simulator for your needs.
            </p>
          </div>
        </div>

        {/* Quick Start Examples */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold mb-4">Quick Start Examples</h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Try these quantum circuits to get started. Click any example to load it in the simulator.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link 
              href="/simulator?circuit=bell"
              className="p-6 rounded-xl bg-card border hover:border-purple-500 transition-colors group"
            >
              <h4 className="font-semibold mb-2 group-hover:text-purple-500 transition-colors">
                Bell State
              </h4>
              <p className="text-sm text-muted-foreground">
                Create maximally entangled qubits
              </p>
              <code className="block mt-4 text-xs bg-muted p-2 rounded font-mono">
                H(0) → CNOT(0,1)
              </code>
            </Link>
            
            <Link 
              href="/simulator?circuit=grover"
              className="p-6 rounded-xl bg-card border hover:border-purple-500 transition-colors group"
            >
              <h4 className="font-semibold mb-2 group-hover:text-purple-500 transition-colors">
                Grover Algorithm
              </h4>
              <p className="text-sm text-muted-foreground">
                Quantum search with quadratic speedup
              </p>
              <code className="block mt-4 text-xs bg-muted p-2 rounded font-mono">
                H → Oracle → Diffusion
              </code>
            </Link>
            
            <Link 
              href="/simulator?circuit=teleportation"
              className="p-6 rounded-xl bg-card border hover:border-purple-500 transition-colors group"
            >
              <h4 className="font-semibold mb-2 group-hover:text-purple-500 transition-colors">
                Quantum Teleportation
              </h4>
              <p className="text-sm text-muted-foreground">
                Transfer quantum state using entanglement
              </p>
              <code className="block mt-4 text-xs bg-muted p-2 rounded font-mono">
                Bell + Measurement + Correction
              </code>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-32">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Atom className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Quantum Simulator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source • Built with Passion for Quantum Computing
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/quantumulator/simulator-quantum" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
