/**
 * UTM attribution tracking — captures first-touch and last-touch UTM params.
 * First touch is stored once (never overwritten). Last touch updates on every visit.
 */

const FIRST_TOUCH_KEY = 'majorka_first_touch';
const LAST_TOUCH_KEY = 'majorka_last_touch';

export interface UTMParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string;
  referrer: string;
  captured_at: string;
}

function readUTMFromURL(): UTMParams | null {
  const params = new URLSearchParams(window.location.search);
  const utm_source = params.get('utm_source');
  const utm_medium = params.get('utm_medium');
  const utm_campaign = params.get('utm_campaign');
  const utm_content = params.get('utm_content');
  const utm_term = params.get('utm_term');

  // Only capture if at least one UTM param is present
  if (!utm_source && !utm_medium && !utm_campaign) return null;

  return {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    landing_page: window.location.pathname,
    referrer: document.referrer || '',
    captured_at: new Date().toISOString(),
  };
}

function safeGetJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Call on every page load. Stores first-touch (once) and last-touch (always). */
export function captureUTM() {
  const utmData = readUTMFromURL();
  if (!utmData) return;

  // First touch — never overwrite
  const existing = safeGetJSON<UTMParams>(FIRST_TOUCH_KEY);
  if (!existing) {
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(utmData));
  }

  // Last touch — always overwrite
  localStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(utmData));
}

/** Get stored attribution data for sending on signup */
export function getAttribution(): { firstTouch: UTMParams | null; lastTouch: UTMParams | null } {
  return {
    firstTouch: safeGetJSON<UTMParams>(FIRST_TOUCH_KEY),
    lastTouch: safeGetJSON<UTMParams>(LAST_TOUCH_KEY),
  };
}

/** Build flat properties object for PostHog / Supabase */
export function getAttributionFlat() {
  const { firstTouch, lastTouch } = getAttribution();
  return {
    first_touch_source: firstTouch?.utm_source ?? null,
    first_touch_medium: firstTouch?.utm_medium ?? null,
    first_touch_campaign: firstTouch?.utm_campaign ?? null,
    last_touch_source: lastTouch?.utm_source ?? null,
    last_touch_medium: lastTouch?.utm_medium ?? null,
    last_touch_campaign: lastTouch?.utm_campaign ?? null,
    referrer: firstTouch?.referrer ?? lastTouch?.referrer ?? null,
  };
}
