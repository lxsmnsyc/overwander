import {
  type Locale,
  baseLocale,
  getLocale,
  isLocale,
  locales,
  overwriteGetLocale,
  setLocale,
} from './paraglide/runtime.js';

/**
 * The language the game is shown in.
 *
 * It belongs to the machine, as the theme does, but it is kept in a
 * cookie rather than in `localStorage`: the server has to know it to
 * render the page in the right language, and a cookie is the only
 * storage a request carries. Until a player picks one, the browser's
 * `Accept-Language` decides, and English when nothing matches.
 *
 * The server works the locale out from the request (`server.ts`) and
 * writes it on `<html lang>`. The browser reads it back from there
 * instead of asking its own languages, which could disagree with the
 * header and make the hydrated page differ from the one it was sent.
 */

export type { Locale };

export { baseLocale, isLocale, locales };

/** The locale the page was rendered in, read once: it only changes with a reload */
let rendered: Locale | undefined;

function readRendered(): Locale {
  // A lang the game has no locale for reads as English
  if (rendered == null) {
    const lang = document.documentElement.lang;

    rendered = isLocale(lang) ? lang : baseLocale;
  }
  return rendered;
}

if (typeof document !== 'undefined') {
  overwriteGetLocale(readRendered);
}

/** The active locale: the request's on the server, the page's in the browser */
export function currentLocale(): Locale {
  return getLocale();
}

/**
 * Switches the game to another language. The choice is written to the
 * cookie and the page reloads, since every string on it was rendered in
 * the old one
 */
export function chooseLocale(locale: Locale): Promise<void> | void {
  return setLocale(locale);
}

/**
 * The tag `Intl` formats with. English is written the British way
 * across the game ("12 Aug 2026", "favour"), so its dates are too
 */
const INTL_TAGS: Record<Locale, string> = {
  en: 'en-GB',
};

/** The tag `Intl` formats a locale's numbers and dates with, the active locale's by default */
export function getIntlTag(locale: Locale = currentLocale()): string {
  return INTL_TAGS[locale];
}
