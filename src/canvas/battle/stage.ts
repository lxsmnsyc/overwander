/**
 * Where a picture is happening, in canvas pixels.
 *
 * Everything the field draws over a fight — a move's gap, a move
 * landing, a status biting, an ability firing — is placed against the
 * same three facts: whoever it is about, whoever it reached, and how
 * big the field is drawing its pokemon.
 */

/** A position on the canvas, as `[x, y]`. */
export type Point = [x: number, y: number];

export interface Stage {
  /** The body it is about: the caster, or the pokemon a cue is on. */
  source: Point;
  /**
   * Every body it reached. A picture with nowhere to land — a miss, a
   * status on the caster, a cue about one pokemon — arrives with none,
   * and anything that had nothing to draw on simply does not draw
   */
  targets: Point[];
  /**
   * How big the field is drawing its pokemon. Sizes are given in
   * canvas pixels before this, so the same move is the size of the
   * pokemon it came off rather than the size of the window
   */
  scale: number;
}
