import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import renderIdNames, { enumMembers } from '../../scripts/id-names';
import renderSpeciesSchemas, { SCHEMA_DIR } from '../../scripts/species-schemas';

describe('the name tables', () => {
  it('list every member of the enums they name, as `pnpm id-names` writes them', () => {
    // A member added to an enum without running the script is a name the
    // YAML cannot use yet
    expect(readFileSync('src/data/ids/names.ts', 'utf8')).toBe(renderIdNames());
  });

  it('are what the species schemas offer an editor, as `pnpm id-names` writes them', () => {
    for (const [file, schema] of renderSpeciesSchemas(enumMembers())) {
      expect(readFileSync(`${SCHEMA_DIR}/${file}`, 'utf8'), file).toBe(schema);
    }
  });
});
