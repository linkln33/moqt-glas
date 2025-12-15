'use client';

import { useState, useEffect, useRef } from 'react';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateBG, formatTimeBG } from '@/lib/utils';
import { formatRelativeTime, isElectionActive, hasElectionEnded } from '@/lib/utils';
import { Heart, MessageCircle, Share2, Coins, CheckCircle2 } from 'lucide-react';
import { DonationForm } from '@/components/donation-form';
import { useDeviceFingerprint } from '@/lib/device-fingerprint';
import { trackUserBehavior } from '@/lib/behavioral-analysis';

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
  const [likesCount, setLikesCount] = useState(poll.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(poll.commentsCount || 0);
  const [sharesCount, setSharesCount] = useState(poll.sharesCount || 0);
  const [isLiked, setIsLiked] = useState(poll.isLiked || false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [fundraisingCurrent, setFundraisingCurrent] = useState(poll.fundraisingCurrent || 0);
  
  // Voting state
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [submittingVote, setSubmittingVote] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes || 0);
  
  const { fingerprint } = useDeviceFingerprint();
  const [behaviorTracker, setBehaviorTracker] = useState<ReturnType<typeof trackUserBehavior> | null>(null);
  const mountedRef = useRef(true);

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

  // Check if user has voted and load results if needed
  useEffect(() => {
    mountedRef.current = true;
    const checkVoteStatus = async () => {
      try {
        const authData = localStorage.getItem('telegram_auth');
        if (!authData) {
          // If election ended, show results anyway
          if (hasElectionEnded(poll.end_date)) {
            if (mountedRef.current) {
              setShowResults(true);
              loadResults();
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
              loadResults();
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
            loadResults();
          }
        }
      } catch (error) {
        console.error('Error checking vote status:', error);
        // If election ended, show results anyway
        if (hasElectionEnded(poll.end_date) && mountedRef.current) {
          setShowResults(true);
          loadResults();
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

  // Start behavior tracking
  useEffect(() => {
    mountedRef.current = true;
    const tracker = trackUserBehavior();
    setBehaviorTracker(tracker);
    return () => {
      tracker?.cleanup();
      mountedRef.current = false;
    };
  }, []);

  const loadResults = async () => {
    if (!mountedRef.current) return;
    try {
      const response = await fetch(`/api/elections/${poll.id}/results`);
      if (response.ok) {
        const data = await response.json();
        if (mountedRef.current) {
          setResults(data.questions || []);
          const total = data.questions?.reduce((sum: number, q: QuestionResult) => sum + q.totalVotes, 0) || 0;
          setTotalVotes(total);
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

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

  const handleVoteSubmit = async () => {
    if (submittingVote || !mountedRef.current) return;

    const authData = localStorage.getItem('telegram_auth');
    if (!authData) {
      window.location.href = '/login';
      return;
    }

    const parsed = JSON.parse(authData);
    const telegramId = parsed.telegramId || parsed.id;
    if (!telegramId) {
      window.location.href = '/login';
      return;
    }

    // Validate all questions are answered
    for (const question of poll.questions || []) {
      if (!selectedOptions[question.id] || selectedOptions[question.id].length === 0) {
        alert('Моля, отговорете на всички въпроси');
        return;
      }
    }

    if (!mountedRef.current) return;
    setSubmittingVote(true);
    try {
      const behavior = behaviorTracker?.getBehavior();

      // Prepare telegramAuth object with correct structure
      const telegramAuth = {
        id: telegramId,
        telegramId: telegramId,
        hash: parsed.hash || 'redirect-auth',
        first_name: parsed.first_name || '',
        last_name: parsed.last_name,
        username: parsed.username,
        photo_url: parsed.photo_url,
        auth_date: parsed.auth_date,
      };

      // Submit votes for all questions
      for (const question of poll.questions || []) {
        const response = await fetch('/api/votes/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramAuth,
            electionId: poll.id,
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

      // Success - show results
      if (mountedRef.current) {
        setHasVoted(true);
        setShowResults(true);
        await loadResults();
      }
    } catch (err: any) {
      alert(err.message || 'Грешка при подаване на глас');
    } finally {
      if (mountedRef.current) {
        setSubmittingVote(false);
      }
    }
  };

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
        {/* Voting UI - Always visible when active and not voted */}
        {isActive && !hasVoted && !showResults && poll.questions && poll.questions.length > 0 && (
          <div className="mb-6 space-y-6">
            <h3 className="font-semibold text-lg mb-4">Гласувай</h3>
            
            {poll.questions.map((question) => (
              <div key={question.id} className="space-y-3">
                <div className="font-medium text-sm">
                  {question.question_text_bg || question.question_text}
                </div>
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = selectedOptions[question.id]?.includes(option.id) || false;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(question.id, option.id, question.question_type)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 bg-background/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{option.option_text_bg || option.option_text}</span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            
            <Button
              onClick={handleVoteSubmit}
              disabled={submittingVote}
              className="w-full gradient-primary text-white shadow-lg"
            >
              {submittingVote ? 'Изпращане...' : 'Подай глас'}
            </Button>
          </div>
        )}

        {/* Results/Statistics UI - Always visible when voted or ended */}
        {showResults && results.length > 0 && (
          <div className="mb-6 space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
              📊 Резултати
              {hasVoted && <Badge variant="success" className="text-xs">Гласували сте</Badge>}
            </h3>
            
            {results.map((question) => (
              <div key={question.id} className="space-y-3">
                <div className="font-medium text-sm mb-3">
                  {question.question_text_bg}
                </div>
                <div className="space-y-3">
                  {question.options
                    .sort((a, b) => b.votes - a.votes)
                    .map((option, index) => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {index === 0 && question.totalVotes > 0 && (
                              <span className="text-xl">🏆</span>
                            )}
                            <span className="text-sm font-medium">
                              {option.option_text_bg}
                            </span>
                          </div>
                          <Badge variant={index === 0 && question.totalVotes > 0 ? 'success' : 'secondary'}>
                            {option.votes} ({option.percentage.toFixed(1)}%)
                          </Badge>
                        </div>
                        <div className="w-full h-3 bg-background/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                            style={{ width: `${option.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                  Общо гласове: {question.totalVotes}
                </div>
              </div>
            ))}
          </div>
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

        {/* Fundraising Section */}
        {poll.hasFundraising && poll.fundraisingGoal && (
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span className="font-semibold">Събиране на средства</span>
              </div>
              <span className="text-sm font-medium">
                {fundraisingCurrent.toFixed(2)} {poll.fundraisingCurrency || 'BGN'} / {poll.fundraisingGoal.toFixed(2)} {poll.fundraisingCurrency || 'BGN'}
              </span>
            </div>
            <div className="w-full h-2 bg-background/30 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ 
                  width: `${Math.min((fundraisingCurrent / poll.fundraisingGoal) * 100, 100)}%` 
                }}
              />
            </div>
            <Button
              onClick={() => {
                if (mountedRef.current) {
                  setShowDonationForm(true);
                }
              }}
              className="w-full gradient-primary text-white shadow-lg"
              size="sm"
            >
              <Heart className="w-4 h-4 mr-2" />
              Подкрепи
            </Button>
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

        {/* Action Buttons */}
        {!showVoting && !showResults && (
          <div className="flex gap-3">
            {isActive && !hasVoted && (
              <Button
                onClick={() => {
                  if (mountedRef.current) {
                    setShowVoting(true);
                  }
                }}
                className="flex-1 gradient-primary text-white shadow-lg"
              >
                🗳️ Гласувай
              </Button>
            )}
            <Button
              onClick={() => {
                if (mountedRef.current) {
                  setShowResults(true);
                  loadResults();
                }
              }}
              variant={isActive && !hasVoted ? 'outline' : 'default'}
              className={isActive && !hasVoted ? 'flex-1 glass' : 'w-full gradient-primary text-white shadow-lg'}
            >
              📊 Резултати
            </Button>
          </div>
        )}
      </GlassCardContent>

      {/* Donation Form Modal */}
      {showDonationForm && (
        <DonationForm
          electionId={poll.id}
          goal={poll.fundraisingGoal}
          currentAmount={fundraisingCurrent}
          currency={poll.fundraisingCurrency || 'BGN'}
          onClose={() => {
            if (mountedRef.current) {
              setShowDonationForm(false);
            }
          }}
          onSuccess={() => {
            fetch(`/api/elections/${poll.id}/fundraising`)
              .then(res => res.json())
              .then(data => {
                if (data.totalRaised !== undefined && mountedRef.current) {
                  setFundraisingCurrent(data.totalRaised);
                }
              })
              .catch(console.error);
          }}
        />
      )}
    </GlassCard>
  );
}
