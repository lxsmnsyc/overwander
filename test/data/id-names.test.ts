import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import renderIdNames from '../../scripts/id-names';

describe('the name tables', () => {
  it('list every member of the enums they name, as `pnpm id-names` writes them', () => {
    // A member added to an enum without running the script is a name the
    // YAML cannot use yet
    expect(readFileSync('src/data/ids/names.ts', 'utf8')).toBe(renderIdNames());
  });
});
