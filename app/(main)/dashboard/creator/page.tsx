import { createServerClient } from '@/lib/supabase/client';
import { GlassCard, GlassCardContent, GlassCardDescription, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, Video, Users, DollarSign } from 'lucide-react';

async function getCreatorProfile(telegramId: string) {
  const supabase = createServerClient();
  
  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('telegram_id', parseInt(telegramId))
    .single();

  return profile;
}

async function getCreatorStats(telegramId: string) {
  const supabase = createServerClient();
  
  // Get video count
  const { count: videoCount } = await supabase
    .from('creator_videos')
    .select('*', { count: 'exact', head: true })
    .eq('creator_telegram_id', parseInt(telegramId));

  // Get subscriber count
  const { count: subscriberCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_telegram_id', parseInt(telegramId))
    .eq('status', 'active');

  // Get total revenue (from subscription payments)
  const { data: subscriptionIds } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('creator_telegram_id', parseInt(telegramId))
    .eq('status', 'active');

  const subscriptionIdList = subscriptionIds?.map((s) => s.id) || [];

  let paymentsData: { amount: number }[] = [];

  if (subscriptionIdList.length > 0) {
    const { data: payments } = await supabase
      .from('subscription_payments')
      .select('amount')
      .in('subscription_id', subscriptionIdList)
      .eq('status', 'succeeded');

    paymentsData = payments || [];
  }

  const totalRevenue =
    paymentsData.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  return {
    videoCount: videoCount || 0,
    subscriberCount: subscriberCount || 0,
    totalRevenue,
  };
}

export default async function CreatorDashboardPage({
  searchParams,
}: {
  searchParams: { telegramId?: string };
}) {
  if (!searchParams.telegramId) {
    return (
      <div className="py-6">
        <GlassCard>
          <GlassCardContent className="py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Необходима е автентификация</h2>
            <Link href="/login">
              <Button>Влез в профила си</Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  const [profile, stats] = await Promise.all([
    getCreatorProfile(searchParams.telegramId),
    getCreatorStats(searchParams.telegramId),
  ]);

  if (!profile) {
    return (
      <div className="py-6 space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Стани създател</GlassCardTitle>
            <GlassCardDescription>
              Създай профил като създател и започни да споделяш видеа с абонати
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <Link href={`/dashboard/creator/create?telegramId=${searchParams.telegramId}`}>
              <Button className="gradient-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                Създай профил като създател
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Създателски панел</h1>
          <p className="text-muted-foreground">
            Управлявай видеата и абонаментите си
          </p>
        </div>
        <Link href={`/creators/${profile.telegram_id}`}>
          <Button variant="outline">Виж публичния профил</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <GlassCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Видеа</p>
                <p className="text-2xl font-bold">{stats.videoCount}</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Абонати</p>
                <p className="text-2xl font-bold">{stats.subscriberCount}</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общо приходи</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} BGN</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard hover>
          <GlassCardHeader>
            <GlassCardTitle>Управлявай видеа</GlassCardTitle>
            <GlassCardDescription>
              Добави, редактирай или изтрий видеа
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <Link href={`/dashboard/creator/videos?telegramId=${searchParams.telegramId}`}>
              <Button className="w-full" variant="outline">
                <Video className="w-4 h-4 mr-2" />
                Управлявай видеа
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>

        <GlassCard hover>
          <GlassCardHeader>
            <GlassCardTitle>Управлявай нива</GlassCardTitle>
            <GlassCardDescription>
              Създай и редактирай абонаментни нива
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <Link href={`/dashboard/creator/tiers?telegramId=${searchParams.telegramId}`}>
              <Button className="w-full" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Управлявай нива
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Profile Info */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Профилна информация</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Показвано име</p>
            <p className="font-semibold">{profile.display_name}</p>
          </div>
          {profile.username && (
            <div>
              <p className="text-sm text-muted-foreground">Потребителско име</p>
              <p className="font-semibold">@{profile.username}</p>
            </div>
          )}
          {profile.bio_bg || profile.bio ? (
            <div>
              <p className="text-sm text-muted-foreground">Биография</p>
              <p>{profile.bio_bg || profile.bio}</p>
            </div>
          ) : null}
          <Link href={`/dashboard/creator/settings?telegramId=${searchParams.telegramId}`}>
            <Button variant="outline">Редактирай профил</Button>
          </Link>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
