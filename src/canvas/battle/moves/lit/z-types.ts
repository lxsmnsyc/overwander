import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { settle } from '../effect/stats';
import {
  BEDROCK,
  BLITZ_HITS,
  COCOON_SLAMS,
  COCOON_WRAPPED,
  CONTINENT_LANDS,
  CORKSCREW_HITS,
  MAGMA,
  NIGHTMARE_GRIPS,
  NIGHTMARE_OPEN,
  PUMMEL_BOOM,
  SHADE,
  SILK,
  SKY_LANDS,
  SKY_RISES,
  SWAMP_SPREAD,
  TECTONIC_BURROWS,
  TECTONIC_SPLITS,
} from '../effect/z-types';
import { TAU, debris, jet, smoke, sparks } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  toward,
} from './shapes';
import { Z_GOLD, unleashed, zPower } from './z-power';

/** The blast a Z-Move lands with: a white flash, rings going out, spokes and a shockwave along the floor */
function blast(
  kit: EffectBatch,
  at: Spot,
  reach: number,
  hit: number,
  colour: string,
  seed: number,
): void {
  if (hit <= 0 || hit >= 1) {
    return;
  }
  const light = lighten(colour, 0.6);
  const floor = floorOf(at);

  kit.glow(at, reach * (1.2 + hit * 2.4), colour, decay(hit) * 0.7, 0.4);
  kit.glow(at, reach * (0.9 + hit * 1.4), lighten(Z_GOLD, 0.7), decay(Math.min(1, hit * 1.6)));
  kit.star(at, reach * (1.6 + hit * 2.6), hit, '#ffffff', decay(Math.min(1, hit * 2.5)));
  for (let wave = 0; wave < 3; wave += 1) {
    const held = staged(hit, 1.6, wave * 0.25);

    if (held > 0) {
      kit.ring(at, reach * (0.8 + held * 4), 0.1, wave === 1 ? Z_GOLD : light, decay(held));
    }
  }
  kit.pool(floor, reach * (2 + hit * 3), colour, decay(hit) * 0.6, { add: 0.4 });
  kit.ripple(floor, reach * (1 + hit * 5), 0.1, colour, decay(hit) * 0.9);
  sparks(kit, at, reach * (2.4 + hit * 2.4), 18, seed, hit, light, decay(hit));
}

/** A fist: a palm with four knuckles across its front */
function fist(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  kit.puff(at, size * 0.75, colour, alpha, { add: 0.3 });
  for (let knuckle = 0; knuckle < 4; knuckle += 1) {
    kit.glow(
      aside(kit, at, (knuckle - 1.5) * size * 0.34, size * 0.4),
      size * 0.24,
      lighten(colour, 0.5),
      alpha,
      0.3,
      { add: 0.3 },
    );
  }
}

/** A rough boulder: a dark round body with craggy faces round its rim and a lit face up top */
function boulder(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  turn: number,
  colour: string,
  alpha: number,
  seed: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  const dark = mix(colour, '#2a1c12', 0.35);

  kit.puff(at, radius, dark, alpha);
  for (let face = 0; face < 7; face += 1) {
    const angle = turn + (face / 7) * TAU;

    kit.shard(
      aside(kit, at, Math.cos(angle) * radius * 0.75, Math.sin(angle) * radius * 0.75),
      radius * (0.35 + noise(seed, face) * 0.15),
      angle,
      dark,
      alpha,
    );
  }
  kit.puff(
    aside(kit, at, -radius * 0.18, radius * 0.2),
    radius * 0.6,
    lighten(colour, 0.25),
    alpha,
  );
}

/** A drill: a cone from its base to a point, with bands wound round it turning by `turn` */
function drill(
  kit: EffectBatch,
  base: Spot,
  tip: Spot,
  width: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  const steps = 8;
  const angle = kit.angleOn(base, tip);
  const light = lighten(colour, 0.6);

  for (let step = 0; step < steps; step += 1) {
    kit.ribbon(
      [toward(base, tip, step / steps), toward(base, tip, (step + 1) / steps)],
      width * 2 * (1 - (step + 0.5) / steps),
      colour,
      alpha,
      0,
      { add: 0.2 },
    );
  }
  for (let band = 0; band < 5; band += 1) {
    const along = (band / 5 + turn) % 1;

    kit.oval(
      toward(base, tip, along),
      width * 0.25 * (1 - along),
      width * (1 - along),
      angle,
      0.3,
      light,
      alpha,
    );
  }
}

/** Points along the floor from one spot to another, jagged across it, as far as `drawn` */
function crack(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  seed: number,
  wander: number,
  drawn: number,
): Spot[] {
  const path: Spot[] = [];

  for (let step = 0; step <= 10; step += 1) {
    const along = (step / 10) * drawn;
    const loose = Math.sin(Math.PI * along) * wander;

    path.push(
      aside(
        kit,
        toward(from, to, along),
        spread(seed, step) * loose,
        0.02,
        spread(seed, step + 20) * loose,
      ),
    );
  }
  return path;
}

const zTypes = {
  // Wrapped in gold, the caster charges across and rams it, and a white-gold blast and shockwave go out
  Blitz(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(Z_GOLD, 0.6);

    if (go < BLITZ_HITS) {
      const run = (go / BLITZ_HITS) ** 2;
      const body = toward(stage.source, at, run);
      const tail = toward(stage.source, at, Math.max(0, run - 0.35));

      kit.trail(tail, body, reach * 1.5, Z_GOLD, 0.45);
      kit.trail(tail, body, reach * 0.55, light, 0.9);
      for (let line = 0; line < many(7, weight); line += 1) {
        const off = spread(seed, line) * reach * 1.8;

        kit.trail(
          aside(kit, toward(tail, body, noise(seed, line + 10) * 0.4), 0, off),
          aside(kit, toward(tail, body, 0.8), 0, off),
          reach * 0.06,
          '#ffffff',
          0.8,
        );
      }
      kit.glow(body, reach * 1.7, Z_GOLD, 0.6, 0.4);
      kit.glow(body, reach * 0.9, light, 1);
      kit.ring(body, reach * 1.9, 0.1, paint.color, 0.7);
      kit.ripple(floorOf(body), reach * 1.4, 0.12, mix(paint.color, '#d8c8a8', 0.5), 0.6);
      return;
    }
    const hit = (go - BLITZ_HITS) / (1 - BLITZ_HITS);

    blast(kit, at, reach * 1.3, hit, Z_GOLD, seed);
    debris(
      kit,
      aside(kit, floorOf(at), 0, reach * 0.2),
      reach * 2,
      many(16, weight),
      seed,
      hit,
      mix(paint.color, '#d8c8a8', 0.5),
      late(hit, 0.6),
    );
  },

  // A barrage of glowing fists flying at it one after another, then one great explosion
  Pummel(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.5);
    const count = many(14, weight);

    for (let blow = 0; blow < count; blow += 1) {
      const start = (blow / count) * (PUMMEL_BOOM - 0.14);
      const flight = (go - start) / 0.14;

      if (flight <= 0) {
        continue;
      }
      const from = aside(
        kit,
        stage.source,
        spread(seed, blow) * reach * 1.4,
        spread(seed, blow + 20) * reach * 1.6,
      );
      const to = aside(
        kit,
        at,
        spread(seed, blow + 40) * reach * 0.9,
        spread(seed, blow + 60) * reach * 0.9,
      );

      if (flight < 1) {
        const spot = toward(from, to, flight);

        kit.trail(toward(from, to, Math.max(0, flight - 0.35)), spot, reach * 0.4, Z_GOLD, 0.5);
        kit.glow(spot, reach * 0.9, Z_GOLD, 0.4, 0.3);
        fist(kit, spot, reach * 0.6, paint.color, 1);
        continue;
      }
      const struck = (flight - 1) * 0.35;

      if (struck < 1) {
        kit.ring(to, reach * (0.4 + struck * 1.4), 0.12, light, decay(struck));
        sparks(kit, to, reach * 1.2, 8, seed + blow, struck, '#ffffff', decay(struck));
      }
    }
    if (go < PUMMEL_BOOM) {
      return;
    }
    const hit = (go - PUMMEL_BOOM) / (1 - PUMMEL_BOOM);

    smoke(
      kit,
      at,
      reach * (1.4 + hit * 2),
      many(10, weight),
      seed,
      hit,
      mix(paint.color, '#ffb040', 0.4),
      decay(hit) * 0.6,
    );
    blast(kit, at, reach * 1.4, hit, paint.color, seed);
  },

  // Rocketing straight up, then diving on it inside a sonic cone, and the wind bursting out where it lands
  Skystrike(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.6);

    if (go < SKY_RISES) {
      const up = go / SKY_RISES;
      const head = aside(kit, stage.source, 0, reach * 11 * up * up);

      kit.ripple(floorOf(stage.source), reach * (1 + up * 2), 0.12, light, decay(up));
      kit.trail(stage.source, head, reach * 0.8, Z_GOLD, 0.5);
      kit.trail(stage.source, head, reach * 0.3, '#ffffff', 1);
      kit.glow(head, reach * 1.1, light, 1);
      return;
    }
    if (go < SKY_LANDS) {
      const fall = ((go - SKY_RISES) / (SKY_LANDS - SKY_RISES)) ** 1.5;
      const place = (along: number): Spot =>
        aside(kit, at, -reach * 5 * (1 - along), reach * 12 * (1 - along));
      const head = place(fall);
      const tail = place(Math.max(0, fall - 0.4));
      const angle = kit.angleOn(tail, head);

      kit.trail(tail, head, reach * 1.1, paint.color, 0.5);
      kit.trail(tail, head, reach * 0.35, '#ffffff', 1);
      // The cone opens behind the head, each ring wider and fainter than the last
      for (let band = 0; band < 5; band += 1) {
        const round = reach * (0.7 + band * 0.55);

        kit.oval(
          toward(head, tail, band * 0.18),
          round * 0.3,
          round,
          angle,
          0.12,
          band % 2 === 0 ? '#ffffff' : light,
          1 - band * 0.17,
        );
      }
      kit.pool(floorOf(at), reach * (0.6 + fall * 2), paint.color, fall * 0.5);
      kit.glow(head, reach * 1.2, Z_GOLD, 0.9);
      return;
    }
    const hit = (go - SKY_LANDS) / (1 - SKY_LANDS);

    for (let gust = 0; gust < many(8, weight); gust += 1) {
      const angle = (gust / 8) * TAU + hit * 5;
      const round = reach * (1.2 + hit * 3.4);
      const path: Spot[] = [];

      for (let step = 0; step <= 6; step += 1) {
        const bend = angle - 0.9 + (step / 6) * 1.8;

        path.push(aside(kit, at, Math.cos(bend) * round, Math.sin(bend) * round * 0.75));
      }
      kit.ribbon(path, reach * 0.14, gust % 2 === 0 ? '#ffffff' : light, decay(hit));
    }
    blast(kit, at, reach * 1.2, hit, paint.color, seed);
  },

  // A toxic swamp spreading under it and swallowing it, bubbling, with acid rain pouring and spouts going up
  Downpour(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const sludge = mix(paint.color, '#1a0820', 0.5);
    const light = lighten(paint.color, 0.5);
    const swamp = Math.min(1, go / SWAMP_SPREAD);
    const kept = late(go, 0.75);

    kit.pool(floor, reach * (0.6 + swamp * 3.4), sludge, kept * 0.85, { add: 0 });
    kit.pool(floor, reach * (0.4 + swamp * 2.6), paint.color, kept * 0.5);
    kit.ripple(floor, reach * (0.6 + swamp * 3.4), 0.1, light, kept * 0.8);
    // The swamp climbing up it as it sinks
    kit.puff(aside(kit, floor, 0, reach * 0.4 * swamp), reach * 1.5 * swamp, sludge, kept * 0.6);
    for (let pop = 0; pop < many(12, weight); pop += 1) {
      const held = (share * 2.2 + noise(seed, pop)) % 1;

      kit.bubble(
        aside(
          kit,
          floor,
          spread(seed, pop + 10) * reach * 2.6 * swamp,
          held * reach * 0.8,
          spread(seed, pop + 20) * reach * 1.2 * swamp,
        ),
        reach * 0.34 * (0.4 + held),
        light,
        swell(held) * kept * swamp,
      );
    }
    for (let drop = 0; drop < many(24, weight); drop += 1) {
      const fallen = (go * 2.6 + noise(seed, drop + 30)) % 1;
      const ground = aside(
        kit,
        floor,
        spread(seed, drop + 40) * reach * 4,
        0,
        spread(seed, drop + 50) * reach * 2,
      );
      const rained = Math.min(1, go * 4) * kept;

      kit.streak(
        aside(kit, ground, reach * 0.15, reach * (8 * (1 - fallen) + 0.45)),
        reach * 0.5,
        reach * 0.08,
        -Math.PI / 2 - 0.3,
        light,
        rained,
      );
      if (fallen > 0.85) {
        kit.ripple(ground, reach * 0.5 * (fallen - 0.85) * 6, 0.2, light, rained);
      }
    }
    if (go < SWAMP_SPREAD) {
      return;
    }
    const rise = (go - SWAMP_SPREAD) / (1 - SWAMP_SPREAD);

    for (let spout = 0; spout < many(5, weight); spout += 1) {
      const angle = (spout / 5) * TAU + noise(seed, spout + 70);
      const up = swell(Math.min(1, rise * 1.4 - noise(seed, spout + 80) * 0.3));

      jet(
        kit,
        aside(kit, floor, Math.cos(angle) * reach * 2, 0, Math.sin(angle) * reach * 1.4),
        reach * 4.5 * up,
        reach * 0.3 * up,
        paint.color,
        light,
        kept,
        share * 10,
      );
    }
  },

  // The caster burrowing, a crack racing to it, and the ground bursting up in rock pillars and magma
  Tectonic(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const home = floorOf(stage.source);
    const reach = reachOf(stage, weight);
    const kept = late(go, 0.7);
    const hot = mix(MAGMA, Z_GOLD, 0.5);
    const dug = Math.min(1, go / TECTONIC_BURROWS);

    kit.pool(home, reach * 1.6 * swell(Math.min(1, go / (TECTONIC_BURROWS * 2))), '#1a1008', 1, {
      add: 0,
    });
    if (go < TECTONIC_BURROWS) {
      kit.glow(
        aside(kit, stage.source, 0, -reach * dug),
        reach * 1.2 * (1 - dug * 0.6),
        Z_GOLD,
        0.8,
        0.4,
      );
      debris(kit, home, reach, many(12, weight), seed, dug, BEDROCK, decay(dug));
      return;
    }
    const run = Math.min(1, (go - TECTONIC_BURROWS) / (TECTONIC_SPLITS - TECTONIC_BURROWS));
    const path = crack(kit, home, floor, seed, reach * 0.6, run);

    kit.ribbon(path, reach * 0.28, '#1a1008', kept, 0, { add: 0 });
    kit.ribbon(path, reach * 0.1, MAGMA, kept, share * 8);
    kit.glow(path[path.length - 1], reach * 0.8, hot, kept * 0.8, 0.5);
    if (go < TECTONIC_SPLITS) {
      return;
    }
    const rise = (go - TECTONIC_SPLITS) / (1 - TECTONIC_SPLITS);
    const grow = Math.min(1, rise * 4);
    const pillars = many(9, weight);

    kit.pit(floor, reach * (1 + grow * 1.6), grow, MAGMA, kept);
    kit.pool(floor, reach * (1 + grow * 2.4), '#1a1008', kept * 0.8, { add: 0 });
    kit.pool(floor, reach * (0.8 + grow * 1.8), MAGMA, kept * 0.7);
    jet(kit, floor, reach * 7 * grow, reach * 0.8 * kept, MAGMA, hot, kept, share * 12);
    for (let pillar = 0; pillar < pillars; pillar += 1) {
      const angle = (pillar / pillars) * TAU + noise(seed, pillar) * 0.4;
      const round = reach * (1.6 + noise(seed, pillar + 10));
      const base = aside(kit, floor, Math.cos(angle) * round, 0, Math.sin(angle) * round * 0.7);
      const up = Math.min(1, rise * (3 + noise(seed, pillar + 20) * 3));
      const tall = reach * (2.4 + noise(seed, pillar + 30) * 2.6) * up;

      if (tall <= 0) {
        continue;
      }
      const top = aside(kit, base, Math.cos(angle) * reach * 0.4, tall);
      const turn = kit.angleOn(base, top);

      kit.streak(toward(base, top, 0.5), tall * 0.55, reach * 0.8, turn, BEDROCK, kept, { add: 0 });
      kit.streak(toward(base, top, 0.35), tall * 0.35, reach * 0.2, turn, hot, kept);
    }
    debris(
      kit,
      aside(kit, floor, 0, reach * 2),
      reach * 1.7,
      many(14, weight),
      seed,
      rise,
      BEDROCK,
      late(rise, 0.6),
    );
    sparks(
      kit,
      aside(kit, floor, 0, reach * 2),
      reach * 2,
      many(14, weight),
      seed,
      rise,
      hot,
      kept,
    );
    kit.ripple(floor, reach * (1.4 + rise * 4), 0.1, paint.color, decay(rise));
  },

  // A colossal boulder dropping out of the sky onto it, and shattering into rubble and dust
  Continental(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const dust = mix(paint.color, '#e8dcc4', 0.5);

    if (go < CONTINENT_LANDS) {
      const drop = (go / CONTINENT_LANDS) ** 2;
      const middle = aside(kit, at, 0, reach * 16 * (1 - drop));

      kit.pool(floor, reach * (1 + drop * 2.6), '#000000', 0.2 + drop * 0.35, { add: 0 });
      for (let line = 0; line < 6; line += 1) {
        const x = spread(seed, line) * reach * 2.4;

        kit.trail(
          aside(kit, middle, x, reach * (4 + drop * 4)),
          aside(kit, middle, x, reach * 2),
          reach * 0.1,
          '#ffffff',
          drop * 0.8,
        );
      }
      kit.glow(middle, reach * 4, Z_GOLD, 0.35, 0.2);
      boulder(kit, middle, reach * 3.2, go * 1.5, paint.color, 1, seed);
      return;
    }
    const hit = (go - CONTINENT_LANDS) / (1 - CONTINENT_LANDS);

    for (let puff = 0; puff < many(12, weight); puff += 1) {
      const angle = noise(seed, puff + 40) * TAU;
      const out = reach * (1.4 + hit * 4);

      kit.puff(
        aside(kit, floor, Math.cos(angle) * out, reach * 0.6, Math.sin(angle) * out * 0.7),
        reach * (1.2 + hit * 1.4),
        dust,
        decay(hit) * 0.7,
      );
    }
    for (let chunk = 0; chunk < many(10, weight); chunk += 1) {
      const angle = noise(seed, chunk) * TAU;
      const out = reach * (1.4 + noise(seed, chunk + 10) * 3) * settle(hit);
      const lift = reach * (3 + noise(seed, chunk + 20) * 3) * 4 * hit * (1 - hit);

      boulder(
        kit,
        aside(kit, floor, Math.cos(angle) * out, lift + reach * 0.3, Math.sin(angle) * out * 0.7),
        reach * (0.5 + noise(seed, chunk + 30) * 0.5),
        chunk + hit * 4,
        paint.color,
        late(hit, 0.7),
        seed + chunk,
      );
    }
    blast(kit, at, reach * 1.4, hit, paint.color, seed);
  },

  // Silk spun off the caster wraps it in a cocoon, which is lifted and slammed into the ground
  Cocoon(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const lifted = settle((go - COCOON_WRAPPED) / (COCOON_SLAMS - COCOON_WRAPPED));
    const slam = Math.max(0, (go - COCOON_SLAMS) / (1 - COCOON_SLAMS));
    const drop = Math.min(1, slam / 0.12);
    const middle = aside(kit, at, 0, reach * 4 * lifted * (1 - drop * drop));
    const wrapped = Math.min(1, go / COCOON_WRAPPED);
    const held = slam > 0 ? decay(drop) : 1;

    for (let strand = 0; strand < 5; strand += 1) {
      const drawn = Math.min(1, go / (COCOON_WRAPPED * 0.5) - strand * 0.1);

      if (drawn <= 0) {
        continue;
      }
      const path: Spot[] = [];

      for (let step = 0; step <= 8; step += 1) {
        const along = (step / 8) * drawn;

        path.push(
          aside(
            kit,
            toward(stage.source, middle, along),
            0,
            spread(seed, strand) * reach * 2 * Math.sin(Math.PI * along),
          ),
        );
      }
      kit.ribbon(path, reach * 0.1, SILK, held * 0.9, 0, { add: 0.3 });
    }
    if (slam < 0.12) {
      const shut = Math.max(0, (wrapped - 0.4) / 0.6);
      const spin = go * 30;

      if (shut > 0) {
        kit.puff(middle, reach * 1.7, mix(SILK, paint.color, 0.2), shut);
      }
      for (let loop = 0; loop < Math.ceil(9 * wrapped); loop += 1) {
        const round = reach * 1.5 * Math.sin(Math.PI * (0.1 + (loop / 9) * 0.8));

        kit.oval(
          aside(kit, middle, 0, (0.5 - loop / 9) * reach * 3),
          round,
          round * 0.3,
          Math.sin(spin + loop) * 0.3,
          0.2,
          SILK,
          0.9,
        );
      }
      return;
    }
    const hit = (slam - 0.12) / 0.88;

    debris(
      kit,
      aside(kit, floorOf(at), 0, reach * 0.4),
      reach * 1.8,
      many(14, weight),
      seed,
      hit,
      SILK,
      decay(hit),
    );
    kit.ripple(floorOf(at), reach * (1.4 + hit * 4.4), 0.1, SILK, decay(hit));
    blast(kit, at, reach * 1.3, hit, paint.color, seed);
  },

  // A pool of dark opening under it, spirits rising, and ghostly hands reaching up out of it to grip it
  Nightmare(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.5);
    const open = Math.min(1, go / NIGHTMARE_OPEN);
    const kept = late(go, 0.8);
    const grip = Math.max(0, Math.min(1, (go - NIGHTMARE_GRIPS) / 0.15));
    const hands = many(6, weight);

    kit.pool(floor, reach * (0.6 + open * 3), SHADE, kept * 0.95, { add: 0 });
    kit.pool(floor, reach * (0.4 + open * 2), paint.color, kept * 0.3);
    for (let rim = 0; rim < 3; rim += 1) {
      const held = (share * 1.5 + rim / 3) % 1;

      kit.ripple(
        floor,
        reach * (0.6 + open * 3) * (1 - held * 0.5),
        0.1,
        paint.color,
        kept * (1 - held),
      );
    }
    for (let spirit = 0; spirit < many(8, weight); spirit += 1) {
      const rise = (go * 1.8 + noise(seed, spirit)) % 1;
      const angle = rise * 6 + (spirit / 8) * TAU;
      const round = reach * 2.2 * (1 - rise * 0.4);
      const spot = aside(
        kit,
        floor,
        Math.cos(angle) * round,
        rise * reach * 5,
        Math.sin(angle) * round * 0.7,
      );
      const alpha = swell(rise) * kept * open;

      kit.trail(aside(kit, spot, reach * 0.3, -reach * 1.2), spot, reach * 0.3, light, alpha * 0.6);
      kit.glow(spot, reach * 0.45, light, alpha, 0.5);
    }
    for (let hand = 0; hand < hands; hand += 1) {
      const angle = (hand / hands) * TAU + noise(seed, hand + 20) * 0.5;
      const base = aside(
        kit,
        floor,
        Math.cos(angle) * reach * 2.2,
        0,
        Math.sin(angle) * reach * 1.4,
      );
      const up = settle((go - NIGHTMARE_OPEN * 0.6 - hand * 0.04) / 0.3);

      if (up <= 0) {
        continue;
      }
      const tip = toward(base, aside(kit, at, 0, reach * 0.2), 0.2 + up * 0.55);
      const raised = aside(kit, tip, 0, reach * 1.4 * up * (1 - grip));
      const bow = spread(seed, hand) * reach * 0.6;
      const arm: Spot[] = [base, aside(kit, toward(base, raised, 0.5), bow), raised];
      const facing = kit.angleOn(raised, at);

      kit.ribbon(arm, reach * 0.5, SHADE, kept, 0, { add: 0 });
      kit.ribbon(arm, reach * 0.2, paint.color, kept, share * 6);
      for (let finger = 0; finger < 4; finger += 1) {
        const bend = facing + (finger - 1.5) * (0.5 - grip * 0.3);
        const length = reach * (0.8 - grip * 0.3);

        kit.ribbon(
          [raised, aside(kit, raised, Math.cos(bend) * length, Math.sin(bend) * length)],
          reach * 0.14,
          light,
          kept,
        );
      }
    }
    if (grip > 0) {
      kit.puff(at, reach * (1 + grip * 1.2), SHADE, kept * 0.55 * grip);
      for (let pulse = 0; pulse < 2; pulse += 1) {
        const held = (share * 3 + pulse / 2) % 1;

        kit.ring(at, reach * (3 - held * 2.2), 0.1, paint.color, kept * grip * held);
      }
    }
  },

  // The caster spinning into a steel drill, driving into it in a spray of sparks
  Corkscrew(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.6);
    const [sx, sy, sz] = stage.source;
    const distance = Math.max(0.001, Math.hypot(at[0] - sx, at[1] - sy, at[2] - sz));
    const way: Spot = [(at[0] - sx) / distance, (at[1] - sy) / distance, (at[2] - sz) / distance];
    const length = reach * 3.4 * Math.min(1, go / 0.1);
    const drive = Math.min(1, go / CORKSCREW_HITS) ** 1.6;
    const grind = Math.max(0, (go - CORKSCREW_HITS) / (1 - CORKSCREW_HITS));
    const back = length - grind * reach * 0.8;
    const stop: Spot = [at[0] - way[0] * back, at[1] - way[1] * back, at[2] - way[2] * back];
    const base = toward(stage.source, stop, drive);
    const tip: Spot = [
      base[0] + way[0] * length,
      base[1] + way[1] * length,
      base[2] + way[2] * length,
    ];
    const kept = late(grind, 0.6);
    const angle = kit.angleOn(base, tip);

    for (let band = 0; band < 3; band += 1) {
      const held = (share * 4 + band / 3) % 1;
      const round = reach * (1.3 + held * 0.8);

      kit.oval(
        toward(base, tip, -held * 0.7),
        round * 0.3,
        round,
        angle,
        0.12,
        band === 0 ? Z_GOLD : light,
        kept * (1 - held),
      );
    }
    kit.glow(base, reach * 1.8, Z_GOLD, kept * 0.4, 0.3);
    drill(kit, base, tip, reach * 1.3, share * 8, paint.color, kept);
    if (grind <= 0) {
      return;
    }
    for (let spark = 0; spark < many(16, weight); spark += 1) {
      const held = (grind * 4 + noise(seed, spark)) % 1;
      const fling = angle + Math.PI + spread(seed, spark + 10) * 1.6;
      const from = aside(
        kit,
        at,
        Math.cos(fling) * reach * held * 3,
        Math.sin(fling) * reach * held * 3 - held * held * reach * 1.4,
      );

      kit.trail(
        toward(from, at, 0.25),
        from,
        reach * 0.06,
        spark % 2 === 0 ? '#ffffff' : Z_GOLD,
        decay(held) * kept,
      );
    }
    kit.ring(at, reach * (0.8 + ((grind * 5) % 1) * 1.4), 0.12, light, kept * 0.8);
    blast(kit, at, reach * 1.3, (grind - 0.55) / 0.45, paint.color, seed);
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default zTypes;
