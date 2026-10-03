import type { Point } from '../../stage';
import {
  beam,
  between,
  bolt,
  bubble,
  burst,
  chevrons,
  decay,
  edge,
  fade,
  heart,
  hoop,
  lash,
  late,
  lighten,
  mix,
  motes,
  noise,
  orb,
  ring,
  ripple,
  shards,
  sickle,
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { settle } from './stats';
import { Z_GOLD, unleashed, zPower } from './z-power';

/** Catastropika: the share of the payoff the leap lands at */
export const CATASTROPIKA_LANDS = 0.45;

/** Sinister Arrow Raid: the share of the payoff the great arrow is loosed, and the share it strikes */
export const RAID_FINAL = 0.58;
export const RAID_STRIKES = 0.74;

/** Malicious Moonsault: the share of the payoff it reaches the ropes, and the share it slams down */
export const MOONSAULT_SPRING = 0.35;
export const MOONSAULT_SLAMS = 0.68;

/** Oceanic Operetta: the share of the payoff the balloon drops, and the share it bursts */
export const OPERETTA_DROPS = 0.5;
export const OPERETTA_BURSTS = 0.62;

/** Stoked Sparksurfer: the share of the payoff the surfer arrives */
export const SPARKSURF_HITS = 0.6;

/** Pulverizing Pancake: the share of the payoff it leaps, and the share it lands */
export const PANCAKE_LEAPS = 0.3;
export const PANCAKE_LANDS = 0.68;

/** Extreme Evoboost: the share of the payoff the beams fire, and the share Eevee flares */
export const EVOBOOST_FIRE = 0.3;
export const EVOBOOST_FLARE = 0.6;

/** 10,000,000 Volt Thunderbolt: the share of the payoff the bolts fire, and the share they land */
export const MEGAVOLT_FIRE = 0.22;
export const MEGAVOLT_HITS = 0.55;

/** Let's Snuggle Forever: the share of the payoff the dust cloud has closed by */
export const SNUGGLE_CLOUD = 0.2;

export const PIKA = '#ffd23a';
export const RAID_SHADE = '#16301f';
export const RAID_GHOST = '#56d98a';
export const RAID_SHAFT = '#2c5a36';
export const ROPE = '#e8403a';
export const POST = '#dfe2ea';
export const MAT = '#3a3f58';
export const FLAME = '#ff6a28';
export const BALLOON = '#6fcfff';
export const SPOTLIGHT = '#fff4c8';
export const NOTE_TONES = ['#ff9fd0', '#8fd8ff', '#fff08a'];
export const RAICHU = '#f2a23a';
export const PSYCHIC = '#b48cff';
export const SNORLAX = '#2f5d6b';
export const BELLY = '#efe0bc';
export const DUST = '#cdb894';
export const SHADOW = '#2a1636';
export const PASTELS = ['#ffb3da', '#cdb0ff'];
export const DISGUISE = '#f2d45c';

/** Extreme Evoboost: the eight eeveelutions, Vaporeon to Sylveon, and Umbreon's rings */
export const EEVEELUTIONS = [
  '#4aa8ff',
  '#ffe03a',
  '#ff8a2a',
  '#d6a6ff',
  '#26263a',
  '#6cd06a',
  '#8ee6ff',
  '#ff9fcf',
];
export const UMBREON = 4;
export const UMBREON_RING = '#ffe35a';

/** 10,000,000 Volt Thunderbolt: the seven bolts, one per colour of the cap */
export const MEGAVOLT_TONES = [
  '#ff4a4a',
  '#ff9a2a',
  '#ffe23a',
  '#5ce05a',
  '#3ac8ff',
  '#5a6aff',
  '#c05aff',
];

/** How far a share is between two marks, clamped to 0 and 1 */
export function within(share: number, from: number, to: number): number {
  return Math.max(0, Math.min(1, (share - from) / (to - from)));
}

/** Catastropika: the leap, rising high and dropping steeply onto the target */
export function leapLift(along: number): number {
  return Math.sin(Math.PI * Math.min(1, along) ** 0.8);
}

/** Stoked Sparksurfer: how far above the straight line the track rolls at a point along it */
export function surfLift(along: number): number {
  return Math.sin(along * Math.PI * 3) * 0.8 + Math.sin(Math.PI * along) * 2;
}

/** A filled oval, for a shadow on the floor or a body seen whole */
function round(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  color: string,
  alpha: number,
): void {
  if (!(across > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, across, Math.max(0.1, up), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** An arrow along a line, head at `to` */
function arrow(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  width: number,
  color: string,
  alpha: number,
): void {
  edge(context, from, to, width, 0, { color, alpha });

  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const head = width * 3;

  context.beginPath();
  context.moveTo(to[0], to[1]);
  context.lineTo(to[0] - Math.cos(angle - 0.5) * head, to[1] - Math.sin(angle - 0.5) * head);
  context.lineTo(to[0] - Math.cos(angle + 0.5) * head, to[1] - Math.sin(angle + 0.5) * head);
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A quaver: a round head, a stem and a flag */
function note(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  round(context, [x, y], size * 0.42, size * 0.3, color, alpha);
  edge(context, [x + size * 0.36, y], [x + size * 0.36, y - size * 1.3], size * 0.1, 0, {
    color,
    alpha,
  });
  edge(
    context,
    [x + size * 0.36, y - size * 1.3],
    [x + size * 0.9, y - size * 0.8],
    size * 0.12,
    size * 0.1,
    { color, alpha },
  );
}

const zPartners = {
  // Pikachu wrapped in lightning leaping high and belly-flopping onto it in a huge electric blast
  Catastropika(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const hot = lighten(PIKA, 0.6);
    const flick = Math.floor(share * 24);

    if (done < CATASTROPIKA_LANDS) {
      const leap = done / CATASTROPIKA_LANDS;
      const place = (along: number): Point => {
        const [x, y] = between(stage.source, at, along);

        return [x, y - size * 9 * leapLift(along)];
      };
      const head = place(leap);

      round(
        context,
        foot,
        size * (0.6 + leap * 1.8),
        size * 0.3 * (1 + leap),
        '#000000',
        leap * 0.4,
      );
      for (let trail = 1; trail <= 5; trail += 1) {
        orb(context, place(Math.max(0, leap - trail * 0.05)), size * (1.2 - trail * 0.15), {
          color: PIKA,
          alpha: (1 - trail / 6) * 0.5,
        });
      }
      orb(context, head, size * 1.6, { color: PIKA, alpha: 0.7 });
      orb(context, head, size * 0.9, { color: hot, alpha: 1 });
      for (let arc = 0; arc < 4; arc += 1) {
        const angle = noise(seed + flick, arc) * Math.PI * 2;

        bolt(
          context,
          head,
          [head[0] + Math.cos(angle) * size * 2, head[1] + Math.sin(angle) * size * 2],
          seed + flick * 7 + arc,
          { color: hot, alpha: flick % 3 === 2 ? 0.5 : 1, width: 2 * stage.scale },
        );
      }
      return;
    }
    const hit = (done - CATASTROPIKA_LANDS) / (1 - CATASTROPIKA_LANDS);
    const bright = decay(hit) * (flick % 3 === 2 ? 0.6 : 1);

    orb(context, at, size * (1.5 + hit * 4.5), { color: PIKA, alpha: decay(hit) * 0.55 });
    orb(context, at, size * (2 + hit * 3), { color: hot, alpha: decay(Math.min(1, hit * 1.3)) });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = within(hit, wave * 0.18, wave * 0.18 + 0.6);

      if (held > 0) {
        ripple(context, foot, size * (1 + held * 6), {
          color: PIKA,
          alpha: decay(held) * 0.9,
          width: 3.4 * stage.scale,
        });
      }
    }
    ring(context, at, size * (1 + hit * 5), {
      color: hot,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    for (let arc = 0; arc < many(8, weight); arc += 1) {
      const angle = (arc / many(8, weight)) * Math.PI * 2 + noise(seed + flick, arc) * 0.6;
      const out = size * (2.5 + hit * 3);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        seed + flick * 5 + arc,
        { color: hot, alpha: bright, width: 2.6 * stage.scale },
      );
    }
    burst(context, at, size * (3 + hit * 3), 16, seed, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2)),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 4, many(16, weight), seed, hit, {
      color: PIKA,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A dark forest-green barrage of ghostly arrows raining in from above, then one great arrow
  ArrowRaid(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const glow = lighten(RAID_GHOST, 0.3);

    if (done < 0.22) {
      const up = done / 0.22;

      for (let shaft = 0; shaft < 8; shaft += 1) {
        const tip: Point = [
          stage.source[0] + spread(seed, shaft) * size * 1.5,
          stage.source[1] - size * (1 + up * 9 * (0.7 + noise(seed, shaft + 5) * 0.5)),
        ];

        arrow(context, [tip[0], tip[1] + size * 1.4], tip, size * 0.08, glow, decay(up));
      }
    }
    const shade = within(done, 0.08, 0.3) * late(done, 0.8);

    orb(context, at, size * 3.2, { color: RAID_SHADE, alpha: shade * 0.6 });
    ripple(context, foot, size * 2.6, {
      color: RAID_GHOST,
      alpha: shade * 0.6,
      width: 2.6 * stage.scale,
    });
    for (let shaft = 0; shaft < many(22, weight); shaft += 1) {
      const start = 0.1 + noise(seed, shaft) * 0.45;
      const flight = within(done, start, start + 0.14);
      const spot: Point = [
        at[0] + spread(seed, shaft + 90) * size * 0.9,
        at[1] + spread(seed, shaft + 120) * size * 0.6,
      ];

      if (flight > 0 && flight < 1) {
        const from: Point = [
          at[0] + spread(seed, shaft + 30) * size * 7,
          at[1] - size * (7 + noise(seed, shaft + 60) * 3),
        ];
        const tip = between(from, spot, flight);
        const tail = between(from, spot, Math.max(0, flight - 0.25));

        edge(context, tail, tip, size * 0.3, 0, { color: RAID_GHOST, alpha: 0.35 });
        arrow(context, tail, tip, size * 0.07, RAID_SHAFT, 1);
      }
      const after = within(done, start + 0.14, start + 0.3);

      if (after > 0 && after < 1) {
        ring(context, spot, size * (0.2 + after * 1.2), {
          color: glow,
          alpha: decay(after),
          width: 2 * stage.scale,
        });
      }
    }
    const from: Point = [at[0] - size * 4, at[1] - size * 12];
    const big = within(done, RAID_FINAL, RAID_STRIKES);

    if (big > 0 && big < 1) {
      const tip = between(from, at, big);
      const tail = between(from, at, Math.max(0, big - 0.45));

      edge(context, tail, tip, size * 1.2, 0, { color: RAID_GHOST, alpha: 0.5 });
      arrow(context, tail, tip, size * 0.3, lighten(RAID_GHOST, 0.4), 1);
    }
    const hit = within(done, RAID_STRIKES, 1);

    if (hit > 0) {
      // The great arrow stays standing in it
      arrow(context, between(from, at, 0.75), at, size * 0.3, RAID_SHAFT, late(hit, 0.5));
      orb(context, at, size * (1.4 + hit * 2.4), { color: glow, alpha: decay(hit) });
      ring(context, at, size * (1 + hit * 3.6), {
        color: RAID_GHOST,
        alpha: decay(hit),
        width: 3.4 * stage.scale,
      });
      ripple(context, foot, size * (1 + hit * 4), {
        color: RAID_GHOST,
        alpha: decay(hit) * 0.8,
        width: 3 * stage.scale,
      });
      burst(context, at, size * (2.6 + hit * 2), 14, seed, {
        color: glow,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      shards(context, at, size * 3, many(12, weight), seed, hit, {
        color: RAID_SHAFT,
        alpha: decay(hit),
        width: 4 * stage.scale,
      });
    }
  },

  // A wrestling ring rising round it, the caster springing off the ropes and body-slamming it in flames
  Moonsault(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = at[1] + size * 0.9;
    const hot = mix(FLAME, '#ffe070', 0.6);
    const rise = settle(within(done, 0, 0.2));
    const kept = late(done, 0.8);
    const tall = size * 2.6 * rise;
    const pull = swell(within(done, MOONSAULT_SPRING - 0.12, MOONSAULT_SPRING + 0.1));
    // Back left, back right, front right, front left
    const posts: Point[] = [
      [at[0] - size * 2.6, foot - size * 0.9],
      [at[0] + size * 2.6, foot - size * 0.9],
      [at[0] + size * 3.4, foot + size * 0.9],
      [at[0] - size * 3.4, foot + size * 0.9],
    ];

    context.beginPath();
    for (const [index, [x, y]] of posts.entries()) {
      context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
    }
    context.closePath();
    context.fillStyle = fade(MAT, rise * kept * 0.35);
    context.fill();
    for (const post of posts) {
      edge(context, post, [post[0], post[1] - tall], size * 0.22, 0, { color: POST, alpha: kept });
    }
    for (let side = 0; side < 4; side += 1) {
      const from = posts[side];
      const to = posts[(side + 1) % 4];

      for (let strand = 1; strand <= 3; strand += 1) {
        const height = (tall * strand) / 3.2;

        lash(
          context,
          [from[0], from[1] - height],
          [to[0], to[1] - height],
          side === 3 ? -pull * size * 1.4 : 0,
          { color: ROPE, alpha: kept * (side === 2 ? 0.5 : 1), width: 2.4 * stage.scale },
        );
      }
    }
    const rope: Point = [at[0] - size * (3 + pull * 1.4), foot - tall * 0.55];

    if (done < MOONSAULT_SLAMS) {
      const place = (when: number): Point => {
        if (when < MOONSAULT_SPRING) {
          return between(stage.source, rope, settle(within(when, 0.08, MOONSAULT_SPRING)));
        }
        const flight = within(when, MOONSAULT_SPRING, MOONSAULT_SLAMS);
        const [x, y] = between(rope, at, flight);

        return [x, y - size * 8 * Math.sin(Math.PI * flight)];
      };
      const body = place(done);

      for (let trail = 1; trail <= 4; trail += 1) {
        orb(context, place(Math.max(0, done - trail * 0.025)), size * (1 - trail * 0.15), {
          color: FLAME,
          alpha: (1 - trail / 5) * 0.5,
        });
      }
      orb(context, body, size * 1.3, { color: FLAME, alpha: 0.85 });
      if (done > MOONSAULT_SPRING) {
        // The backflip: a flaming hoop turning round the body
        const turn = within(done, MOONSAULT_SPRING, MOONSAULT_SLAMS) * Math.PI * 3;

        sickle(context, body, size * 1.6, turn, turn + 2.4, size * 0.45, {
          color: hot,
          alpha: 0.9,
        });
      }
      return;
    }
    const hit = within(done, MOONSAULT_SLAMS, 1);

    orb(context, at, size * (1.6 + hit * 3), { color: FLAME, alpha: decay(hit) * 0.7 });
    orb(context, at, size * (1.2 + hit * 1.6), {
      color: hot,
      alpha: decay(Math.min(1, hit * 1.6)),
    });
    for (let lick = 0; lick < many(14, weight); lick += 1) {
      const up = (share * 1.8 + noise(seed, lick)) % 1;

      orb(
        context,
        [at[0] + spread(seed, lick + 20) * size * 2.4, foot - up * size * 4.5],
        size * 0.7 * (1 - up * 0.5),
        { color: up < 0.4 ? hot : FLAME, alpha: swell(up) * decay(hit) },
      );
    }
    ripple(context, [at[0], foot], size * (1 + hit * 4.5), {
      color: FLAME,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    ring(context, at, size * (1 + hit * 3.4), {
      color: hot,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    burst(context, at, size * (2.6 + hit * 2.4), 16, seed, {
      color: hot,
      alpha: decay(Math.min(1, hit * 1.5)),
      width: 3.4 * stage.scale,
    });
  },

  // A giant water balloon gathered under a spotlight among music notes, dropped and bursting over it
  Operetta(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const top: Point = [at[0], at[1] - size * 5.5];
    const foam = lighten(BALLOON, 0.55);
    const grow = settle(within(done, 0, OPERETTA_DROPS));
    const drop = within(done, OPERETTA_DROPS, OPERETTA_BURSTS);
    const hit = within(done, OPERETTA_BURSTS, 1);
    const spot = within(done, 0, 0.15) * late(done, 0.85);
    const cone = context.createLinearGradient(0, at[1] - size * 12, 0, foot[1]);

    cone.addColorStop(0, fade(SPOTLIGHT, 0.05 * spot));
    cone.addColorStop(1, fade(SPOTLIGHT, 0.35 * spot));
    context.beginPath();
    context.moveTo(at[0] - size * 0.6, at[1] - size * 12);
    context.lineTo(at[0] + size * 0.6, at[1] - size * 12);
    context.lineTo(at[0] + size * 3, foot[1]);
    context.lineTo(at[0] - size * 3, foot[1]);
    context.closePath();
    context.fillStyle = cone;
    context.fill();
    round(context, foot, size * 3, size * 1, SPOTLIGHT, spot * 0.3);

    const radius = size * (0.6 + grow * 2.6);
    const centre = hit > 0 ? at : between(top, at, drop * drop);

    if (hit <= 0) {
      for (let stream = 0; stream < many(8, weight); stream += 1) {
        const from: Point = [at[0] + spread(seed, stream) * size * 5, foot[1]];
        const held = (share * 2 + noise(seed, stream + 10)) % 1;

        orb(context, between(from, top, held), size * 0.35, {
          color: BALLOON,
          alpha: swell(held) * (1 - drop),
        });
      }
      orb(context, centre, radius * 0.85, { color: BALLOON, alpha: 0.4 });
      bubble(context, centre, radius, { color: foam, alpha: 1, width: 2.6 * stage.scale });
    } else {
      orb(context, at, size * (2 + hit * 2.5), {
        color: foam,
        alpha: decay(Math.min(1, hit * 1.4)),
      });
      for (let wave = 0; wave < 3; wave += 1) {
        const held = within(hit, wave * 0.2, wave * 0.2 + 0.6);

        if (held > 0) {
          ripple(context, foot, size * (1 + held * 5), {
            color: BALLOON,
            alpha: decay(held) * 0.9,
            width: 3 * stage.scale,
          });
        }
      }
      ring(context, at, size * (1.6 + hit * 3.4), {
        color: foam,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      for (let spout = 0; spout < many(6, weight); spout += 1) {
        const angle = (spout / many(6, weight)) * Math.PI * 2 + noise(seed, spout) * 0.4;
        const base: Point = [
          foot[0] + Math.cos(angle) * size * 2,
          foot[1] + Math.sin(angle) * size * 0.6,
        ];

        beam(
          context,
          base,
          [base[0], base[1] - size * (2.4 + noise(seed, spout + 10) * 2)],
          Math.min(1, hit * 3),
          size * 0.35 * decay(hit),
          { color: BALLOON, alpha: decay(hit) },
        );
      }
      motes(context, at, size * 4, many(18, weight), seed, hit, {
        color: foam,
        alpha: decay(hit),
        width: 2.6 * stage.scale,
      });
    }
    // The notes circle the balloon, then scatter when it bursts
    const notes = many(6, weight);

    for (let index = 0; index < notes; index += 1) {
      const angle = (index / notes) * Math.PI * 2 + share * 3;
      const out = hit > 0 ? size * (3 + hit * 3) : radius * 1.4;

      note(
        context,
        [centre[0] + Math.cos(angle) * out, centre[1] + Math.sin(angle) * out * 0.7],
        size * 0.7,
        NOTE_TONES[index % NOTE_TONES.length],
        within(done, 0, 0.1) * decay(hit),
      );
    }
  },

  // The caster surfing its tail on a rolling track of lightning, riding it into the target
  Sparksurfer(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = lighten(PIKA, 0.6);
    const flick = Math.floor(share * 24);
    const ride = within(done, 0, SPARKSURF_HITS);
    const hit = within(done, SPARKSURF_HITS, 1);
    const kept = decay(hit);
    const place = (along: number): Point => {
      const [x, y] = between(stage.source, at, along);

      return [x, y + size * 0.8 - size * surfLift(along)];
    };
    const drawn = Math.min(1, ride + 0.15);
    const steps = 24;

    context.beginPath();
    for (let step = 0; step <= steps; step += 1) {
      const [x, y] = place((step / steps) * drawn);

      context[step === 0 ? 'moveTo' : 'lineTo'](x, y);
    }
    context.lineCap = 'round';
    context.strokeStyle = fade(PIKA, kept * 0.4);
    context.lineWidth = size * 0.8;
    context.stroke();
    context.strokeStyle = fade(hot, kept);
    context.lineWidth = size * 0.2;
    context.stroke();
    context.lineCap = 'butt';
    for (let segment = 0; segment < 8; segment += 1) {
      const end = (segment + 1) / 8;

      if (end <= drawn) {
        bolt(context, place(segment / 8), place(end), seed + flick * 9 + segment, {
          color: segment % 2 === 0 ? PSYCHIC : hot,
          alpha: kept * (flick % 3 === 2 ? 0.5 : 1),
          width: 1.8 * stage.scale,
        });
      }
    }
    if (ride < 1) {
      const head = place(ride);
      const rider: Point = [head[0], head[1] - size * 1.1];

      edge(
        context,
        [head[0] - size * 2, head[1] + size * 0.3],
        [head[0] + size * 1.2, head[1] - size * 0.2],
        size * 0.5,
        -size * 0.5,
        { color: PIKA, alpha: 0.6 },
      );
      edge(
        context,
        [head[0] - size * 1.1, head[1] - size * 0.1],
        [head[0] + size * 1.1, head[1] - size * 0.3],
        size * 0.22,
        0,
        { color: RAICHU, alpha: 1 },
      );
      orb(context, rider, size * 1.1, { color: RAICHU, alpha: 0.9 });
      ring(context, rider, size * 1.4, { color: PSYCHIC, alpha: 0.8, width: 2.4 * stage.scale });
      motes(context, head, size * 2, many(10, weight), seed + flick, 0.5, {
        color: hot,
        alpha: 0.9,
        width: 1.8 * stage.scale,
      });
      return;
    }
    orb(context, at, size * (1.4 + hit * 3.4), { color: PIKA, alpha: decay(hit) * 0.6 });
    orb(context, at, size * (1.4 + hit * 1.8), {
      color: hot,
      alpha: decay(Math.min(1, hit * 1.4)),
    });
    ring(context, at, size * (1 + hit * 4), {
      color: PSYCHIC,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    ring(context, at, size * (0.6 + hit * 3), {
      color: hot,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    for (let arc = 0; arc < many(7, weight); arc += 1) {
      const angle = (arc / many(7, weight)) * Math.PI * 2 + noise(seed + flick, arc) * 0.6;
      const out = size * (2.2 + hit * 2.4);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        seed + flick * 5 + arc,
        { color: hot, alpha: decay(hit), width: 2.4 * stage.scale },
      );
    }
    burst(context, at, size * (2.6 + hit * 2), 14, seed, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2)),
      width: 3 * stage.scale,
    });
  },

  // The ground shaking as the caster rolls in and leaps, then flattens it with a vast shockwave
  Pancake(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const middle = between(stage.source, at, 0.5);
    const roll = within(done, 0, PANCAKE_LEAPS);
    const leap = within(done, PANCAKE_LEAPS, PANCAKE_LANDS);
    const hit = within(done, PANCAKE_LANDS, 1);
    const bulk = size * 2.2;

    for (let wave = 0; wave < 2; wave += 1) {
      const held = (done * 4 + wave * 0.5) % 1;

      ripple(context, [stage.source[0], stage.source[1] + size * 0.9], size * (1 + held * 3), {
        color: DUST,
        alpha: decay(held) * (1 - hit) * 0.6,
        width: 2.4 * stage.scale,
      });
    }
    if (hit <= 0) {
      let body: Point;
      let radius = bulk;

      if (leap <= 0) {
        body = between(stage.source, middle, settle(roll));
        for (let puff = 0; puff < 5; puff += 1) {
          const behind = between(stage.source, middle, Math.max(0, settle(roll) - puff * 0.08));

          orb(context, [behind[0], behind[1] + bulk * 0.6], size * (0.6 + puff * 0.2), {
            color: DUST,
            alpha: (1 - puff / 5) * 0.5,
          });
        }
      } else {
        const [x, y] = between(middle, at, leap);

        body = [x, y - size * 11 * Math.sin(Math.PI * leap)];
        radius = bulk * (1 + swell(leap) * 0.4 + leap * 0.3);
        round(
          context,
          foot,
          size * (1 + leap * 2.6),
          size * 0.35 * (1 + leap * 2.6),
          '#000000',
          leap * 0.5,
        );
      }
      round(context, body, radius, radius, SNORLAX, 1);
      round(context, [body[0], body[1] + radius * 0.25], radius * 0.7, radius * 0.6, BELLY, 1);
      if (leap <= 0) {
        // Rolling: the lines of the body turning over
        const turn = roll * Math.PI * 6;

        for (let line = 0; line < 3; line += 1) {
          const from = -turn + (line / 3) * Math.PI * 2;

          sickle(context, body, radius * 0.85, from, from + 1, size * 0.18, {
            color: lighten(SNORLAX, 0.4),
            alpha: 0.8,
          });
        }
      }
      return;
    }
    const kept = late(hit, 0.3);

    round(context, [at[0], at[1] + size * 0.5], bulk * 1.8, bulk * 0.5, SNORLAX, kept);
    round(context, [at[0], at[1] + size * 0.35], bulk * 1.3, bulk * 0.28, BELLY, kept);
    for (let wave = 0; wave < 4; wave += 1) {
      const held = within(hit, wave * 0.12, wave * 0.12 + 0.6);

      if (held > 0) {
        ripple(context, foot, size * (1.4 + held * 9), {
          color: wave % 2 === 0 ? DUST : lighten(paint.color, 0.4),
          alpha: decay(held),
          width: 4.4 * stage.scale,
        });
      }
    }
    hoop(context, foot, size * (2 + hit * 6), 0.34, 0, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2)),
      width: 5 * stage.scale,
    });
    for (let puff = 0; puff < many(12, weight); puff += 1) {
      const angle = (puff / many(12, weight)) * Math.PI * 2;
      const out = size * (2 + hit * 5);

      orb(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34],
        size * (0.8 + hit * 0.8),
        { color: DUST, alpha: decay(hit) * 0.7 },
      );
    }
    shards(context, at, size * 4, many(14, weight), seed, hit, {
      color: mix(DUST, '#5b4636', 0.5),
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    burst(context, at, size * (3 + hit * 3), 18, seed, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 1.6)),
      width: 3.4 * stage.scale,
    });
  },

  // Eight lights in the eeveelutions' colours circling Eevee and beaming into it, then it flares with its stats rising
  Evoboost(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = stage.source;
    const size = REACH * stage.scale * weight;
    const appear = within(done, 0, 0.2);
    const fire = within(done, EVOBOOST_FIRE, EVOBOOST_FLARE);
    const flare = within(done, EVOBOOST_FLARE - 0.05, 1);
    const circle = size * (3.4 - settle(fire) * 1.2);
    const shown = appear * late(done, 0.7);

    for (const [index, tone] of EEVEELUTIONS.entries()) {
      const angle = (index / EEVEELUTIONS.length) * Math.PI * 2 + done * Math.PI * 1.2;
      const spot: Point = [
        at[0] + Math.cos(angle) * circle,
        at[1] + Math.sin(angle) * circle * 0.45 - size * 0.4,
      ];

      if (fire > 0) {
        beam(context, spot, at, settle(fire * 1.5), size * 0.4 * swell(fire), {
          color: tone,
          alpha: shown,
        });
      }
      orb(context, spot, size * 0.95, { color: tone, alpha: shown });
      if (index === UMBREON) {
        ring(context, spot, size * 0.55, {
          color: UMBREON_RING,
          alpha: shown,
          width: 2.2 * stage.scale,
        });
      }
    }
    if (flare <= 0) {
      return;
    }
    orb(context, at, size * (1.4 + swell(flare) * 1.4), {
      color: lighten(Z_GOLD, 0.4),
      alpha: decay(flare),
    });
    star(context, at, size * 2.6 * swell(flare), flare * 2, {
      color: '#ffffff',
      alpha: decay(flare) * 0.8,
    });
    for (const [index, tone] of EEVEELUTIONS.entries()) {
      const held = within(flare, index * 0.04, index * 0.04 + 0.6);

      if (held > 0 && index !== UMBREON) {
        ring(context, at, size * (1 + held * 4), {
          color: tone,
          alpha: decay(held) * 0.8,
          width: 2.4 * stage.scale,
        });
      }
    }
    // One column of rising arrows per stat it raises
    for (let column = 0; column < 5; column += 1) {
      chevrons(
        context,
        [at[0] + (column - 2) * size * 0.9, at[1] - size * 0.6],
        size * 1.2,
        3,
        share,
        {
          color: EEVEELUTIONS[column + (column >= UMBREON ? 1 : 0)],
          alpha: swell(flare),
          width: 3 * stage.scale,
        },
      );
    }
    motes(context, at, size * 3, many(14, weight), seed, flare, {
      color: Z_GOLD,
      alpha: decay(flare),
      width: 2 * stage.scale,
    });
  },

  // Pikachu charged in a rainbow aura firing seven coloured bolts that converge on the target
  Megavolt(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const flick = Math.floor(share * 24);
    const charge = within(done, 0, MEGAVOLT_FIRE);
    const fire = within(done, MEGAVOLT_FIRE * 0.6, MEGAVOLT_HITS);
    const hit = within(done, MEGAVOLT_HITS, 1);
    const aura = settle(charge) * late(done, 0.6);

    orb(context, stage.source, size * (1.2 + charge * 0.8), { color: PIKA, alpha: aura * 0.7 });
    for (const [index, tone] of MEGAVOLT_TONES.entries()) {
      const pulse = swell((share * 3 + index / 7) % 1);

      ring(context, stage.source, size * (1.2 + index * 0.22 + pulse * 0.3), {
        color: tone,
        alpha: aura * 0.8,
        width: 2 * stage.scale,
      });
    }
    if (fire > 0 && hit < 1) {
      const kept = decay(Math.min(1, hit * 2));

      for (const [index, tone] of MEGAVOLT_TONES.entries()) {
        const angle = -Math.PI / 2 + (index / 6 - 0.5) * Math.PI * 0.9;
        const origin: Point = [
          stage.source[0] + Math.cos(angle) * size * 2.2,
          stage.source[1] + Math.sin(angle) * size * 2.2,
        ];
        const head = between(origin, at, settle(fire));

        orb(context, origin, size * 0.55, { color: tone, alpha: kept });
        bolt(context, origin, head, seed + flick * 11 + index, {
          color: tone,
          alpha: kept * 0.5,
          width: size * 0.45,
        });
        bolt(context, origin, head, seed + flick * 11 + index, {
          color: lighten(tone, 0.6),
          alpha: kept,
          width: size * 0.14,
        });
      }
    }
    if (hit <= 0) {
      return;
    }
    orb(context, at, size * (1.6 + hit * 3), {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 1.3)),
    });
    for (const [index, tone] of MEGAVOLT_TONES.entries()) {
      const held = within(hit, index * 0.05, index * 0.05 + 0.6);

      if (held > 0) {
        ring(context, at, size * (0.8 + held * 4.4), {
          color: tone,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
      const angle = (index / 7) * Math.PI * 2 + noise(seed + flick, index) * 0.5;
      const out = size * (2.4 + hit * 2);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        seed + flick * 3 + index,
        { color: lighten(tone, 0.4), alpha: decay(hit), width: 2.4 * stage.scale },
      );
    }
    burst(context, at, size * (3 + hit * 2.4), 21, seed, {
      color: lighten(PIKA, 0.5),
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
  },

  // Mimikyu dragging it into a pastel dust cloud, a flurry of hits, stars and hearts, and shadow claws raking
  Snuggle(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);
    const done = unleashed(share);

    if (done <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = within(done, 0, SNUGGLE_CLOUD);
    const cloud = within(done, SNUGGLE_CLOUD * 0.5, SNUGGLE_CLOUD + 0.05) * late(done, 0.85);
    const fight = within(done, SNUGGLE_CLOUD, 0.88);

    if (run < 1) {
      const runner = between(stage.source, at, settle(run));

      for (let puff = 1; puff <= 5; puff += 1) {
        const behind = between(stage.source, at, Math.max(0, settle(run) - puff * 0.06));

        orb(context, [behind[0], behind[1] + size * 0.6], size * (0.5 + puff * 0.15), {
          color: PASTELS[puff % 2],
          alpha: (1 - puff / 6) * 0.6,
        });
      }
      round(context, [runner[0], runner[1] + size * 0.9], size * 0.9, size * 0.3, SHADOW, 0.5);
      orb(context, runner, size * 1.1, { color: DISGUISE, alpha: 0.9 });
    }
    for (let puff = 0; puff < many(14, weight); puff += 1) {
      const angle = noise(seed, puff) * Math.PI * 2 + share * (1 + noise(seed, puff + 7)) * 4;
      const out = size * (1.2 + noise(seed, puff + 14) * 1.6) * cloud;

      orb(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7],
        size * (1.1 + noise(seed, puff + 21) * 0.8) * cloud,
        { color: PASTELS[puff % 2], alpha: cloud * 0.75 },
      );
    }
    const blows = many(10, weight);

    for (let blow = 0; blow < blows; blow += 1) {
      const when = (blow / blows) * 0.86;
      const pop = within(fight, when, when + 0.14);

      if (pop <= 0 || pop >= 1) {
        continue;
      }
      const spot: Point = [
        at[0] + spread(seed, blow + 40) * size * 2,
        at[1] + spread(seed, blow + 50) * size * 1.2,
      ];
      const flung: Point = [
        spot[0] + spread(seed, blow + 60) * size * pop,
        spot[1] - size * 1.6 * pop,
      ];

      burst(context, spot, size * (0.6 + pop * 1.4), 8, seed + blow, {
        color: '#ffffff',
        alpha: decay(pop),
        width: 2.4 * stage.scale,
      });
      if (blow % 2 === 0) {
        star(context, flung, size * 0.55, pop * 3, { color: '#fff08a', alpha: decay(pop) });
      } else {
        heart(context, flung, size * 0.5, { color: PASTELS[0], alpha: decay(pop) });
      }
    }
    // The disguise's shadow claws, three fingers raking across it
    for (let claw = 0; claw < 3; claw += 1) {
      const when = 0.15 + claw * 0.26;
      const swipe = within(fight, when, when + 0.2);

      if (swipe <= 0 || swipe >= 1) {
        continue;
      }
      const from = -2.6 + claw * 0.9;

      for (let finger = 0; finger < 3; finger += 1) {
        const radius = size * (1.8 + finger * 0.4);

        sickle(context, at, radius, from, from + settle(swipe) * 2, size * 0.5, {
          color: SHADOW,
          alpha: decay(swipe) * 0.9,
        });
        sickle(context, at, radius, from, from + settle(swipe) * 2, size * 0.16, {
          color: PASTELS[0],
          alpha: decay(swipe),
        });
      }
    }
    const end = within(done, 0.85, 1);

    if (end > 0) {
      orb(context, at, size * (1 + end * 2.4), { color: PASTELS[0], alpha: decay(end) });
      ring(context, at, size * (1 + end * 3.4), {
        color: PASTELS[1],
        alpha: decay(end),
        width: 3 * stage.scale,
      });
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default zPartners;
