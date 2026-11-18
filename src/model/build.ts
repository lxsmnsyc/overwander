/** Where Solid serves its server functions */
const SERVER_ENDPOINT = '/_server/';

/**
 * The header Solid's runtime answers with when a call names a function
 * or a build the live server does not have
 */
export const UNKNOWN_FUNCTION_HEADER = 'X-Server-Function-Unknown';

/**
 * The header Solid names a build in: the tab's on each call, and the
 * live one on its answer refusing another build
 */
export const SOLID_BUILD_HEADER = 'X-Server-Function-Build';

/**
 * The server function a request path calls, or null when it is not a
 * server call. Solid addresses one as `/_server/<id>`, with `data/` or
 * `live/` between for ordinary calls and the live wire
 */
export function getServerCallId(pathname: string): string | null {
  if (!pathname.startsWith(SERVER_ENDPOINT)) {
    return null;
  }

  // The id is the one segment left once the kind of call is taken off
  let segment = pathname.slice(SERVER_ENDPOINT.length);

  for (const kind of ['data/', 'live/']) {
    if (segment.startsWith(kind)) {
      segment = segment.slice(kind.length);
      break;
    }
  }
  if (segment === '' || segment.includes('/')) {
    return null;
  }
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}
