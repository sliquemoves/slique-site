// src/lib/scoring.js
// Lead scoring rule. Higher score = higher priority for outreach.
//
// Components:
// - Venue tier (1=highest priority): inverted to 30/20/10 points
// - Event type weight: corporate/film highest (largest contracts), private lowest
// - Date proximity: events 14-90 days out score highest (sweet spot for booking)

const VENUE_TIER_POINTS = {
  1: 30,
  2: 20,
  3: 10,
};

const EVENT_TYPE_POINTS = {
  corporate:   25,  // High budget, predictable
  film_shoot:  25,  // Production budgets, recurring
  concert:     20,  // Artist/crew transport
  sports:      20,  // VIP, team, talent transport
  wedding:     15,  // Single event, smaller spend
  private:     10,
  other:       5,
};

/**
 * Score a lead based on venue tier, event type, and event date proximity.
 *
 * @param {{ venueTier?: number, eventType?: string, eventDate?: string }} lead
 * @returns {number} score 0-100
 */
export function scoreLead({ venueTier, eventType, eventDate }) {
  let score = 0;

  // Venue tier
  score += VENUE_TIER_POINTS[venueTier] ?? 10;

  // Event type
  score += EVENT_TYPE_POINTS[eventType] ?? 5;

  // Date proximity — sweet spot is 14-90 days out
  if (eventDate) {
    const daysOut = Math.floor(
      (new Date(eventDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysOut < 0) {
      // Past event — useless
      score = 0;
    } else if (daysOut < 7) {
      // Too soon, decisions already made
      score += 5;
    } else if (daysOut <= 90) {
      // Sweet spot
      score += 30;
    } else if (daysOut <= 180) {
      // Far out but plannable
      score += 20;
    } else {
      // Too far
      score += 10;
    }
  }

  return Math.min(score, 100);
}
