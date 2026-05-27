// Server-only. Never import in client components.
//
// Required env vars in Vercel dashboard:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
