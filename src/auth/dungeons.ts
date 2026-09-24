import * as v from 'valibot';
import { requireUid } from '../server/auth';
import check, { CELL, CHUNK_COORDINATE, DEPTH, ID, OFFSET, PARTY, TOKEN } from '../server/validate';
import {
  type DungeonEntry,
  type DungeonReward,
  type DungeonSettlement,
  type DungeonStep,
  beginDungeonRun as beginOnServer,
  climbDungeon as climbOnServer,
  enterDungeon as enterOnServer,
  startDungeonFight as fightOnServer,
  leaveDungeonRun as leaveOnServer,
  meetDungeonLegendary as meetOnServer,
  moveInDungeon as moveOnServer,
  settleDungeonFight as settleOnServer,
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
  DungeonReward,
  DungeonSettlement,
  DungeonStep,
} from '../server/dungeons';

/**
 * The dungeons as the client sees them: thin wrappers over
 * [`src/server/dungeons.ts`](../server/dungeons.ts), which checks every
 * step against the same floors the client draws
 */

const DIRECTION = v.picklist([Direction.North, Direction.East, Direction.South, Direction.West]);

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

/** Take one step on the floor */
export async function moveInDungeon(id: string, direction: Direction): Promise<DungeonStep | null> {
  return moveOnServerSide(await getIdToken(), id, direction);
}

async function moveOnServerSide(
  token: string,
  id: string,
  direction: Direction,
): Promise<DungeonStep | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(DIRECTION, direction);
  return moveOnServer(await requireUid(token), id, direction, await syncServerClock());
}

/** Fight whoever stands in the room; `picks` are rental indexes on a Factory floor */
export async function startDungeonFight(id: string, picks: string[]): Promise<string | null> {
  return fightOnServerSide(await getIdToken(), id, picks);
}

async function fightOnServerSide(
  token: string,
  id: string,
  picks: string[],
): Promise<string | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  check(PARTY, picks);
  return fightOnServer(await requireUid(token), id, picks, await syncServerClock());
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

/** Take the stairs to the next floor */
export async function climbDungeon(id: string): Promise<DungeonRun | null> {
  return climbOnServerSide(await getIdToken(), id);
}

async function climbOnServerSide(token: string, id: string): Promise<DungeonRun | null> {
  'use server';
  check(TOKEN, token);
  check(ID, id);
  return climbOnServer(await requireUid(token), id, await syncServerClock());
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
