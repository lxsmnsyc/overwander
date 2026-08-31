import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import registerData from '../../src/data';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import evolveCatch from '../../src/server/evolution';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';

/**
 * What a handover opens, run against the real database.
 *
 * A trade evolution is gated on what the catch was when it last
 * changed hands, not on the bare fact that it did. The case that
 * forced the distinction is here: a Machop is traded, levelled into a
 * Machoke, and the Machoke asks to become a Machamp without a second
 * handover or a cord. The mainline answers no, and so does this.
 */

let player: Actor;

const MACHOP = 'trade-evolution-machop';

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('trade-evolution-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from bag_items`;
  await sql`delete from caught`;
});

/**
 * A Machop of the player's, at the level its first evolution asks for,
 * as a swap for `against` would have left it
 */
async function plantMachop(against: Species | null): Promise<void> {
  await sql`
    insert into caught ${sql({
      ...caughtRow(MACHOP, player.uid),
      species: Species.Machop,
      level: 28,
      traded: against != null,
      traded_as: against == null ? null : Species.Machop,
      traded_for: against,
    })}
  `;
}

async function speciesOf(): Promise<number> {
  const [row] = await sql`select species from caught where id = ${MACHOP}`;

  return Number(row.species);
}

describe('a trade and the stage it was made at', () => {
  it('lets a traded Machop become a Machoke, which is a level evolution', async () => {
    await plantMachop(Species.Abra);

    expect(await evolveCatch(player.uid, MACHOP, Species.Machoke)).toBe(Species.Machoke);
    expect(await speciesOf()).toBe(Species.Machoke);
  });

  it('refuses the Machamp the trade was never made for', async () => {
    await plantMachop(Species.Abra);
    await evolveCatch(player.uid, MACHOP, Species.Machoke);

    // The trade happened to a Machop, and a Machop has no trade
    // evolution. What became a Machoke afterwards is owed nothing by
    // it: becoming a Machamp asks for a handover of its own
    expect(await evolveCatch(player.uid, MACHOP, Species.Machamp)).toBeNull();
    expect(await speciesOf()).toBe(Species.Machoke);
  });

  it('still lets a Machoke that changed hands as a Machoke become a Machamp', async () => {
    await sql`
      insert into caught ${sql({
        ...caughtRow(MACHOP, player.uid),
        species: Species.Machoke,
        level: 28,
        traded: true,
        traded_as: Species.Machoke,
        traded_for: Species.Abra,
      })}
    `;

    expect(await evolveCatch(player.uid, MACHOP, Species.Machamp)).toBe(Species.Machamp);
  });

  it('takes a Linking Cord from the Machoke whose handover came too early', async () => {
    await plantMachop(Species.Abra);
    await evolveCatch(player.uid, MACHOP, Species.Machoke);
    await sql`
      insert into bag_items (player, item, count)
      values (${player.uid}, ${Items.LinkingCord}, 1)
    `;

    // The cord is what a pokemon with no handover of its own pays,
    // and a handover made at the wrong stage is no handover of its own
    expect(await evolveCatch(player.uid, MACHOP, Species.Machamp)).toBe(Species.Machamp);

    const [stock] = await sql`
      select count from bag_items where player = ${player.uid} and item = ${Items.LinkingCord}
    `;

    expect(stock).toBeUndefined();
  });
});
