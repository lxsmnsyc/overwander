/**
 * What a mainline turn is worth here, in battle milliseconds.
 *
 * There are no turns in this engine: moves are cast on a clock and
 * everything that used to happen "each turn" happens on a timer. Two
 * seconds is the exchange rate, chosen because it is about what an
 * ordinary cast takes — so a fraction a turn in the mainline is a
 * fraction a move here, and a status that lasts four turns there
 * lasts eight seconds here.
 *
 * Every turn-derived number in the engine is written through this, so
 * the rate is one decision in one place rather than twenty rounded
 * guesses.
 */
export const TURN = 2000;

/** A mainline turn count as a duration. */
export default function turns(count: number): number {
  return count * TURN;
}
