# 🌌 Quantum Simulator - AI-Powered Quantum Computing Platform

[![License: CCL-NC](https://img.shields.io/badge/License-CCL--NC-blue.svg)](LICENSE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-orange)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> **The most intuitive quantum computing simulator powered by AI. Just tell it what you want to build.**

![Quantum Simulator Demo](/public/main_image.png)

## What Is This?

An **open-source, AI-powered quantum computing simulator** that makes quantum mechanics accessible to everyone. Build quantum circuits using natural language, visualize complex quantum states in 3D, and understand quantum computing from first principles. No quantum background needed.

**Perfect for:**
- 🎓 Students learning quantum computing
- 👨‍💻 Developers exploring quantum algorithms  
- 🔬 Researchers prototyping quantum solutions
- 🤖 Anyone curious about quantum mechanics

## 🚀 Quick Start (60 seconds)

```bash
# 1. Clone
git clone https://github.com/quantumulator/simulator-quantum.git && cd simulator-quantum

# 2. Install
npm install

# 3. Setup AI (free)
# Get API key from https://aistudio.google.com/api-keys
# Create .env.local with: NEXT_PUBLIC_GEMINI_API_KEY=your_key

# 4. Run
npm run dev
```

Open **http://localhost:3000** → Click "Circuit Builder" → Start creating! ✨

## ✨ What Makes It Special?

### 🎯 **Natural Language Interface**
Just describe what you want to build. The AI understands quantum computing and generates working circuits.

```
User: "Create a Bell state circuit"
AI: *Generates perfect entangled 2-qubit circuit in seconds*
```

### 🌐 **3D Quantum Visualizations**
- **Bloch Sphere**: Watch qubits evolve in real-time
- **State Evolution**: See superposition and entanglement visually
- **Circuit Builder**: Drag-and-drop quantum gates with instant feedback
- **Measurement Histograms**: Run 1000s of measurements, see actual quantum probabilities

### 🤖 **Multi-AI Provider Support**
- **Google Gemini** - Free tier, very fast (recommended)
- **OpenAI GPT-4o** - Best for complex algorithms
- **Anthropic Claude** - Excellent educational content
- Switch providers anytime in settings

### ⚡ **High Performance**
- **Up to 20 qubits** simulated in your browser (classical limit)
- **Instant execution** - Gates apply in real-time
- **No backend required** - Everything runs locally
- **GPU-accelerated** matrix operations

### 📚 **Learn Quantum Computing**
- **Interactive tutorials** for beginners
- **Explain any circuit** - AI breaks it down step by step
- **Practice exercises** with instant feedback
- **Skill levels** - Beginner, Intermediate, Advanced

### 🔬 **Accurate Quantum Physics**
- Proper unitary operations
- Correct state normalization
- Real measurement collapse
- Entanglement detection
- Fidelity calculations

## 💡 Usage Examples

### Example 1: Create a Bell State (Entanglement)
```
Type: "Create a Bell state circuit"
→ AI generates circuit
→ Bloch spheres show perfect correlation
→ Measurement results always match!
```

### Example 2: Understand Superposition
```
Type: "What happens when I apply Hadamard?"
→ AI explains the physics
→ Shows superposition on Bloch sphere
→ Runs measurements to demonstrate
```

### Example 3: Build Quantum Teleportation
```
Type: "Help me build quantum teleportation"
→ AI generates circuit
→ Step-by-step explanation
→ Interactive visualization
→ Run experiments to verify it works
```

## � Core Features

| Feature | Details |
|---------|---------|
| **30+ Quantum Gates** | H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, CZ, SWAP, Toffoli, and more |
| **Up to 20 Qubits** | Classical simulator with exponential state space |
| **3D Bloch Sphere** | Real-time visualization of single-qubit states |
| **State Vector Display** | See amplitude and probability of each basis state |
| **Measurement Histograms** | Run 1000s of shots and analyze quantum statistics |
| **Circuit Builder** | Drag-and-drop interface for building circuits |
| **Code Editor** | Write circuits in TypeScript, convert to Qiskit/Cirq/Q#/OpenQASM/PennyLane |
| **AI Assistant** | Ask questions, generate code, learn concepts |
| **Multi-AI Support** | Gemini, GPT-4, Claude - switch anytime |
| **Local Storage** | All computations on your device, no data sent anywhere |

## 🛠️ Tech Stack

```
Frontend:  Next.js 16, React 18, TypeScript, Tailwind CSS
3D:        Three.js, React Three Fiber
State:     Zustand
Code:      Monaco Editor
UI:        shadcn/ui, Radix UI
Quantum:   Custom TypeScript implementation
AI:        Gemini API, OpenAI, Anthropic
```

## 🧪 Try It Now

**No installation required for basic features:**
1. Go to [Quantum Simulator](https://simulator-quantum.vercel.app/)
2. Get free API key from [Google AI Studio](https://aistudio.google.com/api-keys)
3. Paste key in Settings
4. Start building quantum circuits!

**Run locally:**
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 🤝 Contributing *(coming soon)*

We love contributions! Help us make quantum computing accessible to everyone.

**How to contribute:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-thing`
3. Make your changes
4. Push and open a PR!

**Ideas for contribution:**
- 🎨 Improve visualizations
- 🚀 Add new quantum gates or algorithms
- 📚 Write tutorials and documentation
- 🐛 Report bugs and issues
- 💡 Suggest features
- 🌐 Translate to other languages

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines. *(coming soon)*

## 📜 License *(coming soon)*

This project uses the **Community-Commercial License (CCL-NC)** - free for personal/educational use, requires license for commercial use.

**Quick summary:**
- ✅ FREE for personal use
- ✅ FREE for education and learning
- ✅ FREE for open-source projects  
- ❌ Commercial use requires license

[Full License Details](LICENSE.md)

## 🙏 Thanks

Built with love using:
- **Next.js** - React framework
- **Three.js** - 3D graphics
- **Tailwind CSS** - Styling
- **shadcn/ui** - Components
- **Zustand** - State management
- **Monaco Editor** - Code editor

## 🌟 Show Your Support

- ⭐ Star this repo if you find it useful!
- 🔗 Share with other quantum enthusiasts
- 💬 Join the discussions
- 🐦 Follow us on [Twitter](https://twitter.com/) *(coming soon)*
- 💰 [Sponsor development](https://github.com/sponsors/) *(coming soon)*

---

**Questions?** Open an issue or ask in [Discussions](https://github.com/issues)

**Commercial use?** *(coming soon)*

**Made with ❤️ for the quantum computing community**