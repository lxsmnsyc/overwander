import 'server-only';
import { GIFT_COLLECTION, POSITION_COLLECTION } from '../auth/collections';
import { Acquisition } from '../auth/caught-record';
import type { EncounterRecord } from '../auth/encounter-record';
import type { MysteryGift } from '../auth/gift-record';
import { GiftKind, asGiftRecord } from '../auth/gift-record';
import { asOffset, toLocalTime } from '../auth/local-time';
import { asPositionRecord } from '../auth/position-record';
import AleaRNG from '../core/alea';
import { SpawnRarity, getSpawnRarity } from '../data/biome';
import Biome from '../data/ids/biome';
import { Balls, Items } from '../data/ids/items';
import type { Species } from '../data/ids/species';
import { getRegisteredSpecies, getSpeciesData } from '../data/species';
import ChunkSnapshot, { SNAPSHOT_INTERVAL } from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import deriveEncounter, { EncounterType } from '../overworld/encounter';
import { hasAnyCaught, writeCaughtRecord } from './caught';
import { grantItem } from './inventory';
import { getAdminFirestore } from './firebase';
import { docData } from './read';

/**
 * The gifts the game gives.
 *
 * A mystery gift is the one thing a player receives without doing
 * anything: no landmark to walk to, no throw to land, nothing to
 * spend. Everything about one is decided here, because a client that
 * could name its own gift could name a legendary — the player's only
 * say is whether to take it.
 *
 * Today there is one giving, in two parts: the pokemon somebody with
 * none is handed, and the balls to catch the next one with.
 */

/**
 * What the starter comes at. Low enough that it is the beginning of
 * something rather than a shortcut past it, and the level the games
 * have handed a first pokemon over at since the first of them
 */
export const STARTER_LEVEL = 5;

/**
 * What a first pokemon is no use without. Twenty is enough to walk
 * out and come back with a few more without the game having to hand
 * out another gift for it
 */
export const STARTER_BALLS = 20;

/**
 * Which gifts these are, in the documents that hold them. Naming them
 * rather than keying by the player alone is what lets a second gift be
 * added without the first one having taken the only slot there is
 */
const STARTER_GIFT = 'starter';
const STARTER_BALL_GIFT = 'starterBalls';

/**
 * A gift's document, "{gift}:{uid}". The client names the gift and the
 * server names the player, so nobody can ask for somebody else's
 */
function giftId(gift: string, uid: string): string {
  return `${gift}:${uid}`;
}

/**
 * What a starter may be: the unevolved species that still have
 * somewhere to go.
 *
 * That is the game's own `Base` rarity band, so nothing here decides
 * separately what counts as a beginning — a species is a starter for
 * the same reason it is a common spawn. Fully-evolved species, middle
 * stages, babies and the one-per-world specials are all left out by
 * being something other than Base.
 *
 * A species that lives nowhere is left out as well: the fossils are
 * Base by the shape of their line and extinct by where they live, and
 * handing one over as a first pokemon would give away for nothing the
 * only thing a fossil is for
 */
export function getStarterPool(): Species[] {
  return getRegisteredSpecies().filter(
    (species) =>
      getSpawnRarity(species) === SpawnRarity.Base && getSpeciesData(species).biomes.length > 0,
  );
}

/**
 * Where to say the gift came from.
 *
 * A record has to name a place and a window it began in, and a gift
 * began in neither: nobody met it anywhere. It is stamped with where
 * the player is standing and the window they are standing in, which
 * is the truthful answer to "where were you when this happened" —
 * and, for a player who has not walked anywhere yet, the chunk they
 * were placed in
 */
async function whereTheyStand(uid: string, now: number, zone: number): Promise<ChunkSnapshot> {
  const stored = docData(await getAdminFirestore().collection(POSITION_COLLECTION).doc(uid).get());
  const at = asPositionRecord(stored);
  const local = toLocalTime(now, zone);

  return new ChunkSnapshot(
    getWorld().getChunk(at.chunkX, at.chunkY),
    Math.floor(local / SNAPSHOT_INTERVAL) * SNAPSHOT_INTERVAL,
    zone,
  );
}

/**
 * One gift, ready to be written down
 */
interface Offer {
  gift: MysteryGift;
  encounter: EncounterRecord | null;
}

/**
 * Put a giving on the shelf, all of it or none of it.
 *
 * The documents are read and written in one transaction, so two tabs
 * signing in together cannot both find nothing there and both offer
 * it. Resolves false when any part of the giving already exists,
 * which is the ordinary answer for anybody who has played before
 */
async function offer(uid: string, offers: Offer[], now: number): Promise<boolean> {
  const db = getAdminFirestore();
  const refs = offers.map(({ gift }) => db.collection(GIFT_COLLECTION).doc(giftId(gift.id, uid)));

  return db.runTransaction(async (transaction) => {
    const stored = await transaction.getAll(...refs);

    if (stored.some((document) => document.exists)) {
      return false;
    }
    refs.forEach((ref, at) => {
      transaction.set(ref, {
        player: uid,
        gift: offers[at].gift,
        offeredAt: now,
        claimedAt: null,
        encounter: offers[at].encounter,
      });
    });
    return true;
  });
}

/**
 * Roll the first pokemon and shelve it with the balls, for a player
 * who has none and has never been offered one.
 *
 * Owning nothing is what makes the giving *due* — somebody who
 * released their last one is owed another, or the game is over for
 * them — and the documents are what make it happen once
 */
async function offerStarter(uid: string, now: number, offset: number): Promise<void> {
  if (await hasAnyCaught(uid)) {
    return;
  }

  const zone = asOffset(offset);
  const pool = getStarterPool();
  // Seeded by the player, so the same person is offered the same first
  // pokemon however many times the call is retried on the way to the
  // one that lands — and so what somebody gets is not a matter of
  // when they happened to sign in
  const rng = new AleaRNG(`${uid}:${STARTER_GIFT}`);
  const species = pool[Math.floor(rng.random() * pool.length)];
  const snapshot = await whereTheyStand(uid, now, zone);
  const encounter = deriveEncounter(
    snapshot,
    [species, rng.int32(), rng.int32()],
    uid,
    // Fateful is what the record already calls a pokemon distributed
    // rather than met, and the level is fixed so a gift cannot be
    // rerolled into a better one. It comes from `Beyond` for the same
    // reason a mythical does: nobody met it in a chunk, and the one
    // the player was standing in when it arrived is not where it came
    // from
    { type: EncounterType.Fateful, level: STARTER_LEVEL, biome: Biome.Beyond },
  );

  await offer(
    uid,
    [
      {
        gift: {
          kind: GiftKind.Catch,
          id: STARTER_GIFT,
          reason: 'A first partner, for a trainer with none.',
          species: encounter.species,
          level: encounter.level,
          shiny: encounter.shiny,
          individualValue: encounter.individualValue,
          traitValue: encounter.traitValue,
        },
        encounter: { ...encounter, spawn: giftId(STARTER_GIFT, uid), player: uid },
      },
      {
        gift: {
          kind: GiftKind.Item,
          id: STARTER_BALL_GIFT,
          reason: 'Something to throw at the next one.',
          item: Items.PokeBall,
          amount: STARTER_BALLS,
        },
        encounter: null,
      },
    ],
    now,
  );
}

/**
 * Everything waiting for a player, offering first whatever they have
 * become owed. Resolves empty far more often than not, which is the
 * ordinary case — a player who has taken their gifts is owed nothing
 */
export async function listMysteryGifts(
  uid: string,
  now: number,
  offset: number,
): Promise<MysteryGift[]> {
  await offerStarter(uid, now, offset);

  // Claimed gifts are sorted out here rather than asked for: a player
  // has a handful of these at most, and a second equality filter is a
  // composite index for a query that reads nothing either way
  const owed = await getAdminFirestore()
    .collection(GIFT_COLLECTION)
    .where('player', '==', uid)
    .get();

  return owed.docs
    .map((document) => asGiftRecord(document.data()))
    .filter((record) => record.claimedAt == null)
    .map((record) => record.gift);
}

/**
 * What taking one left behind: the gift itself, and — for a pokemon —
 * the record it landed in, so the sheet can be opened on it
 */
export interface GiftClaim {
  gift: MysteryGift;
  catchId: string | null;
}

/**
 * Take one gift.
 *
 * It is marked taken before anything is handed over, so a second
 * press or a second tab finds it already gone rather than being paid
 * twice. Resolves null for a gift that is not this player's, was
 * never offered, or has already been claimed
 */
export async function claimMysteryGift(
  uid: string,
  gift: string,
  now: number,
  offset: number,
  locale: string,
): Promise<GiftClaim | null> {
  const db = getAdminFirestore();
  const ref = db.collection(GIFT_COLLECTION).doc(giftId(gift, uid));

  const taken = await db.runTransaction(async (transaction) => {
    const stored = await transaction.get(ref);

    if (!stored.exists) {
      return null;
    }

    const record = asGiftRecord(stored.data());

    if (record.player !== uid || record.claimedAt != null) {
      return null;
    }
    transaction.update(ref, { claimedAt: now });
    return record;
  });

  if (taken == null) {
    return null;
  }

  if (taken.gift.kind === GiftKind.Item) {
    await grantItem(uid, taken.gift.item, taken.gift.amount);
    return { gift: taken.gift, catchId: null };
  }

  // A Premier Ball is the commemorative one, which is the whole of
  // what it is for: nothing was thrown, and the record still has to
  // say which ball it is in
  const catchId =
    taken.encounter == null
      ? null
      : await writeCaughtRecord(
          uid,
          taken.encounter,
          Balls.PremierBall,
          Acquisition.Gift,
          now,
          offset,
          locale,
        );

  return { gift: taken.gift, catchId };
}
