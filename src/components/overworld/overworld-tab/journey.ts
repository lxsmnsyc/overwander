import type { ItemStack } from '../../../data/overworld/item-pool';
import type { NestOffer } from '../../../server/overworld';
import { describeItem } from '../../details';
import type { EggState } from '../NestDialog';

/**
 * A walk in progress: where it is going, and what happens when it gets
 * there.
 *
 * The goal is a cell of the chunk the walk started in, so a walk does
 * not survive leaving it — which is the whole of what `exit` is for.
 * A threshold press is a walk to the edge cell in front of it and then
 * one step over, and that step is the last thing the walk does
 */
export interface Journey {
  /**
   * The cell being walked to, or the one being walked up to
   */
  goal: number;
  /**
   * A step out of the chunk on arrival, for a threshold press
   */
  exit: [number, number] | null;
  /**
   * Whether the goal is a thing rather than a place: something stands
   * on it, so the walk ends beside it and reaches out
   */
  act: boolean;
}

/**
 * What a stash came to, read out: "3 Poke Ball, 2 Ultra Ball and a
 * Fire Stone". A single piece is named without a count, since one of
 * something is what a cache used to always be
 */
export function describeStash(stash: ItemStack[]): string {
  const parts = stash.map(({ item, amount }) =>
    amount === 1 ? describeItem(item) : `${amount} × ${describeItem(item)}`,
  );

  if (parts.length <= 1) {
    return parts[0] ?? 'nothing';
  }
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Whether an egg the world is holding is still going spare, or is one
 * this player has already had out of this window
 */
export function stateOf(offer: NestOffer): EggState {
  return offer.taken ? 'taken' : 'offered';
}
