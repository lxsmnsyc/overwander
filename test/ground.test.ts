import { describe, expect, it } from 'vitest';
import { GROUND_SQUASH } from '../src/canvas/tilt';
import type { Image } from '../src/server/sprites/png';
import groundPoint from '../scripts/ground.ts';

/**
 * The one question a sprite sheet answers about a picture: which point
 * of it stands on the tile. The sheets are cut by a tool and the board
 * only reads what it wrote, so this is where the rule itself is checked.
 */
describe('where a drawn thing meets the ground', () => {
  /** A blank picture, ready to be drawn on. */
  const blank = (width: number, height: number): Image => ({
    width,
    height,
    rgba: Buffer.alloc(width * height * 4),
  });

  const paint = (image: Image, x: number, y: number, alpha: number): void => {
    image.rgba[(y * image.width + x) * 4 + 3] = alpha;
  };

  const box = (image: Image, from: number, to: number, top: number, bottom: number): void => {
    for (let y = top; y <= bottom; y += 1) {
      for (let x = from; x <= to; x += 1) {
        paint(image, x, y, 255);
      }
    }
  };

  it('stands a thing in the middle of the patch it rests on', () => {
    const image = blank(20, 20);

    box(image, 4, 13, 5, 15);

    const [x, y] = groundPoint(image);

    // Ten wide is a middle between two pixels, and it takes the later
    expect(x).toBe(9);
    // Above the lowest row it is drawn on, by half the depth a patch
    // ten wide reads as from a board laid back this far
    expect(y).toBe(Math.round(15 - (10 * GROUND_SQUASH) / 2));
  });

  it('takes no notice of the shadow drawn under it', () => {
    const image = blank(30, 20);
    const bare = blank(30, 20);

    box(image, 12, 17, 4, 12);
    box(bare, 12, 17, 4, 12);
    // The soft ellipse a rip lays under a prop, reaching well past it
    // on both sides and three rows below its feet
    for (let y = 11; y <= 15; y += 1) {
      for (let x = 2; x <= 27; x += 1) {
        if (image.rgba[(y * image.width + x) * 4 + 3] === 0) {
          paint(image, x, y, 89);
        }
      }
    }
    expect(groundPoint(image)).toEqual(groundPoint(bare));
  });

  it('stands a narrow trunk on the trunk and not on the branches', () => {
    const image = blank(40, 40);

    // A crown far wider than what holds it up
    box(image, 2, 37, 2, 24);
    box(image, 18, 21, 25, 35);

    const [x, y] = groundPoint(image);

    expect(x).toBe(20);
    expect(y).toBe(Math.round(35 - (4 * GROUND_SQUASH) / 2));
  });

  it('falls back to the middle of a thing drawn entirely soft', () => {
    const image = blank(10, 10);

    for (let x = 2; x <= 7; x += 1) {
      paint(image, x, 6, 120);
    }
    expect(groundPoint(image)).toEqual([5, 6]);
  });
});
