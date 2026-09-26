/**
 * Where the sprite files are served from.
 *
 * They are static, immutable and by far the most requested thing the
 * game has, so they are published to their own host rather than
 * counted against the app's. Empty means "this origin", which is what
 * a development build and the local stack want: Vite serves `public/`
 * itself and nothing has to be stood up to walk around.
 *
 * Every path that reaches a sprite goes through this, so the whole of
 * the move is one environment variable. The files that answer from the
 * other host have to allow this one to read them, because the terrain
 * pack is drawn into a canvas and read back, and a cross-origin
 * picture without the header taints the canvas it is drawn on.
 */
export const SPRITE_ORIGIN = import.meta.env.VITE_SPRITE_ORIGIN ?? '';

/** A sprite path on whichever host is serving them */
export function spriteUrl(path: string): string {
  return `${SPRITE_ORIGIN}${path}`;
}
