import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { STEP_PACE } from '../../../src/game/overworld/board-metrics';
import { BOARD_CELLS } from '../../../src/overworld/board/index';
import { STEPS, findPath, stepDuration } from '../../../src/overworld/path';
import Strangers, {
  type Facing,
  MAX_ROUTE_STEPS,
  PLAYBACK_DELAY,
} from '../../../src/overworld/strangers';
import { readFuzzParameters } from '../arbitraries';

/**
 * A walk keeps one speed whichever way it goes. A diagonal walk once
 * snapped every few steps (33fd8466f) and then took a straight step's
 * time for √2 cells (a95ae120b). Both break these: a walk takes its
 * Euclidean length times the pace, and turning it by a right angle
 * changes nothing about how long it takes
 */
const parameters = readFuzzParameters();

const OPEN = (): boolean => true;

const cellArbitrary = fc.record({
  x: fc.integer({ min: 0, max: BOARD_CELLS - 1 }),
  y: fc.integer({ min: 0, max: BOARD_CELLS - 1 }),
});

const stepsArbitrary = fc.array(fc.constantFrom(...STEPS), {
  minLength: 1,
  maxLength: MAX_ROUTE_STEPS,
});

function toCell({ x, y }: { x: number; y: number }): number {
  return y * BOARD_CELLS + x;
}

/** A quarter turn about the middle of the board */
function turnCell({ x, y }: { x: number; y: number }): { x: number; y: number } {
  return { x: BOARD_CELLS - 1 - y, y: x };
}

function turnStep([dx, dy]: readonly [number, number]): Facing {
  return [-dy, dx];
}

/** How far a run of steps goes, as the crow flies along each step */
function measureSteps(steps: readonly (readonly [number, number])[]): number {
  let length = 0;

  for (const [dx, dy] of steps) {
    length += Math.hypot(dx, dy);
  }
  return length;
}

/** How long a route across the board takes, a step at a time */
function timeRoute(from: number, route: number[]): number {
  let time = 0;
  let at = from;

  for (const next of route) {
    const step: [number, number] = [
      (next % BOARD_CELLS) - (at % BOARD_CELLS),
      Math.floor(next / BOARD_CELLS) - Math.floor(at / BOARD_CELLS),
    ];

    time += stepDuration(step, STEP_PACE);
    at = next;
  }
  return time;
}

/**
 * Whether a stranger's run is still playing just before it should end,
 * and over, on the cell it ends on, from the moment it should end
 */
function playRun(steps: Facing[], length: number): { before: boolean; after: boolean } {
  let now = 0;
  const strangers = new Strangers(() => now, STEP_PACE);

  strangers.see({ uid: 'a', charset: 'characters/frlg/red', x: 0, y: 0, facing: [0, 1] });
  strangers.hear({ uid: 'a', x: 0, y: 0, steps, at: 0, planned: false });

  // Read forwards only: a finished run is put behind them for good
  const end = PLAYBACK_DELAY + length;
  let x = 0;
  let y = 0;

  for (const [dx, dy] of steps) {
    x += dx;
    y += dy;
  }
  now = Math.ceil(end) - 1;
  const before = strangers.standing()[0].moving;
  now = Math.ceil(end);
  const stood = strangers.standing()[0];

  return { before, after: !stood.moving && stood.x === x && stood.y === y };
}

describe('walking', () => {
  it('takes a route the length of its steps times the pace, the same turned a quarter', () => {
    fc.assert(
      fc.property(cellArbitrary, cellArbitrary, (from, to) => {
        const route = findPath(toCell(from), toCell(to), OPEN) ?? [];
        const turned = findPath(toCell(turnCell(from)), toCell(turnCell(to)), OPEN) ?? [];
        const across = Math.abs(to.x - from.x);
        const along = Math.abs(to.y - from.y);
        // Open ground: as many diagonals as fit, and straight the rest
        const length = Math.min(across, along) * Math.SQRT2 + Math.abs(across - along);

        expect(timeRoute(toCell(from), route)).toBeCloseTo(length * STEP_PACE, 6);
        expect(timeRoute(toCell(turnCell(from)), turned)).toBeCloseTo(
          timeRoute(toCell(from), route),
          6,
        );
      }),
      parameters,
    );
  });

  it('plays a stranger’s run back for its Euclidean length times the pace, the same turned a quarter', () => {
    fc.assert(
      fc.property(stepsArbitrary, (steps) => {
        const turned: Facing[] = [];

        for (const step of steps) {
          turned.push(turnStep(step));
        }

        const length = measureSteps(steps) * STEP_PACE;

        expect(playRun(steps, length)).toEqual({ before: true, after: true });
        expect(playRun(turned, length)).toEqual({ before: true, after: true });
      }),
      parameters,
    );
  });
});
