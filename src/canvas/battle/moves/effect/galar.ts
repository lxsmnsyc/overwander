import type { Point, Stage } from '../../stage';
import {
  beam,
  between,
  bolt,
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
  sickle,
  spread,
  swell,
} from '../__paint';
import type { Draw, EffectShape, ShapePainter } from './shapes';
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

/** The forces of nature's storms: what blows, burns and falls out of each */
export const BLEAKWIND = '#4fc7a4';
export const SAND = '#e8c27a';
export const EMBER_ORANGE = '#ff8a3a';
export const SPRINGTIDE_PINK = '#ff8fcf';

/** Dragon Energy: the share the power has gathered by, and Regidrago's two colours */
export const DRAGONFORCE_FIRE = 0.25;
export const DRAGON_GREEN = '#4fe0a0';
export const DRAGON_VIOLET = '#8a5cff';

/** Freezing Glare: the share the eyes have opened by and stare */
export const GLARE_FIRE = 0.25;
export const GLARE_VIOLET = '#c66cff';

/** Thunderous Kick's orange lightning */
export const KICK_ORANGE = '#ffa63a';

/** Fiery Wrath's dark flame and its hot edge */
export const WRATH_DARK = '#4a1a6a';
export const WRATH_PINK = '#ff3a8a';

/** Wicked Blow's dark fist and the red of the critical */
export const STRIKE_DARK = '#2a1a3a';
export const STRIKE_RED = '#ff4a5a';

/** Surging Strikes: the share each of the three blows lands at, and the water */
export const RAPID_LANDS = [0.05, 0.25, 0.45];
export const RAPID_BLUE = '#1f7cff';

/** Jungle Healing's vines and leaves */
export const JUNGLE_GREEN = '#2fae4a';
export const JUNGLE_LIGHT = '#9be86a';

/** Mystical Power: the share the gems leave the caster at, and the lake guardians' three */
export const MYSTIC_FIRE = 0.35;
export const MYSTIC_GEMS = ['#ff5a7a', '#5a8aff', '#ffd25a'];

/**
 * How much bigger a low-power signature hit is drawn than its power says:
 * Thunderous Kick and Surging Strikes are a legend's own blows
 */
export const SIGNATURE_SCALE = 1.6;

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

/**
 * The storm the four forces of nature share: a dark cloud over each
 * target and a swirl in the move's own colour. What falls out of it
 * is each storm's own
 */
function storm(
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  { paint, weight }: Draw,
  falling: (eye: Point, target: Point, index: number, strength: number, size: number) => void,
): void {
  const size = REACH * stage.scale * weight;
  const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
  const pale = lighten(paint.color, 0.5);
  const strength = swell(share);

  for (const [index, target] of targets.entries()) {
    const eye: Point = [target[0], target[1] - size * 1.4];

    // Dark behind the swirl, so the element reads on bright ground
    orb(context, [eye[0], eye[1] - size * 0.6], size * 2.6, {
      color: '#2a2f45',
      alpha: strength * 0.55,
    });
    for (let band = 0; band < 4; band += 1) {
      const start = share * 8 + band * 1.6 + index;

      sickle(context, eye, size * (1 + band * 0.55), start, start + 2.2, size * 0.5, {
        color: band % 2 === 0 ? paint.color : pale,
        alpha: strength * (1 - band * 0.12),
      });
    }
    falling(eye, target, index, strength, size);
    orb(context, target, size * 2, { color: paint.color, alpha: strength * 0.6 });
  }
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
  // Bleakwind Storm: the storm's swirl, with gusts tearing across it
  Bleakwind(context, stage, share, draw) {
    storm(context, stage, share, draw, (_eye, target, index, strength, size) => {
      for (let gust = 0; gust < many(6, draw.weight); gust += 1) {
        const run = (share * 2.4 + noise(draw.seed + index, gust)) % 1;
        const y = target[1] - size * (0.4 + noise(draw.seed + index, gust + 20) * 2.4);
        const x = target[0] - size * 3 + run * size * 6;

        edge(context, [x - size * 1.6, y], [x, y - size * 0.2], size * 0.5, size * 0.2, {
          color: BLEAKWIND,
          alpha: strength * swell(run),
        });
      }
    });
  },

  // Wildbolt Storm: the storm's swirl, with lightning striking out of the cloud
  Wildbolt(context, stage, share, draw) {
    storm(context, stage, share, draw, (eye, target, index, strength, size) => {
      const flash = Math.floor(share * 10);

      for (let strike = 0; strike < 3; strike += 1) {
        const top: Point = [eye[0] + spread(draw.seed + flash, strike) * size * 1.6, eye[1]];
        const foot: Point = [target[0] + spread(draw.seed + flash, strike + 9) * size, target[1]];

        bolt(context, top, foot, draw.seed + flash * 3 + strike + index, {
          color: strike === 0 ? '#ffffff' : draw.paint.color,
          alpha: strength * (noise(draw.seed + flash, strike + 30) > 0.3 ? 1 : 0.3),
          width: 3 * stage.scale,
        });
      }
    });
  },

  // Sandsear Storm: the storm's swirl, with sand blowing round and embers rising out of it
  Sandsear(context, stage, share, draw) {
    storm(context, stage, share, draw, (eye, target, index, strength, size) => {
      motes(context, eye, size * 3, many(24, draw.weight), draw.seed + index, share, {
        color: SAND,
        alpha: strength,
        width: 3 * stage.scale,
      });
      for (let ember = 0; ember < many(10, draw.weight); ember += 1) {
        const rise = (share * 2 + noise(draw.seed + index, ember)) % 1;

        orb(
          context,
          [
            target[0] + spread(draw.seed + index, ember + 40) * size * 1.8,
            target[1] + size - rise * size * 3,
          ],
          size * 0.22,
          { color: EMBER_ORANGE, alpha: strength * decay(rise) },
        );
      }
    });
  },

  // Springtide Storm: the storm's swirl, with petals and hearts falling out of it
  Springtide(context, stage, share, draw) {
    storm(context, stage, share, draw, (eye, target, index, strength, size) => {
      for (let piece = 0; piece < many(12, draw.weight); piece += 1) {
        const drop = (share * 1.8 + noise(draw.seed + index, piece)) % 1;
        const spot: Point = [
          target[0] +
            spread(draw.seed + index, piece + 20) * size * 2.4 +
            Math.sin(drop * 6) * size * 0.4,
          eye[1] + drop * size * 3.4,
        ];

        if (piece % 3 === 0) {
          heart(context, spot, size * 0.35, { color: SPRINGTIDE_PINK, alpha: strength });
        } else {
          petal(context, spot, size * 0.4, drop * 6 + piece, {
            color: lighten(SPRINGTIDE_PINK, 0.4),
            alpha: strength,
          });
        }
      }
    });
  },

  // Dragon Energy: power gathered at the caster, then a widening dragon's breath with jaws at its head
  Dragonforce(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < DRAGONFORCE_FIRE) {
      const gather = share / DRAGONFORCE_FIRE;

      orb(context, stage.source, size * (0.6 + gather), { color: DRAGON_GREEN, alpha: gather });
      motes(context, stage.source, size * 3 * (1 - gather), 14, seed, gather, {
        color: DRAGON_VIOLET,
        alpha: gather,
        width: 2.4 * stage.scale,
      });
      return;
    }
    const fire = (share - DRAGONFORCE_FIRE) / (1 - DRAGONFORCE_FIRE);
    const reach = Math.min(1, fire * 2.5);
    const head = between(stage.source, at, reach);
    const kept = late(fire, 0.6);

    beam(context, stage.source, at, reach, size * (1 + reach * 2.4), {
      color: DRAGON_VIOLET,
      alpha: kept * 0.6,
    });
    beam(context, stage.source, at, reach, size * (0.5 + reach * 1.2), {
      color: DRAGON_GREEN,
      alpha: kept,
    });
    // The jaws at the breath's head, opening as it arrives
    sickle(context, head, size * 1.6, -2.6, -0.5, size * 0.4, { color: DRAGON_GREEN, alpha: kept });
    sickle(context, head, size * 1.6, 0.5, 2.6, size * 0.4, { color: DRAGON_GREEN, alpha: kept });
    if (reach >= 1) {
      const hit = Math.min(1, (fire - 0.4) / 0.6);

      orb(context, at, size * (1.4 + hit * 2), { color: DRAGON_GREEN, alpha: decay(hit) * 0.8 });
      burst(context, at, size * 2.6, 14, seed, {
        color: DRAGON_VIOLET,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
    }
  },

  // Freezing Glare: two eyes opening over the caster, a psychic stare, and frost closing round the target
  Glaring(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const open = Math.min(1, share / GLARE_FIRE);
    const kept = late(share, 0.65);

    for (const side of [-1, 1]) {
      const eye: Point = [stage.source[0] + side * size * 0.6, stage.source[1] - size * 1.2];

      orb(context, eye, size * 0.45 * open, { color: '#ffffff', alpha: kept });
      ring(context, eye, size * 0.6 * open, {
        color: GLARE_VIOLET,
        alpha: kept,
        width: 2.4 * stage.scale,
      });
      if (share >= GLARE_FIRE) {
        beam(context, eye, at, Math.min(1, (share - GLARE_FIRE) * 4), size * 0.35, {
          color: GLARE_VIOLET,
          alpha: kept,
        });
      }
    }
    if (share < GLARE_FIRE + 0.2) {
      return;
    }
    const freeze = (share - GLARE_FIRE - 0.2) / (1 - GLARE_FIRE - 0.2);

    orb(context, at, size * (1.2 + freeze * 1.4), { color: GLACIAL, alpha: decay(freeze) * 0.7 });
    shards(context, at, size * (1.4 - freeze * 0.4), many(12, weight), seed, 1 - freeze, {
      color: GLACIAL,
      alpha: kept,
    });
    ring(context, at, size * (0.8 + freeze * 2.2), {
      color: lighten(GLARE_VIOLET, 0.4),
      alpha: decay(freeze),
      width: 2.4 * stage.scale,
    });
  },

  // Thunderous Kick: a streak of orange lightning raked through the target, then bolts flying off it
  Thunderkick(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const rake = Math.min(1, share / 0.3);
    const from: Point = [at[0] - size * 2, at[1] - size * 1.6];
    const to: Point = [at[0] + size * 2, at[1] + size * 1.2];

    edge(context, from, between(from, to, rake), size * 1.1, size * 0.4, {
      color: KICK_ORANGE,
      alpha: late(share, 0.4),
    });
    edge(context, from, between(from, to, rake), size * 0.4, size * 0.4, {
      color: '#ffffff',
      alpha: late(share, 0.4),
    });
    if (share < 0.25) {
      return;
    }
    const hit = (share - 0.25) / 0.75;

    orb(context, at, size * (1.2 + hit * 1.6), { color: KICK_ORANGE, alpha: decay(hit) * 0.8 });
    for (let spark = 0; spark < 6; spark += 1) {
      const angle = (spark / 6) * Math.PI * 2 + noise(seed, spark);

      bolt(
        context,
        at,
        [
          at[0] + Math.cos(angle) * size * (1 + hit * 2),
          at[1] + Math.sin(angle) * size * (1 + hit * 2),
        ],
        seed + spark,
        {
          color: spark % 2 === 0 ? KICK_ORANGE : '#ffffff',
          alpha: decay(hit),
          width: 2.4 * stage.scale,
        },
      );
    }
  },

  // Fiery Wrath: dark flames rising out of the ground under everything opposite
  Wrath(context, stage, share, { seed, weight }) {
    const size = REACH * stage.scale * weight;
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const rise = swell(share);

    for (const [index, target] of targets.entries()) {
      const foot: Point = [target[0], target[1] + size * 0.9];

      orb(context, target, size * 2, { color: WRATH_DARK, alpha: rise * 0.5 });
      for (let tongue = 0; tongue < many(7, weight); tongue += 1) {
        const x = foot[0] + spread(seed + index, tongue) * size * 1.6;
        const height = size * (1.6 + noise(seed + index, tongue + 10) * 1.8) * rise;
        const sway = Math.sin(share * 12 + tongue) * size * 0.3;

        edge(context, [x, foot[1]], [x + sway, foot[1] - height], size * 0.7, sway, {
          color: WRATH_DARK,
          alpha: rise,
        });
        edge(context, [x, foot[1]], [x + sway, foot[1] - height * 0.7], size * 0.3, sway, {
          color: WRATH_PINK,
          alpha: rise,
        });
      }
      ripple(context, foot, size * (1.4 + share * 1.6), {
        color: WRATH_PINK,
        alpha: rise * 0.8,
        width: 2.4 * stage.scale,
      });
    }
  },

  // Wicked Blow: one dark fist of a blow landing with a red critical flash
  Singlestrike(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hit = Math.min(1, share / 0.2);
    const after = Math.max(0, (share - 0.2) / 0.8);

    orb(context, at, size * (0.6 + hit * 1.2), { color: STRIKE_DARK, alpha: decay(after) });
    orb(context, at, size * (1.6 + after * 2), { color: STRIKE_RED, alpha: decay(after) * 0.6 });
    burst(context, at, size * (1.4 + after * 1.8), 8, seed, {
      color: STRIKE_RED,
      alpha: decay(after),
      width: 4 * stage.scale,
    });
    for (let wave = 0; wave < 2; wave += 1) {
      const held = Math.max(0, Math.min(1, after * 1.5 - wave * 0.3));

      ring(context, at, size * (1 + held * 3), {
        color: wave === 0 ? '#ffffff' : STRIKE_RED,
        alpha: decay(held),
        width: 3 * stage.scale,
      });
    }
  },

  // Surging Strikes: three blows in a flowing current, each splashing where it lands
  Rapidstrike(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;

    for (const [index, lands] of RAPID_LANDS.entries()) {
      if (share < lands) {
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.4);
      const spot: Point = [
        at[0] + (index - 1) * size * 0.9,
        at[1] + spread(seed, index) * size * 0.4,
      ];

      sickle(context, spot, size * (1 + hit), -Math.PI + index, -0.4 + index, size * 0.4, {
        color: RAPID_BLUE,
        alpha: decay(hit),
      });
      orb(context, spot, size * (0.6 + hit * 1.2), { color: RAPID_BLUE, alpha: decay(hit) * 0.8 });
      ring(context, spot, size * (0.5 + hit * 1.6), {
        color: '#ffffff',
        alpha: decay(hit),
        width: 2.4 * stage.scale,
      });
      motes(context, spot, size * 1.8, 8, seed + index, hit, {
        color: lighten(RAPID_BLUE, 0.4),
        alpha: decay(hit),
        width: 2 * stage.scale,
      });
    }
  },

  // Jungle Healing: vines curling up round each one it reaches, leaves on the air and the green of health
  Jungle(context, stage, share, { seed, weight }) {
    const size = REACH * stage.scale * weight;
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const grow = Math.min(1, share / 0.4);
    const kept = late(share, 0.6);

    for (const [index, target] of targets.entries()) {
      orb(context, target, size * 1.8, { color: JUNGLE_GREEN, alpha: kept * 0.4 });
      for (let vine = 0; vine < 3; vine += 1) {
        const start = vine * 2.1 + share * 2;

        sickle(context, target, size * (1 + vine * 0.35), start, start + 2.4 * grow, size * 0.25, {
          color: vine % 2 === 0 ? JUNGLE_GREEN : JUNGLE_LIGHT,
          alpha: kept,
        });
      }
      for (let leaf = 0; leaf < many(8, weight); leaf += 1) {
        const lift = (share * 1.4 + noise(seed + index, leaf)) % 1;

        petal(
          context,
          [
            target[0] + spread(seed + index, leaf + 20) * size * 1.8,
            target[1] + size - lift * size * 3,
          ],
          size * 0.4,
          lift * 5 + leaf,
          { color: JUNGLE_LIGHT, alpha: kept * swell(lift) },
        );
      }
    }
  },

  // Dynamax Cannon: the core flaring, then a broad red beam with rings running down it
  Maxcannon(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const core: Point = [stage.source[0], stage.source[1] - size * 0.6];
    const charge = Math.min(1, share / DYNAMAX_FIRE);
    const kept = late(share, 0.7);

    orb(context, core, size * (0.8 + charge * 1.2), { color: DYNAMAX_RED, alpha: kept });
    ring(context, core, size * (2.4 - charge * 1.4), {
      color: DYNAMAX_RED,
      alpha: charge * kept,
      width: 3 * stage.scale,
    });
    if (share < DYNAMAX_FIRE) {
      return;
    }
    const fire = (share - DYNAMAX_FIRE) / (1 - DYNAMAX_FIRE);
    const reach = Math.min(1, fire * 3);

    beam(context, core, at, reach, size * 2.4 * decay(fire), {
      color: DYNAMAX_RED,
      alpha: kept * 0.7,
    });
    beam(context, core, at, reach, size * 0.9 * decay(fire), { color: '#ffffff', alpha: kept });
    for (let pulse = 0; pulse < 4; pulse += 1) {
      const along = (fire * 3 + pulse / 4) % 1;

      if (along <= reach) {
        ring(context, between(core, at, along), size * 1.4, {
          color: lighten(DYNAMAX_RED, 0.3),
          alpha: kept * 0.8,
          width: 3 * stage.scale,
        });
      }
    }
    if (reach >= 1) {
      orb(context, at, size * (1.6 + fire * 2), { color: DYNAMAX_RED, alpha: decay(fire) });
      ripple(context, [at[0], at[1] + size * 0.9], size * (1 + fire * 3.6), {
        color: DYNAMAX_RED,
        alpha: decay(fire),
        width: 3 * stage.scale,
      });
      burst(context, at, size * 2.6, 16, seed, {
        color: lighten(DYNAMAX_RED, 0.5),
        alpha: decay(fire),
        width: 3 * stage.scale,
      });
    }
  },

  // Mystical Power: three gems of the lake guardians circling the caster, then twisting to the target
  Mystic(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (const [index, color] of MYSTIC_GEMS.entries()) {
      const turn = share * 9 + (index / 3) * Math.PI * 2;

      if (share < MYSTIC_FIRE) {
        const spot: Point = [
          stage.source[0] + Math.cos(turn) * size * 1.4,
          stage.source[1] - size * 0.8 + Math.sin(turn) * size * 0.6,
        ];

        orb(context, spot, size * 0.55, { color, alpha: 1 });
        orb(context, spot, size * 0.22, { color: '#ffffff', alpha: 1 });
        continue;
      }
      const flight = Math.min(1, (share - MYSTIC_FIRE) / 0.35);
      const along = between(stage.source, at, flight);
      const spot: Point = [
        along[0] + Math.cos(turn) * size * 0.9 * decay(flight),
        along[1] + Math.sin(turn) * size * 0.9 * decay(flight),
      ];

      orb(context, spot, size * 0.55, { color, alpha: late(share, 0.7) });
      if (flight >= 1) {
        const hit = (share - MYSTIC_FIRE - 0.35) / (1 - MYSTIC_FIRE - 0.35);

        ring(context, at, size * (0.8 + hit * 2.4 + index * 0.4), {
          color,
          alpha: decay(hit),
          width: 3 * stage.scale,
        });
      }
    }
    if (share >= MYSTIC_FIRE + 0.35) {
      const hit = (share - MYSTIC_FIRE - 0.35) / (1 - MYSTIC_FIRE - 0.35);

      orb(context, at, size * (1.2 + hit * 1.6), { color: '#ffffff', alpha: decay(hit) * 0.6 });
      motes(context, at, size * 2.6, 12, seed, hit, {
        color: MYSTIC_GEMS[0],
        alpha: decay(hit),
        width: 2 * stage.scale,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default galar;
