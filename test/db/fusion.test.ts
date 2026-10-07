import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import registerData from '../../src/data';
import { Items } from '../../src/data/ids/items';
import { Species } from '../../src/data/ids/species';
import { fuseCatch, unfuseCatch } from '../../src/server/fusion';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';

/**
 * Folding a Solgaleo into a Necrozma and back, run against the real
 * database: every joining and every parting spends one N-Solarizer.
 */

let player: Actor;

const NECROZMA = 'fusion-necrozma';
const SOLGALEO = 'fusion-solgaleo';

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('fusion-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from bag_items`;
  await sql`delete from caught`;
  await sql`
    insert into caught ${sql([
      { ...caughtRow(NECROZMA, player.uid), species: Species.Necrozma },
      { ...caughtRow(SOLGALEO, player.uid), species: Species.Solgaleo },
    ])}
  `;
});

async function carry(count: number): Promise<void> {
  await sql`
    insert into bag_items (player, item, count)
    values (${player.uid}, ${Items.NSolarizer}, ${count})
  `;
}

async function carried(): Promise<number> {
  const rows = await sql`
    select count from bag_items where player = ${player.uid} and item = ${Items.NSolarizer}
  `;

  return rows.length === 0 ? 0 : Number(rows[0].count);
}

describe('a fusion item', () => {
  it('is spent joining the pair and again parting them', async () => {
    await carry(2);

    expect(await fuseCatch(player.uid, NECROZMA, SOLGALEO, Species.NecrozmaDuskMane)).toBe(
      Species.NecrozmaDuskMane,
    );
    expect(await carried()).toBe(1);

    expect(await unfuseCatch(player.uid, NECROZMA)).toBe(Species.Necrozma);
    expect(await carried()).toBe(0);
  });

  it('refuses with none left, and changes nothing', async () => {
    expect(await fuseCatch(player.uid, NECROZMA, SOLGALEO, Species.NecrozmaDuskMane)).toBeNull();

    const [row] = await sql`select species from caught where id = ${NECROZMA}`;

    expect(Number(row.species)).toBe(Species.Necrozma);
  });

  it('keeps the pair together when there is none to part them with', async () => {
    await carry(1);

    expect(await fuseCatch(player.uid, NECROZMA, SOLGALEO, Species.NecrozmaDuskMane)).toBe(
      Species.NecrozmaDuskMane,
    );
    expect(await unfuseCatch(player.uid, NECROZMA)).toBeNull();
    expect(await carried()).toBe(0);
  });

  it('is not spent on a refused joining', async () => {
    await carry(1);
    await sql`
      insert into caught ${sql({ ...caughtRow('fusion-lunala', player.uid), species: Species.Lunala })}
    `;

    // The right item, the wrong partner: a Lunala is not folded in by it
    expect(
      await fuseCatch(player.uid, NECROZMA, 'fusion-lunala', Species.NecrozmaDuskMane),
    ).toBeNull();
    expect(await carried()).toBe(1);
  });
});
