// Client Supabase Admin con Service Role Key - bypassa RLS policies
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Client Supabase con Service Role Key
 * ATTENZIONE: Usa solo lato server, mai esporre al client!
 * Bypassa tutte le Row Level Security policies
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurato');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
