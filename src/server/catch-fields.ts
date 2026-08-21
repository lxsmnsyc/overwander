import 'server-only';
import { asBoolean } from '../auth/__normalize';
import { Stats } from '../data/constants/stats';

/**
 * The parts of a catch record that are written the same way whichever
 * side of the game produced the pokemon. A catch and a nest egg are
 * made in different places and by different rules, but both start
 * with nothing trained into them and both carry the locale they were
 * made in, so those belong here rather than in one of the two
 */

/**
 * How long a locale tag is allowed to be. A real one is short; the
 * cap is there so a caller cannot write an essay into the record
 */
const LOCALE_LIMIT = 35;

/**
 * A locale tag as reported by a caller, kept to something that could
 * plausibly be one
 */
export function asLocale(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, LOCALE_LIMIT) : '';
}

/**
 * Whether the catch is still an egg, read straight off the stored
 * row. An egg is not a pokemon yet: it cannot be fed, fielded,
 * evolved or handed an item, and every one of those writes asks this
 * before it writes anything
 */
export function isEggRecord(caught: Record<string, unknown>): boolean {
  return asBoolean(caught.egg);
}

/**
 * Whether the player has marked it as one they are keeping, read
 * straight off the stored row. A favorite is refused by everything
 * that would part them with it: a release, an auction, and a trade
 * when there is one
 */
export function isFavoriteRecord(caught: Record<string, unknown>): boolean {
  return asBoolean(caught.favorite);
}

/**
 * Whether the player has put it away, read straight off the stored
 * row. A guarded pokemon is refused by everything that would
 * rewrite its sheet: a level, its effort, its values, an evolution, a
 * heal, a purifying gem, a fight, and an item given to it or taken
 * back off it. What it is still free to do is the part that is only
 * ever gained — friendship, the steps it walks beside the player, and
 * standing as a parent, which changes neither parent
 */
export function isGuardedRecord(caught: Record<string, unknown>): boolean {
  return asBoolean(caught.guarded);
}

/**
 * The effort values everything starts with
 */
export function zeroEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
}
