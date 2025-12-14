import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET() {
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
