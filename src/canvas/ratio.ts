/**
 * How many real pixels a canvas gets per drawn pixel.
 *
 * The board and the field are both the size of the page, so their
 * backing stores are the window multiplied by this, and every
 * full-screen fill over them is paid for at that size. A phone
 * reporting 3 is nine times the pixels of a phone reporting 1, for a
 * game drawn from sprites that are sharp at 2 and no sharper at 3
 */
const CEILING = 2;

/**
 * The ratio to size a canvas by. Capped rather than taken as given,
 * and never below 1: a browser that reports nothing useful is drawn
 * for one pixel each
 */
export default function pixelRatio(): number {
  const reported = globalThis.devicePixelRatio;

  if (!(reported > 0)) {
    return 1;
  }
  return Math.min(CEILING, reported);
}
