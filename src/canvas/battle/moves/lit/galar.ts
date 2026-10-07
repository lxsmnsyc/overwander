import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  ASTRAL,
  ASTRAL_ARRIVES,
  ASTRAL_DARK,
  BEHEMOTH_GOLD,
  BEHEMOTH_LANDS,
  BEHEMOTH_STEEL,
  BULWARK_LANDS,
  BULWARK_RED,
  CAGE_BARS,
  CAGE_CLOSES,
  DARTS_LAND,
  DREEPY,
  DYNAMAX_DARK,
  DYNAMAX_FIRE,
  DYNAMAX_RED,
  GLACIAL,
  LANCE_LANDS,
  RIME,
} from '../effect/galar';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, bolt, debris, gathering, sickle, smoke, sparks } from './pieces';
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

/** A hexagon of streaks facing the camera round a spot */
function hexagon(
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
      aside(kit, at, Math.cos(from) * radius, Math.sin(from) * radius * 0.8),
      aside(kit, at, Math.cos(to) * radius, Math.sin(to) * radius * 0.8),
      radius * 0.06,
      colour,
      alpha,
    );
  }
}

const galar = {
  Behemoth(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const steel = mix(paint.color, BEHEMOTH_STEEL, 0.7);

    if (share < BEHEMOTH_LANDS) {
      const rise = share / BEHEMOTH_LANDS;
      const hilt = toward(stage.source, at, rise ** 2);
      const tip = aside(kit, hilt, 0, reach * (2.6 - rise * 1.4));

      kit.glow(tip, reach * (0.8 + rise), BEHEMOTH_GOLD, rise * 0.5);
      kit.glow(toward(hilt, tip, 0.5), reach * 1.6, steel, 0.35);
      kit.trail(hilt, tip, reach * 1.1, steel, 0.95);
      kit.trail(hilt, tip, reach * 0.45, '#ffffff', 1);
      kit.ring(hilt, reach * 0.6, 0.15, BEHEMOTH_GOLD, 0.9);
      return;
    }
    const hit = (share - BEHEMOTH_LANDS) / (1 - BEHEMOTH_LANDS);

    kit.glow(at, reach * (1.2 + hit * 2), steel, decay(hit) * 0.8);
    sickle(
      kit,
      at,
      reach * (1.4 + hit * 1.2),
      -2.4,
      -0.6,
      reach * 0.5 * decay(hit),
      '#ffffff',
      decay(Math.min(1, hit * 1.8)),
    );
    for (let wave = 0; wave < 2; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.5 - wave * 0.3));

      kit.ring(at, reach * (0.8 + held * 2.6), 0.1, BEHEMOTH_GOLD, decay(held));
    }
    kit.ripple(floorOf(at), reach * (1 + hit * 2.6), 0.1, BEHEMOTH_GOLD, decay(hit));
    debris(kit, at, reach * 2.2, many(8, weight), seed, hit, steel, late(hit, 0.5));
    sparks(kit, at, reach * 1.6, 12, seed, hit, steel, decay(hit));
  },

  Bulwark(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < BULWARK_LANDS) {
      const push = (share / BULWARK_LANDS) ** 2;
      const front = toward(stage.source, at, push * 0.9);

      kit.glow(front, reach * 2.2, BULWARK_RED, 0.5);
      hexagon(kit, front, reach * 1.8, Math.PI / 6, BEHEMOTH_GOLD, 1);
      hexagon(kit, front, reach * 1.1, Math.PI / 6, '#ffffff', 0.8);
      kit.glow(front, reach * 0.6, BEHEMOTH_GOLD, 0.9);
      return;
    }
    const hit = (share - BULWARK_LANDS) / (1 - BULWARK_LANDS);
    const floor = floorOf(at);

    hexagon(kit, at, reach * (1.8 + hit * 1.6), Math.PI / 6, BEHEMOTH_GOLD, decay(hit));
    kit.glow(at, reach * (1.6 + hit * 1.8), BULWARK_RED, decay(hit) * 0.8);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      kit.ripple(
        floor,
        reach * (1 + held * 3.4),
        0.1,
        wave === 1 ? BULWARK_RED : BEHEMOTH_GOLD,
        decay(held),
      );
    }
    sparks(kit, at, reach * 1.8, 10, seed, hit, BEHEMOTH_GOLD, decay(hit));
    debris(
      kit,
      at,
      reach * 2.4,
      many(10, weight),
      seed,
      hit,
      lighten(BULWARK_RED, 0.3),
      late(hit, 0.5),
    );
  },

  Dynamax(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const core = aside(kit, stage.source, 0, reach * 0.8);
    const charge = Math.min(1, share / DYNAMAX_FIRE);
    const kept = late(share, 0.7);

    kit.glow(core, reach * (0.6 + charge * 0.9), DYNAMAX_RED, kept);
    for (let hex = 0; hex < 3; hex += 1) {
      hexagon(
        kit,
        core,
        reach * (1 + hex * 0.6) * charge,
        share * (hex % 2 === 0 ? 2 : -2),
        DYNAMAX_RED,
        kept * (0.8 - hex * 0.2),
      );
    }
    if (share < DYNAMAX_FIRE) {
      gathering(kit, core, reach * 2.4, 12, seed, charge, DYNAMAX_RED);
      return;
    }
    const fire = (share - DYNAMAX_FIRE) / (1 - DYNAMAX_FIRE);
    const head = toward(core, at, Math.min(1, fire * 3));

    kit.ribbon([core, head], reach * 1.6 * decay(fire), DYNAMAX_DARK, kept * 0.8, fire * 4);
    kit.ribbon([core, head], reach * 0.9 * decay(fire), DYNAMAX_RED, kept, fire * 4);
    kit.ribbon([core, head], reach * 0.3 * decay(fire), '#ffffff', kept, fire * 4);
    if (fire * 3 >= 1) {
      kit.glow(at, reach * (1.4 + fire * 1.6), DYNAMAX_RED, decay(fire));
      hexagon(kit, at, reach * (1 + fire * 2.4), fire * 3, DYNAMAX_RED, decay(fire));
      sparks(kit, at, reach * 2.4, 14, seed, fire, lighten(DYNAMAX_RED, 0.4), decay(fire));
    }
  },

  Darters(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    for (const [index, lands] of DARTS_LAND.entries()) {
      const leave = lands - 0.3;

      if (share < leave) {
        continue;
      }
      const start = aside(kit, stage.source, 0, (index === 0 ? -1 : 1) * reach * 0.6);

      if (share < lands) {
        const flight = (share - leave) / 0.3;
        const head = toward(start, at, flight);

        kit.trail(toward(start, at, Math.max(0, flight - 0.3)), head, reach * 0.6, DREEPY, 0.8);
        kit.glow(head, reach * 1.1, DREEPY, 1);
        kit.glow(head, reach * 0.45, '#ffffff', 1);
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.35);
      const spot = aside(kit, at, spread(seed, index) * reach * 0.4);

      kit.glow(spot, reach * (1 + hit * 1.6), DREEPY, decay(hit));
      kit.ring(spot, reach * (0.8 + hit * 2), 0.18, lighten(DREEPY, 0.4), decay(hit));
      sparks(kit, spot, reach * 2, 12, seed + index, hit, DREEPY, decay(hit));
    }
  },

  Lance(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < LANCE_LANDS) {
      const fall = (share / LANCE_LANDS) ** 1.6;
      const tip = aside(kit, at, reach * 1.2 * (1 - fall), reach * 5 * (1 - fall));
      const butt = aside(kit, tip, reach * 1.2, reach * 3.4);

      kit.trail(butt, tip, reach * 0.55, GLACIAL, 0.9);
      kit.trail(butt, tip, reach * 0.2, RIME, 1);
      for (let mote = 0; mote < 8; mote += 1) {
        kit.glow(
          aside(kit, toward(butt, tip, noise(seed, mote)), spread(seed, mote + 10) * reach),
          reach * 0.1,
          RIME,
          0.8,
        );
      }
      return;
    }
    const hit = (share - LANCE_LANDS) / (1 - LANCE_LANDS);
    const floor = floorOf(at);

    kit.glow(at, reach * (1.2 + hit * 2), GLACIAL, decay(hit) * 0.8);
    kit.ripple(floor, reach * (1 + hit * 3.4), 0.1, RIME, decay(hit));
    kit.pool(floor, reach * (1.4 + hit * 2), GLACIAL, late(hit, 0.4) * 0.5);
    for (let shard = 0; shard < many(14, weight); shard += 1) {
      kit.shard(
        thrown(at, seed, shard, hit, reach * 2.8, reach * 1.4),
        reach * 0.35,
        noise(seed, shard + 60) * TAU,
        GLACIAL,
        late(hit, 0.4),
      );
    }
    sparks(kit, at, reach * 3, many(16, weight), seed, hit, RIME, decay(hit));
  },

  Astral(kit, stage, share, { seed, weight }) {
    const reach = reachOf(stage, weight);
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const riders = many(9, weight);

    if (share < ASTRAL_ARRIVES) {
      const flight = share / ASTRAL_ARRIVES;

      for (let rider = 0; rider < riders; rider += 1) {
        const goal = targets[rider % targets.length];
        const lag = noise(seed, rider) * 0.35;
        const along = Math.max(0, Math.min(1, (flight - lag) / (1 - lag)));
        const lane = spread(seed, rider + 20) * reach * 1.6;
        const from = aside(kit, stage.source, 0, lane);
        const to = aside(kit, goal, 0, lane * 0.3);

        kit.trail(
          toward(from, to, Math.max(0, along - 0.3)),
          toward(from, to, along),
          reach * 0.35,
          ASTRAL_DARK,
          0.6,
        );
        kit.glow(toward(from, to, along), reach * 0.45, ASTRAL, 0.9);
      }
      return;
    }
    const hit = (share - ASTRAL_ARRIVES) / (1 - ASTRAL_ARRIVES);

    for (const [index, target] of targets.entries()) {
      kit.glow(target, reach * (1.2 + hit * 1.8), ASTRAL, decay(hit) * 0.7);
      kit.puff(target, reach * (0.6 + hit), ASTRAL_DARK, decay(hit) * 0.6);
      kit.ring(target, reach * (0.8 + hit * 2.4), 0.1, lighten(ASTRAL, 0.4), decay(hit));
      sparks(kit, target, reach * 2.6, many(12, weight), seed + index, hit, ASTRAL, decay(hit));
    }
  },

  Squall(kit, stage, share, { paint, seed, weight }) {
    const reach = reachOf(stage, weight);
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const pale = lighten(paint.color, 0.5);
    const strength = swell(share);

    for (const [index, target] of targets.entries()) {
      const eye = aside(kit, target, 0, reach * 1.4);

      // A dark cloud behind the storm, so the element reads on bright ground
      kit.puff(aside(kit, eye, 0, reach * 0.6), reach * 2.6, '#2a2f45', strength * 0.55);

      for (let band = 0; band < 4; band += 1) {
        const start = share * 8 + band * 1.6 + index;

        sickle(
          kit,
          eye,
          reach * (1 + band * 0.55),
          start,
          start + 2.2,
          reach * 0.5,
          band % 2 === 0 ? paint.color : pale,
          strength * (1 - band * 0.12),
        );
      }
      for (let streak = 0; streak < many(10, weight); streak += 1) {
        const drop = (share * 3 + noise(seed + index, streak + 10)) % 1;
        const top = aside(
          kit,
          target,
          spread(seed + index, streak) * reach * 2.4,
          reach * 3 - drop * reach * 3,
        );

        kit.trail(
          top,
          aside(kit, top, -reach * 0.4, -reach * 0.9),
          reach * 0.14,
          paint.color,
          strength,
        );
      }
      kit.glow(target, reach * 2, paint.color, strength * 0.6);
      smoke(kit, floorOf(target), reach * 1.6, 4, seed + index, share, pale, strength * 0.3);
    }
  },

  Cage(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const close = Math.min(1, share / CAGE_CLOSES);
    const kept = late(share, 0.6);
    const pale = lighten(paint.color, 0.5);
    const radius = reach * (2.6 - close * 1.2);
    const floor = floorOf(at);

    for (let bar = 0; bar < CAGE_BARS; bar += 1) {
      const angle = (bar / CAGE_BARS) * TAU + share * 1.5;
      const foot = aside(kit, floor, Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      bolt(
        kit,
        foot,
        aside(kit, foot, 0, reach * 2.8),
        seed + bar + Math.floor(share * 12),
        reach,
        reach * 0.2,
        Math.sin(angle) < 0 ? pale : paint.color,
        kept * close,
      );
    }
    kit.ripple(floor, radius, 0.12, paint.color, kept * close);
    kit.ripple(aside(kit, floor, 0, reach * 2.8), radius, 0.12, paint.color, kept * close);
    kit.glow(at, radius, paint.color, kept * close * 0.3);
    if (share >= CAGE_CLOSES) {
      const snap = (share - CAGE_CLOSES) / (1 - CAGE_CLOSES);

      kit.glow(at, reach * (1 + snap * 1.4), paint.color, decay(snap) * 0.8);
      sparks(kit, at, reach * 2, 12, seed, snap, pale, decay(snap));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default galar;
