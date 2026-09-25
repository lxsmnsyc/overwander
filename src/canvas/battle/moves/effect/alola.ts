import type { Point } from '../../stage';
import {
  beam,
  between,
  burst,
  decay,
  edge,
  fade,
  hoop,
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
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { settle, showing } from './stats';

/** Sunsteel Strike: the share the meteor comes down on it */
export const SUNSTEEL_LANDS = 0.45;

/** Moongeist Beam: the share the crescent has risen by and fires */
export const MOONGEIST_FIRE = 0.3;

/** Photon Geyser: the share the light has gathered under it by */
export const PHOTON_BURST = 0.3;

/** Prismatic Laser: the share the prism has charged by */
export const PRISM_FIRE = 0.25;

/** Core Enforcer: the share the Z is finished and bursts */
export const ENFORCER_BURST = 0.6;

/** Spirit Shackle: the share the arrow pins its shadow */
export const SHACKLE_PINS = 0.3;

/** Anchor Shot: the share the anchor lands */
export const ANCHOR_LANDS = 0.4;

/** Darkest Lariat: the share the spin reaches it */
export const LARIAT_HITS = 0.5;

/** Nature's Madness: the share the swirl closes and crushes it */
export const MADNESS_CRUSH = 0.6;

/** Pollen Puff: the share the ball bursts */
export const POLLEN_BURSTS = 0.4;

/** Mind Blown: the share the head goes off, and the share the blast lands */
export const DETONATE_BLOWS = 0.12;
export const DETONATE_LANDS = 0.45;

/** Mind Blown: one seed for the caster's own blast, so every landing draws it the same */
export const HEAD_SEED = 7;

/** Solgaleo's sun and white-hot steel */
export const SUN_GOLD = '#ffc23a';
export const SUN_FIRE = '#ff7a2a';
export const STEEL_WHITE = '#eef4ff';

/** Lunala's moonlight and the dark it leaves */
export const MOON_VIOLET = '#9a6cff';
export const MOON_DARK = '#24103a';

/** Necrozma's white-gold light */
export const PHOTON_GOLD = '#ffe7a0';

/** Prismatic Laser: the rainbow round its edge, outermost first */
export const PRISM_TONES = [
  '#e06cff',
  '#8a6cff',
  '#5ac8ff',
  '#6ae07a',
  '#ffe95a',
  '#ffb04a',
  '#ff5a5a',
];

/** Zygarde's green */
export const ENFORCER_GREEN = '#4ee07a';

/** Aurora Veil: its three curtains */
export const AURORA_TONES = ['#6affb0', '#5ad8e8', '#b08aff'];

/** Spirit Shackle: the arrow and chain, and the shadow they pin */
export const SPECTRAL = '#c0b0ff';
export const SHADOW = '#140c1e';

/** Anchor Shot: the anchor and its chain */
export const IRON = '#8a96a8';

/** Darkest Lariat: the dark flame and its embers */
export const DARK_FLAME = '#4a1830';
export const EMBER = '#ff5a3a';

/** Nature's Madness: the pastel light the four Tapus share */
export const MADNESS_TONES = ['#ffb0d8', '#b0e0ff', '#c8f5a8', '#fff0a8'];

/** Spotlight: the lamp's light */
export const SPOT_LIGHT = '#fff6d0';

/** Pollen Puff: the pollen */
export const POLLEN = '#ffd23a';

/** Mind Blown: the firework colours thrown off the caster's head */
export const FIREWORK_TONES = ['#ff5a3a', '#ffd84a', '#ff8ad0', '#8ad8ff'];

/** The white-hot middle of a blast */
export const HOT = '#ffd84a';

/** A four-pointed sparkle */
function glint(
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

/** A straight band of even width with round ends */
function band(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  width: number,
  color: string,
  alpha: number,
): void {
  if (!(width > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.moveTo(from[0], from[1]);
  context.lineTo(to[0], to[1]);
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.lineCap = 'round';
  context.stroke();
}

/** A flat filled oval, for a shadow or a dark glow */
function blot(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  down: number,
  color: string,
  alpha: number,
): void {
  if (!(across > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, across, down, 0, 0, Math.PI * 2);
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
  band(context, from, to, width, color, alpha);

  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const head = width * 3.5;

  context.beginPath();
  context.moveTo(to[0], to[1]);
  context.lineTo(to[0] - Math.cos(angle - 0.5) * head, to[1] - Math.sin(angle - 0.5) * head);
  context.lineTo(to[0] - Math.cos(angle + 0.5) * head, to[1] - Math.sin(angle + 0.5) * head);
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** One link of a chain, turned along the chain; every other one is seen edge-on */
function link(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  edgeOn: boolean,
  color: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, size, size * (edgeOn ? 0.16 : 0.5), turn, 0, Math.PI * 2);
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = size * 0.3;
  context.stroke();
}

/** A chain of links run straight from one point to another */
function chain(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  const turn = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const count = Math.max(
    2,
    Math.round(Math.hypot(to[0] - from[0], to[1] - from[1]) / (size * 1.6)),
  );

  for (let at = 0; at < count; at += 1) {
    link(context, between(from, to, at / count), size, turn, at % 2 === 1, color, alpha);
  }
}

/** An anchor with its crown at the bottom when `turn` is 0 */
function anchor(
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
  context.save();
  context.translate(x, y);
  context.rotate(turn);
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = size * 0.18;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(0, -size);
  context.lineTo(0, size * 0.7);
  context.moveTo(-size * 0.45, -size * 0.65);
  context.lineTo(size * 0.45, -size * 0.65);
  context.stroke();
  context.beginPath();
  context.ellipse(0, size * 0.1, size * 0.7, size * 0.6, 0, Math.PI * 0.15, Math.PI * 0.85);
  context.stroke();
  context.beginPath();
  context.ellipse(0, -size * 1.15, size * 0.18, size * 0.18, 0, 0, Math.PI * 2);
  context.stroke();
  // The flukes, pointing back up at the tips of the arms
  context.fillStyle = fade(color, alpha);
  for (const side of [-1, 1]) {
    const tip: Point = [side * size * 0.63, size * 0.36];

    context.beginPath();
    context.moveTo(tip[0], tip[1] - size * 0.3);
    context.lineTo(tip[0] + side * size * 0.18, tip[1] + size * 0.08);
    context.lineTo(tip[0] - side * size * 0.18, tip[1] + size * 0.08);
    context.closePath();
    context.fill();
  }
  context.restore();
}

/** A hexagon outline, Zygarde's cell */
function hexagon(
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
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = turn + (corner / 6) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * size,
      y + Math.sin(angle) * size,
    );
  }
  context.closePath();
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = size * 0.25;
  context.stroke();
}

const alola = {
  // A sun disc flaring round the caster, then the caster coming down on it as a white-hot steel meteor
  Sunsteel(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];

    if (share < SUNSTEEL_LANDS) {
      const charge = Math.min(1, share / 0.15);
      const flight = Math.max(0, (share - 0.12) / (SUNSTEEL_LANDS - 0.12));
      const place = (along: number): Point => {
        const spot = between(stage.source, at, along);

        return [spot[0], spot[1] - Math.sin(Math.PI * along) * size * 3];
      };
      const head = place(flight ** 1.5);

      orb(context, head, size * (1 + charge * 0.8), { color: SUN_GOLD, alpha: charge * 0.6 });
      ring(context, head, size * (1.2 + charge * 0.4), {
        color: SUN_GOLD,
        alpha: charge * 0.8,
        width: 3 * stage.scale,
      });
      for (let ray = 0; ray < 12; ray += 1) {
        const angle = (ray / 12) * Math.PI * 2 + share * 3;
        const outer = size * (1.5 + noise(seed, ray) * 0.6 * charge);

        band(
          context,
          [head[0] + Math.cos(angle) * size * 1.3, head[1] + Math.sin(angle) * size * 1.3],
          [head[0] + Math.cos(angle) * outer, head[1] + Math.sin(angle) * outer],
          size * 0.12,
          SUN_GOLD,
          charge * 0.7,
        );
      }
      if (flight > 0) {
        const tail = place(Math.max(0, flight - 0.3) ** 1.5);

        edge(context, tail, head, size * 1.2, 0, { color: SUN_FIRE, alpha: 0.7 });
        edge(context, tail, head, size * 0.5, 0, { color: STEEL_WHITE, alpha: 1 });
        motes(context, tail, size * 1.2, 8, seed, flight, {
          color: SUN_GOLD,
          alpha: 0.8,
          width: 2 * stage.scale,
        });
      }
      orb(context, head, size * 0.7, { color: STEEL_WHITE, alpha: 1 });
      return;
    }
    const hit = (share - SUNSTEEL_LANDS) / (1 - SUNSTEEL_LANDS);

    orb(context, at, size * (1.2 + hit * 2), { color: SUN_FIRE, alpha: decay(hit) * 0.8 });
    orb(context, at, size * (0.8 + hit * 1.2), {
      color: STEEL_WHITE,
      alpha: decay(Math.min(1, hit * 1.6)),
    });
    glint(context, at, size * (1.6 + hit * 2), 0, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      if (held > 0) {
        ring(context, at, size * (0.8 + held * 3), {
          color: SUN_GOLD,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    ripple(context, foot, size * (1 + hit * 3), {
      color: SUN_FIRE,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    burst(context, at, size * (2 + hit * 2), 16, seed, {
      color: SUN_GOLD,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.4, many(10, weight), seed, hit, {
      color: mix(paint.color, STEEL_WHITE, 0.4),
      alpha: late(hit, 0.5),
    });
    motes(context, at, size * 3, many(14, weight), seed, hit, {
      color: SUN_FIRE,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A crescent moon rising over the caster, a violet beam out of it, and a dark ghostly glow where it lands
  Moongeist(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const moon: Point = [stage.source[0], stage.source[1] - size * 2.2];
    const rise = Math.min(1, share / MOONGEIST_FIRE);
    const kept = late(share, 0.6);
    const pale = lighten(MOON_VIOLET, 0.6);

    orb(context, moon, size * 1.6 * rise, { color: MOON_VIOLET, alpha: kept * 0.4 });
    sickle(context, moon, size * 1.1 * rise, Math.PI * 0.55, Math.PI * 1.45, size * 0.55, {
      color: pale,
      alpha: kept,
    });
    if (share < MOONGEIST_FIRE) {
      motes(context, moon, size * 2, 10, seed, 1 - rise, {
        color: pale,
        alpha: rise,
        width: 2 * stage.scale,
      });
      return;
    }
    const fired = (share - MOONGEIST_FIRE) / (1 - MOONGEIST_FIRE);
    const drawn = Math.min(1, fired * 5);
    const thick = Math.min(1, fired * 4) * late(fired, 0.55);

    beam(context, moon, at, drawn, size * 1.6 * thick, { color: MOON_VIOLET, alpha: 0.6 });
    beam(context, moon, at, drawn, size * 0.6 * thick, { color: pale, alpha: 1 });
    if (drawn < 1) {
      return;
    }
    const glow = (fired - 0.2) / 0.8;
    const round = size * (1.4 + glow * 1.2);

    blot(context, at, round, round, MOON_DARK, late(glow, 0.4) * 0.7);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, glow * 1.5 - wave * 0.25));

      if (held > 0) {
        ring(context, at, size * (0.6 + held * 2.6), {
          color: MOON_VIOLET,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    // Wisps curling up off it
    for (let wisp = 0; wisp < many(8, weight); wisp += 1) {
      const up = (share * 1.6 + noise(seed, wisp)) % 1;

      petal(
        context,
        [
          at[0] + spread(seed, wisp + 10) * size * 1.6 + Math.sin(up * 6 + wisp) * size * 0.3,
          at[1] + size * 0.6 - up * size * 3,
        ],
        size * 0.35 * (1 - up * 0.5),
        Math.sin(up * 4 + wisp) * 0.6,
        { color: pale, alpha: swell(up) * late(glow, 0.5) * 0.8 },
      );
    }
    glint(context, at, size * (1.2 + glow * 1.4), glow, '#ffffff', decay(Math.min(1, glow * 2)));
  },

  // Light drawn in to a point under it, then a pillar of white-gold light bursting up through it
  Photon(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];

    if (share < PHOTON_BURST) {
      const gather = share / PHOTON_BURST;
      const count = many(12, weight);

      ripple(context, foot, size * (3 - gather * 2.4), {
        color: PHOTON_GOLD,
        alpha: gather * 0.8,
        width: 3 * stage.scale,
      });
      for (let mote = 0; mote < count; mote += 1) {
        const angle = (mote / count) * Math.PI * 2 + noise(seed, mote) * 0.4;
        const out = size * 3.2 * (1 - gather) * (0.6 + noise(seed, mote + 10) * 0.4);

        band(
          context,
          [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34],
          [foot[0] + Math.cos(angle) * out * 0.8, foot[1] + Math.sin(angle) * out * 0.27],
          size * 0.1,
          PHOTON_GOLD,
          gather,
        );
      }
      orb(context, foot, size * (0.3 + gather * 0.8), { color: PHOTON_GOLD, alpha: gather });
      glint(context, foot, size * gather * 1.2, share * 4, '#ffffff', gather);
      return;
    }
    const erupt = (share - PHOTON_BURST) / (1 - PHOTON_BURST);
    const kept = late(erupt, 0.5);
    const top: Point = [foot[0], foot[1] - size * 9 * Math.min(1, erupt * 4)];

    beam(context, foot, top, 1, size * 2.6 * kept, { color: PHOTON_GOLD, alpha: kept * 0.7 });
    beam(context, foot, top, 1, size * 1.1 * kept, { color: '#ffffff', alpha: kept });
    orb(context, at, size * (1.2 + swell(erupt) * 1.2), { color: PHOTON_GOLD, alpha: kept });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, erupt * 1.5 - wave * 0.25));

      if (held > 0) {
        ripple(context, foot, size * (1 + held * 3.4), {
          color: PHOTON_GOLD,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    for (let spark = 0; spark < many(14, weight); spark += 1) {
      const up = (share * 1.8 + noise(seed, spark)) % 1;

      glint(
        context,
        [foot[0] + spread(seed, spark + 20) * size * 1.3, foot[1] - up * (foot[1] - top[1])],
        size * 0.3 * swell(up),
        up * 3,
        '#ffffff',
        kept,
      );
    }
    glint(
      context,
      at,
      size * (2 + erupt * 2),
      share * 2,
      '#ffffff',
      decay(Math.min(1, erupt * 2.5)),
    );
  },

  // A prism of light turning on the caster, then a thick beam edged in every colour, and rainbow rings off the hit
  Prism(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const charge = Math.min(1, share / PRISM_FIRE);

    if (share < PRISM_FIRE + 0.1) {
      const kept = share < PRISM_FIRE ? 1 : decay((share - PRISM_FIRE) / 0.1);

      context.beginPath();
      for (let corner = 0; corner < 3; corner += 1) {
        const angle = share * 8 + (corner / 3) * Math.PI * 2 - Math.PI / 2;

        context[corner === 0 ? 'moveTo' : 'lineTo'](
          stage.source[0] + Math.cos(angle) * size * 1.3,
          stage.source[1] + Math.sin(angle) * size * 1.3,
        );
      }
      context.closePath();
      context.strokeStyle = fade('#ffffff', kept * charge);
      context.lineWidth = 2.4 * stage.scale;
      context.stroke();
      for (const [tone, color] of PRISM_TONES.entries()) {
        ring(context, stage.source, size * (0.5 + tone * 0.14) * (0.4 + charge * 0.6), {
          color,
          alpha: kept * charge * 0.7,
          width: 1.6 * stage.scale,
        });
      }
      orb(context, stage.source, size * (0.4 + charge), { color: '#ffffff', alpha: kept * charge });
    }
    if (share < PRISM_FIRE) {
      return;
    }
    const fired = (share - PRISM_FIRE) / (1 - PRISM_FIRE);
    const drawn = Math.min(1, fired * 6);
    const thick = Math.min(1, fired * 4) * late(fired, 0.6);
    const head = between(stage.source, at, drawn);

    // Widest first, so each narrower colour lies over the one outside it
    for (const [tone, color] of PRISM_TONES.entries()) {
      band(context, stage.source, head, size * (2.5 - tone * 0.24) * thick, color, thick);
    }
    band(context, stage.source, head, size * 0.7 * thick, '#ffffff', thick);
    if (drawn < 1) {
      return;
    }
    const hit = (fired - 1 / 6) / (5 / 6);

    orb(context, at, size * (1.2 + swell(hit) * 1.2), {
      color: '#ffffff',
      alpha: Math.max(thick, decay(hit)),
    });
    for (const [tone, color] of PRISM_TONES.entries()) {
      const held = Math.max(0, Math.min(1, hit * 1.4 - tone * 0.06));

      if (held > 0) {
        ring(context, at, size * (0.8 + held * 3 + tone * 0.15), {
          color,
          alpha: decay(held),
          width: 2.2 * stage.scale,
        });
      }
    }
    burst(context, at, size * (2 + hit * 2), 14, seed, {
      color: '#ffffff',
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
  },

  // A green beam reaching over from the caster and tracing a Z across it, then the Z bursting
  Enforcer(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const wide = size * 1.8;
    const tall = size * 1.5;
    const corners: Point[] = [
      [at[0] - wide, at[1] - tall],
      [at[0] + wide, at[1] - tall],
      [at[0] - wide, at[1] + tall],
      [at[0] + wide, at[1] + tall],
    ];
    const light = lighten(ENFORCER_GREEN, 0.55);
    const traced = Math.max(0, Math.min(1, (share - 0.1) / (ENFORCER_BURST - 0.1)));
    const kept =
      share < ENFORCER_BURST ? 1 : decay(((share - ENFORCER_BURST) / (1 - ENFORCER_BURST)) * 1.6);

    if (share < 0.2) {
      beam(
        context,
        stage.source,
        corners[0],
        Math.min(1, share / 0.1),
        size * 0.5 * decay(Math.max(0, (share - 0.1) / 0.1)),
        { color: ENFORCER_GREEN, alpha: 1 },
      );
    }
    // Three strokes of the Z, each drawn in its turn
    let head = corners[0];

    for (let stroke = 0; stroke < 3; stroke += 1) {
      const along = Math.max(0, Math.min(1, traced * 3 - stroke));

      if (along <= 0) {
        break;
      }
      head = between(corners[stroke], corners[stroke + 1], along);
      band(context, corners[stroke], head, size * 0.7, ENFORCER_GREEN, kept * 0.5);
      band(context, corners[stroke], head, size * 0.24, light, kept);
    }
    if (traced < 1) {
      orb(context, head, size * 0.6, { color: light, alpha: Math.min(1, share * 8) });
    }
    if (share < ENFORCER_BURST) {
      return;
    }
    const blast = (share - ENFORCER_BURST) / (1 - ENFORCER_BURST);

    orb(context, at, size * (1.2 + blast * 2), {
      color: ENFORCER_GREEN,
      alpha: decay(blast) * 0.8,
    });
    for (let cell = 0; cell < many(8, weight); cell += 1) {
      const angle = noise(seed, cell) * Math.PI * 2;
      const out = size * (1 + blast * 3 * (0.5 + noise(seed, cell + 10) * 0.5));

      hexagon(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        size * 0.35,
        blast * 2 + cell,
        light,
        decay(blast),
      );
    }
    ring(context, at, size * (0.8 + blast * 3), {
      color: ENFORCER_GREEN,
      alpha: decay(blast),
      width: 3 * stage.scale,
    });
    burst(context, at, size * (2 + blast * 2), 12, seed, {
      color: light,
      alpha: decay(blast),
      width: 2.6 * stage.scale,
    });
  },

  // Rippling curtains of green, teal and violet light hung over it, and glints drifting down out of them
  Aurora(context, stage, share, { seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.7);
    const wide = size * 2.6;
    const foot: Point = [at[0], at[1] + size * 0.9];

    for (const [curtain, color] of AURORA_TONES.entries()) {
      const top = at[1] - size * (2.6 + curtain * 0.5);
      const deep = size * (1.6 - curtain * 0.2) * Math.min(1, share * 3);
      const across = (step: number): number => at[0] - wide + (step / 12) * wide * 2;
      const wave = (step: number): number =>
        top + Math.sin(step * 0.9 + share * 7 + curtain * 1.7) * size * 0.35;

      context.beginPath();
      for (let step = 0; step <= 12; step += 1) {
        context[step === 0 ? 'moveTo' : 'lineTo'](across(step), wave(step));
      }
      for (let step = 12; step >= 0; step -= 1) {
        context.lineTo(
          across(step),
          wave(step) + deep * (0.7 + 0.3 * Math.sin(step * 1.3 + share * 5)),
        );
      }
      context.closePath();
      context.fillStyle = fade(color, shown * 0.35);
      context.fill();
      // The bright hem along its top
      context.beginPath();
      for (let step = 0; step <= 12; step += 1) {
        context[step === 0 ? 'moveTo' : 'lineTo'](across(step), wave(step));
      }
      context.strokeStyle = fade(lighten(color, 0.5), shown * 0.9);
      context.lineWidth = 2.4 * stage.scale;
      context.stroke();
    }
    for (let fleck = 0; fleck < 10; fleck += 1) {
      const fall = (share * 1.2 + noise(seed, fleck)) % 1;

      glint(
        context,
        [at[0] + spread(seed, fleck + 20) * wide, at[1] - size * 2.4 + fall * size * 3.2],
        size * 0.22 * swell(fall),
        fall * 3,
        '#ffffff',
        shown,
      );
    }
    ripple(context, foot, size * (1.4 + swell(share) * 0.6), {
      color: AURORA_TONES[1],
      alpha: shown * 0.6,
      width: 2.4 * stage.scale,
    });
  },

  // A ghostly arrow shot into its shadow and pinning it, and a ring of spectral chain round the floor
  Shackle(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const pin: Point = [at[0] - size * 0.3, foot[1] + size * 0.15];
    const bright = lighten(SPECTRAL, 0.4);

    blot(context, foot, size * 1.3, size * 0.42, SHADOW, late(share, 0.6) * 0.6);
    if (share < SHACKLE_PINS) {
      const flight = share / SHACKLE_PINS;
      const tip = between(stage.source, pin, flight);

      edge(context, between(stage.source, pin, Math.max(0, flight - 0.25)), tip, size * 0.5, 0, {
        color: SPECTRAL,
        alpha: 0.35,
      });
      arrow(
        context,
        between(stage.source, pin, Math.max(0, flight - 0.12)),
        tip,
        size * 0.09,
        bright,
        1,
      );
      return;
    }
    const held = (share - SHACKLE_PINS) / (1 - SHACKLE_PINS);
    const kept = late(held, 0.6);
    const angle = Math.atan2(pin[1] - stage.source[1], pin[0] - stage.source[0]);
    const links = 14;

    // The arrow stays standing in the shadow, its shaft still pointing back the way it came
    arrow(
      context,
      [pin[0] - Math.cos(angle) * size * 1.4, pin[1] - Math.sin(angle) * size * 1.4],
      pin,
      size * 0.09,
      bright,
      kept,
    );
    if (held < 0.25) {
      ring(context, pin, size * (0.3 + held * 3), {
        color: SPECTRAL,
        alpha: decay(held / 0.25),
        width: 2.4 * stage.scale,
      });
    }
    for (let one = 0; one < links; one += 1) {
      const round = Math.min(1, held * 3 - one / links);
      const turn = (one / links) * Math.PI * 2 + share * 0.8;

      if (round <= 0) {
        continue;
      }
      link(
        context,
        [foot[0] + Math.cos(turn) * size * 1.9, foot[1] + Math.sin(turn) * size * 0.65],
        size * 0.26,
        Math.atan2(Math.cos(turn) * 0.34, -Math.sin(turn)),
        one % 2 === 1,
        SPECTRAL,
        kept * round,
      );
    }
    for (let wisp = 0; wisp < many(6, weight); wisp += 1) {
      const up = (share * 1.4 + noise(seed, wisp)) % 1;

      orb(
        context,
        [foot[0] + spread(seed, wisp + 10) * size * 1.2, foot[1] - up * size * 2.4],
        size * 0.22,
        { color: SPECTRAL, alpha: swell(up) * kept * 0.6 },
      );
    }
  },

  // An anchor swung on its chain over onto it, a heavy landing, and the chain wound round it
  Anchor(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];

    if (share < ANCHOR_LANDS) {
      const swing = (share / ANCHOR_LANDS) ** 1.5;
      const place = (along: number): Point => {
        const spot = between(stage.source, at, along);

        return [spot[0], spot[1] - Math.sin(Math.PI * along) * size * 4];
      };
      const head = place(swing);
      const behind = place(Math.max(0, swing - 0.05));
      const turn = Math.atan2(head[1] - behind[1], head[0] - behind[0]) - Math.PI / 2;

      chain(context, stage.source, head, size * 0.22, IRON, 1);
      anchor(context, head, size * 1.1, turn, IRON, 1);
      return;
    }
    const hit = (share - ANCHOR_LANDS) / (1 - ANCHOR_LANDS);
    const kept = late(hit, 0.6);

    orb(context, at, size * (0.8 + hit * 1.4), {
      color: lighten(paint.color, 0.5),
      alpha: decay(Math.min(1, hit * 2)),
    });
    burst(context, at, size * (1.6 + hit * 1.6), 10, seed, {
      color: lighten(IRON, 0.5),
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    ripple(context, foot, size * (1 + hit * 2.4), {
      ...paint,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2, many(8, weight), seed, hit, { color: IRON, alpha: decay(hit) });
    // The chain wound round it, pulled tighter as it goes
    for (let loop = 0; loop < 3; loop += 1) {
      const wound = Math.min(1, hit * 2.5 - loop * 0.3);
      const middle = at[1] - size * 0.6 + loop * size * 0.6;
      const round = size * (1.6 - Math.max(0, wound) * 0.5);

      for (let one = 0; one < 12 && one / 12 < wound; one += 1) {
        const turn = (one / 12) * Math.PI * 2 + loop;

        link(
          context,
          [at[0] + Math.cos(turn) * round, middle + Math.sin(turn) * round * 0.3],
          size * 0.22,
          Math.atan2(Math.cos(turn) * 0.3, -Math.sin(turn)),
          one % 2 === 1,
          IRON,
          kept,
        );
      }
    }
    anchor(context, [at[0] + size * 1.4, foot[1] - size * 0.9], size * 1.1, 0.3, IRON, kept);
  },

  // The caster spinning in with its arms out in rings of dark flame, and a clothesline across it
  Lariat(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dark = mix(paint.color, DARK_FLAME, 0.5);
    const centre = between(stage.source, at, Math.min(1, share / LARIAT_HITS) ** 1.5);
    const waist = centre[1] - size * 0.2;
    const kept = late(share, 0.7);
    const spin = share * 22;

    for (let tier = 0; tier < 2; tier += 1) {
      hoop(context, [centre[0], waist + tier * size * 0.5], size * (1.7 - tier * 0.3), 0.3, 0, {
        color: tier === 0 ? dark : EMBER,
        alpha: kept * 0.8,
        width: 3 * stage.scale,
      });
    }
    for (const side of [0, Math.PI]) {
      const turn = spin + side;
      const hand: Point = [
        centre[0] + Math.cos(turn) * size * 1.7,
        waist + Math.sin(turn) * size * 0.5,
      ];

      edge(context, centre, hand, size * 0.3, 0, { color: dark, alpha: kept });
      // Flames licking off each hand, trailing behind the turn
      for (let lick = 0; lick < 4; lick += 1) {
        const back = turn - lick * 0.35;

        petal(
          context,
          [
            centre[0] + Math.cos(back) * size * 1.7,
            waist + Math.sin(back) * size * 0.5 - lick * size * 0.1,
          ],
          size * (0.45 - lick * 0.08),
          back,
          { color: lick === 0 ? EMBER : dark, alpha: kept * (1 - lick * 0.2) },
        );
      }
    }
    if (share < LARIAT_HITS) {
      return;
    }
    const hit = (share - LARIAT_HITS) / (1 - LARIAT_HITS);

    // The arm drawn right across it
    edge(
      context,
      [at[0] - size * 2.2, at[1] - size * 0.3],
      [at[0] + size * 2.2, at[1] - size * 0.1],
      size * 0.6 * decay(hit),
      size * 0.4,
      { color: EMBER, alpha: decay(hit) },
    );
    orb(context, at, size * (0.8 + hit * 1.2), {
      color: EMBER,
      alpha: decay(Math.min(1, hit * 1.6)),
    });
    ring(context, at, size * (0.6 + hit * 2.6), {
      color: dark,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    burst(context, at, size * (1.8 + hit * 1.8), 12, seed, {
      color: EMBER,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 2.6, many(10, weight), seed, hit, {
      color: lighten(EMBER, 0.4),
      alpha: decay(hit),
      width: 2 * stage.scale,
    });
  },

  // Pastel light and leaves swirling in on it from every side, then pressing in on it all at once
  Madness(context, stage, share, { seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale * 1.2;
    const gathering = share < MADNESS_CRUSH;

    if (gathering) {
      const inward = share / MADNESS_CRUSH;

      for (let mote = 0; mote < 24; mote += 1) {
        const held = (share * 1.5 + noise(seed, mote)) % 1;
        const angle = noise(seed, mote + 30) * Math.PI * 2 + held * 2.4;
        const round = size * 4.5 * (1 - held);
        const spot: Point = [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(angle) * round * 0.7,
        ];
        const color = MADNESS_TONES[mote % MADNESS_TONES.length];

        if (mote % 2 === 0) {
          petal(context, spot, size * 0.3, angle + held * 4, { color, alpha: swell(held) });
        } else {
          glint(context, spot, size * 0.3, held * 3, color, swell(held));
        }
      }
      for (const [tone, color] of MADNESS_TONES.entries()) {
        const close = (share * 1.2 + tone / 4) % 1;

        ring(context, at, size * (0.6 + (1 - close) * 3.4), {
          color,
          alpha: swell(close) * 0.8,
          width: 2.4 * stage.scale,
        });
      }
      orb(context, at, size * (0.4 + inward * 0.6), {
        color: MADNESS_TONES[0],
        alpha: inward * 0.6,
      });
      return;
    }
    const crush = (share - MADNESS_CRUSH) / (1 - MADNESS_CRUSH);

    for (const [tone, color] of MADNESS_TONES.entries()) {
      const held = Math.min(1, crush * 3 - tone * 0.15);

      if (held > 0 && held < 1) {
        ring(context, at, size * (0.2 + 2.6 * (1 - held)), {
          color,
          alpha: 1,
          width: (1 + 4 * (1 - held)) * stage.scale,
        });
      }
    }
    orb(context, at, size * (0.3 + 1.4 * swell(Math.min(1, crush * 1.5))), {
      color: '#ffffff',
      alpha: decay(crush),
    });
    glint(context, at, size * (1 + crush * 2), crush, '#ffffff', decay(Math.min(1, crush * 2)));
    for (let fleck = 0; fleck < 8; fleck += 1) {
      const angle = (fleck / 8) * Math.PI * 2 + spread(seed, fleck) * 0.3;
      const out = size * (0.5 + crush * 2.2);

      glint(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        size * 0.26,
        crush * 2,
        MADNESS_TONES[fleck % MADNESS_TONES.length],
        decay(crush),
      );
    }
  },

  // A cone of light coming down on it from above, and a bright circle on the floor round its feet
  Spotlight(context, stage, share, { seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 5, 0.75);
    const wide = size * 1.7 * Math.min(1, share * 5);
    const lamp: Point = [at[0], at[1] - size * 6];
    const foot: Point = [at[0], at[1] + size * 0.9];
    const light = context.createLinearGradient(lamp[0], lamp[1], foot[0], foot[1]);

    light.addColorStop(0, fade(SPOT_LIGHT, shown * 0.7));
    light.addColorStop(1, fade(SPOT_LIGHT, shown * 0.25));
    context.beginPath();
    context.moveTo(lamp[0] - size * 0.25, lamp[1]);
    context.lineTo(lamp[0] + size * 0.25, lamp[1]);
    context.lineTo(foot[0] + wide, foot[1]);
    context.lineTo(foot[0] - wide, foot[1]);
    context.closePath();
    context.fillStyle = light;
    context.fill();
    blot(context, foot, wide, wide * 0.34, SPOT_LIGHT, shown * 0.55);
    ripple(context, foot, wide, { color: '#ffffff', alpha: shown * 0.8, width: 2 * stage.scale });
    orb(context, lamp, size * 0.6, { color: SPOT_LIGHT, alpha: shown });
    // Dust caught in the light
    for (let mote = 0; mote < 10; mote += 1) {
      const fall = (share * 0.8 + noise(seed, mote)) % 1;
      const half = size * 0.25 + (wide - size * 0.25) * fall;

      orb(
        context,
        [at[0] + spread(seed, mote + 10) * half * 0.8, lamp[1] + (foot[1] - lamp[1]) * fall],
        size * 0.1,
        { color: '#ffffff', alpha: shown * swell(fall) * 0.8 },
      );
    }
  },

  // A big ball of pollen lobbed over onto it, bursting into a yellow cloud that drifts down
  Pollen(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const pale = lighten(POLLEN, 0.5);

    if (share < POLLEN_BURSTS) {
      const flight = share / POLLEN_BURSTS;
      const place = (along: number): Point => {
        const spot = between(stage.source, at, along);

        return [spot[0], spot[1] - Math.sin(Math.PI * along) * size * 4];
      };
      const ball = place(flight);

      for (let trail = 5; trail > 0; trail -= 1) {
        orb(context, place(Math.max(0, flight - trail * 0.05)), size * 0.3 * (1 - trail / 6), {
          color: POLLEN,
          alpha: 0.6 * (1 - trail / 6),
        });
      }
      orb(context, ball, size * 1.1, { color: POLLEN, alpha: 1 });
      for (let fuzz = 0; fuzz < 10; fuzz += 1) {
        const angle = (fuzz / 10) * Math.PI * 2 + share * 6;

        orb(
          context,
          [ball[0] + Math.cos(angle) * size * 0.9, ball[1] + Math.sin(angle) * size * 0.9],
          size * 0.22,
          { color: pale, alpha: 1 },
        );
      }
      return;
    }
    const burstAt = (share - POLLEN_BURSTS) / (1 - POLLEN_BURSTS);

    orb(context, at, size * (1 + burstAt * 1.6), {
      color: POLLEN,
      alpha: decay(Math.min(1, burstAt * 1.5)) * 0.8,
    });
    ring(context, at, size * (0.8 + burstAt * 2.4), {
      color: POLLEN,
      alpha: decay(burstAt),
      width: 3 * stage.scale,
    });
    for (let grain = 0; grain < many(24, weight); grain += 1) {
      const angle = noise(seed, grain) * Math.PI * 2;
      const out = size * (0.6 + burstAt * 2.6 * (0.4 + noise(seed, grain + 30) * 0.6));

      orb(
        context,
        [
          at[0] + Math.cos(angle) * out,
          at[1] + Math.sin(angle) * out * 0.7 + burstAt * burstAt * size * 1.6,
        ],
        size * 0.16,
        { color: grain % 3 === 0 ? pale : POLLEN, alpha: late(burstAt, 0.4) },
      );
    }
  },

  // The caster's head going off like a firework, and a fireball out of it bursting on the target
  Detonate(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const head: Point = [stage.source[0], stage.source[1] - size * 0.9];

    if (share < DETONATE_BLOWS) {
      const build = share / DETONATE_BLOWS;

      orb(context, head, size * (0.4 + build * 0.8), { color: HOT, alpha: build });
      glint(context, head, size * build, share * 6, '#ffffff', build);
    } else {
      const blown = Math.min(1, (share - DETONATE_BLOWS) / 0.45);
      const sparks = many(16, weight);
      const droop = blown * blown * size * 1.2;

      orb(context, head, size * (1 + blown * 1.4), { color: EMBER, alpha: decay(blown) * 0.8 });
      ring(context, head, size * (0.8 + blown * 2.4), {
        color: HOT,
        alpha: decay(blown),
        width: 3 * stage.scale,
      });
      for (let spark = 0; spark < sparks; spark += 1) {
        const angle = (spark / sparks) * Math.PI * 2 + noise(HEAD_SEED, spark) * 0.3;
        const far = 3.2 * (0.6 + noise(HEAD_SEED, spark + 10) * 0.4);
        const out = size * (0.6 + settle(blown) * far);
        const back = size * (0.6 + settle(Math.max(0, blown - 0.12)) * far);
        const tip: Point = [
          head[0] + Math.cos(angle) * out,
          head[1] + Math.sin(angle) * out + droop,
        ];
        const color = FIREWORK_TONES[spark % FIREWORK_TONES.length];

        band(
          context,
          [head[0] + Math.cos(angle) * back, head[1] + Math.sin(angle) * back + droop * 0.6],
          tip,
          size * 0.12,
          color,
          decay(blown),
        );
        glint(context, tip, size * 0.25, blown * 4, lighten(color, 0.5), decay(blown));
      }
    }
    if (share > 0.15 && share < DETONATE_LANDS) {
      const flight = (share - 0.15) / (DETONATE_LANDS - 0.15);
      const spot = between(head, at, flight);
      const ball: Point = [spot[0], spot[1] - Math.sin(Math.PI * flight) * size * 3];

      orb(context, ball, size * 0.8, { color: EMBER, alpha: 1 });
      orb(context, ball, size * 0.4, { color: HOT, alpha: 1 });
    }
    if (share < DETONATE_LANDS) {
      return;
    }
    const hit = (share - DETONATE_LANDS) / (1 - DETONATE_LANDS);

    orb(context, at, size * (1.2 + hit * 2), { color: EMBER, alpha: decay(hit) * 0.9 });
    orb(context, at, size * (0.8 + hit), { color: HOT, alpha: decay(Math.min(1, hit * 1.5)) });
    for (let wave = 0; wave < 2; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.5 - wave * 0.3));

      if (held > 0) {
        ring(context, at, size * (0.8 + held * 3), {
          color: HOT,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    ripple(context, [at[0], at[1] + size * 0.9], size * (1 + hit * 3), {
      color: EMBER,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    burst(context, at, size * (2.2 + hit * 2), 16, seed, {
      color: HOT,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    motes(context, at, size * 3, many(14, weight), seed, hit, {
      color: EMBER,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    for (let puff = 0; puff < 5; puff += 1) {
      orb(
        context,
        [at[0] + spread(seed, puff + 40) * size * 1.5, at[1] - hit * size * 2],
        size * (0.6 + hit),
        { color: '#4a3a3a', alpha: swell(hit) * 0.4 },
      );
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default alola;
