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
    
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching elections:', error);
      return NextResponse.json(
        { error: 'Грешка при зареждане на изборите' },
        { status: 500 }
      );
    }

    return NextResponse.json({ elections: data || [] });
  } catch (error: any) {
    console.error('Elections fetch error:', error);
    return NextResponse.json(
      { error: 'Грешка при зареждане на изборите' },
      { status: 500 }
    );
  }
}
