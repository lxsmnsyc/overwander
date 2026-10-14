import type { Point } from '../../../../stage';
import {
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
  spread,
  star,
  swell,
} from '../../../__paint';
import type { EffectShape, ShapePainter } from '../../shapes';
import { REACH, landing, many } from '../../shapes';

/** Collision Course: the share the charge has crossed the field by */
export const COLLISION_LANDS = 0.35;

/** Koraidon's crimson and the gold of its wheels' fire */
export const KORAIDON_RED = '#e8343a';
export const KORAIDON_GOLD = '#ffb43a';

/** Electro Drift: the share the drift has swept round onto the target by */
export const DRIFT_LANDS = 0.45;

/** Miraidon's violet and the neon cyan of its lights */
export const MIRAIDON_VIOLET = '#8a4cff';
export const MIRAIDON_CYAN = '#45f0ff';

/** Ruination: the share the four treasures have closed in by */
export const RUINATION_CLOSES = 0.4;

/** The treasures' tarnished gold and the dark they fall out of */
export const RUIN_GOLD = '#c9a24a';
export const RUIN_DARK = '#2a1a2e';

/** Ivy Cudgel: the share the club has come down by */
export const CUDGEL_LANDS = 0.35;

/** The club's wood, and the ivy wound round it */
export const CUDGEL_WOOD = '#8a5a34';
export const IVY_GREEN = '#3fbf5a';

/** Tera Starstorm: the share the crystal stars start landing at, and how many fall */
export const STARSTORM_FALLS = 0.25;
export const STARSTORM_STARS = 7;

/** The Terastal crystal's colours, round the rainbow */
export const TERA_COLOURS = ['#ff6a8a', '#ffd25a', '#6aff9a', '#5ad2ff', '#b07aff'];

/** Malignant Chain: the share the chains have wound tight by */
export const CHAIN_BINDS = 0.45;

/** Pecharunt's poison: the chains' magenta and the drip off them */
export const CHAIN_MAGENTA = '#d43cc8';
export const CHAIN_DRIP = '#8aff4a';
export const CHAIN_DARK = '#4a0f46';

/** How many chains bind the target, and how many links each is drawn with */
export const CHAINS = 3;
export const CHAIN_LINKS = 9;

/** A hexagon of Terastal crystal, filled, with a pale facet */
function crystal(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  context.beginPath();
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = turn + (corner / 6) * Math.PI * 2;
    const point: Point = [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];

    if (corner === 0) {
      context.moveTo(point[0], point[1]);
    } else {
      context.lineTo(point[0], point[1]);
    }
  }
  context.closePath();
  context.fillStyle = fade(color, alpha * 0.75);
  context.fill();
  context.strokeStyle = fade(lighten(color, 0.6), alpha);
  context.lineWidth = Math.max(1, radius * 0.15);
  context.stroke();
}

/** One chain link: a small oval turned along the chain */
function link(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, size, size * 0.5, turn, 0, Math.PI * 2);
  // A dark rim under the colour, so the links read on a bright ground
  context.strokeStyle = fade(CHAIN_DARK, alpha);
  context.lineWidth = Math.max(2, size * 0.6);
  context.stroke();
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = Math.max(1, size * 0.3);
  context.stroke();
}

const paldea = {
  // Koraidon charging in low behind a trail of fire off its wheels, and
  // the ground breaking open in a crimson shock where it hits
  Collision(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;

    if (share < COLLISION_LANDS) {
      const run = (share / COLLISION_LANDS) ** 1.4;
      const head = between(stage.source, at, run);
      const tail = between(stage.source, at, Math.max(0, run - 0.45));

      edge(context, tail, head, size * 1.4, 0, { color: KORAIDON_GOLD, alpha: 0.5 });
      edge(context, tail, head, size * 0.7, 0, { color: KORAIDON_RED, alpha: 0.9 });
      orb(context, head, size * 1.1, { color: KORAIDON_RED, alpha: 1 });
      motes(context, tail, size * 1.4, 8, seed, run, { color: KORAIDON_GOLD, alpha: 0.8 });
      return;
    }
    const hit = (share - COLLISION_LANDS) / (1 - COLLISION_LANDS);
    const foot: Point = [at[0], at[1] + size * 0.8];

    orb(context, at, size * (1 + hit * 2.4), { color: '#fff2d8', alpha: decay(hit * 2.5) });
    orb(context, at, size * (1.4 + hit * 2), { color: KORAIDON_RED, alpha: decay(hit) * 0.8 });
    ring(context, at, size * (1 + hit * 3.4), {
      color: KORAIDON_GOLD,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    ripple(context, foot, size * (1.2 + hit * 3.6), {
      color: KORAIDON_RED,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    shards(context, at, size * 3, many(14, weight), seed, hit, {
      color: mix(KORAIDON_RED, '#5a3a2a', 0.5),
      alpha: decay(hit),
    });
    burst(context, at, size * (1.6 + hit * 2), 12, seed + 1, {
      color: KORAIDON_GOLD,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
  },

  // A neon streak drifting round in a wide curve from Miraidon's side,
  // and a square of light and sparks where it cuts through the target
  Neon(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const bend: Point = [(stage.source[0] + at[0]) / 2 + size * 4, (stage.source[1] + at[1]) / 2];
    const along = (t: number): Point => {
      const u = 1 - t;

      return [
        u * u * stage.source[0] + 2 * u * t * bend[0] + t * t * at[0],
        u * u * stage.source[1] + 2 * u * t * bend[1] + t * t * at[1],
      ];
    };
    const run = Math.min(1, share / DRIFT_LANDS);
    const fading = late(share, 0.55);

    // The drift's trail, cyan over violet, thinning towards its tail
    for (let step = 0; step < 14; step += 1) {
      const t = run * (step / 14);
      const next = run * ((step + 1) / 14);
      const thin = (step + 1) / 14;

      edge(context, along(t), along(next), size * 0.9 * thin, 0, {
        color: MIRAIDON_VIOLET,
        alpha: fading * 0.7,
      });
      edge(context, along(t), along(next), size * 0.35 * thin, 0, {
        color: MIRAIDON_CYAN,
        alpha: fading,
      });
    }
    if (share < DRIFT_LANDS) {
      orb(context, along(run), size * 0.9, { color: MIRAIDON_CYAN, alpha: 1 });
      return;
    }
    const hit = (share - DRIFT_LANDS) / (1 - DRIFT_LANDS);
    const half = size * (0.8 + swell(Math.min(1, hit * 2)) * 1.2);

    orb(context, at, size * (1 + hit * 1.8), { color: MIRAIDON_VIOLET, alpha: decay(hit) * 0.8 });
    context.strokeStyle = fade(MIRAIDON_CYAN, decay(hit));
    context.lineWidth = 3 * stage.scale;
    context.beginPath();
    context.moveTo(at[0] - half, at[1] - half);
    context.lineTo(at[0] + half, at[1] - half);
    context.lineTo(at[0] + half, at[1] + half);
    context.lineTo(at[0] - half, at[1] + half);
    context.closePath();
    context.stroke();
    for (let arc = 0; arc < 4; arc += 1) {
      const angle = (arc / 4) * Math.PI * 2 + Math.PI / 4 + noise(seed, arc) * 0.4;
      const out = size * (1.2 + hit * 2.4);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        seed + arc + Math.floor(hit * 10),
        { color: lighten(MIRAIDON_CYAN, 0.3), alpha: decay(hit), width: 2 * stage.scale },
      );
    }
  },

  // The four treasures of ruin, a tablet, a sword, a vessel and a bead,
  // closing in on it out of the dark from four corners. Where they meet
  // a crack runs down through it and half its light goes out
  Calamity(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const close = Math.min(1, share / RUINATION_CLOSES);
    const shown = Math.min(1, share * 5) * late(share, 0.7);

    orb(context, at, size * 2, { color: RUIN_DARK, alpha: shown * 0.4 });
    ring(context, at, size * (2.6 - close * 1.4), {
      color: RUIN_GOLD,
      alpha: shown * 0.7,
      width: 2 * stage.scale,
    });
    if (share < RUINATION_CLOSES) {
      for (let piece = 0; piece < 4; piece += 1) {
        const angle = Math.PI / 4 + (piece / 4) * Math.PI * 2 + close * 1.2;
        const out = size * (3.4 - close * 2.6);
        const spot: Point = [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out];

        crystal(context, spot, size * 0.7, angle, RUIN_GOLD, shown);
        orb(context, spot, size * 0.35, { color: '#fff4cc', alpha: shown });
      }
      return;
    }
    const broken = (share - RUINATION_CLOSES) / (1 - RUINATION_CLOSES);
    const top: Point = [at[0], at[1] - size * 1.6];
    const bottom: Point = [at[0], at[1] + size * 1.6];

    orb(context, at, size * (0.8 + broken * 1.6), { color: RUIN_GOLD, alpha: decay(broken * 2) });
    bolt(context, top, between(top, bottom, Math.min(1, broken * 3)), seed, {
      color: '#fff4cc',
      alpha: decay(broken),
      width: 3 * stage.scale,
    });
    // The half put out: a dark half-disc over one side of it
    context.fillStyle = fade(RUIN_DARK, swell(Math.min(1, broken * 2)) * late(broken, 0.6));
    context.beginPath();
    context.ellipse(at[0], at[1], size * 1.4, size * 1.4, 0, Math.PI / 2, (Math.PI * 3) / 2);
    context.fill();
    shards(context, at, size * 2.4, many(10, weight), seed + 1, broken, {
      color: RUIN_GOLD,
      alpha: decay(broken),
    });
  },

  // A great club wound in ivy swung down onto it, and leaves and the
  // mask's colour thrown off the blow
  Cudgel(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const mask = paint.color;

    if (share < CUDGEL_LANDS) {
      const swing = (share / CUDGEL_LANDS) ** 1.5;
      const angle = -Math.PI * 0.9 + swing * Math.PI * 0.75;
      const grip: Point = [at[0] - size * 1.6, at[1] + size * 0.4];
      const head: Point = [
        grip[0] + Math.cos(angle) * size * 3.2,
        grip[1] + Math.sin(angle) * size * 3.2,
      ];

      edge(context, grip, head, size * 0.6, 0, { color: CUDGEL_WOOD, alpha: 1 });
      orb(context, head, size * 0.9, { color: CUDGEL_WOOD, alpha: 1 });
      // The ivy, wound round the club in a few turns
      for (let turn = 0; turn < 4; turn += 1) {
        const spot = between(grip, head, 0.25 + turn * 0.22);

        orb(context, spot, size * 0.32, { color: IVY_GREEN, alpha: 0.9 });
      }
      orb(context, head, size * 0.5, { color: mask, alpha: 0.8 });
      return;
    }
    const hit = (share - CUDGEL_LANDS) / (1 - CUDGEL_LANDS);
    const foot: Point = [at[0], at[1] + size * 0.8];

    orb(context, at, size * (0.9 + hit * 1.8), {
      color: lighten(mask, 0.4),
      alpha: decay(hit * 2),
    });
    orb(context, at, size * (1.2 + hit * 1.6), { color: mask, alpha: decay(hit) * 0.7 });
    ripple(context, foot, size * (1 + hit * 3), {
      color: IVY_GREEN,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    for (let leaf = 0; leaf < many(10, weight); leaf += 1) {
      const angle = noise(seed, leaf) * Math.PI * 2;
      const out = size * (0.8 + hit * (2 + noise(seed, leaf + 20)));

      orb(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7],
        size * 0.28,
        { color: leaf % 2 === 0 ? IVY_GREEN : mask, alpha: decay(hit) },
      );
    }
    burst(context, at, size * (1.4 + hit * 1.8), 10, seed + 1, {
      color: lighten(IVY_GREEN, 0.3),
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // Crystal stars in every Terastal colour raining down onto it, each
  // going off in a hexagon of light, under a glittering crown
  Starstorm(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = Math.min(1, share * 4) * late(share, 0.75);

    for (let glint = 0; glint < 6; glint += 1) {
      const angle = (glint / 6) * Math.PI * 2 + share * 2;

      star(
        context,
        [at[0] + Math.cos(angle) * size * 2.4, at[1] - size * 3 + Math.sin(angle) * size * 0.6],
        size * 0.35,
        share * 4 + glint,
        { color: TERA_COLOURS[glint % TERA_COLOURS.length], alpha: shown },
      );
    }
    for (let one = 0; one < STARSTORM_STARS; one += 1) {
      const lands = STARSTORM_FALLS + (one / STARSTORM_STARS) * 0.4;
      const leave = lands - 0.25;

      if (share < leave) {
        continue;
      }
      const colour = TERA_COLOURS[one % TERA_COLOURS.length];
      const spot: Point = [
        at[0] + spread(seed, one) * size * 2.2,
        at[1] + spread(seed, one + 9) * size,
      ];

      if (share < lands) {
        const fall = ((share - leave) / 0.25) ** 1.4;
        const from: Point = [spot[0] - size * 1.6, spot[1] - size * 5];
        const head = between(from, spot, fall);

        edge(context, between(from, spot, Math.max(0, fall - 0.3)), head, size * 0.4, 0, {
          color: colour,
          alpha: 0.7,
        });
        crystal(context, head, size * 0.45, share * 6 + one, colour, 1);
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.3);

      crystal(context, spot, size * (0.5 + hit * 1.2), one, colour, decay(hit));
      orb(context, spot, size * (0.5 + hit * 1.2), { color: colour, alpha: decay(hit) * 0.6 });
    }
  },

  // Poisoned chains thrown round it from three sides and drawn tight,
  // dripping, then biting in
  Chains(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const wind = Math.min(1, share / CHAIN_BINDS);
    const bound = Math.max(0, (share - CHAIN_BINDS) / (1 - CHAIN_BINDS));
    const shown = Math.min(1, share * 5) * late(share, 0.7);
    const radius = size * (2.8 - wind * 1.6);

    for (let chain = 0; chain < CHAINS; chain += 1) {
      const start = (chain / CHAINS) * Math.PI * 2 + noise(seed, chain);
      const tilt = (chain - 1) * 0.5;

      for (let piece = 0; piece < CHAIN_LINKS; piece += 1) {
        const along = piece / CHAIN_LINKS;

        if (along > wind) {
          break;
        }
        const angle = start + along * Math.PI * 1.6;
        const spot: Point = [
          at[0] + Math.cos(angle) * radius,
          at[1] + Math.sin(angle) * radius * 0.4 + Math.cos(angle) * tilt * size,
        ];

        link(context, spot, size * 0.32, angle + Math.PI / 2, CHAIN_MAGENTA, shown);
      }
    }
    // The drip off the links, falling once they are on
    motes(context, [at[0], at[1] + size * 0.6], size * 1.8, many(10, weight), seed, wind, {
      color: CHAIN_DRIP,
      alpha: shown * 0.8,
    });
    if (bound > 0) {
      orb(context, at, size * (0.8 + bound * 1.4), {
        color: CHAIN_MAGENTA,
        alpha: decay(bound) * 0.7,
      });
      burst(context, at, size * (1.2 + bound * 1.6), 10, seed + 3, {
        color: CHAIN_DRIP,
        alpha: decay(bound),
        width: 2 * stage.scale,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default paldea;
