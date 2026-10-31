import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { m } from '../../src/i18n/paraglide/messages.js';

/**
 * Every locale's messages file holds the keys English holds, and each
 * message asks for the parameters the English one does, so a call
 * written against English fills in every other locale too. A locale
 * may leave a key out only while its batch is still to be translated;
 * those are listed here and shrink as the batches land.
 */

const LOCALES = ['ja', 'es'] as const;

/** Keys whose batch has not been translated yet, which fall back to English */
const UNTRANSLATED = /^(?:refusal|gift_reason)_/;

type Message = string | { declarations?: string[]; match?: Record<string, string> }[];

/** A plain message, or a list of variants as the message format writes them */
function isMessage(value: unknown): value is Message {
  return typeof value === 'string' || Array.isArray(value);
}

function readMessages(locale: string): Map<string, Message> {
  const read: unknown = JSON.parse(
    readFileSync(new URL(`../../src/i18n/messages/${locale}.json`, import.meta.url), 'utf8'),
  );
  const messages = new Map<string, Message>();

  if (typeof read === 'object' && read != null) {
    for (const [key, message] of Object.entries(read)) {
      if (key !== '$schema' && isMessage(message)) {
        messages.set(key, message);
      }
    }
  }
  return messages;
}

/** The names a message asks for: its placeholders, and the inputs a variant declares */
function readParameters(message: Message): string[] {
  const found = new Set<string>();
  const texts: string[] = [];

  if (typeof message === 'string') {
    texts.push(message);
  } else {
    for (const variant of message) {
      for (const declaration of variant.declarations ?? []) {
        const input = /^input (\w+)$/.exec(declaration);

        if (input != null) {
          found.add(input[1]);
        }
      }
      for (const text of Object.values(variant.match ?? {})) {
        texts.push(text);
      }
    }
  }
  for (const text of texts) {
    for (const placeholder of text.matchAll(/\{(\w+)\}/g)) {
      found.add(placeholder[1]);
    }
  }
  return [...found].sort();
}

const english = readMessages('en');

describe.each(LOCALES)('the %s messages', (locale) => {
  const translated = readMessages(locale);

  it('hold every key English holds, and no other', () => {
    const missing: string[] = [];
    const extra: string[] = [];

    for (const key of english.keys()) {
      if (!translated.has(key) && !UNTRANSLATED.test(key)) {
        missing.push(key);
      }
    }
    for (const key of translated.keys()) {
      if (!english.has(key)) {
        extra.push(key);
      }
    }
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it('ask for the parameters the English asks for', () => {
    const differing: string[] = [];

    for (const [key, message] of translated) {
      const source = english.get(key);

      if (
        source != null &&
        readParameters(message).join(',') !== readParameters(source).join(',')
      ) {
        differing.push(key);
      }
    }
    expect(differing).toEqual([]);
  });

  it('leave no message empty', () => {
    const empty: string[] = [];

    for (const [key, message] of translated) {
      if (typeof message === 'string' && message.trim() === '') {
        empty.push(key);
      }
    }
    expect(empty).toEqual([]);
  });

  it('are said in the locale asked for', () => {
    expect(m.ow_walk_on({}, { locale })).toBe(translated.get('ow_walk_on'));
    expect(m.ow_walk_on({}, { locale })).not.toBe(m.ow_walk_on({}, { locale: 'en' }));
  });
});

describe('a plural message', () => {
  it('picks the form the count asks for', () => {
    expect(m.portal_keys({ count: 1 }, { locale: 'en' })).toBe('Portal Key');
    expect(m.portal_keys({ count: 0 }, { locale: 'en' })).toBe('Portal Keys');
    expect(m.portal_keys({ count: 2 }, { locale: 'es' })).toBe('Llaves del Portal');
  });
});
