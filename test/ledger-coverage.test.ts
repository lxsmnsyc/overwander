import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The ledger is written by the functions that move gold and stacks, so
 * a write anywhere else would move value the ledger never hears of.
 * This holds the rest of the server to those functions
 */

const SERVER = 'src/server';

function sources(folder: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);

    if (entry.isDirectory()) {
      found.push(...sources(path));
    } else if (path.endsWith('.ts')) {
      found.push(path);
    }
  }
  return found;
}

describe('what moves value', () => {
  it('writes gold only through the purse functions', () => {
    const outside: string[] = [];

    for (const path of sources(SERVER)) {
      if (
        path !== join(SERVER, 'profile.ts') &&
        /set\s+gold\s*=/.test(readFileSync(path, 'utf8'))
      ) {
        outside.push(path);
      }
    }
    expect(outside).toEqual([]);
  });

  it('writes stacks only through the stack functions', () => {
    const outside: string[] = [];

    for (const path of sources(SERVER)) {
      if (
        path !== join(SERVER, 'stacks.ts') &&
        /(insert\s+into|update|delete\s+from)\s+bag_(items|candies)\b/.test(
          readFileSync(path, 'utf8'),
        )
      ) {
        outside.push(path);
      }
    }
    expect(outside).toEqual([]);
  });
});
