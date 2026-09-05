import PaintedVisual, { type Painter } from '../moves/__painted';
import type { Point, Stage } from '../stage';
import { type Painted, decay, fade, motes, noise, orb, ring, star, swell } from '../moves/__paint';

/**
 * What the field says about a pokemon that is not a move: a status
 * landing or biting, an ability firing.
 *
 * These were played off the sheets under `public/sprites/effects` and
 * are now drawn, for the same reason moves are — the atlas was made
 * for another game, and the nearest sheet to "poisoned" is a picture
 * of somebody else's move. Drawn, a poisoning is bubbles in poison
 * purple over the pokemon that has it, every time, at any size.
 *
 * A cue is about **one** pokemon, so it is drawn on the stage's
 * source. It is small on purpose: whatever else is happening on the
 * field is the thing being watched, and a status that shouts over a
 * move is a status nobody can read past.
 */

/** How big a cue is, in canvas pixels before the field's scale. */

/** The shapes a cue is drawn out of, and how one is played */
export const REACH = 15;

/** How high above the body a mark hangs. */
export const LIFT = 22;

/** One cue, as a picture. */
export interface Cue {
  paint: (context: CanvasRenderingContext2D, stage: Stage, share: number, draw: Painted) => void;
  color: string;
  /** How long it takes, in milliseconds. */
  span: number;
}

export function over(stage: Stage, lift = LIFT): Point {
  return [stage.source[0], stage.source[1] - lift * stage.scale];
}

/**
 * Something rising off the body: gas, embers, spores. What most of the
 * lasting statuses look like
 */
export function rising(count: number, seed: number) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    motes(context, stage.source, REACH * stage.scale * 1.4, count, seed, share, {
      ...paint,
      alpha: swell(share) * 0.9,
      width: 2.4 * stage.scale,
    });
  };
}

/** Marks turning over the head: what a pokemon is seeing rather than wearing. */
export function orbiting(count: number) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    const at = over(stage);
    const size = REACH * stage.scale;

    for (let mark = 0; mark < count; mark += 1) {
      const angle = share * Math.PI * 2 + (mark / count) * Math.PI * 2;

      star(
        context,
        [at[0] + Math.cos(angle) * size, at[1] + Math.sin(angle) * size * 0.45],
        size * 0.38,
        angle,
        { ...paint, alpha: swell(share) + 0.2 },
      );
    }
  };
}

/**
 * A pokemon that tried and could not: the bar over the head, drawn
 * over whatever the status itself is doing.
 *
 * Landing and biting are different events and were drawing the same
 * picture at two sizes, so a sleep that blocked a cast looked like a
 * sleep landing again. This is what all the blocking statuses share —
 * the refusal — and each one keeps its own mark underneath
 */
export function stalled(
  under?: (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted) => void,
) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    under?.(context, stage, share, paint);

    const at = over(stage);
    const size = REACH * stage.scale * 0.7;
    // Snaps to full size and holds, rather than swelling: a refusal is
    // instant, and a mark that grows reads as something arriving
    const alpha = share < 0.15 ? share / 0.15 : decay((share - 0.15) / 0.85);

    ring(context, at, size, { ...paint, alpha, width: 3 * stage.scale });
    context.strokeStyle = fade(paint.color, alpha);
    context.lineWidth = 3 * stage.scale;
    context.beginPath();
    context.moveTo(at[0] - size * 0.7, at[1] - size * 0.7);
    context.lineTo(at[0] + size * 0.7, at[1] + size * 0.7);
    context.stroke();
  };
}

/**
 * Health coming off on the status's own clock: everything falls, and
 * the body it fell from flashes. The opposite of the landing cues,
 * which rise
 */
export function bitten(count: number, seed: number) {
  return (context: CanvasRenderingContext2D, stage: Stage, share: number, paint: Painted): void => {
    const size = REACH * stage.scale;

    ring(context, stage.source, size * (0.8 + share * 0.6), {
      ...paint,
      alpha: decay(share) * 0.7,
      width: 2 * stage.scale,
    });
    for (let drip = 0; drip < count; drip += 1) {
      const held = (share * 1.4 + noise(seed, drip)) % 1;
      const drift = (noise(seed, drip + 11) - 0.5) * size * 1.8;

      orb(
        context,
        [stage.source[0] + drift, stage.source[1] - size * 0.6 + held * size * 1.8],
        2.6 * stage.scale,
        { ...paint, alpha: decay(held) },
      );
    }
  };
}

export function played(cue: Cue, scale = 1, alpha = 1): PaintedVisual {
  const paint: Painted = { color: cue.color, alpha };
  const painter: Painter = (context, stage, share) => {
    cue.paint(context, { ...stage, scale: stage.scale * scale }, share, paint);
  };

  return new PaintedVisual(cue.span, painter);
}
