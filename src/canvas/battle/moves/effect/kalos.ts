import { Types } from '../../../../data/constants/types';
import type { Point } from '../../stage';
import {
  beam,
  between,
  burst,
  decay,
  edge,
  fade,
  heart,
  late,
  lighten,
  mix,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  shards,
  spiral,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { showing } from './stats';

/** Thousand Arrows: the share at which the volley turns and starts coming down */
export const ARROWS_LAND = 0.4;

/** Dragon Ascent: the share it has climbed by, and the share it lands at */
export const ASCENT_RISES = 0.15;
export const ASCENT_LANDS = 0.45;

/** Hyperspace Hole and Fury: the share the ring has opened by */
export const PORTAL_OPEN = 0.3;

/** Moonblast: the share the moon hangs before it comes down */
export const LUNAR_FALLS = 0.4;

/** Origin Pulse: the share the caster stops gathering, and the share the beams land */
export const ORIGIN_FIRE = 0.25;
export const ORIGIN_HIT = 0.5;

/** Light of Ruin: the share the flower has gathered its light by */
export const RUIN_FIRE = 0.28;

/** Oblivion Wing: the share the wings have opened by */
export const OBLIVION_FIRE = 0.2;

/** Precipice Blades: the share the ground has split by */
export const PRECIPICE_SPLIT = 0.2;

/** Thousand Waves: the share the wave breaks over it */
export const SWELL_BREAKS = 0.5;

/** Diamond Storm: the share the storm flies apart */
export const DIAMONDS_BREAK = 0.72;

/** Steam Eruption: the share the ground has cracked by */
export const STEAM_BURST = 0.18;

/** Geomancy: the colours of the light the ground gives up */
export const GEO_TONES = ['#ff8fb4', '#ffd27a', '#8fe0b0', '#8cc8ff'];

/** Precipice Blades: the magma between the blades */
export const MAGMA = '#ff5a2a';

/** Diamond Storm: the glint off a cut face */
const GLINT = '#ffffff';

/** A four-pointed sparkle, the fairy type's own mark */
function twinkle(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  for (let point = 0; point < 8; point += 1) {
    const angle = turn + (point / 8) * Math.PI * 2;
    const reach = point % 2 === 0 ? size : size * 0.22;

    context[point === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach,
    );
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A diamond: four points, taller than it is wide */
function diamond(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  const corners: Point[] = [
    [0, -size],
    [size * 0.62, 0],
    [0, size],
    [-size * 0.62, 0],
  ];

  context.beginPath();
  for (const [at, [dx, dy]] of corners.entries()) {
    const cx = x + dx * Math.cos(turn) - dy * Math.sin(turn);
    const cy = y + dx * Math.sin(turn) + dy * Math.cos(turn);

    context[at === 0 ? 'moveTo' : 'lineTo'](cx, cy);
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** An arrow along a line, head at `to` */
function arrow(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  width: number,
  color: string,
  alpha: number,
): void {
  edge(context, from, to, width, 0, { color, alpha });

  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const head = width * 3;

  context.beginPath();
  context.moveTo(to[0], to[1]);
  context.lineTo(to[0] - Math.cos(angle - 0.5) * head, to[1] - Math.sin(angle - 0.5) * head);
  context.lineTo(to[0] - Math.cos(angle + 0.5) * head, to[1] - Math.sin(angle + 0.5) * head);
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A ring standing open in the air, dark inside with a bright rim */
function portal(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, radius, radius * 0.9, 0, 0, Math.PI * 2);
  context.fillStyle = fade('#140a24', alpha * 0.85);
  context.fill();
  ring(context, [x, y], radius, { color: lighten(color, 0.4), alpha, width: 3 * scale });
}

const kalos = {
  // Sparkles flung out of a soft glow, each one twinkling as it goes
  Sparkle(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const count = many(7, weight);

    orb(context, at, size * (0.5 + swell(share) * 0.6), { ...paint, alpha: decay(share) * 0.8 });
    for (let glint = 0; glint < count; glint += 1) {
      const angle = (glint / count) * Math.PI * 2 + spread(seed, glint) * 0.5;
      const out = size * (0.4 + share * (1.4 + noise(seed, glint) * 0.8));
      const blink = swell((share * 2 + noise(seed, glint + 9)) % 1);

      twinkle(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        size * 0.4 * blink,
        share * 1.5,
        light,
        decay(share),
      );
    }
  },

  // Columns of light in every colour rising out of the ground round it, and a halo over it
  Geo(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = showing(share, 4, 0.7);
    const rise = Math.min(1, share * 2.5);
    const foot: Point = [at[0], at[1] + size * 0.9];
    const columns = many(8, weight);

    for (const [tone, color] of GEO_TONES.entries()) {
      ripple(context, foot, size * (0.8 + tone * 0.45 + swell(share) * 1.2), {
        color,
        alpha: shown * 0.6,
        width: 2.4 * stage.scale,
      });
    }
    for (let column = 0; column < columns; column += 1) {
      const angle = (column / columns) * Math.PI * 2 + share * 1.5;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 1.8,
        foot[1] + Math.sin(angle) * size * 0.5,
      ];

      beam(
        context,
        base,
        [base[0], base[1] - size * (3 + noise(seed, column) * 2.5)],
        rise,
        size * 0.3,
        { color: GEO_TONES[column % GEO_TONES.length], alpha: shown * 0.8 },
      );
    }
    for (let mote = 0; mote < many(18, weight); mote += 1) {
      const held = (share * 1.6 + noise(seed, mote)) % 1;

      twinkle(
        context,
        [at[0] + spread(seed, mote + 3) * size * 2, foot[1] - held * size * 5],
        size * 0.26 * swell(held),
        held * 2,
        GEO_TONES[mote % GEO_TONES.length],
        shown,
      );
    }
    ripple(context, [at[0], at[1] - size * 1.4], size * 0.9, {
      color: '#fff4fa',
      alpha: shown * 0.8,
      width: 2.4 * stage.scale,
    });
    orb(context, at, size * (0.9 + swell(share) * 0.8), { color: '#fff4fa', alpha: shown * 0.5 });
    twinkle(context, at, size * 2.2 * swell(share), share * 2, '#ffffff', shown * 0.5);
  },

  // The whole floor lighting up from the pokemon outward, and the terrain's own stuff rising off it
  Terrain(context, stage, share, { paint, seed, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.65);
    const light = lighten(paint.color, 0.45);
    const foot: Point = [at[0], at[1] + size * 0.9];

    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, share * 1.4 - wave * 0.18));

      ripple(context, foot, size * (1 + held * 7), {
        ...paint,
        alpha: decay(held) * shown * 0.7,
        width: 3 * stage.scale,
      });
    }
    for (let rising = 0; rising < 18; rising += 1) {
      const rise = (share * 1.3 + noise(seed, rising)) % 1;
      const spot: Point = [
        at[0] + spread(seed, rising + 30) * size * 7,
        foot[1] + spread(seed, rising + 60) * size * 1.2 - rise * size * 2.2,
      ];
      const alpha = swell(rise) * shown;

      if (type === Types.Grass) {
        petal(context, spot, size * 0.3, rise * 4 + rising, { color: light, alpha });
      } else if (type === Types.Electric) {
        edge(
          context,
          spot,
          [spot[0] + spread(seed, rising + 90) * size * 0.4, spot[1] - size * 0.4],
          size * 0.07,
          0,
          { color: light, alpha },
        );
      } else {
        orb(context, spot, size * 0.35 * (0.6 + rise), { color: light, alpha: alpha * 0.5 });
      }
    }
  },

  // A volley of arrows loosed skyward off the caster, then raining down all round it and sticking in the ground
  Arrows(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const count = many(16, weight);
    const light = lighten(paint.color, 0.35);
    const foot = at[1] + size * 0.9;

    if (share < ARROWS_LAND) {
      const rise = share / ARROWS_LAND;
      const home: Point = [stage.source[0], stage.source[1] + size * 0.9];

      ripple(context, home, size * (0.8 + rise * 1.6), {
        ...paint,
        alpha: decay(rise) * 0.7,
        width: 2.6 * stage.scale,
      });
      for (let shaft = 0; shaft < count; shaft += 1) {
        const lift = Math.min(1, rise * (1.2 + noise(seed, shaft) * 0.6));
        const tip: Point = [
          home[0] + spread(seed, shaft) * size * 1.8,
          home[1] - size * (0.5 + lift * 8),
        ];

        arrow(context, [tip[0], tip[1] + size * 1.4], tip, size * 0.07, light, 1);
      }
      return;
    }
    const rain = (share - ARROWS_LAND) / (1 - ARROWS_LAND);

    for (let shaft = 0; shaft < count; shaft += 1) {
      const lands = 0.15 + noise(seed, shaft + 20) * 0.4;
      const fall = (rain - lands + 0.15) / 0.15;
      const spot: Point = [
        at[0] + spread(seed, shaft + 60) * size * 2.8,
        foot + spread(seed, shaft + 80) * size * 0.6,
      ];

      if (fall <= 0) {
        continue;
      }
      if (fall < 1) {
        const tip: Point = [spot[0], spot[1] - size * 7 * (1 - fall)];

        arrow(context, [tip[0], tip[1] - size * 1.4], tip, size * 0.07, light, 1);
        continue;
      }
      const after = (rain - lands) / (1 - lands);

      // The arrow stays standing where it struck
      edge(context, spot, [spot[0], spot[1] - size * 0.7], size * 0.1, 0, {
        ...paint,
        alpha: late(after, 0.6),
      });
      if (after < 0.3) {
        ripple(context, spot, size * (0.2 + after * 2), {
          color: light,
          alpha: decay(after / 0.3) * 0.8,
          width: 2 * stage.scale,
        });
      }
    }
    const hit = Math.max(0, (rain - 0.5) / 0.5);

    if (hit > 0) {
      shards(context, at, size * 2, many(10, weight), seed, hit, { ...paint, alpha: decay(hit) });
      ripple(context, [at[0], foot], size * (1 + hit * 2.6), {
        ...paint,
        alpha: decay(hit) * 0.8,
        width: 3 * stage.scale,
      });
    }
  },

  // A wall of earth rolling in from the caster's side, breaking over it and leaving a ring of rock round it
  Groundswell(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dark = mix(paint.color, '#3a2a1a', 0.35);
    const dust = mix(paint.color, '#d8c8a8', 0.5);
    const foot = at[1] + size * 0.9;

    if (share < SWELL_BREAKS) {
      const rolled = share / SWELL_BREAKS;
      const front = stage.source[0] + (at[0] - stage.source[0]) * rolled;
      const crest = Math.min(1, rolled * 1.6);

      context.beginPath();
      context.moveTo(front - size * 2.6, foot);
      context.quadraticCurveTo(front, foot - size * 5 * crest, front + size * 2.6, foot);
      context.closePath();
      context.fillStyle = fade(dark, 1);
      context.fill();
      for (let clod = 0; clod < many(10, weight); clod += 1) {
        orb(
          context,
          [
            front + spread(seed, clod) * size * 2,
            foot - size * 2.2 * crest * noise(seed, clod + 5),
          ],
          size * 0.35,
          { color: dust, alpha: 0.6 },
        );
      }
      return;
    }
    const hit = (share - SWELL_BREAKS) / (1 - SWELL_BREAKS);
    const kept = late(hit, 0.5);
    const rocks = many(12, weight);

    for (let rock = 0; rock < rocks; rock += 1) {
      const angle = (rock / rocks) * Math.PI * 2 + noise(seed, rock) * 0.3;
      const base: Point = [
        at[0] + Math.cos(angle) * size * 1.9,
        foot + Math.sin(angle) * size * 0.6,
      ];

      edge(
        context,
        base,
        [base[0], base[1] - size * (0.8 + noise(seed, rock + 10) * 0.8) * Math.min(1, hit * 4)],
        size * 0.5,
        0,
        { color: dark, alpha: kept },
      );
    }
    shards(context, at, size * 2.4, many(12, weight), seed, hit, {
      color: dark,
      alpha: decay(hit),
    });
    motes(context, [at[0], foot], size * 3, 10, seed, hit, {
      color: dust,
      alpha: decay(hit) * 0.7,
      width: size * 0.3,
    });
    ripple(context, [at[0], foot], size * (1 + hit * 2.6), {
      ...paint,
      alpha: decay(hit) * 0.7,
      width: 3 * stage.scale,
    });
  },

  // The ground splitting over magma, then a crown of stone blades driven up round it and embers pouring off
  Precipice(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const split = Math.min(1, share / PRECIPICE_SPLIT);
    const kept = late(share, 0.6);
    const foot = at[1] + size * 0.9;
    const hot = mix(MAGMA, '#ffd84a', 0.5);

    ripple(context, [at[0], foot], size * (0.8 + split * 2), {
      color: MAGMA,
      alpha: kept * 0.8,
      width: 4 * stage.scale,
    });
    if (share < PRECIPICE_SPLIT) {
      return;
    }
    const rise = (share - PRECIPICE_SPLIT) / (1 - PRECIPICE_SPLIT);
    const grow = Math.min(1, rise * 5);
    const blades = many(11, weight);

    orb(context, [at[0], foot - size], size * 2.4 * grow, { color: MAGMA, alpha: kept * 0.4 });
    for (let blade = 0; blade < blades; blade += 1) {
      const angle = (blade / blades) * Math.PI * 2 + noise(seed, blade) * 0.5;
      const round = size * (0.9 + noise(seed, blade + 30) * 1.3);
      const base: Point = [at[0] + Math.cos(angle) * round, foot + Math.sin(angle) * round * 0.35];
      const tall =
        size *
        (2 + noise(seed, blade + 10) * 2.4) *
        Math.min(1, grow * (1 + noise(seed, blade + 40)));
      const lean = spread(seed, blade + 20) * size * 0.5 + Math.cos(angle) * size * 0.4;

      edge(context, base, [base[0] + lean, base[1] - tall], size * 0.42, 0, {
        ...paint,
        alpha: kept,
      });
      edge(context, base, [base[0] + lean * 0.7, base[1] - tall * 0.7], size * 0.12, 0, {
        color: hot,
        alpha: kept * 0.9,
      });
    }
    motes(context, [at[0], foot - size], size * 3, many(12, weight), seed, rise, {
      color: hot,
      alpha: kept,
      width: 2 * stage.scale,
    });
    shards(context, [at[0], foot], size * 2.4, many(10, weight), seed, rise, {
      color: mix(paint.color, '#5b4636', 0.5),
      alpha: late(rise, 0.7),
      width: 2.6 * stage.scale,
    });
  },

  // Soaring up off the caster in green light, then diving down on it as a comet and a pillar of light
  Ascent(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const foot = at[1] + size * 0.9;

    if (share < ASCENT_RISES) {
      const up = share / ASCENT_RISES;
      const head: Point = [stage.source[0], stage.source[1] - size * 8 * up * up];

      orb(context, stage.source, size * 1.2, { ...paint, alpha: decay(up) * 0.6 });
      edge(context, stage.source, head, size * 0.5, 0, { ...paint, alpha: 0.6 });
      edge(context, stage.source, head, size * 0.18, 0, { color: light, alpha: 1 });
      return;
    }
    if (share < ASCENT_LANDS) {
      const fall = (share - ASCENT_RISES) / (ASCENT_LANDS - ASCENT_RISES);
      const place = (along: number): Point => [
        at[0] - size * 3 * (1 - along),
        at[1] - size * 9 * (1 - along) ** 1.5,
      ];
      const head = place(fall);
      const tail = place(Math.max(0, fall - 0.35));

      edge(context, tail, head, size * 1.1, 0, { ...paint, alpha: 0.55 });
      edge(context, tail, head, size * 0.4, 0, { color: light, alpha: 1 });
      orb(context, head, size * (0.8 + fall * 0.6), { color: light, alpha: 1 });
      return;
    }
    const hit = (share - ASCENT_LANDS) / (1 - ASCENT_LANDS);

    beam(context, [at[0], foot], [at[0], foot - size * 7], 1, size * 1.8 * decay(hit), {
      ...paint,
      alpha: decay(hit),
    });
    orb(context, at, size * (1 + hit * 1.8), {
      color: light,
      alpha: decay(Math.min(1, hit * 1.5)),
    });
    twinkle(context, at, size * (1.4 + hit * 2), 0, '#ffffff', decay(Math.min(1, hit * 3)));
    ring(context, at, size * (0.6 + hit * 3.2), {
      color: light,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    ripple(context, [at[0], foot], size * (0.8 + hit * 3), {
      ...paint,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    burst(context, at, size * (2 + hit * 2), 14, seed, {
      ...paint,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
  },

  // A ring of holes opening round it, a fist out of each in turn, and one last blow out of all of them
  Fury(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const count = many(7, weight);
    const open = Math.min(1, share / PORTAL_OPEN);
    const closing = decay(Math.max(0, share - 0.82) / 0.18);
    const light = lighten(paint.color, 0.5);

    for (let hole = 0; hole < count; hole += 1) {
      const angle = (hole / count) * Math.PI * 2 + noise(seed, hole) * 0.4;
      const spot: Point = [
        at[0] + Math.cos(angle) * size * 2.4,
        at[1] + Math.sin(angle) * size * 1.8 - size * 0.4,
      ];
      const start = PORTAL_OPEN + (hole / count) * 0.42;
      const blow = (share - start) / 0.1;
      const impact = (share - start - 0.1) / 0.12;

      portal(context, spot, size * 0.7 * open * closing, paint.color, closing, stage.scale);
      if (blow > 0 && blow < 1) {
        const fist = between(spot, at, blow);

        edge(context, spot, fist, size * 0.4, 0, { ...paint, alpha: 0.8 });
        orb(context, fist, size * 0.45, { color: light, alpha: 1 });
      }
      if (impact >= 0 && impact < 1) {
        twinkle(context, at, size * (0.8 + impact * 1.2), hole, '#ffffff', decay(impact));
        burst(context, at, size * 1.4, 8, seed + hole, {
          color: light,
          alpha: decay(impact),
          width: 2.6 * stage.scale,
        });
      }
    }
    const last = (share - 0.82) / 0.18;

    if (last > 0) {
      orb(context, at, size * (1 + last * 1.6), { color: light, alpha: decay(last) });
      ring(context, at, size * (0.8 + last * 3), {
        ...paint,
        alpha: decay(last),
        width: 3.4 * stage.scale,
      });
    }
  },

  // A great ring opening beside it and swallowing light, a blast out of it, and the ring snapping shut
  Portal(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const spot: Point = [at[0] - size * 2.2, at[1] - size * 1.6];
    const open = Math.min(1, share / PORTAL_OPEN);
    const closing = decay(Math.max(0, share - 0.72) / 0.28);
    const radius = size * 1.3 * open * closing;
    const light = lighten(paint.color, 0.5);

    orb(context, spot, radius * 1.6, { ...paint, alpha: closing * 0.3 });
    portal(context, spot, radius, paint.color, closing, stage.scale);
    for (let glint = 0; glint < 10; glint += 1) {
      const angle = (glint / 10) * Math.PI * 2 + share * 9;

      twinkle(
        context,
        [spot[0] + Math.cos(angle) * radius, spot[1] + Math.sin(angle) * radius * 0.9],
        size * 0.2,
        angle,
        light,
        closing * open,
      );
    }
    if (share > 0.9) {
      const snap = (share - 0.9) / 0.1;

      twinkle(context, spot, size * 1.4 * swell(snap), 0, light, swell(snap));
    }
    if (share < PORTAL_OPEN) {
      return;
    }
    const strike = Math.min(1, (share - PORTAL_OPEN) / 0.12);
    const kept = late((share - PORTAL_OPEN) / (1 - PORTAL_OPEN), 0.4);

    beam(context, spot, at, strike, size * kept, { ...paint, alpha: kept });
    if (strike < 1) {
      return;
    }
    const hit = (share - PORTAL_OPEN - 0.12) / (1 - PORTAL_OPEN - 0.12);

    orb(context, at, size * (0.9 + hit * 1.4), { color: light, alpha: decay(hit) });
    twinkle(context, at, size * (1.4 + hit * 2), hit, '#ffffff', decay(Math.min(1, hit * 2.5)));
    ring(context, at, size * (0.6 + hit * 2.6), {
      color: light,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    burst(context, at, size * (1.4 + hit * 1.4), 12, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.8 * stage.scale,
    });
  },

  // A dust cloud tumbling over it, stars and hearts popping out of the scuffle
  Scuffle(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = showing(share, 5, 0.7);

    for (let puff = 0; puff < 7; puff += 1) {
      const turn = share * 5 + (puff / 7) * Math.PI * 2;

      orb(
        context,
        [at[0] + Math.cos(turn) * size * 0.9, at[1] + Math.sin(turn) * size * 0.6],
        size * (0.6 + noise(seed, puff) * 0.4),
        { color: '#f2e6ee', alpha: shown * 0.55 },
      );
    }
    for (let pop = 0; pop < many(6, weight); pop += 1) {
      const held = (share * 2.2 + noise(seed, pop + 7)) % 1;
      const angle = spread(seed, pop) * Math.PI;
      const spot: Point = [
        at[0] + Math.cos(angle) * size * (0.8 + held * 1.2),
        at[1] - size * 0.4 - held * size * 1.4,
      ];

      if (pop % 2 === 0) {
        star(context, spot, size * 0.3, held * 3, { ...paint, alpha: decay(held) * shown });
      } else {
        heart(context, spot, size * 0.24, { ...paint, alpha: decay(held) * shown });
      }
    }
  },

  // A whirlwind of diamonds climbing round it, glinting, then the whole storm flying apart
  Diamonds(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = showing(share, 4, DIAMONDS_BREAK);
    const count = many(18, weight);
    const broken = Math.max(0, (share - DIAMONDS_BREAK) / (1 - DIAMONDS_BREAK));
    const foot = at[1] + size * 0.9;

    for (let stone = 0; stone < count; stone += 1) {
      const glint = swell((share * 3 + noise(seed, stone + 5)) % 1);
      let spot: Point;
      let alpha = shown;

      if (broken > 0) {
        const angle = noise(seed, stone) * Math.PI * 2;
        const out = size * (1 + broken * 3 * (0.4 + noise(seed, stone + 40) * 0.6));

        spot = [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7];
        alpha = decay(broken);
      } else {
        const climb = (share * 1.4 + noise(seed, stone)) % 1;
        const angle = share * 9 + (stone / count) * Math.PI * 2;
        const out = size * (0.7 + climb * 1.4);

        spot = [
          at[0] + Math.cos(angle) * out,
          foot - climb * size * 4.5 + Math.sin(angle) * out * 0.3,
        ];
      }
      diamond(context, spot, size * 0.36, stone + share * 8, paint.color, alpha);
      twinkle(context, spot, size * 0.4 * glint, 0, GLINT, alpha * glint);
    }
    if (broken > 0) {
      twinkle(context, at, size * 3 * decay(broken), broken, GLINT, decay(broken));
    }
  },

  // Crimson wings spread over the caster, a twisting beam out of them, and the life it took streaming back
  Oblivion(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dark = mix(paint.color, '#1a0610', 0.55);
    const pale = lighten(paint.color, 0.55);
    const open = Math.min(1, share / OBLIVION_FIRE);
    const wings = late(share, 0.55);

    for (const side of [-1, 1]) {
      const tip: Point = [stage.source[0] + side * size * 2.4 * open, stage.source[1] - size * 1.2];

      edge(context, stage.source, tip, size * 0.9 * open, side * size * 0.8, {
        color: dark,
        alpha: wings,
      });
      edge(context, stage.source, tip, size * 0.3 * open, side * size * 0.8, {
        ...paint,
        alpha: wings,
      });
    }
    if (share > OBLIVION_FIRE && share < 0.65) {
      const drawn = Math.min(1, (share - OBLIVION_FIRE) / 0.12);
      const kept = share < 0.5 ? 1 : decay((share - 0.5) / 0.15);

      beam(context, stage.source, at, drawn, size * 1.1, { color: dark, alpha: kept * 0.8 });
      beam(context, stage.source, at, drawn, size * 0.5, { ...paint, alpha: kept });
      spiral(context, at, size * 1.8, 3, share * 3, {
        color: pale,
        alpha: kept * 0.7,
        width: 2 * stage.scale,
      });
    }
    if (share < 0.45) {
      return;
    }
    const back = (share - 0.45) / 0.55;

    orb(context, stage.source, size * (0.8 + back * 0.6), { ...paint, alpha: swell(back) * 0.6 });
    for (let mote = 0; mote < many(12, weight); mote += 1) {
      const held = Math.max(0, Math.min(1, back * 1.5 - noise(seed, mote) * 0.5));
      const spot = between(at, stage.source, held);

      orb(
        context,
        [spot[0], spot[1] - Math.sin(Math.PI * held) * size * (1 + noise(seed, mote + 10))],
        size * 0.16,
        {
          color: pale,
          alpha: swell(held),
        },
      );
    }
  },

  // Light gathered in a ring of petals on the caster, then a beam wide enough to swallow it, and a blast
  Ruin(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.7);

    if (share < RUIN_FIRE + 0.1) {
      const charge = Math.min(1, share / RUIN_FIRE);
      const kept = share < RUIN_FIRE ? 1 : decay((share - RUIN_FIRE) / 0.1);
      const round = size * 1.1 * (1.4 - charge * 0.6);

      for (let leaf = 0; leaf < 5; leaf += 1) {
        const angle = (leaf / 5) * Math.PI * 2 + share * 6;

        petal(
          context,
          [stage.source[0] + Math.cos(angle) * round, stage.source[1] + Math.sin(angle) * round],
          size * 0.5,
          angle,
          { ...paint, alpha: kept * charge },
        );
      }
      orb(context, stage.source, size * (0.4 + charge * 1.2), {
        color: light,
        alpha: kept * charge,
      });
    }
    if (share < RUIN_FIRE) {
      return;
    }
    const fired = (share - RUIN_FIRE) / (1 - RUIN_FIRE);
    const drawn = Math.min(1, fired * 6);
    const thick = Math.min(1, fired * 4) * late(fired, 0.6);

    beam(context, stage.source, at, drawn, size * 2.2 * thick, { ...paint, alpha: 0.7 });
    beam(context, stage.source, at, drawn, size * thick, { color: light, alpha: 1 });
    orb(context, stage.source, size * 1.4 * thick, { color: light, alpha: thick * 0.7 });
    if (drawn < 1) {
      return;
    }
    const blast = (fired - 1 / 6) / (5 / 6);

    orb(context, at, size * (1.2 + swell(blast) * 1.4), {
      color: light,
      alpha: Math.max(thick, decay(blast)),
    });
    twinkle(
      context,
      at,
      size * (2 + blast * 2),
      share * 2,
      '#ffffff',
      decay(Math.min(1, blast * 2)),
    );
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, blast * 1.6 - wave * 0.25));

      if (held > 0) {
        ring(context, at, size * (0.8 + held * 3), {
          ...paint,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    burst(context, at, size * (2 + blast * 2), 16, seed, {
      color: light,
      alpha: decay(blast),
      width: 2.6 * stage.scale,
    });
  },

  // The sea gathered on the caster, beams bowing out of it onto the target, and a flood where they land
  Origin(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const foam = lighten(paint.color, 0.55);
    const count = many(8, weight);
    const foot = at[1] + size * 0.9;

    if (share < ORIGIN_HIT) {
      const charge = Math.min(1, share / ORIGIN_FIRE);
      const kept = charge * decay(Math.max(0, share - ORIGIN_FIRE) / (ORIGIN_HIT - ORIGIN_FIRE));

      orb(context, stage.source, size * (0.5 + charge * 0.9), { ...paint, alpha: kept * 0.8 });
      ring(context, stage.source, size * (1.6 - charge * 0.8), {
        color: light,
        alpha: kept * 0.7,
        width: 2.4 * stage.scale,
      });
    }
    const loosed = ORIGIN_FIRE * 0.8;

    if (share > loosed && share < ORIGIN_HIT + 0.15) {
      const drawn = Math.min(1, (share - loosed) / (ORIGIN_HIT - loosed));
      const kept = share < ORIGIN_HIT ? 1 : decay((share - ORIGIN_HIT) / 0.15);

      for (let ray = 0; ray < count; ray += 1) {
        const bend = (ray / (count - 1 || 1) - 0.5) * size * 4;
        const head = between(stage.source, at, Math.min(1, drawn + noise(seed, ray + 5) * 0.1));

        edge(context, stage.source, head, size * 0.4, bend, { ...paint, alpha: kept * 0.5 });
        edge(context, stage.source, head, size * 0.14, bend, { color: light, alpha: kept });
      }
    }
    if (share < ORIGIN_HIT) {
      return;
    }
    const hit = (share - ORIGIN_HIT) / (1 - ORIGIN_HIT);
    const spouts = many(6, weight);

    orb(context, at, size * (1 + hit * 1.6), {
      color: light,
      alpha: decay(Math.min(1, hit * 1.4)),
    });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.5 - wave * 0.25));

      if (held > 0) {
        ripple(context, [at[0], foot], size * (0.8 + held * 3.4), {
          color: foam,
          alpha: decay(held) * 0.9,
          width: 2.8 * stage.scale,
        });
      }
    }
    for (let spout = 0; spout < spouts; spout += 1) {
      const angle = (spout / spouts) * Math.PI * 2 + noise(seed, spout) * 0.4;
      const base: Point = [
        at[0] + Math.cos(angle) * size * 1.8,
        foot + Math.sin(angle) * size * 0.5,
      ];

      beam(
        context,
        base,
        [base[0], base[1] - size * (2.4 + noise(seed, spout + 10) * 2)],
        Math.min(1, hit * 3),
        size * 0.32 * decay(hit),
        { ...paint, alpha: decay(hit) },
      );
    }
    motes(context, at, size * 2.6, many(14, weight), seed, hit, {
      color: foam,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A full moon glowing over it, then coming down on it and bursting
  Lunar(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.75);
    const fall = Math.max(0, (share - LUNAR_FALLS) / 0.15);
    const moon: Point = [at[0], at[1] - size * 2.8 * (1 - Math.min(1, fall))];

    if (fall < 1) {
      const rise = Math.min(1, share / 0.2);

      orb(context, moon, size * 1.4 * rise, { ...paint, alpha: 0.35 * rise });
      orb(context, moon, size * 0.9 * rise, { color: light, alpha: rise });
      return;
    }
    const hit = (share - LUNAR_FALLS - 0.15) / (1 - LUNAR_FALLS - 0.15);

    orb(context, at, size * (0.9 + hit * 1.2), { color: light, alpha: decay(hit) });
    ring(context, at, size * (0.8 + hit * 2.2), {
      ...paint,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let glint = 0; glint < many(8, weight); glint += 1) {
      const angle = (glint / 8) * Math.PI * 2 + spread(seed, glint) * 0.3;
      const out = size * (1 + hit * 2);

      twinkle(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        size * 0.3,
        hit * 2,
        light,
        decay(hit),
      );
    }
  },

  // The ground cracking hot under it, then a geyser of scalding water and billowing steam
  Steam(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = mix(paint.color, '#ffffff', 0.5);
    const crack = Math.min(1, share / STEAM_BURST);
    const kept = late(share, 0.6);
    const foot = at[1] + size * 0.9;

    ripple(context, [at[0], foot], size * (0.6 + crack * 1.8), {
      ...paint,
      alpha: kept * 0.7,
      width: 3 * stage.scale,
    });
    if (share < STEAM_BURST) {
      return;
    }
    const erupt = (share - STEAM_BURST) / (1 - STEAM_BURST);
    const tall = size * 7 * Math.min(1, erupt * 3);

    beam(context, [at[0], foot], [at[0], foot - tall], 1, size * 1.8 * kept, {
      color: hot,
      alpha: kept,
    });
    for (let puff = 0; puff < many(18, weight); puff += 1) {
      const rise = (share * 1.4 + noise(seed, puff)) % 1;

      orb(
        context,
        [at[0] + spread(seed, puff + 4) * size * (0.4 + rise * 2.4), foot - rise * tall],
        size * (0.6 + rise * 1.2),
        { color: '#f4f8fc', alpha: swell(rise) * kept * 0.8 },
      );
    }
    motes(context, [at[0], foot - size * 2], size * 3, many(12, weight), seed, erupt, {
      color: hot,
      alpha: late(erupt, 0.5),
      width: 2 * stage.scale,
    });
  },

  // Spinning stars of water flying in one after another, each splashing where it lands
  Shuriken(context, stage, share, { paint, seed, hits }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const light = lighten(paint.color, 0.5);
    const count = Math.max(2, hits ?? 2);

    for (let thrown = 0; thrown < count; thrown += 1) {
      const start = (thrown / count) * 0.7;
      const flight = (share - start) / 0.18;

      if (flight <= 0) {
        continue;
      }
      if (flight < 1) {
        const from: Point = [stage.source[0], stage.source[1] + spread(seed, thrown) * size];

        star(context, between(from, at, flight), size * 0.45, share * 18, {
          color: light,
          alpha: 1,
        });
        continue;
      }
      const splash = Math.min(1, (flight - 1) * 0.6);

      ring(context, [at[0] + spread(seed, thrown + 7) * size * 0.5, at[1]], size * (0.3 + splash), {
        ...paint,
        alpha: decay(splash),
        width: 2.2 * stage.scale,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default kalos;
