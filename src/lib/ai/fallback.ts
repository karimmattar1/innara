/**
 * AI Concierge Fallback Responses
 *
 * Pattern-matches common guest intents and returns helpful static responses
 * with direct links when the AI provider is unavailable.
 */

const ROOM_SERVICE_KEYWORDS = [
  "room service",
  "order food",
  "food delivery",
  "order drink",
  "menu",
  "hungry",
  "eat",
  "breakfast",
  "lunch",
  "dinner",
  "meal",
  "snack",
];

const HOUSEKEEPING_KEYWORDS = [
  "housekeeping",
  "clean",
  "towel",
  "linen",
  "sheets",
  "tidy",
  "maid",
  "turndown",
  "toiletries",
  "amenities",
];

const CHECKOUT_KEYWORDS = [
  "checkout",
  "check out",
  "check-out",
  "leaving",
  "depart",
  "departure",
  "bill",
  "invoice",
  "folio",
  "settle",
];

/**
 * Returns a helpful fallback response based on the user's message intent.
 * Used when the Anthropic API is unavailable.
 *
 * @param userMessage - The guest's original message
 * @returns A helpful static response string with relevant deep links
 */
export function getFallbackResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (ROOM_SERVICE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "I'm having trouble connecting right now. You can order room service directly at /guest/room-service";
  }

  if (HOUSEKEEPING_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "I'm temporarily unavailable. Request housekeeping at /guest/services/housekeeping";
  }

  if (CHECKOUT_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return "For checkout, visit /guest/checkout";
  }

  return "I'm temporarily unavailable. Please try again in a moment, or use the services menu for immediate assistance.";
}
