import 'server-only';
import { type EncounterRecord, asEncounterRecord } from '../../auth/encounter-record';
import { asSpawnRolls, spawnId as nameSpawn } from '../../auth/snapshot-record';
import AleaRNG from '../../core/alea';
import { SPAWN_COUNT, type Spawn } from '../../overworld/chunk-snapshot';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import getWorld from '../../overworld/current';
import deriveEncounter, {
  type EncounterOptions,
  EncounterType,
  deriveTrainedAbilities,
  getSpawnLevels,
} from '../../overworld/encounter';
import { DEFAULT_ITEM_SLOTS, Slots, defaultSlots, withSlots } from '../../data/constants/slots';
import type Weather from '../../data/overworld/weather';
import { DARK_DAY_SHADOW_CHANCE, shadowsWildMeetings } from '../../data/overworld/weather';
import { encounterKey, encounterWindow } from '../../overworld/safari';
import createOverworld from '../../overworld/setup';
import type { Buddy } from '../../overworld/core';
import resolveBuddy from '../buddy';
import { getSql, tx } from '../db';
import { readEncounter, writeEncounter } from '../encounter-io';
import { recordSeenSpecies } from '../pokedex';
import { toZoneKey } from '../../auth/local-time';
import { resolveSnapshot } from './claims';

/** Meeting one wild pokemon, and letting it go */
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
        ? overworld.checkEncounterLevels(id, getSpawnLevels(spawn[0]))
        : undefined),
  });
  // What a trained pokemon keeps once it changes hands: the second
  // ability its owner put into it, and the room for the second item
  // it was carrying. Both are asked for by the caller, since nothing
  // met in the world has either
  const abilities = [
    ...new Set(
      deriveTrainedAbilities(
        derived.species,
        derived.traitValue,
        derived.ability,
        options.abilities ?? 1,
      ),
    ),
  ];
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
