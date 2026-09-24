// Rows arrive untyped; the reads below restore const-enum fields via
// assertions that tsc requires but tsgolint (resolving const enums to
// number) considers unnecessary
// oxlint-disable typescript/no-unnecessary-type-assertion
import type DungeonKind from '../data/overworld/dungeon';
import type Chunk from '../overworld/chunk';
import type { Depth } from '../overworld/depth';
import type { Direction } from '../overworld/dungeon/floor';
import type { Footing } from '../overworld/dungeon/tread';
import { asNumber, asRecord, asString } from './__normalize';
import { toZoneKey } from './local-time';

/**
 * One player's run through one dungeon in one window. Per player, like
 * a stop: clearing it shuts it for this player alone
 */
export interface DungeonRun {
  id: string;
  kind: DungeonKind;
  /** The local NPC window the dungeon belongs to */
  timestamp: number;
  offset: number;
  chunk: { seed: string; x: number; y: number };
  depth: Depth;
  cell: number;
  /** The catches locked in at the entrance; empty before a run starts */
  party: string[];
  floor: number;
  /** Where the player stands on the floor; null before a run starts */
  state: Footing | null;
  /** Rooms whose fight is won on this floor */
  beaten: number[];
  /** Stashes taken this window, as `floor:cell` */
  looted: string[];
  /** The fight under way, if any, and the room it is for */
  battle: string | null;
  battleRoom: number | null;
  cleared: boolean;
}

function asNumbers(value: unknown): number[] {
  const out: number[] = [];

  if (Array.isArray(value)) {
    for (const entry of value) {
      out.push(asNumber(entry));
    }
  }
  return out;
}

function asStrings(value: unknown): string[] {
  const out: string[] = [];

  if (Array.isArray(value)) {
    for (const entry of value) {
      out.push(asString(entry));
    }
  }
  return out;
}

export function asFooting(value: unknown): Footing | null {
  if (value == null || typeof value !== 'object') {
    return null;
  }

  const data = asRecord(value);

  return {
    at: asNumber(data.at),
    facing: asNumber(data.facing) as Direction,
    flipped: data.flipped === true,
    keys: asNumber(data.keys),
    opened: asNumbers(data.opened),
    taken: asNumbers(data.taken),
    crumbled: asNumbers(data.crumbled),
    filled: asNumbers(data.filled),
    boulders: asNumbers(data.boulders),
    pass: data.pass === true,
  };
}

/** Restore a run from an untyped row; client and server read through this */
export function asDungeonRun(value: unknown): DungeonRun {
  const data = asRecord(value);
  const chunk = asRecord(data.chunk);

  return {
    id: asString(data.id),
    kind: asNumber(data.kind) as DungeonKind,
    timestamp: asNumber(data.timestamp),
    offset: asNumber(data.offset),
    chunk: { seed: asString(chunk.seed), x: asNumber(chunk.x), y: asNumber(chunk.y) },
    depth: asNumber(data.depth) as Depth,
    cell: asNumber(data.cell),
    party: asStrings(data.party),
    floor: asNumber(data.floor),
    state: asFooting(data.state),
    beaten: asNumbers(data.beaten),
    looted: asStrings(data.looted),
    battle: typeof data.battle === 'string' ? data.battle : null,
    battleRoom: typeof data.battleRoom === 'number' ? data.battleRoom : null,
    cleared: data.cleared === true,
  };
}

/** The dungeon's id for a window; the player is kept beside it, not in it */
export function dungeonIdOf(chunk: Chunk, npcTimestamp: number, cell: number, offset = 0): string {
  return `${chunk.seed}${toZoneKey(offset)}@${npcTimestamp}$dungeon${cell}`;
}

/** What one room's fight is seeded from: its curtain, panel, crate and Dome */
export function dungeonFightSeed(run: string, floor: number, room: number): string {
  return `${run}:${floor}:${room}`;
}

/** The key a taken stash is remembered by */
export function lootKey(floor: number, cell: number): string {
  return `${floor}:${cell}`;
}
