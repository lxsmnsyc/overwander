/** The header a tab names its build in, on every server call */
export const BUILD_HEADER = 'X-Build';

/** The header the server refuses a call from another build with */
export const STALE_BUILD_HEADER = 'X-Stale-Build';

/** Whether a request path is SolidStart's server function endpoint */
export function isServerCall(pathname: string): boolean {
  return pathname.endsWith('/_server');
}
