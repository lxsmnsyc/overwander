/** The two things a sky worked out pixel by pixel needs, whatever it is drawing */

/**
 * A canvas of this size, made once and kept.
 *
 * Sized only where it is not already, because assigning `width` resets
 * the bitmap whatever it is assigned to: written every frame it is a
 * fresh allocation every frame, for a picture that is about to be
 * overwritten whole anyway
 */
export function sheetOf(
  held: HTMLCanvasElement | null,
  wide: number,
  tall: number,
): HTMLCanvasElement {
  const made = held ?? document.createElement('canvas');

  if (made.width !== wide || made.height !== tall) {
    made.width = wide;
    made.height = tall;
  }
  return made;
}

/** A `#rrggbb` read as the three numbers a pixel wants */
export function tintOf(colour: string): [number, number, number] {
  const value = Number.parseInt(colour.slice(1), 16);

  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}
