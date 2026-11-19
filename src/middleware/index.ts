import type { StartMiddleware } from '@solidjs/vite-plugin';
import { createAPIHandler } from 'filesystem-routing/api';
import routes from 'virtual:file-routes';

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

export default [
  redirectToHttps,
  // The uppercase exports of route modules (Better Auth's handler)
  createAPIHandler(routes),
] satisfies StartMiddleware[];
