import { describe, expect, it } from 'vitest';
import Strangers, {
  type Facing,
  MAX_LEG_STEPS,
  MAX_ROUTE_STEPS,
  MAX_STRANGERS,
  PLAYBACK_DELAY,
  type Sighting,
  decodeSteps,
  encodeSteps,
} from '../../src/overworld/strangers';

const PACE = 250;
const EAST: Facing = [1, 0];
const SOUTH: Facing = [0, 1];

function crowd(): { strangers: Strangers; at: (time: number) => void } {
  let now = 0;

  return {
    strangers: new Strangers(() => now, PACE),
    at: (time) => {
      now = time;
    },
  };
}

function sight(uid: string, x: number, y: number): Sighting {
  return { uid, charset: 'characters/frlg/red', x, y, facing: SOUTH };
}

describe('steps on the wire', () => {
  it('go there and back as one letter each', () => {
    const steps: Facing[] = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];

    expect(encodeSteps(steps)).toBe('UDLR');
    expect(decodeSteps('UDLR')).toEqual(steps);
  });

  it('refuse anything a walk could not have been', () => {
    expect(decodeSteps('')).toBeNull();
    expect(decodeSteps('UX')).toBeNull();
    expect(decodeSteps('R'.repeat(MAX_LEG_STEPS + 1))).toBeNull();
  });

  it('allow a longer run for a route, and an empty one only when asked', () => {
    expect(decodeSteps('R'.repeat(MAX_ROUTE_STEPS), MAX_ROUTE_STEPS)).toHaveLength(MAX_ROUTE_STEPS);
    expect(decodeSteps('', MAX_LEG_STEPS, true)).toEqual([]);
  });
});

describe('strangers', () => {
  it('stand where their presence says', () => {
    const { strangers } = crowd();

    strangers.see(sight('a', 10, 20));
    expect(strangers.standing()).toEqual([
      { uid: 'a', charset: 'characters/frlg/red', x: 10, y: 20, facing: SOUTH, moving: false },
    ]);
  });

  it('ignore a walk from somebody not yet seen', () => {
    const { strangers } = crowd();

    strangers.hear({ uid: 'a', x: 0, y: 0, steps: [EAST], at: 0, planned: false });
    expect(strangers.size).toBe(0);
  });

  it('play a run back behind, one cell a pace', () => {
    const { strangers, at } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.hear({ uid: 'a', x: 0, y: 0, steps: [EAST, EAST, SOUTH], at: 1000, planned: false });

    // Not yet: the run is played a little behind when it was walked
    at(1000 + PLAYBACK_DELAY - 1);
    expect(strangers.standing()[0]).toMatchObject({ x: 0, y: 0, moving: false });

    at(1000 + PLAYBACK_DELAY + PACE / 2);
    expect(strangers.standing()[0]).toMatchObject({ x: 0.5, y: 0, facing: EAST, moving: true });

    at(1000 + PLAYBACK_DELAY + PACE * 2 + PACE / 4);
    expect(strangers.standing()[0]).toMatchObject({ x: 2, y: 0.25, facing: SOUTH, moving: true });

    at(1000 + PLAYBACK_DELAY + PACE * 3);
    expect(strangers.standing()[0]).toMatchObject({ x: 2, y: 1, facing: SOUTH, moving: false });
  });

  it('play a second run after the first, not over it', () => {
    const { strangers, at } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.hear({ uid: 'a', x: 0, y: 0, steps: [EAST, EAST], at: 0, planned: false });
    // Stamped a little early, as a sender's clock may be
    strangers.hear({ uid: 'a', x: 2, y: 0, steps: [EAST], at: PACE, planned: false });

    at(PLAYBACK_DELAY + PACE * 2 + PACE / 2);
    expect(strangers.standing()[0]).toMatchObject({ x: 2.5, moving: true });
  });

  it('jump to a run that does not start where the last one ended', () => {
    const { strangers, at } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.hear({ uid: 'a', x: 9, y: 9, steps: [EAST], at: 0, planned: false });

    at(PLAYBACK_DELAY - 1);
    expect(strangers.standing()[0]).toMatchObject({ x: 9, y: 9 });
  });

  it('leave a walking stranger to their run when their presence changes', () => {
    const { strangers, at } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.hear({ uid: 'a', x: 0, y: 0, steps: [EAST, EAST], at: 0, planned: false });
    strangers.see(sight('a', 2, 0));

    at(PLAYBACK_DELAY + PACE / 2);
    expect(strangers.standing()[0]).toMatchObject({ x: 0.5, moving: true });
  });

  it('cut a route short where a later run starts along it', () => {
    const { strangers, at } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.hear({ uid: 'a', x: 0, y: 0, steps: [EAST, EAST, EAST, EAST], at: 0, planned: true });
    // Two steps along, they turned south instead
    strangers.hear({ uid: 'a', x: 2, y: 0, steps: [SOUTH], at: PACE * 2, planned: false });

    at(PLAYBACK_DELAY + PACE * 2 + PACE / 2);
    expect(strangers.standing()[0]).toMatchObject({ x: 2, y: 0.5, facing: SOUTH });

    at(PLAYBACK_DELAY + PACE * 10);
    expect(strangers.standing()[0]).toMatchObject({ x: 2, y: 1, moving: false });
  });

  it('stop a route where a run with no steps says they are', () => {
    const { strangers, at } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.hear({ uid: 'a', x: 0, y: 0, steps: [EAST, EAST, EAST, EAST], at: 0, planned: true });
    strangers.hear({ uid: 'a', x: 1, y: 0, steps: [], at: PACE, planned: false });

    at(PLAYBACK_DELAY + PACE * 10);
    expect(strangers.standing()[0]).toMatchObject({ x: 1, y: 0, moving: false });
  });

  it('never cut a run that was already walked', () => {
    const { strangers, at } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.hear({ uid: 'a', x: 0, y: 0, steps: [EAST, EAST], at: 0, planned: false });
    // Starting from a cell the walked run passed through is a missed message, not a cut
    strangers.hear({ uid: 'a', x: 1, y: 0, steps: [SOUTH], at: PACE, planned: false });

    at(PLAYBACK_DELAY - 1);
    expect(strangers.standing()[0]).toMatchObject({ x: 1, y: 0 });
  });

  it('are gone once forgotten', () => {
    const { strangers } = crowd();

    strangers.see(sight('a', 0, 0));
    strangers.forget('a');
    expect(strangers.standing()).toEqual([]);
  });

  it('are drawn nearest first, and only so many', () => {
    const { strangers } = crowd();

    for (let index = 0; index < MAX_STRANGERS + 5; index += 1) {
      strangers.see(sight(`far-${index}`, 100 + index, 0));
    }
    strangers.see(sight('near', 1, 0));

    const drawn = strangers.standing({ x: 0, y: 0 });

    expect(drawn).toHaveLength(MAX_STRANGERS);
    expect(drawn[0].uid).toBe('near');
  });
});
