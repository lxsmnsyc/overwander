import type * as SolidWeb from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The server's locale comes from the request being rendered: the
 * player's cookie, then `Accept-Language`, then English.
 */

const event = vi.hoisted(() => ({ current: undefined as { request: Request } | undefined }));

vi.mock('solid-js/web', async (original) => ({
  ...(await original<typeof SolidWeb>()),
  getRequestEvent: () => event.current,
}));

// Read through the module rather than destructured: `server.ts` swaps
// `getLocale` for its own, and a destructured copy keeps the original
const runtime = await import('../../src/i18n/paraglide/runtime.js');
await import('../../src/i18n/server');

afterEach(() => {
  event.current = undefined;
});

describe('the server locale', () => {
  it('is English outside a request', () => {
    expect(runtime.getLocale()).toBe('en');
  });

  it('serves the language a request asks for', () => {
    event.current = {
      request: new Request('http://localhost/', { headers: { 'accept-language': 'ja,es;q=0.8' } }),
    };
    expect(runtime.getLocale()).toBe('ja');
  });

  it('serves the language the cookie names over the request', () => {
    event.current = {
      request: new Request('http://localhost/', {
        headers: { cookie: 'overwander-locale=es', 'accept-language': 'ja' },
      }),
    };
    expect(runtime.getLocale()).toBe('es');
  });

  it('ignores a cookie naming a locale the game does not have', () => {
    event.current = {
      request: new Request('http://localhost/', { headers: { cookie: 'overwander-locale=xx' } }),
    };
    expect(runtime.getLocale()).toBe('en');
  });
});
