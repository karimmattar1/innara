import { getHotelBranding } from "@/lib/branding";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BrandingStylesProps {
  hotelId: string;
}

// ---------------------------------------------------------------------------
// Sanitizers
// ---------------------------------------------------------------------------

/** Accept only valid 3-, 6-, or 8-digit hex colors. Falls back to empty string
 *  so the CSS variable is omitted entirely rather than injecting garbage. */
function sanitizeColor(color: string): string {
  const trimmed = color.trim();
  return /^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?$/.test(trimmed)
    ? trimmed
    : "";
}

/** Allow only font-family-safe characters: letters, digits, spaces, commas,
 *  hyphens, apostrophes, and quotes. Strips everything else. */
function sanitizeFont(font: string): string {
  return font.replace(/[^a-zA-Z0-9\s,'"-]/g, "").trim();
}

/**
 * Strip patterns that could be used for CSS injection / XSS:
 * - HTML tags
 * - CSS expression() (IE legacy)
 * - javascript: protocol in url()
 * - @import (blocks loading external resources)
 * - IE behavior property
 * - data: URIs in url() (can embed scripts in some browsers)
 */
function sanitizeCss(css: string): string {
  return css
    .replace(/<[^>]*>/g, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/@import\b/gi, "")
    .replace(/url\s*\(\s*['"]?\s*data\s*:/gi, "url(invalid:")
    .replace(/behavior\s*:/gi, "");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Server component that renders a <style> tag injecting hotel-specific CSS
 * custom properties into :root and any hotel-supplied custom CSS.
 *
 * Security notes:
 * - Colors are validated to strict hex format before injection.
 * - Fonts are stripped of any non-font-family characters.
 * - Custom CSS has dangerous patterns removed before injection.
 * - dangerouslySetInnerHTML is intentional and safe here because we fully
 *   sanitize the content server-side before rendering.
 */
export async function BrandingStyles({
  hotelId,
}: BrandingStylesProps): Promise<React.ReactElement | null> {
  const branding = await getHotelBranding(hotelId);
  if (!branding) return null;

  // Build :root CSS custom property declarations
  const cssVars: string[] = [];

  if (branding.primaryColor) {
    const safe = sanitizeColor(branding.primaryColor);
    if (safe) cssVars.push(`  --brand-primary: ${safe};`);
  }
  if (branding.accentColor) {
    const safe = sanitizeColor(branding.accentColor);
    if (safe) cssVars.push(`  --brand-accent: ${safe};`);
  }
  if (branding.backgroundColor) {
    const safe = sanitizeColor(branding.backgroundColor);
    if (safe) cssVars.push(`  --brand-bg: ${safe};`);
  }
  if (branding.fontHeading) {
    const safe = sanitizeFont(branding.fontHeading);
    if (safe) cssVars.push(`  --brand-font-heading: ${safe};`);
  }
  if (branding.fontBody) {
    const safe = sanitizeFont(branding.fontBody);
    if (safe) cssVars.push(`  --brand-font-body: ${safe};`);
  }

  const rootCss =
    cssVars.length > 0 ? `:root {\n${cssVars.join("\n")}\n}` : "";

  const safeCss = branding.customCss ? sanitizeCss(branding.customCss) : "";

  const fullCss = [rootCss, safeCss].filter(Boolean).join("\n\n");
  if (!fullCss) return null;

  return (
    <style
      data-hotel-branding={hotelId}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: fullCss }}
    />
  );
}
