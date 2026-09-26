/**
 * What the browser downloads from Supabase, measured in development.
 *
 * The free plan's limit that a small game actually reaches is egress,
 * not requests, so this is the number to watch while making a screen
 * read less. Every read is logged with its size, and the running total
 * is on `globalThis.supabaseTraffic` for the console.
 */

export interface Traffic {
  requests: number;
  bytes: number;
  /** Bytes by table or function, so the heaviest reader stands out */
  byPath: Record<string, number>;
  reset: () => void;
}

declare global {
  // oxlint-disable-next-line no-var
  var supabaseTraffic: Traffic | undefined;
}

function tally(): Traffic {
  globalThis.supabaseTraffic ??= {
    requests: 0,
    bytes: 0,
    byPath: {},
    reset() {
      this.requests = 0;
      this.bytes = 0;
      this.byPath = {};
    },
  };
  return globalThis.supabaseTraffic;
}

/** The table or function a request is for, without the query string */
export function trafficPath(url: string): string {
  const path = new URL(url).pathname;
  const named = /\/(?:rest|auth|storage|functions)\/v1\/(.+)$/.exec(path);

  return named?.[1] ?? path;
}

/**
 * A fetch that measures what comes back. The body is read from a
 * clone, so the caller's own read is untouched
 */
export default function measuredFetch(
  base: typeof fetch = fetch,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return async (input, init) => {
    const response = await base(input, init);
    const url = input instanceof Request ? input.url : String(input);
    const path = trafficPath(url);

    response
      .clone()
      .arrayBuffer()
      .then((body) => {
        const traffic = tally();

        traffic.requests += 1;
        traffic.bytes += body.byteLength;
        traffic.byPath[path] = (traffic.byPath[path] ?? 0) + body.byteLength;
        // oxlint-disable-next-line no-console
        console.debug(
          `[supabase] ${init?.method ?? 'GET'} ${path} ${(body.byteLength / 1024).toFixed(1)} KB`,
        );
      })
      .catch(() => {
        // An unreadable body is one this tally goes without
      });
    return response;
  };
}
