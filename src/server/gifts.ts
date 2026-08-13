import 'server-only';
import { GIFT_CLAIM_COLLECTION, POSITION_COLLECTION } from '../auth/collections';
import { Acquisition } from '../auth/caught-record';
import type { MysteryGift } from '../auth/gift-record';
import { GiftKind } from '../auth/gift-record';
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
import { claim } from './overworld';
import { docData } from './read';

/**
 * The gifts the game gives.
 *
 * A mystery gift is the one thing a player receives without doing
 * anything: no landmark to walk to, no throw to land, nothing to
 * spend. Today there is exactly one — the pokemon somebody is handed
 * when they have none — and everything about it is decided here,
 * because a client that could name its own gift could name a
 * legendary.
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
 * Which gift this is, in the marker that says it was given. Naming it
 * rather than keying the marker by the player alone is what lets a
 * second gift be added without the first one having taken the only
 * slot there is
 */
const STARTER_GIFT = 'starter';

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
 * A species that lives nowhere is left out as well. The fossils are
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
 * Hand a player their first pokemon, if they have none.
 *
 * The two checks do different jobs and both are needed. Owning
 * nothing is what makes the gift *due* — somebody who released their
 * last one is owed another, or the game is over for them — and the
 * marker is what makes it happen **once**, since two tabs opened
 * together would otherwise both find an empty collection and both be
 * answered.
 *
 * Resolves what was given — a pokemon and the balls to throw at the
 * next one — or nothing at all for a player who already has a pokemon
 * or has already been given one
 */
export async function claimStarterGift(
  uid: string,
  now: number,
  offset: number,
  locale: string,
): Promise<MysteryGift[]> {
  if (await hasAnyCaught(uid)) {
    return [];
  }
  if (!(await claim(GIFT_CLAIM_COLLECTION, `${STARTER_GIFT}:${uid}`, { player: uid, at: now }))) {
    return [];
  }

  const zone = asOffset(offset);
  const pool = getStarterPool();
  // Seeded by the player, so the same person is handed the same first
  // pokemon however many times the call is retried on the way to the
  // one that lands — and so what somebody gets is not a matter of
  // when they happened to press the button
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
  // A Premier Ball is the commemorative one, which is the whole of
  // what it is for: nothing was thrown, and the record still has to
  // say which ball it is in
  const catchId = await writeCaughtRecord(
    uid,
    { ...encounter, spawn: `${STARTER_GIFT}:${uid}`, player: uid },
    Balls.PremierBall,
    Acquisition.Gift,
    now,
    offset,
    locale,
  );

  await grantItem(uid, Items.PokeBall, STARTER_BALLS);

  return [
    {
      kind: GiftKind.Catch,
      catchId,
      species: encounter.species,
      level: encounter.level,
      shiny: encounter.shiny,
      individualValue: encounter.individualValue,
      traitValue: encounter.traitValue,
    },
    { kind: GiftKind.Item, item: Items.PokeBall, amount: STARTER_BALLS },
  ];
}
