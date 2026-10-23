/** The header a tab names its build in, on every server call */
export const BUILD_HEADER = 'X-Build';

/** The header the server refuses a call from another build with */
export const STALE_BUILD_HEADER = 'X-Stale-Build';

/** Whether a request path is SolidStart's server function endpoint */
export function isServerCall(pathname: string): boolean {
  return pathname.endsWith('/_server');
}

/**
 * Whether a request is a server call from any build but the live one.
 * A call that names no build is one of them: every tab since the guard
 * shipped names its own
 */
export function isStaleCall(pathname: string, sent: string | null, live: string): boolean {
  return isServerCall(pathname) && sent !== live;
}
