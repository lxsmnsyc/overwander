import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { Pace, admit } from '../../src/server/pace';
import { Feature } from '../../src/server/switches';
import { ADMIN_ROLE } from '../../src/auth/staff';

/**
 * The switches are read in the same statement as the ban check and the
 * paces, so what is checked here is that statement against real rows
 */

let player: Actor;

const ANY = [{ pace: Pace.Any, cost: 1 }];

beforeAll(async () => {
  await clearAll();
  player = await actor('switched');
});

afterEach(async () => {
  await sql`update switches set closed = false, message = ''`;
  await sql`update profiles set role = '' where id = ${player.uid}`;
  await sql`delete from action_paces where player = ${player.uid}`;
});

afterAll(async () => {
  await sql.end();
});

describe('switches', () => {
  it('refuse nothing while every one is open', async () => {
    expect((await admit(sql, player.uid, ANY, 0, Feature.Auctions)).closed).toBeNull();
  });

  it('refuse a call into the part that is closed, and no other', async () => {
    await sql`update switches set closed = true, message = 'Auctions are paused.' where feature = 'auctions'`;

    expect((await admit(sql, player.uid, ANY, 0, Feature.Auctions)).closed).toEqual({
      feature: Feature.Auctions,
      message: 'Auctions are paused.',
    });
    expect((await admit(sql, player.uid, ANY, 0, Feature.Trades)).closed).toBeNull();
    expect((await admit(sql, player.uid, ANY, 0)).closed).toBeNull();
  });

  it('refuse every call during maintenance, maintenance first', async () => {
    await sql`update switches set closed = true where feature in ('everything', 'auctions')`;

    expect((await admit(sql, player.uid, ANY, 0)).closed?.feature).toBe(Feature.Everything);
    expect((await admit(sql, player.uid, ANY, 0, Feature.Auctions)).closed?.feature).toBe(
      Feature.Everything,
    );
  });

  it('let staff through', async () => {
    await sql`update switches set closed = true where feature = 'everything'`;
    await sql`update profiles set role = ${ADMIN_ROLE} where id = ${player.uid}`;

    expect((await admit(sql, player.uid, ANY, 0)).closed).toBeNull();
  });

  it('are read by players and written by nobody but the owner', async () => {
    const { data } = await player.client.from('switches').select('feature');

    expect(data?.length).toBeGreaterThan(0);

    const { error } = await player.client
      .from('switches')
      .update({ closed: true })
      .eq('feature', 'auctions');

    expect(error).not.toBeNull();
  });
});
