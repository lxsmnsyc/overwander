import { Items } from '../ids/items';
import { NON_VOLATILE_STATUSES, Statuses } from '../ids/status';
import { itemText } from './__create';

/**
 * The regional treats: what somebody brings back from a city they
 * went to.
 *
 * The wandering chef is the one counter that stocks them. Most are a
 * Full Heal in the hand; the one candy bar is a bottle of water that
 * came in a wrapper. What they do in a fight is in
 * [`src/battle/items/treats.ts`](../../battle/items/treats.ts).
 */

export interface Treat {
  /**
   * Health it gives back. Zero for the sweets, which only cure
   */
  restore: number;
}

/**
 * What a sweet takes off: the same six a Full Heal answers, so a
 * souvenir is never worth more than the bottle it stands in for
 */
export const TREAT_CURES: Set<Statuses> = new Set(NON_VOLATILE_STATUSES);

export const TREATS: Map<Items, Treat> = new Map([
  [Items.LavaCookie, { restore: 0 }],
  [Items.OldGateau, { restore: 0 }],
  [Items.Casteliacone, { restore: 0 }],
  [Items.LumioseGalette, { restore: 0 }],
  [Items.ShalourSable, { restore: 0 }],
  [Items.BigMalasada, { restore: 0 }],
  [Items.PewterCrunchies, { restore: 0 }],
  // The two that feed their holder rather than curing them, which
  // puts them with the drinks and not with the sweets
  [Items.RageCandyBar, { restore: 20 }],
  [Items.SweetHeart, { restore: 20 }],
]);

// The two poisons share a word, so a sweet names poison once
const CURE_WORDS = new Map<Statuses, string>([
  [Statuses.Poisoned, 'poison'],
  [Statuses.BadlyPoisoned, 'poison'],
  [Statuses.Sleeping, 'sleep'],
  [Statuses.Paralyzed, 'paralysis'],
  [Statuses.Burned, 'burn'],
  [Statuses.Frozen, 'freezing'],
]);

function describeSweet(): string {
  const cured = new Set<string>();

  for (const status of TREAT_CURES) {
    cured.add(itemText('treats', CURE_WORDS.get(status) ?? ''));
  }

  const names = [...cured];
  const last = names.pop() ?? '';
  const list = names.length > 0 ? `${names.join(', ')} or ${last}` : last;

  return itemText('treats', 'sweet', { cures: list });
}

export function isTreat(item: Items): boolean {
  return TREATS.has(item);
}

export function describeTreat(item: Items): string {
  const treat = TREATS.get(item);

  if (treat == null) {
    throw new Error(`Item ${item} is not a treat`);
  }
  return treat.restore > 0
    ? itemText('treats', 'treat', { restore: treat.restore })
    : describeSweet();
}
