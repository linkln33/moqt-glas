import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user profile from voters table
    const { data: voter, error: voterError } = await supabase
      .from('voters')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (voterError) {
      console.error('Error fetching user profile:', voterError);
      return NextResponse.json(
        { error: 'Грешка при зареждане на профила' },
        { status: 500 }
      );
    }

    // Also try to get from voting_user_profiles if voting_user_id exists
    let profile = null;
    if (voter.voting_user_id) {
      const { data: userProfile } = await supabase
        .from('voting_user_profiles')
        .select('*')
        .eq('id', voter.voting_user_id)
        .single();
      
      if (userProfile) {
        profile = userProfile;
      }
    }

    return NextResponse.json({
      profile: {
        telegram_id: voter.telegram_id,
        first_name: voter.first_name,
        last_name: voter.last_name,
        username: voter.username,
        photo_url: voter.photo_url,
        description: profile?.metadata?.description || '',
        bio: profile?.metadata?.bio || '',
        ...(profile || {}),
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на профила' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const {
      telegramId,
      first_name,
      last_name,
      username,
      description,
      bio,
    } = await request.json();

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Update voters table
    const voterUpdate: any = {};
    if (first_name !== undefined) voterUpdate.first_name = first_name;
    if (last_name !== undefined) voterUpdate.last_name = last_name || null;
    if (username !== undefined) voterUpdate.username = username || null;

    const { data: updatedVoter, error: voterError } = await supabase
      .from('voters')
      .update(voterUpdate)
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (voterError) {
      console.error('Error updating voter:', voterError);
      throw voterError;
    }

    // Update voting_user_profiles if it exists
    if (updatedVoter.voting_user_id) {
      const profileUpdate: any = {
        first_name: voterUpdate.first_name || updatedVoter.first_name,
        last_name: voterUpdate.last_name !== undefined ? voterUpdate.last_name : updatedVoter.last_name,
        username: voterUpdate.username !== undefined ? voterUpdate.username : updatedVoter.username,
        updated_at: new Date().toISOString(),
      };

      // Handle description/bio in metadata
      if (description !== undefined || bio !== undefined) {
        const { data: existingProfile } = await supabase
          .from('voting_user_profiles')
          .select('metadata')
          .eq('id', updatedVoter.voting_user_id)
          .single();

        const existingMetadata = existingProfile?.metadata || {};
        profileUpdate.metadata = {
          ...existingMetadata,
          ...(description !== undefined && { description }),
          ...(bio !== undefined && { bio }),
        };
      }

      const { error: profileError } = await supabase
        .from('voting_user_profiles')
        .update(profileUpdate)
        .eq('id', updatedVoter.voting_user_id);

      if (profileError) {
        console.warn('Error updating user profile:', profileError);
        // Don't fail if profile update fails
      }
    } else {
      // If no voting_user_profiles exists, create one with metadata
      const { data: newProfile } = await supabase
        .from('voting_user_profiles')
        .insert({
          telegram_id: parseInt(telegramId),
          first_name: updatedVoter.first_name,
          last_name: updatedVoter.last_name,
          username: updatedVoter.username,
          photo_url: updatedVoter.photo_url,
          metadata: {
            ...(description && { description }),
            ...(bio && { bio }),
          },
        })
        .select()
        .single();

      if (newProfile) {
        // Update voter with voting_user_id
        await supabase
          .from('voters')
          .update({ voting_user_id: newProfile.id })
          .eq('telegram_id', telegramId);
      }
    }

    return NextResponse.json({
      success: true,
      profile: updatedVoter,
      message: 'Профилът е обновен успешно',
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error.message || 'Грешка при обновяване на профила' },
      { status: 500 }
    );
  }
}
