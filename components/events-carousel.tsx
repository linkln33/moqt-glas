'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardFooter, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateBG } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  title_bg: string;
  description: string;
  description_bg: string;
  start_date: string;
  end_date: string;
  questions?: Array<{
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
  isExample?: boolean;
}

interface EventsCarouselProps {
  events: Event[];
  title: string;
  badgeVariant?: 'success' | 'info' | 'secondary';
  badgeText: string;
}

export function EventsCarousel({ events, title, badgeVariant = 'success', badgeText }: EventsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [events]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  if (events.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl sm:text-3xl font-semibold">{title}</h3>
        <div className="flex items-center gap-3">
          <Badge variant={badgeVariant} className="text-sm">{badgeText}</Badge>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-sm">
              Виж всички →
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors hidden md:flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors hidden md:flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Carousel container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[45vw] lg:w-[35vw] xl:w-[28vw] snap-start"
            >
              <Link href={`/dashboard`}>
                <GlassCard hover className="flex flex-col cursor-pointer group h-full transition-all hover:scale-[1.02] min-h-[400px] sm:min-h-[450px]">
                  <GlassCardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <GlassCardTitle className="text-xl sm:text-2xl md:text-3xl group-hover:text-primary transition-colors line-clamp-3 flex-1">
                        {event.title_bg || event.title}
                      </GlassCardTitle>
                      <Badge variant={badgeVariant} className="shrink-0 text-xs sm:text-sm">
                        {badgeText}
                      </Badge>
                    </div>
                    <GlassCardDescription className="text-sm sm:text-base line-clamp-3">
                      {event.description_bg || event.description}
                    </GlassCardDescription>
                  </GlassCardHeader>
                  <GlassCardContent className="flex-grow space-y-4">
                    <div className="flex flex-col gap-3 text-sm sm:text-base text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <span>{event.questions?.length || 0} {event.questions?.length === 1 ? 'въпрос' : 'въпроса'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>
                          {badgeVariant === 'info' 
                            ? `Започва: ${formatDateBG(event.start_date)}`
                            : `Приключва: ${formatDateBG(event.end_date)}`
                          }
                        </span>
                      </div>
                    </div>
                  </GlassCardContent>
                  <GlassCardFooter className="pt-4">
                    <Button className="w-full gradient-primary text-white shadow-lg text-base sm:text-lg py-6">
                      {badgeVariant === 'info' ? 'Виж детайли →' : 'Гласувай →'}
                    </Button>
                  </GlassCardFooter>
                </GlassCard>
              </Link>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
