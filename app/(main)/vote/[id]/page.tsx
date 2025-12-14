'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { useDeviceFingerprint } from '@/lib/device-fingerprint';
import { trackUserBehavior } from '@/lib/behavioral-analysis';
import { formatDateBG, formatTimeBG, isElectionActive, hasElectionEnded } from '@/lib/utils';

interface Question {
  id: string;
  question_text_bg: string;
  question_type: 'single-choice' | 'multiple-choice';
  options: Option[];
}

interface Option {
  id: string;
  option_text_bg: string;
}

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;
  
  const [election, setElection] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { fingerprint, loading: fingerprintLoading } = useDeviceFingerprint();
  const [behaviorTracker, setBehaviorTracker] = useState<ReturnType<typeof trackUserBehavior> | null>(null);

  const sharePoll = async () => {
    const link = `${window.location.origin}/vote/${electionId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: election?.title_bg || 'Анкета',
          text: election?.description_bg || '',
          url: link,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await copyLink();
    }
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/vote/${electionId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Грешка при копиране на линк');
    }
  };

  useEffect(() => {
    // Start tracking behavior
    const tracker = trackUserBehavior();
    setBehaviorTracker(tracker);

    // Fetch election data
    fetchElectionData();

    return () => {
      tracker?.cleanup();
    };
  }, [electionId]);

  const fetchElectionData = async () => {
    try {
      const response = await fetch(`/api/elections/${electionId}`);
      if (!response.ok) {
        throw new Error('Грешка при зареждане на изборите');
      }
      const data = await response.json();
      setElection(data.election);
      setQuestions(data.questions);
      
      // Initialize selected options
      const initial: Record<string, string[]> = {};
      data.questions.forEach((q: Question) => {
        initial[q.id] = [];
      });
      setSelectedOptions(initial);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (questionId: string, optionId: string, questionType: string) => {
    setSelectedOptions(prev => {
      const current = prev[questionId] || [];
      
      if (questionType === 'single-choice') {
        return { ...prev, [questionId]: [optionId] };
      } else {
        // Multiple choice
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...current, optionId] };
        }
      }
    });
    
    // Track vote change
    behaviorTracker?.trackVoteChange();
  };

  // Calculate progress
  const answeredQuestions = questions.filter(
    q => (selectedOptions[q.id] || []).length > 0
  ).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const allAnswered = answeredQuestions === totalQuestions && totalQuestions > 0;

  const handleSubmit = async () => {
    // Validation
    for (const question of questions) {
      const selected = selectedOptions[question.id] || [];
      if (selected.length === 0) {
        setError(`Моля, отговорете на всички въпроси. Въпрос "${question.question_text_bg}" не е отговорен.`);
        // Scroll to first unanswered question
        const questionElement = document.getElementById(`question-${question.id}`);
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      if (question.question_type === 'single-choice' && selected.length > 1) {
        setError('Моля, изберете само една опция');
        return;
      }
    }

    if (!fingerprint) {
      setError('Очакване на идентификация на устройство...');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Get behavior data
      const behavior = behaviorTracker?.getBehavior();

      // Get Telegram auth
      const telegramAuthStr = localStorage.getItem('telegram_auth');
      if (!telegramAuthStr) {
        router.push('/login');
        return;
      }
      const telegramAuth = JSON.parse(telegramAuthStr);

      // Submit votes
      for (const question of questions) {
        const response = await fetch('/api/votes/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramAuth,
            electionId,
            questionId: question.id,
            selectedOptions: selectedOptions[question.id],
            deviceFingerprint: fingerprint,
            userBehavior: behavior,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Грешка при подаване на глас');
        }
      }

      // Success - redirect to results
      router.push(`/results/${electionId}?voted=true`);
    } catch (err: any) {
      console.error('Vote submission error:', err);
      setError(err.message || 'Грешка при подаване на глас');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fingerprintLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Зареждане...</p>
        </div>
      </div>
    );
  }

  if (error && !election) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => router.push('/elections')} className="mt-4">
              Назад към изборите
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!election) {
    return null;
  }

  // Check election status
  const startDate = new Date(election.start_date);
  const endDate = new Date(election.end_date);
  const active = isElectionActive(startDate, endDate);
  const ended = hasElectionEnded(endDate);

  if (!active && !ended) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">Гласуването още не е започнало</p>
            <p className="text-sm text-gray-500 mb-4">
              Начало: {formatDateBG(startDate)} {formatTimeBG(startDate)}
            </p>
            <Button onClick={() => router.push('/elections')}>
              Назад към изборите
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">Гласуването е приключило</p>
            <Button onClick={() => router.push(`/results/${electionId}`)}>
              Виж резултатите
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <GlassCard variant="gradient" className="mb-6 shine">
          <GlassCardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <GlassCardTitle className="text-3xl text-white">
                  {election.title_bg || election.title}
                </GlassCardTitle>
                <GlassCardDescription className="text-white/80">
                  {election.description_bg || election.description}
                </GlassCardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={sharePoll}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  📤 Сподели
                </Button>
                <Button
                  onClick={copyLink}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {copied ? '✓ Копирано' : '📋 Копирай'}
                </Button>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <span>📅 Начало:</span>
                  <span className="font-medium">{formatDateBG(startDate)} {formatTimeBG(startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏁 Край:</span>
                  <span className="font-medium">{formatDateBG(endDate)} {formatTimeBG(endDate)}</span>
                </div>
              </div>
              <StatusBadge startDate={startDate} endDate={endDate} />
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Progress Indicator */}
        {questions.length > 1 && (
        <GlassCard className="mb-6">
          <GlassCardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">
                  Прогрес: {answeredQuestions} от {totalQuestions} въпроса
                </span>
                <Badge variant="info" className="text-lg px-3 py-1">
                  {Math.round(progress)}%
                </Badge>
              </div>
              <div className="w-full bg-background/50 rounded-full h-3 overflow-hidden">
                <div
                  className="gradient-primary h-3 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
            {error}
          </div>
        )}

        {!showSummary ? (
        <div className="space-y-6">
          {questions.map((question, index) => {
            const isAnswered = (selectedOptions[question.id] || []).length > 0;
            return (
              <GlassCard 
                key={question.id} 
                id={`question-${question.id}`}
                hover
                className={!isAnswered ? 'border-2 border-yellow-500/50' : ''}
              >
                <GlassCardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <GlassCardTitle className="text-xl mb-2">
                        {questions.length > 1 && (
                          <Badge variant="info" className="mr-2">
                            Въпрос {index + 1}
                          </Badge>
                        )}
                        {question.question_text_bg}
                      </GlassCardTitle>
                      <GlassCardDescription className="mt-2">
                        {question.question_type === 'single-choice' 
                          ? 'Изберете една опция' 
                          : 'Можете да изберете няколко опции'}
                      </GlassCardDescription>
                    </div>
                    {isAnswered && (
                      <Badge variant="success">
                        ✓ Отговорено
                      </Badge>
                    )}
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-3">
                    {question.options.map((option) => {
                      const isSelected = (selectedOptions[question.id] || []).includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionToggle(question.id, option.id, question.question_type)}
                          className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 min-h-[64px] ${
                            isSelected
                              ? 'border-primary bg-primary/20 shadow-xl scale-[1.02]'
                              : 'border-border/50 bg-background/30 hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.01]'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all flex-shrink-0 ${
                              isSelected
                                ? 'border-primary bg-primary text-white shadow-lg'
                                : 'border-muted-foreground/50'
                            }`}>
                              {isSelected && '✓'}
                            </div>
                            <span className={`flex-1 text-lg font-semibold ${isSelected ? 'text-primary' : ''}`}>
                              {option.option_text_bg}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
        ) : (
        <GlassCard className="mb-6">
          <GlassCardHeader>
            <GlassCardTitle className="text-2xl">Преглед на вашите отговори</GlassCardTitle>
            <GlassCardDescription>
              Моля, прегледайте отговорите си преди подаване
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const selected = selectedOptions[question.id] || [];
                const selectedTexts = question.options
                  .filter(opt => selected.includes(opt.id))
                  .map(opt => opt.option_text_bg);
                
                return (
                  <div key={question.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900 mb-2">
                      {index + 1}. {question.question_text_bg}
                    </div>
                    <div className="text-gray-700">
                      {selectedTexts.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {selectedTexts.map((text, i) => (
                            <li key={i}>{text}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-red-600">Не е отговорено</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCardContent>
        </GlassCard>
        )}

        <div className="mt-8 space-y-4">
        {!showSummary ? (
          <>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setShowSummary(true)}
                disabled={!allAnswered || submitting}
                size="lg"
                variant="outline"
                className="flex-1 glass"
              >
                👁️ Преглед на отговорите
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                size="lg"
                className="flex-1 gradient-primary text-white shadow-lg hover:shadow-xl"
              >
                {submitting ? 'Обработване...' : allAnswered ? '✅ Подай глас' : `Отговорете на всички (${totalQuestions - answeredQuestions} остават)`}
              </Button>
            </div>
            <Button
              onClick={() => router.push('/elections')}
              variant="ghost"
              className="w-full"
            >
              ← Назад към изборите
            </Button>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setShowSummary(false)}
              variant="outline"
              size="lg"
              className="flex-1 glass"
            >
              ✏️ Редактирай отговори
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="flex-1 gradient-primary text-white shadow-lg hover:shadow-xl"
            >
              {submitting ? 'Обработване...' : '✅ Потвърди и подай глас'}
            </Button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
