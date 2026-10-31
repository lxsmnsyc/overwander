import type * as SolidWeb from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The server's locale comes from the request being rendered. Japanese
 * and Spanish are built but not served yet, so whatever the request
 * asks for resolves to English.
 */

const event = vi.hoisted(() => ({ current: undefined as { request: Request } | undefined }));

vi.mock('solid-js/web', async (original) => ({
  ...(await original<typeof SolidWeb>()),
  getRequestEvent: () => event.current,
}));

const { getLocale } = await import('../../src/i18n/paraglide/runtime.js');
await import('../../src/i18n/server');

afterEach(() => {
  event.current = undefined;
});

describe('the server locale', () => {
  it('is English outside a request', () => {
    expect(getLocale()).toBe('en');
  });

  it('serves English to a request for a locale still being translated', () => {
    event.current = {
      request: new Request('http://localhost/', { headers: { 'accept-language': 'ja,es;q=0.8' } }),
    };
    expect(getLocale()).toBe('en');
  });

  it('serves English for a cookie naming a locale still being translated', () => {
    event.current = {
      request: new Request('http://localhost/', { headers: { cookie: 'overwander-locale=ja' } }),
    };
    expect(getLocale()).toBe('en');
  });

  it('ignores a cookie naming a locale the game does not have', () => {
    event.current = {
      request: new Request('http://localhost/', { headers: { cookie: 'overwander-locale=xx' } }),
    };
    expect(getLocale()).toBe('en');
  });
});
