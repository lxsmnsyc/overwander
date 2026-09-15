import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import registerData from '../../src/data';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import evolveCatch from '../../src/server/evolution';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';

/**
 * A Nincada at level 20 becomes a Ninjask and, with a Poke Ball in the
 * bag, leaves a Shedinja in it, run against the real database.
 */

let player: Actor;

const NINCADA = 'shed-evolution-nincada';

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('shed-evolution-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from bag_items`;
  await sql`delete from caught`;
  await sql`
    insert into caught ${sql({
      ...caughtRow(NINCADA, player.uid),
      species: Species.Nincada,
      level: 20,
      shiny: true,
    })}
  `;
});

async function carryBalls(count: number): Promise<void> {
  await sql`
    insert into bag_items (player, item, count)
    values (${player.uid}, ${Items.PokeBall}, ${count})
  `;
}

async function ownedSpecies(): Promise<number[]> {
  const rows = await sql`select species from caught where owner = ${player.uid} order by species`;
  const species: number[] = [];

  for (const row of rows) {
    species.push(Number(row.species));
  }
  return species;
}

describe('a Nincada growing up', () => {
  it('becomes a Ninjask and leaves a Shedinja in a carried Poke Ball', async () => {
    await carryBalls(2);

    expect(await evolveCatch(player.uid, NINCADA, Species.Ninjask)).toBe(Species.Ninjask);
    expect(await ownedSpecies()).toEqual([Species.Ninjask, Species.Shedinja]);

    const [husk] = await sql`
      select level, shiny from caught where owner = ${player.uid} and species = ${Species.Shedinja}
    `;
    const [balls] = await sql`
      select count from bag_items where player = ${player.uid} and item = ${Items.PokeBall}
    `;

    expect(Number(husk.level)).toBe(20);
    expect(husk.shiny).toBe(true);
    expect(Number(balls.count)).toBe(1);
  });

  it('becomes a Ninjask alone with no ball to leave the husk in', async () => {
    expect(await evolveCatch(player.uid, NINCADA, Species.Ninjask)).toBe(Species.Ninjask);
    expect(await ownedSpecies()).toEqual([Species.Ninjask]);
  });

  it('refuses to turn the Nincada itself into the husk', async () => {
    await carryBalls(1);

    expect(await evolveCatch(player.uid, NINCADA, Species.Shedinja)).toBeNull();
    expect(await ownedSpecies()).toEqual([Species.Nincada]);
  });
});
