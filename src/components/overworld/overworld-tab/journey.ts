import type { NestOffer } from '../../../server/overworld';
import type { EggState } from '../NestDialog';

/**
 * A walk in progress: where it is going, and what happens when it gets
 * there.
 *
 * The goal is a world cell rather than a board one. The board follows
 * the player, so a square four cells ahead of them is a different
 * board cell after every step, and a walk kept in the board's numbers
 * would chase its own tail
 */
export interface Journey {
  /** The cell being walked to, or the one being walked up to */
  goalX: number;
  goalY: number;
  /**
   * Whether the goal is a thing rather than a place: something stands
   * on it, so the walk ends beside it and reaches out
   */
  act: boolean;
}

/**
 * Whether an egg the world is holding is still going spare, or is one
 * this player has already had out of this window
 */
export function stateOf(offer: NestOffer): EggState {
  return offer.taken ? 'taken' : 'offered';
}
