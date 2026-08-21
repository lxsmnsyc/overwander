import type { PlayerIdentity } from '../auth/user';
import AleaRNG from '../core/alea';
import { BALL_ITEMS, type Balls, type Items } from '../data/ids/items';
import SafariSession, {
  FEED_CATCH_BONUS,
  SafariState,
  ThrowResult,
  encounterKey,
} from '../overworld/safari';
import { recordCatch } from '../server/caught';
import { requireUid } from '../server/auth';
import { consumeItem } from '../server/inventory';
import { retireSpawn } from '../server/overworld';
import { hasCaughtSpecies } from './caught';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import type { EncounterRecord } from './encounter-record';
import getSupabase from './supabase';
import { getInventory } from './inventory';
import getIdToken from './session';

/**
 * Open a safari session on an encounter for the signed-in user. The
 * roll stream mixes in the server clock so re-engaging the same
 * encounter does not replay the previous attempt, and a player
 * cannot steer the seed by moving their own clock
 */
export async function createSafariSession(
  user: PlayerIdentity,
  encounter: EncounterRecord,
): Promise<SafariSession<EncounterRecord>> {
  const now = await syncServerClock();
  const rng = new AleaRNG(`${user.uid}${encounterKey(encounter)}${now}`);
  // The Repeat Ball needs to know whether this species is already in
  // the player's records; it is read once, when the session opens
  const speciesCaught = await hasCaughtSpecies(user.uid, encounter.species);
  const session = new SafariSession(encounter, () => rng.random(), { speciesCaught });

  // What the bag holds is the session's own business only so far as
  // knowing whether there is anything left to throw; the throw itself
  // no longer asks
  session.ballsLeft = await countBalls(user.uid);
  return session;
}

/**
 * Every ball the player carries, all kinds counted together
 */
export async function countBalls(uid: string): Promise<number> {
  const balls = new Set<Items>(Object.values(BALL_ITEMS));
  const inventory = await getInventory(uid);

  return inventory
    .filter((entry) => balls.has(entry.item))
    .reduce((total, entry) => total + entry.amount, 0);
}

/**
 * Everything that has run from this player and is still worth
 * remembering, as encounter keys. The map asks once per window and
 * checks every spawn it is about to draw against the set
 */
export async function getRetiredKeys(uid: string): Promise<Set<string>> {
  const { data } = await getSupabase().from('fled_encounters').select('key').eq('player', uid);

  return new Set((data ?? []).map((row) => String(row.key)));
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
 * Spend one ball of the kind the session is throwing. Resolves false
 * when none is carried, in which case nothing is thrown
 */
async function spendBall(token: string, ball: Balls): Promise<boolean> {
  'use server';
  return consumeItem(await requireUid(token), BALL_ITEMS[ball]);
}

/**
 * Spend one feeding item. Resolves false when it is not carried
 */
async function spendFeed(token: string, item: Items): Promise<boolean> {
  'use server';
  return consumeItem(await requireUid(token), item);
}

/**
 * Write down a successful catch. The server reads the encounter the
 * player was actually shown and records that, so the pokemon in the
 * record is the one the overworld staged — a client can report a
 * catch it did not earn, but not a better pokemon than it met
 */
async function keepCatch(
  token: string,
  spawn: string,
  ball: Balls,
  offset: number,
  locale: string,
): Promise<string | null> {
  'use server';
  return recordCatch(await requireUid(token), spawn, ball, await syncServerClock(), offset, locale);
}

/**
 * Retire an encounter that fled. The key is recomputed server-side
 * from the stored encounter
 */
async function retireEncounter(token: string, spawn: string): Promise<void> {
  'use server';
  await retireSpawn(await requireUid(token), spawn);
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
}

/**
 * Throw the session's preferred ball: spends one from the bag, rolls
 * the catch, and has the server write down a success or a flight.
 * Resolves null when the session is over or no ball of the preferred
 * kind is carried
 */
export async function throwBall(
  user: PlayerIdentity,
  session: SafariSession<EncounterRecord>,
): Promise<ThrowOutcome | null> {
  if (session.state !== SafariState.Active) {
    return null;
  }

  const token = await getIdToken();

  // Counted before the ball is spent, so "one left" means the ball
  // about to be thrown is the last one
  session.ballsLeft = await countBalls(user.uid);

  if (!(await spendBall(token, session.ball))) {
    return null;
  }

  const result = session.throwBall();
  const spawn = session.encounter.spawn;

  if (result === ThrowResult.Caught) {
    // The catch is stamped in the catcher's own zone and carries the
    // locale it was made in, so its date reads as the day they had
    return {
      result,
      catchId: await keepCatch(token, spawn, session.ball, getLocalOffset(), getLocale()),
    };
  }
  if (result === ThrowResult.Fled) {
    await retireEncounter(token, spawn);
  }
  return { result, catchId: null };
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
  if (!(await spendFeed(await getIdToken(), item))) {
    return false;
  }
  return session.feed(item);
}
