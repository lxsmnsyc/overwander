import type { QuadPoint } from '../../../canvas/gl/quad-batch';
import type { SpriteQuad } from '../../../canvas/sprites/placement';
import type { Baked } from '../../../canvas/bakery';
import { mix } from '../../../canvas/battle/moves/__paint';
import { TYPE_COLORS } from '../../../data/constants/types';
import type Unit from '../../../battle/unit';
import type { SlotBatch } from './draw';
import { wash } from './dynamax';

/**
 * How a Terastallized pokemon looks: its body glazed in its Tera
 * type's colour with glints running over it like cut crystal, and the
 * Tera jewel floating over its head the way a Mega's stone does. Both
 * renderers draw it.
 */

/** One pulse of the glaze, over 2 pi */
const PULSE = 520;

/** How much of the body the colour covers, and how bright the sheen over it runs */
const GLAZE = 0.45;
const SHEEN_LOW = 0.08;
const SHEEN_HIGH = 0.24;
/** The edge it stands in, and how strong it is */
const HALO_SPREAD = 1.07;
const HALO_STRENGTH = 0.35;

/** Where the glints sit on the body, as shares of its frame, and how fast each flashes */
const GLINTS: readonly (readonly [number, number])[] = [
  [0.32, 0.34],
  [0.66, 0.5],
  [0.44, 0.74],
];
const GLINT_PACE = 300;
/** How big a glint is against the body's half width */
const GLINT_SIZE = 0.22;

/** The jewel's half width, how far it floats over the plate, and how it bobs */
export const JEWEL_REACH = 8;
const JEWEL_RISE = 24;
/** How much higher it floats when a form mark already sits there */
const JEWEL_STACK = 20;
const JEWEL_BOB = 2;
const JEWEL_BOB_PACE = 1400;
const JEWEL_GLOW_PACE = 900;
const JEWEL_BAKED = 64;

export interface TeraLook {
  tint: string;
  /** From 0 to 1, the pulse at this instant */
  pulse: number;
}

export function teraLookOf(unit: Unit, clock: number): TeraLook | null {
  if (!unit.terastallized) {
    return null;
  }
  return {
    tint: TYPE_COLORS[unit.teraType],
    pulse: 0.5 + 0.5 * Math.sin(clock / PULSE),
  };
}

/** A flat triangle, on whichever renderer is drawing */
function facet(
  context: CanvasRenderingContext2D,
  onto: SlotBatch | undefined,
  colour: string,
  points: QuadPoint[],
  alpha: number,
  screen = false,
): void {
  if (onto != null) {
    onto.batch.triangle(colour, points, alpha, screen ? 'screen' : 'over');
    return;
  }
  context.save();
  context.globalAlpha *= alpha;
  if (screen) {
    context.globalCompositeOperation = 'screen';
  }
  context.fillStyle = colour;
  context.beginPath();
  for (const [at, point] of points.entries()) {
    if (at === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  }
  context.closePath();
  context.fill();
  context.restore();
}

/** A four-pointed glint: two thin diamonds crossed */
function glint(
  context: CanvasRenderingContext2D,
  onto: SlotBatch | undefined,
  x: number,
  y: number,
  size: number,
  alpha: number,
): void {
  const thin = size * 0.22;
  const arms: QuadPoint[][] = [
    [
      { x, y: y - size },
      { x: x + thin, y },
      { x: x - thin, y },
    ],
    [
      { x, y: y + size },
      { x: x - thin, y },
      { x: x + thin, y },
    ],
    [
      { x: x - size, y },
      { x, y: y - thin },
      { x, y: y + thin },
    ],
    [
      { x: x + size, y },
      { x, y: y + thin },
      { x, y: y - thin },
    ],
  ];

  for (const arm of arms) {
    facet(context, onto, '#ffffff', arm, alpha, true);
  }
}

/** What goes behind the body: an edge of its Tera colour */
export function drawTeraBehind(
  context: CanvasRenderingContext2D,
  quad: SpriteQuad,
  look: TeraLook,
  alpha: number,
  onto?: SlotBatch,
): void {
  wash(context, quad, HALO_SPREAD, look.tint, alpha * HALO_STRENGTH, onto);
}

/** What goes over the body: the glaze, the sheen and the glints running over it */
export function drawTeraOver(
  context: CanvasRenderingContext2D,
  quad: SpriteQuad,
  look: TeraLook,
  clock: number,
  alpha: number,
  onto?: SlotBatch,
): void {
  wash(context, quad, 1, look.tint, alpha * GLAZE, onto);
  wash(
    context,
    quad,
    1,
    mix(look.tint, '#ffffff', 0.7),
    alpha * (SHEEN_LOW + (SHEEN_HIGH - SHEEN_LOW) * look.pulse),
    onto,
  );

  const size = (quad.width / 2) * GLINT_SIZE;

  for (const [at, [across, down]] of GLINTS.entries()) {
    const flash = Math.max(0, Math.sin(clock / GLINT_PACE + at * 2.1)) ** 8;

    if (flash > 0.01) {
      const x = quad.left + quad.width * (quad.flip === true ? 1 - across : across);

      glint(
        context,
        onto,
        x,
        quad.top + quad.height * down,
        size * (0.6 + 0.4 * flash),
        alpha * flash,
      );
    }
  }
}

/** The soft light behind the jewel, white so the batch can tint it */
function bakeGlow(onto: SlotBatch): Baked | null {
  return onto.bakery.take('terastal:glow', JEWEL_BAKED, (context) => {
    const half = JEWEL_BAKED / 2;
    const fill = context.createRadialGradient(0, 0, 0, 0, 0, half);

    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, '#ffffff00');
    context.fillStyle = fill;
    context.beginPath();
    context.arc(0, 0, half, 0, Math.PI * 2);
    context.fill();
  });
}

/** The jewel's facets about its girdle's middle, each with the colour it catches */
export function jewelFacets(
  x: number,
  y: number,
  tint: string,
): { colour: string; points: QuadPoint[] }[] {
  const w = JEWEL_REACH;
  const tl = { x: x - w * 0.45, y: y - w * 0.6 };
  const tr = { x: x + w * 0.45, y: y - w * 0.6 };
  const gl = { x: x - w, y };
  const ml = { x: x - w * 0.35, y };
  const mr = { x: x + w * 0.35, y };
  const gr = { x: x + w, y };
  const culet = { x, y: y + w * 1.3 };
  const light = mix(tint, '#ffffff', 0.55);
  const lit = mix(tint, '#ffffff', 0.25);
  const dark = mix(tint, '#000000', 0.3);
  const deep = mix(tint, '#000000', 0.5);

  return [
    { colour: lit, points: [tl, gl, ml] },
    { colour: light, points: [tl, tr, mr] },
    { colour: light, points: [tl, mr, ml] },
    { colour: tint, points: [tr, mr, gr] },
    { colour: tint, points: [gl, ml, culet] },
    { colour: dark, points: [ml, mr, culet] },
    { colour: deep, points: [mr, gr, culet] },
  ];
}

/**
 * The Tera jewel over the head, centred on `x` with the plate's line at
 * `y`, and lifted over a form mark where one is already floating there
 */
export function drawTeraJewel(
  context: CanvasRenderingContext2D,
  look: TeraLook,
  x: number,
  y: number,
  stacked: boolean,
  clock: number,
  alpha: number,
  onto?: SlotBatch,
): void {
  const at =
    y -
    JEWEL_RISE -
    (stacked ? JEWEL_STACK : 0) +
    Math.sin((clock / JEWEL_BOB_PACE) * Math.PI * 2) * JEWEL_BOB;
  const pulse = 0.5 + 0.5 * Math.sin((clock / JEWEL_GLOW_PACE) * Math.PI * 2);
  const glow = alpha * (0.35 + 0.35 * pulse);
  const reach = JEWEL_REACH * 2.2;
  const piece = onto == null ? null : bakeGlow(onto);

  if (onto != null && piece != null) {
    onto.batch.quad(
      onto.bakery.sheet,
      piece,
      [
        { x: x - reach, y: at - reach },
        { x: x + reach, y: at - reach },
        { x: x + reach, y: at + reach },
        { x: x - reach, y: at + reach },
      ],
      glow,
      look.tint,
      'smooth',
      'screen',
    );
  } else if (onto == null) {
    const fill = context.createRadialGradient(x, at, 0, x, at, reach);

    fill.addColorStop(0, look.tint);
    fill.addColorStop(1, `${look.tint}00`);
    context.save();
    context.globalAlpha *= glow;
    context.globalCompositeOperation = 'screen';
    context.fillStyle = fill;
    context.beginPath();
    context.arc(x, at, reach, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  for (const cut of jewelFacets(x, at, look.tint)) {
    facet(context, onto, cut.colour, cut.points, alpha);
  }
  // A glint across its table now and then
  const flash = Math.max(0, Math.sin(clock / GLINT_PACE)) ** 6;

  if (flash > 0.01) {
    glint(
      context,
      onto,
      x - JEWEL_REACH * 0.2,
      at - JEWEL_REACH * 0.35,
      JEWEL_REACH * 0.5,
      alpha * flash,
    );
  }
}
