import { describe, expect, it } from 'vitest';
import { slideGain } from '../../src/components/overworld/chunk-canvas';
import { SLIDE_PACE, SNAP_CELLS } from '../../src/components/overworld/chunk-canvas/metrics';
import { STEP_PACE } from '../../src/components/overworld/overworld-tab/metrics';

describe('the walker sliding after the cell it is walking to', () => {
  const FRAME = 1000 / 60;

  it('crosses one cell in one pace', () => {
    let span = 1;

    for (let gone = 0; gone < SLIDE_PACE; gone += FRAME) {
      span -= slideGain(span, FRAME);
    }
    expect(span).toBeCloseTo(0, 2);
  });

  it('never overshoots the cell it is walking to', () => {
    expect(slideGain(0.02, SLIDE_PACE)).toBe(0.02);
    expect(slideGain(1, SLIDE_PACE * 4)).toBe(1);
  });

  it('makes up ground it has lost rather than falling further behind', () => {
    // The walk lays down a step every pace, so a slide that only ever
    // moved one cell per pace could never close a gap: a frame lost to
    // a chunk arriving was lost for good, and over a long walk the
    // arrears grew until the snap swallowed them
    expect(STEP_PACE).toBe(SLIDE_PACE);

    let span = 1.5;

    span -= slideGain(span, SLIDE_PACE);
    // A pace of walking, and the cell the walk laid down in the
    // meantime
    span += 1;
    expect(span).toBeLessThan(1.5);
  });

  it('holds a long walk under the snap, hitches and all', () => {
    // What the bug was: a hitch every few steps, each one leaving the
    // slide a little further behind, until after a few chunks of
    // walking the arrears passed SNAP_CELLS and the walker jumped
    let span = 0;
    let worst = 0;

    for (let step = 0; step < 400; step += 1) {
      // The cell the walk lays down
      span += 1;

      const hitch = step % 8 === 0 ? 180 : 0;

      for (let gone = hitch; gone < SLIDE_PACE; gone += FRAME) {
        span -= slideGain(span, FRAME);
      }
      worst = Math.max(worst, span);
    }
    expect(worst).toBeLessThan(SNAP_CELLS);
  });
});
