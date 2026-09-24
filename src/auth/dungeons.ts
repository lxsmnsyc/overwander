import * as v from 'valibot';
import { requireUid } from '../server/auth';
import check, { CELL, CHUNK_COORDINATE, DEPTH, ID, OFFSET, PARTY, TOKEN } from '../server/validate';
import {
  type DungeonEntry,
  type DungeonPress,
  type DungeonReward,
  type DungeonSettlement,
  type DungeonWalk,
  WALK_LIMIT,
  beginDungeonRun as beginOnServer,
  enterDungeon as enterOnServer,
  startDungeonFight as fightOnServer,
  leaveDungeonRun as leaveOnServer,
  meetDungeonLegendary as meetOnServer,
  pressInDungeon as pressOnServer,
  settleDungeonFight as settleOnServer,
  walkDungeon as walkOnServer,
} from '../server/dungeons';
import type ChunkSnapshot from '../overworld/chunk-snapshot';
import type { Depth } from '../overworld/depth';
import { Direction } from '../overworld/dungeon/floor';
import type { DungeonRun } from './dungeon-record';
import { syncServerClock } from './clock';
import getIdToken from './session';

export type { DungeonRun } from './dungeon-record';
export type {
  DungeonEntry,
  DungeonPress,
  DungeonReward,
  DungeonSettlement,
  DungeonWalk,
  DungeonWalkEvent,
} from '../server/dungeons';

/**
 * The dungeons as the client sees them: thin wrappers over
 * [`src/server/dungeons.ts`](../server/dungeons.ts), which checks every
 * step against the same floors the client draws
 */

const DIRECTION = v.picklist([Direction.North, Direction.East, Direction.South, Direction.West]);
const STEPS = v.pipe(v.array(DIRECTION), v.maxLength(WALK_LIMIT));
const GRID_CELL = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4096));

/** Walk up to a dungeon and read this window's run */
export async function enterDungeon(snapshot: ChunkSnapshot, cell: number): Promise<DungeonEntry> {
  return enterOnServerSide(
    await getIdToken(),
    snapshot.chunk.x,
    snapshot.chunk.y,
    cell,
    snapshot.offset,
    snapshot.depth,
  );
}

async function enterOnServerSide(
  token: string,
  x: number,
  y: number,
  cell: number,
  offset: number,
  depth: Depth,
): Promise<DungeonEntry> {
  'use server';
  check(TOKEN, token);
  check(CHUNK_COORDINATE, x);
  check(CHUNK_COORDINATE, y);
  check(CELL, cell);
  check(OFFSET, offset);
  check(DEPTH, depth);
  return enterOnServer(await requireUid(token), x, y, cell, await syncServerClock(), offset, depth);
}

/** Lock a party in and start on the first floor */
export async function beginDungeonRun(id: string, catches: string[]): Promise<DungeonRun | null> {
  return beginOnServerSide(await getIdToken(), id, catches);
}

async function beginOnServerSide(
  token: string,
  id: string,
  catches: string[],
): Promise<DungeonRun | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(PARTY, catches);
  return beginOnServer(await requireUid(token), id, catches, await syncServerClock());
}

/** Walk a run of steps; the server stops at the first thing that happens */
export async function walkDungeon(id: string, steps: Direction[]): Promise<DungeonWalk | null> {
  return walkOnServerSide(await getIdToken(), id, steps);
}

async function walkOnServerSide(
  token: string,
  id: string,
  steps: Direction[],
): Promise<DungeonWalk | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(STEPS, steps);
  return walkOnServer(await requireUid(token), id, steps, await syncServerClock());
}

/** Press whatever is faced after turning to `facing` */
export async function pressInDungeon(id: string, facing: Direction): Promise<DungeonPress | null> {
  return pressOnServerSide(await getIdToken(), id, facing);
}

async function pressOnServerSide(
  token: string,
  id: string,
  facing: Direction,
): Promise<DungeonPress | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(DIRECTION, facing);
  return pressOnServer(await requireUid(token), id, facing, await syncServerClock());
}

/** Fight whoever stands at `cell`; `picks` are rental indexes on a Factory floor */
export async function startDungeonFight(
  id: string,
  cell: number,
  picks: string[],
): Promise<string | null> {
  return fightOnServerSide(await getIdToken(), id, cell, picks);
}

async function fightOnServerSide(
  token: string,
  id: string,
  cell: number,
  picks: string[],
): Promise<string | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(GRID_CELL, cell);
  check(PARTY, picks);
  return fightOnServer(await requireUid(token), id, cell, picks, await syncServerClock());
}

/** Read the room's fight back once it is over */
export async function settleDungeonFight(id: string): Promise<DungeonSettlement | null> {
  return settleOnServerSide(await getIdToken(), id);
}

async function settleOnServerSide(token: string, id: string): Promise<DungeonSettlement | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  return settleOnServer(await requireUid(token), id);
}

/** Meet the legendary at the bottom of a Dungeon */
export async function meetDungeonLegendary(id: string): Promise<DungeonReward | null> {
  return meetOnServerSide(await getIdToken(), id);
}

async function meetOnServerSide(token: string, id: string): Promise<DungeonReward | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  return meetOnServer(await requireUid(token), id, await syncServerClock());
}

/** Walk out and free the party */
export async function leaveDungeonRun(id: string): Promise<DungeonRun | null> {
  return leaveOnServerSide(await getIdToken(), id);
}

async function leaveOnServerSide(token: string, id: string): Promise<DungeonRun | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  return leaveOnServer(await requireUid(token), id);
}
