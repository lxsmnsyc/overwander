import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AleaRNG from '../core/alea';
import { BALL_ITEMS, type Balls, type Items } from '../data/ids/items';
import SafariSession, {
  FEED_CATCH_BONUS,
  SafariState,
  ThrowResult,
  encounterKey,
} from '../overworld/safari';
import { recordCatch } from '../server/caught';
import { requireUid } from '../server/firebase';
import { consumeItem } from '../server/inventory';
import { markFled } from '../server/overworld';
import { asStringArray } from './__normalize';
import { hasCaughtSpecies } from './caught';
import { syncServerClock } from './clock';
import { getLocalOffset, getLocale } from './local-time';
import { FLED_COLLECTION } from './collections';
import type { EncounterRecord } from './encounter-record';
import { getFirebaseFirestore } from './firebase';
import { getInventory } from './inventory';
import getIdToken from './session';

/**
 * Open a safari session on an encounter for the signed-in user. The
 * roll stream mixes in the server clock so re-engaging the same
 * encounter does not replay the previous attempt, and a player
 * cannot steer the seed by moving their own clock
 */
export async function createSafariSession(
  user: User,
  encounter: EncounterRecord,
): Promise<SafariSession<EncounterRecord>> {
  const now = await syncServerClock();
  const rng = new AleaRNG(`${user.uid}${encounterKey(encounter)}${now}`);
  // The Repeat Ball needs to know whether this species is already in
  // the player's records; it is read once, when the session opens
  const speciesCaught = await hasCaughtSpecies(user.uid, encounter.species);
  // The last-ball pity is measured against the stock the player
  // walked in with, so it is read here and never again
  const startingBalls = await countBalls(user.uid);
  const session = new SafariSession(encounter, () => rng.random(), {
    speciesCaught,
    startingBalls,
  });

  session.ballsLeft = startingBalls;
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
 * Whether the encounter already fled from this user; the overworld
 * must not offer it again when true
 */
export async function isEncounterFled(uid: string, encounter: EncounterRecord): Promise<boolean> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), FLED_COLLECTION, uid));
  const keys = new Set(asStringArray(snapshot.data()?.keys));

  return keys.has(encounterKey(encounter));
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
  await markFled(await requireUid(token), spawn);
}

/**
 * Throw the session's preferred ball: spends one from the bag, rolls
 * the catch, and has the server write down a success or a flight.
 * Resolves null when the session is over or no ball of the preferred
 * kind is carried
 */
export async function throwBall(
  user: User,
  session: SafariSession<EncounterRecord>,
): Promise<ThrowResult | null> {
  if (session.state !== SafariState.Active) {
    return null;
  }

  const token = await getIdToken(user);

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
    await keepCatch(token, spawn, session.ball, getLocalOffset(), getLocale());
  } else if (result === ThrowResult.Fled) {
    await retireEncounter(token, spawn);
  }
  return result;
}

/**
 * Feed the encounter a catch-improving item from the bag; resolves
 * false (spending nothing) when the item has no feeding effect or is
 * not carried
 */
export async function feedEncounter(
  user: User,
  session: SafariSession<EncounterRecord>,
  item: Items,
): Promise<boolean> {
  if (session.state !== SafariState.Active || FEED_CATCH_BONUS[item] == null) {
    return false;
  }
  if (!(await spendFeed(await getIdToken(user), item))) {
    return false;
  }
  return session.feed(item);
}
