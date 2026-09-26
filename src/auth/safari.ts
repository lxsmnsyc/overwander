import type { PlayerIdentity } from '../auth/user';
import { BALL_ITEMS, type Balls, type Items } from '../data/ids/items';
import SafariSession, {
  FEED_CATCH_BONUS,
  SafariState,
  type SafariTally,
  ThrowResult,
  applyTally,
  asSafariTally,
  encounterKey,
} from '../overworld/safari';
import { safariContextOf } from '../overworld/safari-context';
import { requireUid } from '../server/auth';
import { Pace } from '../server/pace';
import check, { GAME_ID, ID, LOCALE, OFFSET, TOKEN } from '../server/validate';
import { type ThrowReport, feedAt, throwAt } from '../server/throws';
import { WORLD_GENERATION } from '../overworld/current';
import { buddyEffectsOf, resolveBuddy } from './buddy';
import { hasCaughtSpecies } from './caught';
import { getCaughtSpeciesCount } from './pokedex';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import type { EncounterRecord } from './encounter-record';
import getSupabase from './supabase';
import { getInventory } from './inventory';
import getIdToken from './session';

/**
 * Open a safari session on an encounter for the signed-in user. It is
 * the browser's copy: it shows the odds and plays each ball, while
 * every throw and treat is decided on the server (`throwOnServer`)
 */
export async function createSafariSession(
  user: PlayerIdentity,
  encounter: EncounterRecord,
): Promise<SafariSession<EncounterRecord>> {
  // Five questions, none of which is an answer to another: asked
  // together, the dialog opens on one round trip rather than on five.
  //
  // The Repeat Ball wants to know whether this species is in the
  // records; the Level and Love Balls are thrown from behind the
  // buddy, so who that is comes too; how much of the dex is filled
  // decides how often a ball holds on the first shake; the bag says
  // whether there is anything left to throw; and the tally is what the
  // server has on the meeting so far
  const [speciesCaught, walking, dex, balls, tally] = await Promise.all([
    hasCaughtSpecies(user.uid, encounter.species),
    resolveBuddy(user.uid),
    getCaughtSpeciesCount(user.uid),
    countBalls(user.uid),
    readTally(encounter.spawn),
  ]);
  const session = new SafariSession(
    encounter,
    // Never rolled here: the server's answer is applied instead
    Math.random,
    safariContextOf(user.uid, encounter, {
      speciesCaught,
      dex,
      buddy:
        walking == null
          ? null
          : {
              effects: buddyEffectsOf(walking[1]),
              species: walking[1].species,
              gender: walking[1].gender,
              level: walking[1].level,
            },
    }),
  );

  // Picked up where the server has it: a meeting thrown at, fed or
  // walked away from carries its bonus and its wear into the next look
  applyTally(session, tally);

  // What the bag holds is the session's own business only so far as
  // knowing whether there is anything left to throw; the throw itself
  // no longer asks
  session.ballsLeft = balls;
  return session;
}

/**
 * Every ball the player carries, all kinds counted together
 */
export async function countBalls(uid: string): Promise<number> {
  const balls = new Set<Items>(Object.values(BALL_ITEMS));
  const inventory = await getInventory(uid);

  let total = 0;

  for (const entry of inventory) {
    if (balls.has(entry.item)) {
      total += entry.amount;
    }
  }
  return total;
}

/**
 * Everything that has run from this player and is still worth
 * remembering, as encounter keys. The map asks once per window and
 * checks every spawn it is about to draw against the set
 */
export async function getRetiredKeys(uid: string): Promise<Set<string>> {
  const { data } = await getSupabase()
    .from('fled_encounters')
    .select('key')
    .eq('player', uid)
    .eq('generation', WORLD_GENERATION);

  const keys = new Set<string>();

  for (const row of data ?? []) {
    keys.add(String(row.key));
  }
  return keys;
}

/**
 * Whether this encounter is over for this player — it ran off, or it
 * was caught. The overworld must not offer it again either way
 */
export async function isEncounterRetired(
  uid: string,
  encounter: EncounterRecord,
): Promise<boolean> {
  return (await getRetiredKeys(uid)).has(encounterKey(encounter));
}

/**
 * Retired: a ball is spent by the throw itself now (`throwOnServer`).
 * A tab from before still calls this slot, and is told it has nothing
 * to throw rather than losing a ball to a catch it can no longer write
 */
export async function spendBall(token: string, ball: Balls): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(GAME_ID, ball);
  await requireUid(token);
  return false;
}

/**
 * Feed the meeting one treat, on the server's own tally. Resolves
 * false, spending nothing, when it is not carried, is no treat, or
 * the meeting is still chewing the last one
 */
async function spendFeed(token: string, spawn: string, item: Items): Promise<boolean> {
  'use server';
  check(TOKEN, token);
  check(ID, spawn);
  check(GAME_ID, item);
  return feedAt(await requireUid(token, Pace.Feed), spawn, item);
}

/**
 * Retired: a catch is written by the throw that made it
 * (`throwOnServer`), never on a client's say-so. A tab from before
 * still calls this slot and is refused
 */
export async function keepCatch(
  token: string,
  spawn: string,
  ball: Balls,
  offset: number,
  locale: string,
): Promise<string | null> {
  'use server';
  check(TOKEN, token);
  check(ID, spawn);
  check(GAME_ID, ball);
  check(OFFSET, offset);
  check(LOCALE, locale);
  await requireUid(token);
  return null;
}

/**
 * Retired: a meeting runs when the server's roll says so, inside the
 * throw (`throwOnServer`). A tab from before still calls this slot and
 * is refused, since answering it would let a client declare a flight
 * to collect what the meeting was holding
 */
export async function retireEncounter(token: string, spawn: string): Promise<Items | null> {
  'use server';
  check(TOKEN, token);
  check(ID, spawn);
  await requireUid(token);
  return null;
}

/**
 * How a throw landed, and what it left behind: the record the catch
 * was written to, for a throw that caught something.
 *
 * The id is handed back rather than looked up afterwards because the
 * catch is the one thing the player wants to see next, and searching
 * their box for the newest row is a guess where this is the answer
 */
export interface ThrowOutcome {
  result: ThrowResult;
  catchId: string | null;
  /**
   * How far the ball got before it opened, out of `SHAKES`. A catch
   * held through all of them
   */
  shakes: number;
  /**
   * Whether the ball came out critical, and so held on one shake
   * rather than three
   */
  critical: boolean;
  /**
   * What the pokemon left behind as it ran, for a player whose buddy
   * picks pockets. Null for every other throw
   */
  pocketed?: Items | null;
}

/**
 * Throw the session's preferred ball. The server spends it, rolls it
 * and writes down a catch or a flight in one call; the session here
 * is told how it went, so the dialog shows what actually happened.
 * Resolves null when the session is over or no ball of the preferred
 * kind is carried
 */
export async function throwBall(
  session: SafariSession<EncounterRecord>,
  watch?: (shakes: number, result: ThrowResult) => void,
): Promise<ThrowOutcome | null> {
  if (session.state !== SafariState.Active) {
    return null;
  }

  // The catch is stamped in the catcher's own zone and carries the
  // locale it was made in, so its date reads as the day they had
  const report = await throwOnServer(
    await getIdToken(),
    session.encounter.spawn,
    session.ball,
    getLocalOffset(),
    getLocale(),
  );

  if (report == null) {
    return null;
  }

  applyTally(session, report.tally);
  session.shakes = report.shakes;
  session.critical = report.critical;
  if (report.result === ThrowResult.Caught) {
    session.end(SafariState.Caught);
  } else if (report.result === ThrowResult.Fled) {
    session.end(SafariState.Fled);
  }
  watch?.(report.shakes, report.result);

  return {
    result: report.result,
    shakes: report.shakes,
    critical: report.critical,
    catchId: report.catchId,
    ...(report.result === ThrowResult.Fled ? { pocketed: report.pocketed } : {}),
  };
}

/**
 * Feed the encounter a catch-improving item from the bag; resolves
 * false (spending nothing) when the item has no feeding effect, is
 * not carried, or the encounter is still chewing the last one
 */
export async function feedEncounter(
  session: SafariSession<EncounterRecord>,
  item: Items,
): Promise<boolean> {
  // Asked before the item leaves the bag: an encounter still chewing
  // the last treat takes nothing, and a refusal should cost nothing
  if (!session.canFeed() || FEED_CATCH_BONUS[item] == null) {
    return false;
  }
  if (!(await spendFeed(await getIdToken(), session.encounter.spawn, item))) {
    return false;
  }
  return session.feed(item);
}

/**
 * Where tallies are read from: the meeting's own row, which only its
 * player can read
 */
async function readTally(spawn: string): Promise<SafariTally | null> {
  const { data } = await getSupabase()
    .from('encounters')
    .select('safari')
    .eq('generation', WORLD_GENERATION)
    .eq('spawn_id', spawn)
    .maybeSingle();

  return asSafariTally((data as { safari?: unknown } | null)?.safari);
}

/**
 * One throw, decided here: the ball spent, the roll made, and a catch
 * or a flight written, all in one transaction
 */
async function throwOnServer(
  token: string,
  spawn: string,
  ball: Balls,
  offset: number,
  locale: string,
): Promise<ThrowReport | null> {
  'use server';
  check(TOKEN, token);
  check(ID, spawn);
  check(GAME_ID, ball);
  check(OFFSET, offset);
  check(LOCALE, locale);
  return throwAt(
    await requireUid(token, Pace.Throw),
    spawn,
    ball,
    await syncServerClock(),
    offset,
    locale,
  );
}
