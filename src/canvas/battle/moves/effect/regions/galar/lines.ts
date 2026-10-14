import type { Point } from '../../../../stage';
import {
  between,
  bolt,
  bubble,
  burst,
  chevrons,
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
  spiral,
  spread,
  star,
  swell,
} from '../../../__paint';
import { SIGNATURE_SCALE } from './legends';
import type { EffectShape, ShapePainter } from '../../shapes';
import { REACH, landing, many } from '../../shapes';

/** Aura Wheel: the share the wheel has rolled in by */
export const WHEEL_LANDS = 0.35;

/** Morpeko's yellow and brown, spun in the wheel's hub, and the dark under its rim */
export const MORPEKO_YELLOW = '#f8d050';
export const MORPEKO_BROWN = '#6a4a3a';
export const WHEEL_DARK = '#2a2440';

/** Overdrive: how many bars of sound blast out, and the share the first lands at */
export const AMPED_WAVES = 5;
export const AMPED_HITS = 0.4;

/** Toxtricity's purple, its yellow and the punk pink of its spines */
export const TOXTRICITY_PURPLE = '#5a2a8a';
export const AMPED_YELLOW = '#f8f04a';
export const AMPED_PINK = '#ff5ad8';

/** Apple Acid: the share the glob lands at */
export const ACID_LANDS = 0.4;

/** The sour green of the acid, its yellow and the dark round it */
export const ACID_GREEN = '#a8e83a';
export const ACID_YELLOW = '#f0f04a';
export const ACID_DARK = '#3a6a1a';

/** Grav Apple: the share the apple lands at */
export const GRAV_LANDS = 0.4;

/** The apple's red, its dark side, stem and leaf, and the violet of the gravity */
export const APPLE_RED = '#d8303a';
export const APPLE_DARK = '#6a1a20';
export const APPLE_STEM = '#6a4a2a';
export const APPLE_LEAF = '#4aa83a';
export const GRAVITY_VIOLET = '#9a7ae8';

/** Spirit Break: the share the fist lands at */
export const SPIRIT_LANDS = 0.35;

/** Grimmsnarl's hair, the light twist through it, and the fairy pink round it */
export const HAIR_DARK = '#3a2a48';
export const HAIR_LIGHT = '#8a6aa8';
export const SPIRIT_PINK = '#ff7ad0';

/** Strange Steam: the share the fog has rolled onto it by */
export const STEAM_ROLLS = 0.4;

/** Galarian Weezing's chimneys, and the fog out of them */
export const CHIMNEY_GREY = '#6a6a72';
export const CHIMNEY_DARK = '#2a2a30';
export const FOG_PINK = '#f0a0e0';
export const FOG_VIOLET = '#b07ae0';

/** Obstruct: the share the arms are crossed by */
export const OBSTRUCT_CROSSED = 0.15;

/** Obstagoon's black, its white bands and the red of its tongue */
export const OBSTAGOON_BLACK = '#202024';
export const OBSTAGOON_WHITE = '#f4f4f0';
export const OBSTAGOON_RED = '#e8303a';

/** False Surrender: the share the bow ends at, and the share the blow lands at */
export const SURRENDER_BOWS = 0.35;
export const SURRENDER_STRIKES = 0.5;

/** The white flag and its pole, and the dark of the blow */
export const FLAG_WHITE = '#fafaf6';
export const FLAG_POLE = '#7a6a5a';
export const SUCKER_DARK = '#3a2a4a';
export const SUCKER_LIGHT = '#8a6ac8';

/** Meteor Assault: the share the lance lands at */
export const LANCE_LANDS = 0.4;

/** The leek's white stalk and green leaves, and Sirfetch'd's brown */
export const LEEK_WHITE = '#f4f0d8';
export const LEEK_GREEN = '#4aa83a';
export const SIRFETCHD_BROWN = '#8a5a32';

/** Shell Side Arm: the share the shot is fired at, and the share it lands at */
export const SIDEARM_FIRES = 0.12;
export const SIDEARM_LANDS = 0.4;

/** The Shellder's purple, its dark and pale ridges, and the poison */
export const SHELL_PURPLE = '#7a4a9a';
export const SHELL_DARK = '#3a2050';
export const SHELL_PALE = '#e0c8f0';
export const TOXIC_PURPLE = '#b04ae8';

/** Eerie Spell: how many runes ring out, and the share they reach it by */
export const SPELL_RUNES = 8;
export const SPELL_REACHES = 0.5;

/** Galarian Slowking's crown, the gem in it and the violet of the runes */
export const CROWN_GOLD = '#e8c84a';
export const CROWN_GEM = '#a04ae8';
export const SPELL_VIOLET = '#b07aff';

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

/** A filled oval with a dark rim, so a solid thing reads on any ground */
function body(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  color: string,
  rim: string,
  alpha: number,
): void {
  if (alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, Math.max(0.5, across), Math.max(0.5, up), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade(rim, alpha * 0.8);
  context.lineWidth = Math.max(1, Math.min(across, up) * 0.16);
  context.stroke();
}

/** One rune of the spell: a ringed stroke, a triangle or a barred cross */
function rune(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  kind: number,
  width: number,
  alpha: number,
): void {
  if (kind % 3 === 0) {
    ring(context, [x, y], size * 0.6, { color: SPELL_VIOLET, alpha, width });
    strokeThrough(
      context,
      [
        [x, y - size],
        [x, y + size],
      ],
      width,
      lighten(SPELL_VIOLET, 0.4),
      alpha,
    );
    return;
  }
  if (kind % 3 === 1) {
    strokeThrough(
      context,
      [
        [x, y - size],
        [x + size * 0.9, y + size * 0.7],
        [x - size * 0.9, y + size * 0.7],
        [x, y - size],
      ],
      width,
      SPELL_VIOLET,
      alpha,
    );
    return;
  }
  strokeThrough(
    context,
    [
      [x - size * 0.7, y - size * 0.7],
      [x + size * 0.7, y + size * 0.7],
    ],
    width,
    SPELL_VIOLET,
    alpha,
  );
  strokeThrough(
    context,
    [
      [x + size * 0.7, y - size * 0.7],
      [x - size * 0.7, y + size * 0.7],
    ],
    width,
    SPELL_VIOLET,
    alpha,
  );
  strokeThrough(
    context,
    [
      [x - size, y],
      [x + size, y],
    ],
    width,
    lighten(SPELL_VIOLET, 0.4),
    alpha,
  );
}

const galarLines = {
  // Morpeko curled in the hub of a crackling wheel of its own energy,
  // rolling in over the ground, sparks thrown off the rim, and the wheel
  // grinding on it before it gives out
  Aurawheel(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = Math.min(1, share / WHEEL_LANDS) ** 0.8;
    const hub = between(stage.source, at, run);
    const radius = size * 1.5;
    const spin = share * Math.PI * 10;
    const shown = late(share, 0.7);
    const flicker = seed + Math.floor(share * 24);

    if (share < WHEEL_LANDS) {
      edge(context, between(stage.source, hub, 0.3), hub, size * 0.6, 0, {
        color: paint.color,
        alpha: 0.4,
      });
    }
    orb(context, hub, radius * 1.3, { color: paint.color, alpha: shown * 0.35 });
    ring(context, hub, radius, { color: WHEEL_DARK, alpha: shown * 0.6, width: 6 * stage.scale });
    ring(context, hub, radius, { color: paint.color, alpha: shown, width: 3.5 * stage.scale });
    for (let spoke = 0; spoke < 6; spoke += 1) {
      const angle = spin + (spoke / 6) * Math.PI * 2;

      strokeThrough(
        context,
        [hub, [hub[0] + Math.cos(angle) * radius, hub[1] + Math.sin(angle) * radius]],
        1.6 * stage.scale,
        lighten(paint.color, 0.4),
        shown,
      );
    }
    // Morpeko spinning in the hub, its two colours chasing round
    sickle(context, hub, radius * 0.3, spin, spin + Math.PI, radius * 0.45, {
      color: MORPEKO_YELLOW,
      alpha: shown,
    });
    sickle(context, hub, radius * 0.3, spin + Math.PI, spin + Math.PI * 2, radius * 0.45, {
      color: MORPEKO_BROWN,
      alpha: shown,
    });
    for (let crack = 0; crack < 3; crack += 1) {
      const angle = spin * 0.5 + (crack / 3) * Math.PI * 2 + noise(flicker, crack);
      const rim = (turn: number): Point => [
        hub[0] + Math.cos(turn) * radius * 1.15,
        hub[1] + Math.sin(turn) * radius * 1.15,
      ];

      bolt(context, rim(angle), rim(angle + 0.9), flicker + crack, {
        color: lighten(paint.color, 0.5),
        alpha: shown,
        width: 1.8 * stage.scale,
      });
    }
    burst(context, hub, radius * 1.7, 8, flicker, {
      color: paint.color,
      alpha: shown,
      width: 2 * stage.scale,
    });
    if (share < WHEEL_LANDS) {
      return;
    }
    const hit = (share - WHEEL_LANDS) / (1 - WHEEL_LANDS);

    ring(context, at, size * (1.4 + hit * 2.4), {
      color: lighten(paint.color, 0.5),
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 3, many(12, weight), seed + 1, hit, {
      color: paint.color,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A power chord struck on the caster's strings, then bars of electric
  // sound in bold zigzags blasting out across the field one after
  // another, punk sparks flying where they break over it
  Amped(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const length = Math.max(1, Math.hypot(dx, dy));
    const across: Point = [-dy / length, dx / length];
    const strum = decay(share * 2.5);

    // The strings, still shaking from the strum
    for (let string = 0; string < 4; string += 1) {
      const points: Point[] = [];
      const y = stage.source[1] - size * (0.6 + string * 0.3);

      for (let step = 0; step <= 10; step += 1) {
        const wobble = Math.sin(step * Math.PI + share * 90 + string) * size * 0.15 * strum;

        points.push([stage.source[0] - size * 1.4 + step * size * 0.28, y + wobble]);
      }
      strokeThrough(context, points, 1.6 * stage.scale, AMPED_YELLOW, strum, TOXTRICITY_PURPLE);
    }
    for (let wave = 0; wave < AMPED_WAVES; wave += 1) {
      const travel = (share - wave * 0.1) / (AMPED_HITS - 0.05);

      if (travel < 0 || travel > 1.4) {
        continue;
      }
      const centre = between(stage.source, at, Math.min(1, travel));
      const half = size * (1 + Math.min(1, travel) * 1.4);
      const points: Point[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const along = (step / 8 - 0.5) * 2 * half;
        const kick = (step % 2 === 0 ? 1 : -1) * size * 0.35;

        points.push([
          centre[0] + across[0] * along + (dx / length) * kick,
          centre[1] + across[1] * along + (dy / length) * kick,
        ]);
      }
      strokeThrough(
        context,
        points,
        4 * stage.scale,
        wave % 2 === 0 ? AMPED_YELLOW : AMPED_PINK,
        decay(Math.max(0, travel - 1) * 2.5),
        TOXTRICITY_PURPLE,
      );
    }
    if (share < AMPED_HITS) {
      return;
    }
    const hit = (share - AMPED_HITS) / (1 - AMPED_HITS);

    orb(context, at, size * (1 + hit), { color: AMPED_YELLOW, alpha: decay(hit) * 0.6 });
    ring(context, at, size * (1.2 + hit * 2.6), {
      color: AMPED_PINK,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let crack = 0; crack < 3; crack += 1) {
      const angle = noise(seed + Math.floor(share * 20), crack) * Math.PI * 2;

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * size * 2.4, at[1] + Math.sin(angle) * size * 2.4],
        seed + crack + Math.floor(share * 20),
        { color: AMPED_YELLOW, alpha: decay(hit), width: 2 * stage.scale },
      );
    }
    burst(context, at, size * (1.4 + hit * 2), 10, seed + 2, {
      color: AMPED_PINK,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
  },

  // A glob of sour apple acid spat high across the gap, dripping as it
  // goes, splashing green-yellow over it and sizzling in a puddle
  Acid(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const height = size * 3.5;

    if (share < ACID_LANDS) {
      const flight = share / ACID_LANDS;
      const lift = (t: number): Point => {
        const spot = between(stage.source, at, t);

        return [spot[0], spot[1] - Math.sin(Math.PI * t) * height];
      };
      const spot = lift(flight);

      motes(context, lift(Math.max(0, flight - 0.15)), size * 0.8, 5, seed, flight, {
        color: ACID_YELLOW,
        alpha: 0.8,
        width: 2 * stage.scale,
      });
      body(context, spot, size * 0.8, size * 0.7, ACID_GREEN, ACID_DARK, 1);
      orb(context, [spot[0] - size * 0.25, spot[1] - size * 0.25], size * 0.3, {
        color: ACID_YELLOW,
        alpha: 1,
      });
      return;
    }
    const hit = (share - ACID_LANDS) / (1 - ACID_LANDS);
    const foot: Point = [at[0], at[1] + size * 0.8];
    const shown = late(hit, 0.5);

    ripple(context, foot, size * (1.4 + Math.min(1, hit * 3) * 0.8), {
      color: ACID_GREEN,
      alpha: shown * 0.8,
      width: 5 * stage.scale,
    });
    orb(context, at, size * (1 + hit), { color: ACID_GREEN, alpha: decay(hit) * 0.6 });
    // The splash, petals of acid flung out of where it burst
    for (let drop = 0; drop < 7; drop += 1) {
      const angle = -Math.PI / 2 + (drop / 6 - 0.5) * Math.PI * 1.4;
      const out = size * (0.6 + Math.min(1, hit * 2.5) * 1.2);

      petal(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        size * 0.45,
        angle + Math.PI / 2,
        { color: drop % 2 === 0 ? ACID_GREEN : ACID_YELLOW, alpha: decay(hit * 1.4) },
      );
    }
    // The sizzle: bubbles popping up off it
    for (let pop = 0; pop < many(6, weight); pop += 1) {
      const rise = (hit * 2 + noise(seed, pop)) % 1;

      bubble(
        context,
        [at[0] + spread(seed, pop + 10) * size, at[1] + size * 0.4 - rise * size * 1.8],
        size * (0.15 + noise(seed, pop + 20) * 0.15),
        { color: ACID_YELLOW, alpha: swell(rise) * shown },
      );
    }
  },

  // A huge apple dropped from high above straight onto it, violet
  // chevrons of gravity pressing it down, and a thud ring knocked out
  // of the ground when it lands
  Gravapple(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const fall = Math.min(1, share / GRAV_LANDS) ** 2;
    const rest: Point = [at[0], at[1] - size * 0.6];
    const top: Point = [at[0], at[1] - size * 7];
    const spot = between(top, rest, fall);
    const landed = share >= GRAV_LANDS;
    const hit = landed ? (share - GRAV_LANDS) / (1 - GRAV_LANDS) : 0;
    const squash = landed ? swell(Math.min(1, hit * 4)) * 0.25 : 0;
    const shown = late(share, 0.7);
    const apple = size * 1.5;

    for (const side of [-1, 1]) {
      chevrons(
        context,
        [spot[0] + side * apple * 1.5, spot[1]],
        size * 1.2,
        3,
        share,
        { color: GRAVITY_VIOLET, alpha: shown, width: 3 * stage.scale },
        -1,
      );
    }
    body(
      context,
      spot,
      apple * (1 + squash),
      apple * (0.92 - squash),
      APPLE_RED,
      APPLE_DARK,
      shown,
    );
    orb(context, [spot[0] - apple * 0.4, spot[1] - apple * 0.35], apple * 0.3, {
      color: '#ffffff',
      alpha: shown * 0.7,
    });
    edge(
      context,
      [spot[0], spot[1] - apple * 0.8],
      [spot[0] + apple * 0.1, spot[1] - apple * 1.3],
      size * 0.12,
      0,
      {
        color: APPLE_STEM,
        alpha: shown,
      },
    );
    petal(context, [spot[0] + apple * 0.4, spot[1] - apple * 1.1], apple * 0.35, 1.1, {
      color: APPLE_LEAF,
      alpha: shown,
    });
    if (!landed) {
      return;
    }
    const foot: Point = [at[0], at[1] + size * 0.8];

    ripple(context, foot, size * (1.4 + hit * 3), {
      color: '#ffffff',
      alpha: decay(hit) * 0.9,
      width: 4 * stage.scale,
    });
    ripple(context, foot, size * (1 + hit * 2.2), {
      color: GRAVITY_VIOLET,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    motes(context, foot, size * 3, many(12, weight), seed, hit, {
      color: '#d8c8a8',
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
  },

  // A fist of twisted hair in pink fairy light slammed down on it from
  // above, and its spirit shattering into shards of pink glass
  Spiritbreak(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const drop = Math.min(1, share / SPIRIT_LANDS) ** 2;
    const top: Point = [at[0] + size * 1.2, at[1] - size * 7];
    const fist = between(top, [at[0], at[1] - size * 0.8], drop);
    const shown = late(share, 0.6);

    edge(context, top, fist, size * 1.2, 0, { color: SPIRIT_PINK, alpha: shown * 0.5 });
    edge(context, top, fist, size * 0.85, 0, { color: HAIR_DARK, alpha: shown });
    // The hair twisted round itself down the arm
    for (let strand = 0; strand < 3; strand += 1) {
      const points: Point[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const along = step / 12;
        const spot = between(top, fist, along);
        const twist = Math.sin(along * Math.PI * 4 + strand * 2.1) * size * 0.5 * swell(along);

        points.push([spot[0] + twist, spot[1]]);
      }
      strokeThrough(context, points, 1.6 * stage.scale, HAIR_LIGHT, shown);
    }
    orb(context, fist, size * 1.6, { color: SPIRIT_PINK, alpha: shown * 0.6 });
    body(context, fist, size * 1.1, size * 0.95, HAIR_DARK, SPIRIT_PINK, shown);
    for (let knuckle = 0; knuckle < 4; knuckle += 1) {
      body(
        context,
        [fist[0] + (knuckle - 1.5) * size * 0.45, fist[1] + size * 0.6],
        size * 0.28,
        size * 0.24,
        HAIR_LIGHT,
        HAIR_DARK,
        shown,
      );
    }
    if (share < SPIRIT_LANDS) {
      return;
    }
    const hit = (share - SPIRIT_LANDS) / (1 - SPIRIT_LANDS);

    ring(context, at, size * (1 + hit * 3), {
      color: SPIRIT_PINK,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 3.2, many(14, weight), seed, hit, {
      color: lighten(SPIRIT_PINK, 0.4),
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    shards(context, at, size * 2.4, many(8, weight), seed + 1, hit, {
      color: SPIRIT_PINK,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let glint = 0; glint < 4; glint += 1) {
      star(
        context,
        [at[0] + spread(seed, glint) * size * 2, at[1] + spread(seed, glint + 5) * size * 1.4],
        size * 0.45,
        glint,
        { color: '#ffffff', alpha: swell(Math.min(1, hit * 1.6 + glint * 0.1)) },
      );
    }
  },

  // Chimneys rising over the caster puffing pink and violet fog, the
  // fog rolling across onto it and swimming round it in a confusing
  // shimmer
  Strangesteam(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = late(share, 0.8);
    const stacks: Point[] = [
      [stage.source[0] - size * 0.9, stage.source[1] - size * 1.4],
      [stage.source[0] + size * 0.8, stage.source[1] - size * 1.7],
    ];

    for (const [index, base] of stacks.entries()) {
      const mouth: Point = [base[0], base[1] - size * 1.2];

      context.fillStyle = fade(CHIMNEY_DARK, shown);
      context.fillRect(base[0] - size * 0.32, mouth[1], size * 0.64, size * 1.2);
      context.fillStyle = fade(CHIMNEY_GREY, shown);
      context.fillRect(base[0] - size * 0.24, mouth[1], size * 0.48, size * 1.2);
      context.fillStyle = fade(CHIMNEY_DARK, shown);
      context.fillRect(base[0] - size * 0.42, mouth[1] - size * 0.15, size * 0.84, size * 0.3);
      // Puffs out of each mouth, rising and swelling
      for (let puff = 0; puff < 3; puff += 1) {
        const rise = (share * 3 + puff / 3 + index * 0.17) % 1;

        orb(context, [mouth[0], mouth[1] - rise * size * 1.6], size * (0.4 + rise * 0.6), {
          color: puff % 2 === 0 ? FOG_PINK : FOG_VIOLET,
          alpha: swell(rise) * shown * 0.8,
        });
      }
    }
    // The fog rolling over the gap, puff after puff
    for (let puff = 0; puff < many(8, weight); puff += 1) {
      const roll = Math.min(1, Math.max(0, (share - 0.05 - puff * 0.03) / (STEAM_ROLLS - 0.1)));

      if (roll <= 0) {
        continue;
      }
      const spot = between(stacks[puff % 2], at, roll);

      orb(
        context,
        [spot[0] + spread(seed, puff) * size * 0.8, spot[1] + spread(seed, puff + 10) * size * 0.5],
        size * (0.7 + roll * 0.6),
        { color: puff % 2 === 0 ? FOG_PINK : FOG_VIOLET, alpha: shown * 0.55 },
      );
    }
    if (share < STEAM_ROLLS) {
      return;
    }
    const daze = (share - STEAM_ROLLS) / (1 - STEAM_ROLLS);

    orb(context, at, size * 2.2, { color: FOG_PINK, alpha: swell(daze) * 0.5 });
    spiral(context, at, size * 1.4, 2, daze, {
      color: lighten(FOG_VIOLET, 0.3),
      alpha: late(daze, 0.5),
      width: 2.4 * stage.scale,
    });
    for (let glint = 0; glint < 5; glint += 1) {
      const angle = (glint / 5) * Math.PI * 2 + daze * Math.PI * 3;

      star(
        context,
        [at[0] + Math.cos(angle) * size * 1.6, at[1] - size * 0.6 + Math.sin(angle) * size * 0.5],
        size * 0.35,
        daze * 4,
        { color: '#ffffff', alpha: late(daze, 0.5) * swell((daze * 3 + glint / 5) % 1) },
      );
    }
  },

  // The caster's arms crossed hard in a big X before it, black banded in
  // white like Obstagoon's own, with a hard flash as they meet
  Obstruct(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const cross = Math.min(1, share / OBSTRUCT_CROSSED);
    const shown = late(share, 0.75);
    const centre: Point = [at[0], at[1] - size * 0.3];
    const reach = size * 1.8;

    orb(context, centre, size * 2.2, { color: OBSTAGOON_RED, alpha: shown * 0.2 });
    for (const side of [-1, 1]) {
      // Each arm swings in from wide open to its place in the X
      const angle = Math.PI / 4 + (side < 0 ? Math.PI / 2 : 0) + side * decay(cross) * 0.9;
      const one: Point = [centre[0] + Math.cos(angle) * reach, centre[1] + Math.sin(angle) * reach];
      const other: Point = [
        centre[0] - Math.cos(angle) * reach,
        centre[1] - Math.sin(angle) * reach,
      ];

      strokeThrough(context, [one, other], size * 0.75, OBSTAGOON_BLACK, shown, OBSTAGOON_WHITE);
      for (let band = 0; band < 3; band += 1) {
        const from = 0.12 + band * 0.3;

        strokeThrough(
          context,
          [between(one, other, from), between(one, other, from + 0.12)],
          size * 0.5,
          OBSTAGOON_WHITE,
          shown,
        );
      }
    }
    body(context, centre, size * 0.35, size * 0.35, OBSTAGOON_RED, OBSTAGOON_BLACK, shown);
    const flash = Math.max(0, (share - OBSTRUCT_CROSSED * 0.7) / 0.25);

    if (flash > 0 && flash < 1) {
      orb(context, centre, size * (1.4 + flash * 1.6), {
        color: '#ffffff',
        alpha: decay(flash) * 0.9,
      });
      star(context, centre, size * (1.2 + flash), Math.PI / 4, {
        color: '#ffffff',
        alpha: decay(flash),
      });
      burst(context, centre, size * (2 + flash * 1.4), 10, seed, {
        color: '#ffffff',
        alpha: decay(flash),
        width: 3 * stage.scale,
      });
    }
  },

  // A bow first, the caster dipping with a white flag raised, then a
  // dark sucker blow swung in from the side onto it
  Surrender(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dip = Math.min(1, share / SURRENDER_BOWS);
    const held = late(share, SURRENDER_STRIKES);
    const ground: Point = [stage.source[0], stage.source[1] + size * 0.9];
    const foot: Point = [stage.source[0] + size * 1.4, stage.source[1] + size * 0.2];
    const lean = swell(dip) * 0.35;
    const head: Point = [
      foot[0] + Math.sin(lean) * size * 3.4,
      foot[1] - Math.cos(lean) * size * 3.4,
    ];

    // The caster's shadow stretching forward as it bows
    edge(context, ground, between(ground, at, 0.12 + swell(dip) * 0.12), size * 0.9, 0, {
      color: SUCKER_DARK,
      alpha: 0.35 * held,
    });
    strokeThrough(context, [foot, head], 2.4 * stage.scale, FLAG_POLE, held, SUCKER_DARK);
    const cloth: Point[] = [];

    for (let step = 0; step <= 6; step += 1) {
      const out = step / 6;
      const wave = Math.sin(out * Math.PI * 2 - share * 30) * size * 0.25 * out;

      cloth.push([head[0] + out * size * 2, head[1] + wave]);
    }
    for (let step = 6; step >= 0; step -= 1) {
      const out = step / 6;
      const wave = Math.sin(out * Math.PI * 2 - share * 30) * size * 0.25 * out;

      cloth.push([head[0] + out * size * 2, head[1] + size * 1.3 + wave]);
    }
    context.beginPath();
    for (const [index, [x, y]] of cloth.entries()) {
      context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
    }
    context.closePath();
    context.fillStyle = fade(FLAG_WHITE, held);
    context.fill();
    context.strokeStyle = fade(SUCKER_DARK, held * 0.6);
    context.lineWidth = 1.4 * stage.scale;
    context.stroke();
    if (share < SURRENDER_BOWS) {
      return;
    }
    const swing = Math.min(1, (share - SURRENDER_BOWS) / (SURRENDER_STRIKES - SURRENDER_BOWS));
    const from: Point = [at[0] - size * 5, at[1] + size * 0.6];
    const blow = between(from, at, swing ** 1.5);

    if (share < SURRENDER_STRIKES + 0.15) {
      const shown = late(share, SURRENDER_STRIKES);

      edge(context, between(from, blow, 0.2), blow, size * 0.8, size * 0.5, {
        color: SUCKER_LIGHT,
        alpha: shown * 0.5,
      });
      body(context, blow, size * 0.9, size * 0.8, SUCKER_DARK, SUCKER_LIGHT, shown);
    }
    if (share < SURRENDER_STRIKES) {
      return;
    }
    const hit = (share - SURRENDER_STRIKES) / (1 - SURRENDER_STRIKES);

    orb(context, at, size * (1 + hit * 1.4), { color: SUCKER_DARK, alpha: decay(hit) * 0.35 });
    star(context, at, size * (1 + swell(Math.min(1, hit * 2)) * 0.5), 0.3, {
      color: '#ffffff',
      alpha: decay(hit),
    });
    burst(context, at, size * (1.4 + hit * 2), 10, seed, {
      color: SUCKER_LIGHT,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    ring(context, at, size * (1 + hit * 2.4), {
      color: SUCKER_LIGHT,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A leek couched like a knight's lance, its tip driven in at the head
  // of a long green and brown streak, and a great burst where it lands
  Assault(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const length = Math.max(1, Math.hypot(dx, dy));
    const way: Point = [dx / length, dy / length];
    const run = Math.min(1, share / LANCE_LANDS) ** 1.3;
    const tip = between(stage.source, at, run);
    const lance = size * 4;
    const butt: Point = [tip[0] - way[0] * lance, tip[1] - way[1] * lance];
    const shown = late(share, 0.55);

    // The streak behind the charge
    edge(context, between(stage.source, butt, 0.1), tip, size * 1.1, 0, {
      color: SIRFETCHD_BROWN,
      alpha: shown * 0.45,
    });
    edge(context, between(stage.source, butt, 0.3), tip, size * 0.6, 0, {
      color: LEEK_GREEN,
      alpha: shown * 0.7,
    });
    // The lance: green leaves fanned at the butt, the white stalk to its point
    for (let leaf = 0; leaf < 3; leaf += 1) {
      const angle = Math.atan2(-way[1], -way[0]) + (leaf - 1) * 0.5;

      petal(
        context,
        [butt[0] + Math.cos(angle) * size * 0.8, butt[1] + Math.sin(angle) * size * 0.8],
        size * 0.9,
        angle + Math.PI / 2,
        { color: LEEK_GREEN, alpha: shown },
      );
    }
    edge(context, butt, tip, size * 0.6, 0, { color: SIRFETCHD_BROWN, alpha: shown });
    edge(context, butt, tip, size * 0.45, 0, { color: LEEK_WHITE, alpha: shown });
    if (share < LANCE_LANDS) {
      star(context, tip, size * 0.6, share * 10, { color: '#ffffff', alpha: 1 });
      return;
    }
    const hit = (share - LANCE_LANDS) / (1 - LANCE_LANDS);

    orb(context, at, size * (1.4 + hit * 1.6), { color: '#fff8e0', alpha: decay(hit * 1.5) });
    star(context, at, size * (1.6 + swell(Math.min(1, hit * 2)) * 0.8), 0.2, {
      color: '#ffffff',
      alpha: decay(hit),
    });
    ring(context, at, size * (1.2 + hit * 3.4), {
      color: LEEK_GREEN,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    burst(context, at, size * (1.8 + hit * 2.2), 12, seed, {
      color: '#fff8e0',
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 3, many(12, weight), seed + 1, hit, {
      color: SIRFETCHD_BROWN,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
  },

  // A Shellder clamped on the caster's arm firing a ball of poison like
  // a cannon, and a toxic purple burst bubbling over it
  Sidearm(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const arm: Point = [stage.source[0] + size * 1.3, stage.source[1] - size * 0.5];
    const kick = share < SIDEARM_FIRES ? 0 : decay((share - SIDEARM_FIRES) * 6) * size * 0.4;
    const shell: Point = [arm[0] + kick * 0.3, arm[1] + kick];
    const shown = late(share, 0.6);
    const aim = Math.atan2(at[1] - shell[1], at[0] - shell[0]);

    // The shell: ridged fan behind, spikes round its rim
    for (let ridge = 0; ridge < 5; ridge += 1) {
      const angle = aim + Math.PI + (ridge / 4 - 0.5) * Math.PI * 1.2;

      petal(
        context,
        [shell[0] + Math.cos(angle) * size * 0.7, shell[1] + Math.sin(angle) * size * 0.7],
        size * 0.55,
        angle + Math.PI / 2,
        { color: ridge % 2 === 0 ? SHELL_PURPLE : SHELL_DARK, alpha: shown },
      );
    }
    body(context, shell, size * 0.8, size * 0.8, SHELL_PURPLE, SHELL_DARK, shown);
    body(
      context,
      [shell[0] + Math.cos(aim) * size * 0.35, shell[1] + Math.sin(aim) * size * 0.35],
      size * 0.35,
      size * 0.35,
      SHELL_DARK,
      SHELL_PALE,
      shown,
    );
    if (share < SIDEARM_FIRES) {
      orb(context, shell, size * (0.6 + share * 4), { color: TOXIC_PURPLE, alpha: 0.7 });
      return;
    }
    const muzzle: Point = [shell[0] + Math.cos(aim) * size, shell[1] + Math.sin(aim) * size];
    const flash = (share - SIDEARM_FIRES) / 0.12;

    if (flash < 1) {
      burst(context, muzzle, size * (0.8 + flash), 8, seed, {
        color: lighten(TOXIC_PURPLE, 0.4),
        alpha: decay(flash),
        width: 2.4 * stage.scale,
      });
    }
    if (share < SIDEARM_LANDS) {
      const flight = (share - SIDEARM_FIRES) / (SIDEARM_LANDS - SIDEARM_FIRES);
      const ball = between(muzzle, at, flight);

      edge(context, between(muzzle, at, Math.max(0, flight - 0.3)), ball, size * 0.4, 0, {
        color: TOXIC_PURPLE,
        alpha: 0.6,
      });
      body(context, ball, size * 0.6, size * 0.6, TOXIC_PURPLE, SHELL_DARK, 1);
      orb(context, ball, size * 0.4, { color: SHELL_PALE, alpha: 0.8 });
      return;
    }
    const hit = (share - SIDEARM_LANDS) / (1 - SIDEARM_LANDS);

    orb(context, at, size * (1.2 + hit * 1.8), { color: TOXIC_PURPLE, alpha: decay(hit) * 0.7 });
    ring(context, at, size * (1 + hit * 3), {
      color: lighten(TOXIC_PURPLE, 0.3),
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 3, many(12, weight), seed + 1, hit, {
      color: TOXIC_PURPLE,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let pop = 0; pop < many(6, weight); pop += 1) {
      const rise = (hit * 1.6 + noise(seed, pop)) % 1;

      bubble(
        context,
        [at[0] + spread(seed, pop + 10) * size * 1.2, at[1] - rise * size * 2],
        size * (0.2 + noise(seed, pop + 20) * 0.2),
        { color: lighten(TOXIC_PURPLE, 0.3), alpha: swell(rise) * late(hit, 0.5) },
      );
    }
  },

  // The caster's crown glowing, a ring of eerie runes chanted out of it
  // across to the target, closing round it, and a pulse drawing its mind
  // out
  Spell(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const crown: Point = [stage.source[0], stage.source[1] - size * 1.9];
    const glow = late(share, 0.6);

    orb(context, crown, size * (1 + swell(Math.min(1, share * 2)) * 0.6), {
      color: SPELL_VIOLET,
      alpha: glow * 0.6,
    });
    // The crown: three gold spikes on a band, a gem in the middle
    context.beginPath();
    context.moveTo(crown[0] - size * 0.8, crown[1] + size * 0.4);
    for (let spike = 0; spike < 3; spike += 1) {
      const x = crown[0] + (spike - 1) * size * 0.55;

      context.lineTo(x - size * 0.25, crown[1]);
      context.lineTo(x, crown[1] - size * 0.6);
      context.lineTo(x + size * 0.25, crown[1]);
    }
    context.lineTo(crown[0] + size * 0.8, crown[1] + size * 0.4);
    context.closePath();
    context.fillStyle = fade(CROWN_GOLD, glow);
    context.fill();
    context.strokeStyle = fade(SHELL_DARK, glow * 0.7);
    context.lineWidth = 1.4 * stage.scale;
    context.stroke();
    orb(context, [crown[0], crown[1] + size * 0.15], size * 0.3, { color: CROWN_GEM, alpha: glow });
    const travel = Math.min(1, share / SPELL_REACHES);
    const centre = between(crown, at, travel ** 0.9);
    const closing = Math.max(0, (share - SPELL_REACHES) / (1 - SPELL_REACHES));
    const radius = size * (0.8 + travel * 1.2) * (1 - closing * 0.5);
    const runes = late(share, 0.8);

    for (let one = 0; one < SPELL_RUNES; one += 1) {
      const angle = (one / SPELL_RUNES) * Math.PI * 2 + share * Math.PI * 2;

      rune(
        context,
        [centre[0] + Math.cos(angle) * radius, centre[1] + Math.sin(angle) * radius * 0.6],
        size * 0.3,
        one + Math.floor(noise(seed, one) * 3),
        1.8 * stage.scale,
        runes,
      );
    }
    if (closing <= 0) {
      return;
    }
    // The pulse: rings drawn in to it, and the mind pulled out of it
    for (let wave = 0; wave < 3; wave += 1) {
      const pull = (closing * 2 + wave / 3) % 1;

      ring(context, at, size * (3 - pull * 2.6), {
        color: SPELL_VIOLET,
        alpha: swell(pull) * runes,
        width: 2.4 * stage.scale,
      });
    }
    orb(context, at, size * 1.3, { color: SPELL_VIOLET, alpha: swell(closing) * 0.5 });
    for (let mote = 0; mote < 5; mote += 1) {
      const rise = (closing * 1.5 + noise(seed, mote + 20)) % 1;

      orb(
        context,
        [at[0] + spread(seed, mote + 30) * size, at[1] - size * 0.4 - rise * size * 2],
        size * 0.2,
        { color: lighten(SPELL_VIOLET, 0.4), alpha: swell(rise) * runes },
      );
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default galarLines;
