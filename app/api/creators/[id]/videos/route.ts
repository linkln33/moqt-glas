import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Get all videos for a creator
 * GET /api/creators/[id]/videos?subscriberId=123
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const subscriberId = searchParams.get('subscriberId');
    
    const supabase = createServerClient();

    // Get all published videos
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
          id,
          name,
          name_bg,
          tier_level
        ),
        created_at
      `)
      .eq('creator_telegram_id', parseInt(creatorId))
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json(
        { error: 'Грешка при зареждане на видеата' },
        { status: 500 }
      );
    }

    // If subscriber ID provided, check access for each video
    if (subscriberId) {
      // Get user's subscription tier level
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
          subscription_tiers (
            tier_level
          )
        `)
        .eq('subscriber_telegram_id', parseInt(subscriberId))
        .eq('creator_telegram_id', parseInt(creatorId))
        .eq('status', 'active')
        .single();

      const userTierLevel = Array.isArray(subscription?.subscription_tiers) && subscription.subscription_tiers.length > 0
        ? subscription.subscription_tiers[0].tier_level
        : 0;

      // Add access info to each video
      const videosWithAccess = videos?.map((video: any) => {
        const requiredTierLevel = video.subscription_tiers?.tier_level || 0;
        const hasAccess = !video.access_tier_id || userTierLevel >= requiredTierLevel;
        
        return {
          ...video,
          hasAccess,
          // Only include YouTube ID if user has access
          youtubeVideoId: hasAccess ? video.youtube_video_id : undefined,
        };
      });

      return NextResponse.json({
        videos: videosWithAccess || [],
      });
    }

    // No subscriber ID - return videos without access info
    return NextResponse.json({
      videos: videos?.map((video: any) => ({
        ...video,
        hasAccess: !video.access_tier_id, // Free videos are accessible
        youtubeVideoId: !video.access_tier_id ? video.youtube_video_id : undefined,
      })) || [],
    });
  } catch (error) {
    console.error('Error in GET /api/creators/[id]/videos:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
