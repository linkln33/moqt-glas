'use client';

import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateBG, formatTimeBG } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

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
}

interface FeedItemProps {
  poll: PollWithStats;
}

export function FeedItem({ poll }: FeedItemProps) {
  const mainQuestion = poll.questions?.[0];
  const previewOptions = mainQuestion?.options?.slice(0, 3) || [];
  const hasMoreOptions = (mainQuestion?.options?.length || 0) > 3;
  const questionCount = poll.questions?.length || 0;

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
    </GlassCard>
  );
}
