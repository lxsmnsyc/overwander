import 'server-only';
import AleaRNG from '../core/alea';
import { WORLD_MAX, WORLD_MIN } from '../overworld/world';
import { asChunkCoordinate } from '../auth/position-record';
import findPlayer, { nameOf } from './players';
import getWorld from '../overworld/current';
import { pickFreeCell } from '../overworld/start';
import savePosition, { readPosition } from './positions';

/**
 * Putting a player somewhere, by the authority of whoever asked.
 *
 * The ordinary save is the player's own report of themselves and is
 * clamped rather than checked. This is the other thing: one account
 * moving another, which nothing else in the game does. The caller is
 * checked for the admin role before anything here runs.
 */

/** Where somebody ended up, for the line the bar prints back */
export interface TeleportOutcome {
  /** Who moved, and what to call them */
  player: string;
  nickname: string;
  chunkX: number;
  chunkY: number;
  cellX: number;
  cellY: number;
  /** The stamp it was written under, which the caller's screen adopts */
  movedAt: number;
}

/**
 * Where the caller asked for. An axis left out is drawn rather than
 * refused: `x:100` on its own means "chunk 100, anywhere down"
 */
export interface TeleportWanted {
  x?: number;
  y?: number;
  /** Somebody to stand beside, instead of a coordinate */
  to?: string;
}

/** A chunk coordinate drawn at random, for an axis nobody named */
function anywhere(rng: AleaRNG): number {
  return WORLD_MIN + Math.floor(rng.random() * (WORLD_MAX - WORLD_MIN + 1));
}

/**
 * Move a player, and answer where they ended up.
 *
 * Throws rather than returning a reason: every one of these is
 * somebody mistyping at a bar, and the bar has one line to say so in
 */
export default async function teleport(
  caller: string,
  named: string,
  wanted: TeleportWanted,
  now: number,
): Promise<TeleportOutcome> {
  const player = await findPlayer(caller, named);

  if (player == null) {
    throw new Error(`Nobody answers to ${named}.`);
  }

  if (wanted.to != null) {
    const host = await findPlayer(caller, wanted.to);

    if (host == null) {
      throw new Error(`Nobody answers to ${wanted.to}.`);
    }
    const standing = await readPosition(host);

    if (standing == null) {
      throw new Error('They have not walked anywhere yet.');
    }
    await savePosition(
      player,
      standing.chunkX,
      standing.chunkY,
      standing.cellX,
      standing.cellY,
      now,
    );
    return {
      player,
      nickname: await nameOf(player),
      chunkX: standing.chunkX,
      chunkY: standing.chunkY,
      cellX: standing.cellX,
      cellY: standing.cellY,
      movedAt: now,
    };
  }

  // Drawn fresh rather than from a seed: a coordinate nobody named is
  // meant to be a different one each time it is left out
  const rng = new AleaRNG(`${player}${now}`);
  const chunkX = asChunkCoordinate(wanted.x ?? anywhere(rng));
  const chunkY = asChunkCoordinate(wanted.y ?? anywhere(rng));
  const { cellX, cellY } = pickFreeCell(getWorld(), chunkX, chunkY, rng);

  await savePosition(player, chunkX, chunkY, cellX, cellY, now);
  return { player, nickname: await nameOf(player), chunkX, chunkY, cellX, cellY, movedAt: now };
}
