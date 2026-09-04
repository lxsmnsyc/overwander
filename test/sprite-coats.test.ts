import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Coat } from '../src/canvas/sprite-coats';
import { asSpriteCoats, coatOf, drawn, stamped } from '../src/canvas/sprite-coats';

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

/** What each coat's drawing is called inside a pokemon's folder. */
const COATS: [Coat, string][] = [
  ['regular', 'regular.png'],
  ['shiny', 'shiny.png'],
  ['female', 'female.png'],
  ['shinyFemale', 'shiny_female.png'],
];

/** What is actually on disk, worked out the same way the game asks. */
function onDisk(): Map<string, Set<Coat>> {
  const found = new Map<string, Set<Coat>>();

  const regions = readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const region of regions) {
    for (const folder of readdirSync(`${ROOT}/${region}`)) {
      if (!/^\d+$/.test(folder)) {
        continue;
      }
      const held = new Set(readdirSync(`${ROOT}/${region}/${folder}`));
      const coats = new Set(COATS.filter(([, file]) => held.has(file)).map(([coat]) => coat));

      if (coats.size > 0) {
        found.set(folder, coats);
      }
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

  it('stamps every pokemon it lists', () => {
    const listed = asSpriteCoats(JSON.parse(readFileSync(LIST, 'utf8')));

    for (const species of Object.keys(listed.coats)) {
      expect(listed.stamps[species], `${species} has no stamp`).toMatch(/^[0-9a-f]{8}$/);
    }
    // The stamp is what makes a repacked sheet a new address, so two
    // pokemon drawn differently must not share one
    const marks = Object.values(listed.stamps);

    expect(new Set(marks).size, 'stamps collide').toBe(marks.length);
    expect(stamped('/sprites/pokemon/kanto/1/sheet.json', listed, 1)).toBe(
      `/sprites/pokemon/kanto/1/sheet.json?v=${listed.stamps['1']}`,
    );
    // A sheet nobody has recorded is asked for by its plain address
    expect(stamped('/sprites/pokemon/kanto/9999/sheet.json', listed, 9999)).toBe(
      '/sprites/pokemon/kanto/9999/sheet.json',
    );
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
