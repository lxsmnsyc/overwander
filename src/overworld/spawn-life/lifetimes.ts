import AleaRNG from '../../core/alea';
import { commonSpawn, rareSpawn } from '../../data/biome';
import { spawnId } from '../../model/snapshot-record';
import { toZoneKey } from '../../model/local-time';
import type Chunk from '../chunk';
import { PLACEMENT_AREA, centeredCells } from '../chunk';
import ChunkSnapshot from '../chunk-snapshot';
import { CHUNK_CELLS } from '../grid';
import {
  HOUR,
  type LiveSpawn,
  MEET_DRIFT_CELLS,
  MEET_DRIFT_MS,
  MIN_STAY,
  PRESENT_MAX,
  PRESENT_MIN,
  RARE_ODDS_SCALE,
  RARE_SLOT,
  SLOT_COUNT,
  SLOT_PERIOD,
  SLOT_TOTAL,
  type SlotCycle,
  type SlotKind,
} from './index';

/** Memos stop growing here and start over, so a long session keeps a bounded few */
const MEMO_LIMIT = 2048;

/**
 * Where each slot of a chunk may start during one local hour. A slot's
 * territory is its own cells, so two slots never start on the same cell
 */
export interface SpawnGround {
  /** What each slot is this hour: a street slot with no street cell left is a country one */
  kinds: SlotKind[];
  /** The start cells of each slot, in the order a draw indexes into */
  territories: number[][];
  /** The cells the hour holds closed: furniture, rock, lava and the hour's phenomena */
  closed: Set<number>;
}

const grounds = new Map<string, SpawnGround>();
const rolls = new Map<string, LiveSpawn | null>();

function remember<T>(memo: Map<string, T>, key: string, value: T): T {
  if (memo.size >= MEMO_LIMIT) {
    memo.clear();
  }
  memo.set(key, value);
  return value;
}

/** The chunk and zone together, as `ChunkSnapshot.key` has them */
function keyOf(chunk: Chunk, offset: number): string {
  return `${chunk.seed}${toZoneKey(offset)}`;
}

/** Where in its period a slot's first cycle starts */
export function slotPhase(chunkKey: string, slot: number): number {
  return Math.floor(new AleaRNG(`${chunkKey}slotphase${slot}`).random() * SLOT_PERIOD);
}

/**
 * Whether a pokemon that starts on `home` may stay past the hour mark
 * the ground `next` begins at: its cell is still open in that hour.
 * `spawn-roaming` widens this from the start cell to every cell of the
 * roam area, and nothing else about the crossing changes
 */
export function staysOpen(next: SpawnGround, home: number): boolean {
  return !next.closed.has(home);
}

/**
 * One cycle of a slot: where it ends, and the stream its roll goes on
 * from, with the present length and the start cell already drawn.
 *
 * A cycle that runs past the next hour mark keeps its full length when
 * its ground stays open in that hour, and ends at the mark otherwise
 */
function openCycle(
  chunk: Chunk,
  offset: number,
  slot: number,
  cycle: number,
): { found: SlotCycle | null; rng: AleaRNG; home: number | null } {
  const chunkKey = keyOf(chunk, offset);
  const rng = new AleaRNG(`${chunkKey}slot${slot}cycle${cycle}`);
  const start = slotPhase(chunkKey, slot) + cycle * SLOT_PERIOD;
  const present = PRESENT_MIN + Math.floor(rng.random() * (PRESENT_MAX - PRESENT_MIN));
  const mark = (Math.floor(start / HOUR) + 1) * HOUR;
  const territory = getSpawnGround(chunk, offset, start).territories[slot];
  // The draw is taken only where there is a cell to start on
  const home =
    territory.length === 0 ? null : territory[Math.floor(rng.random() * territory.length)];
  let end = start + present;

  if (end > mark && (home == null || !staysOpen(getSpawnGround(chunk, offset, mark), home))) {
    end = mark;
  }
  return { found: end - start < MIN_STAY ? null : { slot, cycle, start, end }, rng, home };
}

/** Cycle `cycle` of a slot, or null when the hour cuts it shorter than a stay is worth */
export function cycleOf(
  chunk: Chunk,
  offset: number,
  slot: number,
  cycle: number,
): SlotCycle | null {
  return openCycle(chunk, offset, slot, cycle).found;
}

/** The cycle of a slot that stands at `time`, or null while it rests */
export function cycleAt(
  chunk: Chunk,
  offset: number,
  slot: number,
  time: number,
): SlotCycle | null {
  const chunkKey = keyOf(chunk, offset);
  const cycle = Math.floor((time - slotPhase(chunkKey, slot)) / SLOT_PERIOD);
  const found = cycleOf(chunk, offset, slot, cycle);

  return found != null && time >= found.start && time < found.end ? found : null;
}

/** What a slot is when its hour has `streets` and `country` cells to start on */
function kindOf(slot: number, streets: number, country: number): SlotKind {
  if (slot === RARE_SLOT) {
    return 'rare';
  }

  // Each slot takes the streets' share in turn, so any prefix a lure
  // reveals keeps that share
  const share = streets / Math.max(1, streets + country);
  const onStreet = streets > 0 && Math.floor((slot + 1) * share) > Math.floor(slot * share);

  if (onStreet) {
    return 'street';
  }
  return slot < SLOT_COUNT ? 'country' : 'lure';
}

/** Fisher-Yates, in place */
function shuffle(cells: number[], rng: AleaRNG): void {
  for (let at = cells.length - 1; at > 0; at--) {
    const other = Math.floor(rng.random() * (at + 1));
    const held = cells[at];

    cells[at] = cells[other];
    cells[other] = held;
  }
}

/** Deal a shuffled list round-robin to the slots in order */
function deal(cells: number[], slots: number[], territories: number[][]): void {
  for (let at = 0; at < cells.length; at++) {
    territories[slots[at % slots.length]].push(cells[at]);
  }
}

/**
 * The cells a pokemon may start on during the local hour holding `time`,
 * cut into one territory per slot. Memoised per chunk key and hour
 */
export function getSpawnGround(chunk: Chunk, offset: number, time: number): SpawnGround {
  const chunkKey = keyOf(chunk, offset);
  const hour = Math.floor(time / HOUR);
  const memo = `${chunkKey}@${hour}`;
  const held = grounds.get(memo);

  if (held != null) {
    return held;
  }

  // The hour's closed cells come off a snapshot of the hour, since the
  // phenomena that hold ground are the hour's own
  const closed = new ChunkSnapshot(chunk, hour * HOUR, offset).getClosedCells();
  const streets: number[] = [];
  const country: number[] = [];

  for (const cell of centeredCells(PLACEMENT_AREA)) {
    if (!closed.has(cell)) {
      (chunk.isTownCell(cell) ? streets : country).push(cell);
    }
  }

  const rng = new AleaRNG(`${chunkKey}ground${hour}`);
  const kinds: SlotKind[] = [];
  const territories: number[][] = [];
  const onStreets: number[] = [];

  for (let slot = 0; slot < SLOT_TOTAL; slot++) {
    kinds.push(kindOf(slot, streets.length, country.length));
    territories.push([]);
    if (kinds[slot] === 'street') {
      onStreets.push(slot);
    }
  }

  // The street slots deal from the streets. One the streets cannot reach
  // falls back to the country, and is one of its slots from then on
  shuffle(streets, rng);
  deal(streets, onStreets, territories);

  const onCountry: number[] = [];

  for (let slot = 0; slot < SLOT_TOTAL; slot++) {
    if (kinds[slot] === 'street' && territories[slot].length === 0) {
      kinds[slot] = slot < SLOT_COUNT ? 'country' : 'lure';
    }
    if (kinds[slot] !== 'street') {
      onCountry.push(slot);
    }
  }
  shuffle(country, rng);
  deal(country, onCountry, territories);

  return remember(grounds, memo, { kinds, territories, closed });
}

/**
 * The pokemon of one cycle of a slot, or null when nothing lives where
 * it would start. Memoised per spawn id
 */
export function rollSlot(
  chunk: Chunk,
  offset: number,
  slot: number,
  cycle: SlotCycle,
): LiveSpawn | null {
  const chunkKey = keyOf(chunk, offset);
  const id = spawnId(chunkKey, cycle.start, slot);

  if (rolls.has(id)) {
    return rolls.get(id) ?? null;
  }

  const ground = getSpawnGround(chunk, offset, cycle.start);

  // The draws in order: present length, start cell, species, individual
  // value, trait value. A later change to this order is a decision
  const { rng, home } = openCycle(chunk, offset, slot, cycle.cycle);

  if (home == null) {
    return remember(rolls, id, null);
  }

  const kind = ground.kinds[slot];
  const snapshot = new ChunkSnapshot(chunk, cycle.start, offset);
  const pool = kind === 'street' ? snapshot.getStreetPool() : snapshot.getCellPool(home);
  const random = (): number => rng.random();
  const species =
    kind === 'rare' ? rareSpawn(pool, random, RARE_ODDS_SCALE) : commonSpawn(pool, random);

  if (species == null) {
    return remember(rolls, id, null);
  }
  return remember(rolls, id, {
    id,
    slot,
    kind,
    cycle,
    home,
    spawn: snapshot.finishSpawn(species, rng),
  });
}

/** Every pokemon standing at `time` */
export function liveSpawns(chunk: Chunk, offset: number, time: number): LiveSpawn[] {
  const live: LiveSpawn[] = [];

  for (let slot = 0; slot < SLOT_TOTAL; slot++) {
    const cycle = cycleAt(chunk, offset, slot, time);

    if (cycle == null) {
      continue;
    }

    const rolled = rollSlot(chunk, offset, slot, cycle);

    if (rolled != null) {
      live.push(rolled);
    }
  }
  return live;
}

/** A spawn id taken apart, or null when it is not one */
export function parseSpawnId(id: string): { key: string; start: number; slot: number } | null {
  const at = id.lastIndexOf('@');
  const found = /^(-?\d+)#(\d+)$/.exec(id.slice(at + 1));

  if (at <= 0 || found == null) {
    return null;
  }

  const parsed = { key: id.slice(0, at), start: Number(found[1]), slot: Number(found[2]) };

  // One spawn has one id: anything that does not read back as itself
  // (`#07`, `@-0#3`) is refused
  return spawnId(parsed.key, parsed.start, parsed.slot) === id ? parsed : null;
}

/**
 * Where a pokemon stands at `time`. It stays on its start cell until
 * `spawn-roaming` swaps this for `positionAt`
 */
function findCellAt(live: LiveSpawn, _time: number): number {
  return live.home;
}

/** The cells between two cells of a chunk, the larger of the two axes */
function cellDistance(first: number, second: number): number {
  return Math.max(
    Math.abs((first % CHUNK_CELLS) - (second % CHUNK_CELLS)),
    Math.abs(Math.floor(first / CHUNK_CELLS) - Math.floor(second / CHUNK_CELLS)),
  );
}

/**
 * The server's check of a meeting: the pokemon a spawn id names, when
 * it stands at `localNow` (within the drift), rolls the individual value
 * the client sent and stands within a cell of `cell`. Null refuses it
 */
export function checkMeeting(
  chunk: Chunk,
  offset: number,
  id: string,
  individualValue: number,
  cell: number,
  localNow: number,
): LiveSpawn | null {
  const parsed = parseSpawnId(id);

  // The id must name this chunk and a slot it has
  if (
    parsed == null ||
    parsed.key !== keyOf(chunk, offset) ||
    parsed.slot >= SLOT_TOTAL ||
    !Number.isSafeInteger(parsed.start)
  ) {
    return null;
  }

  // A cycle must begin exactly there
  const phase = slotPhase(parsed.key, parsed.slot);
  const cycleNumber = (parsed.start - phase) / SLOT_PERIOD;

  if (!Number.isInteger(cycleNumber)) {
    return null;
  }

  const cycle = cycleOf(chunk, offset, parsed.slot, cycleNumber);

  // It must be present, give or take the drift
  if (
    cycle == null ||
    localNow < cycle.start - MEET_DRIFT_MS ||
    localNow >= cycle.end + MEET_DRIFT_MS
  ) {
    return null;
  }

  const live = rollSlot(chunk, offset, parsed.slot, cycle);

  // The roll must be the one the client holds
  if (live == null || live.spawn[1] !== individualValue) {
    return null;
  }

  // And it must stand where the client pressed
  const near =
    cellDistance(cell, findCellAt(live, localNow)) <= MEET_DRIFT_CELLS ||
    cellDistance(cell, findCellAt(live, localNow - MEET_DRIFT_MS)) <= MEET_DRIFT_CELLS;

  return near ? live : null;
}
