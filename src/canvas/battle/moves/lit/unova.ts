import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { settle, showing } from '../effect/stats';
import {
  CONVERGE_DRIVE,
  CONVERGE_HOLD,
  GAMBIT_LANDS,
  ORBIT_CLOSE,
  ORBIT_ORBS,
} from '../effect/unova';
import { TAU, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, reachOf, toward } from './shapes';

/** The Unova moves with a picture of their own, in the battle scene */
const unova = {
  // Shards of psychic force hanging round it, then driven in together
  Converge(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);
    const count = many(6, weight);
    const drive = Math.min(1, Math.max(0, (share - CONVERGE_HOLD) / CONVERGE_DRIVE));

    if (drive < 1) {
      const alpha = Math.min(1, share / 0.15);

      kit.glow(at, reach * 0.8, colour, alpha * 0.3, 0.2);
      for (let shard = 0; shard < count; shard += 1) {
        const angle = (shard / count) * TAU + noise(seed, shard) * 0.3 + share * 0.8;
        const out = reach * (2.2 - drive * 1.9) + reach * 0.35;

        // A streak is pointed at both ends, which is the shard's edge
        kit.streak(
          aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
          reach * 0.35,
          reach * 0.14,
          angle,
          light,
          alpha,
        );
      }
      return;
    }
    const hit = (share - CONVERGE_HOLD - CONVERGE_DRIVE) / (1 - CONVERGE_HOLD - CONVERGE_DRIVE);

    kit.glow(at, reach * (0.5 + hit), colour, decay(hit), 0.9);
    kit.star(at, reach * (1 + hit), 0.3, light, decay(hit));
    kit.ring(at, reach * (0.4 + hit * 1.8), 0.08, light, decay(hit));
    kit.ripple(floorOf(at), reach * (0.6 + hit * 1.6), 0.08, colour, decay(hit) * 0.6);
    sparks(kit, at, reach * (1 + hit * 1.4), count * 2, seed, hit, light, decay(hit));
  },

  // Waves pulsing out of it and out of the pokemon that used it in step, with a line shaking between them
  Resonance(kit, stage, share, { paint, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.4);
    const shown = showing(share, 5, 0.75);
    const path: Spot[] = [];

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.5 + pulse / 3) % 1;

      kit.ring(at, reach * (0.4 + held * 2), 0.06, light, decay(held) * shown);
      kit.ring(stage.source, reach * (0.4 + held * 1.2), 0.06, light, decay(held) * shown * 0.5);
    }
    for (let step = 0; step <= 24; step += 1) {
      const along = step / 24;
      const wave =
        Math.sin(along * Math.PI * 8 - share * Math.PI * 6) *
        Math.sin(along * Math.PI) *
        reach *
        0.3;

      path.push(aside(kit, toward(stage.source, at, along), 0, wave));
    }
    kit.ribbon(path, reach * 0.08, colour, shown * 0.8);
  },

  // Orbs of stored power circling it, closing in and bursting together
  Orbit(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.5);

    if (share < ORBIT_CLOSE) {
      const round = reach * 1.6 * (1 - settle(share / ORBIT_CLOSE));
      const alpha = Math.min(1, share * 5);

      for (let one = 0; one < ORBIT_ORBS; one += 1) {
        const angle = (one / ORBIT_ORBS) * TAU + share * TAU * 2;
        const spot: Spot = [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(angle) * round * 0.3,
          at[2] + Math.sin(angle) * round,
        ];

        kit.glow(spot, reach * 0.25, colour, alpha, 0.7);
        kit.star(spot, reach * 0.25, share * 6 + one, '#ffffff', alpha * 0.8);
      }
      return;
    }
    const hit = (share - ORBIT_CLOSE) / (1 - ORBIT_CLOSE);

    kit.glow(at, reach * (0.6 + hit * 0.8), colour, decay(hit), 0.9);
    kit.star(at, reach * (0.8 + hit), 0.4, '#ffffff', decay(hit));
    kit.ring(at, reach * (0.5 + hit * 1.6), 0.08, light, decay(hit));
    sparks(kit, at, reach * (1 + hit * 1.2), 10, seed, hit, light, decay(hit));
  },

  // The pokemon that used it flaring as it throws everything in, and one blow that lands with all of it
  Gambit(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);
    const flare = share < 0.25 ? share / 0.25 : decay((share - 0.25) / 0.75);

    kit.glow(stage.source, reach * (0.8 + flare * 0.6), light, flare * 0.8, 0.8);
    if (share < GAMBIT_LANDS) {
      const rush = Math.max(0, (share - 0.15) / (GAMBIT_LANDS - 0.15));

      if (rush > 0) {
        kit.trail(stage.source, toward(stage.source, at, rush), reach * 0.3, light, 0.9);
      }
      return;
    }
    const hit = (share - GAMBIT_LANDS) / (1 - GAMBIT_LANDS);

    kit.pool(floorOf(at), reach * 2.2, colour, decay(hit) * 0.6);
    kit.glow(at, reach * (0.8 + hit * 1.4), light, decay(hit), 1);
    kit.star(at, reach * (1.4 + hit * 1.6), 0.2, '#ffffff', decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 1.6), 14, seed, hit, colour, decay(hit));
    for (let wave = 0; wave < 2; wave += 1) {
      kit.ring(at, reach * (0.6 + hit * (2 + wave)), 0.1, light, decay(hit) * (1 - wave * 0.4));
    }
  },

  // Tiny bugs zigzagging in on it and nipping where they land
  Buzz(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.4);

    kit.ring(at, reach * (0.8 + swell(share) * 0.4), 0.05, light, swell(share) * 0.4);
    for (let bug = 0; bug < many(8, weight); bug += 1) {
      const flying = share * 1.5 - noise(seed, bug) * 0.5;

      if (flying <= 0) {
        continue;
      }
      const end = aside(
        kit,
        at,
        spread(seed, bug + 10) * reach * 0.8,
        spread(seed, bug + 20) * reach * 0.7,
      );

      if (flying < 1) {
        const sway = Math.sin(flying * Math.PI * 6 + bug) * reach * 0.4 * (1 - flying);

        kit.glow(
          aside(kit, toward(stage.source, end, flying), 0, sway),
          reach * 0.12,
          light,
          1,
          0.6,
        );
        continue;
      }
      const nip = (flying - 1) / 0.5;

      if (nip < 1) {
        sparks(kit, end, reach * (0.3 + nip * 0.4), 4, seed + bug, nip, light, decay(nip));
      }
    }
  },

  // A shot of plasma: a hard line from the pokemon that fired it, and hexagons ringing out off the hit
  Techno(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const colour = paint.color;
    const light = lighten(colour, 0.6);
    const flick = Math.floor(share * 14);

    if (share < 0.35) {
      kit.ribbon(
        [stage.source, toward(stage.source, at, Math.min(1, share / 0.2))],
        reach * 0.18,
        light,
        decay(share / 0.35),
      );
    }
    kit.glow(at, reach * (0.5 + swell(share) * 0.5), colour, decay(share), 0.9);
    for (let hex = 0; hex < 3; hex += 1) {
      const held = Math.max(0, Math.min(1, (share - 0.15 - hex * 0.12) / 0.6));

      if (held <= 0) {
        continue;
      }
      const radius = reach * (0.5 + held * 2);
      const path: Spot[] = [];

      for (let corner = 0; corner <= 6; corner += 1) {
        const angle = hex * 0.5 + share + (corner / 6) * TAU;

        path.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius));
      }
      kit.ribbon(path, reach * 0.08, light, decay(held));
    }
    sparks(
      kit,
      at,
      reach * 1.4,
      6,
      seed + flick,
      0.5,
      colour,
      decay(share) * (flick % 2 === 0 ? 1 : 0.4),
    );
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default unova;
