import { SOLID_BUILD_HEADER, UNKNOWN_FUNCTION_HEADER, getServerCallId } from '../model/build';
import { countServerCall } from './server-calls';
import { refuse } from '../model/refusal';

/** The stale build a reload was last asked for, so a page that comes back stale is not reloaded forever */
const RELOADED_KEY = 'stale-build-reload';

/**
 * Reload once for the build that answered. `build` is the live build
 * the server named, when it named one; two builds of one commit share
 * `VITE_BUILD_ID`, so that is only the fallback
 */
export function reloadForNewBuild(build: string | null = null): void {
  const live = build ?? import.meta.env.VITE_BUILD_ID;

  try {
    if (sessionStorage.getItem(RELOADED_KEY) === live) {
      return;
    }
    sessionStorage.setItem(RELOADED_KEY, live);
  } catch {
    // Without storage there is no loop guard, so one reload is still worth it
  }
  location.reload();
}

/**
 * Count every server call, and reload once the server answers that it
 * does not know the function or this tab's build. Solid stamps the
 * build on each call and refuses one from another build, but its
 * client only throws. See the `server-function-order` skill
 */
export default function guardServerCalls(): void {
  const send = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const target = input instanceof Request ? input.url : String(input);
    const id = getServerCallId(new URL(target, location.href).pathname);

    if (id == null) {
      return send(input, init);
    }

    // Counted as it goes out and again once it is answered, so a copy
    // read while it was in flight is not taken for one read after it
    countServerCall(id);
    const response = await send(input, init).finally(() => {
      countServerCall(id);
    });

    // Thrown, so the caller's failure path runs rather than reading an empty answer
    if (response.headers.has(UNKNOWN_FUNCTION_HEADER)) {
      reloadForNewBuild(response.headers.get(SOLID_BUILD_HEADER));
      throw refuse('new-version');
    }
    return response;
  };
}
