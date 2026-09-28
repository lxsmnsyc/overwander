/**
 * Writes the compact species rows under src/data/species/compact from
 * the source files under src/data/species/gen-*. Run after editing a
 * species: `pnpm species-compact`.
 *
 * The source uses const enums, which Node cannot strip, so it is run
 * through Vite's module runner rather than imported directly.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { runnerImport } from 'vite';
import type * as Source from '../src/data/species/source.ts';

const root = new URL('..', import.meta.url).pathname;
const out = `${root}src/data/species/compact`;

const { module } = await runnerImport<typeof Source>('/src/data/species/source.ts', {
  root,
  configFile: false,
  logLevel: 'error',
});

mkdirSync(out, { recursive: true });
for (const region of module.compactSource()) {
  for (const [file, text] of module.compactFiles(region)) {
    writeFileSync(`${out}/${file}`, text);
  }
  console.log(`${region.name}: ${region.records.length} species`);
}
