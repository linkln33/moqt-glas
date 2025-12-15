import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Get video with access control
 * GET /api/videos/[id]?subscriberId=123
 * Returns video metadata and YouTube ID only if user has access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const subscriberId = searchParams.get('subscriberId');
    
    const supabase = createServerClient();

    // Get video from database
    const { data: video, error: videoError } = await supabase
      .from('creator_videos')
      .select(`
        *,
        subscription_tiers (
          id,
          name,
          name_bg,
          tier_level,
          price,
          currency
        ),
        creator_profiles (
          telegram_id,
          display_name,
          username
        )
      `)
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Видеото не е намерено' },
        { status: 404 }
      );
    }

    // If video is not published, only creator can see it
    if (!video.is_published) {
      // TODO: Check if user is the creator
      // For now, return not found
      return NextResponse.json(
        { error: 'Видеото не е намерено' },
        { status: 404 }
      );
    }

    // If no tier required (NULL), it's free/public
    if (!video.access_tier_id) {
      return NextResponse.json({
        hasAccess: true,
        youtubeVideoId: video.youtube_video_id,
        video: {
          id: video.id,
          title: video.title,
          title_bg: video.title_bg,
          description: video.description,
          description_bg: video.description_bg,
          thumbnail_url: video.thumbnail_url,
          duration: video.duration,
          views_count: video.views_count,
          creator: video.creator_profiles,
        },
      });
    }

    // Video requires subscription - check access
    if (!subscriberId) {
      // No subscriber ID provided - no access
      return NextResponse.json({
        hasAccess: false,
        video: {
          id: video.id,
          title: video.title,
          title_bg: video.title_bg,
          description: video.description,
          description_bg: video.description_bg,
          thumbnail_url: video.thumbnail_url,
          duration: video.duration,
          views_count: video.views_count,
          creator: video.creator_profiles,
        },
        requiredTier: {
          id: video.subscription_tiers.id,
          name: video.subscription_tiers.name,
          name_bg: video.subscription_tiers.name_bg,
          price: video.subscription_tiers.price,
          currency: video.subscription_tiers.currency || 'BGN',
          tier_level: video.subscription_tiers.tier_level,
        },
        // NO youtube_video_id sent
      });
    }

    // Check user's subscription to this creator
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_tiers (
          id,
          name,
          name_bg,
          tier_level
        )
      `)
      .eq('subscriber_telegram_id', parseInt(subscriberId))
      .eq('creator_telegram_id', video.creator_telegram_id)
      .eq('status', 'active')
      .single();

    const userTierLevel = subscription?.subscription_tiers?.tier_level || 0;
    const requiredTierLevel = video.subscription_tiers?.tier_level || 999;

    const hasAccess = userTierLevel >= requiredTierLevel;

    if (!hasAccess) {
      // User doesn't have access - return metadata only
      return NextResponse.json({
        hasAccess: false,
        video: {
          id: video.id,
          title: video.title,
          title_bg: video.title_bg,
          description: video.description,
          description_bg: video.description_bg,
          thumbnail_url: video.thumbnail_url,
          duration: video.duration,
          views_count: video.views_count,
          creator: video.creator_profiles,
        },
        requiredTier: {
          id: video.subscription_tiers.id,
          name: video.subscription_tiers.name,
          name_bg: video.subscription_tiers.name_bg,
          price: video.subscription_tiers.price,
          currency: video.subscription_tiers.currency || 'BGN',
          tier_level: video.subscription_tiers.tier_level,
        },
        currentTier: subscription?.subscription_tiers ? {
          name: subscription.subscription_tiers.name,
          name_bg: subscription.subscription_tiers.name_bg,
          tier_level: subscription.subscription_tiers.tier_level,
        } : null,
        // NO youtube_video_id sent
      });
    }

    // User has access - return YouTube video ID
    // Increment view count (async, don't wait)
    supabase
      .from('creator_videos')
      .update({ views_count: (video.views_count || 0) + 1 })
      .eq('id', videoId)
      .then(() => {
        // Track view
        if (subscriberId) {
          supabase.from('video_views').insert({
            video_id: videoId,
            viewer_telegram_id: parseInt(subscriberId),
          });
        }
      });

    return NextResponse.json({
      hasAccess: true,
      youtubeVideoId: video.youtube_video_id, // ✅ Only sent if user has access
      video: {
        id: video.id,
        title: video.title,
        title_bg: video.title_bg,
        description: video.description,
        description_bg: video.description_bg,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        views_count: video.views_count,
        creator: video.creator_profiles,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/videos/[id]:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
