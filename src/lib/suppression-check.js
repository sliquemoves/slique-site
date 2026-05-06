// lib/suppression-check.js
// Call isSuppressed(email) before every send.
// Returns true if the email is on the suppression list — do not send.

import { supabaseAdmin } from './supabase-admin.js';

/**
 * Check if an email address is suppressed.
 *
 * @param {string} email
 * @returns {Promise<boolean>} true = do not send
 */
export async function isSuppressed(email) {
  if (!email) return true;

  const { data, error } = await supabaseAdmin
    .from('suppressions')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    // Fail safe — if we can't check, don't send
    console.error(`[suppression-check] Error checking ${email}:`, error);
    return true;
  }

  return data !== null;
}

/**
 * Add an email to the suppression list.
 *
 * @param {string} email
 * @param {'unsubscribed'|'hard_bounce'|'complaint'|'manual'|'replied_stop'} reason
 * @param {string} [notes]
 */
export async function addSuppression(email, reason, notes = null) {
  const { error } = await supabaseAdmin
    .from('suppressions')
    .upsert(
      {
        email: email.toLowerCase().trim(),
        reason,
        notes,
        added_at: new Date().toISOString(),
      },
      { onConflict: 'email', ignoreDuplicates: true }
    );

  if (error) {
    console.error(`[suppression-check] Failed to add suppression for ${email}:`, error);
  } else {
    console.log(`[suppression-check] Suppressed ${email} (${reason})`);
  }
}
