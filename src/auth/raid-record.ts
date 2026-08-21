// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import AleaRNG from '../core/alea';
import type Biome from '../data/ids/biome';
import type { Items } from '../data/ids/items';
import type Lairs from '../data/overworld/lair';
import { getLairTitle } from '../data/overworld/lair';
import type { Species } from '../data/ids/species';
import type Chunk from '../overworld/chunk';
import type { Spawn } from '../overworld/chunk-snapshot';
import { asNumber, asRecord, asString, asStringArray } from './__normalize';
import { toZoneKey } from './local-time';

/**
 * What a raid lobby is, how a stored one is read back, and what
 * clearing it pays. The privileged server settles raids and the
 * client watches them, so the shape sits apart from both
 */

/**
 * What a lobby is staging
 */
export const enum RaidKind {
  /**
   * A legendary at home in its lair, from a LegendaryLair landmark
   */
  Legendary = 0,
  /**
   * A shadow boss — usually one of the biome's rare species standing
   * in no place in particular, one draw in eight a lair of the
   * biome's own with something wrong in it
   */
  Shadow = 1,
  /**
   * A mythical called out by a raid item. It stands on no landmark:
   * the relic that opened it is what staged it, and the relic is
   * spent, so the lobby is fought once whatever the outcome
   */
  Mythical = 2,
}

/**
 * One raid lobby at raids/{raidId}. The id is derived from the chunk,
 * the raid window, the landmark cell and the kind, so every player
 * who walks into the same lobby in the same window joins one raid
 */
export interface RaidRecord {
  kind: RaidKind;
  /**
   * The lair the raid stands in, or null for a shadow raid that
   * reached for a rare species instead. It is what the raid is
   * called after — see `getLairTitle`
   */
  lair: Lairs | null;
  species: Species;
  /**
   * The 32-bit roll the boss' nature and ability derive from
   */
  traitValue: number;
  /**
   * The player who opened the lobby; only they may start it
   */
  host: string;
  /**
   * teams/{teamId} ids that have joined, host first
   */
  teams: string[];
  /**
   * The battles/{battleId} the host started, or null while the lobby
   * is still gathering
   */
  battle: string | null;
  /**
   * The raid window this lobby belongs to; a listing of live raids
   * matches on it, and the landmark reopens when the window turns over
   */
  timestamp: number;
  /**
   * Minutes east of UTC the window was read in. A raid window is local,
   * so a lobby belongs to the zone that staged it — another zone's
   * landmark rolls its own boss at its own window
   */
  offset: number;
  /**
   * Where the lobby stands, for a listing that has no chunk in hand
   */
  chunk: { seed: string; x: number; y: number };
  /**
   * The biome the lobby stands in. A shadow raid with no lair is
   * named after it, and a listing has no chunk in hand to derive it
   * from
   */
  biome: Biome;
  cell: number;
  /**
   * Set once the boss goes down. A cleared raid keeps its landmark
   * shut for the rest of the window — the legendary has been met
   */
  cleared: boolean;
}

/**
 * What walking up to a lair offers this player. It is the one button
 * the dialog shows: a lair is looked at before anything is staged, so
 * what the button says is what pressing it does
 */
export const enum RaidAction {
  /**
   * Nothing is standing there — or what was standing there was beaten
   * back — and this player has pokemon to stage it with. Pressing it
   * opens the lobby
   */
  Host = 0,
  /**
   * A lobby is gathering and the player can bring a party to it
   */
  Join = 1,
  /**
   * There is something to watch and nothing to bring: the raid is
   * already being fought, or the player owns no pokemon of their own.
   * Watching pays nothing
   */
  Spectate = 2,
}

/**
 * What a lair holds right now, without staging anything by asking.
 *
 * Walking up to a lair used to open a lobby as a side effect of
 * looking at it, which meant a player who changed their mind had left
 * a raid standing in the world. The dialog reads this first and stages
 * only what the button it shows says it will
 */
export interface RaidView {
  /**
   * The lobby this cell's raid has, or would have when hosted
   */
  lobby: string;
  action: RaidAction;
  kind: RaidKind;
  /**
   * What the raid is named after — the lair, or the biome it stands on
   */
  lair: Lairs | null;
  biome: Biome;
  species: Species;
  /**
   * The battle to watch, when one is already being fought
   */
  battle: string | null;
  /**
   * How many parties have gathered so far
   */
  teams: number;
}

/**
 * What the lobby is called: the lair it stands in, shadowed or not.
 * The species is no longer the name — a place is the same place
 * whoever is at home in it, and two Articuno raids in one chunk were
 * two of the same word for different things
 */
export function getRaidTitle(raid: RaidRecord): string {
  return getLairTitle(raid.lair, raid.biome, raid.kind === RaidKind.Shadow);
}

/**
 * Restore a raid from an untyped row; the client and the
 * privileged server read through the same normalizer
 */
export function asRaidRecord(value: unknown): RaidRecord {
  const data = asRecord(value);
  const chunk = asRecord(data.chunk);

  return {
    kind: asNumber(data.kind) as RaidKind,
    lair: data.lair == null ? null : (asNumber(data.lair) as Lairs),
    species: asNumber(data.species) as Species,
    traitValue: asNumber(data.traitValue),
    host: asString(data.host),
    teams: asStringArray(data.teams),
    battle: typeof data.battle === 'string' ? data.battle : null,
    timestamp: asNumber(data.timestamp),
    offset: asNumber(data.offset),
    chunk: { seed: asString(chunk.seed), x: asNumber(chunk.x), y: asNumber(chunk.y) },
    biome: asNumber(data.biome) as Biome,
    cell: asNumber(data.cell),
    cleared: data.cleared === true,
  };
}
/**
 * The lobby id of a raid landmark in a given raid window. The kind is
 * part of it, so the two landmark types never collide on a cell
 */
export function raidId(
  chunk: Chunk,
  raidTimestamp: number,
  cell: number,
  kind: RaidKind = RaidKind.Legendary,
  offset = 0,
): string {
  const tag = kind === RaidKind.Shadow ? 'shadow' : 'raid';

  // The zone is part of the id because the window is local: two zones
  // can floor to the same window, and what they stage there is not the
  // same boss
  return `${chunk.seed}${toZoneKey(offset)}@${raidTimestamp}$${tag}${cell}`;
}
/**
 * The lobby id of a mythical raid: the window, the zone, the relic that
 * called it and whoever spent it. A mythical stands on no landmark,
 * so there is no cell to name — what identifies it is the item and
 * the player who used it, which also means one relic opens one lobby
 * a window rather than a lobby per attempt
 */
export function mythicalRaidId(
  chunk: Chunk,
  raidTimestamp: number,
  item: Items,
  uid: string,
  offset = 0,
): string {
  return `${chunk.seed}${toZoneKey(offset)}@${raidTimestamp}$mythical${item}:${uid}`;
}

/**
 * The reward for clearing a raid: the legendary as a meetable spawn.
 * The chunk, biome and window are the raid's, but the two rolls are
 * seeded per player, so everyone in the lobby meets their own
 * individual — different IVs, different traits, its own shiny odds
 */
export function deriveRaidReward(raid: RaidRecord, id: string, uid: string): [string, Spawn] {
  // The raid's own seed material — the lobby it was staged in and the
  // trait value it rolled — mixed with the player, so every fighter
  // walks away with their own individual of the same legendary
  const rng = new AleaRNG(`${id}:${raid.traitValue}:reward:${uid}`);

  return [`${id}$reward`, [raid.species, rng.int32(), rng.int32()]];
}
