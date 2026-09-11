import 'server-only';
import Npc, {
  CHANNELER_FEE,
  REMINDER_FEE,
  TUTOR_FEE,
  getRecallableMoves,
  getTutorableMoves,
} from '../../data/overworld/npc';
import type { Moves } from '../../data/ids/moves';
import awakenAbility, { type Awakening } from '../awaken';
import { learnMove } from '../moves';
import { LearnRefusal, type LearnResult } from '../../auth/learn-refusal';
import { releaseVisit, resolveNpc, takeVisit } from './visits';

/** The two who deal in moves, and the one who deals in abilities */
/**
 * Have the Move Reminder put back a move the pokemon learned by
 * levelling and has since lost, for one Heart Scale.
 *
 * The recallable list is derived again from the **stored** species,
 * level and move list, and the scale leaves the bag in the same
 * transaction the list is written in, so it is only spent on a move
 * actually taught. `replaces` names which known move goes and is
 * ignored where there is room.
 *
 * He serves as often as a player has scales. A scale is dug out of
 * the ground and nothing sells one, so the fee is what paces him:
 * a second limit on top of it only meant a player holding five of
 * them could spend one every three hours.
 *
 * Resolves the move list as it now stands, or which rule refused it,
 * a person who has walked on among them
 */
export async function remindMove(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  move: Moves,
  replaces: number,
  now: number,
  offset: number,
): Promise<LearnResult> {
  const snapshot = resolveNpc(x, y, cell, now, offset, Npc.MoveReminder);

  if (snapshot == null) {
    return { refused: LearnRefusal.Gone };
  }
  return learnMove(uid, catchId, move, REMINDER_FEE, replaces, (species, level, known) =>
    new Set(getRecallableMoves(species, level, known)).has(move),
  );
}

/**
 * Have the Move Tutor put a teachable move on the pokemon.
 *
 * The reminder's trade run the other way: the tutor deals in what a
 * machine would teach rather than in what levelling once gave, for
 * the same one Heart Scale. It leaves the bag in the transaction the
 * move is written in, so a refusal costs nothing.
 *
 *
 * He serves as often as a player has scales, for the reason the
 * reminder does: the scale is the limit, and it is a real one.
 *
 * Resolves the move list as it now stands, or which rule refused it,
 * a person who has walked on among them
 */
export async function tutorMove(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  move: Moves,
  replaces: number,
  now: number,
  offset: number,
): Promise<LearnResult> {
  const snapshot = resolveNpc(x, y, cell, now, offset, Npc.MoveTutor);

  if (snapshot == null) {
    return { refused: LearnRefusal.Gone };
  }
  return learnMove(uid, catchId, move, TUTOR_FEE, replaces, (species, _level, known) =>
    new Set(getTutorableMoves(species, known)).has(move),
  );
}

/**
 * Have the Channeler draw a second ability out of the pokemon, for
 * one Heart Scale.
 *
 * The slot she opens and the ability that fills it are written
 * together, so a pokemon is never left holding room for nothing. What
 * comes out is seeded by the visit rather than the moment, so asking
 * again while she stands there is the same question rather than
 * another roll at it.
 *
 * Resolves what she drew out, or null when she refuses: the catch is
 * not the player's, it is fighting, locked or still an egg, no scale
 * is carried, the pokemon has no room left, its line has nothing it
 * does not already have, or this window's visit has already been made
 */
export async function channelAbility(
  uid: string,
  x: number,
  y: number,
  cell: number,
  catchId: string,
  now: number,
  offset: number,
): Promise<Awakening | null> {
  const snapshot = resolveNpc(x, y, cell, now, offset, Npc.Channeler);

  if (snapshot == null) {
    return null;
  }

  const visit = await takeVisit(snapshot, 'channel', cell, uid, { caught: catchId });

  if (visit == null) {
    return null;
  }

  const seed = `${snapshot.key}${snapshot.npcTimestamp}channel${cell}:${uid}:${catchId}`;

  let drawn: Awakening | null;

  try {
    drawn = await awakenAbility(uid, catchId, CHANNELER_FEE, seed);
  } catch (error) {
    await releaseVisit(visit);
    throw error;
  }

  // She was asked and drew nothing out — no scale, a pokemon she
  // cannot touch, a line with nothing left in it. The window is given
  // back with it
  if (drawn == null) {
    await releaseVisit(visit);
  }
  return drawn;
}

/**
 * What a trade with the vendor left the player holding: the gold
 * balance and how much of the item is now in the bag
 */
export interface TradeResult {
  gold: number;
  carried: number;
}
