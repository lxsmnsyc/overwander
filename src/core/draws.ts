import { hash3, hashString, hashStringFrom, toUnit } from './hash';

/** Anything a roll can be taken from, one number in [0, 1) at a time */
export interface RandomSource {
  random(): number;
}

/**
 * The rolls one decision of the world takes, each named for what it
 * decides.
 *
 * The name is what separates the two generations. The first reads a
 * single stream in the order the rolls are asked for and ignores the
 * name, which is how the live world was always built. The second
 * keys every roll on its name and how many of that name came before,
 * so a roll added under a new name changes nothing already rolled
 */
export interface Draws {
  random(label: string): number;
}

/** The first generation: one stream, taken in order */
export class StreamDraws implements Draws {
  constructor(private readonly stream: RandomSource) {}

  random(): number {
    return this.stream.random();
  }
}

/** Label hashes, folded once rather than on every roll */
const LABELS = new Map<string, number>();

function labelHash(label: string): number {
  let hash = LABELS.get(label);

  if (hash == null) {
    hash = hashString(label);
    LABELS.set(label, hash);
  }
  return hash;
}

/** What the second fold of a key starts from */
const SECOND_FOLD = 0x5bd1e995;

/**
 * The second generation: every roll keyed on its name and its count.
 *
 * The key is two 32-bit folds of its text, hashed in two lanes and
 * only mixed at the end. One fold gives a world 4,096 chunks a side
 * some 32,000 pairs of chunks rolling the same numbers; two separate
 * lanes need both folds to collide at once, which is one such pair in
 * about 130,000 worlds. Feeding both folds through one hash would not
 * do: its state is 32 bits, so the key would be squeezed back down
 */
export class KeyedDraws implements Draws {
  private readonly counts = new Map<string, number>();
  private readonly low: number;
  private readonly high: number;

  constructor(key: string) {
    this.low = hashString(key);
    this.high = hashStringFrom(key, SECOND_FOLD);
  }

  random(label: string): number {
    const count = this.counts.get(label) ?? 0;

    this.counts.set(label, count + 1);
    const name = labelHash(label);

    return toUnit((hash3(this.low, name, count) ^ hash3(this.high, name, count)) >>> 0);
  }
}

/** One named roll as a plain source, for helpers that take one */
export function sourceOf(draws: Draws, label: string): RandomSource {
  return {
    random: () => draws.random(label),
  };
}
