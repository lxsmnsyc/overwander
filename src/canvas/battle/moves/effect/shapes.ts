import { Types } from '../../../../data/constants/types';
import type { Weathers } from '../../../../data/ids/status';
import { MoveCategories, type Moves } from '../../../../data/ids/moves';
import { getMoveData } from '../../../../data/moves';
import { type EffectShape, spansWith } from '../../../../data/moves/visual';
import { FUTURE_SIGHT_DELAY } from '../../../../battle/moves/future-sight';
import { WISH_DELAY } from '../../../../battle/moves/wish';
import type { Point, Stage } from '../../stage';
import type { Painted } from '../__paint';

/**
 * What a move looks like where it lands.
 *
 * This is the second half of a move. The first half — the gap the
 * engine holds it open for — is [`delay.ts`](../delay.ts); this is the
 * moment the engine says the effect resolved, drawn on whatever it
 * resolved on. The two are separate because they are separate events,
 * and a move that is a slow burrow and a sharp hit should not have to
 * pick one picture for both.
 *
 * Almost nothing here is per-move. A move already says what it is —
 * its type, whether it is physical, special or status, whether it
 * touches, and how hard it hits — and that is enough to choose a
 * shape, colour it and size it. The table at the bottom is only for
 * the ones the data cannot tell apart: a beam that should look like a
 * beam, an explosion that takes the caster with it.
 */

/** How big an effect is, in canvas pixels before the field's scale. */

/** What every painter is handed, and what it draws with. */
export type ShapePainter = (
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  draw: Draw,
) => void;

export const REACH = 26;

/**
 * The fissure: how much of its span is spent tearing open, how far it
 * runs and how wide it gapes in sizes, and how many points its lips
 * are drawn from
 */
export const CHASM_TEAR = 0.45;
export const CHASM_RUN = 2.4;
export const CHASM_GAPE = 0.5;
export const CHASM_STEPS = 7;

/**
 * How many strikes a barrage is drawn as. The engine rolls two to five
 * and this is the middle of it: the picture says "several, in a row",
 * which is the part a player reads
 */
export const STRIKES = 4;

export type { EffectShape } from '../../../../data/moves/visual';

/** How long Wish's star rings where it lands, after the heal */
export const WISH_TAIL = 400;
/** Wish's star is in the air for the engine's whole wait, so it lands with the heal */
export const WISH_SPAN = WISH_DELAY + WISH_TAIL;

/** How long Doom Desire's star goes off for, after it lands */
export const STARFALL_BLAST = 600;
/** Doom Desire's star falls for the engine's whole wait, so it lands with the strike */
export const STARFALL_SPAN = FUTURE_SIGHT_DELAY + STARFALL_BLAST;

/** Shapes timed to the engine rather than to the move's weight */
export const EXACT_SPANS = new Set<EffectShape>(['Wishing', 'Starfall']);

/**
 * How long each of them takes at ordinary weight, in milliseconds: the
 * YAML's spans, and the two timed to the engine's wait
 */
export const SPANS: Record<EffectShape, number> = spansWith({
  Starfall: STARFALL_SPAN,
  Wishing: WISH_SPAN,
});

/**
 * How hard the move hits, as a multiplier on everything drawn.
 *
 * A Tackle and a Hyper Beam were the same picture in two colours,
 * which is the one thing a player watching a fight most needs to tell
 * apart. Power is what the game already knows about that, so it is
 * what decides how big the shape is, how much comes off it, and how
 * long it hangs about.
 *
 * A move with no power at all is one of two things, and they are
 * opposites: a status move, which is quiet, or a one-hit knockout,
 * which is the loudest thing in the game
 */
export function weightOf(move: Moves): number {
  const data = getMoveData(move);

  if (data.category === MoveCategories.Status) {
    return 0.85;
  }
  if (data.power == null) {
    return 1.75;
  }
  // 40 power lands at about 0.9 and 150 at about 1.6, so the range a
  // player actually sees is spread across the whole scale
  return 0.62 + Math.min(1, data.power / 150) * 0.98;
}

/** What a painter is handed besides the stage. */
export interface Draw {
  paint: Painted;
  seed: number;
  /** How hard it hits, from about 0.85 to 1.75. */
  weight: number;
  /** The move's type, for the shapes that wrap a blow in its element */
  type: Types;
  /** The sky it landed under, handed only to the shape made of it */
  weather?: Weathers;
  /** How many times it strikes: the count where it is fixed, the expected count where it is rolled */
  hits?: number;
}

/** The types a blow or a bite breaks off its element for: flames, frost, sparks, or Brave Bird's pale fire */
export const IMBUED = new Set<Types>([Types.Fire, Types.Ice, Types.Electric, Types.Flying]);

/** A count scaled by weight, never below one. */
export function many(count: number, weight: number): number {
  return Math.max(1, Math.round(count * weight));
}

/** Where the effect is happening: the first thing it landed on. */
export function landing(stage: Stage): Point {
  return stage.targets[0] ?? stage.source;
}

/**
 * The shapes that are about a side rather than about a body. They are
 * drawn once, in the middle of everyone they reached, rather than
 * once on each of them: a screen is one pane over the team
 */
export const OVER_A_SIDE = new Set<EffectShape>(['Screen']);

/**
 * The shapes that are about the pokemon that cast the move rather
 * than about what it landed on. A relay is what the caster is handing
 * over on its way off the field, so it belongs over the caster even
 * when the move reached somebody else on the way out
 */
export const ON_THE_CASTER = new Set<EffectShape>(['Relay', 'Evoboost']);

/** The point in the middle of everything given. */
export function middle(points: Point[]): Point {
  let x = 0;
  let y = 0;

  for (const point of points) {
    x += point[0];
    y += point[1];
  }
  return [x / points.length, y / points.length];
}
