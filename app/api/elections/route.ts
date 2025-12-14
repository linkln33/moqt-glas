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
    
    // Check if Supabase client is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || supabaseUrl.includes('placeholder') || !serviceRoleKey || serviceRoleKey.includes('placeholder')) {
      console.error('❌ Supabase not properly configured for elections API');
      return NextResponse.json(
        { error: 'Базата данни не е конфигурирана', elections: [] },
        { status: 500 }
      );
    }
    
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching elections:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: 'Грешка при зареждане на изборите',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          elections: [] 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ elections: data || [] });
  } catch (error: any) {
    console.error('❌ Elections fetch exception:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: 'Грешка при зареждане на изборите',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        elections: [] 
      },
      { status: 500 }
    );
  }
}
