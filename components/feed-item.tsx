'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateBG, formatTimeBG } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';
import { Heart, MessageCircle, Share2, Coins } from 'lucide-react';
import { DonationForm } from '@/components/donation-form';

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

  // Check if user has liked this poll on mount
  useEffect(() => {
    const checkUserLike = async () => {
      try {
        const authData = localStorage.getItem('telegram_auth');
        if (!authData) return;

        const parsed = JSON.parse(authData);
        if (!parsed.telegramId) return;

        const response = await fetch(`/api/elections/${poll.id}/like/check?telegramId=${parsed.telegramId}`);
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.isLiked || false);
        }
      } catch (error) {
        console.error('Error checking user like:', error);
      }
    };

    checkUserLike();
  }, [poll.id]);

  const mainQuestion = poll.questions?.[0];
  const previewOptions = mainQuestion?.options?.slice(0, 3) || [];
  const hasMoreOptions = (mainQuestion?.options?.length || 0) > 3;
  const questionCount = poll.questions?.length || 0;

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const response = await fetch(`/api/elections/${poll.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: parsed.telegramId }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(!isLiked);
        setLikesCount(data.likesCount || likesCount + (isLiked ? -1 : 1));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const response = await fetch(`/api/elections/${poll.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          commentText: commentText.trim(),
          telegramId: parsed.telegramId,
        }),
      });

      if (response.ok) {
        setCommentText('');
        setShowCommentInput(false);
        setCommentsCount(commentsCount + 1);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const authData = localStorage.getItem('telegram_auth');
      if (!authData) {
        window.location.href = '/login';
        return;
      }

      const parsed = JSON.parse(authData);
      const response = await fetch(`/api/elections/${poll.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: parsed.telegramId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSharesCount(data.sharesCount || sharesCount + 1);
        
        // Copy link to clipboard
        const shareUrl = `${window.location.origin}/results/${poll.id}`;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl);
          alert('Линкът е копиран в клипборда!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
            {poll.isActive ? (
              <Badge variant="success">Активна</Badge>
            ) : new Date(poll.end_date) < new Date() ? (
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
        {/* Poll Preview */}
        {mainQuestion && (
          <div className="mb-4 p-4 bg-background/30 rounded-lg border border-border/50">
            <div className="text-sm font-semibold mb-3 text-foreground">
              {mainQuestion.question_text_bg || mainQuestion.question_text}
            </div>
            <div className="space-y-2">
              {previewOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-background/50 hover:bg-background/70 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm text-foreground">
                    {option.option_text_bg || option.option_text}
                  </span>
                </div>
              ))}
              {hasMoreOptions && (
                <div className="text-xs text-muted-foreground pl-4">
                  +{mainQuestion.options.length - 3} още опции
                </div>
              )}
            </div>
            {questionCount > 1 && (
              <div className="mt-3 text-xs text-muted-foreground">
                +{questionCount - 1} допълнителни въпроси
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span>👥</span>
              <span className="font-medium">{poll.totalVotes} гласа</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📊</span>
              <span>{questionCount} {questionCount === 1 ? 'въпрос' : 'въпроса'}</span>
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
              onClick={() => setShowDonationForm(true)}
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
            onClick={() => setShowCommentInput(!showCommentInput)}
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
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишете коментар..."
              className="w-full p-3 rounded-lg bg-background/50 border border-border/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCommentInput(false);
                  setCommentText('');
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
        <div className="flex gap-3">
          {poll.isActive ? (
            <Link href={`/vote/${poll.id}`} className="flex-1">
              <Button className="w-full gradient-primary text-white shadow-lg">
                🗳️ Гласувай
              </Button>
            </Link>
          ) : null}
          <Link href={`/results/${poll.id}`} className={poll.isActive ? 'flex-1' : 'w-full'}>
            <Button 
              variant={poll.isActive ? 'outline' : 'default'} 
              className={poll.isActive ? 'w-full glass' : 'w-full gradient-primary text-white shadow-lg'}
            >
              📊 Резултати
            </Button>
          </Link>
        </div>
      </GlassCardContent>

      {/* Donation Form Modal */}
      {showDonationForm && (
        <DonationForm
          electionId={poll.id}
          goal={poll.fundraisingGoal}
          currentAmount={fundraisingCurrent}
          currency={poll.fundraisingCurrency || 'BGN'}
          onClose={() => setShowDonationForm(false)}
          onSuccess={() => {
            // Refresh fundraising amount after successful donation
            fetch(`/api/elections/${poll.id}/fundraising`)
              .then(res => res.json())
              .then(data => {
                if (data.totalRaised !== undefined) {
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
