import MoveVisual, { type Beat, type MoveStage, type Point } from './__visual';

/**
 * Supersonic: a sound the target cannot follow.
 *
 * It is a status move with no projectile — nothing is thrown and
 * nothing lands — so the field has no way of showing it happened at
 * all. What it does have is a shape: something is emitted, it crosses
 * the gap, and the pokemon it reaches stops being able to think
 * straight. That is three beats.
 *
 * The rings come off the **caster**, because that is where the sound
 * is made, and there are three of them a tenth of a second apart. One
 * ring is an event; three at a steady interval is a note being held,
 * which is what a supersonic pulse is. Each is stretched over most of
 * a second — the sheet is eight ticks, an eighth of a second, and a
 * ring that quick reads as a flicker rather than a sound.
 *
 * Between the caster and the target the same ring is drawn once more,
 * on its way across. It is not a projectile — the engine has no flight
 * for this move and the canvas is not inventing one — it is the sound
 * arriving, which is why it starts small at the caster's end and is
 * full size by the time it reaches the target.
 *
 * The question mark is the point of the whole move. Confusion is a
 * state rather than an event, and the mark is drawn last, over each
 * pokemon that caught it, and left hanging after the rings have gone:
 * the sound is over, the confusion is not.
 */

/** The expanding ring: `effects/19`, eight ticks of thin cyan. */
const RING = 'effects/19';

/** The confusion mark: `effects/67`, the blue question mark. */
const MARK = 'effects/67';

/** How far apart the pulses are, in milliseconds. */
const PULSE = 110;

/** How long one ring is held. */
const RING_SPAN = 620;

/** How long the mark hangs over a confused pokemon once it lands. */
const MARK_SPAN = 900;

/** When the crossing ring sets off, and how long it takes to arrive. */
const CROSSING_AT = 180;
const CROSSING_SPAN = 520;

/**
 * A point some fraction of the way from one place to another.
 *
 * The sound crosses in a straight line: there is no arc, because an
 * arc is a thing being thrown and this is a thing being heard
 */
function between(from: Point, to: Point, share: number): Point {
  return [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share];
}

/**
 * How high above a body the mark sits, as a share of the scale the
 * field is drawing at. It is over the pokemon's head rather than on
 * its chest, which is where a thought goes
 */
const MARK_LIFT = 22;

function source(stage: MoveStage): Point[] {
  return [stage.source];
}

function targets(stage: MoveStage): Point[] {
  return stage.targets;
}

/**
 * The running order.
 *
 * Three rings off the caster, one crossing, one mark left behind. The
 * crossing ring is placed by its own progress through its beat, so it
 * is one beat being drawn a little further along each frame rather
 * than anything that has to be tracked
 */
export const SUPERSONIC: Beat[] = [
  { sheet: RING, at: 0, span: RING_SPAN, places: source, scale: 0.7, alpha: 0.9 },
  { sheet: RING, at: PULSE, span: RING_SPAN, places: source, scale: 0.85, alpha: 0.75 },
  { sheet: RING, at: PULSE * 2, span: RING_SPAN, places: source, alpha: 0.6 },
  {
    sheet: RING,
    at: CROSSING_AT,
    span: CROSSING_SPAN,
    places: (stage, share) => stage.targets.map((target) => between(stage.source, target, share)),
    scale: 0.8,
    alpha: 0.85,
  },
  {
    sheet: MARK,
    at: CROSSING_AT + CROSSING_SPAN,
    span: MARK_SPAN,
    places: (stage) => targets(stage).map(([x, y]): Point => [x, y - MARK_LIFT * stage.scale]),
    scale: 1.4,
  },
];

/**
 * Build the performance. The sheets are fetched once for the whole
 * game, so a second Supersonic is a clone rather than a download
 */
export default async function supersonic(): Promise<MoveVisual> {
  return MoveVisual.of(SUPERSONIC);
}
