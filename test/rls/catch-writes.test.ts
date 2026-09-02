import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type Actor, actor, caughtRow, clearAll, sql } from './clients';
import { Acquisition, asCaughtPokemon } from '../../src/auth/caught-record';
import { Moves } from '../../src/data/ids/moves';
import { readCaughtIn, updateCaughtIn } from '../../src/server/caught-io';
import { tx } from '../../src/server/db';
import registerData from '../../src/data';

/**
 * The writes that touch a catch's child tables, against the real
 * database.
 *
 * Both of these land in one statement rather than one a row, so what
 * has to be checked is that the statement says what the loop said: the
 * points that moved, the points that did not, and a history that is
 * still in the order it was handed over in.
 */

let player: Actor;

beforeAll(async () => {
  registerData();
  await clearAll();
  player = await actor('writes-player');
});

afterAll(async () => {
  await sql.end();
});

beforeEach(async () => {
  await sql`delete from caught`;
});

/** One of the player's, knowing three moves */
async function put(id: string): Promise<void> {
  await sql`insert into caught ${sql(caughtRow(id, player.uid))}`;
  await sql`
    insert into caught_moves ${sql(
      [
        { caught_id: id, slot: 0, move: Moves.Tackle, points: 0 },
        { caught_id: id, slot: 1, move: Moves.Growl, points: 2 },
        { caught_id: id, slot: 2, move: Moves.QuickAttack, points: 3 },
      ],
      'caught_id',
      'slot',
      'move',
      'points',
    )}
  `;
}

describe('the points spent on a move', () => {
  it('are written in one statement, and the rest are cleared', async () => {
    await put('write-points');
    await tx(async (transaction) => {
      await updateCaughtIn(transaction, 'write-points', {
        movePoints: { [String(Moves.Tackle)]: 3, [String(Moves.Growl)]: 1 },
      });
    });

    const stored = await tx(async (transaction) =>
      readCaughtIn(transaction, 'write-points', false, ['moves']),
    );

    // The two named moved, and the one left out went back to nothing
    expect(stored?.movePoints).toEqual({
      [String(Moves.Tackle)]: 3,
      [String(Moves.Growl)]: 1,
    });
    // The moves themselves are untouched by a points-only write
    expect(stored?.moves).toEqual([Moves.Tackle, Moves.Growl, Moves.QuickAttack]);
  });

  it('clear entirely when nothing is spent', async () => {
    await put('write-none');
    await tx(async (transaction) => {
      await updateCaughtIn(transaction, 'write-none', { movePoints: {} });
    });

    const stored = await tx(async (transaction) =>
      readCaughtIn(transaction, 'write-none', false, ['moves']),
    );

    expect(stored?.movePoints).toEqual({});
  });
});

describe('the hands a pokemon has passed through', () => {
  it('append in order, however many arrive at once', async () => {
    await put('write-hands');

    const entry = (owner: string, kind: Acquisition): Record<string, unknown> => ({
      owner,
      acquiredAt: '2026-08-20T12:00:00.000+08:00',
      kind,
      paid: null,
      ball: null,
    });

    // Two at once, which the loop wrote one at a time
    await tx(async (transaction) => {
      await updateCaughtIn(transaction, 'write-hands', {
        history: [entry(player.uid, Acquisition.Caught), entry('OT/Kanto', Acquisition.Gift)],
      });
    });
    // And a third afterwards: only what is past the stored count is
    // written, so the first two are not inserted twice
    await tx(async (transaction) => {
      await updateCaughtIn(transaction, 'write-hands', {
        history: [
          entry(player.uid, Acquisition.Caught),
          entry('OT/Kanto', Acquisition.Gift),
          entry(player.uid, Acquisition.Trade),
        ],
      });
    });

    const stored = await tx(async (transaction) =>
      readCaughtIn(transaction, 'write-hands', false, ['history']),
    );
    const history = asCaughtPokemon(stored).history;

    expect(history.map((hand) => hand.owner)).toEqual([player.uid, 'OT/Kanto', player.uid]);
    expect(history.map((hand) => hand.kind)).toEqual([
      Acquisition.Caught,
      Acquisition.Gift,
      Acquisition.Trade,
    ]);
  });
});
