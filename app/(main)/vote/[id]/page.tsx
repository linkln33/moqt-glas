'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  
  const { fingerprint, loading: fingerprintLoading } = useDeviceFingerprint();
  const [behaviorTracker, setBehaviorTracker] = useState<ReturnType<typeof trackUserBehavior> | null>(null);

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{election.title_bg || election.title}</CardTitle>
          <CardDescription>
            {election.description_bg || election.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Начало: {formatDateBG(startDate)} {formatTimeBG(startDate)}</p>
            <p>Край: {formatDateBG(endDate)} {formatTimeBG(endDate)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {questions.length > 1 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">
                  Прогрес: {answeredQuestions} от {totalQuestions} въпроса
                </span>
                <span className="text-gray-600">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
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
              <Card 
                key={question.id} 
                id={`question-${question.id}`}
                className={!isAnswered ? 'border-2 border-yellow-300' : ''}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">
                        {questions.length > 1 && (
                          <span className="text-primary font-semibold mr-2">
                            Въпрос {index + 1}:
                          </span>
                        )}
                        {question.question_text_bg}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {question.question_type === 'single-choice' 
                          ? 'Изберете една опция' 
                          : 'Можете да изберете няколко опции'}
                      </CardDescription>
                    </div>
                    {isAnswered && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Отговорено
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = (selectedOptions[question.id] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionToggle(question.id, option.id, question.question_type)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="flex-1">{option.option_text_bg}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Преглед на вашите отговори</CardTitle>
            <CardDescription>
              Моля, прегледайте отговорите си преди подаване
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
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
                className="flex-1"
              >
                Преглед на отговорите
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                size="lg"
                className="flex-1"
              >
                {submitting ? 'Обработване...' : allAnswered ? 'Подай глас' : `Отговорете на всички въпроси (${totalQuestions - answeredQuestions} остават)`}
              </Button>
            </div>
            <Button
              onClick={() => router.push('/elections')}
              variant="ghost"
              className="w-full"
            >
              Отказ
            </Button>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => setShowSummary(false)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Редактирай отговори
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="flex-1"
            >
              {submitting ? 'Обработване...' : 'Потвърди и подай глас'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
