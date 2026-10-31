import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `toLocaleString` and its kin format in whatever locale the machine
 * running them is set to, so the server and the browser disagree and
 * neither follows the language setting. Everything goes through
 * `src/i18n/format.ts` instead.
 */

const SOURCE = 'src';
const ALLOWED = join(SOURCE, 'i18n');
const MACHINE_FORMATTING = /\.toLocale(?:Date|Time)?String\(/;

function sourceFiles(folder: string, found: string[]): string[] {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);

    if (entry.isDirectory()) {
      if (path !== ALLOWED) {
        sourceFiles(path, found);
      }
    } else if (/\.tsx?$/.test(entry.name)) {
      found.push(path);
    }
  }
  return found;
}

describe('formatting', () => {
  it('never asks the machine for its locale outside src/i18n', () => {
    const offenders: string[] = [];

    for (const path of sourceFiles(SOURCE, [])) {
      if (MACHINE_FORMATTING.test(readFileSync(path, 'utf8'))) {
        offenders.push(path);
      }
    }
    expect(offenders).toEqual([]);
  });
});
