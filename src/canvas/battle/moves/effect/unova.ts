import { Types } from '../../../../data/constants/types';
import type { Point } from '../../stage';
import {
  between,
  bolt,
  bubble,
  burst,
  decay,
  edge,
  fade,
  hoop,
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
import { imbue } from './contact';
import { note } from './minds';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { settle, showing } from './stats';

/** V-create, Fusion Flare and Bolt, and Sacred Sword: the share at which each lands */
export const VICTORY_LANDS = 0.35;
export const FUSION_LANDS = 0.3;
export const SMITE_LANDS = 0.3;

/** Shell Smash: the share the shell strains before it breaks; Heavy Slam: the share before the weight lands */
export const SMASH_BREAKS = 0.45;
export const TONNAGE_LANDS = 0.25;

/** Kyurem's other halves: Zekrom's spark on Freeze Shock and Reshiram's fire on Ice Burn */
export const KYUREM_SPARK = '#fac000';
export const KYUREM_FIRE = '#e62829';

/** Relic Song: Meloetta's green, and the gold and pink its notes come in */
export const ARIA_TONES = ['#8fe0b0', '#ffd27a', '#f0a8d0'];

/** Ice spikes standing up out of the ground round a point, `grow` from 0 to 1 */
function iceSpikes(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  grow: number,
  seed: number,
  color: string,
  alpha: number,
): void {
  for (let spike = 0; spike < 7; spike += 1) {
    const across = (spike / 6 - 0.5) * size * 2.6 + spread(seed, spike) * size * 0.15;
    const tall =
      size * (0.8 + noise(seed, spike + 10) * 0.9) * grow * (1 - Math.abs(spike / 6 - 0.5));

    edge(
      context,
      [x + across, y + size * 0.9],
      [x + across * 0.8, y + size * 0.9 - tall * 1.6],
      size * 0.2,
      0,
      { color, alpha },
    );
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

  // A shot of plasma: a hard line from the pokemon that fired it, and hexagons ringing out off the hit
  Techno(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const flick = Math.floor(share * 14);

    if (share < 0.35) {
      edge(
        context,
        stage.source,
        between(stage.source, at, Math.min(1, share / 0.2)),
        size * 0.18,
        0,
        { color: light, alpha: decay(share / 0.35) },
      );
    }
    orb(context, at, size * (0.5 + swell(share) * 0.5), { ...paint, alpha: decay(share) });
    for (let hex = 0; hex < 3; hex += 1) {
      const held = Math.max(0, Math.min(1, (share - 0.15 - hex * 0.12) / 0.6));

      if (held <= 0) {
        continue;
      }
      polygon(
        context,
        at,
        size * (0.5 + held * 2),
        6,
        hex * 0.5 + share,
        light,
        decay(held),
        2.4 * stage.scale,
      );
    }
    burst(context, at, size * 1.4, 6, seed + flick, {
      ...paint,
      alpha: decay(share) * (flick % 2 === 0 ? 1 : 0.4),
      width: 2 * stage.scale,
    });
  },

  // A V of fire driven down onto it, going off as it lands
  Victory(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hot = mix(paint.color, '#ffd84a', 0.6);
    const fall = Math.min(1, share / VICTORY_LANDS);
    const point: Point = [at[0], at[1] - size * 3 * (1 - fall) ** 2];
    const kept = share < VICTORY_LANDS ? 1 : decay((share - VICTORY_LANDS) / (1 - VICTORY_LANDS));

    for (const side of [-1, 1]) {
      const arm: Point = [point[0] + side * size * 1.3, point[1] - size * 1.8];

      edge(context, arm, point, size * 0.32, 0, { ...paint, alpha: kept });
      edge(context, arm, point, size * 0.12, 0, { color: hot, alpha: kept });
    }
    if (share < VICTORY_LANDS) {
      return;
    }
    const hit = (share - VICTORY_LANDS) / (1 - VICTORY_LANDS);

    orb(context, at, size * (0.8 + hit * 1.2), { color: hot, alpha: decay(hit) });
    burst(context, at, size * (1.4 + hit * 1.4), 12, seed, {
      ...paint,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    imbue(context, at, size * 1.2, hit, seed, paint, Types.Fire, stage.scale);
  },

  // Blue fire rising up round it in a column, white at the heart
  Azure(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = showing(share, 5, 0.7);
    const core = lighten(paint.color, 0.7);

    ripple(context, [at[0], at[1] + size * 0.9], size * (1.2 + swell(share) * 0.6), {
      ...paint,
      alpha: shown * 0.6,
      width: 3 * stage.scale,
    });
    orb(context, at, size * (0.8 + swell(share) * 0.8), { color: core, alpha: shown * 0.8 });
    for (let lick = 0; lick < many(12, weight); lick += 1) {
      const rise = (share * 1.8 + noise(seed, lick)) % 1;

      orb(
        context,
        [
          at[0] + spread(seed, lick + 5) * size * 1.2 * (1 - rise * 0.5),
          at[1] + size * 0.9 - rise * size * 3,
        ],
        size * 0.4 * (1 - rise * 0.6),
        { color: rise < 0.35 ? core : paint.color, alpha: swell(rise) * shown },
      );
    }
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

  // A ball of fire or lightning dropping out of the sky onto it and breaking open
  Fusion(context, stage, share, { paint, seed, weight, type }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);

    if (share < FUSION_LANDS) {
      const fall = share / FUSION_LANDS;
      const spot: Point = [at[0] + size * 1.5 * (1 - fall), at[1] - size * 6 * (1 - fall)];

      edge(context, [spot[0] + size * 0.85, spot[1] - size * 3.4], spot, size * 0.5, 0, {
        ...paint,
        alpha: 0.5,
      });
      orb(context, spot, size * 0.9, { ...paint, alpha: 1 });
      orb(context, spot, size * 0.45, { color: light, alpha: 1 });
      return;
    }
    const hit = (share - FUSION_LANDS) / (1 - FUSION_LANDS);

    orb(context, at, size * (1 + hit * 1.4), { color: light, alpha: decay(hit) });
    ring(context, at, size * (0.6 + hit * 2), {
      ...paint,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    imbue(context, at, size * 1.4, hit, seed, paint, type, stage.scale);
  },

  // Ice spikes breaking up round it, crackling with electricity
  Frostbolt(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const kept = showing(share, 20, 0.7);

    iceSpikes(context, at, size, settle(share * 3), seed, lighten(paint.color, 0.4), kept);
    imbue(context, at, size, share, seed, { color: KYUREM_SPARK }, Types.Electric, stage.scale);
  },

  // Ice spikes breaking up round it, with fire licking off them
  Frostfire(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const kept = showing(share, 20, 0.7);

    iceSpikes(context, at, size, settle(share * 3), seed, lighten(paint.color, 0.4), kept);
    imbue(context, at, size, share, seed, { color: KYUREM_FIRE }, Types.Fire, stage.scale);
  },

  // Frost spreading across the ground under it and freezing air blowing over
  Glaze(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const reached = settle(share * 2);
    const kept = showing(share, 20, 0.75);
    const light = lighten(paint.color, 0.5);

    for (let band = 0; band < 3; band += 1) {
      ripple(context, foot, size * (0.6 + reached * (1.4 + band * 0.6)), {
        color: light,
        alpha: kept * (0.8 - band * 0.2),
        width: 2.4 * stage.scale,
      });
    }
    for (let crystal = 0; crystal < many(8, weight); crystal += 1) {
      const angle = noise(seed, crystal) * Math.PI * 2;
      const out = size * (0.4 + noise(seed, crystal + 10) * 1.6) * reached;

      star(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34],
        size * 0.18,
        angle,
        { color: '#ffffff', alpha: kept * swell((share * 2 + noise(seed, crystal + 20)) % 1) },
      );
    }
    for (let flake = 0; flake < 10; flake += 1) {
      const held = (share * 1.5 + noise(seed, flake + 30)) % 1;

      orb(
        context,
        [at[0] - size * 2.5 + held * size * 5, at[1] + spread(seed, flake + 40) * size * 1.2],
        1.8 * stage.scale,
        { color: '#ffffff', alpha: swell(held) * kept },
      );
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

  // A great sword falling point first through it, and the light of the cut left standing
  Smite(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const drop = Math.min(1, share / SMITE_LANDS);
    const kept = share < SMITE_LANDS ? 1 : decay((share - SMITE_LANDS) / (1 - SMITE_LANDS));
    const tip: Point = [at[0], at[1] + size * (1 - 4 * (1 - drop) ** 2)];
    const hilt: Point = [tip[0], tip[1] - size * 3];

    edge(context, hilt, tip, size * 0.28, 0, { ...paint, alpha: kept });
    edge(context, hilt, tip, size * 0.1, 0, { color: light, alpha: kept });
    edge(
      context,
      [hilt[0] - size * 0.6, hilt[1] + size * 0.4],
      [hilt[0] + size * 0.6, hilt[1] + size * 0.4],
      size * 0.1,
      0,
      { color: light, alpha: kept },
    );
    if (share < SMITE_LANDS) {
      return;
    }
    const hit = (share - SMITE_LANDS) / (1 - SMITE_LANDS);

    ring(context, at, size * (0.4 + hit * 1.8), {
      color: light,
      alpha: decay(hit),
      width: 2.8 * stage.scale,
    });
    burst(context, at, size * (1 + hit * 1.2), 8, seed, {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    star(context, at, size * 0.8 * decay(hit), 0, { color: '#ffffff', alpha: decay(hit) });
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
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default unova;
