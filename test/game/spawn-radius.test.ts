import { describe, expect, it } from 'vitest';
import { BOARD_RADIUS } from '../../src/game/overworld/board-metrics';
import {
  DRAW_RADIUS,
  STANDING_AFTER_MS,
  isDrawn,
  spawnAlpha,
  wasStanding,
} from '../../src/game/overworld/spawn-radius';
import {
  FADE_IN_MS,
  FADE_IN_NEAR_MS,
  FADE_OUT_MS,
  NEAR_RING_CELLS,
  SLOT_PERIOD,
} from '../../src/overworld/spawn-life';

const live = { cycle: { start: 1_000_000, end: 1_000_000 + 240_000 } };
const far = NEAR_RING_CELLS + 3;
const beside = 1;

describe('spawnAlpha', () => {
  it('is 0 at the cycle start and 1 once the fade in is over', () => {
    expect(spawnAlpha(live, live.cycle.start, far)).toBe(0);
    expect(spawnAlpha(live, live.cycle.start + FADE_IN_MS / 2, far)).toBeCloseTo(0.5);
    expect(spawnAlpha(live, live.cycle.start + FADE_IN_MS, far)).toBe(1);
    expect(spawnAlpha(live, live.cycle.start + 60_000, far)).toBe(1);
  });

  it('fades in slower when it starts beside the player', () => {
    const at = live.cycle.start + FADE_IN_MS;

    expect(spawnAlpha(live, at, beside)).toBeLessThan(1);
    expect(spawnAlpha(live, at, far)).toBe(1);
    expect(spawnAlpha(live, live.cycle.start + FADE_IN_NEAR_MS / 2, beside)).toBeCloseTo(0.5);
    expect(spawnAlpha(live, live.cycle.start + FADE_IN_NEAR_MS, beside)).toBe(1);
    expect(spawnAlpha(live, live.cycle.start, NEAR_RING_CELLS)).toBe(0);
  });

  it('is not drawn whole on the first frame beside a walking player', () => {
    for (const tick of [0, 16, 33, 100]) {
      expect(spawnAlpha(live, live.cycle.start + tick, beside)).toBeLessThan(0.1);
    }
  });

  it('starts falling FADE_OUT_MS before the end and is 0 at it', () => {
    const { end } = live.cycle;

    expect(spawnAlpha(live, end - FADE_OUT_MS, far)).toBe(1);
    expect(spawnAlpha(live, end - FADE_OUT_MS / 2, far)).toBeCloseTo(0.5);
    expect(spawnAlpha(live, end, far)).toBe(0);
    expect(spawnAlpha(live, end + 5_000, far)).toBe(0);
  });

  it('is 1 for one already standing, until its fade out', () => {
    const early = live.cycle.start + 100;

    expect(spawnAlpha(live, early, beside, true)).toBe(1);
    expect(spawnAlpha(live, live.cycle.end - FADE_OUT_MS / 2, beside, true)).toBeCloseTo(0.5);
  });

  it('follows the clock through a press during a fade without a state of its own', () => {
    const at = live.cycle.start + FADE_IN_MS / 4;

    expect(spawnAlpha(live, at, far)).toBe(spawnAlpha(live, at, far));
    expect(spawnAlpha(live, at, far)).toBeGreaterThan(0);
  });

  it('stays inside 0 to 1 for a cycle shorter than both fades', () => {
    const short = { cycle: { start: 0, end: 500 } };

    for (let at = -100; at <= 700; at += 50) {
      const alpha = spawnAlpha(short, at, beside);

      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThanOrEqual(1);
    }
  });
});

describe('wasStanding', () => {
  it('holds for one seen after its cycle had begun, not for one seen as it began', () => {
    expect(wasStanding(live.cycle, live.cycle.start + 20)).toBe(false);
    expect(wasStanding(live.cycle, live.cycle.start + STANDING_AFTER_MS)).toBe(false);
    expect(wasStanding(live.cycle, live.cycle.start + STANDING_AFTER_MS + 1)).toBe(true);
    expect(wasStanding(live.cycle, live.cycle.start + SLOT_PERIOD / 2)).toBe(true);
  });
});

describe('isDrawn', () => {
  it('is the board circle and no wider', () => {
    expect(DRAW_RADIUS).toBe(BOARD_RADIUS);
    expect(isDrawn(0)).toBe(true);
    expect(isDrawn(BOARD_RADIUS)).toBe(true);
    expect(isDrawn(BOARD_RADIUS + 0.01)).toBe(false);
  });
});
