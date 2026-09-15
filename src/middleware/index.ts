import { createMiddleware } from '@solidjs/start/middleware';
import { BUILD_HEADER, STALE_BUILD_HEADER, isServerCall } from '../utils/build';

/**
 * Refuse a server call from a build that is no longer live, before any
 * function runs. Server functions are addressed by their place in a
 * file, so an old tab's call could reach a different function with the
 * old arguments. The tab reloads on the refusal
 */
export default createMiddleware([
  (event, next) => {
    const sent = event.req.headers.get(BUILD_HEADER);

    // A tab from before this check names no build, and is let through
    if (
      isServerCall(event.url.pathname) &&
      sent != null &&
      sent !== import.meta.env.VITE_BUILD_ID
    ) {
      return new Response(null, { status: 409, headers: { [STALE_BUILD_HEADER]: '1' } });
    }
    return next();
  },
]);
