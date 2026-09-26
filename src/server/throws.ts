import 'server-only';
import { Acquisition, asCaughtPokemon } from '../auth/caught-record';
import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import { ITEM_STACKS } from '../auth/stacks';
import { BALL_ITEMS, type Balls, type Items } from '../data/ids/items';
import { WORLD_GENERATION } from '../overworld/current';
import SafariSession, {
  FEED_CATCH_BONUS,
  type SafariTally,
  ThrowResult,
  applyTally,
  asSafariTally,
  encounterKey,
  encounterWindow,
  tallyOf,
} from '../overworld/safari';
import { type SafariFacts, safariContextOf } from '../overworld/safari-context';
import { asBuddy, resolveBuddyCatch } from './buddy';
import { insertCaughtIn, payCatch } from './caught';
import { type Tx, getSql, jsonOf, tx } from './db';
import { readEncounter } from './encounter-io';
import { pocketFled } from './overworld';
import { readStackIn, spendStackIn } from './stacks';

/**
 * Throwing at and feeding a meeting, decided here.
 *
 * The browser shows the odds and plays the ball, but every roll is
 * made on the server, the ball or treat is spent in the same
 * transaction, and a meeting is claimed before it is caught. A client
 * can ask to throw; it cannot say how the throw went.
 */

/** What a throw came to, as the dialog plays it */
export interface ThrowReport {
  result: ThrowResult;
  shakes: number;
  critical: boolean;
  catchId: string | null;
  pocketed: Items | null;
  tally: SafariTally;
}

/** The facts a throw is rolled with, read the way the browser reads them for the odds */
async function readFacts(
  uid: string,
  encounter: EncounterRecord,
): Promise<{ facts: SafariFacts; buddy: [string, Record<string, unknown>] | null }> {
  const sql = getSql();
  const [owned, dex, buddy] = await Promise.all([
    sql`select 1 from caught where owner = ${uid} and species = ${encounter.species} limit 1`,
    sql`
      select count(*)::int as held from pokedex_entries
      where player = ${uid} and (caught > 0 or caught_shiny > 0)
    `,
    resolveBuddyCatch(uid),
  ]);
  const walking = buddy == null ? null : asCaughtPokemon(buddy[1]);

  return {
    facts: {
      speciesCaught: owned.length > 0,
      dex: Number(dex.at(0)?.held ?? 0),
      buddy:
        buddy == null || walking == null
          ? null
          : {
              effects: asBuddy(buddy[1]),
              species: walking.species,
              gender: walking.gender,
              level: walking.level,
            },
    },
    buddy,
  };
}

/**
 * The meeting's row, locked for the rest of the transaction, with the
 * tally and the treat it was last fed. Null when there is no such
 * meeting for this player, or when it has already been caught or has
 * run: a retired meeting takes no more throws and no more treats
 */
async function lockMeeting(
  transaction: Tx,
  uid: string,
  spawnId: string,
  encounter: EncounterRecord,
): Promise<{ tally: SafariTally | null; fed: Items | null } | null> {
  const rows = await transaction`
    select safari, fed from encounters
    where generation = ${WORLD_GENERATION} and spawn_id = ${spawnId} and player = ${uid}
    for update
  `;
  const row = rows.at(0);

  if (row == null) {
    return null;
  }

  const retired = await transaction`
    select 1 from fled_encounters
    where player = ${uid} and generation = ${WORLD_GENERATION} and key = ${encounterKey(encounter)}
  `;

  if (retired.length > 0) {
    return null;
  }
  return {
    tally: asSafariTally(row.safari),
    fed: row.fed == null ? null : Number(row.fed),
  };
}

async function saveTally(
  transaction: Tx,
  uid: string,
  spawnId: string,
  tally: SafariTally,
): Promise<void> {
  await transaction`
    update encounters set safari = ${jsonOf(transaction, tally)}
    where generation = ${WORLD_GENERATION} and spawn_id = ${spawnId} and player = ${uid}
  `;
}

/** Retire the meeting for this player, inside the throw that ended it */
async function retireIn(transaction: Tx, uid: string, encounter: EncounterRecord): Promise<void> {
  const key = encounterKey(encounter);

  await transaction`
    insert into fled_encounters (player, generation, key, window_at)
    values (${uid}, ${WORLD_GENERATION}, ${key}, ${encounterWindow(key)})
    on conflict do nothing
  `;
}

/**
 * Throw one ball at a meeting. Resolves null, spending nothing, when
 * the meeting is not this player's to throw at or the ball is not
 * carried
 */
export async function throwAt(
  uid: string,
  spawnId: string,
  ball: Balls,
  now: number,
  offset: number,
  locale: string,
): Promise<ThrowReport | null> {
  const item = BALL_ITEMS[ball] as Items | undefined;
  const stored = await readEncounter(spawnId, uid);

  if (item == null || stored == null) {
    return null;
  }

  const encounter = asEncounterRecord(stored);
  const { facts, buddy } = await readFacts(uid, encounter);

  const thrown = await tx(async (transaction) => {
    const meeting = await lockMeeting(transaction, uid, spawnId, encounter);

    if (meeting == null) {
      return null;
    }

    const held = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (!(await spendStackIn(transaction, ITEM_STACKS, uid, item, held))) {
      return null;
    }

    const session = new SafariSession(
      encounter,
      Math.random,
      safariContextOf(uid, encounter, facts),
    );

    applyTally(session, meeting.tally);
    session.chooseBall(ball);

    const result = session.throwBall();
    const tally = tallyOf(session);

    await saveTally(transaction, uid, spawnId, tally);

    let catchId: string | null = null;

    if (result !== ThrowResult.BrokeFree) {
      await retireIn(transaction, uid, encounter);
    }
    if (result === ThrowResult.Caught) {
      catchId = await insertCaughtIn(
        transaction,
        uid,
        encounter,
        ball,
        Acquisition.Caught,
        now,
        offset,
        locale,
      );
    }
    return {
      result,
      shakes: session.shakes,
      critical: session.critical,
      catchId,
      tally,
      fed: meeting.fed,
    };
  });

  if (thrown == null) {
    return null;
  }

  let pocketed: Items | null = null;

  // Paid once the meeting is claimed, which only this throw could do
  if (thrown.catchId != null) {
    const fed = thrown.fed == null ? {} : { fed: thrown.fed };

    await payCatch(uid, spawnId, { ...encounter, ...fed }, ball, now, offset, buddy);
  } else if (thrown.result === ThrowResult.Fled) {
    pocketed = await pocketFled(uid, spawnId);
  }
  return {
    result: thrown.result,
    shakes: thrown.shakes,
    critical: thrown.critical,
    catchId: thrown.catchId,
    pocketed,
    tally: thrown.tally,
  };
}

/**
 * Feed a meeting one treat. Resolves false, spending nothing, when the
 * item is no treat, is not carried, the meeting is still chewing, or
 * it is not this player's to feed
 */
export async function feedAt(uid: string, spawnId: string, item: Items): Promise<boolean> {
  const stored = await readEncounter(spawnId, uid);

  if (stored == null || FEED_CATCH_BONUS[item] == null) {
    return false;
  }

  const encounter = asEncounterRecord(stored);
  const { facts } = await readFacts(uid, encounter);

  return tx(async (transaction) => {
    const meeting = await lockMeeting(transaction, uid, spawnId, encounter);

    if (meeting == null) {
      return false;
    }

    const session = new SafariSession(
      encounter,
      Math.random,
      safariContextOf(uid, encounter, facts),
    );

    applyTally(session, meeting.tally);
    if (!session.canFeed()) {
      return false;
    }

    const held = await readStackIn(transaction, ITEM_STACKS, uid, item);

    if (!(await spendStackIn(transaction, ITEM_STACKS, uid, item, held))) {
      return false;
    }
    session.feed(item);
    await saveTally(transaction, uid, spawnId, tallyOf(session));
    // The treat is also what a Pinap pays out on at the catch
    await transaction`
      update encounters set fed = ${item}
      where generation = ${WORLD_GENERATION} and spawn_id = ${spawnId} and player = ${uid}
    `;
    return true;
  });
}
