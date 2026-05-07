// src/lib/sanitize-draft.js
// Post-generation safety net for outreach drafts.
// The drafting prompt forbids em dashes (—) and double-hyphen em dashes (--),
// but Claude occasionally smuggles them in anyway, so we strip them at insert
// time. En dashes (–, U+2013) are explicitly preserved for ranges like "6–8 PM".

// Behavior:
// - "abc — xyz"   -> "abc. Xyz"
// - "abc—xyz"     -> "abc. Xyz"
// - "abc -- xyz"  -> "abc. Xyz"
// - "abc--xyz"    -> "abc. Xyz"
// - "abc.— xyz"   -> "abc. Xyz" (collapses the resulting "..")
// - "6–8 PM"      -> "6–8 PM" (en dash untouched)
// - "abc... xyz"  -> "abc... Xyz" (3+ dot ellipses preserved)

/**
 * Replace em dashes / double-hyphens with sentence breaks and tidy the result.
 * @param {string} text
 * @returns {string}
 */
export function sanitizeDraft(text) {
  if (typeof text !== 'string') return text;

  let s = text;

  // Replace em dashes (U+2014) and ASCII double-hyphens with ". ". Greedy
  // whitespace on either side so " — ", "—", " -- ", and "--" all collapse
  // to a single sentence break. The negative lookahead/lookbehind aren't
  // needed because en dashes (U+2013) and single hyphens never match these.
  s = s.replace(/\s*—\s*/g, '. ');
  s = s.replace(/\s*--\s*/g, '. ');

  // Collapse ". ." or ". . ." patterns (introduced when an em dash sat next
  // to an existing period) down to a single ". ".
  s = s.replace(/\.\s+\.+\s*/g, '. ');

  // Collapse exactly two consecutive dots (introduced when an em dash sat
  // right next to an existing period). The lookbehind+lookahead ensures
  // intentional 3+ dot ellipses ("...") stay untouched.
  s = s.replace(/(?<!\.)\.{2}(?!\.)/g, '.');

  // Normalize horizontal runs of spaces/tabs after a period to a single space.
  // (Newlines are preserved so paragraph breaks survive.)
  s = s.replace(/\.[ \t]+/g, '. ');

  // Capitalize the first letter of each new sentence created by ". " or ".\n".
  s = s.replace(/(\.\s+)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());

  // If the input started with an em dash, we now have a leading ". ". Drop it.
  s = s.replace(/^\.\s*/, '');

  // Trim trailing whitespace on a final period.
  s = s.replace(/\.\s+$/, '.');

  return s;
}
