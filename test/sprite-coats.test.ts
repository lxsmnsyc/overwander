import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Coat } from '../src/canvas/sprite-coats';
import { asSpriteCoats, coatOf, drawn } from '../src/canvas/sprite-coats';

/**
 * The list of which pokemon were drawn in which coat.
 *
 * It exists so the game stops asking for sheets that were never
 * packed, which means the one thing that matters about it is that it
 * agrees with the directories. A list that has drifted is worse than
 * none: it hides a drawing that is sitting right there.
 */

const ROOT = 'public/sprites/pokemon';
const LIST = `${ROOT}/coats.json`;

/** What is actually on disk, worked out the same way the game asks. */
function onDisk(): Map<string, Set<Coat>> {
  const found = new Map<string, Set<Coat>>();

  for (const [directory, plain, female] of [
    ['regular', 'regular', 'female'],
    ['shiny', 'shiny', 'shinyFemale'],
  ] as const) {
    for (const file of readdirSync(`${ROOT}/${directory}`)) {
      const named = /^(\d+)(_f)?\.png$/.exec(file);

      if (named == null) {
        continue;
      }
      const held = found.get(named[1]) ?? new Set<Coat>();

      held.add(file.endsWith('_f.png') ? female : plain);
      found.set(named[1], held);
    }
  }
  return found;
}

describe('the coat list', () => {
  it('ships beside the sheets', () => {
    expect(existsSync(LIST), `run \`pnpm sprite-coats\` — ${LIST} is missing`).toBe(true);
  });

  it('names every drawing that exists and nothing else', () => {
    const listed = asSpriteCoats(JSON.parse(readFileSync(LIST, 'utf8')));
    const disk = onDisk();
    const wrong: string[] = [];

    for (const [species, coats] of disk) {
      const said = new Set(listed.coats[species] ?? []);

      for (const coat of coats) {
        if (!said.has(coat)) {
          wrong.push(`${species} ${coat} is on disk and not in the list`);
        }
      }
      for (const coat of said) {
        if (!coats.has(coat)) {
          wrong.push(`${species} ${coat} is in the list and not on disk`);
        }
      }
    }
    for (const species of Object.keys(listed.coats)) {
      if (!disk.has(species)) {
        wrong.push(`${species} is in the list and has no sheet at all`);
      }
    }
    expect(wrong, 'run `pnpm sprite-coats`').toEqual([]);
  });

  it('answers for a drawing that was never packed', () => {
    const listed = asSpriteCoats(JSON.parse(readFileSync(LIST, 'utf8')));
    // Bulbasaur has no female drawing, and asking for one is the
    // request the list exists to save
    expect(drawn(listed, 1, 'regular')).toBe(true);
    expect(drawn(listed, 1, 'female')).toBe(false);
  });

  it('says yes to a species it has never heard of', () => {
    // The list records what was packed rather than what may exist, so
    // a sheet dropped in by hand is still tried
    expect(drawn(asSpriteCoats({ coats: {} }), 1, 'shiny')).toBe(true);
    expect(drawn(null, 1, 'shinyFemale')).toBe(true);
  });

  it('names a coat the way the file is named', () => {
    expect(coatOf(false, false)).toBe('regular');
    expect(coatOf(true, false)).toBe('shiny');
    expect(coatOf(false, true)).toBe('female');
    expect(coatOf(true, true)).toBe('shinyFemale');
  });
});
