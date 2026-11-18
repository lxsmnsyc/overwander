import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UNKNOWN_FUNCTION_HEADER } from '../../src/model/build';
import guardServerCalls from '../../src/auth/stale-build';
import { readOnly, serverCallsSeen } from '../../src/auth/server-calls';

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
  function answer(response: Response): void {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      seen.push(new Request(input, init));
      await Promise.resolve();
      return response.clone();
    };
    guardServerCalls();
  }

  /** A call as Solid's client sends it, with the headers it stamps */
  async function call(id: string): Promise<Response> {
    return fetch(`http://game.test/_server/data/${id}`, {
      method: 'POST',
      headers: { 'X-Server-Function-Build': 'abc' },
    });
  }

  it('passes a server call through untouched', async () => {
    answer(new Response('ok'));
    const response = await call('save-1a2b3c4d');

    expect(await response.text()).toBe('ok');
    expect(seen[0].headers.get('X-Server-Function-Build')).toBe('abc');
  });

  it('counts a call that may change something, going out and coming back', async () => {
    answer(new Response('ok'));
    const before = serverCallsSeen();

    await call('save-1a2b3c4d');
    expect(serverCallsSeen()).toBe(before + 2);
  });

  it('does not count a registered read', async () => {
    answer(new Response('ok'));
    readOnly({ id: 'readBag-1a2b3c4d' });
    const before = serverCallsSeen();

    await call('readBag-1a2b3c4d');
    expect(serverCallsSeen()).toBe(before);
  });

  it('leaves every other request alone', async () => {
    answer(new Response('ok'));
    const before = serverCallsSeen();

    await fetch('http://game.test/rest/v1/caught');
    expect(serverCallsSeen()).toBe(before);
  });

  it('fails the call and reloads only once when the build is another', async () => {
    answer(new Response(null, { status: 409, headers: { [UNKNOWN_FUNCTION_HEADER]: 'true' } }));

    await expect(call('save-1a2b3c4d')).rejects.toThrow();
    await expect(call('save-1a2b3c4d')).rejects.toThrow();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads again for each new build the server names', async () => {
    answer(
      new Response(null, {
        status: 409,
        headers: { [UNKNOWN_FUNCTION_HEADER]: 'true', 'X-Server-Function-Build': 'first' },
      }),
    );
    await expect(call('save-1a2b3c4d')).rejects.toThrow();

    globalThis.fetch = original;
    answer(
      new Response(null, {
        status: 409,
        headers: { [UNKNOWN_FUNCTION_HEADER]: 'true', 'X-Server-Function-Build': 'second' },
      }),
    );
    await expect(call('save-1a2b3c4d')).rejects.toThrow();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it('reloads when the function is gone', async () => {
    answer(new Response(null, { status: 404, headers: { [UNKNOWN_FUNCTION_HEADER]: 'true' } }));

    await expect(call('removed-1a2b3c4d')).rejects.toThrow();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload on an ordinary failure', async () => {
    answer(new Response(null, { status: 500 }));
    const response = await call('save-1a2b3c4d');

    expect(response.status).toBe(500);
    expect(reload).not.toHaveBeenCalled();
  });
});
