/**
 * AI Agent System Types
 * Comprehensive type definitions for the multi-agent architecture
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type AIProvider = 'gemini' | 'openai' | 'anthropic';
export type IntentType = 
  | 'create_circuit' 
  | 'explain_concept' 
  | 'analyze_circuit' 
  | 'modify_circuit' 
  | 'run_experiment' 
  | 'debug' 
  | 'learn'
  | 'export_code'
  | 'optimize';

export interface IntentClassification {
  primary: IntentType;
  confidence: number;
  entities: {
    gates?: string[];
    algorithms?: string[];
    qubits?: number;
    concepts?: string[];
    modifications?: string[];
    targetLanguage?: 'qsharp' | 'qiskit' | 'cirq' | 'typescript';
  };
  context: SkillLevel;
  suggestedActions: string[];
}

export interface CircuitGenerationParams {
  request: string;
  numQubits?: number;
  complexity?: SkillLevel;
  targetLanguage?: string;
  includeExplanation?: boolean;
  includeVisualization?: boolean;
}

export interface ExplanationParams {
  topic: string;
  skillLevel: SkillLevel;
  relatedCircuit?: string;
  includeExamples?: boolean;
  includeQuiz?: boolean;
}

export interface AnalysisParams {
  circuitCode: string;
  analysisType: 'complexity' | 'entanglement' | 'optimization' | 'error' | 'full';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  metrics?: CircuitMetrics;
}

export interface ValidationError {
  severity: 'error';
  location: string;
  message: string;
  fix?: string;
}

export interface ValidationWarning {
  severity: 'warning';
  location: string;
  message: string;
  suggestion?: string;
}

export interface CircuitMetrics {
  gateCount: number;
  depth: number;
  qubitCount: number;
  twoQubitGates: number;
  singleQubitGates: number;
  measurementCount: number;
  entanglementScore?: number;
}

export interface AgentResponse {
  success: boolean;
  content: string;
  circuitCode?: string;
  explanation?: string;
  analysis?: CircuitAnalysis;
  suggestions?: string[];
  nextSteps?: string[];
  quiz?: QuizQuestion;
  visualization?: VisualizationHint[];
}

export interface CircuitAnalysis {
  metrics: CircuitMetrics;
  insights: string[];
  optimizations: OptimizationSuggestion[];
  educationalNotes: string[];
}

export interface OptimizationSuggestion {
  type: string;
  description: string;
  originalGates: string;
  optimizedGates: string;
  improvement: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: SkillLevel;
}

export interface VisualizationHint {
  type: 'bloch' | 'statevector' | 'histogram' | 'entanglement' | 'circuit';
  qubit?: number;
  description: string;
  timing?: 'before' | 'after' | 'during';
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  type?: 'info' | 'action' | 'interactive' | 'quiz' | 'complete';
  action?: string;
  target?: string;
  circuitCode?: string;
  expectedResult?: string;
  expectedState?: Record<string, unknown>;
  highlightElements?: string[];
  hint?: string;
  celebration?: boolean;
  quiz?: QuizQuestion;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: SkillLevel;
  estimatedTime: number;
  steps: TutorialStep[];
  prerequisites?: string[];
  learningObjectives?: string[];
  outcomes?: string[];
  tags?: string[];
}

export interface CodeExport {
  language: string;
  code: string;
  framework?: string;
  version?: string;
  imports?: string;
  dependencies?: string[];
  explanation?: string;
  runInstructions?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: IntentClassification;
    circuitCode?: string;
    visualization?: VisualizationHint[];
    quiz?: QuizQuestion;
  };
}

export interface UserProgress {
  level: SkillLevel;
  completedTutorials: string[];
  conceptsMastered: string[];
  circuitsCreated: number;
  quizScore: number;
  achievements: Achievement[];
  preferences: UserPreferences;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface UserPreferences {
  darkMode: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  showHints: boolean;
  autoVisualize: boolean;
  preferredLanguage: 'qsharp' | 'qiskit' | 'cirq' | 'typescript';
  codeAssistance: boolean;
}
