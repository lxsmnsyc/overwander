import type { Point } from '../../stage';
import {
  beam,
  between,
  bolt,
  burst,
  decay,
  edge,
  fade,
  late,
  lighten,
  mix,
  motes,
  noise,
  orb,
  ring,
  ripple,
  shards,
  sickle,
  spread,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Behemoth Blade: the share the blade has come down by */
export const BEHEMOTH_LANDS = 0.4;

/** Eternabeam and Dynamax Cannon: the share the core has charged by and fires */
export const DYNAMAX_FIRE = 0.3;

/** Dragon Darts: the share each of the two darts lands at */
export const DARTS_LAND = [0.35, 0.55];

/** Glacial Lance: the share the lance has fallen by */
export const LANCE_LANDS = 0.4;

/** Astral Barrage: the share the riders have crossed the field by */
export const ASTRAL_ARRIVES = 0.45;

/** Thunder Cage: the share the bars have closed by */
export const CAGE_CLOSES = 0.35;

/** Zacian's and Zamazenta's steel, and the gold it is trimmed with */
export const BEHEMOTH_STEEL = '#cfe0ff';

/** Behemoth Bash: the share the shield has been driven in by */
export const BULWARK_LANDS = 0.45;

/** Zamazenta's shield, red with a gold rim */
export const BULWARK_RED = '#e8505b';
export const BEHEMOTH_GOLD = '#ffd25a';

/** Eternatus' crimson core and the dark round it */
export const DYNAMAX_RED = '#ff2d55';
export const DYNAMAX_DARK = '#4a0a24';

/** Dreepy's teal */
export const DREEPY = '#4fd2c4';

/** Glastrier's ice and the white of its breath */
export const GLACIAL = '#bfefff';
export const RIME = '#ffffff';

/** Spectrier's violet and the dark of its riders */
export const ASTRAL = '#8a6cff';
export const ASTRAL_DARK = '#1e1040';

/** How many bars the cage is drawn with */
export const CAGE_BARS = 8;

/** A hexagon round a point, turned by `turn` */
function hexagon(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  color: string,
  alpha: number,
  width: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = turn + (corner / 6) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius * 0.8,
    );
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
}

const galar = {
  // A giant blade of light rising over the caster and brought down on the target
  Behemoth(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const steel = mix(paint.color, BEHEMOTH_STEEL, 0.7);

    if (share < BEHEMOTH_LANDS) {
      const rise = share / BEHEMOTH_LANDS;
      const hilt: Point = between(stage.source, at, rise ** 2);
      const tip: Point = [hilt[0], hilt[1] - size * (2.6 - rise * 1.4)];

      orb(context, tip, size * (0.8 + rise), { color: BEHEMOTH_GOLD, alpha: rise * 0.5 });
      orb(context, between(hilt, tip, 0.5), size * 1.6, { color: steel, alpha: 0.35 });
      edge(context, hilt, tip, size * 2.2, 0, { color: steel, alpha: 0.95 });
      edge(context, hilt, tip, size * 0.9, 0, { color: '#ffffff', alpha: 1 });
      ring(context, hilt, size * 0.6, {
        color: BEHEMOTH_GOLD,
        alpha: 0.9,
        width: 3 * stage.scale,
      });
      return;
    }
    const hit = (share - BEHEMOTH_LANDS) / (1 - BEHEMOTH_LANDS);

    orb(context, at, size * (1.2 + hit * 2), { color: steel, alpha: decay(hit) * 0.8 });
    sickle(context, at, size * (1.4 + hit * 1.2), -2.4, -0.6, size * 0.5 * decay(hit), {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 1.8)),
    });
    for (let wave = 0; wave < 2; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.5 - wave * 0.3));

      ring(context, at, size * (0.8 + held * 2.6), {
        color: BEHEMOTH_GOLD,
        alpha: decay(held),
        width: 3 * stage.scale,
      });
    }
    burst(context, at, size * (1.6 + hit * 1.6), 12, seed, {
      color: steel,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.2, many(8, weight), seed, hit, {
      color: steel,
      alpha: late(hit, 0.5),
    });
  },

  // A broad shield of light carried across in front of the caster and driven into the target
  Bulwark(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < BULWARK_LANDS) {
      const push = (share / BULWARK_LANDS) ** 2;
      const front = between(stage.source, at, push * 0.9);

      orb(context, front, size * 2.2, { color: BULWARK_RED, alpha: 0.5 });
      hexagon(context, front, size * 1.8, Math.PI / 6, BEHEMOTH_GOLD, 1, 4 * stage.scale);
      hexagon(context, front, size * 1.1, Math.PI / 6, '#ffffff', 0.8, 2 * stage.scale);
      orb(context, front, size * 0.6, { color: BEHEMOTH_GOLD, alpha: 0.9 });
      return;
    }
    const hit = (share - BULWARK_LANDS) / (1 - BULWARK_LANDS);
    const foot: Point = [at[0], at[1] + size * 0.9];

    hexagon(context, at, size * (1.8 + hit * 1.6), Math.PI / 6, BEHEMOTH_GOLD, decay(hit), 4);
    orb(context, at, size * (1.6 + hit * 1.8), { color: BULWARK_RED, alpha: decay(hit) * 0.8 });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      ripple(context, foot, size * (1 + held * 3.4), {
        color: wave === 1 ? BULWARK_RED : BEHEMOTH_GOLD,
        alpha: decay(held),
        width: 3 * stage.scale,
      });
    }
    burst(context, at, size * (1.8 + hit * 1.4), 10, seed, {
      color: BEHEMOTH_GOLD,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.4, many(10, weight), seed, hit, {
      color: lighten(BULWARK_RED, 0.3),
      alpha: late(hit, 0.5),
    });
  },

  // A crimson core swelling over the caster in hexagon rings, then a red beam out of it
  Dynamax(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const core: Point = [stage.source[0], stage.source[1] - size * 0.8];
    const charge = Math.min(1, share / DYNAMAX_FIRE);
    const kept = late(share, 0.7);

    orb(context, core, size * (0.6 + charge * 0.9), { color: DYNAMAX_RED, alpha: kept });
    for (let hex = 0; hex < 3; hex += 1) {
      hexagon(
        context,
        core,
        size * (1 + hex * 0.6) * charge,
        share * (hex % 2 === 0 ? 2 : -2),
        DYNAMAX_RED,
        kept * (0.8 - hex * 0.2),
        2 * stage.scale,
      );
    }
    if (share < DYNAMAX_FIRE) {
      motes(context, core, size * 2.4 * (1 - charge), 12, seed, charge, {
        color: DYNAMAX_RED,
        alpha: charge,
        width: 2 * stage.scale,
      });
      return;
    }
    const fire = (share - DYNAMAX_FIRE) / (1 - DYNAMAX_FIRE);
    const reach = Math.min(1, fire * 3);

    beam(context, core, at, reach, size * 1.6 * decay(fire), {
      color: DYNAMAX_DARK,
      alpha: kept * 0.8,
    });
    beam(context, core, at, reach, size * 0.9 * decay(fire), { color: DYNAMAX_RED, alpha: kept });
    beam(context, core, at, reach, size * 0.3 * decay(fire), { color: '#ffffff', alpha: kept });
    if (reach >= 1) {
      orb(context, at, size * (1.4 + fire * 1.6), { color: DYNAMAX_RED, alpha: decay(fire) });
      hexagon(context, at, size * (1 + fire * 2.4), fire * 3, DYNAMAX_RED, decay(fire), 3);
      burst(context, at, size * 2.4, 14, seed, {
        color: lighten(DYNAMAX_RED, 0.4),
        alpha: decay(fire),
        width: 3 * stage.scale,
      });
    }
  },

  // Two Dreepy shot from the caster one after another, each bursting where it lands
  Darters(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (const [index, lands] of DARTS_LAND.entries()) {
      const leave = lands - 0.3;

      if (share < leave) {
        continue;
      }
      if (share < lands) {
        const flight = (share - leave) / 0.3;
        const off = (index === 0 ? -1 : 1) * size * 0.6;
        const head: Point = between([stage.source[0], stage.source[1] + off], at, flight);
        const tail: Point = between(
          [stage.source[0], stage.source[1] + off],
          at,
          Math.max(0, flight - 0.25),
        );

        edge(context, tail, head, size * 1.2, 0, { color: DREEPY, alpha: 0.8 });
        orb(context, head, size * 1.1, { color: DREEPY, alpha: 1 });
        orb(context, head, size * 0.45, { color: '#ffffff', alpha: 1 });
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.35);
      const spot: Point = [at[0] + spread(seed, index) * size * 0.4, at[1]];

      orb(context, spot, size * (0.6 + hit * 1.2), { color: DREEPY, alpha: decay(hit) * 0.8 });
      ring(context, spot, size * (0.5 + hit * 1.6), {
        color: lighten(DREEPY, 0.4),
        alpha: decay(hit),
        width: 2.4 * stage.scale,
      });
      burst(context, spot, size * 1.4, 8, seed + index, {
        color: DREEPY,
        alpha: decay(hit),
        width: 2 * stage.scale,
      });
    }
  },

  // A giant spear of ice falling point-first onto the target and shattering into a frost
  Lance(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < LANCE_LANDS) {
      const fall = (share / LANCE_LANDS) ** 1.6;
      const tip: Point = [at[0] + size * 1.2 * (1 - fall), at[1] - size * 5 * (1 - fall)];
      const butt: Point = [tip[0] + size * 1.2, tip[1] - size * 3.4];

      edge(context, butt, tip, size * 1.1, 0, { color: GLACIAL, alpha: 0.9 });
      edge(context, butt, tip, size * 0.4, 0, { color: RIME, alpha: 1 });
      motes(context, between(butt, tip, 0.4), size * 1.4, 8, seed, fall, {
        color: RIME,
        alpha: 0.8,
        width: 2 * stage.scale,
      });
      return;
    }
    const hit = (share - LANCE_LANDS) / (1 - LANCE_LANDS);
    const foot: Point = [at[0], at[1] + size * 0.9];

    orb(context, at, size * (1.2 + hit * 2), { color: GLACIAL, alpha: decay(hit) * 0.8 });
    ripple(context, foot, size * (1 + hit * 3.4), {
      color: RIME,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.8, many(14, weight), seed, hit, {
      color: GLACIAL,
      alpha: late(hit, 0.4),
    });
    motes(context, at, size * 3, many(16, weight), seed, hit, {
      color: RIME,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A rush of spectral riders streaming over the field and crashing into everything opposite
  Astral(context, stage, share, { seed, weight }) {
    const size = REACH * stage.scale * weight;
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const riders = many(9, weight);

    if (share < ASTRAL_ARRIVES) {
      const flight = share / ASTRAL_ARRIVES;

      for (let rider = 0; rider < riders; rider += 1) {
        const goal = targets[rider % targets.length];
        const lag = noise(seed, rider) * 0.35;
        const along = Math.max(0, Math.min(1, (flight - lag) / (1 - lag)));
        const lane = spread(seed, rider + 20) * size * 1.6;
        const head: Point = between(
          [stage.source[0], stage.source[1] + lane],
          [goal[0], goal[1] + lane * 0.3],
          along,
        );
        const tail: Point = between(
          [stage.source[0], stage.source[1] + lane],
          [goal[0], goal[1] + lane * 0.3],
          Math.max(0, along - 0.3),
        );

        edge(context, tail, head, size * 0.7, size * 0.3, { color: ASTRAL_DARK, alpha: 0.6 });
        orb(context, head, size * 0.45, { color: ASTRAL, alpha: 0.9 });
      }
      return;
    }
    const hit = (share - ASTRAL_ARRIVES) / (1 - ASTRAL_ARRIVES);

    for (const [index, target] of targets.entries()) {
      orb(context, target, size * (1.2 + hit * 1.8), { color: ASTRAL, alpha: decay(hit) * 0.7 });
      orb(context, target, size * (0.6 + hit), { color: ASTRAL_DARK, alpha: decay(hit) * 0.6 });
      ring(context, target, size * (0.8 + hit * 2.4), {
        color: lighten(ASTRAL, 0.4),
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      motes(context, target, size * 2.6, many(12, weight), seed + index, hit, {
        color: ASTRAL,
        alpha: decay(hit),
        width: 2 * stage.scale,
      });
    }
  },

  // A storm of the move's own element swirling down over everything opposite
  Squall(context, stage, share, { paint, seed, weight }) {
    const size = REACH * stage.scale * weight;
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const pale = lighten(paint.color, 0.5);
    const strength = swell(share);

    for (const [index, target] of targets.entries()) {
      const eye: Point = [target[0], target[1] - size * 1.4];

      // A dark cloud behind the storm, so the element reads on bright ground
      orb(context, [eye[0], eye[1] - size * 0.6], size * 2.6, {
        color: '#2a2f45',
        alpha: strength * 0.55,
      });

      for (let band = 0; band < 4; band += 1) {
        const start = share * 8 + band * 1.6 + index;

        sickle(context, eye, size * (1 + band * 0.55), start, start + 2.2, size * 0.5, {
          color: band % 2 === 0 ? paint.color : pale,
          alpha: strength * (0.9 - band * 0.15),
        });
      }
      for (let streak = 0; streak < many(10, weight); streak += 1) {
        const x = target[0] + spread(seed + index, streak) * size * 2.4;
        const drop = (share * 3 + noise(seed + index, streak + 10)) % 1;
        const top: Point = [x, target[1] - size * 3 + drop * size * 3];
        const bottom: Point = [x - size * 0.4, top[1] + size * 0.9];

        edge(context, top, bottom, size * 0.28, 0, { color: paint.color, alpha: strength });
      }
      orb(context, target, size * 1.6, { color: paint.color, alpha: strength * 0.35 });
    }
  },

  // Bars of lightning closing round the target, crackling between them, then snapping shut
  Cage(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const close = Math.min(1, share / CAGE_CLOSES);
    const kept = late(share, 0.6);
    const pale = lighten(paint.color, 0.5);
    const radius = size * (2.6 - close * 1.2);

    for (let bar = 0; bar < CAGE_BARS; bar += 1) {
      const angle = (bar / CAGE_BARS) * Math.PI * 2 + share * 1.5;
      const x = at[0] + Math.cos(angle) * radius;
      const depth = Math.sin(angle);

      bolt(
        context,
        [x, at[1] - size * 1.6 + depth * size * 0.3],
        [x, at[1] + size * 1.2 + depth * size * 0.3],
        seed + bar + Math.floor(share * 12),
        { color: depth < 0 ? pale : paint.color, alpha: kept * close, width: 4 * stage.scale },
      );
    }
    ring(context, [at[0], at[1] - size * 1.6], radius, {
      color: paint.color,
      alpha: kept * close * 0.8,
      width: 2 * stage.scale,
    });
    ripple(context, [at[0], at[1] + size * 1.2], radius, {
      color: paint.color,
      alpha: kept * close * 0.8,
      width: 2 * stage.scale,
    });
    if (share >= CAGE_CLOSES) {
      const snap = (share - CAGE_CLOSES) / (1 - CAGE_CLOSES);

      orb(context, at, size * (1 + snap * 1.4), { color: paint.color, alpha: decay(snap) * 0.8 });
      burst(context, at, size * 2, 12, seed, {
        color: pale,
        alpha: decay(snap),
        width: 2.4 * stage.scale,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default galar;
