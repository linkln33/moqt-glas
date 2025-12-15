'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Lock, Play, Loader2 } from 'lucide-react';

interface VideoData {
  hasAccess: boolean;
  youtubeVideoId?: string;
  video: {
    id: string;
    title: string;
    title_bg?: string;
    description?: string;
    description_bg?: string;
    thumbnail_url?: string;
    duration?: number;
    views_count?: number;
    creator?: {
      telegram_id: number;
      display_name: string;
      username?: string;
    };
  };
  requiredTier?: {
    id: string;
    name: string;
    name_bg?: string;
    price: number;
    currency: string;
    tier_level: number;
  };
  currentTier?: {
    name: string;
    name_bg?: string;
    tier_level: number;
  } | null;
}

interface VideoPlayerProps {
  videoId: string;
  creatorId: string;
  subscriberId?: string;
}

export function VideoPlayer({ videoId, creatorId, subscriberId }: VideoPlayerProps) {
  const [data, setData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const url = `/api/videos/${videoId}${subscriberId ? `?subscriberId=${subscriberId}` : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Грешка при зареждане на видеото');
        }
        
        const videoData = await response.json();
        setData(videoData);
      } catch (err: any) {
        setError(err.message || 'Грешка при зареждане на видеото');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, subscriberId]);

  const handleSubscribe = () => {
    router.push(`/creators/${creatorId}/subscribe`);
  };

  if (loading) {
    return (
      <GlassCard>
        <GlassCardContent className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Зареждане на видеото...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (error || !data) {
    return (
      <GlassCard>
        <GlassCardContent className="py-16 text-center">
          <p className="text-destructive">{error || 'Видеото не е намерено'}</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  // ❌ NO ACCESS - Show locked content
  if (!data.hasAccess) {
    return (
      <div className="space-y-4">
        <GlassCard>
          <div className="relative">
            {/* Thumbnail preview */}
            {data.video.thumbnail_url ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <img
                  src={data.video.thumbnail_url}
                  alt={data.video.title_bg || data.video.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <Lock className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">
                      Това съдържание е заключено
                    </h2>
                    <p className="text-lg mb-4">
                      Абонирайте се за ниво <strong>{data.requiredTier?.name_bg || data.requiredTier?.name}</strong>
                      {data.requiredTier && (
                        <span> ({data.requiredTier.price} {data.requiredTier.currency}/месец)</span>
                      )} за да гледате това видео
                    </p>
                    {!subscriberId && (
                      <p className="text-sm text-white/80 mb-4">
                        Влезте в профила си, за да се абонирате
                      </p>
                    )}
                    <Button
                      onClick={handleSubscribe}
                      className="gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow"
                      size="lg"
                    >
                      Абонирай се сега
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="text-center p-8">
                  <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-2">
                    Това съдържание е заключено
                  </h2>
                  <Button
                    onClick={handleSubscribe}
                    className="gradient-primary text-white"
                    size="lg"
                  >
                    Абонирай се сега
                  </Button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Video info */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-2xl">
              {data.video.title_bg || data.video.title}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {data.video.description_bg || data.video.description ? (
              <p className="text-muted-foreground mb-4">
                {data.video.description_bg || data.video.description}
              </p>
            ) : null}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {data.video.views_count !== undefined && (
                <span>👁️ {data.video.views_count} гледания</span>
              )}
              {data.video.duration && (
                <span>⏱️ {formatDuration(data.video.duration)}</span>
              )}
            </div>

            {data.currentTier && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  Вашето текущо ниво: <strong>{data.currentTier.name_bg || data.currentTier.name}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Необходимо ниво: <strong>{data.requiredTier?.name_bg || data.requiredTier?.name}</strong>
                </p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // ✅ HAS ACCESS - Show YouTube embed
  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${data.youtubeVideoId}?autoplay=1`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      </GlassCard>

      {/* Video info */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-2xl">
            {data.video.title_bg || data.video.title}
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {data.video.description_bg || data.video.description ? (
            <p className="text-muted-foreground mb-4">
              {data.video.description_bg || data.video.description}
            </p>
          ) : null}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {data.video.views_count !== undefined && (
              <span>👁️ {data.video.views_count} гледания</span>
            )}
            {data.video.duration && (
              <span>⏱️ {formatDuration(data.video.duration)}</span>
            )}
            {data.video.creator && (
              <span>👤 {data.video.creator.display_name}</span>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
