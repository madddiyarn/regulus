'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, ChevronDown, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface AIRisk {
  id: number | null;
  primaryName: string;
  secondaryName: string;
  missDistanceKm: number | null;
  riskLevel: string;
  priority: number;
  recommendation: string;
  urgency: 'IMMEDIATE' | 'SOON' | 'MONITOR' | 'LOW';
}

interface RiskAnalysis {
  summary: string;
  overallRisk: string;
  risks: AIRisk[];
  recommendations: string[];
  tleDataQuality: string;
}

const QUICK_PROMPTS = [
  'Объясни как работает SGP4 пропагация',
  'Что такое TLE данные и как их читать?',
  'Как рассчитывается риск столкновения?',
  'Что означает CRITICAL уровень риска?',
  'Рекомендации по манёвру уклонения',
];

export function AIAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [analyzingRisks, setAnalyzingRisks] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, expanded]);

  async function runAnalysis() {
    setAnalyzingRisks(true);
    try {
      const res = await fetch('/api/ai/analyze-risks', { method: 'POST' });
      const data = await res.json();
      setAnalysis(data);
      setActiveTab('analysis');
    } catch {
    } finally {
      setAnalyzingRisks(false);
    }
  }

  function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    sendMessage({ text: msg });
    setInput('');
    inputRef.current?.focus();
  }

  function urgencyColor(u: string) {
    switch (u) {
      case 'IMMEDIATE': return 'destructive';
      case 'SOON': return 'default';
      case 'MONITOR': return 'secondary';
      default: return 'outline';
    }
  }

  function overallRiskColor(r: string) {
    switch (r) {
      case 'CRITICAL': return 'text-red-400';
      case 'HIGH': return 'text-orange-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      {/* Collapsed button */}
      {!expanded && (
        <Button
          onClick={() => setExpanded(true)}
          className="w-full shadow-lg flex items-center gap-2"
          size="lg"
        >
          <Brain className="w-5 h-5" />
          <span>AI Ассистент</span>
          <Sparkles className="w-4 h-4 ml-auto opacity-70" />
        </Button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <Card className="shadow-2xl border-border flex flex-col" style={{ height: '520px' }}>
          <CardHeader className="py-3 px-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">AI Ассистент</CardTitle>
                <Badge variant="secondary" className="text-xs">GPT-4o</Badge>
              </div>
              <div className="flex items-center gap-2">
                {/* Tabs */}
                <div className="flex rounded-md border border-border overflow-hidden text-xs">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-2 py-1 ${activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    Чат
                  </button>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`px-2 py-1 ${activeTab === 'analysis' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    Анализ
                  </button>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpanded(false)}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {messages.length === 0 && (
                  <div className="space-y-2 mt-1">
                    <p className="text-xs text-muted-foreground text-center">Задайте вопрос об орбитах, TLE данных или рисках столкновений</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p}
                          onClick={() => handleSend(p)}
                          className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted transition-colors text-left"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {messages.map((message) => {
                    const text = message.parts
                      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                      .map((p) => p.text)
                      .join('') || '';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {text}
                        </div>
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="px-3 pb-3 pt-2 border-t flex-shrink-0">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Спросите об орбитах..."
                    disabled={isLoading}
                    className="flex-1 text-xs px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  />
                  <Button type="submit" size="sm" disabled={isLoading || !input.trim()} className="h-8 w-8 p-0">
                    <Send className="w-3 h-3" />
                  </Button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'analysis' && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {!analysis ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
                  <Brain className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-center text-muted-foreground">
                    AI проанализирует все риски в базе данных и расставит приоритеты
                  </p>
                  <Button onClick={runAnalysis} disabled={analyzingRisks} className="gap-2">
                    {analyzingRisks
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Анализирую...</>
                      : <><Sparkles className="w-4 h-4" /> Запустить анализ рисков</>
                    }
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-3 py-2">
                  <div className="space-y-3">
                    {/* Overall risk */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Общий уровень риска</span>
                      <span className={`text-sm font-bold ${overallRiskColor(analysis.overallRisk)}`}>
                        {analysis.overallRisk}
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-muted-foreground leading-relaxed">{analysis.summary}</p>

                    {/* TLE quality */}
                    <div className="text-xs bg-muted/50 rounded p-2">
                      <span className="font-medium">Качество TLE: </span>
                      <span className="text-muted-foreground">{analysis.tleDataQuality}</span>
                    </div>

                    {/* Risks */}
                    {analysis.risks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">Риски по приоритету:</p>
                        {analysis.risks.map((r, i) => (
                          <div key={i} className="border border-border rounded p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">#{r.priority} {r.primaryName} ↔ {r.secondaryName}</span>
                              <Badge variant={urgencyColor(r.urgency) as any} className="text-xs py-0">
                                {r.urgency}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{r.recommendation}</p>
                            {r.missDistanceKm && (
                              <p className="text-xs text-muted-foreground">Расстояние: {r.missDistanceKm.toFixed(1)} км</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {analysis.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold">Рекомендации:</p>
                        {analysis.recommendations.map((r, i) => (
                          <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={runAnalysis}
                      disabled={analyzingRisks}
                    >
                      {analyzingRisks ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Обновить анализ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
