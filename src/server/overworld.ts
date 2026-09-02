import 'server-only';

import { type EncounterRecord, asEncounterRecord } from '../auth/encounter-record';
import { asSpawnRolls, spawnId as nameSpawn } from '../auth/snapshot-record';
import AleaRNG from '../core/alea';
import type { ItemStack } from '../data/overworld/item-pool';
import ChunkSnapshot, {
  SNAPSHOT_INTERVAL,
  SPAWN_COUNT,
  type Spawn,
} from '../overworld/chunk-snapshot';
import getWorld from '../overworld/current';
import { getSpawnRarity } from '../data/biome';
import deriveEncounter, {
  type EncounterOptions,
  EncounterType,
  SPAWN_LEVELS,
  deriveSecondAbility,
} from '../overworld/encounter';
import { DEFAULT_ITEM_SLOTS, Slots, defaultSlots, withSlots } from '../data/constants/slots';
import type Weather from '../data/overworld/weather';
import { DARK_DAY_SHADOW_CHANCE, shadowsWildMeetings } from '../data/overworld/weather';
import { encounterKey, encounterWindow } from '../overworld/safari';
import createOverworld from '../overworld/setup';
import type { Buddy } from '../overworld/core';
import resolveBuddy from './buddy';
import { grantNestEgg } from './eggs';
import { getSql, jsonOf, tx } from './db';
import { readEncounter, writeEncounter } from './encounter-io';
import { recordSeenSpecies } from './pokedex';
import { asOffset, toLocalTime, toZoneKey } from '../auth/local-time';
import { asNumber, asRecordArray, asString } from './read';
import { grantItem, grantItems } from './inventory';
import { Landmark, Metric } from '../auth/quest-record';
import { bumpProgress } from './quest-progress';

/**
 * The overworld's privileged side: what a landmark pays out, and what
 * a player is actually standing in front of.
 *
 * Nothing here trusts a caller's description of the world. The window
 * comes from the shared snapshot row, the chunk from the world
 * seed, and the reward from the deterministic roll those two produce
 * — a client that asks for a cell it is not near, or a window that
 * has passed, gets whatever the world really staged, which is
 * usually nothing
 */

/**
 * The chunk's live window in one zone, as stored. A window nobody has
 * opened yet, or one that has expired, pays nothing: refreshing it is
 * the client's shared-world business, and a claim against a stale
 * window is a claim against a landmark that is no longer there.
 *
 * The instant is the server's; the zone is the caller's, and
 * everything derived from it (the window, the rolls, the claim
 * markers) is scoped by it, so a client that invents a zone gets that
 * zone's world rather than a second helping of its own
 */
export async function resolveSnapshot(
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<ChunkSnapshot | null> {
  const chunk = getWorld().getChunk(x, y);
  const zone = asOffset(offset);
  const rows = await getSql()`
    select window_at from snapshots
    where chunk_seed = ${chunk.seed} and zone = ${toZoneKey(zone)}
  `;
  const timestamp = asNumber(rows[0]?.window_at);

  if (timestamp === 0 || toLocalTime(now, zone) >= timestamp + SNAPSHOT_INTERVAL) {
    return null;
  }
  return new ChunkSnapshot(chunk, timestamp, zone);
}

/**
 * Take a claim marker, or find it already taken. One marker per
 * landmark, window and player, so a landmark pays each player once
 * per window and regenerates with the next one
 */
export async function claim(table: string, id: string, record: ClaimRecord): Promise<boolean> {
  return writeClaim(table, id, record);
}

/**
 * What a claim writer takes: who is claiming, and whatever the table
 * keeps beside the marker
 */
export interface ClaimRecord {
  player: string;
  [extra: string]: unknown;
}

/** The phenomenon kinds as the table stores them */
const PHENOMENON_KINDS: Record<string, number> = { item: 0, encounter: 1, egg: 2 };

/**
 * The marker as one insert: the primary key is the whole race, and
 * the row count is the answer. A marker that is already there grants
 * nothing.
 *
 * Every row is stamped with when it was written, which is what the
 * hourly sweep reads: a marker whose window has rolled can never
 * refuse a second claim again, so it is only taking up room
 */
async function writeClaim(table: string, marker: string, record: ClaimRecord): Promise<boolean> {
  const { player, ...extra } = record;

  return tx(async (transaction) => {
    let inserted: { count: number };

    if (table === 'cache_claims') {
      inserted = await transaction`
        insert into cache_claims (marker, player, claimed_at)
        values (${marker}, ${player}, ${Date.now()})
        on conflict do nothing
      `;
      if (inserted.count > 0) {
        const rows = asRecordArray(extra.items).map((stack) => ({
          marker,
          player,
          item: asNumber(stack.item),
          amount: asNumber(stack.amount),
        }));

        if (rows.length > 0) {
          await transaction`
            insert into cache_claim_items ${transaction(rows, 'marker', 'player', 'item', 'amount')}
          `;
        }
      }
    } else if (table === 'berry_claims') {
      inserted = await transaction`
        insert into berry_claims (marker, player, item, amount, claimed_at)
        values (${marker}, ${player}, ${asNumber(extra.item)}, ${asNumber(extra.amount)},
                ${Date.now()})
        on conflict do nothing
      `;
    } else if (table === 'nest_claims') {
      inserted = await transaction`
        insert into nest_claims (marker, player, species, claimed_at)
        values (${marker}, ${player}, ${asNumber(extra.species)}, ${Date.now()})
        on conflict do nothing
      `;
    } else if (table === 'phenomenon_claims') {
      inserted = await transaction`
        insert into phenomenon_claims (marker, player, kind, claimed_at)
        values (${marker}, ${player}, ${PHENOMENON_KINDS[String(extra.kind)] ?? 0}, ${Date.now()})
        on conflict do nothing
      `;
    } else {
      inserted = await transaction`
        insert into npc_claims (marker, player, payload, claimed_at)
        values (${marker}, ${player}, ${jsonOf(transaction, extra)}, ${Date.now()})
        on conflict do nothing
      `;
    }
    return inserted.count > 0;
  });
}

/**
 * Interact with an item cache: everything the window buried there
 * lands in the bag. A stash is up to three kinds of up to three
 * pieces, so the whole of it is granted rather than one item
 */
export async function claimItemCache(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<ItemStack[] | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const stash = snapshot?.getItemCaches().get(cell);

  if (snapshot == null || stash == null) {
    return null;
  }

  const id = `${cachePrefix(snapshot)}${cell}`;

  // The marker records the whole stash, so what a cache paid is
  // readable afterwards rather than only that it paid
  if (!(await claim('cache_claims', id, { player: uid, items: stash }))) {
    return null;
  }
  await grantStash(uid, stash);
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Cache, 1]]);
  return stash;
}

/**
 * Put a whole stash in the bag, in one transaction, so a stash cannot
 * half-land
 */
async function grantStash(uid: string, stash: ItemStack[]): Promise<void> {
  await grantItems(
    uid,
    stash.map(({ item, amount }) => [item, amount]),
  );
}

function cachePrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.landmarkTimestamp}$`;
}

/**
 * Which of this chunk's caches this player has already dug up, inside
 * the window they were buried in.
 *
 * The board draws one of those open and empty, which is the same thing
 * the refusal says in words. Per player and keyed by the window, so a
 * stash one trainer carried off is still buried for the next and the
 * answer empties itself when the window turns over
 */
export async function listClaimedItemCaches(
  uid: string,
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<number[]> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return [];
  }

  const prefix = cachePrefix(snapshot);
  const rows = await getSql()`
    select marker from cache_claims
    where player = ${uid} and marker like ${`${prefix}%`}
  `;

  return rows
    .map((row) => Number(asString(row.marker).slice(prefix.length)))
    .filter((cell) => Number.isInteger(cell));
}

function berryPrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.landmarkTimestamp}$berry`;
}

/**
 * Which of this chunk's patches this player has already picked, inside
 * the window they grew in.
 *
 * The board draws a picked patch as the bare bush it now is, which is
 * the same thing the refusal says in words. It is per player, so a
 * bush one trainer stripped is still in fruit for the next, and the
 * markers are keyed by the window, so the answer empties itself when
 * the patches grow again
 */
export async function listPickedBerryPatches(
  uid: string,
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<number[]> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return [];
  }

  const prefix = berryPrefix(snapshot);
  const rows = await getSql()`
    select marker from berry_claims
    where player = ${uid} and marker like ${`${prefix}%`}
  `;

  return rows
    .map((row) => Number(asString(row.marker).slice(prefix.length)))
    .filter((cell) => Number.isInteger(cell));
}

/**
 * Pick a berry patch: everything on the bush lands in the bag. A
 * patch bears a handful of one kind rather than a single berry
 */
export async function claimBerryPatch(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<ItemStack | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const berries = snapshot?.getBerryPatches().get(cell);

  if (snapshot == null || berries == null) {
    return null;
  }

  const id = `${berryPrefix(snapshot)}${cell}`;

  if (
    !(await claim('berry_claims', id, {
      player: uid,
      item: berries.item,
      amount: berries.amount,
    }))
  ) {
    return null;
  }
  await grantItem(uid, berries.item, berries.amount);
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Berry, 1]]);
  return berries;
}

/**
 * The claim marker one player's visit to one nest, in one half-day
 * window, is written against. Both the peek and the claim name it, so
 * looking and taking cannot disagree about which egg is in question
 */
function nestClaimId(snapshot: ChunkSnapshot, cell: number): string {
  return `${snapshot.groundKey}@${snapshot.nestTimestamp}$nest${cell}`;
}

/**
 * What is lying in a nest, without taking it.
 *
 * Looking is free and writes nothing — the same bargain a lair
 * offers. It exists because an egg is not something to be handed to
 * somebody who has not agreed to carry it: a buddy carries one egg,
 * and taking a second one is a decision about the first.
 *
 * What is **not** answered is which species it is. That is the whole
 * of what an egg is, and the server knowing it is no reason to say it
 */
export async function peekNest(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<NestOffer | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const species = snapshot?.getNests().get(cell);

  if (snapshot == null || species == null) {
    return null;
  }
  const marker = nestClaimId(snapshot, cell);
  const rows = await getSql()`
    select 1 from nest_claims where marker = ${marker} and player = ${uid}
  `;

  return { taken: rows.length > 0 };
}

/**
 * A nest with an egg in it, put to the player before anything is
 * written. There is one field and it is the only one worth knowing:
 * the species is deliberately left out
 */
export interface NestOffer {
  /**
   * Whether this player has already taken this window's egg. The nest
   * still holds one for everybody else — a marker is per player
   */
  taken: boolean;
}

/**
 * Take the egg a nest is holding. A nest keeps to its own half-day
 * window rather than the quarter-hour one the ground turns over on, so
 * the claim marker is stamped with the nest window: one egg per
 * nest, per player, per half day.
 *
 * It is what `peekNest` above offered, agreed to: the peek wrote
 * nothing, so this is still the first and only write, and the marker
 * it takes is the one the peek was reading.
 *
 * The player still has to be standing in the chunk's live window to
 * reach it, which is what the snapshot resolves. Resolves the new
 * egg's catch id, or null when there is nothing lying there
 */
export async function claimNest(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  locale: string,
): Promise<string | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const species = snapshot?.getNests().get(cell);

  if (snapshot == null || species == null) {
    return null;
  }

  const id = nestClaimId(snapshot, cell);

  if (!(await claim('nest_claims', id, { player: uid, species }))) {
    return null;
  }
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Nest, 1]]);
  return grantNestEgg(uid, snapshot, cell, species, now, offset, locale);
}

/**
 * What a phenomenon yielded: an item that already landed in the bag,
 * the encounter the player now stands in, or — a grotto alone — the
 * egg it was hiding
 */
export type PhenomenonClaim =
  | { kind: 'item'; items: ItemStack[] }
  | { kind: 'encounter'; encounter: EncounterRecord }
  | { kind: 'egg'; catchId: string };

/**
 * Whether what is going on at a cell is an egg, without walking into
 * it.
 *
 * Only the egg is asked about, and only the egg is answered. An item
 * and a pokemon are things a player walks into and deals with; an egg
 * is a thing they have to decide to carry, and the deciding has to
 * happen before it is theirs. Everything else about the hour stays
 * unsaid, so pressing a cell to see whether it is worth pressing is
 * not a way of reading the world for free
 */
export async function peekPhenomenonEgg(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
): Promise<NestOffer | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const reward = snapshot?.getPhenomenonReward(cell) ?? null;

  if (snapshot == null || reward?.kind !== 'egg') {
    return null;
  }
  const rows = await getSql()`
    select 1 from phenomenon_claims
    where marker = ${phenomenonKey(snapshot, cell)} and player = ${uid}
  `;

  return { taken: rows.length > 0 };
}

/**
 * What one hour of one phenomenon cell is called. The claim marker
 * hangs off it, and so does the seed the startled pokemon is rolled
 * from — both the peek and the claim name it the same way
 */
function phenomenonKey(snapshot: ChunkSnapshot, cell: number): string {
  return `${phenomenonPrefix(snapshot)}${cell}`;
}

/**
 * Everything this hour's markers share, which is everything but the
 * cell. It is what lets one query ask which of them a player has
 * already had
 */
function phenomenonPrefix(snapshot: ChunkSnapshot): string {
  return `${snapshot.groundKey}@${snapshot.phenomenonTimestamp}$happening`;
}

/**
 * Which cells of this chunk this player has already taken what was
 * happening on, inside the hour it is happening in.
 *
 * The board draws a phenomenon only until its player has had it: a
 * cloud somebody has already dug through is a cell they would press
 * for nothing. It is per player, so what one walks into is still
 * there for the next
 */
export async function listClaimedPhenomena(
  uid: string,
  x: number,
  y: number,
  now: number,
  offset: number,
): Promise<number[]> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return [];
  }

  const prefix = phenomenonPrefix(snapshot);
  const rows = await getSql()`
    select marker from phenomenon_claims
    where player = ${uid} and marker like ${`${prefix}%`}
  `;

  return rows
    .map((row) => Number(asString(row.marker).slice(prefix.length)))
    .filter((cell) => Number.isInteger(cell));
}

/**
 * Walk into whatever is going on at a cell.
 *
 * What is happening there and what it turns out to be are both the
 * world's, derived from the chunk, the hour and the cell — so the
 * pokemon a phenomenon startles out is the one it hid, not one the
 * caller named, and every visitor of that cell this hour meets the
 * same individual.
 *
 * **One successful interaction per player per hour.** The marker is
 * taken before anything is handed over and only where something is
 * actually there to hand over, so a phenomenon the biome could not
 * fill costs the player nothing
 */
export async function claimPhenomenon(
  uid: string,
  x: number,
  y: number,
  cell: number,
  now: number,
  offset: number,
  locale: string,
): Promise<PhenomenonClaim | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);
  const reward = snapshot?.getPhenomenonReward(cell) ?? null;

  if (snapshot == null || reward == null) {
    return null;
  }

  const key = phenomenonKey(snapshot, cell);

  if (!(await claim('phenomenon_claims', key, { player: uid, kind: reward.kind }))) {
    return null;
  }
  await bumpProgress(uid, [[Metric.Landmarks, Landmark.Phenomenon, 1]]);

  if (reward.kind === 'item') {
    await grantStash(uid, reward.items);
    return { kind: 'item', items: reward.items };
  }

  if (reward.kind === 'egg') {
    return {
      kind: 'egg',
      catchId: await grantNestEgg(uid, snapshot, cell, reward.species, now, offset, locale),
    };
  }

  // The pokemon needs the two rolls a snapshot spawn would have; they
  // derive from the same chunk, hour and cell, so what the phenomenon
  // startled out is one pokemon rather than one per player
  const rng = new AleaRNG(
    `${snapshot.groundKey}${snapshot.phenomenonTimestamp}happening${cell}spawn`,
  );
  const spawn: Spawn = [reward.species, rng.int32(), rng.int32()];

  // What startled it out travels with the meeting: the Lure Ball is
  // thrown at whatever came up out of a ripple, and by the time it is
  // thrown the cell is long behind the player
  return {
    kind: 'encounter',
    encounter: await startEncounter(uid, snapshot, key, spawn, {
      phenomenon: snapshot.getPhenomena().get(cell),
    }),
  };
}

/**
 * Whether the sky closed this one's heart.
 *
 * Only a wild meeting is ever asked: a raid prize, a hatchling and a
 * gift arrive under their own rules whatever the sky is doing. The
 * roll is keyed by the spawn and the player, so it is the same answer
 * every time this meeting is resolved and a different one for the next
 * player along
 */
function shadowedByTheSky(
  sky: Weather,
  type: EncounterType | undefined,
  spawn: string,
  uid: string,
): boolean {
  if ((type ?? EncounterType.Wild) !== EncounterType.Wild || !shadowsWildMeetings(sky)) {
    return false;
  }
  return new AleaRNG(`${spawn}:${uid}:shadow`).random() < DARK_DAY_SHADOW_CHANCE;
}

/**
 * Stage a meeting: the per-player derivation is written to
 * encounters/{spawnId}:{uid} on first interaction and returned as-is
 * afterwards, so re-entering a meeting cannot re-roll it into
 * something better
 */
export async function startEncounter(
  uid: string,
  snapshot: ChunkSnapshot,
  id: string,
  spawn: Spawn,
  options: EncounterOptions = {},
  /**
   * The buddy the caller has already looked up. Undefined means it has
   * not been asked for and this will ask; null is a player who has
   * none. Resolving one costs two round trips, and a caller that
   * needed it for a check of its own should not pay twice
   */
  resolved?: Buddy | null,
): Promise<EncounterRecord> {
  const existing = await readEncounter(id, uid);

  if (existing != null) {
    return asEncounterRecord(existing);
  }

  // Snapshot spawns are wild meetings; a raid reward carries its own
  // type (raid encounters never flee) and, from a shadow raid, its
  // permanent Shadow ability. What the buddy changes about the
  // meeting — the shiny odds it carries, the nature it passes on, the
  // gender it draws out — is asked of the overworld rather than
  // spelled out here
  const overworld = createOverworld(
    uid,
    resolved === undefined ? await resolveBuddy(uid) : resolved,
  );
  // The sky the meeting happened under, read here rather than taken
  // from the client: the floor it puts under the pokemon's values and
  // whether it walks out shadowed are both written into the record, so
  // what the weather was is the server's to say
  const sky =
    options.weather ??
    getWorld().getWeather(snapshot.chunk.x, snapshot.chunk.y, snapshot.weatherWindow);
  const derived = deriveEncounter(snapshot, spawn, uid, {
    ...options,
    // After the spread, so a caller that named one keeps it and one
    // that named nothing is not handed an undefined over the top of it
    weather: sky,
    // A dark day shadows some of what is met in the wild under it,
    // rolled per spawn and per player the way the sparkle is. Only the
    // wild: a raid prize carries its own answer, and a caller that
    // already said keeps saying
    shadow: options.shadow ?? shadowedByTheSky(sky, options.type, id, uid),
    shinyBoost: (options.shinyBoost ?? 1) * overworld.checkEncounterShiny(id),
    // What a buddy finds in a pokemon's mouth, and how strong the
    // chunk fields one. Both are wild-meeting rules: a raid prize and
    // a gift arrive with their level named, and a trainer's party
    // brings a band of its own
    heldBoost: (options.heldBoost ?? 1) * overworld.checkEncounterHeld(id),
    levels:
      options.levels ??
      (options.level == null && (options.type ?? EncounterType.Wild) === EncounterType.Wild
        ? overworld.checkEncounterLevels(id, SPAWN_LEVELS[getSpawnRarity(spawn[0])])
        : undefined),
  });
  // What a trained pokemon keeps once it changes hands: the second
  // ability its owner put into it, and the room for the second item
  // it was carrying. Both are asked for by the caller, since nothing
  // met in the world has either
  const second =
    (options.abilities ?? 1) > 1
      ? deriveSecondAbility(derived.species, derived.traitValue, derived.ability)
      : null;
  const abilities = [...new Set([derived.ability, ...(second == null ? [] : [second])])];
  const room = Math.max(DEFAULT_ITEM_SLOTS, options.itemSlots ?? DEFAULT_ITEM_SLOTS);
  // Room for both, or the record would hold a second ability it has
  // no slot for: the battle counts slots rather than what is on the
  // list, and the counter would read it as already full
  const slots = withSlots(defaultSlots(abilities), Slots.Item, room);
  const record: EncounterRecord = {
    ...derived,
    nature: overworld.checkEncounterNature(id, derived.nature),
    gender: overworld.checkEncounterGender(id, derived.gender),
    spawn: id,
    player: uid,
    ...(abilities.length > 1 ? { abilities } : {}),
    ...(slots === defaultSlots() ? {} : { slots }),
  };

  await tx(async (transaction) => writeEncounter(transaction, record));
  // Met, whatever becomes of the meeting: the dex counts what a player
  // has laid eyes on, so one that flees or is walked away from is
  // still one they have seen. The early return above is what keeps a
  // meeting walked back into from being counted twice
  await recordSeenSpecies(uid, record.species, record.shiny);
  return record;
}

/**
 * Meet one of the chunk's published spawns. The spawn is read from
 * the shared store rather than taken from the caller, so the rolls
 * behind the meeting are the ones every player of that chunk sees
 */
export async function meetSpawn(
  uid: string,
  x: number,
  y: number,
  spawnId: string,
  now: number,
  offset: number,
): Promise<EncounterRecord | null> {
  const snapshot = await resolveSnapshot(x, y, now, offset);

  if (snapshot == null) {
    return null;
  }

  // The name says which chunk, which zone and which window the spawn
  // belongs to, and the window it names has to be the live one: a
  // spawn from a window that has turned over, or from a chunk away,
  // is not standing there to be met
  const index = spawnIndex(spawnId);

  if (spawnId !== nameSpawn(snapshot.key, snapshot.timestamp, index)) {
    return null;
  }

  // Both are wanted and neither waits on the other, so they are asked
  // together: serially they are two round trips of a path that has
  // too many already. The roll comes off the stored window, which is
  // the one the whole zone is looking at, addressed by chunk seed and
  // zone rather than by `snapshot.key`
  const [buddy, stored] = await Promise.all([
    resolveBuddy(uid),
    getSql()`
      select species, individual_value as "individualValue", trait_value as "traitValue"
      from snapshot_spawns
      where chunk_seed = ${snapshot.chunk.seed} and zone = ${toZoneKey(snapshot.offset)}
      order by idx
    `,
  ]);
  const overworld = createOverworld(uid, buddy);

  // The extras a lure draws in are only there for the player whose
  // buddy drew them: the window publishes them for everyone, and a
  // player walking without a lure cannot meet what they cannot see
  if (index >= overworld.checkSpawnCount(SPAWN_COUNT)) {
    return null;
  }

  const rolls = asSpawnRolls([...stored]);

  if (index >= rolls.length) {
    return null;
  }

  const rolled = rolls[index];
  const spawn: Spawn = [rolled.species, rolled.individualValue, rolled.traitValue];

  return startEncounter(uid, snapshot, spawnId, spawn, {}, buddy);
}

/**
 * Which roll of the window a published spawn was: the id carries it
 * after the '#', and the extras a lure adds are the last of them
 */
function spawnIndex(spawnId: string): number {
  const index = Number(spawnId.slice(spawnId.lastIndexOf('#') + 1));

  return Number.isFinite(index) ? index : Number.POSITIVE_INFINITY;
}

/**
 * Take a spawn out of what this player is shown, for as long as the
 * window that staged it lasts.
 *
 * Two things retire one, and they look the same from the map's side:
 * a pokemon that **ran off**, and one that was **caught**. Neither is
 * standing there any more for the player it happened to, and both
 * leave it standing for everybody else — the spawn belongs to the
 * shared window, so what changes is only what this player is drawn.
 *
 * The key is recomputed from the stored encounter rather than taken
 * from the caller, so a player cannot retire a meeting they never had
 */
export async function retireSpawn(uid: string, spawnId: string): Promise<void> {
  const stored = await readEncounter(spawnId, uid);

  if (stored == null) {
    return;
  }

  const key = encounterKey(asEncounterRecord(stored));

  await getSql()`
    insert into fled_encounters (player, key, window_at)
    values (${uid}, ${key}, ${encounterWindow(key)})
    on conflict do nothing
  `;
}

/**
 * How long a fled encounter is remembered for.
 *
 * What it has to outlive is the window that staged it: the spawn is
 * gone when the window turns over, so a key from an older one can
 * never match anything again. The allowance is an hour rather than
 * one window, because the windows are **local** — a player who
 * crosses a zone reads a clock offset from the one their last key was
 * written against, and an hour is more than any of that is worth
 * arguing about.
 *
 * The hourly sweep in the schema is what actually forgets them;
 * readers filter by this figure, so a sweep that has not run yet
 * changes nothing they see
 */
export const FLED_MEMORY = 60 * 60 * 1000;
