import type Chunk from '../overworld/chunk';
import { asNumber, asRecord, asString } from './__normalize';

/**
 * A gym seat: the one place in the world where players fight each
 * other.
 *
 * Everything else somebody stands at is rolled from the chunk seed
 * and gone when the window turns. A seat is not. It belongs to the
 * cell for good, and to whoever last took it until somebody takes it
 * off them, which is what makes it a thing to come back to rather
 * than a thing to catch while it is there.
 *
 * What stands on it is a **frozen copy** of the holder's party, not
 * the party itself: they seat it and walk away with their pokemon
 * still theirs to train, evolve and field elsewhere. A challenger
 * fights the copy, and only the challenger carries anything out of
 * the fight — the wear and the spent items are settled for their side
 * alone, so holding costs the holder nothing but the gold at stake.
 *
 * Beating a seat **frees** it rather than taking it. The winner opens
 * the cell and may sit down on it themselves, with whatever their
 * party has left; the trainer they beat is barred from it for a
 * while, so the seat is genuinely open rather than handed back.
 */
export interface GymSeatRecord {
  /**
   * The cell this seat names, as `seatId` derives it
   */
  seat: string;
  /**
   * Who is holding it
   */
  holder: string;
  /**
   * The frozen party a challenger actually fights
   */
  snapshot: string;
  chunk: { seed: string; x: number; y: number };
  cell: number;
  /**
   * When this holder took it
   */
  seatedAt: number;
  /**
   * How many challenges this holder has turned away here. It belongs
   * to the stand rather than to the place, so it starts again at
   * zero whenever the seat changes hands
   */
  defenses: number;
}

/**
 * Restore a seat from an untyped row; the client and the privileged
 * server read through the same normalizer
 */
export function asGymSeatRecord(value: unknown): GymSeatRecord {
  const data = asRecord(value);
  const chunk = asRecord(data.chunk);

  return {
    seat: asString(data.seat),
    holder: asString(data.holder),
    snapshot: asString(data.snapshot),
    chunk: { seed: asString(chunk.seed), x: asNumber(chunk.x), y: asNumber(chunk.y) },
    cell: asNumber(data.cell),
    seatedAt: asNumber(data.seatedAt),
    defenses: asNumber(data.defenses),
  };
}

/**
 * The seat's id: the chunk and the cell, and nothing about time.
 *
 * Every other staged fight in the game keys its id on a window, which
 * is what makes those fights expire. This one deliberately does not:
 * the seat outlives windows, and two players who walk up to the same
 * cell a week apart are looking at the same seat
 */
export function seatId(chunk: Chunk, cell: number): string {
  return `${chunk.seed}$seat${cell}`;
}

/**
 * How the two sides line up in a seat battle. They are the raid's own
 * numbers, but neither side is the boss side — `createTrainerBattle`
 * marks nobody, so a mutual knockout is the draw it should be
 */
export const HOLDER_ALLIANCE = 0;
export const CHALLENGER_ALLIANCE = 1;

/**
 * What a seat is worth, and what it costs to try for one.
 *
 * The winner takes gold off the loser, both directions: a challenger
 * who wins strips the holder, and a holder who turns one away takes
 * the challenger's stake. That is what makes a seat worth keeping
 * rather than a number in a dialog, and it is why the rails below
 * exist — the holder is not present to stop anybody.
 *
 * A **share** rather than a flat sum, so the wager scales with what
 * each side actually has: a poor trainer risks little and a rich one
 * feels it. The share is taken of the loser's own purse, and clamped
 * by what they hold, so nobody is ever pushed below nothing.
 *
 * The share is what does the work, and the ceiling below only catches
 * the tail. Purses in this game climb a long way — one Relic Crown is
 * six hundred thousand — so anything flat is a figure that stops
 * meaning anything by the middle of the game
 */
export const SEAT_STAKE_SHARE = 0.1;

/**
 * The most one fight moves, whatever a share of the purse comes to.
 *
 * It is a tenth of a **Relic Crown**, the single richest thing the
 * ground hides, and that is the whole of the reasoning: the share
 * above governs every purse up to the value of the best find in the
 * game, and this only clips the tail beyond it. Anchoring it to the
 * top of the valuables ladder is what keeps it from going stale —
 * a flat figure chosen for early play stops meaning anything the
 * moment somebody digs up a ruin, and the ruins run from a hundred
 * thousand to six hundred
 */
export const SEAT_STAKE_LIMIT = 60_000;

/**
 * The most one challenger may take off **one** seat in a day.
 *
 * The real protection for a holder who is offline. Losing a fight
 * costs the challenger their own stake, so grinding a seat is already
 * self-limiting for anyone who might lose; this is what stops
 * somebody who cannot lose from treating a weak seat as a faucet.
 * Three good wins, and then that seat is spent for them
 */
export const SEAT_DAILY_TAKE = SEAT_STAKE_LIMIT * 3;

/**
 * How long a settled challenge bars this player from the same seat.
 *
 * Short: the stake is what really paces a challenger, and a long bar
 * would mostly punish somebody who lost a close fight. This is here
 * so a seat cannot be attacked in a tight loop
 */
export const SEAT_COOLDOWN = 30 * 60 * 1000;

/**
 * The day a take is counted in. Rolling rather than calendar, so the
 * cap cannot be dodged by waiting for midnight in some zone
 */
export const SEAT_TAKE_WINDOW = 24 * 60 * 60 * 1000;

/**
 * What this fight moves: a share of the loser's purse, held under the
 * per-fight ceiling and under whatever the taker has left of their
 * daily allowance for this seat. Never more than the loser holds
 */
export function seatStake(purse: number, allowance = SEAT_DAILY_TAKE): number {
  const wanted = Math.floor(Math.max(0, purse) * SEAT_STAKE_SHARE);

  return Math.max(0, Math.min(wanted, SEAT_STAKE_LIMIT, allowance));
}

/**
 * How long a beaten holder is kept off their own seat.
 *
 * Losing frees the cell rather than handing it over, so without this
 * the trainer who just lost could sit straight back down before the
 * winner had finished reading the result. An hour is long enough that
 * the seat is genuinely open to whoever is nearby, and short enough
 * that a seat nobody else wants comes back to them.
 *
 * It also lifts the moment somebody else sits down, so the bar is
 * whichever comes first and never a seat locked away for good
 */
export const SEAT_OUSTED_BAR = 60 * 60 * 1000;

/**
 * Where a player stands with a seat: who holds it, when they may
 * challenge it again, what they have already taken off it today, and
 * whether they are the one who was just turned out of it
 */
export interface GymSeatStanding {
  /**
   * Who is holding it, or null for a seat nobody has taken. A seat
   * that was just won off somebody reads as null too: winning frees
   * the cell rather than handing it over
   */
  seat: GymSeatRecord | null;
  /**
   * The moment this player may challenge again. Zero for a seat they
   * have never fought
   */
  cooldownUntil: number;
  /**
   * What this player has taken off this seat inside the current day
   */
  taken: number;
  /**
   * The moment this player may sit down again, for the holder who was
   * just beaten out of it. Zero for everybody else
   */
  barredUntil: number;
}
