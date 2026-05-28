// Server-only. Never import in client components.
//
// Required env vars in Vercel dashboard:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel dashboard'
    );
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  return _client;
}
