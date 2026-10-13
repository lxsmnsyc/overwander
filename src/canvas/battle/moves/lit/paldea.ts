import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  CHAINS,
  CHAIN_BINDS,
  CHAIN_DARK,
  CHAIN_DRIP,
  CHAIN_LINKS,
  CHAIN_MAGENTA,
  COLLISION_LANDS,
  CUDGEL_LANDS,
  CUDGEL_WOOD,
  DRIFT_LANDS,
  IVY_GREEN,
  KORAIDON_GOLD,
  KORAIDON_RED,
  MIRAIDON_CYAN,
  MIRAIDON_VIOLET,
  RUINATION_CLOSES,
  RUIN_DARK,
  RUIN_GOLD,
  STARSTORM_FALLS,
  STARSTORM_STARS,
  TERA_COLOURS,
} from '../effect/paldea';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, bolt, debris, sparks } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  thrown,
  toward,
} from './shapes';

/** A hexagon of Terastal crystal facing the camera, with its light inside */
function crystal(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  for (let side = 0; side < 6; side += 1) {
    const from = turn + (side / 6) * TAU;
    const to = turn + ((side + 1) / 6) * TAU;

    kit.trail(
      aside(kit, at, Math.cos(from) * radius, Math.sin(from) * radius),
      aside(kit, at, Math.cos(to) * radius, Math.sin(to) * radius),
      radius * 0.18,
      lighten(colour, 0.5),
      alpha,
    );
  }
  kit.glow(at, radius, colour, alpha * 0.7, 0.4);
}

const paldea = {
  Collision(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < COLLISION_LANDS) {
      const run = (share / COLLISION_LANDS) ** 1.4;
      const head = toward(stage.source, at, run);
      const tail = toward(stage.source, at, Math.max(0, run - 0.45));

      kit.trail(floorOf(tail), floorOf(head), reach * 0.7, KORAIDON_GOLD, 0.5);
      kit.trail(tail, head, reach * 0.35, KORAIDON_RED, 0.9);
      kit.glow(head, reach * 1.1, KORAIDON_RED, 1);
      sparks(kit, tail, reach * 1.4, 8, seed, run, KORAIDON_GOLD, 0.8);
      return;
    }
    const hit = (share - COLLISION_LANDS) / (1 - COLLISION_LANDS);
    const floor = floorOf(at);

    kit.glow(at, reach * (1 + hit * 2.4), '#fff2d8', decay(hit * 2.5));
    kit.glow(at, reach * (1.4 + hit * 2), KORAIDON_RED, decay(hit) * 0.8);
    kit.ring(at, reach * (1 + hit * 3.4), 0.08, KORAIDON_GOLD, decay(hit));
    kit.ripple(floor, reach * (1.2 + hit * 3.6), 0.1, KORAIDON_RED, decay(hit) * 0.8);
    debris(
      kit,
      at,
      reach * 3,
      many(14, weight),
      seed,
      hit,
      mix(KORAIDON_RED, '#5a3a2a', 0.5),
      decay(hit),
    );
    sparks(kit, at, reach * (1.6 + hit * 2), 12, seed + 1, hit, KORAIDON_GOLD, decay(hit));
  },

  Neon(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / DRIFT_LANDS);
    const fading = late(share, 0.55);
    // A wide curve swung out to one side of the straight line
    const along = (t: number): Spot =>
      aside(kit, toward(stage.source, at, t), Math.sin(Math.PI * t) * reach * 3);
    const path: Spot[] = [];

    for (let step = 0; step <= 14; step += 1) {
      path.push(along(run * (step / 14)));
    }
    kit.ribbon(path, reach * 0.45, MIRAIDON_VIOLET, fading * 0.7, share * 3);
    kit.ribbon(path, reach * 0.18, MIRAIDON_CYAN, fading, share * 3);
    if (share < DRIFT_LANDS) {
      kit.glow(along(run), reach * 0.9, MIRAIDON_CYAN, 1);
      return;
    }
    const hit = (share - DRIFT_LANDS) / (1 - DRIFT_LANDS);
    const half = reach * (0.8 + swell(Math.min(1, hit * 2)) * 1.2);
    const corners: Spot[] = [
      aside(kit, at, -half, half),
      aside(kit, at, half, half),
      aside(kit, at, half, -half),
      aside(kit, at, -half, -half),
    ];

    kit.glow(at, reach * (1 + hit * 1.8), MIRAIDON_VIOLET, decay(hit) * 0.8);
    for (const [index, corner] of corners.entries()) {
      kit.trail(corner, corners[(index + 1) % 4], reach * 0.1, MIRAIDON_CYAN, decay(hit));
    }
    for (let arc = 0; arc < 4; arc += 1) {
      const angle = (arc / 4) * TAU + Math.PI / 4 + noise(seed, arc) * 0.4;
      const out = reach * (1.2 + hit * 2.4);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        seed + arc + Math.floor(hit * 10),
        reach,
        reach * 0.1,
        lighten(MIRAIDON_CYAN, 0.3),
        decay(hit),
      );
    }
  },

  Calamity(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const close = Math.min(1, share / RUINATION_CLOSES);
    const shown = Math.min(1, share * 5) * late(share, 0.7);

    kit.puff(at, reach * 2, RUIN_DARK, shown * 0.4);
    kit.ring(at, reach * (2.6 - close * 1.4), 0.06, RUIN_GOLD, shown * 0.7);
    if (share < RUINATION_CLOSES) {
      for (let piece = 0; piece < 4; piece += 1) {
        const angle = Math.PI / 4 + (piece / 4) * TAU + close * 1.2;
        const out = reach * (3.4 - close * 2.6);
        const spot = aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out);

        // Each treasure a solid piece of tarnished gold, lit from inside
        kit.shard(spot, reach * 0.9, angle, RUIN_GOLD, shown);
        kit.glow(spot, reach * 0.4, '#fff4cc', shown * 0.8, 0.6);
      }
      return;
    }
    const broken = (share - RUINATION_CLOSES) / (1 - RUINATION_CLOSES);
    const top = aside(kit, at, 0, reach * 1.6);

    kit.glow(at, reach * (0.8 + broken * 1.6), RUIN_GOLD, decay(broken * 2));
    bolt(
      kit,
      top,
      toward(top, aside(kit, at, 0, -reach * 1.6), Math.min(1, broken * 3)),
      seed,
      reach,
      reach * 0.12,
      '#fff4cc',
      decay(broken),
    );
    // The half put out, darkened over one side of it
    kit.puff(
      aside(kit, at, -reach * 0.7),
      reach * 1.2,
      RUIN_DARK,
      swell(Math.min(1, broken * 2)) * late(broken, 0.6) * 0.7,
    );
    sparks(kit, at, reach * 2.4, many(10, weight), seed + 1, broken, RUIN_GOLD, decay(broken));
  },

  Cudgel(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const mask = paint.color;

    if (share < CUDGEL_LANDS) {
      const swing = (share / CUDGEL_LANDS) ** 1.5;
      const angle = Math.PI * 0.9 - swing * Math.PI * 0.75;
      const grip = aside(kit, at, -reach * 1.6, -reach * 0.4);
      const head = aside(kit, grip, Math.cos(angle) * reach * 3.2, Math.sin(angle) * reach * 3.2);

      kit.trail(grip, head, reach * 0.3, CUDGEL_WOOD, 1);
      kit.puff(head, reach * 0.9, CUDGEL_WOOD, 1);
      for (let turn = 0; turn < 4; turn += 1) {
        kit.leaf(toward(grip, head, 0.25 + turn * 0.22), reach * 0.4, turn + swing, IVY_GREEN, 0.9);
      }
      kit.glow(head, reach * 0.5, mask, 0.8);
      return;
    }
    const hit = (share - CUDGEL_LANDS) / (1 - CUDGEL_LANDS);

    kit.glow(at, reach * (0.9 + hit * 1.8), lighten(mask, 0.4), decay(hit * 2));
    kit.glow(at, reach * (1.2 + hit * 1.6), mask, decay(hit) * 0.7);
    kit.ripple(floorOf(at), reach * (1 + hit * 3), 0.1, IVY_GREEN, decay(hit) * 0.8);
    for (let leaf = 0; leaf < many(10, weight); leaf += 1) {
      const angle = noise(seed, leaf) * TAU;
      const out = reach * (0.8 + hit * (2 + noise(seed, leaf + 20)));

      kit.leaf(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.7),
        reach * 0.45,
        angle + hit * 4,
        leaf % 2 === 0 ? IVY_GREEN : mask,
        decay(hit),
      );
    }
    sparks(
      kit,
      at,
      reach * (1.4 + hit * 1.8),
      10,
      seed + 1,
      hit,
      lighten(IVY_GREEN, 0.3),
      decay(hit),
    );
  },

  Starstorm(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = Math.min(1, share * 4) * late(share, 0.75);

    for (let glint = 0; glint < 6; glint += 1) {
      const angle = (glint / 6) * TAU + share * 2;

      kit.star(
        aside(kit, at, Math.cos(angle) * reach * 2.4, reach * 3, Math.sin(angle) * reach * 0.6),
        reach * 0.35,
        share * 4 + glint,
        TERA_COLOURS[glint % TERA_COLOURS.length],
        shown,
      );
    }
    for (let one = 0; one < STARSTORM_STARS; one += 1) {
      const lands = STARSTORM_FALLS + (one / STARSTORM_STARS) * 0.4;
      const leave = lands - 0.25;

      if (share < leave) {
        continue;
      }
      const colour = TERA_COLOURS[one % TERA_COLOURS.length];
      const spot = aside(
        kit,
        at,
        spread(seed, one) * reach * 2.2,
        0,
        spread(seed, one + 9) * reach,
      );

      if (share < lands) {
        const fall = ((share - leave) / 0.25) ** 1.4;
        const from = aside(kit, spot, -reach * 1.6, reach * 5);
        const head = toward(from, spot, fall);

        kit.trail(toward(from, spot, Math.max(0, fall - 0.3)), head, reach * 0.2, colour, 0.7);
        // Solid crystal under the light, so it reads on a bright ground too
        kit.shard(head, reach * 0.7, share * 6 + one, colour, 1);
        crystal(kit, head, reach * 0.45, share * 6 + one, colour, 1);
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.3);

      crystal(kit, spot, reach * (0.5 + hit * 1.2), one, colour, decay(hit));
      kit.pool(floorOf(spot), reach * (0.5 + hit * 1.2), colour, decay(hit) * 0.5);
      for (let piece = 0; piece < 4; piece += 1) {
        kit.shard(
          thrown(spot, seed + one, piece, hit, reach * 1.6, reach * 0.8),
          reach * 0.3,
          noise(seed + one, piece) * TAU,
          colour,
          decay(hit),
        );
      }
    }
  },

  Chains(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const wind = Math.min(1, share / CHAIN_BINDS);
    const bound = Math.max(0, (share - CHAIN_BINDS) / (1 - CHAIN_BINDS));
    const shown = Math.min(1, share * 5) * late(share, 0.7);
    const radius = reach * (2.8 - wind * 1.6);

    for (let chain = 0; chain < CHAINS; chain += 1) {
      const start = (chain / CHAINS) * TAU + noise(seed, chain);
      const tilt = (chain - 1) * 0.5;

      const links: Spot[] = [];

      for (let piece = 0; piece < CHAIN_LINKS; piece += 1) {
        const along = piece / CHAIN_LINKS;

        if (along > wind) {
          break;
        }
        const angle = start + along * Math.PI * 1.6;

        links.push(
          aside(
            kit,
            at,
            Math.cos(angle) * radius,
            Math.cos(angle) * tilt * reach,
            Math.sin(angle) * radius,
          ),
        );
      }
      // The chain painted solid and dark, with its links lit over it
      kit.ribbon(links, reach * 0.22, CHAIN_DARK, shown, 0, { add: 0 });
      for (const [index, spot] of links.entries()) {
        kit.oval(spot, reach * 0.36, reach * 0.2, index * 1.3, 0.5, CHAIN_MAGENTA, shown);
      }
    }
    sparks(kit, floorOf(at), reach * 1.8, many(10, weight), seed, wind, CHAIN_DRIP, shown * 0.8);
    if (bound > 0) {
      kit.glow(at, reach * (0.8 + bound * 1.4), CHAIN_MAGENTA, decay(bound) * 0.7);
      sparks(kit, at, reach * (1.2 + bound * 1.6), 10, seed + 3, bound, CHAIN_DRIP, decay(bound));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default paldea;
