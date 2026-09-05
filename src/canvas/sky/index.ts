import Weather from '../../data/overworld/weather';
import type QuadBatch from '../gl/quad-batch';
import type { QuadPoint } from '../gl/quad-batch';
import {
  CURTAINS,
  CURTAIN_STEPS,
  DROP_RADIUS,
  DROP_SIZE,
  batchCurtainOver,
  curtainStrip,
  paintCurtain,
  paintCurtainOver,
  ribAt,
  roundDrop,
} from './curtain';
import { type SkyCamera, eachDrop, eachWorldDrop, paintFall, zoomFor } from './drops';
import { FALL_TABLE } from './fall';
import { FLASHES, flashAt } from './flash';
import { LAMPLIT, type Lamp, lampMask } from './lamp';
import { SHEENS, batchSheen, paintSheen } from './sheen';
import { SHOWERS, meteorAt, paintShower, worldMeteorAt } from './shower';
import { BLENDS, MODES, WASHES } from './wash';

/**
 * What a frame of sky is: the lights in it, the wash over it, and the
 * two ways it is drawn. The effects themselves are beside this file,
 * one module each
 */
/**
 * The aurora, the bows and the mirage, written into a batch. All of
 * them are lifted rather than laid on, the way they are painted
 */
function batchLights(
  batch: QuadBatch,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength: number,
  camera?: SkyCamera,
): void {
  const curtain = CURTAINS[weather];
  const sheen = SHEENS[weather];

  if (curtain != null && camera != null) {
    batchCurtainOver(batch, curtain, camera, clock, strength);
  } else if (curtain != null) {
    const seconds = clock / 1000;
    const across = width / curtain.ribs;

    for (let band = 0; band < curtain.bands; band++) {
      const shift = Math.sin(seconds * 0.12 + band) * 0.5 + 0.5;
      const strip = curtainStrip(band, shift, curtain);

      if (strip == null) {
        continue;
      }
      const top = height * (curtain.top + band * curtain.gap);
      const deep = height * curtain.deep;

      batch.invalidate(strip);
      for (let rib = 0; rib < curtain.ribs; rib++) {
        const { foot, light } = ribAt(curtain, band, rib, seconds);
        const wide = across * curtain.spread;
        const left = rib * across - (wide - across) / 2;
        const bottom = top + deep * foot;

        batch.quad(
          strip,
          { x: 0, y: 0, width: 1, height: CURTAIN_STEPS },
          [
            { x: left, y: top },
            { x: left + wide, y: top },
            { x: left + wide, y: bottom },
            { x: left, y: bottom },
          ],
          strength * light,
          undefined,
          'smooth',
          'screen',
        );
      }
    }
  }
  const shower = SHOWERS[weather];

  if (shower != null) {
    const seconds = clock / 1000;
    const zoom = zoomFor(width, height);

    for (let which = 0; which < shower.count; which++) {
      const flying =
        camera == null
          ? meteorAt(shower, which, width, height, seconds)
          : worldMeteorAt(shower, which, seconds, camera);

      if (flying == null) {
        continue;
      }
      for (let piece = 0; piece < shower.pieces; piece++) {
        const near = piece / shower.pieces;
        const far = (piece + 1) / shower.pieces;
        const along = (share: number): QuadPoint => ({
          x: flying.head.x + (flying.back.x - flying.head.x) * share,
          y: flying.head.y + (flying.back.y - flying.head.y) * share,
        });

        batch.line(
          shower.colour,
          along(near),
          along(far),
          shower.thickness * zoom * (0.35 + 0.65 * (1 - near)),
          strength * flying.light * (1 - near) ** 1.6,
          'screen',
        );
      }
    }
  }
  if (sheen != null) {
    batchSheen(batch, width, height, sheen, clock, camera?.yaw ?? 0, strength);
  }
}

/**
 * The wash a sky lays over the picture, written into a batch. Answers
 * whether it wrote one
 */
export function batchWash(
  batch: QuadBatch,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength = 1,
  lamps: Lamp[] = [],
  camera?: SkyCamera,
): boolean {
  if (weather === Weather.Clear || strength <= 0 || !(width > 0) || !(height > 0)) {
    return false;
  }
  const wash = WASHES[weather];
  const dark = LAMPLIT[weather];

  if (dark != null) {
    const cut = lampMask(width, height, dark, lamps, strength);

    if (cut != null) {
      batch.invalidate(cut);
      batch.quad(
        cut,
        { x: 0, y: 0, width: cut.width, height: cut.height },
        [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        1,
        undefined,
        'smooth',
        'over',
      );
    }
  }
  if (wash != null) {
    batch.solid(
      wash.colour,
      [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
      wash.depth * strength,
      BLENDS[wash.mode],
    );
  }
  const flash = FLASHES[weather];
  const lit = flashAt(weather, clock / 1000);

  if (flash != null && lit > 0) {
    batch.solid(
      flash.colour,
      [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ],
      flash.depth * lit * strength,
      'screen',
    );
  }
  batchLights(batch, width, height, weather, clock, strength, camera);
  return true;
}

/**
 * The fall, written into a batch instead of stroked.
 *
 * Every sky is drawn drop by drop here: a batch does not charge for a
 * stroke the way a tessellated path does, and every drop keeps the
 * pace of its own that two scrolling sheets could only pretend at.
 *
 * Answers whether it drew anything, so a caller knows not to stroke it
 */
export function batchSky(
  batch: QuadBatch,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength = 1,
  camera?: SkyCamera,
): boolean {
  const fall = FALL_TABLE[weather];

  if (fall == null || strength <= 0 || !(width > 0) || !(height > 0)) {
    return false;
  }
  const zoom = zoomFor(width, height);
  const dots = fall.length <= 0;
  const thickness = fall.thickness * zoom;
  const stamp = dots ? roundDrop() : null;

  if (dots && stamp == null) {
    return false;
  }
  // The stroked pass draws a round drop as a cap, whose width is the
  // whole diameter rather than the radius, so the square is that wide
  // too, grown by however much of the sheet the circle left over
  const spread = DROP_SIZE / 2 / DROP_RADIUS;
  const source = { x: 0, y: 0, width: DROP_SIZE, height: DROP_SIZE };

  /** One drop, at whatever size and strength its depth has left it */
  const put = (
    x: number,
    y: number,
    tipX: number,
    tipY: number,
    wide: number,
    alpha: number,
  ): void => {
    if (stamp == null) {
      batch.line(fall.colour, { x, y }, { x: tipX, y: tipY }, wide, alpha);
      return;
    }

    const across = wide * spread;

    batch.quad(
      stamp,
      source,
      [
        { x: x - across, y: y - across },
        { x: x + across, y: y - across },
        { x: x + across, y: y + across },
        { x: x - across, y: y + across },
      ],
      alpha,
      fall.colour,
      'smooth',
    );
  };

  if (camera == null) {
    eachDrop(width, height, fall, clock, zoom, (x, y, tipX, tipY) => {
      put(x, y, tipX, tipY, thickness, strength);
    });
    return true;
  }

  eachWorldDrop(width, height, camera, fall, clock, zoom, (x, y, tipX, tipY, scale, weight) => {
    put(x, y, tipX, tipY, Math.max(0.4, thickness * scale), strength * weight);
  });
  return true;
}

/**
 * Lay the weather over the board.
 *
 * `strength` is how much of it to draw, so a sky can be faded in as a
 * chunk is walked into rather than switched on
 */
export default function paintSky(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  weather: Weather,
  clock: number,
  strength = 1,
  lamps: Lamp[] = [],
  camera?: SkyCamera,
): void {
  // A canvas with no size is a canvas mid-layout — a board hidden
  // behind a dialog measures zero until the dialog is gone — and
  // painting into one is at best nothing drawn
  if (weather === Weather.Clear || strength <= 0 || !(width > 0) || !(height > 0)) {
    return;
  }
  const wash = WASHES[weather];
  const fall = FALL_TABLE[weather];
  const dark = LAMPLIT[weather];

  context.save();
  if (wash != null) {
    context.globalCompositeOperation = MODES[wash.mode];
    context.globalAlpha = wash.depth * strength;
    context.fillStyle = wash.colour;
    context.fillRect(0, 0, width, height);
  }
  if (dark != null) {
    const cut = lampMask(width, height, dark, lamps, strength);

    if (cut != null) {
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1;
      context.drawImage(cut, 0, 0, width, height);
    }
  }
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = strength;
  const curtain = CURTAINS[weather];
  const sheen = SHEENS[weather];
  const shower = SHOWERS[weather];
  const lit = flashAt(weather, clock / 1000);

  if (curtain != null) {
    if (camera == null) {
      paintCurtain(context, width, height, curtain, clock);
    } else {
      paintCurtainOver(context, curtain, camera, clock);
    }
  }
  if (sheen != null) {
    paintSheen(context, width, height, sheen, clock, camera?.yaw ?? 0, strength);
  }
  if (shower != null) {
    paintShower(context, width, height, shower, clock, camera);
  }
  // Lightning behind the rain rather than over it, which is where it
  // is: what a strike lights is the sky, and the fall is between the
  // player and that
  if (lit > 0) {
    const flash = FLASHES[weather];

    if (flash != null) {
      context.globalCompositeOperation = 'screen';
      context.globalAlpha = flash.depth * lit * strength;
      context.fillStyle = flash.colour;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = strength;
    }
  }
  context.globalCompositeOperation = 'source-over';
  if (fall != null) {
    const zoom = zoomFor(width, height);

    paintFall(context, width, height, fall, clock, zoom, camera);
  }
  context.restore();
}

export type { Lamp } from './lamp';
export { FALL_TABLE } from './fall';
export type { SkyCamera, WorldDrop } from './drops';
export { thinningAt, worldDropAt } from './drops';
