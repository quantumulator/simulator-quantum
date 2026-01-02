"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useQuantumShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useToast } from '@/components/ui/toast';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { useQuantumStore } from '@/lib/store';
import {
  GatePalette,
  CircuitBuilder,
  StateDisplay,
  ChatInterface,
  MeasurementHistogram,
} from '@/components/quantum';
import {
  Settings,
  Code,
  BarChart3,
  CircuitBoard,
  MessageSquare,
  Atom,
  Github,
  Moon,
  Sun,
  GraduationCap,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Lightbulb,
  X,
  Play,
  BookOpen,
  Rocket,
  Zap,
  Target,
} from 'lucide-react';
import { getRandomTip, getAllTutorials, ONBOARDING_FLOW } from '@/lib/ai/tutorials';
import type { SkillLevel } from '@/lib/ai/types';

// Dynamic imports for heavy components
const BlochSphere = dynamic(
  () => import('@/components/quantum/BlochSphere').then(mod => ({ default: mod.BlochSphere })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-muted-foreground">Loading 3D...</div> }
);

const CodeEditor = dynamic(
  () => import('@/components/quantum/CodeEditor').then(mod => ({ default: mod.CodeEditor })),
  { ssr: false, loading: () => <div className="h-full flex items-center justify-center text-muted-foreground">Loading Editor...</div> }
);

// Skill Level Selector Component
function SkillLevelSelector({
  currentLevel,
  onLevelChange
}: {
  currentLevel: SkillLevel;
  onLevelChange: (level: SkillLevel) => void;
}) {
  const levels: { level: SkillLevel; label: string; icon: React.ReactNode; description: string }[] = [
    {
      level: 'beginner',
      label: 'Beginner',
      icon: <Rocket className="h-5 w-5" />,
      description: 'New to quantum computing'
    },
    {
      level: 'intermediate',
      label: 'Intermediate',
      icon: <Zap className="h-5 w-5" />,
      description: 'Know the basics'
    },
    {
      level: 'advanced',
      label: 'Advanced',
      icon: <Target className="h-5 w-5" />,
      description: 'Quantum expert'
    },
  ];

  return (
    <div className="flex gap-2">
      {levels.map(({ level, label, icon }) => (
        <Button
          key={level}
          variant={currentLevel === level ? 'default' : 'outline'}
          size="sm"
          onClick={() => onLevelChange(level)}
          className={`gap-2 ${level === 'beginner' ? 'hover:bg-green-500/20' :
            level === 'intermediate' ? 'hover:bg-yellow-500/20' :
              'hover:bg-red-500/20'
            }`}
        >
          {icon}
          {label}
        </Button>
      ))}
    </div>
  );
}

// Beginner Tip Banner
function TipBanner({ onClose }: { onClose: () => void }) {
  const [tip] = useState(getRandomTip());

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3 animate-fade-in-up">
      <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
      <p className="text-sm flex-1">{tip.replace('💡 **Tip:** ', '')}</p>
      <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Tutorial Panel
function TutorialPanel({ onClose, onStartTutorial }: { onClose: () => void; onStartTutorial: (id: string) => void }) {
  const tutorials = getAllTutorials();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Interactive Tutorials
            </h2>
            <p className="text-muted-foreground mt-1">Learn quantum computing step by step</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {tutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
              onClick={() => onStartTutorial(tutorial.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {tutorial.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{tutorial.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tutorial.difficulty === 'beginner' ? 'badge-beginner' :
                      tutorial.difficulty === 'intermediate' ? 'badge-intermediate' :
                        'badge-advanced'
                      }`}>
                      {tutorial.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ~{tutorial.estimatedTime} min
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings Dialog with Custom Model Support
function SettingsDialog() {
  const { apiKey, setApiKey, aiProvider, setAiProvider, aiModel, setAiModel } = useQuantumStore();
  const [localKey, setLocalKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(aiModel);
  const [customModel, setCustomModel] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [open, setOpen] = useState(false);

  // Update local model when provider changes
  useEffect(() => {
    const defaultModels: Record<string, string> = {
      gemini: 'gemini-2.0-flash-exp',
      openai: 'gpt-4o',
      anthropic: 'claude-sonnet-4-20250514'
    };
    if (!useCustomModel) {
      setLocalModel(defaultModels[aiProvider] || localModel);
    }
  }, [aiProvider, useCustomModel]);

  const handleSave = () => {
    setApiKey(localKey);
    setAiModel(useCustomModel ? customModel : localModel);
    setSaveMessage('✓ Settings saved successfully!');
    setTimeout(() => {
      setSaveMessage('');
      setOpen(false);
    }, 1500);
  };

  // Available models for each provider
  const availableModels: Record<string, { value: string; label: string }[]> = {
    gemini: [
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Fastest)' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Best)' },
    ],
    openai: [
      { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Faster)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'o1-preview', label: 'o1 Preview' },
    ],
    anthropic: [
      { value: 'claude-sonnet-4-20250514', label: 'Claude 4 Sonnet (Latest)' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Best)' },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your AI provider and preferences</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">AI Provider</label>
            <div className="flex gap-2 mt-2">
              {(['gemini', 'openai', 'anthropic'] as const).map((provider) => (
                <Button
                  key={provider}
                  variant={aiProvider === provider ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAiProvider(provider)}
                  className="capitalize"
                >
                  {provider}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Model</label>
            <select
              value={localModel}
              onChange={(e) => {
                setLocalModel(e.target.value);
                setUseCustomModel(false);
              }}
              disabled={useCustomModel}
              className="w-full mt-2 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {availableModels[aiProvider].map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Different models offer trade-offs between speed and quality.
            </p>
          </div>

          {/* Custom Model Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Custom Model</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomModel}
                  onChange={(e) => setUseCustomModel(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-xs text-muted-foreground">Use custom</span>
              </label>
            </div>
            <Input
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="e.g., gpt-4-0125-preview, claude-3-haiku..."
              disabled={!useCustomModel}
              className="disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter any model name supported by your selected provider.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Enter your API key..."
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          <Button onClick={handleSave} className="w-full gap-2" disabled={!!saveMessage}>
            {saveMessage ? (
              <>
                <span className="animate-fade-in-up">{saveMessage}</span>
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Onboarding Modal for new users
function OnboardingModal({ onComplete }: { onComplete: (level: SkillLevel) => void }) {
  const [step, setStep] = useState<'welcome' | 'complete'>('welcome');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Atom className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome to Quantum Simulator! 🚀</h2>
          <p className="text-muted-foreground">Your journey into quantum computing starts here</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-center text-sm text-muted-foreground mb-4">
            Choose your experience level:
          </p>

          {ONBOARDING_FLOW.welcome.options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                const levelMap: Record<string, SkillLevel> = {
                  'guided': 'beginner',
                  'explore': 'intermediate',
                  'advanced': 'advanced',
                };
                onComplete(levelMap[option.id]);
              }}
              className="w-full p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {option.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuantumSimulatorPage() {
  const { initSimulator, simulator, runSimulation, circuitGates, isRunning, clearCircuit, undo, redo, canUndo, canRedo } = useQuantumStore();
  const [activePanel, setActivePanel] = useState<'circuit' | 'code' | 'chat'>('circuit');
  const [darkMode, setDarkMode] = useState(true);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [showTip, setShowTip] = useState(true);
  const [showTutorials, setShowTutorials] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const toast = useToast();

  // Keyboard shortcuts
  useQuantumShortcuts({
    onUndo: () => {
      if (canUndo()) {
        undo();
        toast.info('Undo', 'Previous state restored');
      }
    },
    onRedo: () => {
      if (canRedo()) {
        redo();
        toast.info('Redo', 'State restored');
      }
    },
    onRun: () => {
      if (!isRunning && circuitGates.length > 0) {
        runSimulation();
        toast.success('Simulation complete', 'Circuit executed successfully');
      }
    },
    onClear: () => {
      if (circuitGates.length > 0) {
        clearCircuit();
        toast.info('Circuit cleared');
      }
    },
  });

  useEffect(() => {
    if (!simulator) {
      initSimulator(2);
    }

    // Check if first visit
    const hasVisited = localStorage.getItem('quantum-simulator-visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      setIsFirstVisit(true);
    }
  }, [simulator, initSimulator]);

  // Auto-run simulation when gates change
  useEffect(() => {
    if (circuitGates.length > 0) {
      runSimulation();
    }
  }, [circuitGates, runSimulation]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleOnboardingComplete = useCallback((level: SkillLevel) => {
    setSkillLevel(level);
    setShowOnboarding(false);
    localStorage.setItem('quantum-simulator-visited', 'true');

    if (level === 'beginner') {
      setShowTutorials(true);
    }
  }, []);

  const handleStartTutorial = useCallback((tutorialId: string) => {
    setShowTutorials(false);
    // In a full implementation, this would start the tutorial
    console.log('Starting tutorial:', tutorialId);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground particle-bg">
      {/* Onboarding Modal */}
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Tutorial Panel */}
      {showTutorials && (
        <TutorialPanel
          onClose={() => setShowTutorials(false)}
          onStartTutorial={handleStartTutorial}
        />
      )}

      {/* Header */}
      <header className="border-b glass sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Atom className="h-8 w-8 text-primary quantum-glow" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Quantum Simulator
              </h1>
              <p className="text-xs text-muted-foreground">AI-Powered Interactive Learning</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Skill Level */}
            <SkillLevelSelector currentLevel={skillLevel} onLevelChange={setSkillLevel} />

            <div className="h-6 w-px bg-border" />

            {/* Tutorials */}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowTutorials(true)}
            >
              <GraduationCap className="h-4 w-4" />
              Tutorials
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Settings & Theme */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <SettingsDialog />
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/quantumulator/simulator-quantum" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Tip Banner for Beginners */}
      {skillLevel === 'beginner' && showTip && (
        <div className="container mx-auto px-4 pt-4">
          <TipBanner onClose={() => setShowTip(false)} />
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
          {/* Left Sidebar - Gate Palette */}
          <div className="col-span-2 overflow-y-auto">
            <div className="glass rounded-xl p-4 h-full">
              <GatePalette />
            </div>
          </div>

          {/* Center - Main Content Area */}
          <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
            {/* Top Tabs */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Button
                variant={activePanel === 'circuit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('circuit')}
                className="gap-2"
              >
                <CircuitBoard className="h-4 w-4" />
                Circuit Builder
              </Button>
              <Button
                variant={activePanel === 'code' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('code')}
                className="gap-2"
              >
                <Code className="h-4 w-4" />
                Code Editor
              </Button>
              <Button
                variant={activePanel === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActivePanel('chat')}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                AI Assistant
                <span className="ml-1 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                  ✨
                </span>
              </Button>

              <div className="flex-1" />

              {activePanel === 'circuit' && (
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={runSimulation}
                  disabled={isRunning}
                >
                  <Play className="h-4 w-4" />
                  {isRunning ? 'Running...' : 'Run Simulation'}
                </Button>
              )}
            </div>

            {/* Main Panel */}
            <div className="flex-1 overflow-hidden glass rounded-xl">
              {activePanel === 'circuit' && <CircuitBuilder />}
              {activePanel === 'code' && <CodeEditor />}
              {activePanel === 'chat' && <ChatInterface />}
            </div>
          </div>

          {/* Right Sidebar - Results & Visualization */}
          <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
            <Tabs defaultValue="state" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 glass">
                <TabsTrigger value="state" className="gap-2 text-xs">
                  <BarChart3 className="h-3 w-3" />
                  State
                </TabsTrigger>
                <TabsTrigger value="histogram" className="gap-2 text-xs">
                  <BarChart3 className="h-3 w-3" />
                  Measure
                </TabsTrigger>
                <TabsTrigger value="bloch" className="gap-2 text-xs">
                  <Atom className="h-3 w-3" />
                  Bloch
                </TabsTrigger>
              </TabsList>
              <TabsContent value="state" className="flex-1 overflow-hidden glass rounded-xl mt-4">
                <StateDisplay />
              </TabsContent>
              <TabsContent value="histogram" className="flex-1 overflow-hidden glass rounded-xl mt-4">
                <MeasurementHistogram />
              </TabsContent>
              <TabsContent value="bloch" className="flex-1 overflow-hidden glass rounded-xl mt-4 bloch-container">
                <BlochSphere />
              </TabsContent>
            </Tabs>

            {/* Quick Help for Beginners */}
            {skillLevel === 'beginner' && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Quick Start</h3>
                </div>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    Drag gates from the left panel to the circuit
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    Watch the state change in real-time
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    Ask the AI assistant for help!
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 glass">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>Open Source Quantum Simulator • Built with ❤️ for Quantum Computing</p>
          <div className="flex items-center gap-4">
            <span className={`px-2 py-1 rounded-full text-xs ${skillLevel === 'beginner' ? 'badge-beginner' :
              skillLevel === 'intermediate' ? 'badge-intermediate' :
                'badge-advanced'
              }`}>
              {skillLevel} mode
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
