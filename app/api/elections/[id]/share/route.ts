import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electionId = params.id;
    const supabase = createServerClient();

    const body = await request.json().catch(() => ({}));
    const telegramId = body.telegramId;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    // Check if already shared (optional - remove if users can share multiple times)
    const { data: existingShare } = await supabase
      .from('election_shares')
      .select('id')
      .eq('election_id', electionId)
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (existingShare) {
      // User already shared, just return current count
      const { count: sharesCount } = await supabase
        .from('election_shares')
        .select('*', { count: 'exact', head: true })
        .eq('election_id', electionId);

      return NextResponse.json({
        success: true,
        sharesCount: sharesCount || 0,
        alreadyShared: true,
      });
    }

    // Create share
    const { error: shareError } = await supabase
      .from('election_shares')
      .insert({
        election_id: electionId,
        telegram_id: telegramId,
      });

    if (shareError) {
      console.error('Error creating share:', shareError);
      return NextResponse.json(
        { error: 'Грешка при споделяне' },
        { status: 500 }
      );
    }

    // Get updated count
    const { count: sharesCount } = await supabase
      .from('election_shares')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', electionId);

    return NextResponse.json({
      success: true,
      sharesCount: sharesCount || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/elections/[id]/share:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
