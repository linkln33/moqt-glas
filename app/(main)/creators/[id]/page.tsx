import { createServerClient } from '@/lib/supabase/client';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscribeButton } from '@/components/subscribe-button';
import { VideoPlayer } from '@/components/video-player';
import Link from 'next/link';
import Image from 'next/image';

interface CreatorProfile {
  telegram_id: number;
  display_name: string;
  username?: string;
  bio?: string;
  bio_bg?: string;
  avatar_url?: string;
  banner_url?: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  name_bg?: string;
  description?: string;
  description_bg?: string;
  price: number;
  currency: string;
  tier_level: number;
  benefits?: string[];
}

async function getCreatorProfile(creatorId: string) {
  const supabase = createServerClient();
  
  const { data: profile, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('telegram_id', parseInt(creatorId))
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

async function getCreatorTiers(creatorId: string) {
  const supabase = createServerClient();
  
  const { data: tiers, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('creator_telegram_id', parseInt(creatorId))
    .eq('is_active', true)
    .order('tier_level', { ascending: true });

  if (error) {
    return [];
  }

  return tiers || [];
}

async function getCreatorVideos(creatorId: string) {
  const supabase = createServerClient();
  
  const { data: videos, error } = await supabase
    .from('creator_videos')
    .select(`
      id,
      title,
      title_bg,
      description,
      description_bg,
      thumbnail_url,
      duration,
      views_count,
      access_tier_id,
      subscription_tiers (
        name,
        name_bg,
        tier_level
      ),
      created_at
    `)
    .eq('creator_telegram_id', parseInt(creatorId))
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(12);

  if (error) {
    return [];
  }

  return videos || [];
}

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { videoId?: string; subscriberId?: string };
}) {
  const creatorId = params.id;
  const [profile, tiers, videos] = await Promise.all([
    getCreatorProfile(creatorId),
    getCreatorTiers(creatorId),
    getCreatorVideos(creatorId),
  ]);

  if (!profile) {
    return (
      <div className="py-6">
        <GlassCard>
          <GlassCardContent className="py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Създателят не е намерен</h2>
            <Link href="/creators">
              <Button variant="outline">Назад към създателите</Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  // Get user's current subscription (if logged in)
  let currentSubscription = null;
  if (searchParams.subscriberId) {
    const supabase = createServerClient();
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier_id, status')
      .eq('subscriber_telegram_id', parseInt(searchParams.subscriberId))
      .eq('creator_telegram_id', parseInt(creatorId))
      .eq('status', 'active')
      .single();
    currentSubscription = sub;
  }

  return (
    <div className="py-6 space-y-6">
      {/* Creator Header */}
      <GlassCard>
        <div className="relative">
          {profile.banner_url && (
            <div className="h-48 w-full overflow-hidden rounded-t-lg">
              <Image
                src={profile.banner_url}
                alt={profile.display_name}
                width={1200}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-background"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold">
                  {profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile.display_name}</h1>
                {profile.username && (
                  <p className="text-muted-foreground mb-2">@{profile.username}</p>
                )}
                {profile.bio_bg || profile.bio ? (
                  <p className="text-muted-foreground">{profile.bio_bg || profile.bio}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Selected Video */}
      {searchParams.videoId && (
        <VideoPlayer
          videoId={searchParams.videoId}
          creatorId={creatorId}
          subscriberId={searchParams.subscriberId}
        />
      )}

      {/* Subscription Tiers */}
      {tiers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Абонаментни нива</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier) => (
              <GlassCard key={tier.id} hover>
                <GlassCardHeader>
                  <GlassCardTitle>{tier.name_bg || tier.name}</GlassCardTitle>
                  <GlassCardDescription>
                    {tier.description_bg || tier.description}
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="mb-4">
                    <div className="text-3xl font-bold">
                      {tier.price} {tier.currency}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      / {tier.billing_period === 'monthly' ? 'месец' : 'година'}
                    </div>
                  </div>
                  {tier.benefits && Array.isArray(tier.benefits) && tier.benefits.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span>✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <SubscribeButton
                    creatorId={creatorId}
                    tierId={tier.id}
                    tierName={tier.name_bg || tier.name}
                    price={tier.price}
                    currency={tier.currency}
                    subscriberId={searchParams.subscriberId}
                    currentSubscription={currentSubscription ? {
                      tierId: currentSubscription.tier_id,
                      status: currentSubscription.status,
                    } : null}
                  />
                </GlassCardContent>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Video Library */}
      {videos.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Видеа</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video: any) => (
              <Link
                key={video.id}
                href={`/creators/${creatorId}?videoId=${video.id}${searchParams.subscriberId ? `&subscriberId=${searchParams.subscriberId}` : ''}`}
              >
                <GlassCard hover className="cursor-pointer">
                  {video.thumbnail_url && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                      <Image
                        src={video.thumbnail_url}
                        alt={video.title_bg || video.title}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                      />
                      {video.access_tier_id && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="default">
                            {video.subscription_tiers?.name_bg || video.subscription_tiers?.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <GlassCardHeader>
                    <GlassCardTitle className="text-lg line-clamp-2">
                      {video.title_bg || video.title}
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {video.views_count !== undefined && (
                        <span>👁️ {video.views_count}</span>
                      )}
                      {video.duration && (
                        <span>⏱️ {formatDuration(video.duration)}</span>
                      )}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}
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
