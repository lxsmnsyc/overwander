import MoveVisual, { type Beat, type MoveStage, type Point, loadEffect } from './__visual';

/**
 * The shapes almost every move is.
 *
 * Most moves are one sheet played in one place. The interesting part
 * is not the running order — there isn't one — it is **where** and
 * **when**: a flame goes off on whatever it hit, a stat rise goes off
 * on whoever raised it, weather goes off over everybody, and a move
 * the engine holds in the air lands when it lands rather than when it
 * was thrown.
 *
 * So the table in [`index.ts`](./index.ts) names a shape and a sheet
 * and stops there. Anything that wants a running order of its own —
 * a jet, a drain, a charge — gets a file instead.
 *
 * Every shape takes the **delay** the engine is holding the move for,
 * which the canvas asks the move itself rather than reading off the
 * data. That is what makes a thrown move look thrown now that nothing
 * else draws one: the burst waits out the flight, and the sheet's own
 * picture crosses the gap in the meantime.
 */

/**
 * What the canvas asks for: a performance, built for the window this
 * particular cast is being held for
 */
export type MoveVisualBuilder = (delay: number) => Promise<MoveVisual>;

export interface Played {
  /** Multiplier on the field's scale. */
  scale?: number;
  /** How solid it is drawn, from 0 to 1. */
  alpha?: number;
  /**
   * Whether a thrown move draws its own sheet crossing the gap. On by
   * default, and worth turning off for a sheet whose subject is what
   * happens on arrival rather than what was thrown — a cloud of dust
   * has no small version of itself in flight
   */
  trail?: boolean;
  /**
   * Where the point it is placed at sits on the cell. A tall sheet —
   * a bolt, a column — stands on the body with `foot`
   */
  anchor?: 'center' | 'foot';
  /**
   * The box to draw the cell in, before the field's scale. Set, it
   * replaces `scale` — see [`Beat`](./__visual.ts)
   */
  size?: number;
  /**
   * Where an aimed sheet is pinned on its own cell, in cell pixels.
   * The top middle by default, which is where the directional sheets
   * grow out of; a splash is pinned at its foot instead
   */
  pivot?: Point;
}

/** What a sheet that never arrived is given, so the order still ends. */
const FALLBACK_SPAN = 600;

/**
 * How long the sheet runs for at the speed it was drawn at. A beat
 * shorter than its clip cuts the effect off; one longer holds its last
 * frame, which is a picture left hanging over a pokemon
 */
async function clipOf(sheet: string): Promise<number> {
  const sprite = await loadEffect(sheet);

  return sprite?.duration ?? FALLBACK_SPAN;
}

/** How many copies of the sheet make up a thrown move's trail. */
const TRAIL_COPIES = 3;

/** How small and how faint they are drawn beside the arrival. */
const TRAIL_SCALE = 0.42;
const TRAIL_ALPHA = 0.7;

function source(stage: MoveStage): Point[] {
  return [stage.source];
}

function targets(stage: MoveStage): Point[] {
  return stage.targets;
}

/** Everybody on the field, for something the whole field is under. */
function everyone(stage: MoveStage): Point[] {
  return [stage.source, ...stage.targets];
}

function between(from: Point, to: Point, share: number): Point {
  return [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share];
}

/**
 * The move on its way over, as copies of its own sheet lighting up in
 * order along the line.
 *
 * Nothing moves: each copy is pinned a fixed fraction of the way
 * across and lit when the move is about that far along, which reads as
 * travel and costs one beat each
 */
function trail(sheet: string, delay: number): Beat[] {
  const step = delay / (TRAIL_COPIES + 1);

  return Array.from({ length: TRAIL_COPIES }, (_, index) => {
    const share = (index + 1) / (TRAIL_COPIES + 1);

    return {
      sheet,
      at: step * index,
      span: step * 2,
      places: (stage: MoveStage) =>
        stage.targets.map((target) => between(stage.source, target, share)),
      scale: TRAIL_SCALE,
      alpha: TRAIL_ALPHA,
    };
  });
}

/**
 * On whatever it hit, when it gets there. The commonest shape there
 * is: an attack is a thing that happens to somebody else
 */
export function onTarget(sheet: string, played: Played = {}): MoveVisualBuilder {
  return async (delay) =>
    MoveVisual.of([
      ...(delay > 0 && played.trail !== false ? trail(sheet, delay) : []),
      {
        sheet,
        at: delay,
        span: await clipOf(sheet),
        places: targets,
        scale: played.scale,
        alpha: played.alpha,
        anchor: played.anchor,
      },
    ]);
}

/**
 * On whoever cast it. A guard, a stat rise, a healing — nothing left
 * the pokemon, so nothing waits for a flight either
 */
export function onUser(sheet: string, played: Played = {}): MoveVisualBuilder {
  return async () =>
    MoveVisual.of([
      {
        sheet,
        at: 0,
        span: await clipOf(sheet),
        places: source,
        scale: played.scale,
        alpha: played.alpha,
      },
    ]);
}

/**
 * How big something the whole field is under is drawn, in pixels
 * before the field's scale. A box rather than a multiplier: the
 * weather sheets were authored at cells three times apart, and the
 * same weather has to look the same size whichever one it came from
 */
const FIELD_SIZE = 72;

/**
 * Over everybody. Weather and terrain belong to the field rather than
 * to anyone standing on it, and the field is drawn as the pokemon on
 * it — so a copy over each of them is as close to "everywhere" as this
 * layer can say
 */
export function onField(sheet: string, played: Played = {}): MoveVisualBuilder {
  return async () =>
    MoveVisual.of([
      {
        sheet,
        at: 0,
        span: await clipOf(sheet),
        places: everyone,
        size: played.size ?? FIELD_SIZE,
        alpha: played.alpha ?? 0.85,
      },
    ]);
}

/**
 * Two sheets: what the caster does, and what arrives. A charge held
 * and then let go is the shape — the first plays where it is built up
 * and the second where it lands
 */
export function charged(held: string, released: string, played: Played = {}): MoveVisualBuilder {
  return async (delay) =>
    MoveVisual.of([
      { sheet: held, at: 0, span: await clipOf(held), places: source, alpha: played.alpha },
      {
        sheet: released,
        at: delay,
        span: await clipOf(released),
        places: targets,
        scale: played.scale,
      },
    ]);
}

/**
 * Pinned on the caster and turned toward what it is hitting: a thread,
 * a lance, anything whose length is the gap itself.
 *
 * One aim for the whole beat, so a move that reaches several pokemon
 * points at the first of them — the sheets this suits are single-target
 */
export function thrownAt(sheet: string, played: Played = {}): MoveVisualBuilder {
  return async () =>
    MoveVisual.of([
      {
        sheet,
        at: 0,
        span: await clipOf(sheet),
        places: source,
        aim: (stage) => stage.targets[0] ?? stage.source,
        pivot: played.pivot,
        scale: played.scale,
        alpha: played.alpha,
      },
    ]);
}

/**
 * Pinned on whatever it hit and turned back down the line at whoever
 * cast it: the splash, the rebound, what a hit throws back
 */
export function struckOn(sheet: string, played: Played = {}): MoveVisualBuilder {
  return async (delay) =>
    MoveVisual.of([
      {
        sheet,
        at: delay,
        span: await clipOf(sheet),
        places: targets,
        aim: (stage) => stage.source,
        pivot: played.pivot,
        scale: played.scale,
        alpha: played.alpha,
      },
    ]);
}

/**
 * How high above a body a mark sits, as a share of the scale the field
 * is drawing at. Over the head rather than on the chest, which is
 * where a thought goes
 */
const LIFT = 22;

export interface Cued extends Played {
  /** Whether it hangs over the head rather than sitting on the body. */
  lift?: boolean;
}

/**
 * How big a cue is drawn, in pixels before the field's scale. Every
 * one of them the same, so a mark is read as a mark rather than as
 * whatever size its sheet happened to be drawn at
 */
const CUE_SIZE = 44;

/**
 * One mark on one pokemon, and nothing to do with a move: what a
 * status looks like when it bites, what an ability looks like when it
 * fires.
 *
 * The pokemon it is about is the stage's **source**, since a cue has
 * no thrower and no target — whoever it is about is the whole of it
 */
export function cue(sheet: string, cued: Cued = {}): MoveVisualBuilder {
  return async () =>
    MoveVisual.of([
      {
        sheet,
        at: 0,
        span: await clipOf(sheet),
        places: (stage) =>
          cued.lift === true
            ? [[stage.source[0], stage.source[1] - LIFT * stage.scale]]
            : [stage.source],
        size: cued.size ?? CUE_SIZE,
        alpha: cued.alpha,
        anchor: cued.anchor,
      },
    ]);
}
