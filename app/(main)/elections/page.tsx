import { createServerClient } from '@/lib/supabase/client';
import { ElectionsClientPage } from './client-page';

async function getElections() {
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
