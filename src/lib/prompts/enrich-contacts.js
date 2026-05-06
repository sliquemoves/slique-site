// src/lib/prompts/enrich-contacts.js
// Prompt for Perplexity to find a sales / event-coordination contact
// for a given venue. Returns structured JSON the enrich-contacts cron
// can write to the contacts table.

export const ENRICH_SYSTEM_PROMPT = `You are a precise contact research assistant. Your job is to find the publicly listed sales, events, or booking contact for a specific venue and return ONLY a valid JSON object.

CRITICAL RULES:
- Return ONLY a JSON object. No markdown fences, no preamble, no explanation.
- Only return contact info that is publicly listed on the venue's official website, an industry directory, or a verifiable public source.
- Prefer the role most relevant to event/group transportation logistics: sales, events, group sales, booking, hospitality, or production coordination.
- Do not invent or guess email addresses. If you cannot find a real, verifiable email, return: {"name": null, "role": null, "email": null, "source_url": null}
- Never return generic addresses like info@, contact@, hello@ unless that is the only listed event/booking contact AND it is the address the venue itself directs inquiries to.
- The source_url must be a direct link to the page where this contact is listed.`;

/**
 * Build the user prompt for enriching a single venue.
 *
 * @param {{ name: string, city: string, type: string, website_url?: string }} venue
 * @returns {string}
 */
export function buildEnrichPrompt(venue) {
  const websiteHint = venue.website_url
    ? `Official website: ${venue.website_url}`
    : `Search for the venue's official website first.`;

  return `Find the best sales, events, or booking contact for this venue.

Venue: ${venue.name}
City: ${venue.city}, MN
Venue type: ${venue.type}
${websiteHint}

Return a JSON object with these exact fields:
- "name": string or null (the person's full name)
- "role": string or null (their job title, e.g. "Director of Sales", "Events Manager")
- "email": string or null (their direct work email at this venue)
- "source_url": string or null (the page URL where this contact is publicly listed)

Example response format:
{
  "name": "Sarah Johnson",
  "role": "Director of Events",
  "email": "sarah.johnson@example-venue.com",
  "source_url": "https://example-venue.com/contact"
}

Return only the JSON object. No other text.`;
}

export const ENRICH_PROMPT_VERSION = 'enrich-v1';
