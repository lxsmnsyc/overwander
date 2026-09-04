/**
 * The kit every move's picture is drawn with.
 *
 * Nothing here loads anything. A move is a handful of shapes on the
 * 2D context — a ring going out, a bolt between two bodies, a scatter
 * of motes — coloured by the move's own type and timed off the share
 * of the phase that has passed. That is deliberate: the sheets under
 * `public/sprites/effects` were drawn for another game's move list,
 * and dressing a Gen 1 move in the nearest one is a picture of
 * something else. A ring in Grass green is at least honestly this
 * move.
 *
 * Two rules hold the kit together.
 *
 * **Everything is a function of `share`.** A painter is handed how far
 * through its phase it is, from 0 to 1, and draws that instant. It
 * keeps no state, so the same instant is always the same picture — a
 * battle stepped frame by frame draws exactly what it drew live.
 *
 * **Nothing is random per frame.** Scatter comes from `noise`, which
 * is a hash of a seed and an index: the fifth mote is always in the
 * same place, so a scatter drifts rather than boiling.
 */

import type { Point } from '../stage';

/**
 * A stable pseudo-random value from 0 to 1.
 *
 * A hash rather than a generator: the caller asks for "the third
 * spark of seed 12" and gets the same answer every frame, which is
 * what stops a scatter boiling as it is redrawn
 */
export function noise(seed: number, index: number): number {
  const mixed = Math.sin(seed * 127.1 + index * 311.7) * 43_758.545;

  return mixed - Math.floor(mixed);
}

/** The same, from -1 to 1, for offsets either side of a point. */
export function spread(seed: number, index: number): number {
  return noise(seed, index) * 2 - 1;
}

/** A colour with an alpha, from a `#rrggbb` string. */
export function fade(color: string, alpha: number): string {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * A lighter version of a colour, for the hot middle of anything: a
 * flame's core, a bolt's centre, the head of a beam
 */
/**
 * One colour moved partway toward another. Both are `#rrggbb`, and so
 * is what comes back, so a mixed colour can still be faded
 */
export function mix(color: string, toward: string, amount: number): string {
  const part = (at: number): string => {
    const from = Number.parseInt(color.slice(at, at + 2), 16);
    const to = Number.parseInt(toward.slice(at, at + 2), 16);

    return Math.round(from + (to - from) * amount)
      .toString(16)
      .padStart(2, '0');
  };

  return `#${part(1)}${part(3)}${part(5)}`;
}

export function lighten(color: string, amount: number): string {
  const toward = (at: number): string => {
    const value = Number.parseInt(color.slice(at, at + 2), 16);

    return Math.round(value + (255 - value) * amount)
      .toString(16)
      .padStart(2, '0');
  };

  // Hex out as well as in, so a lightened colour can still be faded:
  // everything here takes `#rrggbb`
  return `#${toward(1)}${toward(3)}${toward(5)}`;
}

/** A point some fraction of the way from one place to another. */
export function between(from: Point, to: Point, share: number): Point {
  return [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share];
}

/** Rises to one at the middle of the phase and falls back to nothing. */
export function swell(share: number): number {
  return Math.sin(Math.PI * Math.max(0, Math.min(1, share)));
}

/** Full at the start and gone by the end. */
export function decay(share: number): number {
  return Math.max(0, 1 - share);
}

export interface Painted {
  color: string;
  alpha?: number;
  /** How thick a stroked shape is drawn, in canvas pixels. */
  width?: number;
}

/** A ring going out: a shockwave, a pulse, a sound. */
export function ring(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  painted: Painted,
): void {
  context.beginPath();
  context.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2;
  context.stroke();
}

/**
 * The same ring lying on the ground rather than facing the camera.
 * The field is drawn in perspective, so anything spreading along the
 * floor is flatter than it is wide
 */
export function ripple(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  painted: Painted,
): void {
  context.beginPath();
  context.ellipse(x, y, radius, radius * 0.34, 0, 0, Math.PI * 2);
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2;
  context.stroke();
}

/** A solid ball of light: a core, an orb, a charge gathering. */
export function orb(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  painted: Painted,
): void {
  const glow = context.createRadialGradient(x, y, 0, x, y, Math.max(0.1, radius));

  glow.addColorStop(0, fade(lighten(painted.color, 0.75), painted.alpha ?? 1));
  glow.addColorStop(0.45, fade(painted.color, (painted.alpha ?? 1) * 0.85));
  glow.addColorStop(1, fade(painted.color, 0));
  context.beginPath();
  context.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
  context.fillStyle = glow;
  context.fill();
}

/**
 * A bubble: a thin shell with a highlight off its upper left, which is
 * the only thing that separates one from a plain ring at this size
 */
export function bubble(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  painted: Painted,
): void {
  const alpha = painted.alpha ?? 1;

  context.beginPath();
  context.ellipse(x, y, radius, radius, 0, 0, Math.PI * 2);
  context.fillStyle = fade(painted.color, alpha * 0.22);
  context.fill();
  context.strokeStyle = fade(painted.color, alpha);
  context.lineWidth = painted.width ?? 1.6;
  context.stroke();
  context.beginPath();
  context.ellipse(
    x - radius * 0.34,
    y - radius * 0.34,
    Math.max(0.4, radius * 0.22),
    Math.max(0.4, radius * 0.22),
    0,
    0,
    Math.PI * 2,
  );
  context.fillStyle = fade(lighten(painted.color, 0.85), alpha);
  context.fill();
}

/**
 * A bone: a shaft with a knob on each end, drawn at an angle so it can
 * be tumbled through a phase
 */
export function bone(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  length: number,
  angle: number,
  painted: Painted,
): void {
  const reach = length / 2;
  const knob = Math.max(1, length * 0.16);
  const ends: Point[] = [
    [x + Math.cos(angle) * reach, y + Math.sin(angle) * reach],
    [x - Math.cos(angle) * reach, y - Math.sin(angle) * reach],
  ];

  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 3;
  context.beginPath();
  context.moveTo(ends[0][0], ends[0][1]);
  context.lineTo(ends[1][0], ends[1][1]);
  context.stroke();
  context.fillStyle = fade(lighten(painted.color, 0.5), painted.alpha ?? 1);
  for (const [endX, endY] of ends) {
    context.beginPath();
    context.ellipse(endX, endY, knob, knob, 0, 0, Math.PI * 2);
    context.fill();
  }
}

/** Spokes thrown out of a point: an impact, a flash, a hit landing. */
export function burst(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  spokes: number,
  seed: number,
  painted: Painted,
): void {
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2;
  context.beginPath();
  for (let spoke = 0; spoke < spokes; spoke += 1) {
    const angle = (spoke / spokes) * Math.PI * 2 + noise(seed, spoke) * 0.4;
    const length = radius * (0.55 + noise(seed, spoke + 90) * 0.45);

    context.moveTo(x + Math.cos(angle) * radius * 0.2, y + Math.sin(angle) * radius * 0.2);
    context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
  }
  context.stroke();
}

/**
 * A scatter of small round things around a point: embers, spores,
 * droplets, dust. They drift outward and upward over the phase
 */
export function motes(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  count: number,
  seed: number,
  share: number,
  painted: Painted,
): void {
  context.fillStyle = fade(painted.color, painted.alpha ?? 1);
  for (let mote = 0; mote < count; mote += 1) {
    const angle = noise(seed, mote) * Math.PI * 2;
    const reach = radius * (0.3 + noise(seed, mote + 40) * 0.7) * (0.4 + share);
    const size = (painted.width ?? 2) * (0.6 + noise(seed, mote + 80) * 0.8);

    context.beginPath();
    context.ellipse(
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach - share * radius * 0.5,
      size,
      size,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}

/**
 * A jagged line between two points: lightning, a crack, anything that
 * arrives all at once
 */
export function bolt(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  seed: number,
  painted: Painted,
): void {
  const steps = 8;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const wander = Math.max(4, length * 0.09);

  context.beginPath();
  context.moveTo(from[0], from[1]);
  for (let step = 1; step <= steps; step += 1) {
    const share = step / steps;
    const [x, y] = between(from, to, share);
    // Straight at both ends and loose in the middle, which is what
    // keeps a bolt attached to the two things it is between
    const off = spread(seed, step) * wander * Math.sin(Math.PI * share);

    context.lineTo(x - (dy / length) * off, y + (dx / length) * off);
  }
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2;
  context.stroke();
}

/**
 * A beam from one point to another, with a hot middle. `share` is how
 * far along it has reached, so a beam can be drawn arriving
 */
export function beam(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  reach: number,
  width: number,
  painted: Painted,
): void {
  const head = between(from, to, Math.max(0, Math.min(1, reach)));
  const alpha = painted.alpha ?? 1;
  const line = context.createLinearGradient(from[0], from[1], head[0], head[1]);

  line.addColorStop(0, fade(painted.color, alpha * 0.5));
  line.addColorStop(0.5, fade(lighten(painted.color, 0.5), alpha));
  line.addColorStop(1, fade(lighten(painted.color, 0.85), alpha));
  context.strokeStyle = line;
  context.lineCap = 'round';
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(from[0], from[1]);
  context.lineTo(head[0], head[1]);
  context.stroke();
  // A white core down the middle: a beam of one colour reads as a
  // painted stripe rather than as light
  context.strokeStyle = fade(lighten(painted.color, 0.9), alpha * 0.9);
  context.lineWidth = Math.max(1, width * 0.35);
  context.stroke();
  context.lineCap = 'butt';
}

/** A curved cut through a point: a claw, a blade, a gust. */
export function slash(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  angle: number,
  painted: Painted,
): void {
  context.beginPath();
  context.ellipse(x, y, radius, radius * 0.75, angle, -0.9, 0.9);
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 3;
  context.lineCap = 'round';
  context.stroke();
  context.lineCap = 'butt';
}

/** Shards thrown out of a point: rock, ice, anything that breaks. */
export function shards(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  count: number,
  seed: number,
  share: number,
  painted: Painted,
): void {
  context.fillStyle = fade(painted.color, painted.alpha ?? 1);
  for (let shard = 0; shard < count; shard += 1) {
    const angle = noise(seed, shard) * Math.PI * 2;
    const reach = radius * (0.4 + noise(seed, shard + 30) * 0.6) * (0.3 + share * 0.9);
    const size = (painted.width ?? 3) * (0.8 + noise(seed, shard + 60));
    const turn = angle + share * 3;

    context.save();
    context.translate(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
    context.rotate(turn);
    context.beginPath();
    context.moveTo(-size, size * 0.6);
    context.lineTo(0, -size);
    context.lineTo(size, size * 0.6);
    context.closePath();
    context.fill();
    context.restore();
  }
}

/** A heart, for the one status that wants one. */
export function heart(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  painted: Painted,
): void {
  context.beginPath();
  context.moveTo(x, y + size * 0.7);
  context.bezierCurveTo(
    x - size * 1.4,
    y - size * 0.4,
    x - size * 0.4,
    y - size * 1.2,
    x,
    y - size * 0.35,
  );
  context.bezierCurveTo(
    x + size * 0.4,
    y - size * 1.2,
    x + size * 1.4,
    y - size * 0.4,
    x,
    y + size * 0.7,
  );
  context.fillStyle = fade(painted.color, painted.alpha ?? 1);
  context.fill();
}

/** A five-pointed star, for the marks that want one. */
export function star(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  painted: Painted,
): void {
  context.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = turn + (point / 10) * Math.PI * 2;
    const reach = point % 2 === 0 ? size : size * 0.42;

    context[point === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach,
    );
  }
  context.closePath();
  context.fillStyle = fade(painted.color, painted.alpha ?? 1);
  context.fill();
}

/**
 * A flat pane standing over a point: a screen, a wall of glass. The
 * top edge is drawn shorter than the foot, which is what makes it
 * stand in the field rather than lie across the lens
 */
export function pane(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  width: number,
  height: number,
  painted: Painted,
): void {
  const top = width * 0.86;

  context.beginPath();
  context.moveTo(x - top, y - height);
  context.lineTo(x + top, y - height);
  context.lineTo(x + width, y);
  context.lineTo(x - width, y);
  context.closePath();
  context.fillStyle = fade(painted.color, (painted.alpha ?? 1) * 0.3);
  context.fill();
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2;
  context.stroke();
}

/**
 * Chevrons running up a line, for anything rising: a stat going up, a
 * pokemon getting quicker. `way` turns the whole thing over, points
 * and travel together, for the things that fall
 */
export function chevrons(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  count: number,
  share: number,
  painted: Painted,
  way: 1 | -1 = 1,
): void {
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2;
  context.lineCap = 'round';
  for (let mark = 0; mark < count; mark += 1) {
    const held = (share * 1.4 + mark / count) % 1;
    const at = y + (size - held * size * 2) * way;

    context.beginPath();
    context.moveTo(x - size * 0.5, at + size * 0.3 * way);
    context.lineTo(x, at);
    context.lineTo(x + size * 0.5, at + size * 0.3 * way);
    context.stroke();
  }
  context.lineCap = 'butt';
}

/**
 * A spiral winding inward, for the moves whose whole picture is that:
 * a hypnosis, a confusion, anything that turns
 */
export function spiral(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turns: number,
  share: number,
  painted: Painted,
): void {
  const steps = 48;

  context.beginPath();
  for (let step = 0; step <= steps; step += 1) {
    const along = step / steps;
    const angle = along * Math.PI * 2 * turns + share * Math.PI * 2;
    const reach = radius * (1 - along * 0.92);
    const at: Point = [x + Math.cos(angle) * reach, y + Math.sin(angle) * reach * 0.6];

    context[step === 0 ? 'moveTo' : 'lineTo'](at[0], at[1]);
  }
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2;
  context.stroke();
}

/**
 * A whipping line from one point to another, bowed to one side: a
 * vine, a tail, anything that lashes rather than flies
 */
export function lash(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  bow: number,
  painted: Painted,
): void {
  const middle: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.max(1, Math.hypot(dx, dy));

  context.beginPath();
  context.moveTo(from[0], from[1]);
  context.quadraticCurveTo(
    middle[0] - (dy / length) * bow,
    middle[1] + (dx / length) * bow,
    to[0],
    to[1],
  );
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 3;
  context.lineCap = 'round';
  context.stroke();
  context.lineCap = 'butt';
}

/**
 * A wedge closing on a point, as one half of a bite. Two of them
 * facing each other is a mouth
 */
export function jaw(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  angle: number,
  painted: Painted,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.beginPath();
  for (let tooth = 0; tooth < 4; tooth += 1) {
    const along = -radius + (tooth / 3) * radius * 2;

    context.moveTo(along, -radius * 0.55);
    context.lineTo(along + radius * 0.16, 0);
    context.lineTo(along + radius * 0.32, -radius * 0.55);
  }
  context.strokeStyle = fade(painted.color, painted.alpha ?? 1);
  context.lineWidth = painted.width ?? 2.5;
  context.stroke();
  context.restore();
}
