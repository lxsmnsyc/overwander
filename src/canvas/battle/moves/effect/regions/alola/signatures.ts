import type { Point } from '../../../../stage';
import {
  beam,
  between,
  bolt,
  bone,
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
  petal,
  ring,
  ripple,
  shards,
  sickle,
  spread,
  star,
  swell,
} from '../../../__paint';
import { SIGNATURE_SCALE } from '../galar/legends';
import type { EffectShape, ShapePainter } from '../../shapes';
import { REACH, landing, many } from '../../shapes';

/** Trop Kick: the share the kick has swept across by */
export const TROP_LANDS = 0.4;

/** Tsareena's green, the dark under it, and the fruit colours of its leaves and sparkles */
export const TSAREENA_GREEN = '#4ec25a';
export const TSAREENA_DARK = '#1f5a2a';
export const TROP_FRUIT = ['#ff8a3a', '#ffd23a', '#ff5a8a', '#b4e84a', '#ff6a4a'];

/** Instruct: the share the sigil has formed by */
export const INSTRUCT_SIGIL = 0.3;

/** Oranguru's white fan, its purple and the glow of the order */
export const ORANGURU_FAN = '#f2eee4';
export const ORANGURU_PURPLE = '#7a4ab8';
export const INSTRUCT_GLOW = '#d8b0ff';

/** Beak Blast: the share the beak has heated by, and the share it lands at */
export const BEAK_HEATS = 0.45;
export const BEAK_LANDS = 0.6;

/** The beak cold and red-hot, the white of its heat and the fire */
export const BEAK_COLD = '#5a2a1a';
export const BEAK_RED = '#ff3a1a';
export const BEAK_HOT = '#ffe6a0';
export const BEAK_FIRE = '#ff8a2a';

/** Clanging Scales: how many clangs ring out, and how far apart they leave */
export const SCALES_CLANGS = 4;
export const SCALES_GAP = 0.12;

/** Kommo-o's gold scales, the dark under them and the grey of its hide */
export const KOMMO_GOLD = '#ffc83a';
export const KOMMO_DARK = '#4a3420';
export const KOMMO_GREY = '#9a94a0';

/** Shell Trap: the share the shell blows at */
export const TRAP_BLOWS = 0.5;

/** Turtonator's shell, its pale spikes and the fire in it */
export const SHELL_DARK = '#3a3236';
export const SHELL_SPIKE = '#f0e2b8';
export const SHELL_FIRE = '#ff4a1a';

/** Fleur Cannon: the share the petals have opened by, and the share the beam reaches it */
export const FLEUR_OPENS = 0.3;
export const FLEUR_REACHES = 0.45;

/** Magearna's pink, its steel and the pale of the beam's core */
export const MAGEARNA_PINK = '#ff5aa0';
export const MAGEARNA_STEEL = '#c4c8d4';
export const FLEUR_PALE = '#ffe2f0';

/** Shadow Bone: the share the bone lands at */
export const BONE_LANDS = 0.4;

/** The bone, its green ghost fire and the purple under the flames */
export const BONE_WHITE = '#efe8d4';
export const GHOST_FIRE = '#5aff8a';
export const GHOST_PURPLE = '#6a3aa0';

/** Accelerock: the share it lands at */
export const ACCEL_LANDS = 0.2;

/** Lycanroc's rock brown, the dark of the fragments and the dust */
export const ROCK_BROWN = '#b07a3a';
export const ROCK_DARK = '#4a3420';
export const ROCK_DUST = '#e8d4a8';

/** Spectral Thief: the share the caster has sunk by, and the share the hand pulls from */
export const THIEF_SINKS = 0.3;
export const THIEF_PULLS = 0.5;

/** Marshadow's shadow, its green flame and the colours of the stolen boosts */
export const SHADOW_DARK = '#1c1828';
export const THIEF_GREEN = '#6affa8';
export const STAT_COLOURS = ['#ff6a4a', '#ffb03a', '#5ab0ff', '#c86aff'];

/** Multi-Attack: the share the claws have cut across by */
export const MULTI_LANDS = 0.35;

/** The memory disc's steel and its dark */
export const DISC_STEEL = '#c8ccd8';
export const DISC_DARK = '#3a3a48';

/** Plasma Fists: how many fists land, and the share the last lands by */
export const PLASMA_FISTS = 4;
export const PLASMA_LANDS = 0.6;

/** The plasma's blue, its white core and Zeraora's gold */
export const PLASMA_BLUE = '#4ab8ff';
export const PLASMA_CORE = '#eef8ff';
export const ZERAORA_GOLD = '#ffd23a';

/** Clangorous Soul: how many times the scales clash, and how many arrows rise */
export const CLANGOR_BEATS = 4;
export const CLANGOR_ARROWS = 6;

/** Double Iron Bash: the shares the first and second fist land at */
export const IRONBASH_FIRST = 0.3;
export const IRONBASH_SECOND = 0.6;

/** Melmetal's silver, its dark and the gold of its hex nuts */
export const MELMETAL_STEEL = '#b8bcc8';
export const MELMETAL_DARK = '#3a3a48';
export const MELMETAL_GOLD = '#f0b83a';

/** A line through points, with a wider line under it when `under` is given */
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

/** The corners of a shape with `sides` corners round a point */
function corners([x, y]: Point, radius: number, sides: number, turn: number): Point[] {
  const points: Point[] = [];

  for (let corner = 0; corner < sides; corner += 1) {
    const angle = turn + (corner / sides) * Math.PI * 2;

    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return points;
}

/** A filled shape with `sides` corners, with a rim when `rim` is given */
function polygon(
  context: CanvasRenderingContext2D,
  at: Point,
  radius: number,
  sides: number,
  turn: number,
  color: string,
  alpha: number,
  rim?: string,
): void {
  if (alpha <= 0 || radius <= 0) {
    return;
  }
  context.beginPath();
  for (const [index, [x, y]] of corners(at, radius, sides, turn).entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
  if (rim != null) {
    context.strokeStyle = fade(rim, alpha);
    context.lineWidth = Math.max(1, radius * 0.18);
    context.stroke();
  }
}

/** One of Melmetal's hex nuts: gold, rimmed dark, with the hole through it */
function nut(
  context: CanvasRenderingContext2D,
  at: Point,
  size: number,
  turn: number,
  alpha: number,
): void {
  polygon(context, at, size, 6, turn, MELMETAL_GOLD, alpha, MELMETAL_DARK);
  polygon(context, at, size * 0.42, 12, turn, MELMETAL_DARK, alpha);
}

/** A stat arrow pointing up, rimmed dark so it reads on snow */
function arrow(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  const points: Point[] = [
    [x, y - size],
    [x + size * 0.7, y - size * 0.1],
    [x + size * 0.28, y - size * 0.1],
    [x + size * 0.28, y + size],
    [x - size * 0.28, y + size],
    [x - size * 0.28, y - size * 0.1],
    [x - size * 0.7, y - size * 0.1],
  ];

  if (alpha <= 0) {
    return;
  }
  context.beginPath();
  for (const [index, [px, py]] of points.entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](px, py);
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade('#2a2030', alpha * 0.6);
  context.lineWidth = Math.max(1, size * 0.14);
  context.stroke();
}

/** A tongue of flame licking up from a point, leant by `lean` */
function tongue(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  lean: number,
  color: string,
  alpha: number,
): void {
  const at: Point = [x + Math.sin(lean) * size * 0.5, y - Math.cos(lean) * size * 0.5];

  petal(context, at, size, lean, { color, alpha });
  petal(context, at, size * 0.5, lean, { color: lighten(color, 0.6), alpha });
}

/** A jagged arc of sound bowed out the way it travels */
function clang(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  facing: number,
  width: number,
  alpha: number,
): void {
  const points: Point[] = [];

  for (let step = 0; step <= 8; step += 1) {
    const angle = facing + (step / 8 - 0.5) * 1.8;
    const out = radius * (step % 2 === 0 ? 0.9 : 1.1);

    points.push([x + Math.cos(angle) * out, y + Math.sin(angle) * out]);
  }
  strokeThrough(context, points, width, KOMMO_GOLD, alpha, KOMMO_DARK);
}

const alolaSignatures = {
  // Tsareena's high kick swept up over it in an arc, shedding leaves
  // the colours of tropical fruit, and a sweet burst of sparkles where it lands
  Trop(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const pivot: Point = [at[0] - size * 0.3, at[1] + size * 1.2];
    const radius = size * 2.6;
    const start = -Math.PI * 1.05;
    const end = -Math.PI * 0.1;
    const swing = Math.min(1, share / TROP_LANDS) ** 0.8;
    const angle = start + (end - start) * swing;
    const shown = late(share, 0.6);

    sickle(context, pivot, radius, start, angle, size * 0.9, {
      color: TSAREENA_DARK,
      alpha: shown * 0.5,
    });
    sickle(context, pivot, radius, start, angle, size * 0.6, {
      color: TSAREENA_GREEN,
      alpha: shown * 0.9,
    });
    // The leaves shed along the arc, drifting down once the kick has passed them
    for (let leaf = 0; leaf < 8; leaf += 1) {
      const place = leaf / 8;

      if (swing < place) {
        continue;
      }
      const drift = swing - place + Math.max(0, share - TROP_LANDS);
      const along = start + (end - start) * place;
      const out = radius + spread(seed, leaf) * size * 0.4;

      petal(
        context,
        [
          pivot[0] + Math.cos(along) * out + spread(seed, leaf + 10) * drift * size * 0.6,
          pivot[1] + Math.sin(along) * out + drift * size * 1.5,
        ],
        size * 0.45,
        along + drift * 6,
        { color: TROP_FRUIT[leaf % TROP_FRUIT.length], alpha: late(share, 0.55) },
      );
    }
    if (share < TROP_LANDS + 0.1) {
      const foot: Point = [
        pivot[0] + Math.cos(angle) * radius,
        pivot[1] + Math.sin(angle) * radius,
      ];
      const fading = late(share, TROP_LANDS);

      orb(context, foot, size * 0.7, { color: TSAREENA_GREEN, alpha: fading });
      star(context, foot, size * 0.5, share * 8, { color: '#ffffff', alpha: fading });
    }
    if (share < TROP_LANDS) {
      return;
    }
    const hit = (share - TROP_LANDS) / (1 - TROP_LANDS);

    orb(context, at, size * (1 + hit * 1.4), { color: TROP_FRUIT[0], alpha: decay(hit) * 0.7 });
    ring(context, at, size * (0.8 + hit * 2.6), {
      color: TROP_FRUIT[2],
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let sparkle = 0; sparkle < many(10, weight); sparkle += 1) {
      const turn = noise(seed, sparkle + 20) * Math.PI * 2;
      const out = size * (0.6 + hit * 2.4) * (0.5 + noise(seed, sparkle + 40) * 0.5);

      star(
        context,
        [at[0] + Math.cos(turn) * out, at[1] + Math.sin(turn) * out - hit * size * 0.6],
        size * 0.35,
        share * 6 + sparkle,
        { color: TROP_FRUIT[sparkle % TROP_FRUIT.length], alpha: decay(hit) },
      );
    }
    motes(context, at, size * 2.4, many(10, weight), seed + 1, hit, {
      color: TROP_FRUIT[1],
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // Oranguru's fan pointing at its ally, a glowing sigil of command
  // drawn above it, and rings pulsing out of it like an order given
  Instruct(context, stage, share, { weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const shown = Math.min(1, share * 8) * late(share, 0.8);
    const sigil: Point = [at[0], at[1] - size * 2.2];
    const hub: Point = [at[0] - size * 2.4, at[1] - size * 0.2];
    const point = Math.atan2(sigil[1] - hub[1], sigil[0] - hub[0]);
    const open = Math.min(1, share / INSTRUCT_SIGIL);
    const formed = Math.min(1, Math.max(0, (share - 0.05) / (INSTRUCT_SIGIL - 0.05)));

    strokeThrough(
      context,
      [hub, [hub[0] - Math.cos(point) * size * 0.6, hub[1] - Math.sin(point) * size * 0.6]],
      size * 0.18,
      ORANGURU_PURPLE,
      shown,
    );
    // The fan: blades spread round its handle, pointed at the sigil
    for (let blade = 0; blade < 5; blade += 1) {
      const angle = point + (blade / 4 - 0.5) * 1.2 * open;
      const spot: Point = [
        hub[0] + Math.cos(angle) * size * 0.7,
        hub[1] + Math.sin(angle) * size * 0.7,
      ];

      petal(context, spot, size * 0.75, angle + Math.PI / 2, {
        color: ORANGURU_PURPLE,
        alpha: shown,
      });
      petal(context, spot, size * 0.6, angle + Math.PI / 2, { color: ORANGURU_FAN, alpha: shown });
    }
    for (let dot = 0; dot < 4; dot += 1) {
      const travel = (share * 2 + dot / 4) % 1;

      orb(context, between(hub, sigil, travel), size * 0.18, {
        color: INSTRUCT_GLOW,
        alpha: swell(travel) * shown * open,
      });
    }
    // The sigil: a ring with a six-pointed star in it, turning
    orb(context, sigil, size * 1.3, { color: INSTRUCT_GLOW, alpha: shown * formed * 0.4 });
    ring(context, sigil, size * 1.1 * formed, {
      color: INSTRUCT_GLOW,
      alpha: shown,
      width: 2.6 * stage.scale,
    });
    for (let triangle = 0; triangle < 2; triangle += 1) {
      const points = corners(sigil, size * 0.95 * formed, 3, share * 2 + triangle * Math.PI);

      points.push(points[0]);
      strokeThrough(
        context,
        points,
        1.8 * stage.scale,
        INSTRUCT_GLOW,
        shown * formed,
        ORANGURU_PURPLE,
      );
    }
    star(context, sigil, size * 0.4, share * 3, { color: '#ffffff', alpha: shown * formed });
    edge(context, sigil, at, size * 0.2, 0, { color: INSTRUCT_GLOW, alpha: shown * formed * 0.5 });
    if (share < INSTRUCT_SIGIL) {
      return;
    }
    for (let pulse = 0; pulse < 3; pulse += 1) {
      const out = ((share - INSTRUCT_SIGIL) * 2.2 + pulse / 3) % 1;

      ring(context, at, size * (0.6 + out * 2.4), {
        color: INSTRUCT_GLOW,
        alpha: decay(out) * shown,
        width: 2.4 * stage.scale,
      });
    }
    ripple(context, [at[0], at[1] + size * 0.6], size * 1.8, {
      color: ORANGURU_PURPLE,
      alpha: shown * 0.6,
      width: 2 * stage.scale,
    });
  },

  // Toucannon's beak heating over it till it glows red-hot, then
  // driven into the target in a burst of fire
  Beak(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const perch: Point = [stage.source[0], stage.source[1] - size * 1.8];
    const heat = Math.min(1, share / BEAK_HEATS);
    const drive = Math.min(1, Math.max(0, (share - BEAK_HEATS) / (BEAK_LANDS - BEAK_HEATS)));

    if (share < BEAK_LANDS) {
      const length = Math.max(1, Math.hypot(at[0] - perch[0], at[1] - perch[1]));
      const way: Point = [(at[0] - perch[0]) / length, (at[1] - perch[1]) / length];
      const head = between(perch, at, drive ** 1.5);
      const tip: Point = [head[0] + way[0] * size, head[1] + way[1] * size];
      const base: Point = [tip[0] - way[0] * size * 2.4, tip[1] - way[1] * size * 2.4];
      const colour = mix(BEAK_COLD, BEAK_RED, heat);

      if (drive > 0) {
        edge(context, perch, head, size * 0.7, 0, { color: BEAK_FIRE, alpha: drive * 0.6 });
      }
      orb(context, between(base, tip, 0.5), size * (1.3 + Math.sin(share * 40) * 0.15), {
        color: BEAK_RED,
        alpha: heat * 0.5,
      });
      // The two halves of the beak, the upper one the great curved one
      edge(context, base, tip, size * 0.55, -size * 0.2, { color: colour, alpha: 1 });
      edge(context, base, between(base, tip, 0.75), size * 0.3, size * 0.25, {
        color: mix(colour, BEAK_COLD, 0.4),
        alpha: 1,
      });
      edge(context, between(base, tip, 0.2), tip, size * 0.2, -size * 0.15, {
        color: BEAK_HOT,
        alpha: heat * 0.8,
      });
      motes(context, perch, size * 1.6, 8, seed, (share * 3) % 1, {
        color: BEAK_FIRE,
        alpha: heat,
        width: 2 * stage.scale,
      });
      return;
    }
    const blast = (share - BEAK_LANDS) / (1 - BEAK_LANDS);

    orb(context, at, size * (1.2 + blast * 1.8), { color: BEAK_HOT, alpha: decay(blast * 1.6) });
    orb(context, at, size * (1.6 + blast * 2), { color: BEAK_FIRE, alpha: decay(blast) * 0.8 });
    ring(context, at, size * (1 + blast * 3), {
      color: BEAK_RED,
      alpha: decay(blast),
      width: 3.5 * stage.scale,
    });
    for (let flame = 0; flame < many(7, weight); flame += 1) {
      const angle = -Math.PI * 0.1 - (flame / 6) * Math.PI * 0.8;
      const out = size * (0.6 + blast * 1.8);

      tongue(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7],
        size * 0.7 * decay(blast * 0.5),
        angle + Math.PI / 2,
        flame % 2 === 0 ? BEAK_FIRE : BEAK_RED,
        decay(blast),
      );
    }
    burst(context, at, size * (1.4 + blast * 2), 12, seed + 1, {
      color: BEAK_HOT,
      alpha: decay(blast),
      width: 2.6 * stage.scale,
    });
  },

  // Kommo-o's scales rattling on it, then jagged gold clangs ringing
  // across to the target, and scale shards bursting off it there
  Scales(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const from = stage.source;
    const facing = Math.atan2(at[1] - from[1], at[0] - from[0]);
    const shaking = late(share, 0.4);

    for (let one = 0; one < 7; one += 1) {
      const angle = -Math.PI * 0.9 + (one / 6) * Math.PI * 0.8;
      const jitter = Math.sin(share * 60 + one * 1.7) * size * 0.14;

      polygon(
        context,
        [
          from[0] + Math.cos(angle) * size * 1.3 + jitter,
          from[1] - size * 0.6 + Math.sin(angle) * size * 1.1,
        ],
        size * 0.32,
        4,
        jitter / size,
        KOMMO_GOLD,
        shaking,
        KOMMO_DARK,
      );
    }
    for (let one = 0; one < SCALES_CLANGS; one += 1) {
      const travel = (share - one * SCALES_GAP) / 0.4;

      if (travel < 0 || travel > 1) {
        continue;
      }
      clang(
        context,
        between(from, at, travel * 0.85),
        size * (0.7 + travel * 1.3),
        facing,
        3 * stage.scale,
        Math.min(1, (1 - travel) * 4),
      );
    }
    if (share < 0.4) {
      return;
    }
    const hit = (share - 0.4) / 0.6;

    ring(context, at, size * (0.8 + hit * 2.6), {
      color: KOMMO_GOLD,
      alpha: decay(hit),
      width: 3.5 * stage.scale,
    });
    orb(context, at, size * 1.2, { color: KOMMO_GOLD, alpha: swell(hit) * 0.5 });
    for (let piece = 0; piece < many(9, weight); piece += 1) {
      const angle = noise(seed, piece) * Math.PI * 2;
      const out = size * (0.4 + hit * (1.6 + noise(seed, piece + 20)));

      polygon(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out + hit * hit * size],
        size * 0.26,
        4,
        share * 8 + piece,
        piece % 3 === 0 ? KOMMO_GREY : KOMMO_GOLD,
        decay(hit),
        KOMMO_DARK,
      );
    }
    shards(context, at, size * 2.2, many(8, weight), seed + 1, hit, {
      color: KOMMO_GOLD,
      alpha: decay(hit),
    });
  },

  // Turtonator's spiked shell glowing over it, ticking hotter and
  // faster, then blowing up on the target in a burst of fire and shell
  Trap(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < TRAP_BLOWS + 0.1) {
      const tick = share / TRAP_BLOWS;
      const shown = Math.max(0, 1 - Math.max(0, share - TRAP_BLOWS) / 0.1);
      const [x, y] = [stage.source[0], stage.source[1] - size * 1.4];
      const pulse = 0.5 + 0.5 * Math.sin(tick ** 2 * 40);
      const hot = Math.min(1, tick) * pulse;

      orb(context, [x, y], size * (1.4 + tick * 0.6), {
        color: SHELL_FIRE,
        alpha: (0.3 + pulse * 0.5) * Math.min(1, tick) * shown,
      });
      for (let spike = 0; spike < 5; spike += 1) {
        const angle = -Math.PI * 0.85 + (spike / 4) * Math.PI * 0.7;
        const root: Point = [x + Math.cos(angle) * size * 1.05, y + Math.sin(angle) * size * 0.8];

        polygon(context, root, size * 0.45, 3, angle, SHELL_SPIKE, shown, SHELL_DARK);
        orb(
          context,
          [root[0] + Math.cos(angle) * size * 0.3, root[1] + Math.sin(angle) * size * 0.3],
          size * 0.3,
          { color: SHELL_FIRE, alpha: hot * shown },
        );
      }
      // The shell's dome, its rim reddening as it ticks
      context.beginPath();
      context.ellipse(x, y, size * 1.2, size * 0.9, 0, Math.PI, Math.PI * 2);
      context.closePath();
      context.fillStyle = fade(SHELL_DARK, shown);
      context.fill();
      context.strokeStyle = fade(mix(SHELL_DARK, SHELL_FIRE, hot), shown);
      context.lineWidth = 3 * stage.scale;
      context.stroke();
    }
    if (share < TRAP_BLOWS) {
      return;
    }
    const blast = (share - TRAP_BLOWS) / (1 - TRAP_BLOWS);

    orb(context, at, size * (1.2 + blast * 2.4), { color: '#fff0c0', alpha: decay(blast * 1.6) });
    orb(context, at, size * (1.6 + blast * 2.6), { color: SHELL_FIRE, alpha: decay(blast) * 0.85 });
    ring(context, at, size * (1 + blast * 3.6), {
      color: '#ffd27a',
      alpha: decay(blast),
      width: 4 * stage.scale,
    });
    ripple(context, [at[0], at[1] + size * 0.8], size * (1.2 + blast * 3.6), {
      color: SHELL_FIRE,
      alpha: decay(blast) * 0.8,
      width: 3 * stage.scale,
    });
    // Pieces of shell and spike thrown out of the blast
    for (let piece = 0; piece < many(10, weight); piece += 1) {
      const angle = noise(seed, piece) * Math.PI * 2;
      const out = size * (0.6 + blast * (2.4 + noise(seed, piece + 20) * 1.2));

      polygon(
        context,
        [
          at[0] + Math.cos(angle) * out,
          at[1] + Math.sin(angle) * out * 0.8 + blast ** 2 * size * 1.2,
        ],
        size * 0.3,
        3,
        share * 10 + piece,
        piece % 2 === 0 ? SHELL_SPIKE : SHELL_DARK,
        decay(blast),
      );
    }
    for (let flame = 0; flame < 7; flame += 1) {
      tongue(
        context,
        [at[0] + spread(seed, flame + 40) * size * 1.4, at[1] + size * 0.4 - blast * size],
        size * (0.6 + swell(blast) * 0.6),
        spread(seed, flame + 50) * 0.5,
        flame % 2 === 0 ? SHELL_FIRE : BEAK_FIRE,
        decay(blast),
      );
    }
    burst(context, at, size * (1.6 + blast * 2), 12, seed + 1, {
      color: '#ffd27a',
      alpha: decay(blast),
      width: 2.6 * stage.scale,
    });
  },

  // Magearna's petals opening round it in a ring of pink and steel,
  // then a thick pink beam pouring out, petals winding round it
  Fleur(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hub: Point = [stage.source[0], stage.source[1] - size * 1.2];
    const open = Math.min(1, share / FLEUR_OPENS);
    const held = late(share, 0.7);

    ring(context, hub, size * 1.3 * open, {
      color: MAGEARNA_STEEL,
      alpha: held,
      width: 3 * stage.scale,
    });
    for (let one = 0; one < 8; one += 1) {
      const angle = (one / 8) * Math.PI * 2 + share * 3;
      const out = size * (0.4 + open * 0.9);

      petal(
        context,
        [hub[0] + Math.cos(angle) * out, hub[1] + Math.sin(angle) * out],
        size * 0.6 * (0.4 + open * 0.6),
        angle + Math.PI / 2,
        { color: one % 2 === 0 ? MAGEARNA_PINK : MAGEARNA_STEEL, alpha: held },
      );
    }
    orb(context, hub, size * 0.7, { color: FLEUR_PALE, alpha: held });
    if (share < FLEUR_OPENS) {
      return;
    }
    const pour = Math.min(1, (share - FLEUR_OPENS) / (FLEUR_REACHES - FLEUR_OPENS));
    const shown = late(share, 0.75);
    const length = Math.max(1, Math.hypot(at[0] - hub[0], at[1] - hub[1]));
    const across: Point = [-(at[1] - hub[1]) / length, (at[0] - hub[0]) / length];

    beam(context, hub, at, pour, size * 1.5, { color: MAGEARNA_PINK, alpha: shown * 0.9 });
    beam(context, hub, at, pour, size * 0.5, { color: FLEUR_PALE, alpha: shown });
    // Petals winding round the beam as it pours, dimmer on the far side
    for (let one = 0; one < many(12, weight); one += 1) {
      const along = ((share * 1.6 + one / 12) % 1) * pour;
      const twist = along * Math.PI * 6 + share * 12 + one;
      const centre = between(hub, at, along);

      petal(
        context,
        [
          centre[0] + across[0] * Math.sin(twist) * size * 1.1,
          centre[1] + across[1] * Math.sin(twist) * size * 1.1,
        ],
        size * 0.4,
        twist,
        {
          color: one % 2 === 0 ? MAGEARNA_PINK : lighten(MAGEARNA_PINK, 0.5),
          alpha: shown * (Math.cos(twist) > 0 ? 1 : 0.5),
        },
      );
    }
    if (share < FLEUR_REACHES) {
      return;
    }
    const hit = (share - FLEUR_REACHES) / (1 - FLEUR_REACHES);

    orb(context, at, size * (1.2 + hit * 1.4), { color: MAGEARNA_PINK, alpha: decay(hit) * 0.8 });
    ring(context, at, size * (0.8 + hit * 2.6), {
      color: FLEUR_PALE,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let one = 0; one < 8; one += 1) {
      const angle = noise(seed, one) * Math.PI * 2;
      const out = size * (0.6 + hit * 2.4);

      petal(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        size * 0.4,
        angle + share * 6,
        { color: one % 2 === 0 ? MAGEARNA_PINK : MAGEARNA_STEEL, alpha: decay(hit) },
      );
    }
  },

  // A bone burning with green ghost fire swung down onto it, and
  // ghostly flames splashing up where it lands
  Bone(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const pivot: Point = [at[0] + size * 1.8, at[1] + size * 0.6];
    const length = size * 3.2;
    const start = -Math.PI * 0.45;
    const end = -Math.PI * 0.92;
    const swing = Math.min(1, share / BONE_LANDS) ** 1.6;
    const angle = start + (end - start) * swing;

    sickle(context, pivot, length * 0.8, start, angle, size * 0.8, {
      color: GHOST_FIRE,
      alpha: late(share, 0.55) * 0.6,
    });
    if (share < BONE_LANDS + 0.12) {
      const shown = Math.max(0, 1 - Math.max(0, share - BONE_LANDS) / 0.12);
      const centre: Point = [
        pivot[0] + Math.cos(angle) * length * 0.6,
        pivot[1] + Math.sin(angle) * length * 0.6,
      ];

      bone(context, centre, length * 0.8, angle, {
        color: GHOST_PURPLE,
        alpha: shown * 0.6,
        width: 9 * stage.scale,
      });
      bone(context, centre, length * 0.8, angle, {
        color: BONE_WHITE,
        alpha: shown,
        width: 5 * stage.scale,
      });
      for (let flame = 0; flame < 5; flame += 1) {
        const out = length * (0.3 + (flame / 4) * 0.6);

        tongue(
          context,
          [pivot[0] + Math.cos(angle) * out, pivot[1] + Math.sin(angle) * out],
          size * 0.5 * (0.8 + 0.2 * Math.sin(share * 30 + flame)),
          0,
          GHOST_FIRE,
          shown * 0.85,
        );
      }
    }
    if (share < BONE_LANDS) {
      return;
    }
    const hit = (share - BONE_LANDS) / (1 - BONE_LANDS);

    orb(context, at, size * (1 + hit * 1.6), { color: GHOST_FIRE, alpha: decay(hit) * 0.7 });
    ripple(context, [at[0], at[1] + size * 0.8], size * (1 + hit * 3), {
      color: GHOST_FIRE,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    // The ghost fire splashing up and out off the blow
    const count = many(9, weight);

    for (let flame = 0; flame < count; flame += 1) {
      const turn = -Math.PI * 0.1 - (flame / Math.max(1, count - 1)) * Math.PI * 0.8;
      const out = size * (0.5 + hit * 2);

      tongue(
        context,
        [at[0] + Math.cos(turn) * out, at[1] + Math.sin(turn) * out * 0.8 + hit * hit * size],
        size * 0.6 * decay(hit * 0.6),
        turn + Math.PI / 2,
        flame % 3 === 0 ? GHOST_PURPLE : GHOST_FIRE,
        decay(hit),
      );
    }
    burst(context, at, size * (1.2 + hit * 1.6), 10, seed, {
      color: BONE_WHITE,
      alpha: decay(hit * 1.5),
      width: 2.4 * stage.scale,
    });
  },

  // Rock-brown speed lines and boulder fragments darting in faster
  // than anything else on the field, and a quick sharp crack of rock
  Accelerock(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const from = stage.source;
    const run = Math.min(1, share / ACCEL_LANDS);
    const head = between(from, at, run);
    const shown = late(share, 0.35);
    const length = Math.max(1, Math.hypot(at[0] - from[0], at[1] - from[1]));
    const across: Point = [-(at[1] - from[1]) / length, (at[0] - from[0]) / length];

    for (let line = 0; line < 5; line += 1) {
      const off = (line - 2) * size * 0.35;
      const tail = between(from, head, 0.1 + noise(seed, line) * 0.3);
      const front = between(from, head, 0.95 - noise(seed, line + 10) * 0.15);

      edge(
        context,
        [tail[0] + across[0] * off, tail[1] + across[1] * off],
        [front[0] + across[0] * off, front[1] + across[1] * off],
        size * 0.12,
        0,
        { color: line % 2 === 0 ? ROCK_BROWN : ROCK_DUST, alpha: shown * 0.85 },
      );
    }
    // The boulder fragments rushing in with it
    for (let piece = 0; piece < 5; piece += 1) {
      const spot = between(from, head, Math.max(0, 1 - piece * 0.12 - noise(seed, piece) * 0.05));

      polygon(
        context,
        [
          spot[0] + across[0] * spread(seed, piece + 20) * size * 0.6,
          spot[1] + across[1] * spread(seed, piece + 20) * size * 0.6,
        ],
        size * (0.38 - piece * 0.04),
        5,
        share * 20 + piece,
        ROCK_BROWN,
        shown,
        ROCK_DARK,
      );
    }
    if (share < ACCEL_LANDS) {
      return;
    }
    const hit = (share - ACCEL_LANDS) / (1 - ACCEL_LANDS);

    burst(context, at, size * (1.2 + hit * 1.6), 8, seed, {
      color: ROCK_DUST,
      alpha: decay(hit * 1.5),
      width: 3 * stage.scale,
    });
    ring(context, at, size * (0.8 + hit * 2.2), {
      color: ROCK_BROWN,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    for (let chip = 0; chip < many(8, weight); chip += 1) {
      const angle = noise(seed, chip + 30) * Math.PI * 2;
      const out = size * (0.5 + hit * 2.2);

      polygon(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out + hit * hit * size],
        size * 0.25,
        4,
        share * 12 + chip,
        ROCK_BROWN,
        decay(hit),
        ROCK_DARK,
      );
    }
    motes(context, at, size * 2, many(8, weight), seed + 1, hit, {
      color: ROCK_DUST,
      alpha: decay(hit) * 0.7,
      width: 2.4 * stage.scale,
    });
  },

  // Marshadow slipping into the target's shadow, a dark hand rising
  // out of it, and the target's glowing boosts pulled back to the caster
  Thief(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const from = stage.source;
    const home: Point = [from[0], from[1] + size * 0.6];
    const foot: Point = [at[0], at[1] + size * 0.8];
    const sink = Math.min(1, share / THIEF_SINKS);
    const shown = late(share, 0.8);
    const pool = (spot: Point, radius: number, alpha: number): void => {
      context.beginPath();
      context.ellipse(spot[0], spot[1], radius, radius * 0.34, 0, 0, Math.PI * 2);
      context.fillStyle = fade(SHADOW_DARK, alpha);
      context.fill();
    };

    // The caster's shadow running across the ground into the target's
    pool(home, size * 1.4 * decay(sink * 0.8), 0.4 * shown);
    for (let patch = 0; patch < 6; patch += 1) {
      const along = (patch / 5) * sink;

      pool(between(home, foot, along), size * 0.6, 0.3 * shown * (1 - Math.abs(along - sink)));
    }
    pool(foot, size * 1.6 * sink, 0.4 * shown);
    ripple(context, foot, size * 1.6 * sink, {
      color: THIEF_GREEN,
      alpha: shown * 0.8,
      width: 2 * stage.scale,
    });
    if (share < THIEF_SINKS) {
      return;
    }
    const rise = Math.min(1, (share - THIEF_SINKS) / (THIEF_PULLS - THIEF_SINKS));
    const grab = Math.max(0, (share - THIEF_PULLS) / (1 - THIEF_PULLS));
    const palm: Point = [foot[0], foot[1] - size * (0.6 + rise * 1.6)];

    // The hand, dark with a green edge of Marshadow's flame
    strokeThrough(context, [foot, palm], size * 0.5, SHADOW_DARK, shown, THIEF_GREEN);
    for (let finger = 0; finger < 4; finger += 1) {
      const angle = -Math.PI / 2 + (finger - 1.5) * 0.35;
      const reach = size * 0.9 * (1 - Math.min(1, grab * 3) * 0.45);

      strokeThrough(
        context,
        [palm, [palm[0] + Math.cos(angle) * reach, palm[1] + Math.sin(angle) * reach]],
        size * 0.2,
        SHADOW_DARK,
        shown,
        THIEF_GREEN,
      );
    }
    // The boosts lifted out of it and pulled back across to the caster
    for (let one = 0; one < STAT_COLOURS.length; one += 1) {
      const above: Point = [
        at[0] + (one - 1.5) * size * 0.7,
        at[1] - size * 1.4 - (one % 2) * size * 0.3,
      ];
      const back = Math.min(1, Math.max(0, grab * 1.4 - one * 0.08));
      const spot = between(above, [from[0], from[1] - size], back ** 1.4);
      const alpha = rise * late(back, 0.75);

      orb(context, spot, size * 0.6, { color: STAT_COLOURS[one], alpha: alpha * 0.5 });
      arrow(context, spot, size * 0.4, STAT_COLOURS[one], alpha);
    }
    motes(context, palm, size * 1.4, many(8, weight), seed, rise, {
      color: THIEF_GREEN,
      alpha: shown * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Silvally's claws raking across it in front of a memory disc
  // spinning behind, the memory's type colour flaring through the cut
  Multi(context, stage, share, { seed, weight, paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = Math.min(1, share * 8) * late(share, 0.7);
    const spin = share * 10;

    ring(context, at, size * 2.3, { color: DISC_DARK, alpha: shown * 0.6, width: 7 * stage.scale });
    ring(context, at, size * 2.3, {
      color: DISC_STEEL,
      alpha: shown,
      width: 4 * stage.scale,
    });
    ring(context, at, size * 1.85, {
      color: paint.color,
      alpha: shown,
      width: 3 * stage.scale,
    });
    for (let notch = 0; notch < 8; notch += 1) {
      const angle = spin + (notch / 8) * Math.PI * 2;

      strokeThrough(
        context,
        [
          [at[0] + Math.cos(angle) * size * 1.95, at[1] + Math.sin(angle) * size * 1.95],
          [at[0] + Math.cos(angle) * size * 2.6, at[1] + Math.sin(angle) * size * 2.6],
        ],
        2.6 * stage.scale,
        DISC_STEEL,
        shown,
        DISC_DARK,
      );
    }
    orb(context, at, size * 1.6, { color: paint.color, alpha: shown * 0.3 });
    // Three claw cuts drawn down across it
    const cut = Math.min(1, Math.max(0, (share - 0.08) / (MULTI_LANDS - 0.08)));
    const clawn = late(share, 0.6);

    for (let claw = 0; claw < 3; claw += 1) {
      const off = (claw - 1) * size * 0.55;
      const start: Point = [at[0] - size * 1.6 + off, at[1] - size * 1.6 - off];
      const tip = between(start, [at[0] + size * 1.6 + off, at[1] + size * 1.6 - off], cut);

      if (cut <= 0) {
        continue;
      }
      edge(context, start, tip, size * 0.5, size * 0.3, { color: paint.color, alpha: clawn * 0.6 });
      edge(context, start, tip, size * 0.28, size * 0.3, { color: DISC_DARK, alpha: clawn * 0.5 });
      edge(context, start, tip, size * 0.16, size * 0.3, { color: '#ffffff', alpha: clawn });
    }
    if (share < MULTI_LANDS) {
      return;
    }
    const flare = (share - MULTI_LANDS) / (1 - MULTI_LANDS);

    orb(context, at, size * (1 + flare * 1.6), {
      color: lighten(paint.color, 0.3),
      alpha: decay(flare),
    });
    burst(context, at, size * (1.4 + flare * 1.8), 10, seed, {
      color: paint.color,
      alpha: decay(flare),
      width: 2.6 * stage.scale,
    });
    motes(context, at, size * 2.4, many(10, weight), seed + 1, flare, {
      color: lighten(paint.color, 0.4),
      alpha: decay(flare),
      width: 2.4 * stage.scale,
    });
  },

  // Zeraora's fists of blue-white plasma landing on it one after
  // another, arcs crackling off each, and ionised sparks hanging in the air
  Plasma(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (let fist = 0; fist < PLASMA_FISTS; fist += 1) {
      const lands = ((fist + 1) / PLASMA_FISTS) * PLASMA_LANDS;
      const run = (share - (lands - 0.15)) / 0.15;

      if (run < 0) {
        continue;
      }
      const side = fist % 2 === 0 ? -1 : 1;
      const spot: Point = [
        at[0] + spread(seed, fist) * size * 0.8,
        at[1] + spread(seed, fist + 10) * size * 0.6,
      ];

      if (run < 1) {
        const from: Point = [spot[0] + side * size * 2.6, spot[1] + size * 1.4];
        const head = between(from, spot, run);

        edge(context, from, head, size * 0.4, 0, { color: PLASMA_BLUE, alpha: 0.5 });
        orb(context, head, size * 0.8, { color: PLASMA_BLUE, alpha: 1 });
        orb(context, head, size * 0.45, { color: PLASMA_CORE, alpha: 1 });
        bolt(
          context,
          head,
          [head[0] + side * size * 0.8, head[1] - size * 0.6],
          seed + fist + Math.floor(share * 30),
          { color: PLASMA_CORE, alpha: 0.8, width: 1.6 * stage.scale },
        );
        continue;
      }
      const hit = (share - lands) / 0.25;

      if (hit >= 1) {
        continue;
      }
      orb(context, spot, size * (0.6 + hit * 1.2), { color: PLASMA_CORE, alpha: decay(hit) });
      ring(context, spot, size * (0.5 + hit * 1.6), {
        color: PLASMA_BLUE,
        alpha: decay(hit),
        width: 2.6 * stage.scale,
      });
      for (let arc = 0; arc < 3; arc += 1) {
        const angle = noise(seed + fist, arc) * Math.PI * 2;
        const out = size * (1 + hit * 1.4);

        bolt(
          context,
          spot,
          [spot[0] + Math.cos(angle) * out, spot[1] + Math.sin(angle) * out],
          seed + fist * 7 + arc + Math.floor(share * 40),
          { color: PLASMA_BLUE, alpha: decay(hit), width: 2 * stage.scale },
        );
      }
    }
    // The ionised air left round it, twinkling
    const field = Math.min(1, share * 2.5) * late(share, 0.75);

    for (let spark = 0; spark < many(14, weight); spark += 1) {
      const angle = noise(seed, spark + 30) * Math.PI * 2;
      const out = size * (0.8 + noise(seed, spark + 50) * 1.8);

      star(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        size * 0.2,
        share * 4,
        {
          color: spark % 4 === 0 ? ZERAORA_GOLD : PLASMA_CORE,
          alpha: swell((share * 3 + noise(seed, spark + 70)) % 1) * field,
        },
      );
    }
  },

  // Kommo-o clashing its scales together in a gold rhythm, a ring of
  // gold arrows rising round it and the glow of a war dance
  Clangor(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const shown = Math.min(1, share * 8) * late(share, 0.8);
    const foot: Point = [at[0], at[1] + size * 0.8];
    const beat = share * CLANGOR_BEATS;
    const phase = beat % 1;
    const meet: Point = [at[0], at[1] - size * 0.9];

    orb(context, at, size * (1.6 + Math.sin(beat * Math.PI * 2) * 0.2), {
      color: KOMMO_GOLD,
      alpha: shown * 0.35,
    });
    ripple(context, foot, size * (1.8 + decay(phase) * 0.4), {
      color: KOMMO_GOLD,
      alpha: shown * 0.8,
      width: 3 * stage.scale,
    });
    // Two plates of scales swung together on each beat
    const gap = size * (0.25 + Math.sin(Math.PI * phase) * 1.2);

    for (const side of [-1, 1]) {
      for (let one = 0; one < 3; one += 1) {
        polygon(
          context,
          [meet[0] + side * (gap + one * size * 0.18), meet[1] + (one - 1) * size * 0.45],
          size * 0.35,
          4,
          0,
          KOMMO_GOLD,
          shown,
          KOMMO_DARK,
        );
      }
    }
    star(context, meet, size * 0.8 * decay(phase * 4), share * 3, {
      color: '#fff4cc',
      alpha: decay(phase * 4) * shown,
    });
    ring(context, meet, size * (0.4 + phase * 1.6), {
      color: KOMMO_GOLD,
      alpha: decay(phase) * shown,
      width: 2.6 * stage.scale,
    });
    for (let one = 0; one < CLANGOR_ARROWS; one += 1) {
      const angle = (one / CLANGOR_ARROWS) * Math.PI * 2 + share * 2;
      const rise = (share * 1.5 + one / CLANGOR_ARROWS) % 1;

      arrow(
        context,
        [
          at[0] + Math.cos(angle) * size * 1.7,
          foot[1] + Math.sin(angle) * size * 0.5 - rise * size * 2.6,
        ],
        size * 0.35,
        KOMMO_GOLD,
        swell(rise) * shown,
      );
    }
    motes(context, at, size * 2, many(8, weight), seed, (share * 2) % 1, {
      color: lighten(KOMMO_GOLD, 0.4),
      alpha: shown * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Melmetal's two great hex-nut fists swung in one after the other,
  // each landing on it with a heavy ring of metal
  Ironbash(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    for (const [fist, lands] of [IRONBASH_FIRST, IRONBASH_SECOND].entries()) {
      const side = fist === 0 ? -1 : 1;
      const swing = (share - (lands - 0.3)) / 0.3;

      if (swing < 0) {
        continue;
      }
      if (swing < 1.25) {
        const t = Math.min(1, swing) ** 1.6;
        const alpha = swing < 1 ? 1 : 1 - (swing - 1) / 0.25;
        const from: Point = [at[0] + side * size * 3, at[1] - size * 2];
        const shoulder: Point = [at[0] + side * size * 3.6, at[1] + size * 1.2];
        const place = (along: number): Point => {
          const [x, y] = between(from, at, along);

          return [x, y - Math.sin(Math.PI * along) * size * 0.8];
        };
        const fistAt = place(t);
        const trail: Point[] = [];

        for (let step = 0; step <= 5; step += 1) {
          trail.push(place(Math.max(0, t - 0.3 + (step / 5) * 0.3)));
        }
        strokeThrough(context, trail, size * 0.9, MELMETAL_STEEL, alpha * 0.35);
        strokeThrough(
          context,
          [shoulder, fistAt],
          size * 0.6,
          MELMETAL_STEEL,
          alpha,
          MELMETAL_DARK,
        );
        nut(context, fistAt, size * 0.95, side * t * 1.5, alpha);
      }
      const hit = (share - lands) / 0.35;

      if (hit < 0 || hit >= 1) {
        continue;
      }
      ring(context, at, size * (0.8 + hit * 2.4), {
        color: MELMETAL_GOLD,
        alpha: decay(hit),
        width: 4 * stage.scale * decay(hit * 0.5),
      });
      ring(context, at, size * (0.5 + hit * 1.6), {
        color: '#ffffff',
        alpha: decay(hit),
        width: 2.4 * stage.scale,
      });
      star(context, at, size * 0.9 * decay(hit), fist, { color: '#ffffff', alpha: decay(hit) });
      burst(context, at, size * (1.2 + hit * 1.4), 10, seed + fist, {
        color: MELMETAL_STEEL,
        alpha: decay(hit),
        width: 2.6 * stage.scale,
      });
      shards(context, at, size * 2, many(6, weight), seed + fist, hit, {
        color: MELMETAL_STEEL,
        alpha: decay(hit),
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default alolaSignatures;
