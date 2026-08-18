import MoveVisual, { type Beat, type MoveStage, type Point } from './__visual';

/**
 * Absorb: what it takes off the target, it keeps.
 *
 * A drain is two events with one picture. Something bites, and then
 * the health that came off travels — a hit that only flashed on the
 * target would look like every other weak grass move, and the whole of
 * what makes this one different is where the energy ends up.
 *
 * So one sheet is played three ways. It bursts on the target, crosses
 * the gap in a handful of small copies lighting up in order, and
 * settles small and faint on the caster. Nothing moves: each mote is
 * a copy pinned a fixed fraction of the way back, and the sequence
 * they light in is what reads as travel — the same trick the jet in
 * [`hydro-pump`](./hydro-pump.ts) is built out of, run the other way
 * down the line.
 *
 * The motes are dimmer and smaller than the burst on purpose. What
 * crosses back is a share of what landed, and a return trip drawn as
 * loud as the hit reads as a second attack.
 */

/** The drain: `effects/184`, a green starburst with motes around it. */
const LEECH = 'effects/184';

/** How long the burst on the target is held. */
const BITE_SPAN = 500;

/** How many copies make up the trail crossing back. */
const MOTES = 4;

/** When the first mote lights, and how long apart the rest follow. */
const RETURN_AT = 200;
const RETURN_STEP = 90;

/** How long one mote is held once it has lit. */
const MOTE_SPAN = 380;

/** The gathering on the caster, once the trail has arrived. */
const GATHER_AT = RETURN_AT + RETURN_STEP * MOTES;
const GATHER_SPAN = 460;

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
 * One mote of the trail: the same sheet, pinned part of the way from
 * the target back to the caster.
 *
 * The fractions stop short of both ends — the near end is the burst
 * and the far end is the gathering, and a mote drawn on top of either
 * only thickens it
 */
function mote(index: number): Beat {
  const share = 0.2 + (index / (MOTES - 1)) * 0.6;

  return {
    sheet: LEECH,
    at: RETURN_AT + index * RETURN_STEP,
    span: MOTE_SPAN,
    places: (stage) => stage.targets.map((target) => between(target, stage.source, share)),
    scale: 0.36,
    alpha: 0.75,
  };
}

export const ABSORB: Beat[] = [
  { sheet: LEECH, at: 0, span: BITE_SPAN, places: targets, scale: 0.95 },
  ...Array.from({ length: MOTES }, (_, index) => mote(index)),
  { sheet: LEECH, at: GATHER_AT, span: GATHER_SPAN, places: source, scale: 0.55, alpha: 0.8 },
];

/**
 * Build the performance. The sheet is fetched once for the whole game,
 * so a second Absorb is a clone rather than a download
 */
export default async function absorb(): Promise<MoveVisual> {
  return MoveVisual.of(ABSORB);
}
