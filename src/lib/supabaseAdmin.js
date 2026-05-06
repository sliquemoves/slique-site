// lib/supabase-admin.js
// Server-side only — uses service role key which bypasses RLS.
// Never import this in frontend/client code.
// Used exclusively by /api/cron/* and /api/webhooks/* routes.

import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing env var: SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env var: SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
