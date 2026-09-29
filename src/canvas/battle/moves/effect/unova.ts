import { Types } from '../../../../data/constants/types';
import type { Point, Stage } from '../../stage';
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
  petal,
  ring,
  ripple,
  shards,
  sickle,
  spread,
  star,
  swell,
} from '../__paint';
import { backToward, imbue } from './contact';
import { note } from './minds';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { settle, showing } from './stats';

/** V-create, Fusion Flare and Bolt, and Sacred Sword: the share at which each lands */
export const VICTORY_RISES = 0.15;
export const VICTORY_LANDS = 0.4;
export const FUSION_LANDS = 0.3;
export const SMITE_LANDS = 0.35;

/** Sacred Sword: each blade's place beside it in reaches (across, away), its size, and when it lands */
export const SMITE_BLADES: [right: number, away: number, scale: number, lands: number][] = [
  [-1.8, 0.8, 0.7, 0.22],
  [1.8, 0.8, 0.7, 0.28],
  [0, 0, 1, SMITE_LANDS],
];

/** Shell Smash: the share the shell strains before it breaks; Heavy Slam: the share before the weight lands */
export const SMASH_BREAKS = 0.45;
export const TONNAGE_LANDS = 0.25;

/** Sky Drop, Foul Play and Head Charge: the share at which the blow lands */
export const PLUMMET_LANDS = 0.35;
export const TURN_BACK = 0.55;
export const RAM_HITS = 0.33;

/** Kyurem's other halves: Zekrom's spark on Freeze Shock and Reshiram's fire on Ice Burn */
export const KYUREM_SPARK = '#fac000';
export const KYUREM_FIRE = '#e62829';

/** Freeze Shock and Ice Burn: the share the ice shatters at */
export const KYUREM_BREAK = 0.7;

/** Blue Flare: the share it stops gathering, and the share the fire lands */
export const AZURE_FLIES = 0.2;
export const AZURE_HITS = 0.35;

/** Techno Blast: the share it fires, and the share the beam lands */
export const TECHNO_FIRES = 0.2;
export const TECHNO_HITS = 0.4;

/** Relic Song: Meloetta's green, and the gold and pink its notes come in */
export const ARIA_TONES = ['#8fe0b0', '#ffd27a', '#f0a8d0'];

/** A crown of ice spikes standing up out of the ground round a point, `grow` from 0 to 1 */
function iceSpikes(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  grow: number,
  seed: number,
  color: string,
  alpha: number,
): void {
  const count = 11;

  for (let spike = 0; spike < count; spike += 1) {
    const angle = (spike / count) * Math.PI * 2 + noise(seed, spike) * 0.4;
    const round = size * (1 + noise(seed, spike + 30) * 0.9);
    const tall =
      size *
      (1.4 + noise(seed, spike + 10) * 1.8) *
      Math.min(1, grow * (1 + noise(seed, spike + 40)));
    const base: Point = [
      x + Math.cos(angle) * round,
      y + size * 0.9 + Math.sin(angle) * round * 0.35,
    ];
    // Leaning in over it
    const top: Point = [base[0] - Math.cos(angle) * size * 0.35, base[1] - tall * 1.6];

    if (tall <= 0) {
      continue;
    }
    edge(context, base, top, size * 0.34, 0, { color, alpha });
    edge(context, base, between(base, top, 0.8), size * 0.1, 0, {
      color: '#ffffff',
      alpha: alpha * 0.8,
    });
  }
}

/** Kyurem's pair: a crown of ice round it, the element coming through, and the ice shattering */
function frozen(
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  color: string,
  seed: number,
  weight: number,
  element: Types,
  spark: string,
): void {
  const at = landing(stage);
  const size = REACH * stage.scale * weight;
  const ice = lighten(color, 0.4);
  const grow = settle(share * 3);
  const broken = Math.max(0, (share - KYUREM_BREAK) / (1 - KYUREM_BREAK));
  const kept = Math.min(1, share * 20) * decay(broken);
  const flick = Math.floor(share * 14);
  const foot = at[1] + size * 0.9;

  ripple(context, [at[0], foot], size * (0.8 + grow * 2.4), {
    color: '#ffffff',
    alpha: kept * 0.7,
    width: 2.4 * stage.scale,
  });
  iceSpikes(context, at, size, grow, seed, ice, kept);
  if (element === Types.Electric) {
    for (let one = 0; one < 3; one += 1) {
      bolt(context, [at[0] + (one - 1) * size * 2, at[1] - size * 7], at, seed + flick * 7 + one, {
        color: spark,
        alpha: kept * (flick % 3 === 2 ? 0.4 : 1),
        width: 3 * stage.scale,
      });
    }
  } else {
    for (let one = 0; one < 5; one += 1) {
      const base: Point = [at[0] + (one / 4 - 0.5) * size * 2.6, foot];

      beam(
        context,
        base,
        [base[0], base[1] - size * (2 + noise(seed, one + 70) * 1.5)],
        grow,
        size * 0.4,
        {
          color: spark,
          alpha: kept,
        },
      );
    }
  }
  imbue(context, at, size * 1.2, share, seed, { color: spark }, element, stage.scale);
  if (broken > 0) {
    shards(context, at, size * 2.6, many(14, weight), seed, broken, {
      color: ice,
      alpha: decay(broken),
      width: 2.8 * stage.scale,
    });
    star(context, at, size * 2.4 * decay(broken), 0, { color: '#ffffff', alpha: decay(broken) });
  }
}

/** Psyshock: the share its shards hang round the target, and how long driving them in takes */
export const CONVERGE_HOLD = 0.35;
export const CONVERGE_DRIVE = 0.15;

/** Stored Power: how many orbs circle in, and the share by which they have closed */
export const ORBIT_ORBS = 5;
export const ORBIT_CLOSE = 0.7;

/** Final Gambit: the share at which the blow lands */
export const GAMBIT_LANDS = 0.4;

/** A ring of `sides` straight edges round a point, turned by `turn` */
function polygon(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  sides: number,
  turn: number,
  color: string,
  alpha: number,
  width: number,
): void {
  context.beginPath();
  for (let corner = 0; corner <= sides; corner += 1) {
    const angle = turn + (corner / sides) * Math.PI * 2;

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
    );
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
}

/** A gear: a ring with square teeth round it, turned by `turn` */
function gear(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  teeth: number,
  turn: number,
  color: string,
  alpha: number,
  scale: number,
): void {
  const steps = teeth * 4;

  context.beginPath();
  for (let step = 0; step <= steps; step += 1) {
    const angle = turn + (step / steps) * Math.PI * 2;
    // Two points out on a tooth and two back in the gap after it
    const out = step % 4 < 2 ? radius * 1.22 : radius;

    context[step === 0 ? 'moveTo' : 'lineTo'](x + Math.cos(angle) * out, y + Math.sin(angle) * out);
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = 2.6 * scale;
  context.stroke();
  ring(context, [x, y], radius * 0.4, { color, alpha, width: 2 * scale });
}

/** The Unova moves with a picture of their own */
const unova = {
  // Shards of psychic force hanging round it, then driven in together
  Converge(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);
    const count = many(6, weight);
    const drive = Math.min(1, Math.max(0, (share - CONVERGE_HOLD) / CONVERGE_DRIVE));

    if (drive < 1) {
      for (let shard = 0; shard < count; shard += 1) {
        const angle = (shard / count) * Math.PI * 2 + noise(seed, shard) * 0.3 + share * 0.8;
        const out = size * (2.2 - drive * 1.9);

        edge(
          context,
          [
            at[0] + Math.cos(angle) * (out + size * 0.7),
            at[1] + Math.sin(angle) * (out + size * 0.7) * 0.8,
          ],
          [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
          size * 0.16,
          0,
          { color: light, alpha: Math.min(1, share / 0.15) },
        );
      }
      return;
    }
    const hit = (share - CONVERGE_HOLD - CONVERGE_DRIVE) / (1 - CONVERGE_HOLD - CONVERGE_DRIVE);

    orb(context, at, size * (0.5 + hit), { ...paint, alpha: decay(hit) });
    burst(context, at, size * (1 + hit * 1.4), count * 2, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    ring(context, at, size * (0.4 + hit * 1.8), {
      color: light,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // Waves pulsing out of it and out of the pokemon that used it in step, with a line shaking between them
  Resonance(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const shown = showing(share, 5, 0.75);
    const dx = at[0] - stage.source[0];
    const dy = at[1] - stage.source[1];
    const length = Math.max(1, Math.hypot(dx, dy));

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const held = (share * 1.5 + pulse / 3) % 1;

      ring(context, at, size * (0.4 + held * 2), {
        color: light,
        alpha: decay(held) * shown,
        width: 2.4 * stage.scale,
      });
      ring(context, stage.source, size * (0.4 + held * 1.2), {
        color: light,
        alpha: decay(held) * shown * 0.5,
        width: 2 * stage.scale,
      });
    }
    context.beginPath();
    for (let step = 0; step <= 24; step += 1) {
      const along = step / 24;
      const [x, y] = between(stage.source, at, along);
      const wave =
        Math.sin(along * Math.PI * 8 - share * Math.PI * 6) *
        Math.sin(along * Math.PI) *
        size *
        0.3;

      context[step === 0 ? 'moveTo' : 'lineTo'](x - (dy / length) * wave, y + (dx / length) * wave);
    }
    context.strokeStyle = fade(paint.color, shown * 0.8);
    context.lineWidth = 2 * stage.scale;
    context.stroke();
  },

  // Orbs of stored power circling it, closing in and bursting together
  Orbit(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);

    if (share < ORBIT_CLOSE) {
      const round = size * 1.6 * (1 - settle(share / ORBIT_CLOSE));
      const alpha = Math.min(1, share * 5);

      for (let one = 0; one < ORBIT_ORBS; one += 1) {
        const angle = (one / ORBIT_ORBS) * Math.PI * 2 + share * Math.PI * 4;
        const spot: Point = [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(angle) * round * 0.4,
        ];

        orb(context, spot, size * 0.25, { ...paint, alpha });
        star(context, spot, size * 0.2, share * 6 + one, { color: '#ffffff', alpha: alpha * 0.8 });
      }
      return;
    }
    const hit = (share - ORBIT_CLOSE) / (1 - ORBIT_CLOSE);

    orb(context, at, size * (0.6 + hit * 0.8), { ...paint, alpha: decay(hit) });
    ring(context, at, size * (0.5 + hit * 1.6), {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    burst(context, at, size * (1 + hit * 1.2), 10, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // The pokemon that used it flaring as it throws everything in, and one blow that lands with all of it
  Gambit(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const flare = share < 0.25 ? share / 0.25 : decay((share - 0.25) / 0.75);

    orb(context, stage.source, size * (0.8 + flare * 0.6), { color: light, alpha: flare * 0.8 });
    if (share < GAMBIT_LANDS) {
      const rush = Math.max(0, (share - 0.15) / (GAMBIT_LANDS - 0.15));

      if (rush > 0) {
        edge(context, stage.source, between(stage.source, at, rush), size * 0.3, 0, {
          color: light,
          alpha: 0.9,
        });
      }
      return;
    }
    const hit = (share - GAMBIT_LANDS) / (1 - GAMBIT_LANDS);

    orb(context, at, size * (0.8 + hit * 1.4), { color: light, alpha: decay(hit) });
    burst(context, at, size * (1.4 + hit * 1.6), 14, seed, {
      ...paint,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    for (let wave = 0; wave < 2; wave += 1) {
      ring(context, at, size * (0.6 + hit * (2 + wave)), {
        color: light,
        alpha: decay(hit) * (1 - wave * 0.4),
        width: 3 * stage.scale,
      });
    }
  },

  // Tiny bugs zigzagging in on it and nipping where they land
  Buzz(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const angle = Math.atan2(at[1] - stage.source[1], at[0] - stage.source[0]);

    ring(context, at, size * (0.8 + swell(share) * 0.4), {
      color: light,
      alpha: swell(share) * 0.4,
      width: 1.6 * stage.scale,
    });
    for (let bug = 0; bug < many(8, weight); bug += 1) {
      const flying = share * 1.5 - noise(seed, bug) * 0.5;

      if (flying <= 0) {
        continue;
      }
      const end: Point = [
        at[0] + spread(seed, bug + 10) * size * 0.8,
        at[1] + spread(seed, bug + 20) * size * 0.7,
      ];

      if (flying < 1) {
        const [x, y] = between(stage.source, end, flying);
        const sway = Math.sin(flying * Math.PI * 6 + bug) * size * 0.4 * (1 - flying);

        orb(context, [x - Math.sin(angle) * sway, y + Math.cos(angle) * sway], size * 0.12, {
          color: light,
          alpha: 1,
        });
        continue;
      }
      const nip = (flying - 1) / 0.5;

      if (nip < 1) {
        burst(context, end, size * (0.3 + nip * 0.4), 4, seed + bug, {
          color: light,
          alpha: decay(nip),
          width: 1.8 * stage.scale,
        });
      }
    }
  },

  // Plasma gathered in turning hexagons on the caster, a hard beam with rings running down it, and hexagons ringing off the hit
  Techno(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const flick = Math.floor(share * 14);

    if (share < TECHNO_FIRES) {
      const charge = share / TECHNO_FIRES;

      orb(context, stage.source, size * (0.4 + charge * 0.8), { ...paint, alpha: charge * 0.8 });
      polygon(
        context,
        stage.source,
        size * (1.6 - charge * 0.8),
        6,
        share * 6,
        light,
        charge,
        2.4 * stage.scale,
      );
      polygon(
        context,
        stage.source,
        size * (1.1 - charge * 0.5),
        6,
        -share * 8,
        light,
        charge,
        2 * stage.scale,
      );
      return;
    }
    if (share < TECHNO_HITS + 0.12) {
      const drawn = Math.min(1, (share - TECHNO_FIRES) / (TECHNO_HITS - TECHNO_FIRES));
      const kept = share < TECHNO_HITS ? 1 : decay((share - TECHNO_HITS) / 0.12);

      beam(context, stage.source, at, drawn, size * 0.9, { ...paint, alpha: kept });
      for (let band = 0; band < 3; band += 1) {
        const along = ((share * 4 + band / 3) % 1) * drawn;

        polygon(
          context,
          between(stage.source, at, along),
          size * 0.6,
          6,
          share * 6 + band,
          light,
          kept * 0.8,
          2 * stage.scale,
        );
      }
    }
    if (share < TECHNO_HITS) {
      return;
    }
    const hit = (share - TECHNO_HITS) / (1 - TECHNO_HITS);

    orb(context, at, size * (0.9 + hit * 1.4), { color: light, alpha: decay(hit) });
    star(context, at, size * (1.4 + hit * 1.6), 0, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2.5)),
    });
    for (let band = 0; band < 3; band += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - band * 0.2));

      if (held > 0) {
        polygon(
          context,
          at,
          size * (0.6 + held * 2.6),
          6,
          band * 0.5 + share,
          light,
          decay(held),
          3 * stage.scale,
        );
      }
    }
    burst(context, at, size * (1.4 + hit * 1.4), 12, seed + flick, {
      ...paint,
      alpha: decay(hit) * (flick % 2 === 0 ? 1 : 0.5),
      width: 2.4 * stage.scale,
    });
  },

  // Wreathed in fire, then a great burning V driven down onto it and the ground going up in flames
  Victory(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = mix(paint.color, '#ffd84a', 0.6);
    const foot = at[1] + size * 0.9;

    if (share < VICTORY_RISES) {
      const up = share / VICTORY_RISES;

      orb(context, stage.source, size * (0.6 + up * 1.2), { ...paint, alpha: up * 0.7 });
      orb(context, stage.source, size * 0.6 * up, { color: hot, alpha: up });
      return;
    }
    const fall = Math.min(1, (share - VICTORY_RISES) / (VICTORY_LANDS - VICTORY_RISES));
    const point: Point = [at[0], at[1] - size * 5 * (1 - fall) ** 2];
    const kept = late(share, VICTORY_LANDS);

    for (const side of [-1, 1]) {
      const arm: Point = [point[0] + side * size * 2.2, point[1] - size * 3];

      edge(context, arm, point, size * 0.55, 0, { ...paint, alpha: kept });
      edge(context, arm, point, size * 0.2, 0, { color: hot, alpha: kept });
    }
    if (share < VICTORY_LANDS) {
      return;
    }
    const hit = (share - VICTORY_LANDS) / (1 - VICTORY_LANDS);

    orb(context, at, size * (1.2 + hit * 2), { color: hot, alpha: decay(Math.min(1, hit * 1.3)) });
    star(context, at, size * (1.8 + hit * 2.4), 0, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 3)),
    });
    ring(context, at, size * (0.6 + hit * 3), {
      color: hot,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    ripple(context, [at[0], foot], size * (0.8 + hit * 3), {
      ...paint,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    for (let one = 0; one < 5; one += 1) {
      const base: Point = [at[0] + (one / 4 - 0.5) * size * 3.2, foot];

      beam(
        context,
        base,
        [base[0], base[1] - size * (2.4 + noise(seed, one + 10) * 2)],
        Math.min(1, hit * 3),
        size * 0.4 * decay(hit),
        { ...paint, alpha: decay(hit) },
      );
    }
    burst(context, at, size * (1.6 + hit * 1.8), 16, seed, {
      color: hot,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    imbue(context, at, size * 1.6, hit, seed, paint, Types.Fire, stage.scale);
  },

  // Blue fire gathered on the caster, flung onto it, and a twisting column of it standing up white at the heart
  Azure(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const core = lighten(paint.color, 0.7);
    const foot = at[1] + size * 0.9;

    if (share < AZURE_FLIES) {
      const charge = share / AZURE_FLIES;

      orb(context, stage.source, size * (0.4 + charge), { ...paint, alpha: charge * 0.8 });
      orb(context, stage.source, size * 0.5 * charge, { color: core, alpha: charge });
      return;
    }
    if (share < AZURE_HITS) {
      const flight = (share - AZURE_FLIES) / (AZURE_HITS - AZURE_FLIES);
      const ball = between(stage.source, at, flight);
      const lifted: Point = [ball[0], ball[1] - Math.sin(Math.PI * flight) * size * 1.5];

      orb(context, lifted, size * 1.2, { ...paint, alpha: 0.7 });
      orb(context, lifted, size * 0.6, { color: core, alpha: 1 });
      return;
    }
    const burn = (share - AZURE_HITS) / (1 - AZURE_HITS);
    const kept = late(burn, 0.55);
    const tall = size * 6 * Math.min(1, burn * 4);

    beam(context, [at[0], foot], [at[0], foot - tall], 1, size * 1.6 * kept, {
      ...paint,
      alpha: kept,
    });
    orb(context, at, size * (1 + swell(burn)), { color: core, alpha: kept * 0.9 });
    for (let lick = 0; lick < many(12, weight); lick += 1) {
      const rise = (share * 1.8 + noise(seed, lick)) % 1;

      orb(
        context,
        [at[0] + spread(seed, lick + 5) * size * 1.4 * (1 - rise * 0.5), foot - rise * tall],
        size * 0.4 * (1 - rise * 0.6),
        { color: rise < 0.35 ? core : paint.color, alpha: swell(rise) * kept },
      );
    }
    ring(context, at, size * (0.6 + burn * 3), {
      color: core,
      alpha: decay(burn),
      width: 3 * stage.scale,
    });
    ripple(context, [at[0], foot], size * (0.8 + burn * 3), {
      ...paint,
      alpha: decay(burn) * 0.8,
      width: 3 * stage.scale,
    });
  },

  // Bolts coming down on it from every side at once, and a dark shock ring off the hit
  Thunderclap(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const flick = Math.floor(share * 14);
    const bright = decay(share) * (flick % 3 === 2 ? 0.5 : 1);

    for (let one = 0; one < 4; one += 1) {
      const angle = -Math.PI / 2 + (one - 1.5) * 0.45;

      bolt(
        context,
        [at[0] + Math.cos(angle) * size * 7, at[1] + Math.sin(angle) * size * 7],
        at,
        seed + flick * 7 + one,
        { ...paint, alpha: bright, width: 3.4 * stage.scale },
      );
    }
    orb(context, at, size * (0.6 + swell(share) * 0.6), {
      color: lighten(paint.color, 0.6),
      alpha: bright,
    });
    ring(context, at, size * (0.5 + share * 2.4), {
      color: mix(paint.color, '#1a2a6a', 0.5),
      alpha: decay(share),
      width: 4 * stage.scale,
    });
    ripple(context, at, size * (0.5 + share * 2.4), {
      ...paint,
      alpha: decay(share) * 0.7,
      width: 2.6 * stage.scale,
    });
  },

  // A great ball of fire or lightning dropping out of the sky with a ring round it, and breaking open over the ground
  Fusion(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const foot = at[1] + size * 0.9;

    if (share < FUSION_LANDS) {
      const fall = share / FUSION_LANDS;
      const place = (along: number): Point => [
        at[0] + size * 2 * (1 - along),
        at[1] - size * 8 * (1 - along),
      ];
      const ball = place(fall);

      edge(context, place(Math.max(0, fall - 0.4)), ball, size * 1.2, 0, { ...paint, alpha: 0.5 });
      orb(context, ball, size * 1.4, { ...paint, alpha: 1 });
      orb(context, ball, size * 0.7, { color: light, alpha: 1 });
      hoop(context, ball, size * 1.2, 0.35, share * 8, {
        color: light,
        alpha: 0.8,
        width: 2.4 * stage.scale,
      });
      return;
    }
    const hit = (share - FUSION_LANDS) / (1 - FUSION_LANDS);
    const flick = Math.floor(share * 14);

    orb(context, at, size * (1.2 + hit * 1.8), {
      color: light,
      alpha: decay(Math.min(1, hit * 1.4)),
    });
    star(context, at, size * (1.6 + hit * 2.4), hit, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2.5)),
    });
    ring(context, at, size * (0.6 + hit * 3), {
      ...paint,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    ripple(context, [at[0], foot], size * (0.8 + hit * 3), {
      color: light,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    for (let one = 0; one < 5; one += 1) {
      const angle = (one / 5) * Math.PI * 2 + noise(seed, one) * 0.5;

      if (type === Types.Electric) {
        bolt(
          context,
          at,
          [at[0] + Math.cos(angle) * size * 3, foot + Math.sin(angle) * size * 0.8],
          seed + flick * 7 + one,
          { ...paint, alpha: decay(hit) * (flick % 3 === 2 ? 0.5 : 1), width: 2.6 * stage.scale },
        );
        continue;
      }
      const base: Point = [
        at[0] + Math.cos(angle) * size * 1.6,
        foot + Math.sin(angle) * size * 0.5,
      ];

      beam(
        context,
        base,
        [base[0], base[1] - size * (2.2 + noise(seed, one + 10) * 1.8)],
        Math.min(1, hit * 3),
        size * 0.36 * decay(hit),
        { ...paint, alpha: decay(hit) },
      );
    }
    imbue(context, at, size * 1.6, hit, seed, paint, type, stage.scale);
  },

  // A crown of ice bursting up round it, lightning coming down through it, and the ice shattering
  Frostbolt(context, stage, share, { paint, seed, weight }) {
    frozen(context, stage, share, paint.color, seed, weight, Types.Electric, KYUREM_SPARK);
  },

  // A crown of ice bursting up round it, fire pouring up between the spikes, and the ice shattering
  Frostfire(context, stage, share, { paint, seed, weight }) {
    frozen(context, stage, share, paint.color, seed, weight, Types.Fire, KYUREM_FIRE);
  },

  // Frost racing across the ground, spikes of ice rising round it in a freezing wind, then breaking off
  Glaze(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const reached = settle(share * 2);
    const broken = Math.max(0, (share - 0.75) / 0.25);
    const kept = Math.min(1, share * 20) * decay(broken);
    const light = lighten(paint.color, 0.5);

    for (let band = 0; band < 3; band += 1) {
      ripple(context, foot, size * (0.6 + reached * (1.6 + band * 0.7)), {
        color: light,
        alpha: kept * (0.8 - band * 0.2),
        width: 2.4 * stage.scale,
      });
    }
    iceSpikes(context, at, size * 0.8, settle(Math.max(0, share - 0.15) * 3), seed, light, kept);
    for (let crystal = 0; crystal < many(10, weight); crystal += 1) {
      const angle = noise(seed, crystal) * Math.PI * 2;
      const out = size * (0.4 + noise(seed, crystal + 10) * 2) * reached;

      star(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34],
        size * 0.22,
        angle,
        { color: '#ffffff', alpha: kept * swell((share * 2 + noise(seed, crystal + 20)) % 1) },
      );
    }
    for (let gust = 0; gust < 10; gust += 1) {
      const held = (share * 2 + noise(seed, gust + 30)) % 1;
      const x = at[0] - size * 3 + held * size * 6;
      const y = at[1] + spread(seed, gust + 40) * size * 1.4;

      edge(context, [x - size * 0.8, y], [x + size * 0.8, y], size * 0.08, 0, {
        color: '#ffffff',
        alpha: swell(held) * kept * 0.7,
      });
    }
    if (broken > 0) {
      shards(context, at, size * 2.4, many(12, weight), seed, broken, {
        color: light,
        alpha: decay(broken),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Fireballs flung out of the pokemon that used it, bursting on it one after another
  Searing(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = mix(paint.color, '#ffd84a', 0.6);

    for (let ball = 0; ball < 3; ball += 1) {
      const flight = share * 2.5 - ball * 0.25;

      if (flight <= 0) {
        continue;
      }
      if (flight < 1) {
        const [x, y] = between(stage.source, at, flight);
        const arc = Math.sin(Math.PI * flight);

        orb(
          context,
          [x + (ball - 1) * size * 0.8 * arc, y - arc * size * (1.5 + ball)],
          size * 0.4,
          {
            color: hot,
            alpha: 1,
          },
        );
        continue;
      }
      const hit = (flight - 1) / 1.2;

      if (hit >= 1) {
        continue;
      }
      const spot: Point = [
        at[0] + (ball - 1) * size * 0.6,
        at[1] + spread(seed, ball) * size * 0.4,
      ];

      orb(context, spot, size * (0.4 + hit * 0.8), { ...paint, alpha: decay(hit) });
      imbue(context, spot, size * 0.8, hit, seed + ball, paint, Types.Fire, stage.scale);
    }
  },

  // Three great swords falling point first round it, the middle one through it, and the light of the strike left standing
  Smite(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const kept = late(share, 0.65);
    const foot = at[1] + size * 0.9;

    for (const [right, away, scale, lands] of SMITE_BLADES) {
      const drop = Math.min(1, share / lands);
      // Further away is higher up the picture
      const base: Point = [at[0] + right * size, foot - away * size * 0.35];
      const tip: Point = [base[0], base[1] - size * 9 * (1 - drop) ** 2 + size * 0.3 * drop];
      const hilt: Point = [tip[0], tip[1] - size * 3 * scale];

      orb(context, between(hilt, tip, 0.5), size * 1.2 * scale, { ...paint, alpha: kept * 0.3 });
      edge(context, hilt, tip, size * 0.32 * scale, 0, { ...paint, alpha: kept });
      edge(context, hilt, tip, size * 0.12 * scale, 0, { color: '#ffffff', alpha: kept });
      edge(
        context,
        [hilt[0] - size * 0.7 * scale, hilt[1] + size * 0.4 * scale],
        [hilt[0] + size * 0.7 * scale, hilt[1] + size * 0.4 * scale],
        size * 0.12 * scale,
        0,
        { color: light, alpha: kept },
      );
      if (drop >= 1) {
        const land = (share - lands) / (1 - lands);

        ripple(context, base, size * (0.3 + land * 1.6) * scale, {
          color: light,
          alpha: decay(land),
          width: 2.4 * stage.scale,
        });
      }
    }
    if (share < SMITE_LANDS) {
      return;
    }
    const hit = (share - SMITE_LANDS) / (1 - SMITE_LANDS);

    orb(context, at, size * (1 + hit * 1.6), {
      color: light,
      alpha: decay(Math.min(1, hit * 1.3)),
    });
    star(context, at, size * (1.6 + hit * 2), 0, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2.5)),
    });
    ring(context, at, size * (0.6 + hit * 3), {
      color: light,
      alpha: decay(hit),
      width: 2.8 * stage.scale,
    });
    burst(context, at, size * (1.4 + hit * 1.6), 12, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
  },

  // Notes spiralling up round it through rings in a song's colours
  Aria(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.8);

    for (let wave = 0; wave < ARIA_TONES.length; wave += 1) {
      const held = (share * 1.2 + wave / ARIA_TONES.length) % 1;

      hoop(
        context,
        [at[0], at[1] + size * 0.6 - held * size * 2.4],
        size * (1.4 - held * 0.6),
        0.3,
        0,
        { color: ARIA_TONES[wave], alpha: swell(held) * shown, width: 2 * stage.scale },
      );
    }
    for (let one = 0; one < many(8, weight); one += 1) {
      const held = (share * 1.2 + noise(seed, one)) % 1;
      const angle = held * Math.PI * 4 + one;
      const round = size * (1.3 - held * 0.5);

      note(
        context,
        [at[0] + Math.cos(angle) * round, at[1] + size * 0.6 - held * size * 2.6],
        size * 0.35,
        ARIA_TONES[one % ARIA_TONES.length],
        swell(held) * shown,
        stage.scale,
      );
    }
  },

  // Glittering wings fluttering up round it in a spiral
  Flutter(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.8);

    for (let one = 0; one < many(6, weight); one += 1) {
      const held = (share * 1.3 + noise(seed, one)) % 1;
      const angle = held * Math.PI * 4 + one * 1.3;
      const round = size * (1.2 - held * 0.4);
      const x = at[0] + Math.cos(angle) * round;
      const y = at[1] + size * 0.7 - held * size * 2.4;
      // Wings opening and closing, so the pair reads as a flutter rather than two leaves
      const beat = Math.abs(Math.sin(share * Math.PI * 10 + one));

      for (const side of [-1, 1]) {
        petal(context, [x + side * size * 0.15 * beat, y], size * 0.22, side * (0.4 + beat * 0.8), {
          ...paint,
          alpha: swell(held) * shown,
        });
      }
    }
    motes(context, at, size * 1.4, 8, seed, share, {
      color: lighten(paint.color, 0.6),
      alpha: shown,
      width: 1.8 * stage.scale,
    });
  },

  // Its shell straining and cracking, then bursting off in pieces with the light under it shining out
  Smash(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const light = lighten(paint.color, 0.5);

    if (share < SMASH_BREAKS) {
      const strain = share / SMASH_BREAKS;
      const shake = Math.sin(strain * Math.PI * 12) * size * 0.04 * strain;

      for (const side of [-1, 1]) {
        sickle(
          context,
          [at[0] + shake, at[1]],
          size * 1.2,
          Math.PI / 2,
          Math.PI / 2 - side * Math.PI,
          size * 0.45,
          { ...paint, alpha: 0.9 },
        );
      }
      edge(
        context,
        [at[0], at[1] - size * 1.2],
        [at[0] + size * 0.3 * strain, at[1] - size * (1.2 - 0.8 * strain)],
        size * 0.05,
        0,
        { color: '#2a2018', alpha: strain },
      );
      return;
    }
    const broken = (share - SMASH_BREAKS) / (1 - SMASH_BREAKS);

    orb(context, at, size * (0.8 + broken * 0.8), { color: light, alpha: decay(broken) });
    shards(context, at, size * 2.4, 10, seed, broken, {
      ...paint,
      alpha: decay(broken),
      width: size * 0.18,
    });
    ring(context, at, size * (0.8 + broken * 1.6), {
      color: light,
      alpha: decay(broken),
      width: 2.6 * stage.scale,
    });
  },

  // Two gears meshing over it, turning faster as they go
  Gears(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 5, 0.8);
    const turn = share * share * Math.PI * 6;

    orb(context, at, size * 1.1, { ...paint, alpha: shown * 0.3 });
    gear(
      context,
      [at[0] - size * 0.55, at[1] - size * 0.3],
      size * 0.7,
      8,
      turn,
      lighten(paint.color, 0.3),
      shown,
      stage.scale,
    );
    gear(
      context,
      [at[0] + size * 0.55, at[1] + size * 0.35],
      size * 0.5,
      6,
      0.3 - turn * 1.4,
      lighten(paint.color, 0.5),
      shown,
      stage.scale,
    );
  },

  // A spiral winding up round its body and drawing tight
  Windup(context, stage, share, { paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const shown = showing(share, 4, 0.8);
    const round = size * (1.4 - settle(share * 1.5) * 0.5);

    context.beginPath();
    for (let step = 0; step <= 48; step += 1) {
      const along = step / 48;
      const angle = along * Math.PI * 6 + share * Math.PI * 2;

      context[step === 0 ? 'moveTo' : 'lineTo'](
        at[0] + Math.cos(angle) * round,
        at[1] + size * 0.9 - along * size * 2.2 + Math.sin(angle) * round * 0.25,
      );
    }
    context.strokeStyle = fade(lighten(paint.color, 0.3), shown);
    context.lineWidth = 3 * stage.scale;
    context.stroke();
    if (share > 0.6) {
      orb(context, at, size * 0.7, { ...paint, alpha: swell((share - 0.6) / 0.4) * 0.6 });
    }
  },

  // Pieces of its body dropping away, and it streaking off lighter
  Shed(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const light = lighten(paint.color, 0.5);

    orb(context, at, size * 0.9, { ...paint, alpha: swell(share) * 0.3 });
    for (let piece = 0; piece < 8; piece += 1) {
      const held = Math.min(1, share * 1.5 - noise(seed, piece) * 0.4);

      if (held <= 0) {
        continue;
      }
      const x = at[0] + spread(seed, piece + 10) * size * 0.8;
      const y = at[1] + spread(seed, piece + 20) * size * 0.6 + held * held * size * 2.2;
      const turn = held * 6 + piece;

      edge(
        context,
        [x, y],
        [x + Math.cos(turn) * size * 0.3, y + Math.sin(turn) * size * 0.3],
        size * 0.12,
        0,
        { ...paint, alpha: decay(held) },
      );
    }
    if (share < 0.4) {
      return;
    }
    const fast = Math.min(1, (share - 0.4) * 4) * decay((share - 0.4) / 0.6);

    for (let line = 0; line < 4; line += 1) {
      const held = (share * 3 + noise(seed, line + 30)) % 1;
      const x = at[0] - size * 1.6 + held * size * 3.2;
      const y = at[1] + spread(seed, line + 40) * size;

      edge(context, [x - size * 0.9, y], [x, y], size * 0.05, 0, {
        color: light,
        alpha: fast * swell(held),
      });
    }
  },

  // A shadow spreading under it as something heavy comes down, then the ground giving way
  Tonnage(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];

    if (share < TONNAGE_LANDS) {
      const near = share / TONNAGE_LANDS;

      context.beginPath();
      context.ellipse(
        foot[0],
        foot[1],
        size * (0.6 + near * 1.2),
        size * (0.2 + near * 0.4),
        0,
        0,
        Math.PI * 2,
      );
      context.fillStyle = fade('#140c08', near * 0.5);
      context.fill();
      return;
    }
    const hit = (share - TONNAGE_LANDS) / (1 - TONNAGE_LANDS);

    for (let wave = 0; wave < 2; wave += 1) {
      ripple(context, foot, size * (0.6 + hit * (2.4 + wave)), {
        ...paint,
        alpha: decay(hit) * (1 - wave * 0.4),
        width: 4 * stage.scale,
      });
    }
    for (let crack = 0; crack < 6; crack += 1) {
      const angle = (crack / 6) * Math.PI * 2 + noise(seed, crack);
      const length = size * (0.8 + noise(seed, crack + 10) * 0.8) * Math.min(1, hit * 4);

      edge(
        context,
        foot,
        [foot[0] + Math.cos(angle) * length, foot[1] + Math.sin(angle) * length * 0.34],
        size * 0.07,
        0,
        { color: '#2a1a10', alpha: decay(hit) },
      );
    }
    motes(context, foot, size * 2, 10, seed, hit, {
      color: mix(paint.color, '#b9a58a', 0.6),
      alpha: decay(hit) * 0.8,
      width: 2.4 * stage.scale,
    });
    imbue(context, at, size, hit, seed, paint, type, stage.scale);
  },

  // A column of its element bursting up out of the ground under it: fire, a geyser, or a whirl of leaves
  Pledge(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const shown = showing(share, 6, 0.7);
    const height = size * 3.6 * settle(share * 3);
    const light = lighten(paint.color, 0.5);

    ripple(context, foot, size * (1 + swell(share) * 0.6), {
      ...paint,
      alpha: shown * 0.7,
      width: 3 * stage.scale,
    });
    edge(context, foot, [foot[0], foot[1] - height], size * 0.9, 0, {
      ...paint,
      alpha: shown * 0.35,
    });
    for (let piece = 0; piece < many(10, weight); piece += 1) {
      const rise = (share * 1.8 + noise(seed, piece)) % 1;
      const x = foot[0] + spread(seed, piece + 10) * size * 0.7;
      const y = foot[1] - rise * height;
      const alpha = swell(rise) * shown;

      if (type === Types.Fire) {
        orb(context, [x, y], size * 0.35 * (1 - rise * 0.5), {
          color: rise < 0.4 ? light : paint.color,
          alpha,
        });
      } else if (type === Types.Water) {
        bubble(context, [x, y], size * 0.2 * (0.6 + noise(seed, piece + 20)), {
          color: light,
          alpha,
          width: 1.6 * stage.scale,
        });
      } else {
        const turn = rise * Math.PI * 4 + piece;

        petal(context, [foot[0] + Math.cos(turn) * size * 0.7, y], size * 0.25, turn, {
          ...paint,
          alpha,
        });
      }
    }
  },

  // Quick strikes swooping in on loops, from one side and then the other
  Aerial(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);

    for (let pass = 0; pass < 3; pass += 1) {
      const held = share * 3 - pass;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const side = pass % 2 === 0 ? -1 : 1;
      const swoop = Math.min(1, held * 2);
      const centre: Point = [at[0] + side * size * 0.8, at[1] - size * 0.8];
      const radius = size * 1.13;
      // Round a circle that ends on it, so the loop comes down onto the target
      const end = Math.atan2(size * 0.8, -side * size * 0.8);
      const start = end - side * Math.PI * 1.4;

      context.beginPath();
      for (let step = 0; step <= 12; step += 1) {
        const angle = start + (end - start) * (step / 12) * swoop;

        context[step === 0 ? 'moveTo' : 'lineTo'](
          centre[0] + Math.cos(angle) * radius,
          centre[1] + Math.sin(angle) * radius,
        );
      }
      context.strokeStyle = fade(light, decay(held));
      context.lineWidth = 3 * stage.scale;
      context.stroke();
      if (swoop < 1) {
        continue;
      }
      const hit = (held - 0.5) / 0.5;

      burst(context, at, size * (0.4 + hit * 0.6), 5, seed + pass, {
        color: light,
        alpha: decay(hit),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Dropped from high above: wind streaking down past it, then the ground slammed
  Plummet(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const light = lighten(paint.color, 0.5);

    if (share < PLUMMET_LANDS) {
      const fall = share / PLUMMET_LANDS;

      for (let line = 0; line < 5; line += 1) {
        const x = at[0] + (line - 2) * size * 0.45;
        const y = at[1] - size * 4 * (1 - fall) - noise(seed, line) * size * 0.6;

        edge(context, [x, y - size * 1.6], [x, y], size * 0.05, 0, { color: light, alpha: fall });
      }
      return;
    }
    const hit = (share - PLUMMET_LANDS) / (1 - PLUMMET_LANDS);

    for (let wave = 0; wave < 2; wave += 1) {
      ripple(context, foot, size * (0.6 + hit * (2 + wave)), {
        ...paint,
        alpha: decay(hit) * (1 - wave * 0.4),
        width: 3.4 * stage.scale,
      });
    }
    burst(context, at, size * (0.8 + hit), 8, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    motes(context, foot, size * 1.8, 10, seed, hit, {
      color: mix(paint.color, '#b9a58a', 0.6),
      alpha: decay(hit) * 0.8,
      width: 2.4 * stage.scale,
    });
  },

  // A great spiked wheel rolling in over it and pressing it into the ground
  Roller(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const roll = Math.min(1, share * 1.6);
    const centre = backToward(at, stage.source, size * 2.5 * (1 - roll));
    // Turning forward, toward whichever side it is rolling
    const turn = roll * Math.PI * 6 * (at[0] >= stage.source[0] ? 1 : -1);
    const kept = share < 0.7 ? 1 : decay((share - 0.7) / 0.3);
    const foot: Point = [at[0], at[1] + size * 0.9];

    ring(context, centre, size * 0.9, { ...paint, alpha: kept, width: 4 * stage.scale });
    for (let spike = 0; spike < 10; spike += 1) {
      const angle = turn + (spike / 10) * Math.PI * 2;

      edge(
        context,
        [centre[0] + Math.cos(angle) * size * 0.9, centre[1] + Math.sin(angle) * size * 0.9],
        [centre[0] + Math.cos(angle) * size * 1.3, centre[1] + Math.sin(angle) * size * 1.3],
        size * 0.12,
        0,
        { color: light, alpha: kept },
      );
    }
    if (roll < 1) {
      return;
    }
    const hit = (share * 1.6 - 1) / 0.6;

    ripple(context, foot, size * (0.8 + hit * 1.6), {
      ...paint,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    motes(context, foot, size * 1.6, 8, seed, hit, {
      ...paint,
      alpha: decay(hit) * 0.8,
      width: 2.2 * stage.scale,
    });
  },

  // Its own strength drawn out of it in a ring of light and turned back on it in a dark blow
  Turnabout(context, stage, share, { paint, seed }) {
    const at = landing(stage);
    const size = REACH * stage.scale;
    const dark = mix(paint.color, '#0a0610', 0.5);
    const light = lighten(paint.color, 0.6);

    if (share < TURN_BACK) {
      const pull = share / TURN_BACK;

      ring(context, at, size * (0.4 + pull * 1.2), {
        color: dark,
        alpha: pull * 0.8,
        width: 3 * stage.scale,
      });
      for (let mote = 0; mote < 8; mote += 1) {
        const angle = (mote / 8) * Math.PI * 2 + pull * Math.PI * 2;
        const out = size * (0.4 + pull * 1.2);

        orb(
          context,
          [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7],
          size * 0.14,
          { color: light, alpha: swell(pull) },
        );
      }
      return;
    }
    const hit = (share - TURN_BACK) / (1 - TURN_BACK);

    burst(context, at, size * (0.6 + hit * 1.2), 10, seed, {
      color: dark,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    ring(context, at, size * (1.6 - hit * 1.2), {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    star(context, at, size * 0.9 * decay(hit), hit, { color: light, alpha: decay(hit) });
  },

  // A horn driven into it, and green light flowing back out of it to the pokemon that used it
  Leech(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const stab = Math.min(1, share * 4);
    const drawing = Math.min(1, Math.max(0, (share - 0.2) * 5));

    edge(
      context,
      backToward(at, stage.source, size * (2.2 - stab * 0.8)),
      backToward(at, stage.source, size * (0.8 - stab * 0.8)),
      size * 0.22,
      0,
      { color: light, alpha: Math.max(0, 1 - share * 2) },
    );
    ring(context, at, size * (0.4 + share), {
      ...paint,
      alpha: decay(share),
      width: 2.4 * stage.scale,
    });
    for (let mote = 0; mote < many(6, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote) * 0.5) % 1;
      const [x, y] = between(at, stage.source, held);

      orb(context, [x, y - Math.sin(Math.PI * held) * size * 0.5], size * 0.12, {
        ...paint,
        alpha: swell(held) * drawing,
      });
    }
  },

  // Rushing in behind speed lines, a hard hit, and the jolt of it thrown back at the pokemon that rammed it
  Ram(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);
    const angle = Math.atan2(at[1] - stage.source[1], at[0] - stage.source[0]);

    if (share < RAM_HITS + 0.15) {
      const rush = Math.min(1, share / RAM_HITS);
      const front = backToward(at, stage.source, size * (3 - rush * 2.4));
      const tail = backToward(at, stage.source, size * (4.4 - rush * 2.4));
      const alpha = Math.max(0, 1 - Math.max(0, share - RAM_HITS) / 0.15);

      for (let line = 0; line < 5; line += 1) {
        const off = (line - 2) * size * 0.35;
        const across = -Math.sin(angle) * off;
        const down = Math.cos(angle) * off;

        edge(
          context,
          [tail[0] + across, tail[1] + down],
          [front[0] + across, front[1] + down],
          size * 0.05,
          0,
          { color: light, alpha },
        );
      }
    }
    if (share < RAM_HITS) {
      return;
    }
    const hit = (share - RAM_HITS) / (1 - RAM_HITS);

    star(context, at, size * (1 + hit) * decay(hit), 0, { color: '#ffffff', alpha: decay(hit) });
    burst(context, at, size * (1.2 + hit * 1.4), 12, seed, {
      ...paint,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    ring(context, at, size * (0.6 + hit * 1.8), {
      color: light,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    burst(
      context,
      backToward(at, stage.source, size * 1.2),
      size * (0.4 + hit * 0.6),
      5,
      seed + 1,
      {
        color: light,
        alpha: decay(hit),
        width: 2 * stage.scale,
      },
    );
  },

  // A ring of fire closing in on it and flaring up round it
  Blaze(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = mix(paint.color, '#ffd84a', 0.6);
    const close = settle(share * 2);
    const shown = showing(share, 6, 0.75);
    const base: Point = [at[0], at[1] + size * 0.6];
    const round = size * (2 - close * 1.3);
    const count = many(14, weight);

    ripple(context, base, round, { ...paint, alpha: shown * 0.7, width: 3 * stage.scale });
    if (close > 0.8) {
      orb(context, at, size * (0.8 + swell(share) * 0.6), { color: hot, alpha: shown * 0.6 });
    }
    for (let lick = 0; lick < count; lick += 1) {
      const angle = (lick / count) * Math.PI * 2 + share * Math.PI * 2;
      const rise = (share * 2 + noise(seed, lick)) % 1;

      orb(
        context,
        [
          base[0] + Math.cos(angle) * round,
          base[1] + Math.sin(angle) * round * 0.34 - rise * size * close * 2.2,
        ],
        size * 0.35 * (1 - rise * 0.5),
        { color: rise < 0.4 ? hot : paint.color, alpha: swell(rise) * shown },
      );
    }
  },

  // Flames swirling in on it like wings in a dance, and flaring as they all arrive
  Firedance(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = mix(paint.color, '#ffd84a', 0.6);
    const count = many(8, weight);
    const land = Math.max(0, (share - 0.6) / 0.4);

    for (let flame = 0; flame < count; flame += 1) {
      const held = share * 1.5 - (flame / count) * 0.5;

      if (held <= 0 || held >= 1) {
        continue;
      }
      const angle = flame * 2.3 + held * Math.PI * 3;
      const round = size * 2 * (1 - held);

      petal(
        context,
        [
          at[0] + Math.cos(angle) * round,
          at[1] + Math.sin(angle) * round * 0.6 - Math.sin(held * Math.PI) * size * 0.6,
        ],
        size * 0.35 * (1 - held * 0.4),
        angle * 2,
        { color: flame % 2 === 0 ? hot : paint.color, alpha: 1 },
      );
    }
    if (land > 0) {
      orb(context, at, size * (0.6 + land * 0.8), { color: hot, alpha: decay(land) });
      ring(context, at, size * (0.5 + land * 1.6), {
        ...paint,
        alpha: decay(land),
        width: 2.6 * stage.scale,
      });
    }
  },

  // A fireball bursting on it, flinging embers out to either side
  Spatter(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = mix(paint.color, '#ffd84a', 0.6);

    orb(context, at, size * (0.6 + share * 1.2), { color: hot, alpha: decay(share) });
    ring(context, at, size * (0.4 + share * 1.6), {
      ...paint,
      alpha: decay(share),
      width: 3 * stage.scale,
    });
    for (let ember = 0; ember < many(8, weight); ember += 1) {
      const side = ember % 2 === 0 ? -1 : 1;
      const out = size * (0.6 + noise(seed, ember) * 2.4) * share;
      const lift = Math.sin(share * Math.PI) * size * (0.6 + noise(seed, ember + 10) * 1.2);

      orb(
        context,
        [at[0] + side * out, at[1] - lift + share * size * 0.6],
        size * 0.18 * (1 - share * 0.5),
        { color: ember % 3 === 0 ? hot : paint.color, alpha: decay(share) },
      );
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default unova;
