import type { Point } from '../../stage';
import {
  between,
  bubble,
  burst,
  decay,
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
  spread,
  star,
  swell,
} from '../__paint';
import { SIGNATURE_SCALE } from './galar';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Mat Block: the share the mat is standing by */
export const MAT_FLIPS = 0.3;

/** The tatami's straw, the weave lines across it, its cloth border and the dust it throws */
export const MAT_STRAW = '#d8c47a';
export const MAT_WEAVE = '#a8904a';
export const MAT_EDGE = '#2f5a3a';
export const MAT_DUST = '#c8b48a';

/** Trick-or-Treat: the share the lantern has grinned by, and the share the glow settles at */
export const TREAT_GRINS = 0.3;
export const TREAT_SETTLES = 0.5;

/** Gourgeist's pumpkin, its dark, its stem, the candle in it and the ghost glow it leaves */
export const PUMPKIN_ORANGE = '#ff8a1e';
export const PUMPKIN_DARK = '#5a240a';
export const PUMPKIN_STEM = '#4a7a2a';
export const LANTERN_LIGHT = '#ffe04a';
export const TREAT_GHOST = '#a86aff';

/** The candy wrappers' colours */
export const CANDY_COLOURS = ['#ff5a9a', '#5ad8ff', '#ffd23a', '#8aff6a'];

/** Forest's Curse: the share the branches have grown by */
export const CURSE_GROWS = 0.4;

/** Trevenant's bark, its dark, and the sickly leaves and glow */
export const CURSE_BARK = '#6a4a32';
export const CURSE_DARK = '#2a1e18';
export const CURSE_LEAF = '#a8d03a';
export const CURSE_GLOW = '#6a9a2a';

/** Fairy Lock: how many keys turn round, and the share the padlock clicks shut */
export const LOCK_KEYS = 6;
export const LOCK_CLICKS = 0.55;

/** Klefki's keys, their dark, the lock's steel shackle and the fairy flash */
export const KEY_GOLD = '#ffd24a';
export const KEY_DARK = '#5a4a2a';
export const LOCK_STEEL = '#c8ccd8';
export const LOCK_PINK = '#ff9ad0';

/** King's Shield: the share the shield is planted by, and the share the blade has slid down by */
export const AEGIS_PLANTS = 0.25;
export const AEGIS_SHEATHED = 0.5;

/** Aegislash's gold rim, steel face, the dark under them and the hilt's purple */
export const AEGIS_GOLD = '#ffcc3a';
export const AEGIS_STEEL = '#b8c0d0';
export const AEGIS_DARK = '#33343f';
export const AEGIS_PURPLE = '#6a3a9a';

/** Land's Wrath: the share the cells have gathered and the ground heaves */
export const WRATH_HEAVES = 0.4;

/** Zygarde's green, its dark, and the rock thrown up */
export const ZYGARDE_GREEN = '#4aff7a';
export const ZYGARDE_DARK = '#163a26';
export const WRATH_ROCK = '#8a7652';

/** Shore Up: the share the dune and the castle have built by */
export const SHORE_BUILT = 0.5;

/** Palossand's sand, its dark, the shovel and the healing light */
export const SAND = '#ecd08e';
export const SAND_DARK = '#9a7a44';
export const SHOVEL_RED = '#e0504a';
export const HEAL_GREEN = '#8affb0';

/** Baneful Bunker: how many arms close over, and the share they meet by */
export const BUNKER_ARMS = 8;
export const BUNKER_CLOSED = 0.35;

/** Toxapex's violet arms, their dark, the pink spikes and the poison */
export const TOXAPEX_VIOLET = '#8a5ad8';
export const TOXAPEX_DARK = '#2e1a4a';
export const TOXAPEX_SPIKE = '#ff9ae0';
export const TOXIC_DRIP = '#c04ae8';

/** Ice Hammer: the share the fist lands by */
export const HAMMER_LANDS = 0.3;

/** Crabominable's fur, the frost on it and the dark of the claw */
export const HAMMER_FUR = '#f2f6ff';
export const HAMMER_FROST = '#8ad8ff';
export const HAMMER_DARK = '#3a4a6a';

/** Floral Healing: how many flowers are on the lei, and the share it settles by */
export const LEI_FLOWERS = 10;
export const LEI_SETTLES = 0.5;

/** Comfey's flowers, the vine and the healing gold */
export const LEI_COLOURS = ['#ff8ac8', '#ffffff', '#ffd23a'];
export const LEI_VINE = '#4a9a3a';
export const LEI_GOLD = '#ffe08a';

/** Toxic Thread: the share the silk reaches it by */
export const THREAD_LANDS = 0.3;

/** The toxic silk, the dark under it and the venom beads */
export const THREAD_PURPLE = '#c06aff';
export const THREAD_SHADE = '#3a1a4a';
export const VENOM_BEAD = '#e08aff';

/** Purify: the share the bubble has closed by, and the share it sparkles at */
export const PURIFY_CLOSES = 0.3;
export const PURIFY_SPARKLES = 0.75;

/** The clear light, the murk drawn out and Pyukumuku's pink */
export const PURIFY_CLEAR = '#d8f8ff';
export const PURIFY_MURK = '#7a4a8a';
export const PURIFY_PINK = '#ff9ac0';

/** Revelation Dance: the share the light is thrown at, and the share it lands */
export const REVELATION_THROWN = 0.4;
export const REVELATION_LANDS = 0.6;

/** Flying Press: the share Hawlucha's dive has come down by */
export const PRESS_LANDS = 0.4;

/** Hawlucha's green wings and the orange of its fighting body */
export const PRESS_GREEN = '#3fae5a';
export const PRESS_ORANGE = '#ff7a3a';

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

/** A filled outline, with a rim round it when `rim` is given */
function fill(
  context: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  alpha: number,
  rim?: string,
  width = 2,
): void {
  if (points.length < 3 || alpha <= 0) {
    return;
  }
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
  if (rim != null) {
    context.lineJoin = 'round';
    context.strokeStyle = fade(rim, alpha);
    context.lineWidth = width;
    context.stroke();
    context.lineJoin = 'miter';
  }
}

/** A filled oval with a dark rim, so a pale thing reads on snow */
function blob(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  color: string,
  rim: string,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, Math.max(0.5, across), Math.max(0.5, up), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade(rim, alpha * 0.7);
  context.lineWidth = Math.max(1, Math.min(across, up) * 0.14);
  context.stroke();
}

/** Points round an oval, from one angle to another */
function arc(
  [x, y]: Point,
  across: number,
  up: number,
  from: number,
  to: number,
  steps = 16,
): Point[] {
  const points: Point[] = [];

  for (let step = 0; step <= steps; step += 1) {
    const angle = from + (to - from) * (step / steps);

    points.push([x + Math.cos(angle) * across, y + Math.sin(angle) * up]);
  }
  return points;
}

/** A key: a ring for a bow, a shaft and two teeth, turned by `turn` */
function key(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  alpha: number,
): void {
  const along: Point = [Math.cos(turn), Math.sin(turn)];
  const at = (out: number, side: number): Point => [
    x + along[0] * out - along[1] * side,
    y + along[1] * out + along[0] * side,
  ];
  const width = Math.max(1, size * 0.22);

  strokeThrough(
    context,
    arc(at(-size * 0.55, 0), size * 0.4, size * 0.4, 0, Math.PI * 2, 12),
    width,
    KEY_GOLD,
    alpha,
    KEY_DARK,
  );
  strokeThrough(context, [at(-size * 0.15, 0), at(size, 0)], width, KEY_GOLD, alpha, KEY_DARK);
  strokeThrough(
    context,
    [at(size * 0.55, 0), at(size * 0.55, size * 0.35)],
    width,
    KEY_GOLD,
    alpha,
    KEY_DARK,
  );
  strokeThrough(
    context,
    [at(size * 0.85, 0), at(size * 0.85, size * 0.3)],
    width,
    KEY_GOLD,
    alpha,
    KEY_DARK,
  );
}

/** A hexagon lying on the ground: one of Zygarde's cells */
function cell(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  alpha: number,
): void {
  const points: Point[] = [];

  for (let corner = 0; corner < 6; corner += 1) {
    const angle = (corner / 6) * Math.PI * 2;

    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.45]);
  }
  fill(context, points, ZYGARDE_GREEN, alpha * 0.85, ZYGARDE_DARK, Math.max(1, radius * 0.25));
  orb(context, [x, y], radius * 0.5, { color: '#ffffff', alpha: alpha * 0.6 });
}

/** A flower of five petals round a gold middle */
function flower(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const angle = turn + (leaf / 5) * Math.PI * 2;

    petal(
      context,
      [x + Math.cos(angle) * size * 0.55, y + Math.sin(angle) * size * 0.55],
      size * 0.55,
      angle + Math.PI / 2,
      { color, alpha },
    );
  }
  orb(context, [x, y], size * 0.4, { color: LEI_GOLD, alpha });
}

/** A wrapped sweet: a round middle and a twist of wrapper at each end */
function candy(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  const along: Point = [Math.cos(turn), Math.sin(turn)];
  const across: Point = [-along[1], along[0]];

  for (const way of [1, -1]) {
    const neck: Point = [x + along[0] * size * 0.8 * way, y + along[1] * size * 0.8 * way];
    const end = size * 1.7 * way;

    fill(
      context,
      [
        neck,
        [x + along[0] * end + across[0] * size * 0.6, y + along[1] * end + across[1] * size * 0.6],
        [x + along[0] * end - across[0] * size * 0.6, y + along[1] * end - across[1] * size * 0.6],
      ],
      lighten(color, 0.3),
      alpha,
      PUMPKIN_DARK,
      Math.max(0.6, size * 0.12),
    );
  }
  blob(context, [x, y], size, size * 0.8, color, PUMPKIN_DARK, alpha);
}

/** Aegislash's shield outline: a flat top, straight sides and a point planted at `tip` */
function shieldOutline([x, y]: Point, width: number, height: number): Point[] {
  const top = y - height;

  return [
    [x - width, top],
    [x + width, top],
    [x + width, top + height * 0.5],
    [x + width * 0.55, top + height * 0.82],
    [x, y],
    [x - width * 0.55, top + height * 0.82],
    [x - width, top + height * 0.5],
  ];
}

const kalosSignatures = {
  // A tatami mat flipped up off the ground in front of the caster, its
  // straw weave and green cloth border slapping upright with a puff of dust
  Mat(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const foot = at[1] + size * 0.9;
    const flip = Math.min(1, share / MAT_FLIPS);
    const lean = flip ** 2 * (Math.PI / 2);
    const shown = Math.min(1, share * 10) * late(share, 0.7);
    // Lying flat it is only the ground's depth tall, standing it is all of it
    const tall = size * 2.4 * (Math.sin(lean) + Math.cos(lean) * 0.34);
    const half = size * 1.2;
    const top = foot - tall;

    fill(
      context,
      [
        [at[0] - half, foot],
        [at[0] + half, foot],
        [at[0] + half, top],
        [at[0] - half, top],
      ],
      MAT_STRAW,
      shown * 0.95,
      MAT_WEAVE,
      1.5 * stage.scale,
    );
    for (let line = 1; line < 7; line += 1) {
      const y = foot - (tall * line) / 7;

      strokeThrough(
        context,
        [
          [at[0] - half * 0.8, y],
          [at[0] + half * 0.8, y],
        ],
        1 * stage.scale,
        MAT_WEAVE,
        shown * 0.8,
      );
    }
    for (const way of [-1, 1]) {
      fill(
        context,
        [
          [at[0] + half * way, foot],
          [at[0] + half * 0.8 * way, foot],
          [at[0] + half * 0.8 * way, top],
          [at[0] + half * way, top],
        ],
        MAT_EDGE,
        shown,
      );
    }
    if (share < MAT_FLIPS * 0.85) {
      return;
    }
    const slap = Math.min(1, (share - MAT_FLIPS * 0.85) / 0.5);

    for (let cloud = 0; cloud < 6; cloud += 1) {
      const out = (cloud < 3 ? -1 : 1) * (0.9 + (cloud % 3) * 0.45 + slap * 0.9) * size;

      orb(
        context,
        [at[0] + out, foot - size * (0.15 + slap * 0.3 + noise(seed, cloud) * 0.2)],
        size * (0.45 + slap * 0.4),
        {
          color: MAT_DUST,
          alpha: decay(slap) * 0.7,
        },
      );
    }
    burst(context, [at[0], top], size * (1 + slap), 8, seed, {
      color: '#ffffff',
      alpha: decay(slap * 2),
      width: 2 * stage.scale,
    });
    motes(context, [at[0], foot], size * 2.4, many(8, weight), seed + 1, slap, {
      color: MAT_WEAVE,
      alpha: decay(slap),
      width: 2 * stage.scale,
    });
  },

  // A jack-o'-lantern grinning over it with candy wrappers tumbling
  // round, then a purple ghost glow settling onto it
  Treat(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const grin = Math.min(1, share / TREAT_GRINS);
    const held = Math.min(1, share * 8) * late(share, 0.6);
    const head: Point = [at[0], at[1] - size * 1.9 + Math.sin(share * 14) * size * 0.08];
    const big = size * (0.6 + grin * 0.4);

    orb(context, head, big * 2, { color: LANTERN_LIGHT, alpha: held * 0.35 });
    for (const [lobe, out] of [-0.55, 0.55, 0].entries()) {
      blob(
        context,
        [head[0] + out * big, head[1]],
        big * (lobe === 2 ? 0.8 : 0.7),
        big * 0.78,
        PUMPKIN_ORANGE,
        PUMPKIN_DARK,
        held,
      );
    }
    fill(
      context,
      [
        [head[0] - big * 0.1, head[1] - big * 0.7],
        [head[0] + big * 0.12, head[1] - big * 0.7],
        [head[0] + big * 0.22, head[1] - big * 1.1],
      ],
      PUMPKIN_STEM,
      held,
      PUMPKIN_DARK,
      1.4 * stage.scale,
    );
    // The face cut into it, lit from inside
    for (const way of [-1, 1]) {
      fill(
        context,
        [
          [head[0] + way * big * 0.2, head[1] - big * 0.05],
          [head[0] + way * big * 0.55, head[1] - big * 0.05],
          [head[0] + way * big * 0.38, head[1] - big * 0.4],
        ],
        LANTERN_LIGHT,
        held,
        PUMPKIN_DARK,
        1.2 * stage.scale,
      );
    }
    const mouth: Point[] = [];

    for (let tooth = 0; tooth <= 8; tooth += 1) {
      const across = tooth / 8 - 0.5;

      mouth.push([
        head[0] + across * big * 1.2,
        head[1] + big * (0.25 + across * across * -0.6) + (tooth % 2) * big * 0.14 * grin,
      ]);
    }
    mouth.push(
      [head[0] + big * 0.45, head[1] + big * 0.42],
      [head[0], head[1] + big * 0.55],
      [head[0] - big * 0.45, head[1] + big * 0.42],
    );
    fill(context, mouth, LANTERN_LIGHT, held, PUMPKIN_DARK, 1.2 * stage.scale);

    for (let sweet = 0; sweet < many(6, weight); sweet += 1) {
      const angle = noise(seed, sweet) * Math.PI * 2 + share * 5;
      const fall = (share * 1.2 + noise(seed, sweet + 20)) % 1;

      candy(
        context,
        [
          at[0] + Math.cos(angle) * size * 1.6,
          at[1] - size * 2.2 + fall * size * 3 + Math.sin(angle) * size * 0.3,
        ],
        size * 0.22,
        angle * 2,
        CANDY_COLOURS[sweet % CANDY_COLOURS.length],
        swell(fall) * late(share, 0.8),
      );
    }
    if (share < TREAT_SETTLES * 0.6) {
      return;
    }
    const settle = (share - TREAT_SETTLES * 0.6) / (1 - TREAT_SETTLES * 0.6);

    orb(context, at, size * 1.5, { color: TREAT_GHOST, alpha: swell(settle) * 0.45 });
    ring(context, at, size * (2.6 - Math.min(1, settle * 2) * 1.4), {
      color: TREAT_GHOST,
      alpha: swell(settle),
      width: 2.6 * stage.scale,
    });
    for (let wisp = 0; wisp < 5; wisp += 1) {
      const rise = (settle * 1.4 + noise(seed, wisp + 40)) % 1;

      petal(
        context,
        [at[0] + spread(seed, wisp) * size * 1.2, at[1] + size * 0.6 - rise * size * 2],
        size * 0.35,
        Math.sin(rise * 6) * 0.3,
        {
          color: lighten(TREAT_GHOST, 0.3),
          alpha: swell(rise) * decay(settle) * 0.9,
        },
      );
    }
  },

  // Dark gnarled branches and roots curling up round it out of the
  // ground, sickly green leaves drifting down and settling on it
  Curse(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const foot = at[1] + size * 0.9;
    const grow = 1 - (1 - Math.min(1, share / CURSE_GROWS)) ** 2;
    const shown = late(share, 0.75);

    for (let branch = 0; branch < 6; branch += 1) {
      const across = (branch / 5 - 0.5) * 2;
      const side = across < 0 ? 1 : -1;
      const base: Point = [at[0] + across * size * 1.5, foot + spread(seed, branch) * size * 0.15];
      const height = size * (2.2 + noise(seed, branch + 10) * 0.9);
      const points: Point[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const along = (step / 12) * grow;
        // Leaning in over it, the tip hooked in a curl
        const lean =
          Math.sin(along * Math.PI * 0.8) * size * 0.7 + Math.max(0, along - 0.7) * size * 2.2;

        points.push([
          base[0] + side * lean + Math.sin(along * 11 + branch) * size * 0.1,
          base[1] - along * height,
        ]);
      }
      strokeThrough(context, points, size * 0.26, CURSE_BARK, shown, CURSE_DARK);
      // A twig off the middle, and a root along the ground
      if (grow > 0.5) {
        const knot = points[6];

        strokeThrough(
          context,
          [knot, [knot[0] - side * size * 0.5 * grow, knot[1] - size * 0.45 * grow]],
          size * 0.12,
          CURSE_BARK,
          shown,
          CURSE_DARK,
        );
      }
      strokeThrough(
        context,
        [base, [base[0] - side * size * 0.7 * grow, base[1] + size * 0.12]],
        size * 0.16,
        CURSE_BARK,
        shown,
        CURSE_DARK,
      );
    }
    if (share < 0.2) {
      return;
    }
    const drift = (share - 0.2) / 0.8;

    orb(context, at, size * 1.6, { color: CURSE_GLOW, alpha: swell(drift) * 0.35 });
    for (let leaf = 0; leaf < many(9, weight); leaf += 1) {
      const fall = Math.min(1, drift * 1.6 - noise(seed, leaf + 30) * 0.5);

      if (fall <= 0) {
        continue;
      }
      petal(
        context,
        [
          at[0] + spread(seed, leaf) * size * 1.4 + Math.sin(fall * 7 + leaf) * size * 0.3,
          at[1] - size * 2.8 + fall * size * 2.6,
        ],
        size * 0.3,
        Math.sin(fall * 9 + leaf) * 0.8,
        { color: CURSE_LEAF, alpha: late(drift, 0.7) },
      );
    }
  },

  // A ring of keys turning round the field, drawn in, then a big
  // glowing padlock with its shackle clicking shut
  Lock(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const centre: Point = [at[0], at[1] - size * 0.5];
    const pull = Math.max(0, Math.min(1, (share - 0.25) / (LOCK_CLICKS - 0.25)));
    const keys = Math.min(1, share * 10) * decay(pull ** 2);

    for (let index = 0; index < LOCK_KEYS; index += 1) {
      const angle = (index / LOCK_KEYS) * Math.PI * 2 + share * Math.PI * 3;
      const out = 1 - pull * 0.8;

      key(
        context,
        [
          centre[0] + Math.cos(angle) * size * 2.6 * out,
          centre[1] + Math.sin(angle) * size * 0.9 * out,
        ],
        size * 0.55,
        angle + Math.PI / 2,
        keys,
      );
    }
    if (share < 0.3) {
      return;
    }
    const grown = 1 - (1 - Math.min(1, (share - 0.3) / 0.2)) ** 2;
    const shut = Math.min(1, Math.max(0, (share - LOCK_CLICKS) / 0.06));
    const shown = Math.min(1, (share - 0.3) * 8) * late(share, 0.85);
    const half = size * 0.9 * grown;
    const body: Point = [centre[0], centre[1] + size * 0.3];
    const raised = (1 - shut) * size * 0.6;

    orb(context, body, size * 2.4 * grown, { color: LOCK_PINK, alpha: shown * 0.35 });
    strokeThrough(
      context,
      arc([body[0], body[1] - half * 0.55 - raised], half * 0.6, half * 0.9, Math.PI, Math.PI * 2),
      half * 0.28,
      LOCK_STEEL,
      shown,
      KEY_DARK,
    );
    fill(
      context,
      [
        [body[0] - half, body[1] - half * 0.6],
        [body[0] + half, body[1] - half * 0.6],
        [body[0] + half, body[1] + half * 0.7],
        [body[0] - half, body[1] + half * 0.7],
      ],
      KEY_GOLD,
      shown,
      KEY_DARK,
      2 * stage.scale,
    );
    orb(context, body, half * 0.2, { color: KEY_DARK, alpha: shown });
    fill(
      context,
      [
        [body[0], body[1]],
        [body[0] + half * 0.14, body[1] + half * 0.45],
        [body[0] - half * 0.14, body[1] + half * 0.45],
      ],
      KEY_DARK,
      shown,
    );
    if (shut <= 0) {
      return;
    }
    const flash = (share - LOCK_CLICKS) / (1 - LOCK_CLICKS);

    orb(context, body, size * (1 + flash * 1.5), {
      color: '#ffffff',
      alpha: decay(flash * 2.5) * 0.9,
    });
    ring(context, body, size * (1.2 + flash * 2.6), {
      color: LOCK_PINK,
      alpha: decay(flash),
      width: 3 * stage.scale,
    });
    for (let glint = 0; glint < 5; glint += 1) {
      const angle = (glint / 5) * Math.PI * 2 + noise(seed, glint);

      star(
        context,
        [
          body[0] + Math.cos(angle) * size * (1.2 + flash * 1.4),
          body[1] + Math.sin(angle) * size * (1 + flash),
        ],
        size * 0.35,
        flash * 3,
        {
          color: LOCK_PINK,
          alpha: decay(flash),
        },
      );
    }
    motes(context, body, size * 2.6, many(8, weight), seed + 1, flash, {
      color: KEY_GOLD,
      alpha: decay(flash),
      width: 2.2 * stage.scale,
    });
  },

  // A tall royal shield driven point first into the ground before the
  // caster, the sword blade sliding down behind it and a gold flash off
  // its rim
  Aegis(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const plant = Math.min(1, share / AEGIS_PLANTS);
    const shown = Math.min(1, share * 10) * late(share, 0.75);
    const tip: Point = [at[0], at[1] + size * 1.1 - (1 - plant ** 2) * size * 2.5];
    const width = size * 1.1;
    const height = size * 3;
    const top = tip[1] - height;
    const slide = Math.max(
      0,
      Math.min(1, (share - AEGIS_PLANTS * 0.6) / (AEGIS_SHEATHED - AEGIS_PLANTS * 0.6)),
    );
    const hilt = top - size * 0.4 - (1 - slide) * size * 1.6;

    // The blade first, so the shield covers what has slid behind it
    if (share > AEGIS_PLANTS * 0.6) {
      fill(
        context,
        [
          [at[0] - size * 0.3, hilt],
          [at[0] + size * 0.3, hilt],
          [at[0] + size * 0.24, hilt + size * 2.6],
          [at[0], hilt + size * 3],
          [at[0] - size * 0.24, hilt + size * 2.6],
        ],
        '#eef2fa',
        shown,
        AEGIS_DARK,
        1.6 * stage.scale,
      );
      strokeThrough(
        context,
        [
          [at[0] - size * 0.7, hilt],
          [at[0] + size * 0.7, hilt],
        ],
        size * 0.24,
        AEGIS_GOLD,
        shown,
        AEGIS_DARK,
      );
      strokeThrough(
        context,
        [
          [at[0], hilt],
          [at[0], hilt - size * 0.7],
        ],
        size * 0.22,
        AEGIS_PURPLE,
        shown,
        AEGIS_DARK,
      );
    }
    const outline = shieldOutline(tip, width, height);

    fill(context, outline, AEGIS_STEEL, shown, AEGIS_GOLD, size * 0.24);
    fill(
      context,
      shieldOutline([tip[0], tip[1] - size * 0.3], width * 0.72, height * 0.78),
      lighten(AEGIS_STEEL, 0.3),
      shown * 0.6,
    );
    strokeThrough(
      context,
      [
        [tip[0], top + size * 0.9],
        [tip[0], tip[1] - size * 0.4],
      ],
      size * 0.14,
      AEGIS_GOLD,
      shown,
      AEGIS_DARK,
    );
    // A crown across the top of the face
    const crown: Point[] = [];

    for (let point = 0; point <= 4; point += 1) {
      crown.push([
        tip[0] + (point / 4 - 0.5) * width * 1.1,
        top + size * (point % 2 === 0 ? 0.25 : 0.6),
      ]);
    }
    strokeThrough(context, crown, size * 0.14, AEGIS_GOLD, shown, AEGIS_DARK);
    if (share < AEGIS_PLANTS) {
      return;
    }
    const flash = (share - AEGIS_PLANTS) / (1 - AEGIS_PLANTS);

    star(
      context,
      [tip[0] + width * 0.8, top + size * 0.3],
      size * (0.8 + swell(Math.min(1, flash * 2)) * 0.6),
      flash * 2,
      {
        color: '#fff6cc',
        alpha: decay(flash),
      },
    );
    ring(context, [tip[0], top + height * 0.5], size * (1.4 + flash * 2.4), {
      color: AEGIS_GOLD,
      alpha: decay(flash),
      width: 3 * stage.scale,
    });
    burst(context, [tip[0], top + height * 0.5], size * (2 + flash * 1.5), 12, seed, {
      color: AEGIS_GOLD,
      alpha: decay(flash * 1.5),
      width: 2 * stage.scale,
    });
    ripple(context, tip, size * (1 + flash * 2), {
      color: AEGIS_GOLD,
      alpha: decay(flash) * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Zygarde's green hexagon cells sliding in along the ground and
  // gathering under it, then the earth heaving up in a green-lit surge
  // of rock
  Wrathland(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const gather = Math.min(1, share / WRATH_HEAVES);
    const cells = late(share, WRATH_HEAVES + 0.1);

    ripple(context, foot, size * (2.4 - gather), {
      color: ZYGARDE_GREEN,
      alpha: gather * cells * 0.8,
      width: 3 * stage.scale,
    });
    for (let index = 0; index < many(10, weight); index += 1) {
      const angle = noise(seed, index) * Math.PI * 2;
      const out =
        size * (0.3 + noise(seed, index + 10) * 0.7 + (1 - gather) * (3 + noise(seed, index + 20)));

      cell(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34],
        size * 0.38,
        Math.min(1, share * 10) * cells,
      );
    }
    if (share < WRATH_HEAVES) {
      return;
    }
    const heave = (share - WRATH_HEAVES) / (1 - WRATH_HEAVES);
    const rise = 1 - (1 - Math.min(1, heave * 4)) ** 2;
    const rocks = late(heave, 0.5);

    orb(context, at, size * (1.4 + heave * 1.4), {
      color: ZYGARDE_GREEN,
      alpha: decay(heave) * 0.6,
    });
    for (let rock = 0; rock < 7; rock += 1) {
      const across = (rock / 6 - 0.5) * size * 3.4;
      const base: Point = [foot[0] + across, foot[1] + spread(seed, rock + 30) * size * 0.2];
      const tall =
        size * (1.4 + noise(seed, rock + 40) * 1.2) * rise * (1 - Math.abs(across) / (size * 3.4));
      const lean = spread(seed, rock + 50) * size * 0.3;

      fill(
        context,
        [
          [base[0] - size * 0.45, base[1]],
          [base[0] + size * 0.45, base[1]],
          [base[0] + lean + size * 0.1, base[1] - tall],
          [base[0] + lean - size * 0.15, base[1] - tall * 0.9],
        ],
        WRATH_ROCK,
        rocks,
        ZYGARDE_DARK,
        1.6 * stage.scale,
      );
      strokeThrough(
        context,
        [base, [base[0] + lean * 0.6, base[1] - tall * 0.7]],
        1.6 * stage.scale,
        ZYGARDE_GREEN,
        rocks,
      );
    }
    shards(context, at, size * 3, many(12, weight), seed + 1, heave, {
      color: WRATH_ROCK,
      alpha: decay(heave),
    });
    burst(context, foot, size * (1.6 + heave * 2), 12, seed + 2, {
      color: ZYGARDE_GREEN,
      alpha: decay(heave),
      width: 2.6 * stage.scale,
    });
    ripple(context, foot, size * (1.2 + heave * 3), {
      color: ZYGARDE_GREEN,
      alpha: decay(heave),
      width: 3 * stage.scale,
    });
  },

  // Sand swirling in round the caster and piling into a dune, a
  // sandcastle rising out of it with Palossand's shovel on top, and
  // healing light lifting off it
  Shore(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const foot = at[1] + size * 0.9;
    const built = Math.min(1, share / SHORE_BUILT);
    const sand = late(share, 0.6);
    const shown = Math.min(1, share * 10) * late(share, 0.85);

    for (let band = 0; band < 3; band += 1) {
      const turn = share * 9 + band * 2;

      sickle(
        context,
        [at[0], foot - size * (0.3 + band * 0.5)],
        size * (2.4 - built * 0.8 - band * 0.3),
        turn,
        turn + 1.6,
        size * 0.2,
        {
          color: band === 1 ? SAND_DARK : SAND,
          alpha: sand * 0.7,
        },
      );
    }
    for (let grain = 0; grain < many(18, weight); grain += 1) {
      const travel = (share * 1.6 + noise(seed, grain)) % 1;
      const angle = noise(seed, grain + 10) * Math.PI * 2 + share * 8;
      const out = size * (3 - travel * 2.4);

      orb(
        context,
        [
          at[0] + Math.cos(angle) * out,
          foot - size * 0.4 + Math.sin(angle) * out * 0.4 - travel * size * 0.4,
        ],
        size * 0.12,
        {
          color: grain % 2 === 0 ? SAND : SAND_DARK,
          alpha: sand,
        },
      );
    }
    fill(
      context,
      arc(
        [at[0], foot],
        size * (0.6 + built * 1.8),
        size * (0.2 + built * 0.7),
        Math.PI,
        Math.PI * 2,
      ),
      SAND,
      shown,
      SAND_DARK,
      1.6 * stage.scale,
    );
    // The castle: a tall middle tower and two short ones, each crenellated
    const rise = Math.max(0, Math.min(1, (share - 0.15) / (SHORE_BUILT - 0.15)));

    if (rise > 0) {
      for (const [across, wide, tall] of [
        [-0.75, 0.32, 1],
        [0.75, 0.32, 1],
        [0, 0.42, 1.7],
      ]) {
        const x = at[0] + across * size;
        const base = foot - size * 0.5;
        const top = base - tall * size * rise;

        fill(
          context,
          [
            [x - wide * size, base],
            [x + wide * size, base],
            [x + wide * size, top],
            [x + wide * size * 0.4, top],
            [x + wide * size * 0.4, top - size * 0.2],
            [x - wide * size * 0.2, top - size * 0.2],
            [x - wide * size * 0.2, top],
            [x - wide * size, top],
          ],
          SAND,
          shown,
          SAND_DARK,
          1.4 * stage.scale,
        );
      }
      const peak = foot - size * (0.7 + 1.7 * rise);

      strokeThrough(
        context,
        [
          [at[0], peak],
          [at[0], peak - size * 0.6 * rise],
        ],
        size * 0.1,
        SAND_DARK,
        shown,
      );
      fill(
        context,
        arc([at[0], peak - size * 0.75 * rise], size * 0.18, size * 0.26, 0, Math.PI * 2, 10),
        SHOVEL_RED,
        shown * rise,
        SAND_DARK,
        1.2 * stage.scale,
      );
      orb(context, [at[0], foot - size * 0.7], size * 0.2, { color: SAND_DARK, alpha: shown });
    }
    if (share < SHORE_BUILT * 0.8) {
      return;
    }
    const heal = (share - SHORE_BUILT * 0.8) / (1 - SHORE_BUILT * 0.8);

    orb(context, at, size * 1.8, { color: HEAL_GREEN, alpha: swell(heal) * 0.4 });
    for (let mote = 0; mote < many(8, weight); mote += 1) {
      const lift = (heal * 1.5 + noise(seed, mote + 30)) % 1;

      orb(
        context,
        [at[0] + spread(seed, mote + 40) * size * 1.6, foot - size * 0.4 - lift * size * 2.6],
        size * 0.2,
        {
          color: HEAL_GREEN,
          alpha: swell(lift) * decay(heal),
        },
      );
    }
    ring(context, at, size * (1.2 + heal * 1.6), {
      color: HEAL_GREEN,
      alpha: decay(heal),
      width: 2.4 * stage.scale,
    });
  },

  // Toxapex's spiked arms rising round the caster and closing over it
  // in a dome, poison beading on the spikes and dripping off
  Bunker(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const foot = at[1] + size * 0.9;
    const closed = 1 - (1 - Math.min(1, share / BUNKER_CLOSED)) ** 2;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const radius = size * 1.9;
    const apex: Point = [at[0], foot - size * 3];
    const armOf = (index: number): Point[] => {
      const angle = (index / BUNKER_ARMS) * Math.PI * 2;
      const base: Point = [
        at[0] + Math.cos(angle) * radius,
        foot + Math.sin(angle) * radius * 0.34,
      ];
      const points: Point[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const along = (step / 10) * closed * 0.96;
        const spot = between(base, apex, along);
        const bulge = Math.sin(Math.PI * along);

        points.push([
          spot[0] + Math.cos(angle) * radius * 0.35 * bulge,
          spot[1] - size * 0.7 * bulge,
        ]);
      }
      return points;
    };
    const armDrawn = (index: number): void => {
      const points = armOf(index);

      strokeThrough(context, points, size * 0.36, TOXAPEX_VIOLET, shown, TOXAPEX_DARK);
      for (const step of [3, 6, 9]) {
        const [x, y] = points[step];
        const out = x < at[0] ? -1 : 1;

        fill(
          context,
          [
            [x, y - size * 0.14],
            [x, y + size * 0.14],
            [x + out * size * 0.42, y - size * 0.1],
          ],
          TOXAPEX_SPIKE,
          shown,
          TOXAPEX_DARK,
          stage.scale,
        );
        if (share > 0.2) {
          const drip = (share * 1.8 + noise(seed, index * 3 + step)) % 1;

          orb(context, [x + out * size * 0.2, y + drip * size * 1.3], size * 0.14, {
            color: TOXIC_DRIP,
            alpha: shown * decay(drip),
          });
        }
      }
    };

    // The far arms behind the light inside, the near ones over it
    for (let index = 0; index < BUNKER_ARMS; index += 1) {
      if (Math.sin((index / BUNKER_ARMS) * Math.PI * 2) < 0) {
        armDrawn(index);
      }
    }
    orb(context, [at[0], foot - size * 1.2], size * 2 * closed, {
      color: TOXIC_DRIP,
      alpha: shown * 0.25,
    });
    for (let index = 0; index < BUNKER_ARMS; index += 1) {
      if (Math.sin((index / BUNKER_ARMS) * Math.PI * 2) >= 0) {
        armDrawn(index);
      }
    }
    if (share > BUNKER_CLOSED) {
      const shut = (share - BUNKER_CLOSED) / (1 - BUNKER_CLOSED);

      ripple(context, [at[0], foot], radius * (1 + shut * 0.8), {
        color: TOXIC_DRIP,
        alpha: decay(shut),
        width: 2.6 * stage.scale,
      });
    }
  },

  // A huge frost-furred pincer fist swung down from high on its side,
  // landing on it with ice shards bursting out
  Icehammer(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const swing = Math.min(1, share / HAMMER_LANDS) ** 2;
    const start: Point = [at[0] + size * 2.4, at[1] - size * 3.8];
    const end: Point = [at[0], at[1] - size * 0.8];
    const spotOf = (along: number): Point => {
      const spot = between(start, end, along);

      return [spot[0] + Math.sin(Math.PI * along) * size * 0.9, spot[1]];
    };
    const fist = spotOf(swing);
    const big = size * 1.3;
    const held = late(share, 0.55);

    for (let smear = 1; smear <= 4; smear += 1) {
      const back = Math.max(0, swing - smear * 0.08);

      orb(context, spotOf(back), big * (1 - smear * 0.12), {
        color: HAMMER_FROST,
        alpha: held * 0.3 * (1 - smear * 0.2),
      });
    }
    blob(context, fist, big, big * 0.85, HAMMER_FUR, HAMMER_DARK, held);
    // The claw split at the bottom, and frost and icicles on it
    fill(
      context,
      [
        [fist[0] - big * 0.12, fist[1] + big * 0.86],
        [fist[0], fist[1] + big * 0.1],
        [fist[0] + big * 0.12, fist[1] + big * 0.86],
      ],
      HAMMER_DARK,
      held,
    );
    for (let spot = 0; spot < 5; spot += 1) {
      const angle = -Math.PI * 0.85 + spot * 0.4;

      orb(
        context,
        [fist[0] + Math.cos(angle) * big * 0.6, fist[1] + Math.sin(angle) * big * 0.55],
        big * 0.2,
        {
          color: HAMMER_FROST,
          alpha: held,
        },
      );
    }
    for (const way of [-0.6, -0.3, 0.3, 0.6]) {
      const x = fist[0] + way * big;
      const y = fist[1] + big * 0.7;

      fill(
        context,
        [
          [x - big * 0.08, y],
          [x + big * 0.08, y],
          [x, y + big * 0.35],
        ],
        HAMMER_FROST,
        held,
        HAMMER_DARK,
        stage.scale,
      );
    }
    if (share < HAMMER_LANDS) {
      return;
    }
    const hit = (share - HAMMER_LANDS) / (1 - HAMMER_LANDS);

    orb(context, at, size * (1 + hit * 1.6), { color: '#ffffff', alpha: decay(hit * 2) * 0.9 });
    orb(context, at, size * (1.3 + hit * 1.6), { color: HAMMER_FROST, alpha: decay(hit) * 0.6 });
    shards(context, at, size * 3.2, many(14, weight), seed, hit, {
      color: HAMMER_FROST,
      alpha: decay(hit),
    });
    shards(context, at, size * 2.4, many(8, weight), seed + 1, hit, {
      color: '#ffffff',
      alpha: decay(hit),
    });
    burst(context, at, size * (1.6 + hit * 2), 12, seed + 2, {
      color: HAMMER_FROST,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    ripple(context, [at[0], at[1] + size * 0.9], size * (1.2 + hit * 3), {
      color: HAMMER_FROST,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
  },

  // A lei of pink, white and gold flowers turning as it floats down
  // over it, glowing as it settles, healing light rising off it
  Floral(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const settle = 1 - (1 - Math.min(1, share / LEI_SETTLES)) ** 2;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const centre: Point = [at[0], at[1] - size * 2.6 + settle * size * 2.6];
    const across = size * 1.5;
    const up = size * 0.45;

    orb(context, centre, size * 1.6, { color: LEI_COLOURS[0], alpha: shown * 0.3 });
    strokeThrough(
      context,
      arc(centre, across, up, 0, Math.PI * 2, 24),
      size * 0.12,
      LEI_VINE,
      shown,
    );
    for (let bloom = 0; bloom < LEI_FLOWERS; bloom += 1) {
      const angle = (bloom / LEI_FLOWERS) * Math.PI * 2 + share * 3;

      flower(
        context,
        [centre[0] + Math.cos(angle) * across, centre[1] + Math.sin(angle) * up],
        size * (0.42 + Math.sin(angle) * 0.08),
        angle,
        LEI_COLOURS[bloom % LEI_COLOURS.length],
        shown,
      );
    }
    if (share < LEI_SETTLES * 0.8) {
      return;
    }
    const heal = (share - LEI_SETTLES * 0.8) / (1 - LEI_SETTLES * 0.8);

    orb(context, at, size * 1.8, { color: LEI_GOLD, alpha: swell(heal) * 0.5 });
    for (let mote = 0; mote < many(8, weight); mote += 1) {
      const lift = (heal * 1.5 + noise(seed, mote)) % 1;
      const spot: Point = [
        at[0] + spread(seed, mote + 20) * size * 1.4,
        at[1] + size * 0.6 - lift * size * 2.6,
      ];

      if (mote % 2 === 0) {
        star(context, spot, size * 0.25, lift * 4, {
          color: LEI_GOLD,
          alpha: swell(lift) * decay(heal),
        });
      } else {
        petal(context, spot, size * 0.22, lift * 5, {
          color: LEI_COLOURS[0],
          alpha: swell(lift) * decay(heal),
        });
      }
    }
  },

  // Strings of purple silk shot across at it, then wound round it in
  // loops that pull tight, venom beading and dripping off them
  Thread(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const shot = Math.min(1, share / THREAD_LANDS);
    const shown = late(share, 0.8);

    for (let string = 0; string < 3; string += 1) {
      const end: Point = [at[0] + (string - 1) * size * 0.6, at[1] + (string - 1) * size * 0.3];
      const head = between(stage.source, end, shot);
      const points: Point[] = [];

      for (let step = 0; step <= 10; step += 1) {
        const spot = between(stage.source, head, step / 10);

        points.push([
          spot[0] + Math.sin((step / 10) * Math.PI) * size * 0.3 * (string - 1),
          spot[1] + Math.sin((step / 10) * Math.PI) * size * 0.2,
        ]);
      }
      strokeThrough(context, points, 1.6 * stage.scale, THREAD_PURPLE, shown, THREAD_SHADE);
      orb(context, head, size * 0.25, { color: VENOM_BEAD, alpha: shown });
      for (let bead = 1; bead < 4; bead += 1) {
        const spot = points[Math.floor((bead / 4) * 10)];
        const drip = (share * 1.5 + noise(seed, string * 4 + bead)) % 1;

        orb(context, [spot[0], spot[1] + drip * size * 0.8], size * 0.14, {
          color: VENOM_BEAD,
          alpha: shown * decay(drip),
        });
      }
    }
    if (share < THREAD_LANDS) {
      return;
    }
    const bind = (share - THREAD_LANDS) / (1 - THREAD_LANDS);
    const wound = Math.min(1, bind * 2.5);
    const tight = 1 - Math.min(1, bind * 2) * 0.35;

    orb(context, at, size * 1.4, { color: THREAD_PURPLE, alpha: swell(bind) * 0.3 });
    for (let loop = 0; loop < 3; loop += 1) {
      const centre: Point = [at[0], at[1] + (loop - 1) * size * 0.55];

      strokeThrough(
        context,
        arc(centre, size * 1.5 * tight, size * 0.4 * tight, loop, loop + wound * Math.PI * 2, 20),
        1.8 * stage.scale,
        THREAD_PURPLE,
        shown,
        THREAD_SHADE,
      );
    }
    for (let bead = 0; bead < many(6, weight); bead += 1) {
      const drip = (bind * 1.6 + noise(seed, bead + 30)) % 1;

      orb(
        context,
        [at[0] + spread(seed, bead + 40) * size * 1.3, at[1] + size * 0.5 + drip * size * 0.8],
        size * 0.16,
        {
          color: VENOM_BEAD,
          alpha: shown * swell(drip),
        },
      );
    }
  },

  // A bubble of clear light closing over it, murky purple wisps drawn
  // out through it and dissolving, then a sparkle as it is clean
  Purify(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const close = 1 - (1 - Math.min(1, share / PURIFY_CLOSES)) ** 2;
    const shell = Math.min(1, share * 8) * late(share, PURIFY_SPARKLES);
    const radius = size * (3 - close * 1.3);

    orb(context, at, radius, { color: PURIFY_CLEAR, alpha: shell * 0.35 });
    bubble(context, at, radius, { color: PURIFY_CLEAR, alpha: shell, width: 2.4 * stage.scale });
    ring(context, at, radius * 1.04, {
      color: PURIFY_PINK,
      alpha: shell * 0.6,
      width: 1.4 * stage.scale,
    });
    for (let wisp = 0; wisp < 6; wisp += 1) {
      const out = (share - 0.15 - noise(seed, wisp) * 0.15) / 0.5;

      if (out <= 0 || out >= 1) {
        continue;
      }
      const angle = (wisp / 6) * Math.PI * 2 + noise(seed, wisp + 10);
      const spot: Point = [
        at[0] + Math.cos(angle) * size * (0.3 + out * 2.4),
        at[1] + Math.sin(angle) * size * (0.2 + out * 1.6) - out * size * 0.8,
      ];

      orb(context, spot, size * 0.6 * decay(out * 0.7), {
        color: PURIFY_MURK,
        alpha: swell(out) * 0.4,
      });
      motes(context, spot, size * 0.8, 3, seed + wisp, out, {
        color: PURIFY_MURK,
        alpha: decay(out) * 0.6,
        width: 1.6 * stage.scale,
      });
    }
    if (share < PURIFY_SPARKLES - 0.1) {
      return;
    }
    const clean = (share - PURIFY_SPARKLES + 0.1) / (1 - PURIFY_SPARKLES + 0.1);

    ring(context, at, size * (1.7 + clean * 1.6), {
      color: PURIFY_CLEAR,
      alpha: decay(clean),
      width: 2.4 * stage.scale,
    });
    for (let glint = 0; glint < many(6, weight); glint += 1) {
      const angle = noise(seed, glint + 20) * Math.PI * 2;
      const out = size * (0.6 + noise(seed, glint + 30) * 1.4);

      star(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        size * 0.35 * swell(Math.min(1, clean * 1.4)),
        clean * 3,
        {
          color: glint % 2 === 0 ? '#ffffff' : PURIFY_PINK,
          alpha: decay(clean * 0.8),
        },
      );
    }
  },

  // Feathers and dance steps swirling up round the caster in a
  // flourish, then a burst of its own type's light thrown onto it
  Revelation(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const from = stage.source;
    const casterFoot = from[1] + size * 0.9;
    const light = lighten(paint.color, 0.5);
    const dancing = share < REVELATION_THROWN ? 1 : decay((share - REVELATION_THROWN) / 0.25);

    for (let step = 0; step < 6; step += 1) {
      const shownFrom = (step / 6) * REVELATION_THROWN * 0.8;

      if (share < shownFrom) {
        continue;
      }
      const angle = (step / 6) * Math.PI * 2;
      const spot: Point = [
        from[0] + Math.cos(angle) * size * 1.5,
        casterFoot + Math.sin(angle) * size * 0.5,
      ];

      ripple(context, spot, size * 0.32, {
        color: light,
        alpha: dancing * 0.9,
        width: 2 * stage.scale,
      });
      orb(context, spot, size * 0.3, { color: paint.color, alpha: dancing * 0.6 });
    }
    for (let feather = 0; feather < many(8, weight); feather += 1) {
      const climb = (share * 1.8 + feather / 8) % 1;
      const angle = climb * Math.PI * 3 + feather;
      const spot: Point = [
        from[0] + Math.cos(angle) * size * 1.5 * (1 - climb * 0.3),
        casterFoot - climb * size * 3.2 + Math.sin(angle) * size * 0.4,
      ];

      petal(context, spot, size * 0.42, angle + Math.PI / 2, {
        color: feather % 2 === 0 ? paint.color : light,
        alpha: dancing * swell(climb),
      });
    }
    sickle(context, [from[0], from[1]], size * 1.8, share * 10, share * 10 + 2.2, size * 0.24, {
      color: light,
      alpha: dancing * 0.6,
    });
    if (share < REVELATION_THROWN) {
      return;
    }
    if (share < REVELATION_LANDS) {
      const flight = (share - REVELATION_THROWN) / (REVELATION_LANDS - REVELATION_THROWN);
      const head = between(from, at, flight);

      strokeThrough(
        context,
        [between(from, at, Math.max(0, flight - 0.3)), head],
        size * 0.5,
        light,
        0.9,
        paint.color,
      );
      orb(context, head, size * 1.1, { color: paint.color, alpha: 1 });
      return;
    }
    const hit = (share - REVELATION_LANDS) / (1 - REVELATION_LANDS);

    orb(context, at, size * (1 + hit * 1.8), { color: '#ffffff', alpha: decay(hit * 2) });
    orb(context, at, size * (1.4 + hit * 1.8), { color: paint.color, alpha: decay(hit) * 0.8 });
    ring(context, at, size * (1.2 + hit * 2.8), {
      color: light,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    burst(context, at, size * (1.6 + hit * 2), 12, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    for (let feather = 0; feather < many(8, weight); feather += 1) {
      const angle = noise(seed, feather + 50) * Math.PI * 2;
      const out = size * (0.8 + hit * 2.6);

      petal(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        size * 0.4,
        angle + hit * 3,
        {
          color: feather % 2 === 0 ? paint.color : light,
          alpha: decay(hit),
        },
      );
    }
  },

  // Hawlucha's body splash: a winged shape diving out of the sky with
  // wind streaming off it, then the mat slammed in a starburst of both
  // its types
  Flyingpress(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];

    if (share < PRESS_LANDS) {
      const fall = (share / PRESS_LANDS) ** 1.6;
      const body: Point = [at[0] - size * 2.4 * (1 - fall), at[1] - size * 5 * (1 - fall)];
      const span = size * (1.6 + swell(fall) * 0.4);

      // The wings, a wide V pointing down the dive
      for (const side of [-1, 1]) {
        context.beginPath();
        context.moveTo(body[0], body[1]);
        context.lineTo(body[0] + side * span, body[1] - size * 0.9);
        context.lineTo(body[0] + side * span * 0.6, body[1] - size * 0.2);
        context.closePath();
        context.fillStyle = fade(PRESS_GREEN, 1);
        context.fill();
      }
      orb(context, body, size * 0.6, { color: PRESS_ORANGE, alpha: 1 });
      for (let line = 0; line < 4; line += 1) {
        const off = (line - 1.5) * size * 0.5;

        context.strokeStyle = fade('#ffffff', 0.7 * fall);
        context.lineWidth = 2 * stage.scale;
        context.beginPath();
        context.moveTo(body[0] + off - size * 1.2, body[1] - size * 2.4);
        context.lineTo(body[0] + off, body[1] - size * 0.6);
        context.stroke();
      }
      return;
    }
    const hit = (share - PRESS_LANDS) / (1 - PRESS_LANDS);

    orb(context, at, size * (1 + hit * 2), { color: '#fff4dc', alpha: decay(hit * 2.5) });
    star(context, at, size * (1.2 + hit * 1.6), hit * 2, {
      color: PRESS_ORANGE,
      alpha: decay(hit),
    });
    burst(context, at, size * (1.4 + hit * 2), 10, seed, {
      color: PRESS_GREEN,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let wave = 0; wave < 2; wave += 1) {
      ripple(context, foot, size * (0.8 + hit * (2.4 + wave)), {
        color: wave === 0 ? PRESS_ORANGE : PRESS_GREEN,
        alpha: decay(hit) * (1 - wave * 0.3),
        width: 3.4 * stage.scale,
      });
    }
    motes(context, foot, size * 2, 10, seed + 1, hit, {
      color: lighten(PRESS_GREEN, 0.4),
      alpha: decay(hit) * 0.8,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default kalosSignatures;
