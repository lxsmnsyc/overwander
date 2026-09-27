import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Actor, actor, clearAll, sql } from './clients';
import { PACE_RULES, Pace, admit } from '../../src/server/pace';

/**
 * The buckets are driven on a clock of the test's own, so what is
 * checked is the arithmetic in the statement rather than how fast the
 * machine running it is
 */

let player: Actor;

beforeAll(async () => {
  await clearAll();
  player = await actor('pacer');
});

afterAll(async () => {
  await sql.end();
});

async function clear(): Promise<void> {
  await sql`delete from action_paces where player = ${player.uid}`;
}

describe('pacing', () => {
  it('lets a burst through and refuses the next', async () => {
    await clear();

    const { burst } = PACE_RULES[Pace.Throw];

    for (let at = 0; at < burst; at += 1) {
      expect((await admit(sql, player.uid, [{ pace: Pace.Throw, cost: 1 }], at)).paced).toBe(true);
    }
    expect((await admit(sql, player.uid, [{ pace: Pace.Throw, cost: 1 }], burst)).paced).toBe(
      false,
    );
  });

  it('refills with time', async () => {
    await clear();

    const { burst, perSecond } = PACE_RULES[Pace.Throw];

    for (let at = 0; at < burst; at += 1) {
      await admit(sql, player.uid, [{ pace: Pace.Throw, cost: 1 }], at);
    }
    // One token's worth of waiting, and a throw is allowed again
    const later = burst + 1000 / perSecond;

    expect((await admit(sql, player.uid, [{ pace: Pace.Throw, cost: 1 }], later)).paced).toBe(true);
  });

  it('refuses the call when any bucket named is dry', async () => {
    await clear();

    const both = [
      { pace: Pace.Any, cost: 1 },
      { pace: Pace.Throw, cost: 1 },
    ];

    for (let at = 0; at < PACE_RULES[Pace.Throw].burst; at += 1) {
      await admit(sql, player.uid, both, at);
    }
    expect((await admit(sql, player.uid, both, 100)).paced).toBe(false);
    // The general bucket still has plenty, so a call naming only it passes
    expect((await admit(sql, player.uid, [{ pace: Pace.Any, cost: 1 }], 100)).paced).toBe(true);
  });

  it('spends a walk by its steps', async () => {
    await clear();

    const { burst, perSecond } = PACE_RULES[Pace.Steps];
    const steps = async (cost: number, at: number): Promise<{ paced: boolean }> =>
      admit(sql, player.uid, [{ pace: Pace.Steps, cost }], at);

    expect((await steps(burst, 0)).paced).toBe(true);
    // Nothing left, and a second report straight after is more than anybody walked
    expect((await steps(10, 1)).paced).toBe(false);
    // A minute of walking later, a minute's worth of steps is fine
    expect((await steps(perSecond * 60, 60_001)).paced).toBe(true);
    // A report bigger than the whole bucket never passes
    expect((await steps(burst + 1, 10_000_000)).paced).toBe(false);
  });

  it('still reports a ban', async () => {
    await sql`update profiles set banned = true where id = ${player.uid}`;

    const answer = await admit(sql, player.uid, [{ pace: Pace.Any, cost: 1 }], 10_000_000);

    expect(answer.banned).toBe(true);
    await sql`update profiles set banned = false where id = ${player.uid}`;
  });
});
