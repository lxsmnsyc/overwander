import { BUILD_HEADER, STALE_BUILD_HEADER, isServerCall } from './build';
import { countServerCall } from './server-calls';

/** The stale build a reload was last asked for, so a page that comes back stale is not reloaded forever */
const RELOADED_KEY = 'stale-build-reload';

function reloadForNewBuild(): void {
  try {
    if (sessionStorage.getItem(RELOADED_KEY) === import.meta.env.VITE_BUILD_ID) {
      return;
    }
    sessionStorage.setItem(RELOADED_KEY, import.meta.env.VITE_BUILD_ID);
  } catch {
    // Without storage there is no loop guard, so one reload is still worth it
  }
  location.reload();
}

/**
 * Name this tab's build on every server call, and reload once the
 * server refuses one from a build that is no longer live. See the
 * `server-function-order` skill for why a stale call cannot just run
 */
export default function guardServerCalls(): void {
  const send = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const target = input instanceof Request ? input.url : String(input);

    if (!isServerCall(new URL(target, location.href).pathname)) {
      return send(input, init);
    }

    const request = new Request(input, init);
    const headers = new Headers(request.headers);

    headers.set(BUILD_HEADER, import.meta.env.VITE_BUILD_ID);

    // Counted as it goes out and again once it is answered, so a copy
    // read while it was in flight is not taken for one read after it
    countServerCall();
    const response = await send(new Request(request, { headers })).finally(countServerCall);

    if (response.headers.has(STALE_BUILD_HEADER)) {
      reloadForNewBuild();
      // Thrown, so the caller's failure path runs rather than reading an empty answer
      throw new Error('A new version of the game is out. Reloading.');
    }
    return response;
  };
}
