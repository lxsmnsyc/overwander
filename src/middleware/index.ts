import { createMiddleware } from '@solidjs/start/middleware';
import { BUILD_HEADER, STALE_BUILD_HEADER, isStaleCall } from '../utils/build';

/** The site's own address when it is https, which only production's is */
function secureSite(): string | null {
  const site = process.env.BETTER_AUTH_URL ?? '';

  return site.startsWith('https://') ? site : null;
}

/** Whether the visitor reached the tunnel over http, as Cloudflare reports it */
function visitedOverHttp(headers: Headers): boolean {
  return (
    headers.get('x-forwarded-proto') === 'http' ||
    (headers.get('cf-visitor') ?? '').includes('"scheme":"http"')
  );
}

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
  // A visit over plain http is sent to https: sign-in trusts only the
  // https origin, so from http it refuses the page's return address
  (event, next) => {
    const site = secureSite();

    // The site's own address rather than the request's, which behind
    // the tunnel is the container's
    if (site != null && visitedOverHttp(event.req.headers)) {
      return Response.redirect(new URL(`${event.url.pathname}${event.url.search}`, site), 308);
    }
    return next();
  },
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
