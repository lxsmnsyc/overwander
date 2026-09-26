import { createMiddleware } from '@solidjs/start/middleware';
import { BUILD_HEADER, STALE_BUILD_HEADER, isStaleCall } from '../utils/build';

/**
 * Refuse a server call from any build but the live one, before any
 * function runs. Server functions are addressed by their place in a
 * file, so an old tab's call could reach a different function with the
 * old arguments. The tab reloads on the refusal.
 *
 * A call that names no build is refused too. Every tab since the guard
 * shipped names its build, so one that does not is either from before
 * it or not the game at all. Refusing both is what lets a deploy
 * remove or reorder server functions: no call from another build ever
 * reaches one
 */
export default createMiddleware([
  (event, next) => {
    if (
      isStaleCall(
        event.url.pathname,
        event.req.headers.get(BUILD_HEADER),
        import.meta.env.VITE_BUILD_ID,
      )
    ) {
      return new Response(null, { status: 409, headers: { [STALE_BUILD_HEADER]: '1' } });
    }
    return next();
  },
]);
