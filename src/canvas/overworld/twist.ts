/**
 * Two fingers walking the camera round.
 *
 * A phone has no right button and no ctrl key, so the drag that turns
 * the board with a mouse has no touch of its own, and a single finger
 * is already spoken for: it presses what is under it. The second
 * finger is what tells the camera apart from the board.
 *
 * The turn is the angle of the line between the fingers, so it is a
 * twist rather than a swipe. It reads the same way round as the mouse
 * drag does: turn the hand clockwise and the picture follows it.
 */

/** How many fingers make a turn rather than a press */
const FINGERS = 2;

/** The angle of the line between two touches, clockwise from due east */
function angleBetween(points: { x: number; y: number }[]): number {
  const [one, two] = points;

  return Math.atan2(two.y - one.y, two.x - one.x);
}

/**
 * The shortest way round between two angles, so a twist across due
 * east carries on rather than snapping back the long way
 */
function shortest(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/**
 * What a twist needs of a pointer event, which is what lets it be
 * driven by a plain object as well as by the browser
 */
export interface Finger {
  pointerId: number;
  pointerType: string;
  clientX: number;
  clientY: number;
}

export interface Twist {
  /** Whether enough fingers are on the glass for the camera to be theirs */
  turning: () => boolean;
  down: (event: Finger) => void;
  /**
   * How far the camera turned since the last move, in radians, or
   * null when this move was not part of a twist and belongs to
   * whatever the caller does with a single pointer
   */
  move: (event: Finger) => number | null;
  up: (event: Finger) => void;
}

export default function createTwist(): Twist {
  /** Where each finger is, in window pixels */
  const fingers = new Map<number, { x: number; y: number }>();
  /**
   * The angle the last move was measured at. Cleared whenever a finger
   * arrives or leaves: the pair being measured has changed, and the
   * difference across that change is not a turn anybody made
   */
  let angle: number | null = null;

  const turning = (): boolean => fingers.size === FINGERS;

  return {
    turning,
    down: (event) => {
      if (event.pointerType === 'touch') {
        fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        angle = null;
      }
    },
    move: (event) => {
      if (!fingers.has(event.pointerId)) {
        return null;
      }
      fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!turning()) {
        return null;
      }

      const now = angleBetween([...fingers.values()]);
      // The first move of a pair sets the mark to measure the rest
      // against, so it turns nothing itself
      const turned = angle == null ? 0 : shortest(angle, now);

      angle = now;

      return turned;
    },
    up: (event) => {
      fingers.delete(event.pointerId);
      angle = null;
    },
  };
}
