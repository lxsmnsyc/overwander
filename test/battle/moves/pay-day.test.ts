import { describe, expect, it } from 'vitest';
import Abilities from '../../../src/data/ids/abilities';
import { Moves } from '../../../src/data/ids/moves';
import { getCastTime } from '../../../src/battle/mechanics/move/timing';
import {
  HAPPY_HOUR_FACTOR,
  PAY_DAY_COINS_PER_LEVEL,
  canCallHappyHour,
  payDayCeiling,
} from '../../../src/battle/moves/pay-day';

describe('what a Pay Day report may claim', () => {
  it('is nothing from a pokemon that could never have used the move', () => {
    expect(payDayCeiling(100, [Moves.Tackle], [], 60_000)).toBe(0);
  });

  it('is one use at the start, and one more for every cast the fight had time for', () => {
    const cast = getCastTime(0);

    expect(payDayCeiling(50, [Moves.PayDay], [], 0)).toBe(PAY_DAY_COINS_PER_LEVEL * 50);
    expect(payDayCeiling(50, [Moves.PayDay], [], cast * 3 + 1)).toBe(
      PAY_DAY_COINS_PER_LEVEL * 50 * 4,
    );
  });

  it('counts a move that borrows others, or Imposter, as able to use it', () => {
    expect(payDayCeiling(10, [Moves.Metronome], [], 0)).toBeGreaterThan(0);
    expect(payDayCeiling(10, [Moves.MirrorMove], [], 0)).toBeGreaterThan(0);
    expect(payDayCeiling(10, [Moves.Tackle], [Abilities.Imposter], 0)).toBeGreaterThan(0);
  });

  it('doubles when the team could have called Happy Hour', () => {
    expect(payDayCeiling(50, [Moves.PayDay], [], 0, true)).toBe(
      PAY_DAY_COINS_PER_LEVEL * 50 * HAPPY_HOUR_FACTOR,
    );
    expect(canCallHappyHour([Moves.HappyHour], [])).toBe(true);
    expect(canCallHappyHour([Moves.Metronome], [])).toBe(true);
    expect(canCallHappyHour([Moves.Tackle], [])).toBe(false);
  });

  it('never counts a clock that ran backwards', () => {
    expect(payDayCeiling(10, [Moves.PayDay], [], -60_000)).toBe(PAY_DAY_COINS_PER_LEVEL * 10);
  });
});
