import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import { settle } from '../effect/stats';
import {
  BLOSSOMS,
  DOOM_BLOOMS,
  DRAKE_LANDS,
  DRAKE_RISES,
  ECLIPSE_COLLAPSES,
  ECLIPSE_OPENS,
  FLAME,
  FROST,
  HAVOC_LANDS,
  HAVOC_THROWN,
  HORIZON,
  OVERDRIVE_LANDS,
  PASTELS,
  PSYCHE_FLUNG,
  PSYCHE_PINK,
  PSYCHE_SHATTERS,
  SLAMMER_RISES,
  SLAMMER_SHATTERS,
  SLAMMER_SLAMS,
  TWINKLE_HITS,
  VOID,
  VORTEX_BREAKS,
  VORTEX_CLOSES,
  flungAt,
} from '../effect/z-elements';
import { TAU, arcing, bolt, debris, gathering, jet, smoke, sparks } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  thrown,
  toward,
} from './shapes';
import { Z_GOLD, unleashed, zPower } from './z-power';

/** A stretch of a level circle round a spot, for currents and discs */
function round(centre: Spot, radius: number, from: number, span: number, tilt = 0): Spot[] {
  const path: Spot[] = [];

  for (let step = 0; step <= 10; step += 1) {
    const angle = from + (step / 10) * span;

    path.push([
      centre[0] + Math.cos(angle) * radius,
      centre[1] + Math.sin(angle) * radius * tilt,
      centre[2] + Math.sin(angle) * radius,
    ]);
  }
  return path;
}

/** A five-petalled flower with a gold heart, facing the camera */
function blossom(
  kit: EffectBatch,
  at: Spot,
  size: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const angle = turn + (leaf / 5) * TAU;

    kit.leaf(
      aside(kit, at, Math.cos(angle) * size * 0.6, Math.sin(angle) * size * 0.6),
      size * 0.6,
      angle + Math.PI / 2,
      colour,
      alpha,
    );
  }
  kit.glow(at, size * 0.45, Z_GOLD, alpha, 0.6);
}

/** An ice pillar standing on its base on the picture, pointed at the top, tipped over by `turn` */
function pillar(
  kit: EffectBatch,
  base: Spot,
  width: number,
  height: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  const on = (right: number, up: number): Spot =>
    aside(
      kit,
      base,
      right * Math.cos(turn) - up * Math.sin(turn),
      right * Math.sin(turn) + up * Math.cos(turn),
    );

  kit.panel(
    [on(-width, height * 0.8), on(width, height * 0.8), on(width, 0), on(-width, 0)],
    colour,
    alpha * 0.6,
  );
  kit.panel(
    [on(-width, height * 0.8), on(0, height), on(width, height * 0.8), on(0, height * 0.7)],
    colour,
    alpha * 0.6,
  );
  // A lit face down one side, which is what reads as a prism rather than a slab
  kit.ribbon(
    [on(-width * 0.4, height * 0.08), on(-width * 0.4, height * 0.78)],
    width * 0.3,
    FROST,
    alpha * 0.6,
  );
  kit.ribbon(
    [on(-width, 0), on(-width, height * 0.8), on(0, height), on(width, height * 0.8), on(width, 0)],
    width * 0.1,
    FROST,
    alpha,
  );
}

/** A dragon of light along a path: a tapering body behind the head, and horns swept back */
function wyrm(
  kit: EffectBatch,
  place: (along: number) => Spot,
  head: number,
  reach: number,
  colour: string,
  light: string,
  alpha: number,
): void {
  const spine: Spot[] = [];

  for (let segment = 14; segment >= 0; segment -= 1) {
    const along = head - (segment / 14) * 0.45;

    if (along >= 0) {
      spine.push(place(along));
      kit.glow(place(along), reach * (0.95 - segment * 0.05), colour, alpha * 0.8, 0.3);
    }
  }
  kit.ribbon(spine, reach * 0.3, light, alpha * 0.8, head * 10);

  const tip = place(head);
  const back = place(Math.max(0, head - 0.08));

  for (const side of [-1, 1]) {
    kit.trail(tip, aside(kit, back, side * reach * 1.1, reach * 0.9), reach * 0.2, light, alpha);
  }
  kit.glow(tip, reach * 1.2, light, alpha, 0.6);
}

const zElements = {
  // A great fireball hurled in an arc off the caster, then a towering pillar of fire mushrooming over it
  Overdrive(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const hot = mix(paint.color, FLAME, 0.5);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    if (payoff < OVERDRIVE_LANDS) {
      const flight = payoff / OVERDRIVE_LANDS;
      const place = (along: number): Spot => arcing(stage.source, at, along, reach * 2.4);
      const ball = reach * (1.2 + flight * 0.8);

      for (let lick = 7; lick >= 0; lick -= 1) {
        kit.glow(
          place(Math.max(0, flight - lick * 0.04)),
          ball * (1 - lick * 0.1),
          lick < 3 ? hot : paint.color,
          0.9 - lick * 0.1,
          0.4,
        );
      }
      kit.glow(place(flight), ball * 0.7, FLAME, 1);
      kit.pool(floorOf(place(flight)), ball, paint.color, 0.4);
      sparks(kit, place(flight), ball * 1.6, many(10, weight), seed, flight, hot, 0.9);
      return;
    }
    const hit = (payoff - OVERDRIVE_LANDS) / (1 - OVERDRIVE_LANDS);
    const rise = settle(hit * 1.6);
    const kept = late(hit, 0.55);
    const tall = reach * 7 * rise;
    const cap: Spot = [floor[0], tall, floor[2]];

    kit.glow(at, reach * (1.6 + hit * 3), FLAME, decay(Math.min(1, hit * 2.5)));
    kit.pool(floor, reach * (2 + hit * 3), paint.color, kept * 0.7, { add: 0.4 });
    jet(kit, floor, tall, reach * 1.3 * kept, paint.color, hot, kept, share * 14);
    for (let lick = 0; lick < many(16, weight); lick += 1) {
      const held = (hit * 1.8 + noise(seed, lick)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, lick + 5) * reach * (0.6 + held),
          held * tall,
          spread(seed, lick + 9) * reach * 0.6,
        ),
        reach * (0.8 + held * 0.9),
        held < 0.35 ? hot : paint.color,
        swell(held) * kept,
        0.3,
      );
    }
    // The cap the column mushrooms into
    for (let puff = 0; puff < 9; puff += 1) {
      const angle = (puff / 9) * TAU + hit;

      kit.glow(
        [
          cap[0] + Math.cos(angle) * reach * 2.4 * rise,
          cap[1] + Math.sin(angle * 2) * reach * 0.3 * rise,
          cap[2] + Math.sin(angle) * reach * 2.4 * rise,
        ],
        reach * 1.4 * rise,
        puff % 2 === 0 ? paint.color : hot,
        kept * 0.8,
        0.3,
      );
    }
    kit.glow(cap, reach * 2 * rise, FLAME, kept * 0.7, 0.5);
    smoke(kit, cap, reach * 2.4, 6, seed, hit, '#3a2018', late(hit, 0.3) * 0.4);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(hit, 1.6, wave * 0.25);

      if (held > 0) {
        kit.ripple(floor, reach * (1 + held * 4), 0.12, paint.color, decay(held) * 0.9);
      }
    }
    sparks(kit, at, reach * (2.4 + hit * 2.4), 16, seed, hit, hot, decay(hit));
  },

  // Water drawn round its feet into a towering whirlpool that swallows it spinning, then bursts apart
  Hydrovortex(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const foam = lighten(paint.color, 0.6);
    const deep = mix(paint.color, '#0a1a40', 0.4);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const close = settle(payoff / VORTEX_CLOSES);
    const broken = Math.max(0, (payoff - VORTEX_BREAKS) / (1 - VORTEX_BREAKS));
    const kept = decay(Math.min(1, broken * 2));
    const spin = share * 26;
    const layers = 7;

    kit.pool(floor, reach * 3 * close, deep, kept * 0.6, { add: 0 });
    kit.glow(aside(kit, at, 0, reach * 0.6), reach * 2.6 * close, deep, kept * 0.5, 0, {
      add: 0.2,
    });
    for (let layer = 0; layer < layers; layer += 1) {
      const centre: Spot = [
        floor[0] + Math.sin(spin * 0.2 + layer) * reach * 0.2,
        (layer / (layers - 1)) * close * reach * 5,
        floor[2],
      ];
      const radius = reach * (2.6 - close * 1.4 + (layer / layers) * 1.6);

      kit.ripple(centre, radius, 0.14, deep, kept * 0.6);
      for (let current = 0; current < 3; current += 1) {
        kit.ribbon(
          round(centre, radius, spin + layer * 0.7 + (current / 3) * TAU, 1.4),
          reach * 0.12,
          foam,
          kept,
          share * 10,
        );
      }
    }
    for (let drop = 0; drop < many(14, weight); drop += 1) {
      const held = (share * 2 + noise(seed, drop)) % 1;
      const angle = spin * 0.5 + noise(seed, drop + 10) * TAU;
      const out = reach * (1.8 + held * 1.4);

      kit.glow(
        [floor[0] + Math.cos(angle) * out, held * reach * 6, floor[2] + Math.sin(angle) * out],
        reach * 0.22,
        foam,
        swell(held) * kept * close,
        0.6,
      );
    }
    if (broken <= 0) {
      return;
    }
    kit.glow(at, reach * (1.4 + broken * 2), foam, decay(broken) * 0.8, 0.5);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(broken, 1.6, wave * 0.25);

      if (held > 0) {
        kit.ripple(floor, reach * (1.6 + held * 3.6), 0.1, foam, decay(held));
      }
    }
    for (let drop = 0; drop < many(20, weight); drop += 1) {
      const base = aside(kit, floor, 0, reach * 2);

      kit.trail(
        thrown(base, seed, drop, Math.max(0, broken - 0.07), reach * 4.4, reach * 2.4),
        thrown(base, seed, drop, broken, reach * 4.4, reach * 2.4),
        reach * 0.08,
        foam,
        decay(broken),
      );
    }
    sparks(kit, at, reach * (2.4 + broken * 2), 14, seed, broken, paint.color, decay(broken));
  },

  // A ring of flowers bursting into bloom round it and drinking in light, then a pillar of plant energy erupting out of it
  Doom(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.7);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const bloom = settle(payoff / DOOM_BLOOMS);
    const fired = Math.max(0, (payoff - DOOM_BLOOMS) / (1 - DOOM_BLOOMS));
    const kept = late(fired, 0.5);
    const flowers = many(9, weight);
    const spots: Spot[] = [];

    kit.pool(floor, reach * 3 * bloom, paint.color, bloom * kept * 0.45);
    kit.ripple(floor, reach * 2.6, 0.1, paint.color, bloom * kept * 0.7);
    for (let flower = 0; flower < flowers; flower += 1) {
      const angle = (flower / flowers) * TAU + noise(seed, flower) * 0.3;
      const spot: Spot = [
        floor[0] + Math.cos(angle) * reach * 2.6,
        reach * 0.4,
        floor[2] + Math.sin(angle) * reach * 2.6,
      ];

      spots.push(spot);
      blossom(
        kit,
        spot,
        reach * 0.7 * Math.min(1, bloom * (1.2 + noise(seed, flower + 10))),
        payoff * 2 + angle,
        BLOSSOMS[flower % BLOSSOMS.length],
        kept,
      );
    }
    if (fired <= 0) {
      // Light drawn in off every flower
      for (let mote = 0; mote < many(18, weight); mote += 1) {
        const held = (payoff * 3 + noise(seed, mote + 20)) % 1;

        kit.glow(
          toward(spots[mote % spots.length], at, held),
          reach * 0.2,
          light,
          swell(held) * bloom,
          0.8,
        );
      }
      kit.glow(at, reach * (0.4 + bloom * 1.2), light, bloom * 0.8);
      gathering(kit, at, reach * 2.4, 10, seed, share, light);
      return;
    }
    const tall = reach * 8 * Math.min(1, fired * 4);

    jet(kit, floor, tall, reach * 1.5 * kept, paint.color, light, kept, share * 12);
    kit.glow(at, reach * (1.6 + swell(fired) * 1.8), light, Math.max(kept * 0.6, decay(fired)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(fired, 1.6, wave * 0.25);

      if (held > 0) {
        kit.ring(at, reach * (1 + held * 3.4), 0.1, paint.color, decay(held));
      }
    }
    for (let leaf = 0; leaf < many(16, weight); leaf += 1) {
      kit.leaf(
        thrown(aside(kit, floor, 0, reach), seed, leaf + 40, fired, reach * 4, reach * 3),
        reach * 0.35,
        noise(seed, leaf + 50) * TAU + fired * 6,
        BLOSSOMS[leaf % BLOSSOMS.length],
        decay(fired),
      );
    }
    sparks(kit, at, reach * 4, many(14, weight), seed, fired, light, decay(fired));
  },

  // A huge crackling sphere of lightning swelling over the caster, hurled at it, and bursting into a storm of bolts
  Havoc(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.6);
    const flick = Math.floor(share * 18);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    if (payoff < HAVOC_LANDS) {
      const held = aside(kit, stage.source, 0, reach * 2.6);
      const grow = settle(payoff / HAVOC_THROWN);
      const flight = Math.max(0, (payoff - HAVOC_THROWN) / (HAVOC_LANDS - HAVOC_THROWN));
      const ball = toward(held, at, flight * flight);
      const radius = reach * 1.8 * grow;

      if (flight > 0) {
        kit.trail(
          toward(held, at, Math.max(0, flight * flight - 0.25)),
          ball,
          radius * 0.8,
          paint.color,
          0.5,
        );
      }
      kit.pool(floorOf(ball), radius * 1.6, paint.color, 0.4);
      kit.glow(ball, radius * 1.5, paint.color, 0.5, 0.3);
      kit.glow(ball, radius, light, 1);
      kit.ring(ball, radius * 1.1, 0.06, '#ffffff', 0.6);
      for (let fork = 0; fork < 5; fork += 1) {
        const angle = noise(seed + flick, fork) * TAU;

        bolt(
          kit,
          ball,
          aside(kit, ball, Math.cos(angle) * radius * 1.7, Math.sin(angle) * radius * 1.7),
          seed + flick * 7 + fork,
          reach * 0.5,
          reach * 0.06,
          paint.color,
          0.9,
        );
      }
      return;
    }
    const hit = (payoff - HAVOC_LANDS) / (1 - HAVOC_LANDS);
    const bright = decay(hit) * (flick % 3 === 2 ? 0.55 : 1);
    const bolts = many(10, weight);

    kit.pool(floor, reach * (2 + hit * 3), paint.color, bright * 0.6, { add: 0.4 });
    kit.glow(at, reach * (2 + hit * 3), light, decay(Math.min(1, hit * 1.6)));
    kit.glow(at, reach * (1 + hit), '#ffffff', decay(Math.min(1, hit * 3)));
    for (let fork = 0; fork < bolts; fork += 1) {
      const angle = (fork / bolts) * TAU + noise(seed + flick, fork) * 0.6;
      const out = reach * (2 + hit * 4) * (0.6 + noise(seed, fork + 20) * 0.4);

      bolt(
        kit,
        at,
        aside(
          kit,
          at,
          Math.cos(angle) * out,
          Math.sin(angle) * out * 0.8,
          spread(seed, fork + 30) * out * 0.5,
        ),
        seed + flick * 11 + fork,
        reach * 0.6,
        reach * 0.08,
        paint.color,
        bright,
      );
    }
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(hit, 1.6, wave * 0.25);

      if (held > 0) {
        kit.ring(at, reach * (1 + held * 4), 0.1, paint.color, decay(held));
      }
    }
    kit.ripple(floor, reach * (1.4 + hit * 3.6), 0.12, paint.color, decay(hit) * 0.8);
    sparks(kit, at, reach * (2.6 + hit * 2.4), 16, seed, hit, light, bright);
  },

  // Warping pink rings seize it and fling it about the field, then everything shatters into shards
  Psyche(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const pink = mix(paint.color, PSYCHE_PINK, 0.5);
    const pale = lighten(pink, 0.6);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const flung = (along: number): Spot => {
      const [right, up] = flungAt(along);

      return aside(kit, at, right * reach, up * reach);
    };

    if (payoff < PSYCHE_SHATTERS) {
      const held = payoff / PSYCHE_SHATTERS;
      const grip = Math.min(1, payoff * 8);
      const now = flung(held);
      const knock = (held * (PSYCHE_FLUNG.length - 1)) % 1;

      kit.pool(floorOf(now), reach * 1.8, pink, grip * 0.4);
      for (let band = 0; band < 4; band += 1) {
        const across = reach * (3.6 - band * 0.5);

        kit.oval(
          at,
          across,
          across * Math.max(0.08, Math.abs(Math.cos(share * 8 + band))),
          band * 0.8 + share * 3,
          0.06,
          band % 2 === 0 ? pink : pale,
          grip * 0.7,
        );
      }
      for (let echo = 4; echo >= 0; echo -= 1) {
        kit.glow(flung(held - echo * 0.03), reach * 1.3, pink, grip * (0.6 - echo * 0.1), 0.3);
      }
      kit.ring(now, reach * 1.4, 0.08, pale, grip);
      kit.oval(
        now,
        reach * 1.8,
        reach * 1.8 * Math.max(0.08, Math.abs(Math.sin(share * 12))),
        share * 6,
        0.06,
        pale,
        grip * 0.8,
      );
      // A jolt each time it is slammed to a stop
      if (held > 0.05 && knock < 0.25) {
        kit.ring(now, reach * (1 + knock * 6), 0.1, pale, decay(knock / 0.25));
      }
      return;
    }
    const shattered = (payoff - PSYCHE_SHATTERS) / (1 - PSYCHE_SHATTERS);

    kit.glow(at, reach * (1.4 + shattered * 2), pale, decay(Math.min(1, shattered * 2)));
    // Cracks run out across the picture like broken glass
    for (let crack = 0; crack < 9; crack += 1) {
      const angle = (crack / 9) * TAU + noise(seed, crack) * 0.4;
      const out = reach * (2.6 + noise(seed, crack + 9) * 1.6);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        seed + crack,
        reach * 0.4,
        reach * 0.05,
        pale,
        decay(Math.min(1, shattered * 1.5)),
      );
    }
    for (let piece = 0; piece < many(20, weight); piece += 1) {
      kit.shard(
        thrown(at, seed, piece, shattered, reach * 4.6, reach * 1.6),
        reach * 0.3 * (0.6 + noise(seed, piece + 60) * 0.8),
        noise(seed, piece) * TAU + shattered * 6,
        piece % 3 === 0 ? pale : pink,
        decay(shattered),
        { add: 0.5 },
      );
    }
    kit.ring(at, reach * (1 + shattered * 4), 0.1, pink, decay(shattered));
  },

  // Frost racing over the floor, a great pillar of ice rising and slamming down to freeze it in, then shattering
  Slammer(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const ice = lighten(paint.color, 0.4);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const risen = settle(payoff / SLAMMER_RISES);
    const broken = Math.max(0, (payoff - SLAMMER_SHATTERS) / (1 - SLAMMER_SHATTERS));
    const kept = decay(Math.min(1, broken * 3));
    const spikes = many(9, weight);

    kit.pool(floor, reach * (1 + risen * 2.6), FROST, kept * 0.5, { add: 0.3 });
    kit.ripple(floor, reach * (1 + risen * 2.6), 0.1, FROST, kept * 0.8);
    for (let spike = 0; spike < spikes; spike += 1) {
      const angle = (spike / spikes) * TAU + noise(seed, spike) * 0.4;
      const base: Spot = [
        floor[0] + Math.cos(angle) * reach * 2.4,
        0,
        floor[2] + Math.sin(angle) * reach * 2.4,
      ];
      const tall = reach * (1 + noise(seed, spike + 10)) * risen;

      if (tall > 0) {
        const top = aside(kit, base, Math.cos(angle) * reach * 0.4, tall);

        kit.streak(
          toward(base, top, 0.5),
          tall * 0.55,
          reach * 0.35,
          kit.angleOn(base, top),
          ice,
          kept,
          {
            add: 0.2,
          },
        );
      }
    }
    if (payoff < SLAMMER_SLAMS) {
      const slam = Math.max(0, (payoff - SLAMMER_RISES) / (SLAMMER_SLAMS - SLAMMER_RISES));

      pillar(
        kit,
        aside(kit, floor, reach * 2.6),
        reach * 0.9,
        reach * 6 * risen,
        slam * slam * Math.PI * 0.48,
        ice,
        1,
      );
      return;
    }
    const struck = (payoff - SLAMMER_SLAMS) / (SLAMMER_SHATTERS - SLAMMER_SLAMS);

    if (broken <= 0) {
      pillar(kit, floor, reach * 1.8, reach * 3.6, 0, ice, 0.9);
      for (let glint = 0; glint < 4; glint += 1) {
        kit.star(
          aside(
            kit,
            at,
            spread(seed, glint + 20) * reach * 1.4,
            spread(seed, glint + 30) * reach * 1.4,
          ),
          reach * 0.5 * swell((share * 3 + noise(seed, glint + 40)) % 1),
          0,
          '#ffffff',
          1,
        );
      }
      kit.glow(at, reach * (1.6 + struck * 2), FROST, decay(Math.min(1, struck * 3)));
      kit.ripple(floor, reach * (1.4 + struck * 3), 0.12, ice, decay(Math.min(1, struck * 2)));
      debris(
        kit,
        aside(kit, floor, 0, reach * 0.3),
        reach * 1.4,
        many(8, weight),
        seed,
        struck,
        ice,
        decay(struck),
      );
      return;
    }
    kit.glow(at, reach * (1.6 + broken * 2), FROST, decay(broken) * 0.8);
    for (let piece = 0; piece < many(22, weight); piece += 1) {
      kit.shard(
        thrown(aside(kit, floor, 0, reach * 1.4), seed, piece, broken, reach * 4.6, reach * 2),
        reach * 0.3 * (0.6 + noise(seed, piece + 60) * 0.8),
        noise(seed, piece) * TAU + broken * 5,
        piece % 3 === 0 ? FROST : ice,
        decay(broken),
        { add: 0.3 },
      );
    }
    kit.star(at, reach * (2 + broken * 2), broken, '#ffffff', decay(broken));
    kit.ring(at, reach * (1 + broken * 3.4), 0.1, ice, decay(broken));
  },

  // A dragon of aura climbing off the caster, then diving down onto it in a blast of dragon flame
  Drake(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const light = lighten(paint.color, 0.55);
    const aura = mix(paint.color, '#7a3cff', 0.35);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    if (payoff < DRAKE_RISES) {
      const up = settle(payoff / DRAKE_RISES);
      const place = (along: number): Spot =>
        aside(kit, stage.source, Math.sin(along * Math.PI * 3) * reach * 0.9, along * reach * 10);

      kit.glow(stage.source, reach * 1.6, aura, decay(up) * 0.7, 0.3);
      wyrm(kit, place, up, reach, aura, light, 1);
      return;
    }
    if (payoff < DRAKE_LANDS) {
      const dive = (payoff - DRAKE_RISES) / (DRAKE_LANDS - DRAKE_RISES);
      const place = (along: number): Spot =>
        aside(
          kit,
          at,
          -reach * 3 * (1 - along) + Math.sin(along * Math.PI * 2) * reach * 0.9 * (1 - along),
          reach * 10 * (1 - along) ** 1.4,
        );

      kit.pool(floor, reach * (0.6 + dive * 2), paint.color, dive * 0.5);
      kit.ripple(floor, reach * (0.6 + dive * 2), 0.12, paint.color, dive * 0.7);
      wyrm(kit, place, dive, reach, aura, light, 1);
      return;
    }
    const hit = (payoff - DRAKE_LANDS) / (1 - DRAKE_LANDS);
    const kept = late(hit, 0.5);

    jet(kit, floor, reach * 7, reach * 1.2 * kept, aura, light, kept, share * 12);
    kit.pool(floor, reach * (2 + hit * 3), aura, kept * 0.7, { add: 0.4 });
    kit.glow(at, reach * (1.6 + hit * 2.6), light, decay(Math.min(1, hit * 1.6)));
    for (let lick = 0; lick < many(16, weight); lick += 1) {
      const held = (hit * 1.8 + noise(seed, lick)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, lick + 5) * reach * (1 + held * 1.6),
          held * reach * 5,
          spread(seed, lick + 9) * reach,
        ),
        reach * (0.7 + held * 0.6),
        held < 0.35 ? light : aura,
        swell(held) * kept,
        0.3,
      );
    }
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(hit, 1.6, wave * 0.25);

      if (held > 0) {
        kit.ring(at, reach * (1 + held * 3.6), 0.1, aura, decay(held));
        kit.ripple(floor, reach * (1 + held * 4), 0.12, paint.color, decay(held) * 0.8);
      }
    }
    sparks(kit, at, reach * (2.4 + hit * 2.4), 16, seed, hit, light, decay(hit));
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.4,
      many(10, weight),
      seed,
      hit,
      mix(paint.color, '#3a2a4a', 0.5),
      late(hit, 0.6),
    );
  },

  // A black hole tearing open on it and dragging everything in round a burning rim, then collapsing in a burst
  Eclipse(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const centre = aside(kit, at, 0, reach * 0.3);
    const light = lighten(HORIZON, 0.5);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const open = settle(payoff / ECLIPSE_OPENS);
    const collapse = Math.max(0, (payoff - ECLIPSE_COLLAPSES) / (1 - ECLIPSE_COLLAPSES));
    const pulled = Math.min(1, collapse / 0.25);
    const after = Math.max(0, (collapse - 0.25) / 0.75);
    const radius = reach * 1.8 * open * (1 - pulled);

    if (radius > 0) {
      kit.pool(floor, radius * 2, VOID, 0.6, { add: 0 });
      kit.glow(centre, radius * 2.4, HORIZON, 0.45, 0.2);
      for (let band = 0; band < 3; band += 1) {
        const held = (payoff * 2 + band / 3) % 1;

        kit.ring(centre, radius * (3.6 - held * 2.6), 0.06, HORIZON, swell(held) * 0.6);
      }
      // Matter spiralling in
      for (let mote = 0; mote < many(24, weight); mote += 1) {
        const held = (payoff * 2.4 + noise(seed, mote)) % 1;
        const angle = noise(seed, mote + 10) * TAU + held * 5;
        const out = radius * (3.2 - held * 2.2);

        kit.glow(
          [
            centre[0] + Math.cos(angle) * out,
            centre[1] + Math.sin(angle) * out * 0.15,
            centre[2] + Math.sin(angle) * out,
          ],
          reach * 0.2,
          mote % 2 === 0 ? light : Z_GOLD,
          swell(held),
          0.8,
        );
      }
      kit.ribbon(round(centre, radius * 1.7, 0, TAU, 0.2), reach * 0.3, HORIZON, 1, share * 12);
      kit.puff(centre, radius, VOID, 0.95);
      kit.glow(centre, radius * 1.1, VOID, 0.8, 0, { add: 0 });
      kit.ring(centre, radius, 0.06, light, 0.9);
    }
    if (after <= 0) {
      return;
    }
    kit.glow(centre, reach * (1 + after * 4), light, decay(after));
    kit.star(centre, reach * (2.4 + after * 2), 0, '#ffffff', decay(Math.min(1, after * 2)));
    kit.ring(centre, reach * (1 + after * 4.4), 0.1, HORIZON, decay(after));
    kit.ripple(floor, reach * (1 + after * 4), 0.12, HORIZON, decay(after) * 0.8);
    sparks(kit, centre, reach * (2.6 + after * 2.4), 16, seed, after, light, decay(after));
    debris(
      kit,
      centre,
      reach * 2,
      many(14, weight),
      seed,
      after,
      mix(paint.color, VOID, 0.4),
      decay(after),
    );
  },

  // A pastel fairy space opening round it, full of stars and hearts, the caster circling in to a sparkling impact
  Twinkle(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const payoff = unleashed(share);

    zPower(kit, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const space = settle(payoff / 0.2) * late(payoff, 0.8);
    const hit = Math.max(0, (payoff - TWINKLE_HITS) / (1 - TWINKLE_HITS));

    kit.pool(floor, reach * 4 * space, PASTELS[0], space * 0.5);
    for (const [tone, colour] of PASTELS.entries()) {
      const angle = (tone / PASTELS.length) * TAU + share * 1.5;

      kit.glow(
        aside(
          kit,
          at,
          Math.cos(angle) * reach * 2,
          reach * 0.4 + Math.sin(angle) * reach * 1.2,
          -reach,
        ),
        reach * 2.6 * space,
        colour,
        space * 0.5,
        0,
      );
    }
    for (let float = 0; float < many(18, weight); float += 1) {
      const held = (payoff * 1.5 + noise(seed, float)) % 1;
      const spot = aside(
        kit,
        floor,
        spread(seed, float + 5) * reach * 4.4,
        held * reach * 4.4,
        spread(seed, float + 7) * reach,
      );
      const alpha = swell(held) * space;

      if (float % 3 === 0) {
        kit.heart(spot, reach * 0.3, 0, lighten(paint.color, 0.3), alpha);
      } else if (float % 3 === 1) {
        kit.star(spot, reach * 0.34, held * 3, PASTELS[float % PASTELS.length], alpha);
      } else {
        kit.star(
          spot,
          reach * 0.4 * swell((share * 3 + noise(seed, float + 9)) % 1),
          0,
          '#ffffff',
          alpha,
        );
      }
    }
    if (hit <= 0) {
      const orbit = payoff / TWINKLE_HITS;
      const place = (along: number): Spot => {
        const angle = along * Math.PI * 3;
        const out = reach * 2.6 * swell(along);

        return aside(
          kit,
          toward(stage.source, at, along),
          Math.cos(angle) * out,
          Math.sin(angle) * out * 0.6,
          Math.sin(angle) * out,
        );
      };

      for (let tail = 6; tail >= 0; tail -= 1) {
        kit.glow(
          place(Math.max(0, orbit - tail * 0.03)),
          reach * (0.8 - tail * 0.08),
          PASTELS[tail % PASTELS.length],
          0.85,
          0.5,
        );
      }
      kit.star(place(orbit), reach * 1.2, share * 6, '#ffffff', 1);
      return;
    }
    kit.star(at, reach * (2 + hit * 3), hit * 2, '#ffffff', decay(Math.min(1, hit * 2)));
    kit.glow(at, reach * (1.4 + hit * 2), paint.color, decay(hit));
    for (const [tone, colour] of PASTELS.entries()) {
      const held = staged(hit, 1.6, tone * 0.12);

      if (held > 0) {
        kit.ring(at, reach * (1 + held * 3.6), 0.1, colour, decay(held));
      }
    }
    for (let pop = 0; pop < many(14, weight); pop += 1) {
      const angle = (pop / many(14, weight)) * TAU + spread(seed, pop + 30) * 0.3;
      const out = reach * (1 + hit * 3.6);
      const spot = aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8);

      if (pop % 2 === 0) {
        kit.heart(spot, reach * 0.34, 0, lighten(paint.color, 0.3), decay(hit));
      } else {
        kit.star(spot, reach * 0.4, hit * 4, PASTELS[pop % PASTELS.length], decay(hit));
      }
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default zElements;
