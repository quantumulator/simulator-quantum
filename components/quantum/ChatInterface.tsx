"use client";

/**
 * Enhanced AI Chat Interface with Markdown Support
 * Better UI for quantum computing conversations
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuantumStore, Message } from '@/lib/store';
import { processAIRequest } from '@/lib/ai/agent-core';
import { cn } from '@/lib/utils';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  Code,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import type { SkillLevel, QuizQuestion } from '@/lib/ai/types';

const EXAMPLE_PROMPTS = [
  { text: "Create a Bell state", icon: "🔗" },
  { text: "Explain quantum entanglement", icon: "📚" },
  { text: "What is superposition?", icon: "❓" },
  { text: "Show Grover's algorithm", icon: "🔍" },
  { text: "How does the Hadamard gate work?", icon: "⚡" },
];

// Simple Markdown renderer
function MarkdownContent({ content }: { content: string }) {
  const rendered = useMemo(() => {
    let html = content;
    
    // Code blocks (```...```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="code-block" data-lang="${lang || 'text'}"><code>${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code (`...`)
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2 text-primary">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-3">$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Lists
    html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank">$1</a>');
    
    // Line breaks (preserve paragraph structure)
    html = html.replace(/\n\n/g, '</p><p class="my-2">');
    html = html.replace(/\n/g, '<br/>');
    
    // Wrap in paragraph
    html = `<p class="my-2">${html}</p>`;
    
    // Math (simple LaTeX-like)
    html = html.replace(/\$\$([^$]+)\$\$/g, '<div class="math-block text-center my-2 font-mono text-sm bg-muted/50 p-2 rounded">$1</div>');
    html = html.replace(/\$([^$]+)\$/g, '<span class="math-inline font-mono text-sm">$1</span>');
    
    return html;
  }, [content]);

  return (
    <div 
      className="markdown-content prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Code Block with Copy Button
function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-3 rounded-lg overflow-hidden bg-[#1e1e1e] border border-border/50">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Code className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{language}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-3 text-xs overflow-x-auto">
        <code className="text-gray-300">{code}</code>
      </pre>
    </div>
  );
}

// Quiz Component
function QuizCard({ quiz, onAnswer }: { quiz: QuizQuestion; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
    onAnswer(index === quiz.correctIndex);
  };

  return (
    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-start gap-2 mb-3">
        <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="font-medium text-sm">{quiz.question}</p>
      </div>
      <div className="space-y-2">
        {quiz.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={revealed}
            className={cn(
              "w-full p-2.5 text-left rounded-lg border transition-all text-sm",
              selected === index
                ? index === quiz.correctIndex
                  ? "bg-green-500/20 border-green-500"
                  : "bg-red-500/20 border-red-500"
                : revealed && index === quiz.correctIndex
                  ? "bg-green-500/10 border-green-500/50"
                  : "hover:bg-muted border-border"
            )}
          >
            <div className="flex items-center justify-between">
              <span>{option}</span>
              {revealed && index === quiz.correctIndex && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {revealed && selected === index && index !== quiz.correctIndex && (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </button>
        ))}
      </div>
      {revealed && (
        <div className="mt-3 p-3 bg-muted rounded-lg text-xs">
          <p className="text-muted-foreground">{quiz.explanation}</p>
        </div>
      )}
    </div>
  );
}

// Message Component
function ChatMessage({ message, onLoadCircuit }: { message: Message; onLoadCircuit: (code: string) => void }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-3 group",
      isUser && "flex-row-reverse"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-pink-500"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>
      <div className={cn(
        "flex-1 rounded-xl p-4 max-w-[85%]",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-card border shadow-sm"
      )}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <>
            <MarkdownContent content={message.content} />
            
            {/* Circuit Code */}
            {message.circuitCode && (
              <div className="mt-3">
                <CodeBlock code={message.circuitCode} />
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="mt-2 gap-1"
                  onClick={() => onLoadCircuit(message.circuitCode!)}
                >
                  <Sparkles className="h-3 w-3" />
                  Load Circuit
                </Button>
              </div>
            )}
            
            {/* Quiz */}
            {message.quiz && (
              <QuizCard quiz={message.quiz} onAnswer={(correct) => {
                console.log('Quiz answered:', correct);
              }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function ChatInterface() {
  const {
    messages,
    isAiLoading,
    addMessage,
    setAiLoading,
    loadCircuitFromCode,
    apiKey,
    aiProvider,
    aiModel,
  } = useQuantumStore();

  const [input, setInput] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    addMessage({
      role: 'user',
      content: userMessage,
    });

    setAiLoading(true);

    try {
      const response = await processAIRequest(userMessage, {
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        skillLevel,
        provider: apiKey ? aiProvider : 'gemini',
        model: aiModel,
        apiKey: apiKey || undefined,
      });

      addMessage({
        role: 'assistant',
        content: response.content,
        circuitCode: response.circuitCode,
        quiz: response.quiz,
      });

      // Auto-load circuit if provided
      if (response.circuitCode) {
        loadCircuitFromCode(response.circuitCode);
      }
    } catch (error) {
      addMessage({
        role: 'assistant',
        content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    // Keep only the system message
    useQuantumStore.setState({
      messages: [{
        id: Math.random().toString(36).substring(2, 9),
        role: 'system',
        content: 'Chat cleared. Ask me anything about quantum computing!',
        timestamp: new Date(),
      }],
    });
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="relative">
              <MessageSquare className="h-5 w-5 text-primary" />
              <Sparkles className="h-2.5 w-2.5 text-yellow-500 absolute -top-0.5 -right-0.5" />
            </div>
            AI Assistant
            {!apiKey && (
              <span className="text-xs font-normal text-yellow-500 ml-2">
                (Offline Mode)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
              className="text-xs bg-muted px-2 py-1 rounded border-none focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="beginner">🌱 Beginner</option>
              <option value="intermediate">📚 Intermediate</option>
              <option value="advanced">🎓 Advanced</option>
            </select>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleClearChat}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onLoadCircuit={loadCircuitFromCode}
            />
          ))}
          
          {isAiLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-card border shadow-sm rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Example Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">✨ Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map(({ text, icon }) => (
                <Button
                  key={text}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 hover:bg-primary/10 hover:border-primary/50 transition-all"
                  onClick={() => handleExampleClick(text)}
                >
                  <span className="mr-1">{icon}</span>
                  {text}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about quantum computing..."
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isAiLoading}
              className="bg-background"
            />
            <Button 
              onClick={handleSend} 
              disabled={isAiLoading || !input.trim()}
              className="gap-2 px-4"
            >
              {isAiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!apiKey && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 Add your API key in Settings for AI-powered responses
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
