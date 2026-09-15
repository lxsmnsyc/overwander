import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILD_HEADER, STALE_BUILD_HEADER } from '../../src/utils/build';
import guardServerCalls from '../../src/utils/stale-build';

describe('guardServerCalls', () => {
  const original = globalThis.fetch;
  const reload = vi.fn();
  const seen: Request[] = [];

  beforeEach(() => {
    seen.length = 0;
    reload.mockClear();

    const storage = new Map<string, string>();

    vi.stubGlobal('location', { href: 'http://game.test/', reload });
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
  });

  afterEach(() => {
    globalThis.fetch = original;
    vi.unstubAllGlobals();
  });

  /** Stand a fake network behind the guard, answering every request with `response` */
  const answer = (response: Response): void => {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      seen.push(new Request(input, init));
      await Promise.resolve();
      return response.clone();
    };
    guardServerCalls();
  };

  it('names the build on a server call', async () => {
    answer(new Response('ok'));
    await fetch(new Request('http://game.test/_server', { method: 'POST' }));

    expect(seen[0].headers.get(BUILD_HEADER)).toBe(import.meta.env.VITE_BUILD_ID);
  });

  it('leaves every other request alone', async () => {
    answer(new Response('ok'));
    await fetch('http://game.test/rest/v1/caught');

    expect(seen[0].headers.has(BUILD_HEADER)).toBe(false);
  });

  it('fails the call and reloads only once when the build is stale', async () => {
    answer(new Response(null, { status: 409, headers: { [STALE_BUILD_HEADER]: '1' } }));

    await expect(
      fetch(new Request('http://game.test/_server', { method: 'POST' })),
    ).rejects.toThrow();
    await expect(
      fetch(new Request('http://game.test/_server', { method: 'POST' })),
    ).rejects.toThrow();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
