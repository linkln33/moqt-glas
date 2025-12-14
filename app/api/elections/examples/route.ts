import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
  // Check if Supabase is configured (not placeholder)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'https://placeholder.supabase.co') {
    // Return empty array during build if Supabase is not configured
    return NextResponse.json({ elections: [] }, { status: 200 });
  }

  try {
    const supabase = createServerClient();

    // Get elections created by 'example' (our example polls)
    const { data: elections, error } = await supabase
      .from('elections')
      .select('*')
      .eq('created_by', 'example')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching example polls:', error);
      return NextResponse.json({ elections: [] }, { status: 200 });
    }

    // Get questions and options for each election
    const electionsWithDetails = await Promise.all(
      (elections || []).map(async (election) => {
        const { data: questions } = await supabase
          .from('questions')
          .select('*, options(*)')
          .eq('election_id', election.id)
          .order('order_index', { ascending: true });

        return {
          ...election,
          questions: questions || [],
        };
      })
    );

    return NextResponse.json({ elections: electionsWithDetails });
  } catch (error: any) {
    console.error('Error fetching example polls:', error);
    return NextResponse.json({ elections: [] }, { status: 200 });
  }
}
