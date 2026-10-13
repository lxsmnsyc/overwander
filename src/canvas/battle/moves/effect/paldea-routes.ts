import type { Point } from '../../stage';
import {
  between,
  burst,
  decay,
  edge,
  fade,
  late,
  lighten,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  shards,
  sickle,
  slash,
  spread,
  star,
  swell,
} from '../__paint';
import { SIGNATURE_SCALE } from './galar';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Silk Trap: the share the web is strung up by */
export const SNARE_SPUN = 0.35;

/** Spidops' silk, and the shade under it so it reads on a bright ground */
export const SILK_WHITE = '#f4f2ea';
export const SILK_SHADE = '#6a5a4a';

/** Lumina Crash: the share the fan has opened by, and the share the wave breaks at */
export const LUMINA_FAN = 0.3;
export const LUMINA_CRASH = 0.4;

/** Espathra's pastel rainbow, its feathers and the dark of the eye spots */
export const LUMINA_COLOURS = ['#ff9ac8', '#ffd88a', '#b4f0a0', '#8ad8ff', '#c8a8ff'];
export const ESPATHRA_FEATHER = '#f6d0ec';
export const ESPATHRA_EYE = '#3a2a5a';

/** Order Up: the share Tatsugiri lands by */
export const ORDER_LANDS = 0.5;

/** Tatsugiri's orange, the rice-white it is curled round, and the splash */
export const TATSUGIRI_ORANGE = '#ff8a3a';
export const TATSUGIRI_CREAM = '#fff0d8';
export const ORDER_WATER = '#6ac8ff';

/** Jet Punch: the share the fist lands by */
export const JET_LANDS = 0.3;

/** The jet's blue and the foam off it */
export const JET_BLUE = '#3a9cff';
export const JET_FOAM = '#e8f8ff';

/** Spicy Extract: how many drops fall, and the share the last lands by */
export const SPICE_DROPS = 6;
export const SPICE_LANDS = 0.45;

/** The chili's red and stem, and the heat off it */
export const CHILI_RED = '#e8241e';
export const CHILI_STEM = '#3f9a3a';
export const HEAT_ORANGE = '#ff8a3a';

/** Spin Out: the tyres' black, the exhaust and the sparks off the grind */
export const TYRE_BLACK = '#26262c';
export const EXHAUST_GREY = '#8a8a92';
export const GRIND_GOLD = '#ffd25a';

/** Population Bomb: the most mice drawn, and the share they all arrive within */
export const HORDE_MICE = 10;
export const HORDE_ARRIVES = 0.6;

/** Maushold's white, and the dark of its outline and eyes */
export const MOUSE_WHITE = '#f6f2ea';
export const MOUSE_DARK = '#3a3a44';

/** Glaive Rush: the share the blade has swept across by */
export const GLAIVE_LANDS = 0.4;

/** Baxcalibur's ice-blue blade, its pale edge and the dark under it */
export const GLAIVE_ICE = '#8ad8ff';
export const GLAIVE_PALE = '#e8faff';
export const GLAIVE_DARK = '#2a4a6a';

/** Salt Cure: how many cubes fall, and the share the first lands at */
export const SALT_CUBES = 9;
export const SALT_FALLS = 0.15;

/** The salt's white and the grey of its edges */
export const SALT_WHITE = '#f8f6f0';
export const SALT_SHADE = '#a8a090';

/** Triple Dive: how many heads come up, and how far apart they start */
export const DIVERS_HEADS = 3;
export const DIVERS_GAP = 0.22;

/** Wugtrio's red, its blue fronds, the hole and the water */
export const WUGTRIO_RED = '#e0504a';
export const WUGTRIO_BLUE = '#4a7ad8';
export const DIVE_HOLE = '#2a2430';
export const DIVE_WATER = '#6ac8ff';

/** Mortal Spin: how many petals spin round it */
export const SPINNER_PETALS = 6;

/** Glimmora's crystal pink, the violet under it and its poison */
export const GLIMMORA_PINK = '#f07ad0';
export const GLIMMORA_VIOLET = '#6a2a9a';
export const SPINNER_POISON = '#b04ae8';

/** Doodle: the share the scribbles are all drawn by */
export const DOODLE_DRAWN = 0.6;

/** Grafaiai's paints */
export const DOODLE_COLOURS = ['#ff4a6a', '#ffd23a', '#3ac8ff', '#5aea6a', '#c86aff'];

/** Fillet Away: how many slices peel off, and the share the last has gone by */
export const FILLET_SLICES = 5;
export const FILLET_PEELS = 0.45;

/** Veluza's pale flesh and the pink under it */
export const FILLET_PALE = '#f6ece4';
export const FILLET_PINK = '#e8a0a0';

/** Kowtow Cleave: the share the bow ends at, and the share the cut breaks at */
export const KOWTOW_BOWS = 0.3;
export const KOWTOW_BREAKS = 0.7;

/** Kingambit's gold blade and its dark */
export const KINGAMBIT_GOLD = '#ffc83a';
export const KINGAMBIT_DARK = '#2a2030';

/** A line through points, with a wider dark line under it when `under` is given */
function strokeThrough(
  context: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  color: string,
  alpha: number,
  under?: string,
): void {
  if (points.length < 2 || alpha <= 0) {
    return;
  }
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
  }
  if (under != null) {
    context.strokeStyle = fade(under, alpha * 0.55);
    context.lineWidth = width * 2.2;
    context.stroke();
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
  context.lineCap = 'butt';
  context.lineJoin = 'miter';
}

/** A filled round body with a dark rim, so a pale thing reads on snow */
function body(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, Math.max(0.5, across), Math.max(0.5, up), turn, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade(MOUSE_DARK, alpha * 0.6);
  context.lineWidth = Math.max(1, Math.min(across, up) * 0.18);
  context.stroke();
}

/** A Tatsugiri curled over a pad of rice, turned by `turn` */
function sushi(
  context: CanvasRenderingContext2D,
  at: Point,
  size: number,
  turn: number,
  alpha: number,
): void {
  const lift: Point = [at[0] + Math.sin(turn) * size * 0.35, at[1] - Math.cos(turn) * size * 0.35];

  body(context, at, size, size * 0.6, turn, TATSUGIRI_CREAM, alpha);
  body(context, lift, size * 1.05, size * 0.42, turn, TATSUGIRI_ORANGE, alpha);
  orb(
    context,
    [lift[0] + Math.cos(turn) * size * 0.55, lift[1] + Math.sin(turn) * size * 0.55],
    size * 0.2,
    {
      color: '#ffe6a0',
      alpha,
    },
  );
}

/** A salt cube: a square turned on the picture, white with grey edges */
function cube(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  alpha: number,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(turn);
  context.fillStyle = fade(SALT_WHITE, alpha);
  context.fillRect(-size, -size, size * 2, size * 2);
  context.strokeStyle = fade(SALT_SHADE, alpha);
  context.lineWidth = Math.max(1, size * 0.3);
  context.beginPath();
  context.moveTo(-size, -size);
  context.lineTo(size, -size);
  context.lineTo(size, size);
  context.lineTo(-size, size);
  context.closePath();
  context.stroke();
  context.restore();
}

/** A Maushold mouse: a round white body, two ears and an eye */
function mouse(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  facing: number,
  alpha: number,
): void {
  body(
    context,
    [x - size * 0.5 * facing, y - size * 0.95],
    size * 0.42,
    size * 0.42,
    0,
    MOUSE_WHITE,
    alpha,
  );
  body(
    context,
    [x + size * 0.3 * facing, y - size * 0.95],
    size * 0.42,
    size * 0.42,
    0,
    MOUSE_WHITE,
    alpha,
  );
  body(context, [x, y], size, size * 0.85, 0, MOUSE_WHITE, alpha);
  orb(context, [x + size * 0.45 * facing, y - size * 0.15], size * 0.2, {
    color: MOUSE_DARK,
    alpha,
  });
}

const paldeaRoutes = {
  // A web of silk strung up in front of the caster, spokes first and
  // then the rings, its strands glinting and a few loose threads
  // twitching as if something had touched it
  Snare(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const centre: Point = [at[0], at[1] - size * 0.4];
    const spun = Math.min(1, share / SNARE_SPUN);
    const shown = late(share, 0.75);
    const radius = size * 2;
    const corner = (index: number, out: number): Point => {
      const angle = -Math.PI / 2 + (index / 6) * Math.PI * 2;

      return [centre[0] + Math.cos(angle) * out, centre[1] + Math.sin(angle) * out * 1.1];
    };

    orb(context, centre, radius * 1.1, { color: SILK_WHITE, alpha: shown * 0.18 });
    for (let spoke = 0; spoke < 6; spoke += 1) {
      strokeThrough(
        context,
        [centre, corner(spoke, radius * Math.min(1, spun * 2))],
        1.6 * stage.scale,
        SILK_WHITE,
        shown,
        SILK_SHADE,
      );
    }
    // Rings strung round the spokes once those are out, the outer first
    for (let band = 0; band < 3; band += 1) {
      const strung = Math.min(1, Math.max(0, spun * 3 - 1 - band * 0.6));

      if (strung <= 0) {
        continue;
      }
      const out = radius * (1 - band * 0.28);
      const sides = Math.ceil(strung * 6);
      const points: Point[] = [];

      for (let side = 0; side <= sides; side += 1) {
        points.push(corner(side, out));
      }
      strokeThrough(context, points, 1.2 * stage.scale, SILK_WHITE, shown, SILK_SHADE);
    }
    // The loose threads off the corners, twitching
    for (let thread = 0; thread < 3; thread += 1) {
      const from = corner(thread * 2 + 1, radius);
      const twitch = Math.sin(share * 40 + thread * 2) * size * 0.25 * spun;
      const end: Point = [from[0] + twitch, from[1] + size * 0.9 * spun];

      strokeThrough(
        context,
        [from, between(from, end, 0.5), end],
        1 * stage.scale,
        SILK_WHITE,
        shown * 0.8,
        SILK_SHADE,
      );
    }
    for (let glint = 0; glint < 4; glint += 1) {
      const travel = (share * 1.5 + noise(seed, glint)) % 1;
      const spoke = Math.floor(noise(seed, glint + 10) * 6);

      star(context, between(centre, corner(spoke, radius * spun), travel), size * 0.3, share * 6, {
        color: '#ffffff',
        alpha: swell(travel) * shown,
      });
    }
  },

  // Espathra's fan of feathers flaring open behind it, each with a
  // rainbow eye, then a wave of pastel light crashing down over it and
  // rippling out
  Lumina(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const open = Math.min(1, share / LUMINA_FAN);
    const fanned = Math.min(1, share * 6) * late(share, 0.55);
    const hub: Point = [at[0], at[1] + size * 0.4];

    for (let feather = 0; feather < 7; feather += 1) {
      const angle = -Math.PI / 2 + (feather / 6 - 0.5) * Math.PI * 1.1 * open;
      const tip: Point = [
        hub[0] + Math.cos(angle) * size * 3.2,
        hub[1] + Math.sin(angle) * size * 3.2,
      ];
      const eye = between(hub, tip, 0.78);

      petal(context, between(hub, tip, 0.55), size * 1.6, angle + Math.PI / 2, {
        color: ESPATHRA_FEATHER,
        alpha: fanned * 0.9,
      });
      orb(context, eye, size * 0.6, {
        color: LUMINA_COLOURS[feather % LUMINA_COLOURS.length],
        alpha: fanned,
      });
      orb(context, eye, size * 0.2, { color: ESPATHRA_EYE, alpha: fanned });
    }
    if (share < LUMINA_CRASH) {
      return;
    }
    const crash = (share - LUMINA_CRASH) / (1 - LUMINA_CRASH);
    const fall = Math.min(1, crash / 0.35);
    const crest: Point = [at[0], at[1] - size * 4 + fall * size * 4 + size * 3];

    // The wave: bands of each colour curling down over it
    for (const [band, colour] of LUMINA_COLOURS.entries()) {
      sickle(
        context,
        crest,
        size * (2.6 + band * 0.4),
        -Math.PI * 0.9,
        -Math.PI * 0.1,
        size * 0.5,
        { color: colour, alpha: decay(crash * 1.6) * 0.85 },
      );
    }
    orb(context, at, size * (1 + crash * 1.6), {
      color: '#fff6ff',
      alpha: swell(Math.min(1, crash * 1.5)) * 0.8,
    });
    for (const [band, colour] of LUMINA_COLOURS.entries()) {
      const out = Math.max(0, crash - band * 0.06);

      ring(context, at, size * (0.8 + out * 3.4), {
        color: colour,
        alpha: decay(out) * 0.9,
        width: 2.4 * stage.scale,
      });
    }
    ripple(context, [at[0], at[1] + size * 0.8], size * (1 + crash * 3.6), {
      color: LUMINA_COLOURS[3],
      alpha: decay(crash) * 0.8,
      width: 3 * stage.scale,
    });
    motes(context, at, size * 2.6, many(10, weight), seed, crash, {
      color: LUMINA_COLOURS[Math.floor(crash * 10) % LUMINA_COLOURS.length],
      alpha: decay(crash),
      width: 2.4 * stage.scale,
    });
  },

  // A curled-up Tatsugiri flung high from the caster's side, spinning,
  // landing on it in a splash, and a plate ring left on the ground
  Order(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const from: Point = [stage.source[0] + size * 1.6, stage.source[1] - size * 0.6];

    if (share < ORDER_LANDS) {
      const flight = share / ORDER_LANDS;
      const spot = between(from, at, flight);
      const high: Point = [spot[0], spot[1] - Math.sin(Math.PI * flight) * size * 5];
      const back = Math.max(0, flight - 0.12);
      const behind = between(from, at, back);

      motes(
        context,
        [behind[0], behind[1] - Math.sin(Math.PI * back) * size * 5],
        size,
        5,
        seed,
        flight,
        {
          color: ORDER_WATER,
          alpha: 0.7,
          width: 2 * stage.scale,
        },
      );
      sushi(context, high, size * 0.9, flight * Math.PI * 4, 1);
      return;
    }
    const hit = (share - ORDER_LANDS) / (1 - ORDER_LANDS);
    const foot: Point = [at[0], at[1] + size * 0.8];

    ripple(context, foot, size * 2.2, {
      color: '#ffffff',
      alpha: late(hit, 0.5) * 0.9,
      width: 3.5 * stage.scale,
    });
    ripple(context, foot, size * 1.8, {
      color: TATSUGIRI_ORANGE,
      alpha: late(hit, 0.5) * 0.6,
      width: 1.5 * stage.scale,
    });
    orb(context, at, size * (1 + hit * 1.8), { color: ORDER_WATER, alpha: decay(hit) * 0.7 });
    sushi(
      context,
      [at[0], at[1] - size * 0.6 - swell(Math.min(1, hit * 2)) * size * 0.8],
      size * 0.9,
      Math.PI * 4,
      late(hit, 0.4),
    );
    motes(context, at, size * 3, many(14, weight), seed, hit, {
      color: lighten(ORDER_WATER, 0.3),
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    burst(context, at, size * (1.4 + hit * 2), 12, seed + 1, {
      color: TATSUGIRI_ORANGE,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A fist of water rocketing in at the head of a long thin jet, and a
  // splash bursting where it lands
  Jetfist(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = Math.min(1, share / JET_LANDS) ** 0.8;
    const head = between(stage.source, at, run);
    const fading = late(share, 0.5);

    edge(context, stage.source, head, size * 0.7, 0, { color: JET_BLUE, alpha: fading * 0.45 });
    edge(context, stage.source, head, size * 0.25, 0, { color: JET_FOAM, alpha: fading * 0.9 });
    motes(context, between(stage.source, head, 0.7), size * 1.4, 8, seed, run, {
      color: JET_FOAM,
      alpha: fading * 0.8,
      width: 1.8 * stage.scale,
    });
    if (share < JET_LANDS) {
      orb(context, head, size * 1.1, { color: JET_BLUE, alpha: 1 });
      // The knuckles across the front of the fist
      for (let knuckle = 0; knuckle < 4; knuckle += 1) {
        orb(
          context,
          [head[0] + (knuckle - 1.5) * size * 0.35, head[1] - size * 0.35],
          size * 0.28,
          {
            color: JET_FOAM,
            alpha: 1,
          },
        );
      }
      return;
    }
    const hit = (share - JET_LANDS) / (1 - JET_LANDS);

    orb(context, at, size * (0.9 + hit * 1.8), { color: JET_FOAM, alpha: decay(hit * 2) });
    orb(context, at, size * (1.2 + hit * 1.8), { color: JET_BLUE, alpha: decay(hit) * 0.7 });
    ring(context, at, size * (1 + hit * 3), {
      color: JET_FOAM,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 3, many(14, weight), seed + 1, hit, {
      color: lighten(JET_BLUE, 0.4),
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    burst(context, at, size * (1.4 + hit * 2), 10, seed + 2, {
      color: JET_FOAM,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A chili pepper squeezed over it, red-hot drops falling onto it,
  // then heat shimmering and red steam rising off it
  Spice(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const squeeze = Math.min(1, share / SPICE_LANDS);
    const held = Math.min(1, share * 8) * late(share, 0.55);
    const stem: Point = [at[0] - size * 0.9, at[1] - size * 3];
    const tip: Point = [at[0] + size * 0.3, at[1] - size * 2.2];

    edge(context, stem, tip, size * (0.5 - squeeze * 0.2), size * 0.3, {
      color: CHILI_RED,
      alpha: held,
    });
    edge(context, between(stem, tip, 0.1), between(stem, tip, 0.5), size * 0.12, size * 0.1, {
      color: '#ff8a7a',
      alpha: held * 0.8,
    });
    edge(context, [stem[0] - size * 0.5, stem[1] - size * 0.25], stem, size * 0.15, 0, {
      color: CHILI_STEM,
      alpha: held,
    });
    for (let drop = 0; drop < SPICE_DROPS; drop += 1) {
      const leave = (drop / SPICE_DROPS) * (SPICE_LANDS - 0.2);
      const fall = (share - leave) / 0.2;

      if (fall < 0 || fall > 1) {
        continue;
      }
      const spot: Point = [
        tip[0] + spread(seed, drop) * size * 0.3,
        tip[1] + fall ** 1.5 * size * 2,
      ];

      orb(context, spot, size * 0.22, { color: CHILI_RED, alpha: 1 });
    }
    const heat = Math.max(0, (share - 0.2) / 0.8);

    if (heat <= 0) {
      return;
    }
    orb(context, at, size * 1.2, { color: CHILI_RED, alpha: swell(heat) * 0.6 });
    // Heat shimmer: wavy lines rising off it
    for (let wave = 0; wave < 4; wave += 1) {
      const rise = (heat * 1.4 + wave / 4) % 1;
      const x = at[0] + (wave - 1.5) * size * 0.5;
      const points: Point[] = [];

      for (let step = 0; step <= 6; step += 1) {
        const y = at[1] - size * 0.4 - rise * size * 1.6 - step * size * 0.18;

        points.push([x + Math.sin(step + share * 20 + wave) * size * 0.12, y]);
      }
      strokeThrough(
        context,
        points,
        1.6 * stage.scale,
        HEAT_ORANGE,
        swell(rise) * decay(heat) * 0.9,
      );
    }
    motes(context, [at[0], at[1] - size * 0.4], size * 1.6, many(10, weight), seed + 1, heat, {
      color: lighten(CHILI_RED, 0.25),
      alpha: decay(heat) * 0.7,
      width: 3 * stage.scale,
    });
  },

  // Twin tyres skidding round it, laying dark rings of tread on the
  // ground under grey exhaust, sparks flying off the grind
  Burnout(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.8];
    const spin = Math.min(1, share / 0.6);
    const shown = late(share, 0.7);

    for (let tyre = 0; tyre < 2; tyre += 1) {
      const radius = size * (1.8 + tyre * 0.5);
      const start = tyre * Math.PI;
      const points: Point[] = [];

      for (let step = 0; step <= 24; step += 1) {
        const angle = start + (step / 24) * spin * Math.PI * 2;

        points.push([
          foot[0] + Math.cos(angle) * radius,
          foot[1] + Math.sin(angle) * radius * 0.34,
        ]);
      }
      strokeThrough(context, points, 3.5 * stage.scale, TYRE_BLACK, shown * 0.7);
      const angle = start + spin * Math.PI * 2;
      const wheel: Point = [
        foot[0] + Math.cos(angle) * radius,
        foot[1] + Math.sin(angle) * radius * 0.34 - size * 0.4,
      ];

      // The wheel itself, its spokes turning
      body(context, wheel, size * 0.55, size * 0.55, 0, TYRE_BLACK, shown);
      orb(context, wheel, size * 0.25, { color: EXHAUST_GREY, alpha: shown });
      for (let spoke = 0; spoke < 3; spoke += 1) {
        const turn = share * 30 + (spoke / 3) * Math.PI;

        strokeThrough(
          context,
          [
            [wheel[0] - Math.cos(turn) * size * 0.4, wheel[1] - Math.sin(turn) * size * 0.4],
            [wheel[0] + Math.cos(turn) * size * 0.4, wheel[1] + Math.sin(turn) * size * 0.4],
          ],
          1.2 * stage.scale,
          EXHAUST_GREY,
          shown,
        );
      }
      burst(context, wheel, size * 1.2, 6, seed + tyre + Math.floor(share * 12), {
        color: GRIND_GOLD,
        alpha: shown,
        width: 2 * stage.scale,
      });
    }
    for (let cloud = 0; cloud < many(6, weight); cloud += 1) {
      const angle = noise(seed, cloud) * Math.PI * 2;
      const rise = (share * 1.2 + noise(seed, cloud + 10)) % 1;

      orb(
        context,
        [
          foot[0] + Math.cos(angle) * size * 2.2,
          foot[1] + Math.sin(angle) * size * 0.7 - rise * size * 1.4,
        ],
        size * (0.6 + rise * 0.6),
        { color: EXHAUST_GREY, alpha: swell(rise) * shown * 0.4 },
      );
    }
    orb(context, at, size * 1.2, { color: GRIND_GOLD, alpha: swell(share) * 0.4 });
  },

  // A crowd of little mice dashing in from every side, each one a pop
  // as it lands, one after another all over it
  Horde(context, stage, share, { seed, weight, hits = HORDE_MICE }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const count = Math.max(3, Math.min(HORDE_MICE, Math.round(hits)));

    for (let one = 0; one < count; one += 1) {
      const leave = (one / count) * (HORDE_ARRIVES - 0.2);
      const run = (share - leave) / 0.2;

      if (run < 0) {
        continue;
      }
      const angle = noise(seed, one) * Math.PI * 2;
      const spot: Point = [
        at[0] + spread(seed, one + 20) * size * 1.2,
        at[1] + spread(seed, one + 40) * size * 0.9,
      ];

      if (run < 1) {
        const from: Point = [
          spot[0] + Math.cos(angle) * size * 4.5,
          spot[1] + Math.sin(angle) * size * 2.5,
        ];
        const head = between(from, spot, run);

        edge(context, between(from, spot, Math.max(0, run - 0.4)), head, size * 0.25, 0, {
          color: MOUSE_WHITE,
          alpha: 0.5,
        });
        mouse(context, head, size * 0.5, Math.cos(angle) > 0 ? -1 : 1, 1);
        continue;
      }
      const pop = Math.min(1, (run - 1) * 1.6);

      if (pop >= 1) {
        continue;
      }
      ring(context, spot, size * (0.4 + pop * 1.1), {
        color: '#ffffff',
        alpha: decay(pop),
        width: 2.4 * stage.scale,
      });
      burst(context, spot, size * (0.6 + pop), 6, seed + one, {
        color: '#fff2a8',
        alpha: decay(pop),
        width: 2 * stage.scale,
      });
      mouse(context, [spot[0], spot[1] - pop * size * 0.8], size * 0.5, 1, decay(pop));
    }
    orb(context, at, size * 1.4, {
      color: '#fff6e0',
      alpha: swell(Math.min(1, share * 1.3)) * 0.35,
    });
  },

  // A huge ice-blue glaive swept down and across it, frost trailing off
  // its edge, and the cut left hanging as a pale crescent
  Glaive(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const pivot: Point = [at[0] + size * 2.4, at[1] + size * 1.2];
    const length = size * 4.6;
    const start = -Math.PI * 0.55;
    const end = -Math.PI * 1.1;
    const swing = Math.min(1, share / GLAIVE_LANDS) ** 1.4;
    const angle = start + (end - start) * swing;

    // The crescent of the cut, drawn behind the blade as it goes
    sickle(
      context,
      pivot,
      length * 0.85,
      start,
      angle,
      size * 0.9 * (1 + Math.max(0, share - GLAIVE_LANDS)),
      {
        color: GLAIVE_PALE,
        alpha: late(share, 0.6) * 0.75,
      },
    );
    if (share < GLAIVE_LANDS + 0.1) {
      const shown = late(share, GLAIVE_LANDS);
      const tip: Point = [pivot[0] + Math.cos(angle) * length, pivot[1] + Math.sin(angle) * length];
      const hilt = between(pivot, tip, 0.25);

      edge(context, hilt, tip, size * 0.75, 0, { color: GLAIVE_DARK, alpha: shown });
      edge(context, hilt, tip, size * 0.6, 0, { color: GLAIVE_ICE, alpha: shown });
      edge(context, between(hilt, tip, 0.2), tip, size * 0.2, 0, {
        color: GLAIVE_PALE,
        alpha: shown,
      });
      edge(context, pivot, hilt, size * 0.25, 0, { color: GLAIVE_DARK, alpha: shown });
      motes(context, tip, size * 1.2, 6, seed, swing, {
        color: GLAIVE_PALE,
        alpha: shown,
        width: 2 * stage.scale,
      });
    }
    if (share < GLAIVE_LANDS) {
      return;
    }
    const hit = (share - GLAIVE_LANDS) / (1 - GLAIVE_LANDS);

    orb(context, at, size * (1 + hit * 1.6), { color: GLAIVE_ICE, alpha: decay(hit) * 0.6 });
    shards(context, at, size * 2.8, many(12, weight), seed + 1, hit, {
      color: lighten(GLAIVE_ICE, 0.4),
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let glint = 0; glint < 3; glint += 1) {
      star(
        context,
        [at[0] + spread(seed, glint) * size * 1.6, at[1] + spread(seed, glint + 5) * size],
        size * 0.4,
        glint,
        {
          color: '#ffffff',
          alpha: swell(Math.min(1, hit * 2 + glint * 0.1)),
        },
      );
    }
  },

  // White salt cubes clattering down onto it and settling in a crust
  // round its feet, a few crystals glinting as they set
  Salt(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.8];
    const shown = late(share, 0.75);
    const crust = Math.min(1, Math.max(0, (share - SALT_FALLS) / 0.4));

    ripple(context, foot, size * (1.2 + crust * 0.8), {
      color: SALT_WHITE,
      alpha: crust * shown * 0.8,
      width: 5 * stage.scale,
    });
    for (let one = 0; one < SALT_CUBES; one += 1) {
      const lands = SALT_FALLS + (one / SALT_CUBES) * 0.35;
      const leave = lands - 0.25;
      const angle = (one / SALT_CUBES) * Math.PI * 2 + noise(seed, one) * 0.5;
      const rest: Point = [
        foot[0] + Math.cos(angle) * size * 1.6,
        foot[1] + Math.sin(angle) * size * 0.5,
      ];
      const turn = noise(seed, one + 20) * Math.PI;

      if (share < leave) {
        continue;
      }
      if (share < lands) {
        const fall = ((share - leave) / 0.25) ** 1.6;
        const hit: Point = [at[0] + spread(seed, one + 40) * size * 0.6, at[1] - size * 0.3];

        cube(
          context,
          between([hit[0], hit[1] - size * 4], hit, fall),
          size * 0.3,
          turn + fall * 4,
          1,
        );
        continue;
      }
      // Off the body and down to its place in the crust
      const settle = Math.min(1, (share - lands) / 0.15);
      const hit: Point = [at[0] + spread(seed, one + 40) * size * 0.6, at[1] - size * 0.3];
      const spot = between(hit, rest, settle);

      cube(context, [spot[0], spot[1] - swell(settle) * size * 0.5], size * 0.3, turn, shown);
      if (settle < 1) {
        burst(context, hit, size * 0.6, 5, seed + one, {
          color: '#ffffff',
          alpha: decay(settle),
          width: 1.6 * stage.scale,
        });
      }
      star(context, [spot[0], spot[1] - size * 0.2], size * 0.35, share * 5, {
        color: '#ffffff',
        alpha: swell((share * 2.5 + noise(seed, one + 60)) % 1) * shown,
      });
    }
  },

  // Three heads popping up out of the ground under it one after
  // another, each in a splash of water
  Divers(context, stage, share, { seed, weight, hits = DIVERS_HEADS }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.8];
    const count = Math.max(1, Math.min(DIVERS_HEADS, Math.round(hits)));

    for (let head = 0; head < count; head += 1) {
      const up = (share - head * DIVERS_GAP) / 0.45;

      if (up < 0 || up > 1) {
        continue;
      }
      const base: Point = [
        foot[0] + (head - (count - 1) / 2) * size * 1.3,
        foot[1] + (head % 2) * size * 0.2,
      ];
      const rise = swell(Math.min(1, up * 1.2));
      const top: Point = [base[0], base[1] - rise * size * 2.6];

      ripple(context, base, size * 0.8, { color: DIVE_HOLE, alpha: 0.7, width: 4 * stage.scale });
      orb(context, base, size * 0.7, { color: DIVE_HOLE, alpha: 0.5 });
      if (rise > 0.05) {
        edge(context, base, top, size * 0.45, 0, { color: WUGTRIO_RED, alpha: 1 });
        body(context, top, size * 0.45, size * 0.4, 0, WUGTRIO_RED, 1);
        edge(context, top, [top[0] - size * 0.7, top[1] + size * 0.6], size * 0.18, -size * 0.2, {
          color: WUGTRIO_BLUE,
          alpha: 1,
        });
        edge(context, top, [top[0] + size * 0.7, top[1] + size * 0.6], size * 0.18, size * 0.2, {
          color: WUGTRIO_BLUE,
          alpha: 1,
        });
        orb(context, [top[0] - size * 0.15, top[1] - size * 0.05], size * 0.12, {
          color: '#ffffff',
          alpha: 1,
        });
        orb(context, [top[0] + size * 0.15, top[1] - size * 0.05], size * 0.12, {
          color: '#ffffff',
          alpha: 1,
        });
      }
      ripple(context, base, size * (0.6 + up * 1.6), {
        color: DIVE_WATER,
        alpha: decay(up),
        width: 2.4 * stage.scale,
      });
      motes(
        context,
        [base[0], base[1] - size * 0.4],
        size * 1.6,
        many(8, weight),
        seed + head,
        up,
        {
          color: lighten(DIVE_WATER, 0.3),
          alpha: decay(up),
          width: 2.4 * stage.scale,
        },
      );
    }
  },

  // A ring of sharp crystal petals spinning round it, slicing, and
  // poison flung off them as they go
  Spinner(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = Math.min(1, share * 6) * late(share, 0.7);
    const radius = size * (2.6 - Math.min(1, share * 3) * 0.9);

    ripple(context, [at[0], at[1] + size * 0.3], radius, {
      color: GLIMMORA_PINK,
      alpha: shown * 0.5,
      width: 2 * stage.scale,
    });
    for (let one = 0; one < SPINNER_PETALS; one += 1) {
      const angle = (one / SPINNER_PETALS) * Math.PI * 2 + share * Math.PI * 5;
      const spot: Point = [
        at[0] + Math.cos(angle) * radius,
        at[1] + size * 0.3 + Math.sin(angle) * radius * 0.4,
      ];
      const facing = Math.atan2(Math.cos(angle) * 0.4, -Math.sin(angle)) + Math.PI / 2;

      petal(context, spot, size * 0.75, facing, { color: GLIMMORA_VIOLET, alpha: shown });
      petal(context, spot, size * 0.55, facing, { color: GLIMMORA_PINK, alpha: shown });
    }
    for (let cut = 0; cut < 3; cut += 1) {
      const pass = (share * 3 + cut / 3) % 1;

      slash(context, at, size * 1.4, cut * 1.1 + 0.4, {
        color: lighten(GLIMMORA_PINK, 0.4),
        alpha: swell(pass) * shown,
        width: 2.4 * stage.scale,
      });
    }
    motes(context, at, radius * 1.4, many(12, weight), seed, share, {
      color: SPINNER_POISON,
      alpha: shown * 0.9,
      width: 2.4 * stage.scale,
    });
  },

  // Bright scribbles drawn across it in quick loops, a pen in each
  // colour, and a splash of paint left on it after
  Doodle(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const shown = late(share, 0.8);

    for (const [line, colour] of DOODLE_COLOURS.entries()) {
      const drawn = Math.min(1, Math.max(0, (share - line * 0.06) / (DOODLE_DRAWN - 0.24)));

      if (drawn <= 0) {
        continue;
      }
      const left: Point = [at[0] - size * 1.4, at[1] + spread(seed, line) * size * 0.9];
      const loops = 3 + Math.floor(noise(seed, line + 10) * 2);
      const steps = Math.ceil(drawn * 40);
      const points: Point[] = [];

      for (let step = 0; step <= steps; step += 1) {
        const t = step / 40;
        const turn = t * loops * Math.PI * 2;

        points.push([
          left[0] + t * size * 2.8 + Math.cos(turn) * size * 0.3,
          left[1] + Math.sin(turn) * size * 0.35,
        ]);
      }
      strokeThrough(context, points, 2.6 * stage.scale, colour, shown);
      if (drawn < 1) {
        orb(context, points[points.length - 1], size * 0.2, { color: '#ffffff', alpha: 1 });
      }
    }
    if (share < DOODLE_DRAWN) {
      return;
    }
    const mark = (share - DOODLE_DRAWN) / (1 - DOODLE_DRAWN);
    const colour = DOODLE_COLOURS[Math.floor(noise(seed, 30) * DOODLE_COLOURS.length)];

    star(context, at, size * (0.6 + swell(Math.min(1, mark * 3)) * 0.3), noise(seed, 31) * 2, {
      color: colour,
      alpha: late(mark, 0.4),
    });
    motes(context, at, size * 1.4, 6, seed + 2, mark, {
      color: colour,
      alpha: late(mark, 0.4),
      width: 2.6 * stage.scale,
    });
  },

  // Thin pale slices peeling off its body and falling away, and the
  // caster left lighter, with speed lines and a sharp glint
  Fillet(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;

    for (let slice = 0; slice < FILLET_SLICES; slice += 1) {
      const leave = (slice / FILLET_SLICES) * (FILLET_PEELS - 0.3);
      const peel = (share - leave) / 0.45;

      if (peel < 0 || peel > 1) {
        continue;
      }
      const side = slice % 2 === 0 ? -1 : 1;
      const from: Point = [
        at[0] + side * size * 0.6,
        at[1] + (slice / FILLET_SLICES - 0.5) * size * 1.4,
      ];
      const spot: Point = [from[0] + side * peel * size * 1.2, from[1] + peel ** 2 * size * 2];
      const turn = Math.PI / 2 + side * peel * 1.6;
      const half: Point = [Math.cos(turn) * size * 0.7, Math.sin(turn) * size * 0.7];

      edge(
        context,
        [spot[0] - half[0], spot[1] - half[1]],
        [spot[0] + half[0], spot[1] + half[1]],
        size * 0.2,
        side * size * 0.15,
        {
          color: FILLET_PINK,
          alpha: decay(peel),
        },
      );
      edge(
        context,
        [spot[0] - half[0], spot[1] - half[1]],
        [spot[0] + half[0], spot[1] + half[1]],
        size * 0.13,
        side * size * 0.15,
        {
          color: FILLET_PALE,
          alpha: decay(peel),
        },
      );
    }
    const light = Math.max(0, (share - 0.3) / 0.7);

    if (light <= 0) {
      return;
    }
    for (let line = 0; line < 5; line += 1) {
      const run = (light * 2 + noise(seed, line)) % 1;
      const y = at[1] + (line - 2) * size * 0.35;
      const x = at[0] + size * (0.8 + run * 1.6);

      edge(context, [x, y], [x + size * 1.2, y], size * 0.06, 0, {
        color: FILLET_PALE,
        alpha: swell(run) * late(light, 0.6),
      });
      edge(context, [2 * at[0] - x, y], [2 * at[0] - x - size * 1.2, y], size * 0.06, 0, {
        color: FILLET_PALE,
        alpha: swell(run) * late(light, 0.6),
      });
    }
    star(
      context,
      [at[0] + size * 0.5, at[1] - size * 0.7],
      size * (0.4 + swell(light) * 0.4),
      light * 2,
      {
        color: '#ffffff',
        alpha: swell(light),
      },
    );
  },

  // A bow first, the caster's shadow dipping toward it, then a golden
  // blade arc slashing up from below across it, held, then breaking
  Kowtow(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dip = Math.min(1, share / KOWTOW_BOWS);
    const ground: Point = [stage.source[0], stage.source[1] + size * 0.9];

    // The caster's shadow stretching forward as it bows
    edge(context, ground, between(ground, at, 0.15 + swell(dip) * 0.15), size * 0.9, 0, {
      color: KINGAMBIT_DARK,
      alpha: 0.4 * late(share, 0.4),
    });
    star(
      context,
      [stage.source[0], stage.source[1] - size * 1.2 + swell(dip) * size * 0.6],
      size * 0.5,
      share * 3,
      {
        color: KINGAMBIT_GOLD,
        alpha: swell(dip),
      },
    );
    if (share < KOWTOW_BOWS) {
      return;
    }
    const cut = (share - KOWTOW_BOWS) / (1 - KOWTOW_BOWS);
    const centre: Point = [at[0] - size * 1.6, at[1] + size * 1.6];
    const radius = size * Math.SQRT2 * 1.6;
    const start = Math.PI * 0.15;
    const end = start - Math.min(1, cut * 4) * Math.PI * 0.85;
    const holding = share < KOWTOW_BREAKS;

    if (holding) {
      sickle(context, centre, radius, start, end, size * 1.1, {
        color: KINGAMBIT_DARK,
        alpha: 0.5,
      });
      sickle(context, centre, radius, start, end, size * 0.8, { color: KINGAMBIT_GOLD, alpha: 1 });
      sickle(context, centre, radius, start, end, size * 0.25, { color: '#fff4cc', alpha: 1 });
      orb(context, at, size * 1.2, {
        color: KINGAMBIT_GOLD,
        alpha: swell(Math.min(1, cut * 2)) * 0.5,
      });
      return;
    }
    const broken = (share - KOWTOW_BREAKS) / (1 - KOWTOW_BREAKS);

    // The arc in pieces, each drifting out from where it broke
    for (let piece = 0; piece < 6; piece += 1) {
      const from = start - (piece / 6) * Math.PI * 0.85;
      const to = start - ((piece + 0.8) / 6) * Math.PI * 0.85;
      const out = radius + broken * size * (0.6 + noise(seed, piece) * 0.8);

      sickle(context, centre, out, from, to, size * 0.6 * decay(broken * 0.5), {
        color: KINGAMBIT_GOLD,
        alpha: decay(broken),
      });
    }
    shards(context, at, size * 2.4, many(10, weight), seed, broken, {
      color: KINGAMBIT_GOLD,
      alpha: decay(broken),
      width: 3 * stage.scale,
    });
    burst(context, at, size * (1.2 + broken * 1.6), 10, seed + 1, {
      color: '#fff4cc',
      alpha: decay(broken),
      width: 2.4 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default paldeaRoutes;
