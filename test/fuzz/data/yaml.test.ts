import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readAbilities, readSignatures } from '../../../src/data/abilities/yaml';
import registerPools from '../../../src/data/biome/yaml';
import { ITEM_FAMILIES } from '../../../src/data/items';
import { readItems } from '../../../src/data/items/yaml';
import { readMoves } from '../../../src/data/moves/yaml';
import { readSpecies } from '../../../src/data/species/yaml';
import * as NAME_TABLES from '../../../src/data/ids/names';
import { readFuzzParameters } from '../arbitraries';

/**
 * The YAML registries, read the way the build reads them. A loader that
 * dropped what it did not know turned `egg-cycle` into no egg cycles at
 * all for 21 days (2760fb294). These hold every loader to refusing a
 * misspelt key wherever it is written: in place of the key, and beside
 * it, where only a strict schema notices
 */
const parameters = readFuzzParameters();

type Files = Record<string, unknown>;

/** Every name an id table answers to, which a slip can land on and still be a name */
const KNOWN_NAMES = new Set<string>();

for (const table of Object.values(NAME_TABLES)) {
  for (const name of Object.keys(table)) {
    KNOWN_NAMES.add(name);
  }
}

interface Loader {
  name: string;
  /** Each part of the registry, a folder of files keyed by path */
  parts: Record<string, Files>;
  read: (parts: Record<string, Files>) => unknown;
}

const LOADERS: Loader[] = [
  {
    name: 'species',
    parts: {
      world: import.meta.glob('/src/data/species/world/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      stats: import.meta.glob('/src/data/species/stats/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      abilities: import.meta.glob('/src/data/species/abilities/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      learnsets: import.meta.glob('/src/data/species/learnsets/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      text: import.meta.glob('/src/data/text/*/species/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
    },
    read: (parts) =>
      readSpecies({
        world: parts.world,
        stats: parts.stats,
        abilities: parts.abilities,
        learnsets: parts.learnsets,
        text: parts.text,
      }),
  },
  {
    name: 'moves',
    parts: {
      battle: import.meta.glob('/src/data/moves/battle/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
      cast: import.meta.glob('/src/data/moves/cast/**/*.yaml', { eager: true, import: 'default' }),
      text: import.meta.glob('/src/data/text/*/moves/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
    },
    read: (parts) => readMoves({ battle: parts.battle, cast: parts.cast, text: parts.text }),
  },
  {
    name: 'items',
    parts: {
      records: import.meta.glob('/src/data/items/records/*.yaml', {
        eager: true,
        import: 'default',
      }),
      text: import.meta.glob('/src/data/text/*/items/*.yaml', { eager: true, import: 'default' }),
    },
    read: (parts) => readItems({ records: parts.records, text: parts.text }, ITEM_FAMILIES),
  },
  {
    name: 'abilities',
    parts: {
      text: import.meta.glob('/src/data/text/*/abilities/**/*.yaml', {
        eager: true,
        import: 'default',
      }),
    },
    read: (parts) => readAbilities(parts.text),
  },
  {
    name: 'signatures',
    parts: {
      grants: import.meta.glob('/src/data/abilities/signatures/*.yaml', {
        eager: true,
        import: 'default',
      }),
    },
    read: (parts) => readSignatures(parts.grants),
  },
  {
    name: 'spawn pools',
    parts: {
      pools: import.meta.glob('/src/data/biome/pools/*.yaml', { eager: true, import: 'default' }),
    },
    // Registers as it reads; the same files register the same pools
    read: (parts) => {
      registerPools(parts.pools);
      return null;
    },
  },
];

/** One key somewhere in one file: the file, and the way down to the object holding it */
interface KeyAt {
  part: string;
  path: string;
  trail: (string | number)[];
  key: string;
  /** The keys written beside it, which a slip that lands on one only swaps */
  siblings: Set<string>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

/** One step down into a file: an index into a list, or a key into a map */
function descend(holder: unknown, step: string | number): unknown {
  if (Array.isArray(holder) && typeof step === 'number') {
    return holder[step];
  }
  if (isObject(holder) && typeof step === 'string') {
    return holder[step];
  }
  return null;
}

/** Every key every file of a loader writes, at any depth */
function listKeys(loader: Loader): KeyAt[] {
  const keys: KeyAt[] = [];

  function walk(at: unknown, part: string, path: string, trail: (string | number)[]): void {
    if (Array.isArray(at)) {
      for (const [index, item] of at.entries()) {
        walk(item, part, path, [...trail, index]);
      }
      return;
    }
    if (!isObject(at)) {
      return;
    }
    const siblings = new Set(Object.keys(at));

    for (const [key, value] of Object.entries(at)) {
      // An English item template is a name the file defines rather than
      // a key a schema knows: the family's code asks for it by name
      // when it writes the item's words, which is where a slip shows
      if (!(path.includes('/text/en/items/') && trail[0] === 'templates')) {
        keys.push({ part, path, trail, key, siblings });
      }
      walk(value, part, path, [...trail, key]);
    }
  }

  for (const [part, files] of Object.entries(loader.parts)) {
    for (const [path, file] of Object.entries(files)) {
      walk(file, part, path, []);
    }
  }
  return keys;
}

/**
 * The ways a key gets misspelt: a letter dropped, doubled or added, a
 * dash for an underscore. A level keeps its digits apart from the
 * slip, since one level misread as another is a level all the same
 */
function misspell(key: string, how: number): string {
  if (/^[0-9]+$/.test(key)) {
    return `${key}s`;
  }
  if (how === 0 && key.length > 1) {
    return key.slice(0, -1);
  }
  if (how === 1) {
    return `${key}${key.at(-1) ?? 'x'}`;
  }
  if (how === 2 && key.includes('-')) {
    return key.replace('-', '_');
  }
  return `${key}s`;
}

/**
 * The loader's files with one key misspelt, the rest shared untouched:
 * in its place, or written again beside it
 */
function misspellKey(
  loader: Loader,
  at: KeyAt,
  typo: string,
  beside: boolean,
): Record<string, Files> {
  const parts: Record<string, Files> = { ...loader.parts };
  const file = structuredClone(loader.parts[at.part][at.path]);
  let parent: unknown = null;
  let holder: unknown = file;

  for (const step of at.trail) {
    parent = holder;
    holder = descend(holder, step);
  }
  if (!isObject(holder)) {
    throw new Error(`${at.path}: nothing at ${at.trail.join('.')}`);
  }

  // Rebuilt in the same order, so nothing but the name changes
  const renamed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(holder)) {
    if (key === at.key && beside) {
      renamed[key] = value;
    }
    renamed[key === at.key ? typo : key] = value;
  }

  // Put back where it was read from, or as the whole file
  const last = at.trail.at(-1);
  let written: unknown = renamed;

  if (Array.isArray(parent) && typeof last === 'number') {
    parent[last] = renamed;
    written = file;
  } else if (isObject(parent) && typeof last === 'string') {
    parent[last] = renamed;
    written = file;
  }
  parts[at.part] = { ...loader.parts[at.part], [at.path]: written };
  return parts;
}

describe('the YAML registries', () => {
  for (const loader of LOADERS) {
    const keys = listKeys(loader);

    it(`refuse a misspelt key anywhere in the ${loader.name} files`, () => {
      // The files as written read, so a throw below is the misspelling's
      expect(() => loader.read(loader.parts)).not.toThrow();

      fc.assert(
        fc.property(
          fc.nat({ max: keys.length - 1 }),
          fc.nat({ max: 3 }),
          fc.boolean(),
          (index, how, beside) => {
            const at = keys[index];
            const typo = misspell(at.key, how);

            // Slipping onto another key that is there, or onto another
            // name altogether (Pawmot as Pawmo), is a swap the files
            // cannot tell from what was meant
            fc.pre(!at.siblings.has(typo) && !KNOWN_NAMES.has(typo));
            const parts = misspellKey(loader, at, typo, beside);

            expect(
              () => loader.read(parts),
              `${at.path} ${[...at.trail, at.key].join('.')} ${beside ? 'beside' : 'as'} ${typo}`,
            ).toThrow();
          },
        ),
        parameters,
      );
    });
  }
});
