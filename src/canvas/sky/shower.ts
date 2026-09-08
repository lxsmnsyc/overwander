import Weather from '../../data/overworld/weather';
import type { QuadPoint } from '../gl/quad-batch';
import { airOn } from './curtain';
import { type SkyCamera, zoomFor } from './drops';
import seeded from './seed';

/** What crosses the sky rather than falling through it: showers, and the meteors in them */
/**
 * A shower of shooting stars: a few crossing at a time, each drawn
 * from its head backwards so it reads as something written rather
 * than something falling.
 *
 * It is not a fall. A fall is the same drop over and over at the same
 * speed, which is why a sparse one read as thin rain: what a meteor
 * does is arrive, streak, and go out, and the tail behind the head is
 * the part that says so
 */
export interface Shower {
  /** How many are crossing at once, on the reference screen */
  count: number;
  /** How long one takes to cross, in seconds */
  life: number;
  /** How far one travels, as a share of the picture's diagonal */
  reach: number;
  /** How long the tail is, as a share of that travel */
  tail: number;
  /** How many pieces the tail is drawn in, each fainter than the last */
  pieces: number;
  colour: string;
  thickness: number;
}

export const SHOWERS: Partial<Record<Weather, Shower>> = {
  [Weather.MeteorShower]: {
    count: 3,
    life: 1.6,
    reach: 0.55,
    tail: 0.34,
    pieces: 14,
    colour: '#fff1cf',
    thickness: 2.2,
  },
};

/**
 * Where one meteor is this moment, or null while it is between
 * crossings.
 *
 * The head is where it has reached; the tail runs back along the way
 * it came, and is short while it is still setting out so the streak
 * is drawn in rather than arriving whole
 */
export function meteorAt(
  shower: Shower,
  which: number,
  width: number,
  height: number,
  seconds: number,
): { head: QuadPoint; back: QuadPoint; light: number } | null {
  const slot = seconds / shower.life + which * 0.61;
  const cycle = Math.floor(slot);
  const through = slot - cycle;
  const seed = which * 977 + cycle;
  // Not every slot flies: a sky where one crosses on a beat is a
  // metronome rather than a shower
  if (seeded(seed + 5) < 0.35) {
    return null;
  }

  const span = Math.hypot(width, height) * shower.reach;
  // Down and across, always the same way: a shower radiates from one
  // point in the sky, so they run parallel to each other
  const angle = Math.PI * 0.28 + (seeded(seed + 1) - 0.5) * 0.22;
  const step = { x: Math.cos(angle) * span, y: Math.sin(angle) * span };
  const from = {
    x: width * (seeded(seed + 2) * 1.3 - 0.45),
    y: height * (seeded(seed + 3) * 0.5 - 0.25),
  };
  const head = { x: from.x + step.x * through, y: from.y + step.y * through };
  const behind = Math.min(shower.tail, through);

  return {
    head,
    back: { x: head.x - step.x * behind, y: head.y - step.y * behind },
    // Lit as it arrives and gone before it lands, so nothing ends
    // abruptly in the middle of the picture
    light: Math.min(1, through * 14) * Math.min(1, (1 - through) * 3.2),
  };
}

/**
 * A meteor given a bearing: it enters the world somewhere off the far
 * side and crosses the board along a heading, rather than crossing the
 * frame along a screen diagonal. Turn the camera and the shower runs
 * the other way, which is the whole point of it having a direction
 */
const METEOR = { high: 0.95, low: 0.25, out: 2.4 };

export function worldMeteorAt(
  shower: Shower,
  which: number,
  seconds: number,
  camera: SkyCamera,
): { head: QuadPoint; back: QuadPoint; light: number } | null {
  const slot = seconds / shower.life + which * 0.61;
  const cycle = Math.floor(slot);
  const through = slot - cycle;
  const seed = which * 977 + cycle;

  // Not every slot flies: a sky where one crosses on a beat is a
  // metronome rather than a shower
  if (seeded(seed + 5) < 0.35) {
    return null;
  }

  // They radiate from one quarter of the sky, so they run parallel
  const bearing = Math.PI * 1.15 + (seeded(seed + 1) - 0.5) * 0.5;
  const from = {
    u: 0.5 + Math.cos(bearing) * -METEOR.out + (seeded(seed + 2) - 0.5) * 2.2,
    v: 0.5 + Math.sin(bearing) * -METEOR.out + (seeded(seed + 3) - 0.5) * 1.4,
  };
  const step = { u: Math.cos(bearing) * METEOR.out * 2, v: Math.sin(bearing) * METEOR.out * 2 };
  const at = (share: number): QuadPoint =>
    airOn(
      camera,
      from.u + step.u * share,
      from.v + step.v * share,
      METEOR.high - (METEOR.high - METEOR.low) * share,
    );
  const behind = Math.min(shower.tail, through);

  return {
    head: at(through),
    back: at(through - behind),
    // Lit as it arrives and gone before it lands, so nothing ends
    // abruptly in the middle of the picture
    light: Math.min(1, through * 14) * Math.min(1, (1 - through) * 3.2),
  };
}

/**
 * A shower, drawn head first. Each tail is a run of pieces rather than
 * one line, because what fades along its length is the whole point and
 * a stroke has one colour from end to end
 */
export function paintShower(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  shower: Shower,
  clock: number,
  camera?: SkyCamera,
): void {
  const seconds = clock / 1000;
  const zoom = zoomFor(width, height);
  const held = context.globalAlpha;

  context.globalCompositeOperation = 'screen';
  context.lineCap = 'round';
  context.strokeStyle = shower.colour;
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
      const fade = (1 - near) ** 1.6;

      context.globalAlpha = held * flying.light * fade;
      context.lineWidth = shower.thickness * zoom * (0.35 + 0.65 * (1 - near));
      context.beginPath();
      context.moveTo(
        flying.head.x + (flying.back.x - flying.head.x) * near,
        flying.head.y + (flying.back.y - flying.head.y) * near,
      );
      context.lineTo(
        flying.head.x + (flying.back.x - flying.head.x) * far,
        flying.head.y + (flying.back.y - flying.head.y) * far,
      );
      context.stroke();
    }
  }
  context.globalAlpha = held;
  context.lineWidth = 1;
}
