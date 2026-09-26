/**
 * The other players in sight, and where each of them is at any moment.
 *
 * Nobody sends a step as it is taken. A pressed walk is sent once, as
 * the whole route, before it is walked; a walk on the keys is sent as a
 * run of the steps already taken, every couple of seconds. Every
 * screen watching plays either back a little behind, one cell per pace.
 */

/** A step, or the way somebody is facing, as a unit move on the grid */
export type Facing = [number, number];

/** Who another player is and where they stand, as their presence says */
export interface Sighting {
  uid: string;
  charset: string;
  x: number;
  y: number;
  facing: Facing;
}

/**
 * A run of steps another player took or is about to take, starting
 * from a cell. `at` is when the first step began, on the server's
 * clock. A planned run is a route still being walked, which a later
 * run starting partway along it cuts short. A run with no steps says
 * only where they are now
 */
export interface Leg {
  uid: string;
  x: number;
  y: number;
  steps: Facing[];
  at: number;
  planned: boolean;
}

/** Somebody to draw: in world cells, and between two cells while walking */
export interface StrangerStanding {
  uid: string;
  charset: string;
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
}

/** The longest run of steps already taken that one message may carry */
export const MAX_LEG_STEPS = 16;

/** And the longest route. A board is 41 cells across, so this is a walk round a lot */
export const MAX_ROUTE_STEPS = 128;

/**
 * How far behind a walk is played back, in milliseconds. A run on the
 * keys is sent up to two seconds after its first step, so anything
 * shorter would have a walker freeze while the next run is on its way
 */
export const PLAYBACK_DELAY = 2500;

/** How many strangers are drawn at once, nearest first */
export const MAX_STRANGERS = 30;

const STEP_LETTERS = new Map<string, Facing>([
  ['U', [0, -1]],
  ['D', [0, 1]],
  ['L', [-1, 0]],
  ['R', [1, 0]],
]);

/** A run of steps as a string of letters, one byte a step */
export function encodeSteps(steps: Facing[]): string {
  let written = '';

  for (const [dx, dy] of steps) {
    if (dy < 0) {
      written += 'U';
    } else if (dy > 0) {
      written += 'D';
    } else if (dx < 0) {
      written += 'L';
    } else {
      written += 'R';
    }
  }
  return written;
}

/**
 * And back. Null for anything that is not a run somebody could have
 * walked, including an empty one unless `most` allows it
 */
export function decodeSteps(
  written: string,
  most: number = MAX_LEG_STEPS,
  empty = false,
): Facing[] | null {
  if ((written.length === 0 && !empty) || written.length > most) {
    return null;
  }

  const steps: Facing[] = [];

  for (const letter of written) {
    const step = STEP_LETTERS.get(letter);

    if (step == null) {
      return null;
    }
    steps.push(step);
  }
  return steps;
}

interface Queued extends Leg {
  /** When playback of this run starts, on the server's clock */
  start: number;
  /** The cell it ends on */
  endX: number;
  endY: number;
}

interface Stranger {
  uid: string;
  charset: string;
  x: number;
  y: number;
  facing: Facing;
  /** Runs heard but not yet finished playing, oldest first */
  queue: Queued[];
}

/**
 * Cut a route short at a cell on it, since whatever was said from
 * there replaces the rest of it. Only a route: a run already taken
 * happened, and nothing said later undoes it
 */
function cut(stranger: Stranger, x: number, y: number): void {
  const last = stranger.queue.at(-1);

  if (last?.planned !== true) {
    return;
  }

  let cx = last.x;
  let cy = last.y;

  for (let taken = 0; taken <= last.steps.length; taken += 1) {
    if (cx === x && cy === y) {
      if (taken === 0) {
        stranger.queue.pop();
      } else {
        last.steps = last.steps.slice(0, taken);
        last.endX = x;
        last.endY = y;
      }
      return;
    }
    if (taken < last.steps.length) {
      cx += last.steps[taken][0];
      cy += last.steps[taken][1];
    }
  }
}

export default class Strangers {
  private readonly known = new Map<string, Stranger>();

  /**
   * `clock` is the server's time, which the walkers stamp their runs
   * with. `pace` is how long one step takes, the same for everybody
   */
  constructor(
    private readonly clock: () => number,
    private readonly pace: number,
  ) {}

  get size(): number {
    return this.known.size;
  }

  has(uid: string): boolean {
    return this.known.has(uid);
  }

  /**
   * Somebody's presence, arriving or changing. While a run of theirs is
   * still playing, the position is left to the run: the presence is
   * where they are now, and the screen is deliberately behind that
   */
  see(sighting: Sighting): void {
    const stranger = this.known.get(sighting.uid);

    if (stranger == null) {
      this.known.set(sighting.uid, {
        uid: sighting.uid,
        charset: sighting.charset,
        x: sighting.x,
        y: sighting.y,
        facing: sighting.facing,
        queue: [],
      });
      return;
    }
    stranger.charset = sighting.charset;
    this.settle(stranger, this.clock());

    if (stranger.queue.length === 0) {
      stranger.x = sighting.x;
      stranger.y = sighting.y;
      stranger.facing = sighting.facing;
    }
  }

  /**
   * A run of steps. Somebody not yet seen is ignored: their presence
   * carries the charset they are drawn in, and it will say where they
   * are when it comes
   */
  hear(leg: Leg): void {
    const stranger = this.known.get(leg.uid);

    if (stranger == null) {
      return;
    }
    this.settle(stranger, this.clock());
    cut(stranger, leg.x, leg.y);

    const last = stranger.queue.at(-1);
    const fromX = last?.endX ?? stranger.x;
    const fromY = last?.endY ?? stranger.y;

    // A run that does not start where the last one ended means one was
    // missed, so they jump to where this one starts rather than walking
    // through a wall to get there
    if (leg.x !== fromX || leg.y !== fromY) {
      stranger.queue.length = 0;
      stranger.x = leg.x;
      stranger.y = leg.y;
    }
    if (leg.steps.length === 0) {
      return;
    }

    let endX = leg.x;
    let endY = leg.y;

    for (const [dx, dy] of leg.steps) {
      endX += dx;
      endY += dy;
    }

    const after = stranger.queue.at(-1);
    const start = Math.max(
      leg.at + PLAYBACK_DELAY,
      after == null ? Number.NEGATIVE_INFINITY : after.start + after.steps.length * this.pace,
    );

    stranger.queue.push({ ...leg, start, endX, endY });
  }

  forget(uid: string): void {
    this.known.delete(uid);
  }

  clear(): void {
    this.known.clear();
  }

  /**
   * Everybody as they stand this instant, nearest to `near` first and
   * no more than `MAX_STRANGERS` of them
   */
  standing(near?: { x: number; y: number }): StrangerStanding[] {
    const now = this.clock();
    const found: StrangerStanding[] = [];

    for (const stranger of this.known.values()) {
      this.settle(stranger, now);
      found.push(this.placeOf(stranger, now));
    }
    if (near != null && found.length > MAX_STRANGERS) {
      const reach = (one: StrangerStanding): number =>
        Math.max(Math.abs(one.x - near.x), Math.abs(one.y - near.y));

      found.sort((a, b) => reach(a) - reach(b));
      found.length = MAX_STRANGERS;
    }
    return found;
  }

  /** Put finished runs behind them, so the queue only holds what is still to play */
  private settle(stranger: Stranger, now: number): void {
    while (stranger.queue.length > 0) {
      const leg = stranger.queue[0];

      if (now < leg.start + leg.steps.length * this.pace) {
        return;
      }
      stranger.x = leg.endX;
      stranger.y = leg.endY;
      stranger.facing = leg.steps.at(-1) ?? stranger.facing;
      stranger.queue.shift();
    }
  }

  private placeOf(stranger: Stranger, now: number): StrangerStanding {
    const leg = stranger.queue.at(0);

    if (leg == null || now < leg.start) {
      return {
        uid: stranger.uid,
        charset: stranger.charset,
        x: stranger.x,
        y: stranger.y,
        facing: stranger.facing,
        moving: false,
      };
    }

    const progress = (now - leg.start) / this.pace;
    const taken = Math.floor(progress);
    let x = leg.x;
    let y = leg.y;

    for (let index = 0; index < taken; index += 1) {
      x += leg.steps[index][0];
      y += leg.steps[index][1];
    }

    // `settle` has already put a finished run behind them, so this step exists
    const step = leg.steps[taken];
    const part = progress - taken;

    return {
      uid: stranger.uid,
      charset: stranger.charset,
      x: x + step[0] * part,
      y: y + step[1] * part,
      facing: step,
      moving: true,
    };
  }
}
