import type { Stats } from '../data/constants/stats';
import type { Items } from '../data/ids/items';
import { requireUid } from '../server/firebase';
import {
  type TrainingResult,
  feedEffortBerry as feedOnServerSide,
  trainEffort as trainOnServerSide,
  useWing as useWingOnServerSide,
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
export type { TrainingResult } from '../server/training';

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
 * Use a wing from the bag on a catch: three points in the wing's stat,
 * over and above what the pokemon's levels paid for
 */
export async function useWing(catchId: string, item: Items): Promise<TrainingResult | null> {
  return useWingOnServer(await getIdToken(), catchId, item);
}

async function useWingOnServer(
  token: string,
  catchId: string,
  item: Items,
): Promise<TrainingResult | null> {
  'use server';
  return useWingOnServerSide(await requireUid(token), catchId, item);
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
