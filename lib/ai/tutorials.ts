/**
 * Tutorial System - Interactive Learning for Quantum Computing
 * Beginner-friendly guided tutorials with hands-on exercises
 */

import { Tutorial, TutorialStep, QuizQuestion, SkillLevel } from './types';

export const TUTORIALS: Record<string, Tutorial> = {
  'getting-started': {
    id: 'getting-started',
    title: '🚀 Getting Started with Quantum Computing',
    description: 'Learn the basics of quantum computing in 10 minutes! No math required.',
    difficulty: 'beginner',
    estimatedTime: 10,
    prerequisites: [],
    steps: [
      {
        id: 'step-1',
        title: 'Welcome to the Quantum World!',
        content: `# Welcome, Quantum Explorer! 🌌

You're about to learn one of the most exciting technologies of our time: **quantum computing**.

Don't worry if you've never heard of qubits or quantum gates before. By the end of this tutorial, you'll be creating your own quantum circuits!

## What You'll Learn:
- What a qubit is (the quantum version of a bit)
- How to put qubits in "superposition" (being 0 AND 1 at once!)
- How to create "entanglement" (spooky connections between qubits)

Ready? Click **Next** to begin! ✨`,
        type: 'info',
        highlightElements: [],
      },
      {
        id: 'step-2',
        title: 'Meet the Qubit',
        content: `# The Qubit: Your Quantum Building Block

## Classical Bit vs Qubit

Think of a light switch:
- **OFF** = 0
- **ON** = 1

A classical bit is just like this - it's either 0 or 1. Simple!

Now imagine a magical switch that could be **BOTH** on and off at the same time! 🪄

That's a **qubit** (quantum bit)!

## The Bloch Sphere

Look at the 3D sphere on your right. That's called a **Bloch sphere**.
- The **top** (north pole) = |0⟩ (zero state)
- The **bottom** (south pole) = |1⟩ (one state)
- **Anywhere else** = a mix of both! (superposition)

Try clicking on the Bloch sphere and rotating it!`,
        type: 'interactive',
        highlightElements: ['bloch-sphere'],
        action: 'explore-bloch',
      },
      {
        id: 'step-3',
        title: 'Your First Quantum Gate: Hadamard',
        content: `# The Hadamard Gate (H) ⚡

Gates are operations that change qubit states. The **Hadamard gate** is the most important one!

## What it does:
- Takes a qubit at |0⟩ (north pole)
- Puts it in **superposition** (on the equator)
- Now the qubit is 0 AND 1 simultaneously!

## Try it yourself:
1. Look at the **Gate Palette** on the left
2. Find the **H** gate (Hadamard)
3. Drag it onto **Qubit 0** in the circuit builder

Watch the Bloch sphere move from the top to the equator!`,
        type: 'action',
        highlightElements: ['gate-palette', 'circuit-builder'],
        action: 'add-hadamard',
        expectedState: {
          gates: [{ name: 'H', qubit: 0 }],
        },
      },
      {
        id: 'step-4',
        title: 'Understanding Superposition',
        content: `# You Created Superposition! 🎉

Look at the **State Display** panel. You should see something like:

\`\`\`
|0⟩: 0.707 (50%)
|1⟩: 0.707 (50%)
\`\`\`

This means your qubit has:
- **50% chance** of being measured as 0
- **50% chance** of being measured as 1

The qubit is literally in BOTH states at once!

## The Power of Superposition

With 1 qubit in superposition: 2 states at once
With 2 qubits in superposition: 4 states at once
With n qubits: 2ⁿ states at once!

This is why quantum computers can be so powerful!`,
        type: 'info',
        highlightElements: ['state-display'],
      },
      {
        id: 'step-5',
        title: 'Let\'s Create Entanglement!',
        content: `# Quantum Entanglement: Spooky Connections 👻

Now for the really weird stuff!

**Entanglement** connects qubits in a special way. When qubits are entangled:
- Measuring one instantly affects the other
- They're correlated no matter how far apart!

Einstein called this "spooky action at a distance" 👻

## Let's entangle two qubits:
1. You already have H on Qubit 0 ✅
2. Now add a **CNOT** gate between Qubits 0 and 1
   - Find CNOT in the gate palette (it has two dots connected)
   - Drag it to connect Qubit 0 → Qubit 1`,
        type: 'action',
        highlightElements: ['gate-palette', 'circuit-builder'],
        action: 'add-cnot',
        expectedState: {
          gates: [
            { name: 'H', qubit: 0 },
            { name: 'CNOT', qubits: [0, 1] },
          ],
        },
      },
      {
        id: 'step-6',
        title: 'You Created a Bell State!',
        content: `# Congratulations! 🎊

You just created a **Bell State** - one of the most important quantum states!

Look at your State Display:
\`\`\`
|00⟩: 0.707 (50%)
|11⟩: 0.707 (50%)
\`\`\`

Notice something special? The only possibilities are:
- **Both qubits are 0** (|00⟩)
- **Both qubits are 1** (|11⟩)

They're perfectly correlated! If you measure one and get 0, the other is GUARANTEED to be 0 too!

This is entanglement in action! 🔗`,
        type: 'info',
        highlightElements: ['state-display'],
      },
      {
        id: 'step-7',
        title: 'Quick Quiz!',
        content: `# Let's Test Your Knowledge! 📝

Before we finish, let's make sure you've got the basics down.`,
        type: 'quiz',
        quiz: {
          question: 'What does the Hadamard gate do to a qubit in state |0⟩?',
          options: [
            'Changes it to |1⟩',
            'Puts it in superposition (50% |0⟩, 50% |1⟩)',
            'Measures the qubit',
            'Does nothing'
          ],
          correctIndex: 1,
          explanation: 'The Hadamard gate creates an equal superposition, giving 50% probability of measuring 0 or 1!',
          difficulty: 'beginner',
        },
      },
      {
        id: 'step-8',
        title: 'You\'re a Quantum Pioneer!',
        content: `# 🏆 Tutorial Complete!

**Amazing work!** You've learned the fundamentals of quantum computing:

✅ **Qubits** - the quantum version of bits
✅ **Superposition** - being 0 and 1 simultaneously  
✅ **Hadamard Gate** - creates superposition
✅ **CNOT Gate** - creates entanglement
✅ **Bell State** - a maximally entangled state

## What's Next?

1. **Try the "Quantum Algorithms" tutorial** - Learn Grover's search!
2. **Experiment freely** - Create your own circuits
3. **Ask the AI assistant** - Type questions in the chat!

You're now part of the quantum revolution! 🚀`,
        type: 'complete',
        highlightElements: [],
      },
    ],
    learningObjectives: [
      'Understand what a qubit is',
      'Create superposition using Hadamard gate',
      'Create entanglement using CNOT gate',
      'Build a Bell state circuit',
    ],
    tags: ['basics', 'beginner', 'superposition', 'entanglement'],
  },

  'grover-algorithm': {
    id: 'grover-algorithm',
    title: '🔍 Grover\'s Search Algorithm',
    description: 'Learn how quantum computers can search faster than classical ones!',
    difficulty: 'intermediate',
    estimatedTime: 15,
    prerequisites: ['getting-started'],
    steps: [
      {
        id: 'step-1',
        title: 'The Search Problem',
        content: `# Finding a Needle in a Haystack 🔍

Imagine you have a phone book with 1 million names. You need to find someone, but you can only check one name at a time.

**Classical Computer:** Up to 1,000,000 checks (worst case)
**Quantum Computer:** Only ~1,000 checks! (√N speedup)

This is **Grover's Algorithm** - it provides a quadratic speedup for searching!

## How is this possible?

The secret is a clever trick called **amplitude amplification**. We'll learn how it works step by step.`,
        type: 'info',
      },
      {
        id: 'step-2',
        title: 'Step 1: Create Superposition',
        content: `# Setting Up the Search

First, we put all qubits in superposition. With 2 qubits, we have 4 possible states:
|00⟩, |01⟩, |10⟩, |11⟩

Each has equal probability (25%).

## Your Task:
Add **H gates** to both qubits to create equal superposition.

1. Add H to Qubit 0
2. Add H to Qubit 1`,
        type: 'action',
        action: 'add-superposition-all',
      },
      {
        id: 'step-3',
        title: 'Step 2: The Oracle',
        content: `# Marking the Target 🎯

The "oracle" is a magic black box that marks our target state. For example, if we're searching for |11⟩:

The oracle flips the sign of |11⟩'s amplitude:
- Before: +0.5|00⟩ + 0.5|01⟩ + 0.5|10⟩ + 0.5|11⟩
- After: +0.5|00⟩ + 0.5|01⟩ + 0.5|10⟩ **- 0.5|11⟩**

The target now has a negative amplitude!

## Implement the Oracle:
For marking |11⟩, we use a CZ gate.

Add a **CZ gate** between Qubits 0 and 1.`,
        type: 'action',
        action: 'add-oracle',
      },
      {
        id: 'step-4',
        title: 'Step 3: Diffusion',
        content: `# Amplitude Amplification 📈

Now comes the magic! The **diffusion operator** amplifies the marked state.

It works by:
1. Reflecting amplitudes about their average
2. The negative amplitude becomes very positive
3. Other amplitudes get smaller

## The Diffusion Circuit:
1. H on all qubits
2. X on all qubits
3. CZ between qubits
4. X on all qubits
5. H on all qubits

This sounds complex, but try asking the AI to complete it!`,
        type: 'info',
      },
      {
        id: 'step-5',
        title: 'Complete Grover\'s Algorithm',
        content: `# Put It All Together!

Ask the AI assistant: **"Create Grover's algorithm for 2 qubits"**

The AI will generate the complete circuit with:
- Initial superposition
- Oracle (marks the target)
- Diffusion (amplifies the target)

Watch how the probability of measuring the target state increases!`,
        type: 'interactive',
        action: 'use-ai-grover',
      },
    ],
    learningObjectives: [
      'Understand the search problem',
      'Learn amplitude amplification',
      'Build an oracle circuit',
      'Implement the diffusion operator',
    ],
    tags: ['algorithms', 'intermediate', 'grover', 'search'],
  },

  'quantum-teleportation': {
    id: 'quantum-teleportation',
    title: '📡 Quantum Teleportation',
    description: 'Teleport quantum information using entanglement!',
    difficulty: 'intermediate',
    estimatedTime: 12,
    prerequisites: ['getting-started'],
    steps: [
      {
        id: 'step-1',
        title: 'What is Quantum Teleportation?',
        content: `# Beam Me Up, Scotty! 📡

**Quantum teleportation** transfers a quantum state from one qubit to another - even across large distances!

## What it's NOT:
- ❌ Moving physical matter
- ❌ Faster than light communication

## What it IS:
- ✅ Transferring quantum information
- ✅ Requires classical communication
- ✅ Destroys the original state (no cloning!)

The "teleported" state arrives at the destination perfectly, while the original is destroyed. It's more like a fax than Star Trek!`,
        type: 'info',
      },
      {
        id: 'step-2',
        title: 'The Protocol Setup',
        content: `# Three Qubit Setup

We need 3 qubits:
- **Qubit 0**: The state to teleport (Alice's message)
- **Qubit 1**: Alice's half of the entangled pair
- **Qubit 2**: Bob's half (destination)

## Step 1: Prepare the message
Let's teleport the |+⟩ state (superposition):
Add **H to Qubit 0**

## Step 2: Create shared entanglement
Alice and Bob share a Bell pair:
1. Add H to Qubit 1
2. Add CNOT from Qubit 1 to Qubit 2`,
        type: 'action',
        action: 'teleport-setup',
      },
      {
        id: 'step-3',
        title: 'Bell Measurement',
        content: `# Alice's Measurement

Alice performs a special measurement called a "Bell measurement":
1. CNOT from Qubit 0 to Qubit 1
2. H on Qubit 0
3. Measure Qubits 0 and 1

This entangles the message with Alice's half of the pair, which magically transfers the state to Bob!

Add:
1. **CNOT** from Qubit 0 to Qubit 1
2. **H** on Qubit 0`,
        type: 'action',
        action: 'bell-measurement',
      },
      {
        id: 'step-4',
        title: 'Teleportation Complete!',
        content: `# Bob Receives the State 🎉

After Alice measures and tells Bob the results (2 classical bits), Bob applies corrections:
- If Alice measured 1 on Qubit 0: Apply Z to Qubit 2
- If Alice measured 1 on Qubit 1: Apply X to Qubit 2

The original |+⟩ state now exists on Qubit 2!

## Key Insights:
- Required entanglement as a resource
- Needed 2 classical bits
- Original state was destroyed
- No faster-than-light communication!`,
        type: 'complete',
      },
    ],
    learningObjectives: [
      'Understand quantum teleportation protocol',
      'Use entanglement as a resource',
      'Perform Bell measurement',
    ],
    tags: ['teleportation', 'intermediate', 'entanglement', 'protocols'],
  },

  'quantum-gates-deep-dive': {
    id: 'quantum-gates-deep-dive',
    title: '⚡ Quantum Gates Deep Dive',
    description: 'Master all the essential quantum gates',
    difficulty: 'beginner',
    estimatedTime: 20,
    prerequisites: [],
    steps: [
      {
        id: 'step-1',
        title: 'What are Quantum Gates?',
        content: `# Gates: The Building Blocks ⚡

Quantum gates are operations that transform qubit states. Think of them as instructions that tell qubits what to do!

## Key Properties:
- Gates are **reversible** (can be undone)
- Gates preserve **probability** (total stays at 100%)
- Mathematically, they're **unitary matrices**

## Categories:
1. **Single-qubit gates**: Act on one qubit (H, X, Y, Z, S, T)
2. **Two-qubit gates**: Connect two qubits (CNOT, CZ, SWAP)
3. **Multi-qubit gates**: Connect three+ qubits (Toffoli)

Let's explore each one!`,
        type: 'info',
      },
      {
        id: 'step-2',
        title: 'Pauli Gates (X, Y, Z)',
        content: `# The Pauli Gates

## X Gate (NOT gate)
Flips |0⟩ ↔ |1⟩
Like a classical NOT!

## Z Gate (Phase flip)
Adds a minus sign to |1⟩
|0⟩ → |0⟩
|1⟩ → -|1⟩

## Y Gate (Combined)
Does both X and Z!
Rotates around the Y-axis of the Bloch sphere.

**Try it:** Add an X gate and watch the Bloch sphere flip from top to bottom!`,
        type: 'action',
        action: 'try-pauli',
      },
      {
        id: 'step-3',
        title: 'Phase Gates (S and T)',
        content: `# Fine-tuning Phases

## S Gate (√Z)
Adds 90° of phase to |1⟩
Apply twice = Z gate

## T Gate (√S)
Adds 45° of phase to |1⟩
Apply twice = S gate

These are essential for universal quantum computing!

**Watch:** On the Bloch sphere, these rotate around the Z-axis (vertical).`,
        type: 'info',
      },
      {
        id: 'step-4',
        title: 'Rotation Gates (Rx, Ry, Rz)',
        content: `# Precise Rotations

The rotation gates let you rotate by any angle:

- **Rx(θ)**: Rotate around X-axis by angle θ
- **Ry(θ)**: Rotate around Y-axis by angle θ
- **Rz(θ)**: Rotate around Z-axis by angle θ

## Fun fact:
All single-qubit gates can be built from rotations!

H = Ry(π/2) · Rz(π)
X = Rx(π)
Z = Rz(π)

This means rotations are "universal" for single qubits!`,
        type: 'info',
      },
      {
        id: 'step-5',
        title: 'Two-Qubit Gates',
        content: `# Connecting Qubits

## CNOT (Controlled-NOT)
- If control qubit is |1⟩, flip the target
- Creates entanglement!

## CZ (Controlled-Z)
- If both qubits are |1⟩, add minus sign
- Symmetric (control/target don't matter)

## SWAP
- Exchange the states of two qubits

**Key insight:** Two-qubit gates are essential because they're the only way to create entanglement!`,
        type: 'interactive',
        action: 'try-two-qubit',
      },
    ],
    learningObjectives: [
      'Understand all basic quantum gates',
      'Know when to use each gate type',
      'Visualize gate effects on Bloch sphere',
    ],
    tags: ['gates', 'beginner', 'fundamentals'],
  },
};

export const BEGINNER_TIPS: string[] = [
  '💡 **Tip:** Double-click a gate in the circuit to remove it!',
  '💡 **Tip:** Ask the AI anything! Try "What is superposition?"',
  '💡 **Tip:** Watch the Bloch sphere as you add gates - it shows how the qubit state changes.',
  '💡 **Tip:** The H gate (Hadamard) is your best friend - it creates superposition!',
  '💡 **Tip:** CNOT + H = Entanglement! This combo creates Bell states.',
  '💡 **Tip:** Hover over gates to see what they do.',
  '💡 **Tip:** Try the "Bell State" example prompt to see entanglement in action!',
  '💡 **Tip:** Quantum states are complex numbers - the Bloch sphere helps visualize them.',
  '💡 **Tip:** Measurement collapses superposition - you\'ll get 0 or 1, not both!',
  '💡 **Tip:** You can export your circuit to Qiskit, Cirq, or Q# to run on real hardware!',
];

export function getRandomTip(): string {
  return BEGINNER_TIPS[Math.floor(Math.random() * BEGINNER_TIPS.length)];
}

export function getTutorialById(id: string): Tutorial | undefined {
  return TUTORIALS[id];
}

export function getTutorialsByDifficulty(difficulty: SkillLevel): Tutorial[] {
  return Object.values(TUTORIALS).filter(t => t.difficulty === difficulty);
}

export function getRecommendedTutorials(completedTutorials: string[]): Tutorial[] {
  return Object.values(TUTORIALS).filter(tutorial => {
    // Not completed
    if (completedTutorials.includes(tutorial.id)) return false;
    // Prerequisites met
    const prereqs = tutorial.prerequisites || [];
    return prereqs.every(p => completedTutorials.includes(p));
  });
}

export function getAllTutorials(): Tutorial[] {
  return Object.values(TUTORIALS);
}

// Onboarding flow for new users
export const ONBOARDING_FLOW = {
  welcome: {
    title: 'Welcome to Quantum Simulator! 🚀',
    description: 'Ready to explore the quantum world?',
    options: [
      {
        id: 'guided',
        label: "I'm new to quantum computing",
        description: 'Start with a guided tutorial',
        action: 'start-tutorial',
        tutorialId: 'getting-started',
      },
      {
        id: 'explore',
        label: 'I know the basics',
        description: 'Jump into the simulator',
        action: 'skip-onboarding',
      },
      {
        id: 'advanced',
        label: 'I\'m a quantum expert',
        description: 'Show me the advanced features',
        action: 'advanced-mode',
      },
    ],
  },
  skillAssessment: [
    {
      question: 'Have you heard of a qubit before?',
      options: ['Yes', 'No'],
    },
    {
      question: 'Do you know what superposition means?',
      options: ['Yes, I can explain it', 'I\'ve heard of it', 'No'],
    },
    {
      question: 'Have you used Qiskit, Cirq, or Q# before?',
      options: ['Yes', 'No'],
    },
  ],
};
