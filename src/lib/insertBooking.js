// src/lib/insertBooking.js
// ──────────────────────────────────────────────────────────────────────────────
// One resilient place to create a booking row.
//
// The rental schedule relies on newer columns (return_date, daily_rate,
// total_amount). Those are added by sql/rentals_migration.sql. To make the app
// safe to deploy WHETHER OR NOT that migration has run yet, this helper first
// tries the full payload, and if Postgres reports a missing column it strips the
// newer fields and retries. Once the migration is applied, the full payload
// succeeds and the structured columns populate automatically.
// ──────────────────────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabaseClient';

// Columns introduced by the rentals migration — safe to drop on older schemas.
const OPTIONAL_COLUMNS = ['return_date', 'daily_rate', 'total_amount'];

function isMissingColumn(error) {
  if (!error) return false;
  return error.code === '42703' || /column .* does not exist/i.test(error.message || '');
}

// Insert a booking, returning { data, error }. Mirrors a supabase insert result.
export async function insertBooking(payload) {
  let attempt = { ...payload };

  // Up to (1 + OPTIONAL_COLUMNS.length) tries; each missing-column error strips
  // one offending field and retries.
  for (let i = 0; i <= OPTIONAL_COLUMNS.length; i++) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([attempt])
      .select()
      .single();

    if (!error) return { data, error: null };
    if (!isMissingColumn(error)) return { data: null, error };

    // Drop any optional columns still present and retry.
    const before = Object.keys(attempt).length;
    for (const col of OPTIONAL_COLUMNS) delete attempt[col];
    if (Object.keys(attempt).length === before) return { data: null, error };
  }

  return { data: null, error: new Error('Booking insert failed after retries') };
}
