import type { Point } from '../../stage';
import {
  beam,
  between,
  bolt,
  bubble,
  burst,
  decay,
  edge,
  fade,
  hoop,
  late,
  lighten,
  mix,
  motes,
  noise,
  orb,
  ring,
  ripple,
  shards,
  slash,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { settle } from './stats';
import { Z_GOLD, unleashed, zPower } from './z-power';

// Every timing below is a share of the payoff, as `unleashed` counts it

/** Breakneck Blitz: the share of the payoff the charge lands at */
export const BLITZ_HITS = 0.3;

/** All-Out Pummeling: the share the last fist lands and the whole barrage goes off */
export const PUMMEL_BOOM = 0.62;

/** Supersonic Skystrike: the share it has climbed by, and the share it lands at */
export const SKY_RISES = 0.2;
export const SKY_LANDS = 0.42;

/** Acid Downpour: the share the swamp has spread by */
export const SWAMP_SPREAD = 0.3;

/** Tectonic Rage: the share the caster is under, and the share the ground splits under the target */
export const TECTONIC_BURROWS = 0.15;
export const TECTONIC_SPLITS = 0.38;

/** Continental Crush: the share the boulder lands at */
export const CONTINENT_LANDS = 0.38;

/** Savage Spin-Out: the share the cocoon is closed by, and the share it is slammed down */
export const COCOON_WRAPPED = 0.35;
export const COCOON_SLAMS = 0.68;

/** Never-Ending Nightmare: the share the pool has opened by, and the share the hands close */
export const NIGHTMARE_OPEN = 0.2;
export const NIGHTMARE_GRIPS = 0.55;

/** Corkscrew Crash: the share the drill reaches the target */
export const CORKSCREW_HITS = 0.32;

/** Tectonic Rage: the rock and the magma under it */
export const BEDROCK = '#6b4a2e';
export const MAGMA = '#ff6a2a';

/** Savage Spin-Out: the silk */
export const SILK = '#f6f1dc';

/** Never-Ending Nightmare: the dark the hands come out of */
export const SHADE = '#140818';

/** A filled oval lying on the ground: a pool, a hole, a shadow */
function puddle(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  color: string,
  alpha: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, radius, radius * 0.34, 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** The blast a Z-Move lands with: a white flash, rings going out, spokes and a shockwave along the floor */
function blast(
  context: CanvasRenderingContext2D,
  at: Point,
  size: number,
  hit: number,
  color: string,
  seed: number,
  scale: number,
): void {
  if (hit <= 0 || hit >= 1) {
    return;
  }
  const light = lighten(color, 0.6);
  const foot: Point = [at[0], at[1] + size * 0.9];

  orb(context, at, size * (1.2 + hit * 2.4), { color, alpha: decay(hit) * 0.7 });
  orb(context, at, size * (0.9 + hit * 1.4), {
    color: lighten(Z_GOLD, 0.7),
    alpha: decay(Math.min(1, hit * 1.6)),
  });
  star(context, at, size * (1.6 + hit * 2.6), hit, {
    color: '#ffffff',
    alpha: decay(Math.min(1, hit * 2.5)),
  });
  for (let wave = 0; wave < 3; wave += 1) {
    const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

    if (held > 0) {
      ring(context, at, size * (0.8 + held * 4), {
        color: wave === 1 ? Z_GOLD : light,
        alpha: decay(held),
        width: 3.4 * scale,
      });
    }
  }
  ripple(context, foot, size * (1 + hit * 5), { color, alpha: decay(hit) * 0.9, width: 4 * scale });
  burst(context, at, size * (2.4 + hit * 2.4), 18, seed, {
    color: light,
    alpha: decay(hit),
    width: 3 * scale,
  });
}

/** A fist: a palm with four knuckles along its front, pointing along `angle` */
function fist(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  angle: number,
  color: string,
  alpha: number,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = fade(color, alpha);
  context.beginPath();
  context.ellipse(-size * 0.2, 0, size * 0.75, size * 0.62, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = fade(lighten(color, 0.5), alpha);
  for (let knuckle = 0; knuckle < 4; knuckle += 1) {
    context.beginPath();
    context.ellipse(
      size * 0.5,
      (knuckle - 1.5) * size * 0.34,
      size * 0.22,
      size * 0.18,
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.restore();
}

/** A rough boulder: a lumpy outline filled dark, and a lighter face up on its left */
function boulder(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  color: string,
  alpha: number,
  seed: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  for (const [face, tone, shrink, dx, dy] of [
    [0, mix(color, '#2a1c12', 0.35), 1, 0, 0],
    [1, lighten(color, 0.25), 0.62, -0.18, -0.2],
  ] as const) {
    context.beginPath();
    for (let corner = 0; corner < 9; corner += 1) {
      const angle = turn + (corner / 9) * Math.PI * 2;
      const out = radius * shrink * (0.78 + noise(seed + face, corner) * 0.26);

      context[corner === 0 ? 'moveTo' : 'lineTo'](
        x + dx * radius + Math.cos(angle) * out,
        y + dy * radius + Math.sin(angle) * out,
      );
    }
    context.closePath();
    context.fillStyle = fade(tone, alpha);
    context.fill();
  }
}

/** A drill: a cone from a round base to a point, with bands wound round it turning by `turn` */
function drill(
  context: CanvasRenderingContext2D,
  base: Point,
  tip: Point,
  width: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const length = Math.max(1, Math.hypot(dx, dy));
  const across: Point = [-dy / length, dx / length];
  const light = lighten(color, 0.6);

  context.beginPath();
  context.moveTo(base[0] + across[0] * width, base[1] + across[1] * width);
  context.lineTo(tip[0], tip[1]);
  context.lineTo(base[0] - across[0] * width, base[1] - across[1] * width);
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
  for (let band = 0; band < 6; band += 1) {
    const along = (band / 6 + turn) % 1;
    const half = width * (1 - along);
    const middle = between(base, tip, along);
    const ahead = between(base, tip, Math.min(1, along + 0.12));

    edge(
      context,
      [middle[0] + across[0] * half, middle[1] + across[1] * half],
      [ahead[0] - across[0] * half * 0.88, ahead[1] - across[1] * half * 0.88],
      Math.max(1, width * 0.1),
      0,
      { color: light, alpha },
    );
  }
}

const zTypes = {
  // Wrapped in gold, the caster charges across and rams it, and a white-gold blast and shockwave go out
  Blitz(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(Z_GOLD, 0.6);

    if (go < BLITZ_HITS) {
      const run = (go / BLITZ_HITS) ** 2;
      const body = between(stage.source, at, run);
      const tail = between(stage.source, at, Math.max(0, run - 0.35));

      edge(context, tail, body, size * 1.5, 0, { color: Z_GOLD, alpha: 0.45 });
      edge(context, tail, body, size * 0.55, 0, { color: light, alpha: 0.9 });
      for (let line = 0; line < many(7, weight); line += 1) {
        const off = spread(seed, line) * size * 1.8;
        const from = between(tail, body, noise(seed, line + 10) * 0.4);

        edge(
          context,
          [from[0], from[1] + off],
          [body[0] - (body[0] - tail[0]) * 0.2, body[1] + off],
          size * 0.06,
          0,
          { color: '#ffffff', alpha: 0.8 },
        );
      }
      orb(context, body, size * 1.7, { color: Z_GOLD, alpha: 0.6 });
      orb(context, body, size * 0.9, { color: light, alpha: 1 });
      ring(context, body, size * 1.9, { color: paint.color, alpha: 0.7, width: 2.4 * stage.scale });
      ripple(context, [body[0], body[1] + size * 0.9], size * 1.4, {
        color: mix(paint.color, '#d8c8a8', 0.5),
        alpha: 0.6,
        width: 3 * stage.scale,
      });
      return;
    }
    const hit = (go - BLITZ_HITS) / (1 - BLITZ_HITS);

    blast(context, at, size * 1.3, hit, Z_GOLD, seed, stage.scale);
    motes(context, [at[0], at[1] + size * 0.9], size * 4, many(16, weight), seed, hit, {
      color: mix(paint.color, '#d8c8a8', 0.5),
      alpha: decay(hit) * 0.8,
      width: size * 0.3,
    });
  },

  // A barrage of glowing fists flying at it one after another, then one great explosion
  Pummel(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);
    const count = many(14, weight);

    for (let blow = 0; blow < count; blow += 1) {
      const start = (blow / count) * (PUMMEL_BOOM - 0.14);
      const flight = (go - start) / 0.14;

      if (flight <= 0) {
        continue;
      }
      const from: Point = [
        stage.source[0] + spread(seed, blow) * size * 1.4,
        stage.source[1] + spread(seed, blow + 20) * size * 1.6,
      ];
      const to: Point = [
        at[0] + spread(seed, blow + 40) * size * 0.9,
        at[1] + spread(seed, blow + 60) * size * 0.9,
      ];

      if (flight < 1) {
        const spot = between(from, to, flight);

        edge(context, between(from, to, Math.max(0, flight - 0.35)), spot, size * 0.4, 0, {
          color: Z_GOLD,
          alpha: 0.5,
        });
        orb(context, spot, size * 0.9, { color: Z_GOLD, alpha: 0.4 });
        fist(
          context,
          spot,
          size * 0.6,
          Math.atan2(to[1] - from[1], to[0] - from[0]),
          paint.color,
          1,
        );
        continue;
      }
      const struck = (flight - 1) * 0.35;

      if (struck < 1) {
        ring(context, to, size * (0.4 + struck * 1.4), {
          color: light,
          alpha: decay(struck),
          width: 2.6 * stage.scale,
        });
        burst(context, to, size * 1.2, 8, seed + blow, {
          color: '#ffffff',
          alpha: decay(struck),
          width: 2.4 * stage.scale,
        });
      }
    }
    if (go < PUMMEL_BOOM) {
      return;
    }
    const hit = (go - PUMMEL_BOOM) / (1 - PUMMEL_BOOM);

    for (let puff = 0; puff < many(10, weight); puff += 1) {
      const angle = noise(seed, puff + 80) * Math.PI * 2;
      const out = size * (1 + hit * 2.6);

      orb(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7 - hit * size],
        size * (1 + hit * 1.2),
        { color: mix(paint.color, '#ffb040', 0.4), alpha: decay(hit) * 0.6 },
      );
    }
    blast(context, at, size * 1.4, hit, paint.color, seed, stage.scale);
  },

  // Rocketing straight up, then diving on it inside a sonic cone, and the wind bursting out where it lands
  Skystrike(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);

    if (go < SKY_RISES) {
      const up = go / SKY_RISES;
      const head: Point = [stage.source[0], stage.source[1] - size * 11 * up * up];

      ripple(context, [stage.source[0], stage.source[1] + size * 0.9], size * (1 + up * 2), {
        color: light,
        alpha: decay(up),
        width: 3 * stage.scale,
      });
      edge(context, stage.source, head, size * 0.8, 0, { color: Z_GOLD, alpha: 0.5 });
      edge(context, stage.source, head, size * 0.3, 0, { color: '#ffffff', alpha: 1 });
      orb(context, head, size * 1.1, { color: light, alpha: 1 });
      return;
    }
    if (go < SKY_LANDS) {
      const fall = ((go - SKY_RISES) / (SKY_LANDS - SKY_RISES)) ** 1.5;
      const place = (along: number): Point => [
        at[0] - size * 5 * (1 - along),
        at[1] - size * 12 * (1 - along),
      ];
      const head = place(fall);
      const tail = place(Math.max(0, fall - 0.4));
      const angle = Math.atan2(head[1] - tail[1], head[0] - tail[0]);

      edge(context, tail, head, size * 1.1, 0, { ...paint, alpha: 0.5 });
      edge(context, tail, head, size * 0.35, 0, { color: '#ffffff', alpha: 1 });
      // The cone opens behind the head, each ring wider and fainter than the last
      for (let band = 0; band < 5; band += 1) {
        hoop(context, between(head, tail, band * 0.18), size * (0.7 + band * 0.55), 0.3, angle, {
          color: band % 2 === 0 ? '#ffffff' : light,
          alpha: 1 - band * 0.17,
          width: 2.6 * stage.scale,
        });
      }
      orb(context, head, size * 1.2, { color: Z_GOLD, alpha: 0.9 });
      return;
    }
    const hit = (go - SKY_LANDS) / (1 - SKY_LANDS);

    for (let gust = 0; gust < many(8, weight); gust += 1) {
      const angle = (gust / 8) * Math.PI * 2 + hit * 5;

      slash(context, at, size * (1.2 + hit * 3.4), angle, {
        color: gust % 2 === 0 ? '#ffffff' : light,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
    }
    blast(context, at, size * 1.2, hit, paint.color, seed, stage.scale);
  },

  // A toxic swamp spreading under it and swallowing it, bubbling, with acid rain pouring and spouts going up
  Downpour(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const sludge = mix(paint.color, '#1a0820', 0.5);
    const light = lighten(paint.color, 0.5);
    const swamp = Math.min(1, go / SWAMP_SPREAD);
    const kept = late(go, 0.75);

    puddle(context, foot, size * (0.6 + swamp * 3.4), sludge, kept * 0.85);
    puddle(context, foot, size * (0.4 + swamp * 2.6), paint.color, kept * 0.5);
    ripple(context, foot, size * (0.6 + swamp * 3.4), {
      color: light,
      alpha: kept * 0.8,
      width: 3 * stage.scale,
    });
    // The swamp climbing up it as it sinks
    orb(context, [at[0], foot[1] - size * 1.2 * swamp], size * 1.5 * swamp, {
      color: sludge,
      alpha: kept * 0.6,
    });
    for (let pop = 0; pop < many(12, weight); pop += 1) {
      const held = (share * 2.2 + noise(seed, pop)) % 1;

      bubble(
        context,
        [
          foot[0] + spread(seed, pop + 10) * size * 2.6 * swamp,
          foot[1] + spread(seed, pop + 20) * size * 0.6 - held * size * 0.8,
        ],
        size * 0.34 * (0.4 + held),
        { color: light, alpha: swell(held) * kept * swamp },
      );
    }
    for (let drop = 0; drop < many(24, weight); drop += 1) {
      const fallen = (go * 2.6 + noise(seed, drop + 30)) % 1;
      const x = at[0] + spread(seed, drop + 40) * size * 4;
      const ground = foot[1] + spread(seed, drop + 50) * size * 0.8;
      const y = ground - size * 8 * (1 - fallen);
      const rained = Math.min(1, go * 4) * kept;

      edge(context, [x + size * 0.3, y - size * 0.9], [x, y], size * 0.08, 0, {
        color: light,
        alpha: rained,
      });
      if (fallen > 0.85) {
        ripple(context, [x, ground], size * 0.5 * (fallen - 0.85) * 6, {
          color: light,
          alpha: rained,
          width: 1.6 * stage.scale,
        });
      }
    }
    if (go < SWAMP_SPREAD) {
      return;
    }
    const rise = (go - SWAMP_SPREAD) / (1 - SWAMP_SPREAD);

    for (let spout = 0; spout < many(5, weight); spout += 1) {
      const angle = (spout / 5) * Math.PI * 2 + noise(seed, spout + 70);
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 2,
        foot[1] + Math.sin(angle) * size * 0.6,
      ];
      const up = swell(Math.min(1, rise * 1.4 - noise(seed, spout + 80) * 0.3));

      beam(context, base, [base[0], base[1] - size * 4.5], up, size * 0.6 * up, {
        color: paint.color,
        alpha: kept,
      });
    }
  },

  // The caster burrowing, a crack racing to it, and the ground bursting up in rock pillars and magma
  Tectonic(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const home: Point = [stage.source[0], stage.source[1] + size * 0.9];
    const kept = late(go, 0.7);
    const hot = mix(MAGMA, Z_GOLD, 0.5);
    const dug = Math.min(1, go / TECTONIC_BURROWS);

    puddle(
      context,
      home,
      size * 1.6 * swell(Math.min(1, go / (TECTONIC_BURROWS * 2))),
      '#1a1008',
      1,
    );
    if (go < TECTONIC_BURROWS) {
      orb(context, [home[0], home[1] - size * (1 - dug)], size * 1.2 * (1 - dug * 0.6), {
        color: Z_GOLD,
        alpha: 0.8,
      });
      motes(context, home, size * 2.4, many(12, weight), seed, dug, {
        color: BEDROCK,
        alpha: decay(dug),
        width: size * 0.2,
      });
      return;
    }
    const run = Math.min(1, (go - TECTONIC_BURROWS) / (TECTONIC_SPLITS - TECTONIC_BURROWS));
    const front = between(home, foot, run);

    bolt(context, home, front, seed, { color: '#1a1008', alpha: kept, width: 7 * stage.scale });
    bolt(context, home, front, seed, { color: MAGMA, alpha: kept, width: 2.6 * stage.scale });
    orb(context, front, size * 0.8, { color: hot, alpha: kept * 0.8 });
    if (go < TECTONIC_SPLITS) {
      return;
    }
    const rise = (go - TECTONIC_SPLITS) / (1 - TECTONIC_SPLITS);
    const grow = Math.min(1, rise * 4);
    const pillars = many(9, weight);

    puddle(context, foot, size * (1 + grow * 2.4), '#1a1008', kept * 0.9);
    puddle(context, foot, size * (0.8 + grow * 1.8), MAGMA, kept * 0.7);
    beam(context, foot, [foot[0], foot[1] - size * 7], grow, size * 1.6 * kept, {
      color: MAGMA,
      alpha: kept,
    });
    for (let pillar = 0; pillar < pillars; pillar += 1) {
      const angle = (pillar / pillars) * Math.PI * 2 + noise(seed, pillar) * 0.4;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * (1.6 + noise(seed, pillar + 10)),
        foot[1] + Math.sin(angle) * size * 0.6,
      ];
      const up = Math.min(1, rise * (3 + noise(seed, pillar + 20) * 3));
      const top: Point = [
        base[0] + Math.cos(angle) * size * 0.4,
        base[1] - size * (2.4 + noise(seed, pillar + 30) * 2.6) * up,
      ];

      edge(context, base, top, size * 0.8, 0, { color: BEDROCK, alpha: kept });
      edge(context, base, between(base, top, 0.7), size * 0.2, 0, { color: hot, alpha: kept });
    }
    shards(context, [foot[0], foot[1] - size * 2], size * 3.4, many(14, weight), seed, rise, {
      color: BEDROCK,
      alpha: late(rise, 0.6),
      width: size * 0.3,
    });
    motes(context, [foot[0], foot[1] - size * 2], size * 4, many(14, weight), seed, rise, {
      color: hot,
      alpha: kept,
      width: 2.2 * stage.scale,
    });
    ripple(context, foot, size * (1.4 + rise * 4), {
      color: paint.color,
      alpha: decay(rise),
      width: 4 * stage.scale,
    });
  },

  // A colossal boulder dropping out of the sky onto it, and shattering into rubble and dust
  Continental(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const dust = mix(paint.color, '#e8dcc4', 0.5);

    if (go < CONTINENT_LANDS) {
      const drop = (go / CONTINENT_LANDS) ** 2;
      const middle: Point = [at[0], at[1] - size * 16 * (1 - drop)];

      puddle(context, foot, size * (1 + drop * 2.6), '#000000', 0.2 + drop * 0.35);
      for (let line = 0; line < 6; line += 1) {
        const x = middle[0] + spread(seed, line) * size * 2.4;

        edge(
          context,
          [x, middle[1] - size * (4 + drop * 4)],
          [x, middle[1] - size * 2],
          size * 0.1,
          0,
          {
            color: '#ffffff',
            alpha: drop * 0.8,
          },
        );
      }
      orb(context, middle, size * 4, { color: Z_GOLD, alpha: 0.35 });
      boulder(context, middle, size * 3.2, go * 1.5, paint.color, 1, seed);
      return;
    }
    const hit = (go - CONTINENT_LANDS) / (1 - CONTINENT_LANDS);

    for (let puff = 0; puff < many(12, weight); puff += 1) {
      const angle = noise(seed, puff + 40) * Math.PI * 2;
      const out = size * (1.4 + hit * 4);

      orb(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34 - size * 0.6],
        size * (1.2 + hit * 1.4),
        { color: dust, alpha: decay(hit) * 0.7 },
      );
    }
    for (let chunk = 0; chunk < many(10, weight); chunk += 1) {
      const angle = noise(seed, chunk) * Math.PI * 2;
      const out = size * (1.4 + noise(seed, chunk + 10) * 3) * settle(hit);
      const lift = size * (3 + noise(seed, chunk + 20) * 3) * 4 * hit * (1 - hit);

      boulder(
        context,
        [at[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34 - lift],
        size * (0.5 + noise(seed, chunk + 30) * 0.5),
        chunk + hit * 4,
        paint.color,
        late(hit, 0.7),
        seed + chunk,
      );
    }
    blast(context, at, size * 1.4, hit, paint.color, seed, stage.scale);
  },

  // Silk spun off the caster wraps it in a cocoon, which is lifted and slammed into the ground
  Cocoon(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const lifted = settle((go - COCOON_WRAPPED) / (COCOON_SLAMS - COCOON_WRAPPED));
    const slam = Math.max(0, (go - COCOON_SLAMS) / (1 - COCOON_SLAMS));
    const drop = Math.min(1, slam / 0.12);
    const middle: Point = [at[0], at[1] - size * 4 * lifted * (1 - drop * drop)];
    const wrapped = Math.min(1, go / COCOON_WRAPPED);
    const held = slam > 0 ? decay(drop) : 1;

    for (let strand = 0; strand < 5; strand += 1) {
      const drawn = Math.min(1, go / (COCOON_WRAPPED * 0.5) - strand * 0.1);

      if (drawn > 0) {
        edge(
          context,
          stage.source,
          between(stage.source, middle, drawn),
          size * 0.1,
          spread(seed, strand) * size * 2,
          { color: SILK, alpha: held * 0.9 },
        );
      }
    }
    if (slam < 0.12) {
      const shut = Math.max(0, (wrapped - 0.4) / 0.6);
      const spin = go * 30;

      if (shut > 0) {
        context.beginPath();
        context.ellipse(middle[0], middle[1], size * 1.4, size * 2, 0, 0, Math.PI * 2);
        context.fillStyle = fade(mix(SILK, paint.color, 0.2), shut);
        context.fill();
      }
      for (let loop = 0; loop < Math.ceil(9 * wrapped); loop += 1) {
        hoop(
          context,
          [middle[0], middle[1] + (loop / 9 - 0.5) * size * 3],
          size * 1.5 * Math.sin(Math.PI * (0.1 + (loop / 9) * 0.8)),
          0.3,
          Math.sin(spin + loop) * 0.3,
          { color: SILK, alpha: 0.9, width: 2.4 * stage.scale },
        );
      }
      return;
    }
    const hit = (slam - 0.12) / 0.88;

    shards(context, at, size * 3.6, many(14, weight), seed, hit, {
      color: SILK,
      alpha: decay(hit),
      width: size * 0.3,
    });
    ripple(context, foot, size * (1.4 + hit * 4.4), {
      color: SILK,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    blast(context, at, size * 1.3, hit, paint.color, seed, stage.scale);
  },

  // A pool of dark opening under it, spirits rising, and ghostly hands reaching up out of it to grip it
  Nightmare(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const light = lighten(paint.color, 0.5);
    const open = Math.min(1, go / NIGHTMARE_OPEN);
    const kept = late(go, 0.8);
    const grip = Math.max(0, Math.min(1, (go - NIGHTMARE_GRIPS) / 0.15));
    const hands = many(6, weight);

    puddle(context, foot, size * (0.6 + open * 3), SHADE, kept * 0.95);
    for (let rim = 0; rim < 3; rim += 1) {
      const held = (share * 1.5 + rim / 3) % 1;

      ripple(context, foot, size * (0.6 + open * 3) * (1 - held * 0.5), {
        color: paint.color,
        alpha: kept * (1 - held),
        width: 2.6 * stage.scale,
      });
    }
    for (let spirit = 0; spirit < many(8, weight); spirit += 1) {
      const rise = (go * 1.8 + noise(seed, spirit)) % 1;
      const angle = rise * 6 + (spirit / 8) * Math.PI * 2;
      const spot: Point = [
        at[0] + Math.cos(angle) * size * 2.2 * (1 - rise * 0.4),
        foot[1] - rise * size * 5,
      ];

      edge(context, [spot[0], spot[1] + size * 1.2], spot, size * 0.3, size * 0.4, {
        color: light,
        alpha: swell(rise) * kept * 0.6 * open,
      });
      orb(context, spot, size * 0.45, { color: light, alpha: swell(rise) * kept * open });
    }
    for (let hand = 0; hand < hands; hand += 1) {
      const angle = (hand / hands) * Math.PI * 2 + noise(seed, hand + 20) * 0.5;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 2.2,
        foot[1] + Math.sin(angle) * size * 0.7,
      ];
      const up = settle((go - NIGHTMARE_OPEN * 0.6 - hand * 0.04) / 0.3);

      if (up <= 0) {
        continue;
      }
      const tip = between(base, [at[0], at[1] - size * 0.2], 0.2 + up * 0.55);
      const raised: Point = [tip[0], tip[1] - size * 1.4 * up * (1 - grip)];
      const toward = Math.atan2(at[1] - raised[1], at[0] - raised[0]);

      edge(context, base, raised, size * 0.45, spread(seed, hand) * size * 0.6, {
        color: SHADE,
        alpha: kept,
      });
      edge(context, base, raised, size * 0.18, spread(seed, hand) * size * 0.6, {
        ...paint,
        alpha: kept,
      });
      for (let finger = 0; finger < 4; finger += 1) {
        const bend = toward + (finger - 1.5) * (0.5 - grip * 0.3);
        const length = size * (0.8 - grip * 0.3);

        edge(
          context,
          raised,
          [raised[0] + Math.cos(bend) * length, raised[1] + Math.sin(bend) * length],
          size * 0.14,
          size * 0.15 * (finger - 1.5) * grip,
          { color: light, alpha: kept },
        );
      }
    }
    if (grip > 0) {
      orb(context, at, size * (1 + grip * 1.2), { color: SHADE, alpha: kept * 0.55 * grip });
      for (let pulse = 0; pulse < 2; pulse += 1) {
        const held = (share * 3 + pulse / 2) % 1;

        ring(context, at, size * (3 - held * 2.2), {
          color: paint.color,
          alpha: kept * grip * held,
          width: 3 * stage.scale,
        });
      }
    }
  },

  // The caster spinning into a steel drill, driving into it in a spray of sparks
  Corkscrew(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const go = unleashed(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const distance = Math.max(1, Math.hypot(dx, dy));
    const way: Point = [dx / distance, dy / distance];
    const length = size * 3.4 * Math.min(1, go / 0.1);
    const drive = Math.min(1, go / CORKSCREW_HITS) ** 1.6;
    const grind = Math.max(0, (go - CORKSCREW_HITS) / (1 - CORKSCREW_HITS));
    const push = grind * size * 0.8;
    const stop: Point = [at[0] - way[0] * (length - push), at[1] - way[1] * (length - push)];
    const base = between(stage.source, stop, drive);
    const tip: Point = [base[0] + way[0] * length, base[1] + way[1] * length];
    const kept = late(grind, 0.6);
    const angle = Math.atan2(way[1], way[0]);

    for (let band = 0; band < 3; band += 1) {
      const held = (share * 4 + band / 3) % 1;

      hoop(
        context,
        [base[0] - way[0] * held * size * 2.4, base[1] - way[1] * held * size * 2.4],
        size * (1.3 + held * 0.8),
        0.3,
        angle,
        { color: band === 0 ? Z_GOLD : light, alpha: kept * (1 - held), width: 2.4 * stage.scale },
      );
    }
    orb(context, base, size * 1.8, { color: Z_GOLD, alpha: kept * 0.4 });
    drill(context, base, tip, size * 1.3, share * 8, paint.color, kept);
    if (grind <= 0) {
      return;
    }
    for (let spark = 0; spark < many(16, weight); spark += 1) {
      const held = (grind * 4 + noise(seed, spark)) % 1;
      const fling = angle + Math.PI + spread(seed, spark + 10) * 1.6;
      const from: Point = [
        at[0] + Math.cos(fling) * size * held * 3,
        at[1] + Math.sin(fling) * size * held * 3 + held * held * size * 1.4,
      ];

      edge(context, between(from, at, 0.25), from, size * 0.06, 0, {
        color: spark % 2 === 0 ? '#ffffff' : Z_GOLD,
        alpha: decay(held) * kept,
      });
    }
    ring(context, at, size * (0.8 + ((grind * 5) % 1) * 1.4), {
      color: light,
      alpha: kept * 0.8,
      width: 2.6 * stage.scale,
    });
    blast(context, at, size * 1.3, (grind - 0.55) / 0.45, paint.color, seed, stage.scale);
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default zTypes;
