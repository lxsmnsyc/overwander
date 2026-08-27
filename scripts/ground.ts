import { GROUND_SQUASH } from '../src/canvas/tilt.ts';
import type { Image } from '../src/server/sprites/png.ts';

/**
 * Where a drawn thing meets the ground, for the tools that cut sheets.
 *
 * The board asks a sheet one question about a picture: which point of
 * it stands on the tile. Getting that wrong is what makes a prop look
 * like it belongs to the row behind, or swing out of its square every
 * time the board is turned, so the answer is worked out once here and
 * written into the sheet rather than left as a sum for the painter.
 */

/**
 * How many rows off the bottom of a picture count as the patch it
 * stands on. The last row alone is a root or two and lands the middle
 * wherever they happen to fall; much more than this and a conifer's
 * lowest branches count as ground the tree is resting on
 */
export const BASE_BAND = 3;

/**
 * How much of a picture's height counts as the part resting on the
 * ground, as a fraction.
 *
 * Wider than `BASE_BAND` because it answers a different question: not
 * where the thing touches down, which is a trunk or a root or two, but
 * how much ground it takes up, since the skirt of a conifer covers the
 * earth it hangs over as surely as the trunk inside it does.
 *
 * Where it stops is what decides how big a tree comes out, and a fifth
 * was too much of one: it took in enough of the crown that a tree
 * covered a tile with its branches rather than with its foot, and came
 * out no taller than the pokemon standing under it. A sixth is the
 * bottom of the tree. It is a plateau rather than a knife edge, so
 * anything from about an eighth to a sixth gives the same answer
 */
export const FOOTING_BAND = 0.15;

/**
 * The point of a picture that stands on the tile, in its own
 * coordinates.
 *
 * Two things it is not. It is not the middle of the soft shadow the
 * rips lay under a prop, which reaches out much further than the prop
 * does and drags the point off to one side. And it is not the lowest
 * drawn row, which is the **front** of the patch the thing stands on
 * rather than the middle: a rock is a solid resting on a piece of
 * ground, not a card stood on its edge, so the middle is half the
 * patch's depth further back. How deep a patch of a given width reads
 * is the board's tilt, and that is the whole of what `GROUND_SQUASH`
 * says.
 *
 * Opaque pixels are the drawn thing and the shadows never are, which
 * is the whole of how the two are told apart
 */
export default function groundPoint(image: Image): [x: number, y: number] {
  let bottom = -1;
  let lit = -1;
  let top = image.height;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.rgba[(y * image.width + x) * 4 + 3];

      if (alpha > 0 && y > lit) {
        lit = y;
      }
      if (alpha < 255) {
        continue;
      }
      if (y < top) {
        top = y;
      }
      if (y > bottom) {
        bottom = y;
      }
    }
  }
  // Nothing opaque at all is a thing drawn entirely soft, and the best
  // guess left is the middle of whatever there is
  if (bottom < 0) {
    return [Math.floor(image.width / 2), lit < 0 ? image.height - 1 : lit];
  }

  const band = Math.max(top, bottom - BASE_BAND + 1);
  let left = image.width;
  let right = -1;

  for (let y = band; y <= bottom; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.rgba[(y * image.width + x) * 4 + 3] < 255) {
        continue;
      }
      if (x < left) {
        left = x;
      }
      if (x > right) {
        right = x;
      }
    }
  }
  return [
    Math.round((left + right) / 2),
    Math.round(bottom - ((right - left + 1) * GROUND_SQUASH) / 2),
  ];
}

/**
 * How much ground a picture covers, in its own pixels.
 *
 * What a caller sizes it by. A sheet is cut in whatever square held
 * the tallest thing on it, and that square is a fact about the packing
 * rather than about the world: sizing a tree by it makes the tree as
 * big as the sheet's tallest tree happened to be. The ground it stands
 * on is the real measure, and one tile of it is one tile
 */
export function groundSpan(image: Image): number {
  let top = image.height;
  let bottom = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.rgba[(y * image.width + x) * 4 + 3] < 255) {
        continue;
      }
      if (y < top) {
        top = y;
      }
      if (y > bottom) {
        bottom = y;
      }
    }
  }
  if (bottom < 0) {
    return image.width;
  }

  const band = Math.max(top, bottom - Math.round((bottom - top + 1) * FOOTING_BAND) + 1);
  let left = image.width;
  let right = -1;

  for (let y = band; y <= bottom; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.rgba[(y * image.width + x) * 4 + 3] < 255) {
        continue;
      }
      if (x < left) {
        left = x;
      }
      if (x > right) {
        right = x;
      }
    }
  }
  return right - left + 1;
}
