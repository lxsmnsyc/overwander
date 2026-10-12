import { CELL } from './metrics';
import type { AuraPart } from './scenery';

/**
 * The two raid sites that are drawn in code rather than off the sheet.
 *
 * A Max Raid is a den the way Sword and Shield drew one: a ring of
 * rock round a hole in the ground with a pillar of light standing out
 * of it, red, or purple and brighter for a Gigantamax. A Totem's trial
 * site is four standing stones round a worn floor with the Totem's
 * gold-orange aura flickering over it. Each is painted once a frame
 * per kind, in two halves like a landmark's aura: what lies on the
 * ground, and what stands up over it
 */

/** Which picture a raid site is painted as */
export const enum RaidBeacon {
  /** A Max Raid's red pillar */
  Max = 0,
  /** A Max Raid holding a Gigantamax, in purple and brighter */
  Gigantamax = 1,
  /** A Totem's trial site */
  Totem = 2,
  /** A Max Raid this player has cleared: the hole, gone dark */
  Spent = 3,
}

type Ink = readonly [number, number, number];

const INKS: Record<RaidBeacon, { glow: Ink; core: Ink; strength: number }> = {
  [RaidBeacon.Max]: { glow: [236, 40, 64], core: [255, 196, 200], strength: 1 },
  [RaidBeacon.Gigantamax]: { glow: [178, 64, 255], core: [244, 210, 255], strength: 1.35 },
  [RaidBeacon.Totem]: { glow: [255, 150, 36], core: [255, 236, 170], strength: 1 },
  [RaidBeacon.Spent]: { glow: [120, 40, 50], core: [160, 120, 120], strength: 0 },
};

/** How big the picture is painted, and where its ground point sits in it */
const PAINTED_WIDTH = 224;
const PAINTED_HEIGHT = 768;
const ORIGIN_Y = 0.92;

/** How many cells across the picture spans on the board */
const SPAN_CELLS = 4.4;

/** The painted cell, and the hole's radius, in painted pixels */
const PAINTED_CELL = PAINTED_WIDTH / SPAN_CELLS;
const HOLE = PAINTED_CELL * 0.72;

/** How long a mote takes to climb, a shimmer to pass, and a flame to flicker, in ms */
const MOTE_RISE = 2600;
const SHIMMER = 1400;
const FLICKER = 900;

const MOTES = 9;

/** The rocks round a den's rim, and the stones round a trial floor */
const RIM_ROCKS = 11;
const TRIAL_STONES = 4;

function rgba([red, green, blue]: Ink, alpha: number): string {
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** A small stand-in for randomness that is the same every frame, so a rock keeps its shape */
function jitter(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}

/** One lump of rock: an uneven polygon, lit from above */
function rock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number,
): void {
  const corners = 6;

  context.beginPath();
  for (let at = 0; at < corners; at++) {
    const angle = (at / corners) * Math.PI * 2 + jitter(seed + at) * 0.6;
    const reach = size * (0.75 + jitter(seed * 3 + at) * 0.4);
    const px = x + Math.cos(angle) * reach;
    const py = y + Math.sin(angle) * reach * 0.8;

    if (at === 0) {
      context.moveTo(px, py);
    } else {
      context.lineTo(px, py);
    }
  }
  context.closePath();

  const shade = context.createLinearGradient(x, y - size, x, y + size);

  shade.addColorStop(0, '#a49a8e');
  shade.addColorStop(0.55, '#6e655c');
  shade.addColorStop(1, '#3f3934');
  context.fillStyle = shade;
  context.fill();
  context.strokeStyle = 'rgba(30, 24, 20, 0.85)';
  context.lineWidth = size * 0.14;
  context.stroke();
}

/** The den on the ground: a glow on the earth, the hole, and its ring of rock */
function paintDenGround(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  squash: number,
  now: number,
  beacon: RaidBeacon,
): void {
  const ink = INKS[beacon];
  const lit = ink.strength > 0;
  const breath = 0.85 + 0.15 * Math.sin((now / SHIMMER) * Math.PI * 2);

  context.save();
  context.translate(x, y);
  context.scale(1, squash);

  if (lit) {
    // Light thrown on the ground round the rim, so the den reads at night too
    const spill = context.createRadialGradient(0, 0, HOLE * 0.5, 0, 0, HOLE * 2.6);

    spill.addColorStop(0, rgba(ink.glow, 0.55 * breath * ink.strength));
    spill.addColorStop(1, rgba(ink.glow, 0));
    context.fillStyle = spill;
    context.beginPath();
    context.arc(0, 0, HOLE * 2.6, 0, Math.PI * 2);
    context.fill();
  }

  // The hole, lit from below where something is in it
  const hole = context.createRadialGradient(0, 0, 0, 0, 0, HOLE);

  hole.addColorStop(0, lit ? rgba(ink.core, 0.95) : 'rgba(20, 14, 14, 1)');
  hole.addColorStop(0.45, lit ? rgba(ink.glow, 0.9) : 'rgba(26, 20, 18, 1)');
  hole.addColorStop(1, 'rgba(24, 16, 16, 1)');
  context.fillStyle = hole;
  context.beginPath();
  context.arc(0, 0, HOLE, 0, Math.PI * 2);
  context.fill();

  // The ring of rock, back half first so the front rocks sit over it
  const order: number[] = [];

  for (let at = 0; at < RIM_ROCKS; at++) {
    order.push(at);
  }
  order.sort(
    (one, two) =>
      Math.sin((one / RIM_ROCKS) * Math.PI * 2) - Math.sin((two / RIM_ROCKS) * Math.PI * 2),
  );
  for (const at of order) {
    const angle = (at / RIM_ROCKS) * Math.PI * 2;
    const size = HOLE * (0.4 + jitter(at + 1) * 0.18);

    rock(context, Math.cos(angle) * HOLE * 1.18, Math.sin(angle) * HOLE * 1.18, size, at + 7);
  }
  context.restore();
}

/** The pillar over a den: a soft halo, a body and a white core, shimmering, with motes rising */
function paintDenBeam(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  now: number,
  beacon: RaidBeacon,
): void {
  const ink = INKS[beacon];

  if (ink.strength === 0) {
    return;
  }
  const top = 0;
  const shimmer = Math.sin((now / SHIMMER) * Math.PI * 2);

  context.save();

  // A flare where the beam leaves the hole, so the two read as one
  const flare = context.createRadialGradient(x, y, 0, x, y, HOLE);

  flare.addColorStop(0, rgba(ink.core, 0.9));
  flare.addColorStop(0.4, rgba(ink.glow, 0.55));
  flare.addColorStop(1, rgba(ink.glow, 0));
  context.fillStyle = flare;
  context.beginPath();
  context.ellipse(x, y, HOLE, HOLE * 0.55, 0, 0, Math.PI * 2);
  context.fill();

  // Halo, body and core, each narrower and brighter than the last
  for (const [width, alpha, colour] of [
    [HOLE * 1.5, 0.35, ink.glow],
    [HOLE * 0.95, 0.6, ink.glow],
    [HOLE * 0.34, 0.95, ink.core],
  ] as const) {
    const half = width * (1 + shimmer * 0.06) * (beacon === RaidBeacon.Gigantamax ? 1.2 : 1);
    const column = context.createLinearGradient(0, y, 0, top);
    const strength = Math.min(1, alpha * ink.strength);

    column.addColorStop(0, rgba(colour, strength));
    column.addColorStop(0.55, rgba(colour, strength * 0.7));
    column.addColorStop(1, rgba(colour, 0));
    context.fillStyle = column;
    context.beginPath();
    context.moveTo(x - half, y);
    context.lineTo(x - half * 0.8, top);
    context.lineTo(x + half * 0.8, top);
    context.lineTo(x + half, y);
    context.closePath();
    context.fill();
  }

  // A brighter band climbing the beam, so it reads as moving rather than painted on
  const band = (now / (SHIMMER * 2)) % 1;
  const bandY = y - band * (y - top);
  const bandGlow = context.createRadialGradient(x, bandY, 0, x, bandY, HOLE * 1.1);

  bandGlow.addColorStop(0, rgba(ink.core, 0.35 * (1 - band) * ink.strength));
  bandGlow.addColorStop(1, rgba(ink.core, 0));
  context.fillStyle = bandGlow;
  context.fillRect(x - HOLE * 1.2, bandY - HOLE * 1.2, HOLE * 2.4, HOLE * 2.4);

  // Motes drifting up out of the hole
  const motes = beacon === RaidBeacon.Gigantamax ? MOTES + 4 : MOTES;

  for (let mote = 0; mote < motes; mote++) {
    const phase = (now / MOTE_RISE + mote / motes) % 1;
    const sway = Math.sin(now / 600 + mote * 2.3) * HOLE * 0.6;
    const mx = x + (jitter(mote + 3) - 0.5) * HOLE * 1.8 + sway * phase;
    const my = y - phase * (y - top) * 0.75;
    const size = HOLE * 0.13 * (1 - phase * 0.5);

    context.fillStyle = rgba(ink.core, Math.sin(phase * Math.PI) * 0.9);
    context.beginPath();
    context.arc(mx, my, size, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** The trial floor: worn stone with a ring painted on it, and four standing stones round it */
function paintTrialGround(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  squash: number,
  now: number,
): void {
  const ink = INKS[RaidBeacon.Totem];
  const breath = 0.8 + 0.2 * Math.sin((now / FLICKER) * Math.PI * 2);

  context.save();
  context.translate(x, y);
  context.scale(1, squash);

  const spill = context.createRadialGradient(0, 0, HOLE * 0.4, 0, 0, HOLE * 2.4);

  spill.addColorStop(0, rgba(ink.glow, 0.5 * breath));
  spill.addColorStop(1, rgba(ink.glow, 0));
  context.fillStyle = spill;
  context.beginPath();
  context.arc(0, 0, HOLE * 2.4, 0, Math.PI * 2);
  context.fill();

  // The floor, a flagged disc
  context.fillStyle = '#8c8173';
  context.strokeStyle = 'rgba(40, 32, 26, 0.9)';
  context.lineWidth = HOLE * 0.1;
  context.beginPath();
  context.arc(0, 0, HOLE * 1.7, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = rgba(ink.core, 0.9);
  context.lineWidth = HOLE * 0.12;
  context.beginPath();
  context.arc(0, 0, HOLE * 1.1, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

/** One standing stone, drawn upright rather than on the ground */
function standingStone(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  tall: number,
): void {
  const wide = tall * 0.24;
  const face = context.createLinearGradient(x - wide, 0, x + wide, 0);

  face.addColorStop(0, '#7b7166');
  face.addColorStop(0.5, '#b1a697');
  face.addColorStop(1, '#5d554d');
  context.fillStyle = face;
  context.strokeStyle = 'rgba(30, 24, 20, 0.9)';
  context.lineWidth = wide * 0.16;
  context.beginPath();
  context.moveTo(x - wide, y);
  context.lineTo(x - wide * 0.8, y - tall * 0.85);
  context.lineTo(x, y - tall);
  context.lineTo(x + wide * 0.8, y - tall * 0.85);
  context.lineTo(x + wide, y);
  context.closePath();
  context.fill();
  context.stroke();
}

/** The stones and the Totem's aura over the floor, flickering like a flame */
function paintTrialAir(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  squash: number,
  now: number,
  part: 'back' | 'front',
): void {
  const ink = INKS[RaidBeacon.Totem];
  const reach = HOLE * 1.75;

  // The stones on the far side of the floor stand behind the aura, the near ones in front
  for (let at = 0; at < TRIAL_STONES; at++) {
    const angle = (at / TRIAL_STONES) * Math.PI * 2 + Math.PI / 4;
    const near = Math.sin(angle) > 0;

    if (near !== (part === 'front')) {
      continue;
    }
    standingStone(
      context,
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach * squash,
      HOLE * 1.6,
    );
  }
  if (part === 'front') {
    return;
  }

  context.save();

  // Tongues of the aura, each wavering on its own clock
  const tongues = 5;

  for (let tongue = 0; tongue < tongues; tongue++) {
    const offset = (tongue / (tongues - 1) - 0.5) * HOLE * 1.4;
    const flicker = Math.sin(now / FLICKER + tongue * 1.7) * 0.5 + 0.5;
    const tall = HOLE * (3.2 + flicker * 1.6) * (1 - Math.abs(offset) / (HOLE * 1.6));
    const wide = HOLE * 0.55;
    const sway = Math.sin(now / 500 + tongue) * HOLE * 0.25;
    const flame = context.createLinearGradient(0, y, 0, y - tall);

    flame.addColorStop(0, rgba(ink.glow, 0.75));
    flame.addColorStop(0.6, rgba(ink.glow, 0.4));
    flame.addColorStop(1, rgba(ink.glow, 0));
    context.fillStyle = flame;
    context.beginPath();
    context.moveTo(x + offset - wide, y);
    context.quadraticCurveTo(x + offset - wide * 0.6, y - tall * 0.6, x + offset + sway, y - tall);
    context.quadraticCurveTo(x + offset + wide * 0.6, y - tall * 0.6, x + offset + wide, y);
    context.closePath();
    context.fill();
  }

  // A bright heart where the Totem would stand
  const heart = context.createRadialGradient(x, y - HOLE, 0, x, y - HOLE, HOLE * 1.4);

  heart.addColorStop(0, rgba(ink.core, 0.5));
  heart.addColorStop(1, rgba(ink.core, 0));
  context.fillStyle = heart;
  context.fillRect(x - HOLE * 1.5, y - HOLE * 2.5, HOLE * 3, HOLE * 3);

  for (let mote = 0; mote < MOTES; mote++) {
    const phase = (now / (MOTE_RISE * 0.8) + mote / MOTES) % 1;
    const mx = x + (jitter(mote + 11) - 0.5) * HOLE * 2.4;
    const my = y - phase * HOLE * 6;

    context.fillStyle = rgba(ink.core, Math.sin(phase * Math.PI) * 0.85);
    context.beginPath();
    context.arc(mx, my, HOLE * 0.1 * (1 - phase * 0.4), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();

  // Stones in front of the aura are painted last, by the 'front' pass
  paintTrialAir(context, x, y, squash, now, 'front');
}

/** One raid site's part, painted at a ground point in painted pixels */
function paintBeacon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  beacon: RaidBeacon,
  part: AuraPart,
  now: number,
  squash: number,
): void {
  if (beacon === RaidBeacon.Totem) {
    if (part === 'ground') {
      paintTrialGround(context, x, y, squash, now);
    } else {
      paintTrialAir(context, x, y, squash, now, 'back');
    }
    return;
  }
  if (part === 'ground') {
    paintDenGround(context, x, y, squash, now, beacon);
  } else {
    paintDenBeam(context, x, y, now, beacon);
  }
}

const painted = new Map<string, { canvas: HTMLCanvasElement; at: number; squash: number }>();

/**
 * The picture of one raid site's part at this moment, repainted at
 * most once a frame. Null where there is no context to paint with
 */
export function paintRaidBeacon(
  beacon: RaidBeacon,
  part: AuraPart,
  now: number,
  squash: number,
): HTMLCanvasElement | null {
  const key = `${beacon}:${part}`;
  const held = painted.get(key);

  if (held?.at === now && held.squash === squash) {
    return held.canvas;
  }

  const canvas = held?.canvas ?? document.createElement('canvas');

  if (canvas.width !== PAINTED_WIDTH || canvas.height !== PAINTED_HEIGHT) {
    canvas.width = PAINTED_WIDTH;
    canvas.height = PAINTED_HEIGHT;
  }

  const context = canvas.getContext('2d');

  if (context == null) {
    return null;
  }
  context.clearRect(0, 0, PAINTED_WIDTH, PAINTED_HEIGHT);
  paintBeacon(context, PAINTED_WIDTH / 2, PAINTED_HEIGHT * ORIGIN_Y, beacon, part, now, squash);
  painted.set(key, { canvas, at: now, squash });
  return canvas;
}

/** Where that picture is stamped so its ground point sits on the cell's middle */
export function beaconCorners(
  spot: { x: number; y: number; scale: number },
  magnify: number,
): { x: number; y: number }[] {
  const wide = SPAN_CELLS * CELL * spot.scale * magnify;
  const tall = (wide * PAINTED_HEIGHT) / PAINTED_WIDTH;
  const left = spot.x - wide / 2;
  const top = spot.y - tall * ORIGIN_Y;

  return [
    { x: left, y: top },
    { x: left + wide, y: top },
    { x: left + wide, y: top + tall },
    { x: left, y: top + tall },
  ];
}

/** The same part painted straight onto the board, where there is no batch */
export function drawRaidBeacon(
  context: CanvasRenderingContext2D,
  spot: { x: number; y: number; scale: number },
  beacon: RaidBeacon,
  part: AuraPart,
  now: number,
  magnify: number,
  squash: number,
): void {
  const scale = (CELL * spot.scale * magnify) / PAINTED_CELL;

  context.save();
  context.translate(spot.x, spot.y);
  context.scale(scale, scale);
  // The beam's top is the painted picture's, so it stands as tall here as in the batch
  context.translate(0, -PAINTED_HEIGHT * ORIGIN_Y);
  paintBeacon(context, 0, PAINTED_HEIGHT * ORIGIN_Y, beacon, part, now, squash);
  context.restore();
}
