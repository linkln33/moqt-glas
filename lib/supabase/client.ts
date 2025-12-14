import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create client with placeholder values if env vars are missing
// This allows the app to run and show UI even without database configured
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!url || !serviceRoleKey) {
    // Return a client with placeholder values - will fail on actual DB operations
    // but allows the app to render
    return createClient(
      url || 'https://placeholder.supabase.co',
      serviceRoleKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
