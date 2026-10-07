import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  ASTRAL,
  ASTRAL_ARRIVES,
  ASTRAL_DARK,
  BEHEMOTH_GOLD,
  BEHEMOTH_LANDS,
  BEHEMOTH_STEEL,
  BLEAKWIND,
  BULWARK_LANDS,
  BULWARK_RED,
  CAGE_BARS,
  CAGE_CLOSES,
  DARTS_LAND,
  DRAGONFORCE_FIRE,
  DRAGON_GREEN,
  DRAGON_VIOLET,
  DREEPY,
  DYNAMAX_DARK,
  DYNAMAX_FIRE,
  DYNAMAX_RED,
  EMBER_ORANGE,
  GLACIAL,
  GLARE_FIRE,
  GLARE_VIOLET,
  JUNGLE_GREEN,
  JUNGLE_LIGHT,
  KICK_ORANGE,
  LANCE_LANDS,
  MYSTIC_FIRE,
  MYSTIC_GEMS,
  RAPID_BLUE,
  RAPID_LANDS,
  RIME,
  SAND,
  SIGNATURE_SCALE,
  SPRINGTIDE_PINK,
  STRIKE_DARK,
  STRIKE_RED,
  WRATH_DARK,
  WRATH_PINK,
} from '../effect/galar';
import { type Draw, type EffectShape, many } from '../effect/shapes';
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

/** The storm the four forces of nature share, with each one's own weather falling out of it */
function storm(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  { paint, seed, weight }: Draw,
  falling: (eye: Spot, target: Spot, index: number, strength: number, reach: number) => void,
): void {
  const reach = reachOf(stage, weight);
  const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
  const pale = lighten(paint.color, 0.5);
  const strength = swell(share);

  for (const [index, target] of targets.entries()) {
    const eye = aside(kit, target, 0, reach * 1.4);

    // Dark behind the swirl, so the element reads on bright ground
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
    falling(eye, target, index, strength, reach);
    kit.glow(target, reach * 2, paint.color, strength * 0.6);
    smoke(kit, floorOf(target), reach * 1.6, 4, seed + index, share, pale, strength * 0.3);
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
  Bleakwind(kit, stage, share, draw) {
    storm(kit, stage, share, draw, (_eye, target, index, strength, reach) => {
      for (let gust = 0; gust < many(6, draw.weight); gust += 1) {
        const run = (share * 2.4 + noise(draw.seed + index, gust)) % 1;
        const at = aside(
          kit,
          target,
          -reach * 3 + run * reach * 6,
          reach * (0.4 + noise(draw.seed + index, gust + 20) * 2.4),
        );

        kit.trail(
          aside(kit, at, -reach * 1.6, 0),
          at,
          reach * 0.3,
          BLEAKWIND,
          strength * swell(run),
        );
      }
    });
  },

  Wildbolt(kit, stage, share, draw) {
    storm(kit, stage, share, draw, (eye, target, index, strength, reach) => {
      const flash = Math.floor(share * 10);

      for (let strike = 0; strike < 3; strike += 1) {
        bolt(
          kit,
          aside(kit, eye, spread(draw.seed + flash, strike) * reach * 1.6),
          aside(kit, floorOf(target), spread(draw.seed + flash, strike + 9) * reach),
          draw.seed + flash * 3 + strike + index,
          reach,
          reach * 0.12,
          strike === 0 ? '#ffffff' : draw.paint.color,
          strength * (noise(draw.seed + flash, strike + 30) > 0.3 ? 1 : 0.3),
        );
      }
    });
  },

  Sandsear(kit, stage, share, draw) {
    storm(kit, stage, share, draw, (eye, target, index, strength, reach) => {
      sparks(kit, eye, reach * 3, many(24, draw.weight), draw.seed + index, share, SAND, strength);
      for (let ember = 0; ember < many(10, draw.weight); ember += 1) {
        const rise = (share * 2 + noise(draw.seed + index, ember)) % 1;

        kit.glow(
          aside(
            kit,
            floorOf(target),
            spread(draw.seed + index, ember + 40) * reach * 1.8,
            rise * reach * 3,
          ),
          reach * 0.22,
          EMBER_ORANGE,
          strength * decay(rise),
        );
      }
    });
  },

  Springtide(kit, stage, share, draw) {
    storm(kit, stage, share, draw, (_eye, target, index, strength, reach) => {
      for (let piece = 0; piece < many(12, draw.weight); piece += 1) {
        const drop = (share * 1.8 + noise(draw.seed + index, piece)) % 1;
        const spot = aside(
          kit,
          target,
          spread(draw.seed + index, piece + 20) * reach * 2.4 + Math.sin(drop * 6) * reach * 0.4,
          reach * 3 - drop * reach * 3.4,
        );

        if (piece % 3 === 0) {
          kit.heart(spot, reach * 0.35, drop * 2, SPRINGTIDE_PINK, strength);
        } else {
          kit.leaf(spot, reach * 0.4, drop * 6 + piece, lighten(SPRINGTIDE_PINK, 0.4), strength);
        }
      }
    });
  },

  Dragonforce(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < DRAGONFORCE_FIRE) {
      const gather = share / DRAGONFORCE_FIRE;

      kit.glow(stage.source, reach * (0.6 + gather), DRAGON_GREEN, gather);
      gathering(kit, stage.source, reach * 3, 14, seed, gather, DRAGON_VIOLET);
      return;
    }
    const fire = (share - DRAGONFORCE_FIRE) / (1 - DRAGONFORCE_FIRE);
    const far = Math.min(1, fire * 2.5);
    const head = toward(stage.source, at, far);
    const kept = late(fire, 0.6);

    kit.ribbon([stage.source, head], reach * (1 + far * 2.4), DRAGON_VIOLET, kept * 0.6, fire * 4);
    kit.ribbon([stage.source, head], reach * (0.5 + far * 1.2), DRAGON_GREEN, kept, fire * 4);
    sickle(kit, head, reach * 1.6, -2.6, -0.5, reach * 0.4, DRAGON_GREEN, kept);
    sickle(kit, head, reach * 1.6, 0.5, 2.6, reach * 0.4, DRAGON_GREEN, kept);
    if (far >= 1) {
      const hit = Math.min(1, (fire - 0.4) / 0.6);

      kit.glow(at, reach * (1.4 + hit * 2), DRAGON_GREEN, decay(hit) * 0.8);
      sparks(kit, at, reach * 2.6, 14, seed, hit, DRAGON_VIOLET, decay(hit));
    }
  },

  Glaring(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const open = Math.min(1, share / GLARE_FIRE);
    const kept = late(share, 0.65);

    for (const side of [-1, 1]) {
      const eye = aside(kit, stage.source, side * reach * 0.6, reach * 1.2);

      kit.glow(eye, reach * 0.45 * open, '#ffffff', kept);
      kit.ring(eye, reach * 0.6 * open, 0.2, GLARE_VIOLET, kept);
      if (share >= GLARE_FIRE) {
        kit.trail(
          eye,
          toward(eye, at, Math.min(1, (share - GLARE_FIRE) * 4)),
          reach * 0.18,
          GLARE_VIOLET,
          kept,
        );
      }
    }
    if (share < GLARE_FIRE + 0.2) {
      return;
    }
    const freeze = (share - GLARE_FIRE - 0.2) / (1 - GLARE_FIRE - 0.2);

    kit.glow(at, reach * (1.2 + freeze * 1.4), GLACIAL, decay(freeze) * 0.7);
    for (let shard = 0; shard < many(12, weight); shard += 1) {
      kit.shard(
        thrown(at, seed, shard, 1 - freeze, reach * 1.4, reach * 0.6),
        reach * 0.4,
        noise(seed, shard + 50) * TAU,
        GLACIAL,
        kept,
      );
    }
    kit.ring(at, reach * (0.8 + freeze * 2.2), 0.1, lighten(GLARE_VIOLET, 0.4), decay(freeze));
  },

  Thunderkick(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const rake = Math.min(1, share / 0.3);
    const from = aside(kit, at, -reach * 2, reach * 1.6);
    const to = aside(kit, at, reach * 2, -reach * 1.2);

    kit.trail(from, toward(from, to, rake), reach * 0.8, KICK_ORANGE, late(share, 0.4));
    kit.trail(from, toward(from, to, rake), reach * 0.3, '#ffffff', late(share, 0.4));
    if (share < 0.25) {
      return;
    }
    const hit = (share - 0.25) / 0.75;

    kit.glow(at, reach * (1.2 + hit * 1.6), KICK_ORANGE, decay(hit) * 0.8);
    for (let spark = 0; spark < 6; spark += 1) {
      const angle = (spark / 6) * TAU + noise(seed, spark);
      const out = reach * (1 + hit * 2);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        seed + spark,
        reach,
        reach * 0.1,
        spark % 2 === 0 ? KICK_ORANGE : '#ffffff',
        decay(hit),
      );
    }
  },

  Wrath(kit, stage, share, { seed, weight }) {
    const reach = reachOf(stage, weight);
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const rise = swell(share);

    for (const [index, target] of targets.entries()) {
      const floor = floorOf(target);

      kit.glow(target, reach * 2, WRATH_DARK, rise * 0.5);
      for (let tongue = 0; tongue < many(7, weight); tongue += 1) {
        const base = aside(kit, floor, spread(seed + index, tongue) * reach * 1.6);
        const height = reach * (1.6 + noise(seed + index, tongue + 10) * 1.8) * rise;
        const sway = Math.sin(share * 12 + tongue) * reach * 0.3;

        kit.trail(base, aside(kit, base, sway, height), reach * 0.35, WRATH_DARK, rise);
        kit.trail(base, aside(kit, base, sway, height * 0.7), reach * 0.15, WRATH_PINK, rise);
      }
      kit.ripple(floor, reach * (1.4 + share * 1.6), 0.1, WRATH_PINK, rise * 0.8);
      smoke(kit, floor, reach * 1.6, 4, seed + index, share, WRATH_DARK, rise * 0.4);
    }
  },

  Singlestrike(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const hit = Math.min(1, share / 0.2);
    const after = Math.max(0, (share - 0.2) / 0.8);

    kit.puff(at, reach * (0.6 + hit * 1.2), STRIKE_DARK, decay(after));
    kit.glow(at, reach * (1.6 + after * 2), STRIKE_RED, decay(after) * 0.6);
    sparks(kit, at, reach * (1.4 + after * 1.8), 10, seed, after, STRIKE_RED, decay(after));
    for (let wave = 0; wave < 2; wave += 1) {
      const held = Math.max(0, Math.min(1, after * 1.5 - wave * 0.3));

      kit.ring(at, reach * (1 + held * 3), 0.12, wave === 0 ? '#ffffff' : STRIKE_RED, decay(held));
    }
    kit.star(at, reach * 2 * decay(after), 0, '#ffffff', decay(Math.min(1, after * 2)));
  },

  Rapidstrike(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;

    for (const [index, lands] of RAPID_LANDS.entries()) {
      if (share < lands) {
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.4);
      const spot = aside(kit, at, (index - 1) * reach * 0.9, spread(seed, index) * reach * 0.4);

      sickle(
        kit,
        spot,
        reach * (1 + hit),
        -Math.PI + index,
        -0.4 + index,
        reach * 0.4,
        RAPID_BLUE,
        decay(hit),
      );
      kit.glow(spot, reach * (0.6 + hit * 1.2), RAPID_BLUE, decay(hit));
      kit.puff(spot, reach * (0.4 + hit * 0.8), lighten(RAPID_BLUE, 0.5), decay(hit) * 0.8);
      kit.ring(spot, reach * (0.5 + hit * 1.6), 0.12, '#ffffff', decay(hit));
      sparks(kit, spot, reach * 1.8, 8, seed + index, hit, lighten(RAPID_BLUE, 0.4), decay(hit));
    }
  },

  Jungle(kit, stage, share, { seed, weight }) {
    const reach = reachOf(stage, weight);
    const targets = stage.targets.length > 0 ? stage.targets : [stage.source];
    const grow = Math.min(1, share / 0.4);
    const kept = late(share, 0.6);

    for (const [index, target] of targets.entries()) {
      kit.glow(target, reach * 1.8, JUNGLE_GREEN, kept * 0.4);
      for (let vine = 0; vine < 3; vine += 1) {
        const start = vine * 2.1 + share * 2;

        sickle(
          kit,
          target,
          reach * (1 + vine * 0.35),
          start,
          start + 2.4 * grow,
          reach * 0.25,
          vine % 2 === 0 ? JUNGLE_GREEN : JUNGLE_LIGHT,
          kept,
        );
      }
      for (let leaf = 0; leaf < many(8, weight); leaf += 1) {
        const lift = (share * 1.4 + noise(seed + index, leaf)) % 1;

        kit.leaf(
          aside(
            kit,
            floorOf(target),
            spread(seed + index, leaf + 20) * reach * 1.8,
            lift * reach * 3,
          ),
          reach * 0.4,
          lift * 5 + leaf,
          JUNGLE_LIGHT,
          kept * swell(lift),
        );
      }
    }
  },

  Maxcannon(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const core = aside(kit, stage.source, 0, reach * 0.6);
    const charge = Math.min(1, share / DYNAMAX_FIRE);
    const kept = late(share, 0.7);

    kit.glow(core, reach * (0.8 + charge * 1.2), DYNAMAX_RED, kept);
    kit.ring(core, reach * (2.4 - charge * 1.4), 0.1, DYNAMAX_RED, charge * kept);
    if (share < DYNAMAX_FIRE) {
      return;
    }
    const fire = (share - DYNAMAX_FIRE) / (1 - DYNAMAX_FIRE);
    const far = Math.min(1, fire * 3);
    const head = toward(core, at, far);

    kit.ribbon([core, head], reach * 2.4 * decay(fire), DYNAMAX_RED, kept * 0.7, fire * 4);
    kit.ribbon([core, head], reach * 0.9 * decay(fire), '#ffffff', kept, fire * 4);
    for (let pulse = 0; pulse < 4; pulse += 1) {
      const along = (fire * 3 + pulse / 4) % 1;

      if (along <= far) {
        kit.ring(toward(core, at, along), reach * 1.4, 0.12, lighten(DYNAMAX_RED, 0.3), kept * 0.8);
      }
    }
    if (far >= 1) {
      kit.glow(at, reach * (1.6 + fire * 2), DYNAMAX_RED, decay(fire));
      kit.ripple(floorOf(at), reach * (1 + fire * 3.6), 0.1, DYNAMAX_RED, decay(fire));
      sparks(kit, at, reach * 2.6, 16, seed, fire, lighten(DYNAMAX_RED, 0.5), decay(fire));
    }
  },

  Mystic(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const landing = MYSTIC_FIRE + 0.35;

    for (const [index, colour] of MYSTIC_GEMS.entries()) {
      const turn = share * 9 + (index / 3) * TAU;

      if (share < MYSTIC_FIRE) {
        const spot = aside(
          kit,
          stage.source,
          Math.cos(turn) * reach * 1.4,
          reach * 0.8 + Math.sin(turn) * reach * 0.6,
        );

        kit.glow(spot, reach * 0.55, colour, 1);
        kit.glow(spot, reach * 0.22, '#ffffff', 1);
        continue;
      }
      const flight = Math.min(1, (share - MYSTIC_FIRE) / 0.35);
      const spot = aside(
        kit,
        toward(stage.source, at, flight),
        Math.cos(turn) * reach * 0.9 * decay(flight),
        Math.sin(turn) * reach * 0.9 * decay(flight),
      );

      kit.glow(spot, reach * 0.55, colour, late(share, 0.7));
      if (share >= landing) {
        const hit = (share - landing) / (1 - landing);

        kit.ring(at, reach * (0.8 + hit * 2.4 + index * 0.4), 0.1, colour, decay(hit));
      }
    }
    if (share >= landing) {
      const hit = (share - landing) / (1 - landing);

      kit.glow(at, reach * (1.2 + hit * 1.6), '#ffffff', decay(hit) * 0.6);
      sparks(kit, at, reach * 2.6, 12, seed, hit, MYSTIC_GEMS[0], decay(hit));
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default galar;
