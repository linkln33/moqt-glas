import { createClient } from '@supabase/supabase-js';

// Helper to check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(
    url &&
    !url.includes('placeholder') &&
    url !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client with placeholder values if env vars are missing
// This allows the app to run and show UI even without database configured
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase server client is configured
export function isServerClientConfigured(): boolean {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  return !!(
    url &&
    !url.includes('placeholder') &&
    url !== 'https://placeholder.supabase.co' &&
    serviceRoleKey &&
    serviceRoleKey !== 'placeholder-key'
  );
}

// Server-side client with service role key
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // Check if we have valid configuration (not placeholder values)
  const isConfigured = isServerClientConfigured();
  
  if (!isConfigured) {
    // During build/prerender, return a safe client that won't cause build failures
    // The client will fail on actual operations, but won't throw during initialization
    // This allows the build to complete even when Supabase is not configured
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return createClient(url!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Export helper to check configuration status
export { isSupabaseConfigured };
