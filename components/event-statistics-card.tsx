'use client';

import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { formatDateBG } from '@/lib/utils';

interface OptionStat {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface QuestionStat {
  id: string;
  text: string;
  type: string;
  totalVotes: number;
  options: OptionStat[];
}

interface EventStat {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  totalVotes: number;
  questions: QuestionStat[];
  fundraising?: {
    totalRaised: number;
    goal: number;
    currency: string;
    totalDonations: number;
  };
}

interface EventStatisticsCardProps {
  event: EventStat;
}

const COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-amber-500 to-orange-500',
  'from-red-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-teal-500 to-cyan-500',
  'from-yellow-500 to-amber-500',
];

export function EventStatisticsCard({ event }: EventStatisticsCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'success' | 'info' | 'default' }> = {
      active: { label: 'Активни', variant: 'success' },
      upcoming: { label: 'Предстоящи', variant: 'info' },
      ended: { label: 'Приключили', variant: 'default' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <GlassCard className="overflow-hidden">
      <GlassCardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <GlassCardTitle className="text-xl mb-2">{event.title}</GlassCardTitle>
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {getStatusBadge(event.status)}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>{event.totalVotes} гласа</span>
              </div>
              {event.fundraising && (
                <div className="text-sm text-muted-foreground">
                  💰 {event.fundraising.totalRaised.toFixed(2)} {event.fundraising.currency}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-background/50 transition-colors"
            aria-label={expanded ? 'Свий' : 'Разгъни'}
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </GlassCardHeader>

      {expanded && (
        <GlassCardContent className="space-y-6 pt-0">
          {/* Fundraising Progress */}
          {event.fundraising && event.fundraising.goal > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Събрани средства</span>
                <span className="text-primary font-bold">
                  {event.fundraising.totalRaised.toFixed(2)} / {event.fundraising.goal.toFixed(2)} {event.fundraising.currency}
                </span>
              </div>
              <div className="w-full h-3 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-out rounded-full shadow-lg"
                  style={{
                    width: `${Math.min((event.fundraising.totalRaised / event.fundraising.goal) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {event.fundraising.totalDonations} дарения
              </p>
            </div>
          )}

          {/* Questions Statistics */}
          <div className="space-y-6">
            {event.questions.map((question, qIndex) => (
              <div key={question.id} className="space-y-3">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <span className="text-primary">#{qIndex + 1}</span>
                  {question.text}
                </h4>
                <div className="text-xs text-muted-foreground mb-3">
                  Общо гласове: {question.totalVotes} | Тип: {question.type === 'single-choice' ? 'Един избор' : question.type === 'multiple-choice' ? 'Множествен избор' : 'Ранкиране'}
                </div>

                {/* Options Statistics */}
                {question.type === 'single-choice' && question.options.length === 2 ? (
                  // Simple Yes/No - Single progress bar with 2 colors
                  <div className="space-y-3">
                    {/* Combined progress bar for yes/no */}
                    <div className="w-full h-6 bg-background/50 rounded-full overflow-hidden relative flex">
                      {question.options.map((option, optIndex) => {
                        const colorClass = optIndex === 0 
                          ? 'from-green-500 to-emerald-500' 
                          : 'from-red-500 to-rose-500';
                        const widthPercentage = option.percentage;
                        
                        return (
                          <div
                            key={option.id}
                            className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out flex items-center justify-center relative`}
                            style={{ width: `${widthPercentage}%` }}
                          >
                            {widthPercentage > 10 && (
                              <span className="text-xs font-semibold text-white z-10">
                                {option.text}: {option.votes} ({option.percentage.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Option details below */}
                    <div className="grid grid-cols-2 gap-4">
                      {question.options.map((option, optIndex) => {
                        const colorClass = optIndex === 0 
                          ? 'from-green-500 to-emerald-500' 
                          : 'from-red-500 to-rose-500';
                        
                        return (
                          <div key={option.id} className="flex items-center justify-between p-2 rounded-lg glass-light">
                            <div className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorClass}`} />
                              <span className="font-medium text-sm">{option.text}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{option.votes} гласа</span>
                              <Badge variant="info" className="text-xs">
                                {option.percentage.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Multi-option - Thin colored lines under each option
                  <div className="space-y-3">
                    {(question.type === 'rating' 
                      ? [...question.options].sort((a, b) => {
                          // For rating questions, sort by option text/number to show 1-5 in order
                          const aNum = parseInt(a.text) || 0;
                          const bNum = parseInt(b.text) || 0;
                          return aNum - bNum;
                        })
                      : question.options
                    ).map((option, optIndex) => {
                      const colorClass = COLORS[optIndex % COLORS.length];
                      
                      return (
                        <div key={option.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`} />
                              {option.text}
                              {question.type === 'rating' && (() => {
                                const ratingNum = parseInt(option.text) || 0;
                                if (ratingNum >= 1 && ratingNum <= 5) {
                                  return <span className="text-xs text-muted-foreground ml-1">{'⭐'.repeat(ratingNum)}</span>;
                                }
                                return null;
                              })()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{option.votes} гласа</span>
                              <Badge variant="info" className="text-xs">
                                {option.percentage.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                          {/* Thin colored progress line under each option */}
                          <div className="w-full h-1 bg-background/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out rounded-full`}
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Event Dates */}
          <div className="pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Начало:</span>
                <p className="font-medium">{formatDateBG(event.startDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Край:</span>
                <p className="font-medium">{formatDateBG(event.endDate)}</p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      )}
    </GlassCard>
  );
}
