import type { StartMiddleware } from '@solidjs/vite-plugin';
import { createAPIHandler } from 'filesystem-routing/api';
import routes from 'virtual:file-routes';
import { BUILD_HEADER, STALE_BUILD_HEADER, isStaleCall } from '../model/build';

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
 * A visit over plain http is sent to https: sign-in trusts only the
 * https origin, so from http it refuses the page's return address
 */
const redirectToHttps: StartMiddleware = async (event, next) => {
  const site = secureSite();
  const url = new URL(event.request.url);

  // The site's own address rather than the request's, which behind
  // the tunnel is the container's
  if (site != null && visitedOverHttp(event.request.headers)) {
    return Response.redirect(new URL(`${url.pathname}${url.search}`, site), 308);
  }
  return next();
};

/**
 * Refuse a server call from any build but the live one, before any
 * function runs. A function keeps its id while its parameters change,
 * so an old tab's call could reach it with the old arguments. The tab
 * reloads on the refusal.
 *
 * A call that names no build is refused too. Every tab since the guard
 * shipped names its build, so one that does not is either from before
 * it or not the game at all. Refusing both is what lets a deploy
 * remove or change server functions: no call from another build ever
 * reaches one
 */
const refuseStaleCalls: StartMiddleware = async (event, next) => {
  if (
    isStaleCall(
      new URL(event.request.url).pathname,
      event.request.headers.get(BUILD_HEADER),
      import.meta.env.VITE_BUILD_ID,
    )
  ) {
    return new Response(null, { status: 409, headers: { [STALE_BUILD_HEADER]: '1' } });
  }
  return next();
};

export default [
  redirectToHttps,
  refuseStaleCalls,
  // The uppercase exports of route modules (Better Auth's handler)
  createAPIHandler(routes),
] satisfies StartMiddleware[];
