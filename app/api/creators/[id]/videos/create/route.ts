import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * Create a new video for a creator
 * POST /api/creators/[id]/videos/create
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id;
    const body = await request.json();
    const {
      youtube_video_id,
      title,
      title_bg,
      description,
      description_bg,
      thumbnail_url,
      access_tier_id,
    } = body;

    if (!youtube_video_id || !title) {
      return NextResponse.json(
        { error: 'YouTube Video ID and Title are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Create video
    const { data: video, error: videoError } = await supabase
      .from('creator_videos')
      .insert({
        creator_telegram_id: parseInt(creatorId),
        youtube_video_id,
        title,
        title_bg: title_bg || null,
        description: description || null,
        description_bg: description_bg || null,
        thumbnail_url: thumbnail_url || null,
        access_tier_id: access_tier_id || null,
        is_published: false, // Default to draft
      })
      .select()
      .single();

    if (videoError) {
      console.error('Error creating video:', videoError);
      return NextResponse.json(
        { error: 'Грешка при създаване на видеото' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      video,
      message: 'Видеото е създадено успешно',
    });
  } catch (error) {
    console.error('Error in POST /api/creators/[id]/videos/create:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
