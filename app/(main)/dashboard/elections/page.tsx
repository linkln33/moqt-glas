import { createServerClient } from '@/lib/supabase/client';
import { isSchemaCacheError, shouldTreatErrorAsNonFatal } from '@/lib/utils';
import { ElectionsClientPage } from './client-page';

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
      // Handle schema cache errors gracefully during build
      if (isSchemaCacheError(error)) {
        console.warn('⚠️ Schema cache not refreshed yet (PGRST205). Returning empty array. This is normal during build.');
        return [];
      }
      
      console.error('Error fetching elections:', error);
      
      // During build, treat errors as non-fatal
      if (shouldTreatErrorAsNonFatal(error)) {
        return [];
      }
      
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    
    // During build, treat errors as non-fatal
    if (shouldTreatErrorAsNonFatal(error as any)) {
      return [];
    }
    
    // Return empty array if Supabase is not configured
    return [];
  }
}

export default async function ElectionsPage() {
  const elections = await getElections();
  return <ElectionsClientPage elections={elections} />;
}
