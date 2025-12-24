"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuantumStore } from '@/lib/store';
import { getCodeAssistance } from '@/lib/ai/agent-core';
import { cn } from '@/lib/utils';
import { 
  Play, Copy, Download, RotateCcw, Sparkles, Loader2, Send,
  ChevronRight, Bot, User, Code,
} from 'lucide-react';

const DEFAULT_CODE = `import { QuantumSimulator } from '@/lib/quantum';

// Create a 2-qubit quantum simulator
const sim = new QuantumSimulator(2);

// Apply Hadamard to create superposition
sim.apply('H', 0);

// Apply CNOT to create entanglement
sim.apply('CNOT', 0, 1);

// Result: Bell state (|00⟩ + |11⟩)/√2
`;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
}

function AISidebar({
  isOpen,
  onClose,
  currentCode,
  onApplyCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentCode: string;
  onApplyCode: (code: string) => void;
}) {
  const { apiKey, aiProvider, aiModel } = useQuantumStore();
  const [mode, setMode] = useState<'ask' | 'agent'>('ask');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getCodeAssistance(input, currentCode, {
        provider: apiKey ? aiProvider : undefined,
        model: apiKey ? aiModel : undefined,
        apiKey: apiKey || undefined,
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: mode === 'ask' ? response : 'Code applied!',
        code: response,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (mode === 'agent') {
        onApplyCode(response);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-2 border-b">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => setMode('ask')}
            className={cn(
              "flex-1 text-xs py-1.5 px-3 rounded-md transition-all",
              mode === 'ask' ? "bg-background shadow" : "text-muted-foreground"
            )}
          >
            💬 Ask
          </button>
          <button
            onClick={() => setMode('agent')}
            className={cn(
              "flex-1 text-xs py-1.5 px-3 rounded-md transition-all",
              mode === 'agent' ? "bg-background shadow" : "text-muted-foreground"
            )}
          >
            🤖 Agent
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Ask me to help with your quantum code!
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn(
            "flex gap-2",
            msg.role === 'user' && "justify-end"
          )}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div className={cn(
              "rounded-lg p-2 text-sm max-w-[85%]",
              msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.code && mode === 'ask' && (
                <div className="mt-2">
                  <pre className="text-xs bg-black/20 rounded p-2 overflow-x-auto max-h-48">
                    {msg.code}
                  </pre>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-6 text-xs mt-2"
                    onClick={() => onApplyCode(msg.code!)}
                  >
                    Apply Code
                  </Button>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'ask' ? "Ask a question..." : "Describe what to code..."}
            className="flex-1 h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
          />
          <Button 
            size="sm" 
            className="h-8"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        {!apiKey && (
          <p className="text-xs text-yellow-500 mt-2">
            ⚠️ Add API key in Settings for AI
          </p>
        )}
      </div>
    </div>
  );
}

export function CodeEditor() {
  const { loadCircuitFromCode } = useQuantumStore();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string>('');
  const [showAiSidebar, setShowAiSidebar] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = useCallback((editorInstance) => {
    editorRef.current = editorInstance;
  }, []);

  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    try {
      loadCircuitFromCode(code);
      setOutput('✓ Circuit loaded successfully!');
      setTimeout(() => setOutput(''), 3000);
    } catch (error) {
      setOutput(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }, [code, loadCircuitFromCode]);

  const handleApplyCode = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setOutput('✓ Copied to clipboard');
    setTimeout(() => setOutput(''), 2000);
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quantum-circuit.ts';
    a.click();
    URL.revokeObjectURL(url);
    setOutput('✓ Downloaded');
    setTimeout(() => setOutput(''), 2000);
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setOutput('');
  }, []);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5" />
            Code Editor
            <span className="text-xs font-normal text-muted-foreground ml-2">
              Write quantum circuits in any language
            </span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant={showAiSidebar ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setShowAiSidebar(!showAiSidebar)}
              className="gap-1"
            >
              <Sparkles className="h-4 w-4" />
              AI
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} title="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleRunCode} disabled={isRunning} className="gap-1 ml-2">
              <Play className="h-4 w-4" />
              Run
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex min-h-0 p-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 border-b">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                folding: true,
                renderLineHighlight: 'all',
              }}
            />
          </div>
          
          {output && (
            <div className={cn(
              "p-2 text-xs font-mono",
              output.startsWith('✓') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            )}>
              {output}
            </div>
          )}
        </div>

        <AISidebar
          isOpen={showAiSidebar}
          onClose={() => setShowAiSidebar(false)}
          currentCode={code}
          onApplyCode={handleApplyCode}
        />
      </CardContent>
    </Card>
  );
}
