// ============================================
// AI CONCIERGE SECURITY MODULE
//
// Provides three layers of defence for the AI concierge endpoint:
//   1. sanitizeUserInput  — strips injection patterns before sending to Claude
//   2. filterAIResponse   — removes accidental data leaks from Claude's output
//   3. detectAdversarialInput — classifies threat level for early rejection
//
// Integrated in src/app/api/ai/chat/route.ts.
// ============================================

// ============================================
// CONSTANTS
// ============================================

const MAX_INPUT_LENGTH = 2000;

// Patterns that indicate an attempt to override model instructions.
// Checked case-insensitively.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|your|the|above|prior)\s+instructions?/i,
  /disregard\s+(previous|all|your|the|above|prior)\s+instructions?/i,
  /forget\s+(everything|all|your|previous|prior)\s+(you\s+know|instructions?)?/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+|an\s+)?(?!guest|hotel)/i, // allow "act as a guest" but not "act as an unrestricted AI"
  /pretend\s+(to\s+be|you\s+are)\s+/i,
  /roleplay\s+as\s+/i,
  /^system\s*:/im,
  /^assistant\s*:/im,
  /^human\s*:/im,
  /^user\s*:/im,
  /\[system\]/i,
  /\[assistant\]/i,
  /\[inst\]/i,
  /<\/?system>/i,
  /<\/?prompt>/i,
  /<\/?instructions>/i,
  /<\/?context>/i,
];

// Patterns that suggest an attempt to extract system prompt or internal data.
const EXTRACTION_PATTERNS: RegExp[] = [
  /repeat\s+(your|the)\s+(instructions?|system\s+prompt|prompt|configuration|context)/i,
  /what\s+(is|are)\s+(your|the)\s+(system\s+prompt|instructions?|configuration|context)/i,
  /show\s+me\s+(your|the)\s+(system\s+prompt|instructions?|configuration)/i,
  /print\s+(your|the)\s+(system\s+prompt|instructions?|configuration)/i,
  /output\s+(your|the)\s+(system\s+prompt|instructions?|configuration)/i,
  /tell\s+me\s+(your|the)\s+(system\s+prompt|instructions?|configuration)/i,
  /reveal\s+(\w+\s+){0,3}(system\s+prompt|instructions?|configuration|context)/i,
  /display\s+(your|the)\s+(system\s+prompt|instructions?|configuration)/i,
];

// Patterns that suggest an attempt to extract PII for other guests.
const PII_EXTRACTION_PATTERNS: RegExp[] = [
  /list\s+(all\s+)?(guests?|users?|customers?|rooms?|bookings?)/i,
  /show\s+(me\s+)?(all\s+)?(guests?|users?|customers?|rooms?|bookings?)/i,
  /how\s+many\s+(guests?|users?|rooms?)\s+are\s+/i,
  /who\s+(else\s+)?(is\s+)?(staying|checked\s+in|in\s+room)/i,
  /other\s+guests?\s+(information|data|names?|rooms?|details?)/i,
  /guest\s+list/i,
  /access\s+(other|all)\s+(guests?|rooms?|accounts?)/i,
];

// Known jailbreak keywords.
const JAILBREAK_PATTERNS: RegExp[] = [
  /\bDAN\b/,          // "Do Anything Now" jailbreak
  /do\s+anything\s+now/i,
  /jailbreak/i,
  /unrestricted\s+(mode|ai|assistant)/i,
  /developer\s+mode/i,
  /god\s+mode/i,
  /bypass\s+(your\s+)?(restrictions?|filter|safety|guidelines?|rules?|instructions?)/i,
  /disable\s+(your\s+)?(restrictions?|filter|safety|guidelines?|rules?)/i,
  /no\s+restrictions?/i,
  /without\s+restrictions?/i,
  /token\s+exhaustion/i,
];

// Code-injection signals (SQL, JS).
const CODE_INJECTION_PATTERNS: RegExp[] = [
  /\bSELECT\b.+\bFROM\b/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\b.+\bSET\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\bEXEC(UTE)?\b.+\(/i,
  /\bUNION\s+(ALL\s+)?SELECT\b/i,
  /--\s*(sql|query|injection)/i,
  /<script\b/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']?\s*(?:alert|eval|fetch|document)\b/i,
];

// Patterns in AI output that may indicate leakage of internal details.
const OUTPUT_LEAK_PATTERNS: RegExp[] = [
  // Table / column names from Supabase schema
  /\b(hotel_faqs|ai_conversations|ai_messages|service_requests|stays|profiles|hotels)\b/gi,
  // SQL fragments
  /\b(SELECT|INSERT INTO|UPDATE .+ SET|DELETE FROM|DROP TABLE|FROM \w+|WHERE \w+ =)\b/g,
  // Internal operation language the model might echo
  /\bsystem prompt\b/gi,
  /\bCRITICAL SECURITY RULES\b/gi,
  /\bBehavioral Guidelines\b/gi,
];

// Regex for PII redaction in output (email, phone).
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?\(?(?:\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s?(x|ext\.?)\s?\d{1,5})?/g;

// ============================================
// SANITIZE USER INPUT
// ============================================

/**
 * Strips known prompt-injection patterns from user input before it is sent to
 * the language model. This is a defence-in-depth measure — the system prompt
 * also instructs the model to resist manipulation.
 *
 * Operations performed (in order):
 *   1. Truncate to MAX_INPUT_LENGTH to prevent token-exhaustion attacks.
 *   2. Remove base64-encoded payloads (common obfuscation vector).
 *   3. Remove HTML/XML tags that could manipulate context injection.
 *   4. Strip role-injection prefixes (System:, Assistant:, [INST]).
 *   5. Strip each injection pattern phrase, replacing with a space.
 *   6. Normalize whitespace (collapse runs of spaces/newlines).
 *   7. Trim leading/trailing whitespace.
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return "";

  // Step 1: Truncate first to limit work on large payloads
  let sanitized = input.slice(0, MAX_INPUT_LENGTH);

  // Step 2: Remove base64 blobs (4+ chars of base64 chars followed by = padding)
  // These are used to smuggle encoded instructions past naive keyword filters.
  sanitized = sanitized.replace(/[A-Za-z0-9+/]{20,}={0,2}/g, "");

  // Step 3: Remove HTML/XML tags
  sanitized = sanitized.replace(/<[^>]*>/g, " ");

  // Step 4: Strip role-injection line prefixes
  sanitized = sanitized
    .replace(/^system\s*:\s*/gim, "")
    .replace(/^assistant\s*:\s*/gim, "")
    .replace(/^human\s*:\s*/gim, "")
    .replace(/^user\s*:\s*/gim, "")
    .replace(/\[system\]/gi, "")
    .replace(/\[assistant\]/gi, "")
    .replace(/\[inst\]/gi, "");

  // Step 5: Strip each injection pattern phrase
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, " ");
  }

  // Step 6 + 7: Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

// ============================================
// FILTER AI RESPONSE
// ============================================

/**
 * Filters the AI's output before streaming it to the client. Removes any
 * fragments that would reveal internal system details or guest PII.
 *
 * Operations performed:
 *   1. Remove Supabase table/column names and SQL fragments.
 *   2. Remove any echoed system-prompt sections.
 *   3. Redact email addresses.
 *   4. Redact phone numbers.
 */
export function filterAIResponse(response: string): string {
  if (!response) return "";

  let filtered = response;

  // Step 1: Remove internal schema / SQL leaks
  for (const pattern of OUTPUT_LEAK_PATTERNS) {
    filtered = filtered.replace(pattern, "[internal]");
  }

  // Step 2: Redact email addresses
  filtered = filtered.replace(EMAIL_REGEX, "[email redacted]");

  // Step 3: Redact phone numbers (run after email to avoid partial overlaps)
  filtered = filtered.replace(PHONE_REGEX, "[phone redacted]");

  return filtered;
}

// ============================================
// DETECT ADVERSARIAL INPUT
// ============================================

export interface AdversarialDetectionResult {
  isSuspicious: boolean;
  reason?: string;
  severity: "low" | "medium" | "high";
}

/**
 * Classifies whether user input is attempting to manipulate the AI concierge.
 *
 * Severity mapping:
 *   "high"   — code injection, jailbreak, or multi-vector attack → reject immediately
 *   "medium" — role injection, prompt-extraction attempt, PII harvesting → log and continue
 *   "low"    — minor indicators, single soft match → allow through, monitor
 *   (none)   — clean input
 *
 * The caller decides what to do with the result. The chat route currently
 * returns an error for "high" severity and proceeds for everything below.
 */
export function detectAdversarialInput(
  input: string,
): AdversarialDetectionResult {
  if (!input) {
    return { isSuspicious: false, severity: "low" };
  }

  // --- Code injection: always high severity ---
  for (const pattern of CODE_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        reason: "Code injection pattern detected",
        severity: "high",
      };
    }
  }

  // --- Jailbreak keywords: always high severity ---
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        reason: "Jailbreak pattern detected",
        severity: "high",
      };
    }
  }

  // --- Role injection: medium severity ---
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        reason: "Role injection attempt detected",
        severity: "medium",
      };
    }
  }

  // --- Prompt extraction: medium severity ---
  for (const pattern of EXTRACTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        reason: "Prompt extraction attempt detected",
        severity: "medium",
      };
    }
  }

  // --- PII extraction: medium severity ---
  for (const pattern of PII_EXTRACTION_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        reason: "PII extraction attempt detected",
        severity: "medium",
      };
    }
  }

  // --- Token exhaustion: check for excessive repetition ---
  // A single repeated word/phrase 20+ times is unusual for legitimate use.
  const words = input.split(/\s+/);
  if (words.length >= 20) {
    const wordFreq: Record<string, number> = {};
    for (const word of words) {
      const normalized = word.toLowerCase();
      wordFreq[normalized] = (wordFreq[normalized] ?? 0) + 1;
    }
    const maxFreq = Math.max(...Object.values(wordFreq));
    if (maxFreq / words.length > 0.4) {
      return {
        isSuspicious: true,
        reason: "Excessive repetition detected (potential token exhaustion)",
        severity: "medium",
      };
    }
  }

  return { isSuspicious: false, severity: "low" };
}
