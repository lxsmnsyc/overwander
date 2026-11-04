import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The board's gold is a fill colour and reads at about 1.9:1 on white.
 * Words in gold use `text-gold-dark`, and plain `text-gold` is for
 * glyphs: an element that is hidden from assistive tech, or drawn as an
 * image with a label of its own (`role="img"`), such as a row of stars
 */

const PLAIN_GOLD = /(?<![\w-])(?:[a-z-]+:)*text-gold(?![\w-])/g;
const GLYPH = /aria-hidden="true"|role="img"/;

function sources(folder: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);

    if (entry.isDirectory()) {
      found.push(...sources(path));
    } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      found.push(path);
    }
  }

  return found;
}

/** The opening tag a class string sits in, whole, since classes wrap */
function tagAround(source: string, at: number): string {
  const start = source.lastIndexOf('<', at);
  const rest = source.slice(at);
  // The first `>` that is not the arrow of `=>`
  const close = /(?<!=)>/.exec(rest);

  return source.slice(Math.max(start, 0), at + (close?.index ?? rest.length));
}

function wordsInPlainGold(): string[] {
  const found: string[] = [];

  for (const path of sources('src')) {
    const source = readFileSync(path, 'utf8');

    for (const match of source.matchAll(PLAIN_GOLD)) {
      if (!GLYPH.test(tagAround(source, match.index))) {
        const line = source.slice(0, match.index).split('\n').length;

        found.push(`${path}:${line} ${match[0]}`);
      }
    }
  }

  return found;
}

describe('gold in the interface', () => {
  it('sets no words in plain text-gold', () => {
    expect(wordsInPlainGold()).toEqual([]);
  });
});
