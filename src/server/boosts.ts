import 'server-only';
import { getSql } from './db';

/**
 * Event multipliers on what the server pays, kept as rows in `boosts`
 * so an event runs without a deploy.
 *
 * Only rewards the server decides are boosted. What the world rolls is
 * derived on the client from the seed, and a boost there would leave
 * the two disagreeing about what is standing on a cell.
 */
export const enum Boost {
  /** Candy from a catch, a hatching or a fight */
  Candy = 'candy',
  /** Gold from a stop or a raid */
  Gold = 'gold',
}

/**
 * How long a server instance trusts what it last read. A boost starts
 * or ends within this of its stamp, which is close enough for an event
 * measured in hours, and a busy instance reads the table once a minute
 * rather than once a reward
 */
const BOOST_MEMORY = 60_000;

/** A boost that has not ended, as read */
interface Running {
  reward: Boost;
  factor: number;
  from: number;
  to: number;
}

const REWARDS: ReadonlyMap<string, Boost> = new Map([
  [Boost.Candy, Boost.Candy],
  [Boost.Gold, Boost.Gold],
]);

let remembered: { at: number; boosts: Running[] } | null = null;

async function readBoosts(now: number): Promise<Running[]> {
  if (remembered != null && now - remembered.at < BOOST_MEMORY) {
    return remembered.boosts;
  }

  // Everything that has not ended, so one that starts inside the
  // memory still starts on time
  const rows = await getSql()`
    select reward, factor::float8 as factor, starts_at, ends_at
    from boosts where ends_at > ${now}
  `;
  const boosts: Running[] = [];

  for (const row of rows) {
    const reward = REWARDS.get(String(row.reward));

    if (reward != null) {
      boosts.push({
        reward,
        factor: Number(row.factor),
        from: Number(row.starts_at),
        to: Number(row.ends_at),
      });
    }
  }
  remembered = { at: now, boosts };
  return boosts;
}

/**
 * The factor a reward is multiplied by at `now`: the largest boost
 * running on it, or 1. A read that fails pays unboosted rather than
 * refusing the reward
 */
export async function boostOf(reward: Boost, now: number): Promise<number> {
  let boosts: Running[];

  try {
    boosts = await readBoosts(now);
  } catch {
    return 1;
  }

  let factor = 1;

  for (const boost of boosts) {
    if (boost.reward === reward && boost.from <= now && now < boost.to) {
      factor = Math.max(factor, boost.factor);
    }
  }
  return factor;
}

/** An amount with a factor applied, never less than it was and always whole */
export function boosted(amount: number, factor: number): number {
  return Math.max(amount, Math.round(amount * factor));
}

/** Every pile in a payout with a factor applied */
export function boostedAll<K>(earned: Iterable<[K, number]>, factor: number): Map<K, number> {
  const paid = new Map<K, number>();

  for (const [key, count] of earned) {
    paid.set(key, boosted(count, factor));
  }
  return paid;
}

/** Forget what was read, for the suite */
export function forgetBoosts(): void {
  remembered = null;
}
