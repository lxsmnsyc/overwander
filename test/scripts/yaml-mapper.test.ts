import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import transformYaml from '../../scripts/yaml-mapper/transform.ts';

/**
 * The content mapper types a YAML import from the JSON it hands
 * TypeScript, so that JSON has to be the value the build serves, or
 * the types describe data the game never reads.
 */

function yamlFiles(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      found.push(...yamlFiles(path));
    } else if (entry.name.endsWith('.yaml')) {
      found.push(path);
    }
  }
  return found;
}

describe('the YAML content mapper', () => {
  it('hands TypeScript the value the build serves, for every data file', () => {
    for (const file of yamlFiles('src')) {
      const content = readFileSync(file, 'utf8');
      const { text, diagnostics } = transformYaml(content);

      expect(diagnostics, file).toEqual([]);
      expect(JSON.parse(text), file).toEqual(parse(content));
    }
  });

  it('maps each value back to where the YAML wrote it', () => {
    const content = 'Fire:\n  types: [Fire]\nalias: &a 3\nagain: *a\n';
    const { text, mappings } = transformYaml(content);
    const written: [string, string][] = [];

    for (const [virtualStart, virtualLength, originalStart, originalLength] of mappings) {
      written.push([
        text.slice(virtualStart, virtualStart + virtualLength),
        content.slice(originalStart, originalStart + originalLength).trim(),
      ]);
    }
    expect(text).toBe('{"Fire":{"types":["Fire"]},"alias":3,"again":3}');
    expect(written).toEqual([
      ['"Fire"', 'Fire'],
      ['"types"', 'types'],
      ['"Fire"', 'Fire'],
      ['"alias"', 'alias'],
      ['3', '3'],
      ['"again"', 'again'],
      // The alias is written out in full, pointing at the anchored value
      ['3', '3'],
    ]);
  });

  it('reports a file that does not parse inside the file, even at its very end', () => {
    const content = 'Broken: [a, b\n';
    const { text, diagnostics } = transformYaml(content);

    expect(text).toBe('null');
    expect(diagnostics.length).toBeGreaterThan(0);
    for (const { start, length } of diagnostics) {
      expect(start + length).toBeLessThanOrEqual(content.length);
      expect(length).toBeGreaterThan(0);
    }
  });
});
