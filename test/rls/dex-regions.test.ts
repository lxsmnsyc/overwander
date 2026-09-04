import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import Regions from '../../src/data/ids/regions';
import { Species } from '../../src/data/ids/species';
import registerData from '../../src/data';
import { dexQuestId } from '../../src/data/quests/dex';
import { recordCaughtSpecies } from '../../src/server/pokedex';
import { listQuests } from '../../src/server/quests';

/**
 * A region's dex quest counts that region's pokemon and nothing else.
 *
 * The whole of it happens in one SQL expression, which reads a dex
 * number off a stored id and holds it against the region's stretch, so
 * nothing about it can be read off the code: it takes a real player
 * with real entries.
 */

let player: Actor;

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('dex-region-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from pokedex_entries`;
  await sql`delete from quest_baselines`;
  await sql`delete from quest_claims`;
});

/** How far along that region's first dex rung the player stands */
async function held(region: Regions): Promise<number | null> {
  const quest = dexQuestId(region, 0);
  const found = (await listQuests(player.uid)).find((one) => one.quest === quest);

  return found == null ? null : found.requirements[0].have;
}

describe('a region’s dex quest', () => {
  it('does not count a pokemon of the other region', async () => {
    await recordCaughtSpecies(player.uid, Species.Chikorita, false);

    // Johto's own, so Johto's rung moves and Kanto's does not
    expect(await held(Regions.Johto)).toBe(1);
    expect(await held(Regions.Kanto)).toBe(0);

    await recordCaughtSpecies(player.uid, Species.Bulbasaur, false);

    expect(await held(Regions.Kanto)).toBe(1);
    expect(await held(Regions.Johto)).toBe(1);
  });

  it('counts a form as the pokemon it is a form of', async () => {
    // A form id is nowhere near Johto's stretch of the dex, and the
    // pokemon it stands for is
    await recordCaughtSpecies(player.uid, Species.UnownB, false);

    expect(await held(Regions.Johto)).toBe(1);
    expect(await held(Regions.Kanto)).toBe(0);

    // ...and a second letter is the same pokemon, not a second one
    await recordCaughtSpecies(player.uid, Species.UnownC, false);

    expect(await held(Regions.Johto)).toBe(1);
  });

  it('counts a shiny-only catch the same as any other', async () => {
    await recordCaughtSpecies(player.uid, Species.Meganium, true);

    expect(await held(Regions.Johto)).toBe(1);
    expect(await held(Regions.Kanto)).toBe(0);
  });
});
