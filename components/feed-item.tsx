'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateBG, formatTimeBG } from '@/lib/utils';
import { formatRelativeTime, isElectionActive, hasElectionEnded } from '@/lib/utils';
import { Heart, MessageCircle, Share2, Coins, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { useDeviceFingerprint } from '@/lib/device-fingerprint';
import { trackUserBehavior } from '@/lib/behavioral-analysis';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PollWithStats {
  id: string;
  title: string;
  title_bg: string;
  description: string;
  description_bg: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  created_by: string;
  questions: Array<{
    id: string;
    question_text: string;
    question_text_bg: string;
    question_type: string;
    options: Array<{
      id: string;
      option_text: string;
      option_text_bg: string;
    }>;
  }>;
  totalVotes: number;
  isActive: boolean;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  hasFundraising?: boolean;
  fundraisingGoal?: number;
  fundraisingCurrent?: number;
  fundraisingCurrency?: string;
}

interface FeedItemProps {
  poll: PollWithStats;
}

interface QuestionResult {
  id: string;
  question_text_bg: string;
  question_type: string;
  options: Array<{
    id: string;
    option_text_bg: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
}

export function FeedItem({ poll }: FeedItemProps) {
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(poll.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(poll.commentsCount || 0);
  const [sharesCount, setSharesCount] = useState(poll.sharesCount || 0);
  const [isLiked, setIsLiked] = useState(poll.isLiked || false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [fundraisingCurrent, setFundraisingCurrent] = useState(poll.fundraisingCurrent || 0);
  const [donationAmount, setDonationAmount] = useState<number | ''>('');
  const [customDonationAmount, setCustomDonationAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [donationError, setDonationError] = useState('');

  const presetAmounts = [10, 25, 50, 100, 250, 500];
  
  // Voting state
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [submittingVote, setSubmittingVote] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes || 0);
  
  const { fingerprint } = useDeviceFingerprint();
  const [behaviorTracker, setBehaviorTracker] = useState<ReturnType<typeof trackUserBehavior> | null>(null);
  const behaviorTrackerRef = useRef<ReturnType<typeof trackUserBehavior> | null>(null);
  const mountedRef = useRef(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Color palette for options
  const optionColors = [
    { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-600', progress: 'bg-blue-500' },
    { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-600', progress: 'bg-green-500' },
    { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-600', progress: 'bg-purple-500' },
    { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-600', progress: 'bg-orange-500' },
    { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-600', progress: 'bg-pink-500' },
    { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-600', progress: 'bg-cyan-500' },
    { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-600', progress: 'bg-yellow-500' },
    { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-600', progress: 'bg-red-500' },
  ];

  const getOptionColor = (index: number) => {
    return optionColors[index % optionColors.length];
  };

  // Memoize loadResults to avoid stale closures
  const loadResults = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const response = await fetch(`/api/elections/${poll.id}/results`);
      if (response.ok) {
        const data = await response.json();
        if (mountedRef.current) {
          setResults(data.questions || []);
          const total = data.questions?.reduce((sum: number, q: QuestionResult) => sum + q.totalVotes, 0) || 0;
          setTotalVotes(total);
          // Show results if they exist and election has ended
          if (data.questions && data.questions.length > 0 && hasElectionEnded(poll.end_date)) {
            setShowResults(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }, [poll.id, poll.end_date]);

  // Initialize selected options
  useEffect(() => {
    mountedRef.current = true;
    if (poll.questions) {
      const initial: Record<string, string[]> = {};
      poll.questions.forEach((q) => {
        initial[q.id] = [];
      });
      if (mountedRef.current) {
        setSelectedOptions(initial);
      }
    }
    return () => {
      mountedRef.current = false;
    };
  }, [poll.questions]);

  // Load results on mount to show statistics
  useEffect(() => {
    mountedRef.current = true;
    // Always load results to show statistics
    if (poll.isActive || hasElectionEnded(poll.end_date)) {
      loadResults();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [poll.id, poll.isActive, poll.end_date, loadResults]);

  // Check if user has voted
  useEffect(() => {
    mountedRef.current = true;
    const checkVoteStatus = async () => {
      try {
        const authData = localStorage.getItem('telegram_auth');
        if (!authData) {
          // If election ended, show results
          if (hasElectionEnded(poll.end_date)) {
            if (mountedRef.current) {
              setShowResults(true);
            }
          }
          return;
        }

        const parsed = JSON.parse(authData);
        const telegramId = parsed.telegramId || parsed.id;
        if (!telegramId) {
          if (hasElectionEnded(poll.end_date)) {
            if (mountedRef.current) {
              setShowResults(true);
            }
          }
          return;
        }

        // Check if user has voted for this election
        const voteCheck = await fetch(`/api/votes/check?electionId=${poll.id}&telegramId=${telegramId}`);
        if (voteCheck.ok) {
          const voteData = await voteCheck.json();
          if (voteData.hasVoted && mountedRef.current) {
            setHasVoted(true);
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('Error checking vote status:', error);
        // If election ended, show results anyway
        if (hasElectionEnded(poll.end_date) && mountedRef.current) {
          setShowResults(true);
        }
      }
    };

    if (poll.isActive || hasElectionEnded(poll.end_date)) {
      checkVoteStatus();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [poll.id, poll.isActive, poll.end_date]);

  // Get current user ID
  useEffect(() => {
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        const telegramId = parsed.telegramId || parsed.id;
        if (telegramId) {
          setCurrentUserId(telegramId.toString());
        }
      }
    } catch (e) {
      console.warn('Error loading user ID:', e);
    }
  }, []);

  // Start behavior tracking
  useEffect(() => {
    mountedRef.current = true;
    const tracker = trackUserBehavior();
    setBehaviorTracker(tracker);
    behaviorTrackerRef.current = tracker;
    return () => {
      tracker?.cleanup();
      behaviorTrackerRef.current = null;
      mountedRef.current = false;
    };
  }, []);

  const handleOptionSelect = (questionId: string, optionId: string, questionType: string) => {
    if (!mountedRef.current) return;
    setSelectedOptions((prev) => {
      const current = prev[questionId] || [];
      if (questionType === 'single-choice') {
        return { ...prev, [questionId]: [optionId] };
      } else {
        // Multiple choice
        if (current.includes(optionId)) {
          return { ...prev, [questionId]: current.filter((id) => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...current, optionId] };
        }
      }
    });
  };

  const handleVoteSubmit = useCallback(async () => {
    if (submittingVote || !mountedRef.current) return;

    const authData = localStorage.getItem('telegram_auth');
    if (!authData) {
      window.location.href = '/login';
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(authData);
    } catch (e) {
      console.error('Error parsing auth data:', e);
      window.location.href = '/login';
      return;
    }

    const telegramId = parsed.telegramId || parsed.id;
    if (!telegramId) {
      window.location.href = '/login';
      return;
    }

    // Validate all questions are answered
    if (!poll.questions || poll.questions.length === 0) {
      alert('Няма въпроси за гласуване');
      return;
    }

    for (const question of poll.questions) {
      if (!selectedOptions[question.id] || selectedOptions[question.id].length === 0) {
        alert('Моля, отговорете на всички въпроси');
        return;
      }
    }

    if (!mountedRef.current) return;
    
    // Set submitting state
    setSubmittingVote(true);

    try {
      // Safely get behavior - use ref to avoid stale closures
      let behavior = null;
      try {
        // Use ref to get current tracker value without closure issues
        const currentTracker = behaviorTrackerRef.current;
        if (currentTracker && 
            typeof currentTracker === 'object' && 
            currentTracker !== null &&
            'getBehavior' in currentTracker &&
            typeof currentTracker.getBehavior === 'function') {
          behavior = currentTracker.getBehavior();
        }
      } catch (e) {
        console.warn('Error getting behavior:', e);
        // Continue without behavior data - behavior tracking is optional
        behavior = null;
      }

      // Prepare telegramAuth object with correct structure
      const telegramAuth = {
        id: telegramId,
        telegramId: telegramId,
        hash: parsed.hash || 'redirect-auth',
        first_name: parsed.first_name || '',
        last_name: parsed.last_name || null,
        username: parsed.username || null,
        photo_url: parsed.photo_url || null,
        auth_date: parsed.auth_date || Date.now(),
      };

      // Submit votes for all questions
      let allSuccessful = true;
      for (const question of poll.questions) {
        try {
          const response = await fetch('/api/votes/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramAuth,
              electionId: poll.id,
              questionId: question.id,
              selectedOptions: selectedOptions[question.id] || [],
              deviceFingerprint: fingerprint || null,
              userBehavior: behavior,
            }),
          });

          if (!response.ok) {
            let errorMessage = 'Грешка при подаване на глас';
            try {
              const result = await response.json();
              errorMessage = result.error || errorMessage;
            } catch {
              // If JSON parsing fails, use default message
            }
            console.error('Vote submission failed:', errorMessage, 'Status:', response.status);
            allSuccessful = false;
            throw new Error(errorMessage);
          }
        } catch (err: any) {
          console.error('Error submitting vote for question:', question.id, err);
          allSuccessful = false;
          throw err;
        }
      }

      // Success - show results
      if (allSuccessful && mountedRef.current) {
        setHasVoted(true);
        setShowResults(true);
        // Load results immediately
        try {
          const response = await fetch(`/api/elections/${poll.id}/results`);
          if (response.ok) {
            const data = await response.json();
            if (mountedRef.current) {
              setResults(data.questions || []);
              const total = data.questions?.reduce((sum: number, q: QuestionResult) => sum + q.totalVotes, 0) || 0;
              setTotalVotes(total);
            }
          } else {
            console.error('Failed to load results:', response.status);
          }
        } catch (error) {
          console.error('Error loading results:', error);
        }
      }
    } catch (err: any) {
      console.error('Vote submission error:', err);
      if (mountedRef.current) {
        alert(err.message || 'Грешка при подаване на глас');
      }
    } finally {
      if (mountedRef.current) {
        setSubmittingVote(false);
      }
    }
  }, [submittingVote, poll.questions, poll.id, selectedOptions, fingerprint]);

  const handleLike = async () => {
    if (isLoading || !mountedRef.current) return;
    
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const telegramId = parsed.telegramId || parsed.id;
      const response = await fetch(`/api/elections/${poll.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });

      if (response.ok && mountedRef.current) {
        const data = await response.json();
        setIsLiked(!isLiked);
        setLikesCount(data.likesCount || likesCount + (isLiked ? -1 : 1));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      if (mountedRef.current) {
      setIsLoading(false);
      }
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isLoading || !mountedRef.current) return;
    
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const telegramId = parsed.telegramId || parsed.id;
      const response = await fetch(`/api/elections/${poll.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          commentText: commentText.trim(),
          telegramId,
        }),
      });

      if (response.ok && mountedRef.current) {
        setCommentText('');
        setShowCommentInput(false);
        setCommentsCount(commentsCount + 1);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      if (mountedRef.current) {
      setIsLoading(false);
      }
    }
  };

  const handleShare = async () => {
    if (isLoading || !mountedRef.current) return;
    
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const telegramId = parsed.telegramId || parsed.id;
      const response = await fetch(`/api/elections/${poll.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });

      if (response.ok && mountedRef.current) {
        const data = await response.json();
        setSharesCount(data.sharesCount || sharesCount + 1);
        
        const shareUrl = `${window.location.origin}/results/${poll.id}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl);
          alert('Линкът е копиран в клипборда!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      if (mountedRef.current) {
      setIsLoading(false);
    }
    }
  };

  const handlePresetDonation = (preset: number) => {
    if (!mountedRef.current) return;
    setDonationAmount(preset);
    setCustomDonationAmount('');
  };

  const handleCustomDonation = (value: string) => {
    if (!mountedRef.current) return;
    setCustomDonationAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setDonationAmount(numValue);
    } else {
      setDonationAmount('');
    }
  };

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingDonation || !mountedRef.current) return;

    const finalAmount = donationAmount;
    if (!finalAmount || finalAmount <= 0) {
      setDonationError('Моля, въведете сума за дарение');
      return;
    }

    setSubmittingDonation(true);
    setDonationError('');

    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const telegramId = parsed.telegramId || parsed.id;
      
      const response = await fetch(`/api/elections/${poll.id}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId,
          amount: finalAmount,
          currency: poll.fundraisingCurrency || 'BGN',
          donorName: isAnonymous ? '' : (donorName || parsed.first_name || 'Анонимен'),
          donorMessage: donorMessage.trim() || null,
          isAnonymous,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Грешка при обработка на дарението');
      }

      // Success - refresh fundraising amount
      if (mountedRef.current) {
        const fundraisingRes = await fetch(`/api/elections/${poll.id}/fundraising`);
        if (fundraisingRes.ok) {
          const fundraisingData = await fundraisingRes.json();
          if (fundraisingData.totalRaised !== undefined) {
            setFundraisingCurrent(fundraisingData.totalRaised);
          }
        }
        
        // Reset form
        setDonationAmount('');
        setCustomDonationAmount('');
        setDonorName('');
        setDonorMessage('');
        setIsAnonymous(false);
        setDonationError('');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setDonationError(err.message || 'Грешка при обработка на дарението');
      }
    } finally {
      if (mountedRef.current) {
        setSubmittingDonation(false);
      }
    }
  };

  const handleDeletePoll = async () => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази анкета? Това действие не може да бъде отменено.')) {
      return;
    }

    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        alert('Необходима е автентификация');
        return;
      }

      const parsed = JSON.parse(authData);
      const telegramId = parsed.telegramId || parsed.id;
      
      const response = await fetch(`/api/elections/${poll.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Грешка при изтриване на анкетата');
      }

      // Refresh the page to show updated list
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      console.error('Error deleting poll:', err);
      alert(err.message || 'Грешка при изтриване на анкетата');
    }
  };

  const isActive = isElectionActive(new Date(poll.start_date), new Date(poll.end_date));
  const isEnded = hasElectionEnded(new Date(poll.end_date));

  return (
    <GlassCard hover className="overflow-hidden">
      <GlassCardHeader>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <GlassCardTitle className="text-xl mb-2">
              {poll.title_bg || poll.title}
            </GlassCardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>📅</span>
              <span>{formatRelativeTime(poll.created_at)}</span>
              {poll.created_by && poll.created_by !== 'example' && (
                <>
                  <span>•</span>
                  <span>от {poll.created_by}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {currentUserId && currentUserId === poll.created_by && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/create?edit=${poll.id}`)}
                    className="h-8 w-8 p-0"
                    title="Редактирай"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeletePoll}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Изтрий"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            {isActive ? (
              <Badge variant="success">Активна</Badge>
            ) : isEnded ? (
              <Badge variant="secondary">Приключила</Badge>
            ) : (
              <Badge variant="info">Предстояща</Badge>
            )}
            {poll.created_by === 'example' && (
              <Badge variant="info" className="text-xs">Пример</Badge>
            )}
          </div>
        </div>
        {poll.description_bg || poll.description ? (
          <GlassCardDescription className="line-clamp-2">
            {poll.description_bg || poll.description}
          </GlassCardDescription>
        ) : null}
      </GlassCardHeader>

      <GlassCardContent>
        {/* Voting UI - Directly integrated into card flow with color coding and statistics */}
        {isActive && !hasVoted && poll.questions && poll.questions.length > 0 && (
          <>
            {poll.questions.map((question) => {
              // Find results for this question
              const questionResults = results.find(r => r.id === question.id);
              const questionTotalVotes = questionResults?.totalVotes || 0;
              
              return (
                <div key={question.id} className="mb-6 space-y-3">
                  <div className="font-medium text-base mb-3">
                    {question.question_text_bg || question.question_text}
            </div>
            <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const isSelected = selectedOptions[question.id]?.includes(option.id) || false;
                      const color = getOptionColor(optionIndex);
                      // Get vote stats for this option
                      const optionResult = questionResults?.options.find(o => o.id === option.id);
                      const optionVotes = optionResult?.votes || 0;
                      const optionPercentage = optionResult?.percentage || 0;
                      
                      return (
                        <div key={option.id} className="space-y-1">
                          <button
                            onClick={() => handleOptionSelect(question.id, option.id, question.question_type)}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? `${color.border} ${color.bg}`
                                : `border-border hover:${color.border}/50 bg-background/50`
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <div className={`w-3 h-3 rounded-full ${color.progress}`}></div>
                                <span className={`text-sm font-medium ${isSelected ? color.text : ''}`}>
                    {option.option_text_bg || option.option_text}
                  </span>
                </div>
                              <div className="flex items-center gap-2">
                                {questionTotalVotes > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {optionVotes} ({optionPercentage.toFixed(1)}%)
                                  </span>
                                )}
                                {isSelected && <CheckCircle2 className={`w-5 h-5 ${color.text}`} />}
                              </div>
                            </div>
                          </button>
                          {/* Progress bar showing statistics */}
                          {questionTotalVotes > 0 && (
                            <div className="w-full h-2 bg-background/30 rounded-full overflow-hidden ml-1">
                              <div
                                className={`h-full ${color.progress} transition-all duration-500`}
                                style={{ width: `${optionPercentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {questionTotalVotes > 0 && (
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                      Общо гласове: {questionTotalVotes}
                    </div>
                  )}
                </div>
              );
            })}
            
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVoteSubmit();
              }}
              disabled={submittingVote}
              className="w-full gradient-primary text-white shadow-lg mb-6"
              type="button"
            >
              {submittingVote ? 'Изпращане...' : 'Подай глас'}
            </Button>
          </>
        )}

        {/* Results/Statistics UI - Directly integrated into card flow with color coding */}
        {(showResults || (results.length > 0 && (hasVoted || isEnded))) && results.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-semibold text-base">📊 Резултати</span>
              {hasVoted && <Badge variant="success" className="text-xs">Гласували сте</Badge>}
            </div>
            
            {results.map((question) => {
              // Find original question to get option order
              const originalQuestion = poll.questions?.find(q => q.id === question.id);
              
              return (
                <div key={question.id} className="mb-6 space-y-3">
                  <div className="font-medium text-sm mb-3">
                    {question.question_text_bg}
              </div>
                  <div className="space-y-3">
                    {question.options
                      .sort((a, b) => b.votes - a.votes)
                      .map((option, index) => {
                        // Find original option index for color coding
                        const originalIndex = originalQuestion?.options.findIndex(o => o.id === option.id) ?? index;
                        const color = getOptionColor(originalIndex);
                        
                        return (
                          <div key={option.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {index === 0 && question.totalVotes > 0 && (
                                  <span className="text-xl">🏆</span>
                                )}
                                <div className={`w-3 h-3 rounded-full ${color.progress}`}></div>
                                <span className={`text-sm font-medium ${color.text}`}>
                                  {option.option_text_bg}
                                </span>
                              </div>
                              <Badge variant={index === 0 && question.totalVotes > 0 ? 'success' : 'secondary'}>
                                {option.votes} ({option.percentage.toFixed(1)}%)
                              </Badge>
                            </div>
                            <div className="w-full h-3 bg-background/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${color.progress} transition-all duration-500`}
                                style={{ width: `${option.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                    Общо гласове: {question.totalVotes}
                  </div>
          </div>
              );
            })}
          </>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>👥</span>
              <span className="font-medium">{totalVotes} гласа</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📊</span>
              <span>{poll.questions?.length || 0} {poll.questions?.length === 1 ? 'въпрос' : 'въпроса'}</span>
            </div>
          </div>
          <div className="text-xs">
            Край: {formatDateBG(poll.end_date)} {formatTimeBG(poll.end_date)}
          </div>
        </div>

        {/* Fundraising Section - Integrated directly in card */}
        {poll.hasFundraising && poll.fundraisingGoal && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="font-semibold">Събиране на средства</span>
              </div>
              <span className="text-sm font-medium">
                {fundraisingCurrent.toFixed(2)} {poll.fundraisingCurrency || 'BGN'} / {poll.fundraisingGoal.toFixed(2)} {poll.fundraisingCurrency || 'BGN'}
              </span>
            </div>
            <div className="w-full h-2 bg-background/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ 
                  width: `${Math.min((fundraisingCurrent / poll.fundraisingGoal) * 100, 100)}%` 
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {((fundraisingCurrent / poll.fundraisingGoal) * 100).toFixed(1)}% от целта
            </div>

            {/* Donation Form - Directly integrated */}
            <form onSubmit={handleDonationSubmit} className="space-y-4 pt-4 border-t border-border/30">
              {/* Preset Amounts */}
              <div>
                <Label className="mb-2 block text-sm">Изберете сума</Label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {presetAmounts.map((preset) => (
            <Button
                      key={preset}
                      type="button"
                      variant={donationAmount === preset ? 'default' : 'outline'}
                      className={donationAmount === preset ? 'gradient-primary text-white' : ''}
                      onClick={() => handlePresetDonation(preset)}
              size="sm"
            >
                      {preset} {poll.fundraisingCurrency || 'BGN'}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Или въведете друга сума"
                  value={customDonationAmount}
                  onChange={(e) => handleCustomDonation(e.target.value)}
                  min="1"
                  step="0.01"
                  className="mt-2"
                />
              </div>

              {/* Donor Name */}
              {!isAnonymous && (
                <div>
                  <Label htmlFor="donorName" className="text-sm">Вашето име (по избор)</Label>
                  <Input
                    id="donorName"
                    value={donorName}
                    onChange={(e) => {
                      if (mountedRef.current) {
                        setDonorName(e.target.value);
                      }
                    }}
                    placeholder="Как искате да се покажете"
                    className="mt-1"
                  />
                </div>
              )}

              {/* Message */}
              <div>
                <Label htmlFor="donorMessage" className="text-sm">Съобщение (по избор)</Label>
                <Textarea
                  id="donorMessage"
                  value={donorMessage}
                  onChange={(e) => {
                    if (mountedRef.current) {
                      setDonorMessage(e.target.value);
                    }
                  }}
                  placeholder="Напишете съобщение за подкрепа..."
                  rows={3}
                  maxLength={200}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {donorMessage.length}/200
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => {
                    if (mountedRef.current) {
                      setIsAnonymous(e.target.checked);
                    }
                  }}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="isAnonymous" className="text-sm cursor-pointer">
                  Анонимно дарение
                </Label>
              </div>

              {donationError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {donationError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary text-white shadow-lg"
                disabled={!donationAmount || donationAmount <= 0 || submittingDonation}
              >
                {submittingDonation ? 'Обработване...' : `Дари ${donationAmount} ${poll.fundraisingCurrency || 'BGN'}`}
            </Button>

              <p className="text-xs text-muted-foreground text-center">
                * Плащането ще бъде обработено чрез сигурен платежен шлюз
              </p>
            </form>
          </div>
        )}

        {/* Social Actions */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLoading}
            className={`flex-1 ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
          >
            <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likesCount || 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (mountedRef.current) {
                setShowCommentInput(!showCommentInput);
              }
            }}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            <span>{commentsCount || 0}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            disabled={isLoading}
            className="flex-1"
          >
            <Share2 className="w-4 h-4 mr-2" />
            <span>{sharesCount || 0}</span>
          </Button>
        </div>

        {/* Comment Input */}
        {showCommentInput && (
          <div className="mb-4 space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => {
                if (mountedRef.current) {
                  setCommentText(e.target.value);
                }
              }}
              placeholder="Напишете коментар..."
              className="w-full p-3 rounded-lg bg-background/50 border border-border/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (mountedRef.current) {
                  setShowCommentInput(false);
                  setCommentText('');
                  }
                }}
              >
                Отказ
              </Button>
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || isLoading}
                className="gradient-primary text-white"
              >
                Публикувай
              </Button>
            </div>
          </div>
        )}

      </GlassCardContent>
    </GlassCard>
  );
}
