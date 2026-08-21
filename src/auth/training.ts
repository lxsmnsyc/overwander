import type { Stats } from '../data/constants/stats';
import type { Items } from '../data/ids/items';
import type { Moves } from '../data/ids/moves';
import { requireUid } from '../server/auth';
import {
  type MovePointsResult,
  type TrainingResult,
  feedEffortBerry as feedOnServerSide,
  trainEffort as trainOnServerSide,
  useEffortItem as useEffortItemOnServerSide,
  usePPItem as usePPItemOnServerSide,
} from '../server/training';
import getIdToken from './session';

/**
 * Training a pokemon: where its effort goes, and what moves it.
 *
 * The catch sheet works out what is possible with the same arithmetic
 * the server does — see [`src/auth/effort.ts`](./effort.ts) — so the
 * buttons say the truth before they are pressed. What actually
 * changes a record is decided again here against the stored one.
 */
export type { MovePointsResult, TrainingResult } from '../server/training';

/**
 * Put unspent effort into a stat, or take it back out with a negative
 * amount. Nothing is consumed either way
 */
export async function trainEffort(
  catchId: string,
  stat: Stats,
  amount: number,
): Promise<TrainingResult | null> {
  return trainEffortOnServer(await getIdToken(), catchId, stat, amount);
}

async function trainEffortOnServer(
  token: string,
  catchId: string,
  stat: Stats,
  amount: number,
): Promise<TrainingResult | null> {
  'use server';
  return trainOnServerSide(await requireUid(token), catchId, stat, amount);
}

/**
 * Use a wing or a vitamin from the bag on a catch: points in the
 * item's own stat, over and above what the pokemon's levels paid for
 */
export async function useEffortItem(catchId: string, item: Items): Promise<TrainingResult | null> {
  return useEffortItemOnServer(await getIdToken(), catchId, item);
}

async function useEffortItemOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<TrainingResult | null> {
  'use server';
  return useEffortItemOnServerSide(await requireUid(token), catchId, item);
}

/**
 * Spend a PP Up or a PP Max from the bag on one of a pokemon's moves.
 * What it buys is a shorter cooldown on that move, and it cannot be
 * undone
 */
export async function usePPItem(
  catchId: string,
  move: Moves,
  item: Items,
): Promise<MovePointsResult | null> {
  return usePPItemOnServer(await getIdToken(), catchId, move, item);
}

async function usePPItemOnServer(
  token: string,
  catchId: string,
  move: Moves,
  item: Items,
): Promise<MovePointsResult | null> {
  'use server';
  return usePPItemOnServerSide(await requireUid(token), catchId, move, item);
}

/**
 * Feed a bitter berry from the bag: ten points of training off its
 * stat, back into the pool, and a little more friendship
 */
export async function feedEffortBerry(
  catchId: string,
  item: Items,
): Promise<TrainingResult | null> {
  return feedEffortBerryOnServer(await getIdToken(), catchId, item);
}

async function feedEffortBerryOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<TrainingResult | null> {
  'use server';
  return feedOnServerSide(await requireUid(token), catchId, item);
}
