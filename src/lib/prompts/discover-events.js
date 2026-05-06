// src/lib/prompts/discover-events.js
// Prompt for Perplexity to find upcoming events at a given venue.
// Returns structured JSON the discover-events cron can write to the events table.

export const DISCOVERY_SYSTEM_PROMPT = `You are a precise event research assistant. Your job is to find publicly listed upcoming events at specific venues and return ONLY a valid JSON array.

CRITICAL RULES:
- Return ONLY a JSON array. No markdown fences, no preamble, no explanation.
- Only include events that are actually listed on official venue websites, ticketing platforms, or verifiable public sources.
- If you cannot find any upcoming events, return an empty array: []
- Do not invent or guess events. If unsure, omit the entry.
- All dates must be in YYYY-MM-DD format.
- Source URL must be a direct link to a page that lists this specific event.`;

/**
 * Build the user prompt for a single venue.
 *
 * @param {{ name: string, city: string, type: string }} venue
 * @returns {string}
 */
export function buildDiscoveryPrompt(venue) {
  return `Find upcoming events at this venue in the next 90 days.

Venue: ${venue.name}
City: ${venue.city}, MN
Venue type: ${venue.type}

Return a JSON array where each event is an object with these exact fields:
- "name": string (event/show/artist name)
- "event_date": string (YYYY-MM-DD format)
- "event_type": one of "concert", "wedding", "corporate", "film_shoot", "sports", "private", "other"
- "artist_or_host": string or null (headliner/host/team if applicable)
- "source_url": string (direct URL where this event is publicly listed)

Example response format:
[
  {
    "name": "Taylor Swift - The Eras Tour",
    "event_date": "2026-06-15",
    "event_type": "concert",
    "artist_or_host": "Taylor Swift",
    "source_url": "https://example.com/events/taylor-swift"
  }
]

Return only the JSON array. No other text.`;
}

export const DISCOVERY_PROMPT_VERSION = 'discovery-v1';
