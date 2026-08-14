import MoveVisual, { type Beat, type MoveStage, type Point } from './__visual';

/**
 * Hydro Pump: everything the pokemon has, in one jet.
 *
 * Supersonic is a thing emitted; this is a thing **aimed**, and the
 * difference is the whole design. A jet is not one picture travelling
 * — a picture travelling is a projectile, and a projectile leaves the
 * space behind it empty, which is what a thrown rock looks like and
 * not what a hose looks like. A jet is continuous: water is at every
 * point between the nozzle and what it is hitting, all at once.
 *
 * There is no water beam in the collection, so the jet is built out of
 * the spray sheet repeated **along the line** — five copies at fixed
 * fractions of the way across, each starting a little after the one
 * behind it. They light up in order, which reads as the stream
 * reaching, and then all five are up together, which reads as the
 * stream being sustained. Nothing here moves; the sequence does the
 * moving.
 *
 * The splash at the far end is the one aimed piece. `directional/2` is
 * a crown of water thrown up off a surface, drawn growing out of the
 * bottom of its cell, so it is pinned at its **foot** — the part
 * touching whatever it landed on — and turned to face back down the
 * jet. Water hitting something comes back at whoever sent it.
 */

/** The pump firing: `effects/125`, an orb bursting into spray. */
const MUZZLE = 'effects/125';

/** The jet itself: `effects/82`, arcs of droplets, and it loops. */
const JET = 'effects/82';

/** The impact: `directional/2`, a crown of water off a surface. */
const SPLASH = 'directional/2';

/** What is left running off the target: `effects/88`, droplets. */
const DROPS = 'effects/88';

/** How many copies of the spray make up the stream. */
const LENGTH = 5;

/** How long apart they light up, in milliseconds. */
const REACH = 55;

/** How long each length of the stream is held. */
const JET_SPAN = 520;

/** The splash and the run-off, once the stream has arrived. */
const SPLASH_AT = 360;
const SPLASH_SPAN = 520;
const DROPS_AT = 430;
const DROPS_SPAN = 560;

/**
 * Where the crown is pinned on its own cell: the middle of its foot,
 * which is the water's contact with whatever it hit rather than the
 * middle of the picture
 */
const SPLASH_PIVOT: Point = [16, 32];

function between(from: Point, to: Point, share: number): Point {
  return [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share];
}

function source(stage: MoveStage): Point[] {
  return [stage.source];
}

function targets(stage: MoveStage): Point[] {
  return stage.targets;
}

/**
 * One length of the stream: the spray sheet at a fixed fraction of the
 * way to each target.
 *
 * The fractions start short of the caster and stop short of the
 * target, so the jet leaves the pokemon's body rather than its middle
 * and the far end is the splash rather than more spray
 */
function length(index: number): Beat {
  const share = 0.16 + (index / (LENGTH - 1)) * 0.68;

  return {
    sheet: JET,
    at: index * REACH,
    span: JET_SPAN - index * REACH,
    places: (stage) => stage.targets.map((target) => between(stage.source, target, share)),
    scale: 0.62,
    alpha: 0.9,
  };
}

export const HYDRO_PUMP: Beat[] = [
  { sheet: MUZZLE, at: 0, span: 340, places: source, scale: 0.75, alpha: 0.95 },
  ...Array.from({ length: LENGTH }, (_, index) => length(index)),
  {
    sheet: SPLASH,
    at: SPLASH_AT,
    span: SPLASH_SPAN,
    places: targets,
    // Back down the jet: the water rebounds toward whoever fired it
    aim: (stage) => stage.source,
    pivot: SPLASH_PIVOT,
    scale: 1.6,
  },
  { sheet: DROPS, at: DROPS_AT, span: DROPS_SPAN, places: targets, scale: 0.9, alpha: 0.85 },
];

/**
 * Build the performance. The sheets are fetched once for the whole
 * game, so a second Hydro Pump is a clone rather than a download
 */
export default async function hydroPump(): Promise<MoveVisual> {
  return MoveVisual.of(HYDRO_PUMP);
}
