import type { User } from 'firebase/auth';
import { arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';
import AleaRNG from '../core/alea';
import { BALL_ITEMS, type Items } from '../data/ids/items';
import type { Encounter } from '../overworld/encounter';
import SafariSession, {
  FEED_CATCH_BONUS,
  SafariState,
  ThrowResult,
  encounterKey,
} from '../overworld/safari';
import { asStringArray } from './__normalize';
import { hasCaughtSpecies, recordCatch } from './caught';
import { syncServerClock } from './clock';
import { getFirebaseFirestore } from './firebase';
import { consumeItem, getInventory } from './inventory';

/**
 * Per-user fled encounters at fled/{uid}: once an encounter flees
 * it disappears for that user and cannot be engaged again
 */
const FLED_COLLECTION = 'fled';

/**
 * Open a safari session on an encounter for the signed-in user. The
 * roll stream mixes in the server clock so re-engaging the same
 * encounter does not replay the previous attempt, and a player
 * cannot steer the seed by moving their own clock
 */
export async function createSafariSession(
  user: User,
  encounter: Encounter,
): Promise<SafariSession> {
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

export async function markFled(uid: string, encounter: Encounter): Promise<void> {
  await setDoc(
    doc(getFirebaseFirestore(), FLED_COLLECTION, uid),
    { keys: arrayUnion(encounterKey(encounter)) },
    { merge: true },
  );
}

/**
 * Whether the encounter already fled from this user; the overworld
 * must not offer it again when true
 */
export async function isEncounterFled(uid: string, encounter: Encounter): Promise<boolean> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), FLED_COLLECTION, uid));
  const keys = new Set(asStringArray(snapshot.data()?.keys));

  return keys.has(encounterKey(encounter));
}

/**
 * Throw the session's preferred ball: consumes one from the
 * inventory, rolls the catch, records a success into the catch
 * record and persists a flee. Resolves null when the session is
 * over or no ball of the preferred kind is carried
 */
export async function throwBall(user: User, session: SafariSession): Promise<ThrowResult | null> {
  if (session.state !== SafariState.Active) {
    return null;
  }

  // Counted before the ball is spent, so "one left" means the ball
  // about to be thrown is the last one
  session.ballsLeft = await countBalls(user.uid);

  if (!(await consumeItem(user.uid, BALL_ITEMS[session.ball]))) {
    return null;
  }

  const result = session.throwBall();

  if (result === ThrowResult.Caught) {
    await recordCatch(user, session.encounter, session.ball);
  } else if (result === ThrowResult.Fled) {
    await markFled(user.uid, session.encounter);
  }
  return result;
}

/**
 * Feed the encounter a catch-improving item from the inventory;
 * resolves false (consuming nothing) when the item has no feeding
 * effect or is not carried
 */
export async function feedEncounter(
  user: User,
  session: SafariSession,
  item: Items,
): Promise<boolean> {
  if (session.state !== SafariState.Active || FEED_CATCH_BONUS[item] == null) {
    return false;
  }
  if (!(await consumeItem(user.uid, item))) {
    return false;
  }
  return session.feed(item);
}
