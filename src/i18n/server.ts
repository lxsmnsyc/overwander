import { getRequestEvent } from 'solid-js/web';
import {
  type Locale,
  baseLocale,
  extractLocaleFromRequest,
  overwriteGetLocale,
} from './paraglide/runtime.js';

/**
 * The server's locale, worked out from the request being rendered: the
 * player's cookie, then `Accept-Language`, then English. Imported once
 * by `entry-server.tsx`.
 *
 * Every message asks for the locale, so it is worked out once per
 * request and kept beside it. Outside a request, as when the registries
 * load at start-up, it is English
 */
const decided = new WeakMap<Request, Locale>();

function requestLocale(): Locale {
  const event = getRequestEvent();

  if (event == null) {
    return baseLocale;
  }

  let locale = decided.get(event.request);

  if (locale == null) {
    locale = extractLocaleFromRequest(event.request);
    decided.set(event.request, locale);
  }
  return locale;
}

overwriteGetLocale(requestLocale);
