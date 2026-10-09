import type { SpriteQuad } from '../../../canvas/placement';
import { cornersOf } from '../../../canvas/placement';
import type { QuadPoint } from '../../../canvas/gl/quad-batch';
import type { Point } from '../../../canvas/sprite-sheet';
import type { Baked } from '../../../canvas/bakery';
import type { SlotBatch } from './draw';
import { DYNAMAX_GLOW, GIGANTAMAX_GLOW } from './metrics';

/**
 * How a Dynamaxed pokemon looks beyond its size: a red glow round it,
 * its body washed red, and three storm clouds swirling over its head. Both
 * renderers draw it, the batch through `wash` quads and baked puffs and
 * the 2D context with a scratch canvas and gradients.
 */

/** One pulse of the glow and the wash, over 2 pi */
const PULSE = 260;

/** How far each ring of the glow reaches past the body, and how strong it is */
const HALO = [
  { spread: 1.12, strength: 0.3 },
  { spread: 1.06, strength: 0.55 },
] as const;

/** How much of the body the red covers, at the low and the high of the pulse */
const WASH_LOW = 0.5;
const WASH_HIGH = 0.66;

/** The clouds: three comets over the head, and how long a radian of turn takes */
export const CLOUDS = 3;
const TURN = 900;
/** How wide the orbit is against the body, and how flat it looks from the camera */
const RING_REACH = 1.1;
const RING_TILT = 0.34;
/** How far above the crown the orbit's middle sits, against its own depth */
const RING_LIFT = 0.9;
/** Each cloud's head against the orbit, and how far it swells and how fast */
const PUFF_SIZE = 0.34;
const PUFF_SWELL = 0.04;
const PUFF_BREATH = 650;
/** The tail: how many puffs trail each head, how far apart in radians, and how thin it ends */
const TAIL = 8;
const TAIL_STEP = 0.15;
const TAIL_END = 0.2;
/** How solid a cloud is at most, so the body shows through it */
const CLOUD_ALPHA = 0.62;
const GLOW_ALPHA = 0.5;
/** How fast the red light inside them flickers */
const FLICKER = 170;

/** The clouds' own dark red, lit from inside by the glow colour */
const CLOUD = '#4a0a1c';

/** The size a puff is baked at, which is large enough to stay soft on a boss */
const PUFF_BAKED = 96;

/** What the look needs of a slot: how far it has grown, and which red it takes */
export interface GiantLook {
  share: number;
  tint: string;
  /** From 0 to 1, the pulse at this instant */
  pulse: number;
}

/** Where its body is: the frame it is drawn from, its feet and middle, and how wide it is */
export interface GiantBody {
  quad: SpriteQuad;
  foot: Point;
  middle: Point | null;
  /** Half the width of the body, from its shadow */
  reach: number;
}

export function giantLookOf(giant: number, gigantamax: boolean, clock: number): GiantLook | null {
  if (giant <= 0) {
    return null;
  }
  return {
    share: giant,
    tint: gigantamax ? GIGANTAMAX_GLOW : DYNAMAX_GLOW,
    pulse: 0.5 + 0.5 * Math.sin(clock / PULSE),
  };
}

/** Four corners pushed out from their own middle by a factor */
export function spreadCorners(points: QuadPoint[], factor: number): QuadPoint[] {
  let cx = 0;
  let cy = 0;

  for (const point of points) {
    cx += point.x / points.length;
    cy += point.y / points.length;
  }

  const spread: QuadPoint[] = [];

  for (const point of points) {
    spread.push({ x: cx + (point.x - cx) * factor, y: cy + (point.y - cy) * factor });
  }
  return spread;
}

/** One lumpy puff around a point, in a colour fading out at its edge */
function paintPuff(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colour: string,
): void {
  // Three lobes, so a puff reads as cloud rather than as a disc
  const lobes = [
    { dx: 0, dy: 0, r: 1 },
    { dx: -0.42, dy: 0.18, r: 0.68 },
    { dx: 0.44, dy: 0.12, r: 0.72 },
  ];

  for (const lobe of lobes) {
    const cx = x + lobe.dx * radius;
    const cy = y + lobe.dy * radius;
    const r = lobe.r * radius * 0.62;
    const fill = context.createRadialGradient(cx, cy, 0, cx, cy, r);

    fill.addColorStop(0, colour);
    fill.addColorStop(0.55, colour);
    fill.addColorStop(1, `${colour}00`);
    context.fillStyle = fill;
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.fill();
  }
}

/** The puff, white so the batch can tint it */
function bakePuff(onto: SlotBatch): Baked | null {
  return onto.bakery.take('dynamax:puff', PUFF_BAKED, (context) => {
    paintPuff(context, 0, 0, PUFF_BAKED / 2, '#ffffff');
  });
}

export interface Puff {
  x: number;
  y: number;
  size: number;
  front: boolean;
  /** How solid it is, 1 at a head and fading down its tail */
  weight: number;
  /** From 0 to 1, the flare of the red light, which lives in the heads only */
  flicker: number;
}

/**
 * The three cloud comets over the head at this instant: each a head
 * trailing a tapering tail along the orbit. Tails come first, so a head
 * is drawn over its own wisp.
 */
export function cloudsOf(body: GiantBody, clock: number): Puff[][] {
  const rx = body.reach * RING_REACH;
  const ry = rx * RING_TILT;
  // A packed picture is cut to its pixels, so its top is the crown
  const cx = body.middle?.[0] ?? body.foot[0];
  const cy = body.quad.top - ry * RING_LIFT;
  const clouds: Puff[][] = [];

  for (let at = 0; at < CLOUDS; at++) {
    const lead = (at / CLOUDS) * Math.PI * 2 + clock / TURN;
    const swell = PUFF_SIZE + PUFF_SWELL * Math.sin(clock / PUFF_BREATH + at * 2.3);
    const flare = Math.max(0, Math.sin(clock / FLICKER + at * 4.1)) ** 6;
    const cloud: Puff[] = [];

    for (let back = TAIL; back >= 0; back--) {
      // The angle grows with the clock, so the tail lies behind at smaller angles
      const angle = lead - back * TAIL_STEP;
      const taper = 1 - (1 - TAIL_END) * (back / TAIL);

      cloud.push({
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
        size: rx * swell * 2 * taper,
        front: Math.sin(angle) > 0,
        weight: back === 0 ? 1 : 0.85 * taper,
        flicker: back === 0 ? flare : 0,
      });
    }
    clouds.push(cloud);
  }
  return clouds;
}

/** A puff in a colour, on whichever renderer is drawing */
function stampPuff(
  context: CanvasRenderingContext2D,
  onto: SlotBatch | undefined,
  piece: Baked | null,
  x: number,
  y: number,
  size: number,
  colour: string,
  alpha: number,
  screen: boolean,
): void {
  if (onto != null && piece != null) {
    const half = size / 2;

    onto.batch.quad(
      onto.bakery.sheet,
      piece,
      [
        { x: x - half, y: y - half },
        { x: x + half, y: y - half },
        { x: x + half, y: y + half },
        { x: x - half, y: y + half },
      ],
      alpha,
      colour,
      'smooth',
      screen ? 'screen' : 'over',
    );
    return;
  }
  context.save();
  context.globalAlpha *= alpha;
  if (screen) {
    context.globalCompositeOperation = 'screen';
  }
  paintPuff(context, x, y, size / 2, colour);
  context.restore();
}

/** The pieces of the clouds behind the head, or the pieces in front of it */
function drawClouds(
  context: CanvasRenderingContext2D,
  body: GiantBody,
  look: GiantLook,
  clock: number,
  alpha: number,
  front: boolean,
  onto: SlotBatch | undefined,
): void {
  const piece = onto == null ? null : bakePuff(onto);
  const shown = alpha * look.share;

  for (const cloud of cloudsOf(body, clock)) {
    for (const puff of cloud) {
      if (puff.front !== front) {
        continue;
      }
      // The far side is a shade lighter, so the orbit reads as round
      const solid = shown * puff.weight * (front ? 1 : 0.8);

      stampPuff(context, onto, piece, puff.x, puff.y, puff.size, CLOUD, solid * CLOUD_ALPHA, false);
      // The red light inside, flaring now and then
      stampPuff(
        context,
        onto,
        piece,
        puff.x,
        puff.y + puff.size * 0.12,
        puff.size * 0.75,
        look.tint,
        solid * GLOW_ALPHA * (0.6 + 0.4 * puff.flicker),
        true,
      );
    }
  }
}

let scratch: HTMLCanvasElement | null = null;

/** The frame cut out in one flat colour, for the 2D context. Null where there is no document */
function washedFrame(quad: SpriteQuad, colour: string): HTMLCanvasElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  scratch ??= document.createElement('canvas');

  const width = Math.max(1, Math.ceil(quad.source.width));
  const height = Math.max(1, Math.ceil(quad.source.height));

  if (scratch.width < width || scratch.height < height) {
    scratch.width = Math.max(scratch.width, width);
    scratch.height = Math.max(scratch.height, height);
  }

  const paint = scratch.getContext('2d');

  if (paint == null) {
    return null;
  }
  paint.globalCompositeOperation = 'source-over';
  paint.clearRect(0, 0, scratch.width, scratch.height);
  paint.drawImage(
    quad.sheet,
    quad.source.x,
    quad.source.y,
    quad.source.width,
    quad.source.height,
    0,
    0,
    quad.source.width,
    quad.source.height,
  );
  paint.globalCompositeOperation = 'source-in';
  paint.fillStyle = colour;
  paint.fillRect(0, 0, width, height);
  return scratch;
}

/** The body in one colour at a spread, on whichever renderer is drawing */
function wash(
  context: CanvasRenderingContext2D,
  quad: SpriteQuad,
  spread: number,
  colour: string,
  alpha: number,
  onto: SlotBatch | undefined,
): void {
  if (onto != null) {
    onto.batch.quad(
      quad.sheet,
      quad.source,
      spreadCorners(cornersOf(quad), spread),
      alpha,
      colour,
      'pixels',
      'wash',
    );
    return;
  }

  const washed = washedFrame(quad, colour);

  if (washed == null) {
    return;
  }

  const width = quad.width * spread;
  const height = quad.height * spread;
  const left = quad.left + (quad.width - width) / 2;
  const top = quad.top + (quad.height - height) / 2;

  context.save();
  context.imageSmoothingEnabled = false;
  context.globalAlpha *= alpha;
  if (quad.flip === true) {
    context.translate(left + width, top);
    context.scale(-1, 1);
    context.drawImage(washed, 0, 0, quad.source.width, quad.source.height, 0, 0, width, height);
  } else {
    context.drawImage(
      washed,
      0,
      0,
      quad.source.width,
      quad.source.height,
      left,
      top,
      width,
      height,
    );
  }
  context.restore();
}

/** What goes behind the body: the far clouds and the glow round it */
export function drawGiantBehind(
  context: CanvasRenderingContext2D,
  body: GiantBody,
  look: GiantLook,
  clock: number,
  alpha: number,
  onto?: SlotBatch,
): void {
  drawClouds(context, body, look, clock, alpha, false, onto);

  const blaze = look.share * (0.75 + 0.25 * look.pulse);

  for (const ring of HALO) {
    wash(context, body.quad, ring.spread, look.tint, alpha * blaze * ring.strength, onto);
  }
}

/** What goes over the body: the red it is washed in and the near clouds */
export function drawGiantOver(
  context: CanvasRenderingContext2D,
  body: GiantBody,
  look: GiantLook,
  clock: number,
  alpha: number,
  onto?: SlotBatch,
): void {
  const strength = WASH_LOW + (WASH_HIGH - WASH_LOW) * look.pulse;

  wash(context, body.quad, 1, look.tint, alpha * look.share * strength, onto);
  drawClouds(context, body, look, clock, alpha, true, onto);
}
