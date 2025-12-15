import { createServerClient } from '@/lib/supabase/client';
import { ElectionsClientPage } from './client-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getElections() {
  // Check if Supabase is configured (not placeholder)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'https://placeholder.supabase.co') {
    // Return empty array during build if Supabase is not configured
    return [];
  }

  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching elections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    // Return empty array if Supabase is not configured
    return [];
  }
}

export default async function ElectionsPage() {
  const elections = await getElections();
  return <ElectionsClientPage elections={elections} />;
}
