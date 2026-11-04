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

/**
 * The opening tag a class string sits in, whole since classes wrap, or
 * null when it sits outside one: in a constant, a call, a generic
 */
function tagAround(source: string, at: number): string | null {
  const start = source.lastIndexOf('<', at);

  // The nearest `<` must start a JSX tag
  if (start === -1 || !/[A-Za-z]/.test(source[start + 1] ?? '')) {
    return null;
  }

  // A `>` that is not the arrow of `=>` between it and the match closed the tag
  if (/(?<!=)>/.test(source.slice(start, at))) {
    return null;
  }

  const rest = source.slice(at);
  const close = /(?<!=)>/.exec(rest);

  return source.slice(start, at + (close?.index ?? rest.length));
}

/** The offsets of plain gold that is not on a glyph */
function findGoldWords(source: string): number[] {
  const found: number[] = [];

  for (const match of source.matchAll(PLAIN_GOLD)) {
    const tag = tagAround(source, match.index);

    if (tag === null || !GLYPH.test(tag)) {
      found.push(match.index);
    }
  }

  return found;
}

function wordsInPlainGold(): string[] {
  const found: string[] = [];

  for (const path of sources('src')) {
    const source = readFileSync(path, 'utf8');

    for (const at of findGoldWords(source)) {
      const line = source.slice(0, at).split('\n').length;

      found.push(`${path}:${line}`);
    }
  }

  return found;
}

describe('gold in the interface', () => {
  it('sets no words in plain text-gold', () => {
    expect(wordsInPlainGold()).toEqual([]);
  });
});

describe('the gold check', () => {
  it('passes an aria-hidden icon', () => {
    expect(findGoldWords('<Icon aria-hidden="true" class="size-4 text-gold" />')).toEqual([]);
  });

  it('passes a role="img" span', () => {
    expect(findGoldWords('<span role="img" class="text-gold">***</span>')).toEqual([]);
  });

  it('passes a class wrapped across lines inside an aria-hidden tag', () => {
    const source = '<Icon\n  class="size-4\n    hover:text-gold"\n  aria-hidden="true"\n/>';

    expect(findGoldWords(source)).toEqual([]);
  });

  it('fails a span of words', () => {
    expect(findGoldWords('<span class="font-bold text-gold">Rare</span>')).toHaveLength(1);
  });

  it('fails a constant that follows an aria-hidden element', () => {
    const source = '<Icon aria-hidden="true" />\nconst LABEL = \'font-bold text-gold\';';

    expect(findGoldWords(source)).toHaveLength(1);
  });

  it('fails a class after a generic', () => {
    const source = '<Icon aria-hidden="true" />\nconst X: Array<string> = [\'text-gold\'];';

    expect(findGoldWords(source)).toHaveLength(1);
  });

  it('does not take an arrow for the end of a tag', () => {
    const source = '<button onClick={() => open()} aria-hidden="true" class="text-gold" />';

    expect(findGoldWords(source)).toEqual([]);
  });

  it('passes text-gold-dark and text-gold-soft', () => {
    expect(findGoldWords('<span class="text-gold-dark bg-gold-soft">Rare</span>')).toEqual([]);
  });
});
