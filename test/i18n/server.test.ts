import type * as SolidWeb from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The server's locale comes from the request being rendered. Only
 * English exists so far, so whatever the request asks for resolves to
 * it; what this holds is that a request is read, and read once.
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

  it('falls back to English for a language the game does not have', () => {
    event.current = {
      request: new Request('http://localhost/', { headers: { 'accept-language': 'ja,es;q=0.8' } }),
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
