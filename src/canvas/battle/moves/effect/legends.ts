import type { Point } from '../../stage';
import {
  beam,
  between,
  burst,
  decay,
  edge,
  fade,
  funnel,
  heart,
  hoop,
  lash,
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
  spiral,
  spread,
  star,
  swell,
} from '../__paint';
import { backToward } from './contact';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Roar of Time: the share at which its rings stop spreading, and the share at which they break */
export const STALL_FREEZE = 0.35;
export const STALL_BREAK = 0.62;

/** The hues round Sacred Fire's edge, cycled so the band shimmers */
export const RAINBOW = ['#ff5a5a', '#ffb03a', '#ffe75a', '#6ee07a', '#5ab8ff', '#b77aff'];

/** How open Spacial Rend's tear is: it gapes after the cut and snaps shut near the end */
export function gapeOf(share: number): number {
  if (share < 0.7) {
    return Math.min(1, Math.max(0, (share - 0.1) / 0.4));
  }
  return Math.max(0, 1 - (share - 0.7) / 0.12);
}

/** Pieces of a broken ring, each thrown out from where it was on the ring */
function ringPieces(
  context: CanvasRenderingContext2D,
  at: Point,
  radius: number,
  count: number,
  seed: number,
  broken: number,
  color: string,
  scale: number,
): void {
  for (let piece = 0; piece < count; piece += 1) {
    const angle = (piece / count) * Math.PI * 2 + noise(seed, piece) * 0.3;

    shards(
      context,
      [at[0] + Math.cos(angle) * radius, at[1] + Math.sin(angle) * radius],
      REACH * scale * 0.5,
      1,
      seed + piece,
      broken,
      { color, alpha: decay(broken), width: 2.4 * scale },
    );
  }
}

/** Luster Purge: the share spent drawing light in before it flares */
export const LUSTRE_GATHER = 0.25;

/** Doom Desire: the share spent falling before the star goes off */
export const STARFALL_DROP = 0.35;

/** Crush Grip: the share spent closing before the hands squeeze */
export const GRIP_CLOSE = 0.45;

/** Psycho Boost: the share spent spiralling in before it blasts out */
export const SURGE_PULL = 0.4;

/** The red round Dark Void's sphere */
export const VOID_RIM = '#c8283c';

/** Hydro Cannon: the share spent flying in before it bursts */
export const CANNON_ARRIVE = 0.3;

/** Judgment: the share the wheel over it has opened by */
export const VERDICT_WHEEL = 0.3;

/** Seed Flare: the share the light has gathered under it by */
export const SEED_FLARES = 0.3;

/** Psystrike: the share the caster stops gathering, the share the shards start in, and how long that takes */
export const OVERLOAD_GATHER = 0.25;
export const OVERLOAD_HOLD = 0.45;
export const OVERLOAD_DRIVE = 0.1;

/** Aeroblast: the share the blast is loosed at */
export const JETSTREAM_FIRES = 0.2;

/** Secret Sword: each cut's swing round it as start and end angles, and the share they all go off */
export const RESOLUTE_CUTS: [from: number, to: number][] = [
  [2.6, 5.4],
  [0.6, -2.2],
  [Math.PI + 0.3, -0.3],
];
export const RESOLUTE_FINALE = 0.62;

/** A flat disc of colour. `orb` whitens its middle, which turns darkness grey */
function hole(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  color: string,
  alpha: number,
): void {
  context.beginPath();
  context.ellipse(x, y, Math.max(0.1, radius), Math.max(0.1, radius), 0, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A crescent with its bright side facing `turn` */
function crescent(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  // Two circles of the same radius, the second shifted back: what is left of the first is the crescent
  const shift = radius * 0.6;
  const inner = Math.acos(shift / (radius * 2));
  const outer = Math.PI - inner;

  context.beginPath();
  context.arc(x, y, radius, turn - outer, turn + outer);
  context.arc(
    x - Math.cos(turn) * shift,
    y - Math.sin(turn) * shift,
    radius,
    turn + inner,
    turn - inner,
    true,
  );
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** The legendary signature moves, each a picture of its own rather than a shared shape */
const legends = {
  // Time stopping: rings thrown out freeze where they are, like a clock face, then shatter
  Stall(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const grown = 1 - (1 - Math.min(1, share / STALL_FREEZE)) ** 3;
    const broken = Math.max(0, (share - STALL_BREAK) / (1 - STALL_BREAK));

    orb(context, at, size * (0.5 + grown * 0.6), {
      ...paint,
      alpha: broken > 0 ? decay(broken) * 0.6 : 0.5,
    });
    for (let band = 0; band < 3; band += 1) {
      const radius = size * (0.9 + band * 0.8) * grown;

      if (broken > 0) {
        ringPieces(
          context,
          at,
          radius,
          8 + band * 3,
          seed + band * 13,
          broken,
          paint.color,
          stage.scale,
        );
        continue;
      }
      ring(context, at, radius, { ...paint, alpha: 0.9, width: 2.4 * stage.scale });
    }
    if (broken > 0) {
      return;
    }
    const outer = size * 2.5 * grown;

    context.beginPath();
    for (let tick = 0; tick < 12; tick += 1) {
      const angle = (tick / 12) * Math.PI * 2;

      context.moveTo(
        at[0] + Math.cos(angle) * outer * 0.86,
        at[1] + Math.sin(angle) * outer * 0.86,
      );
      context.lineTo(at[0] + Math.cos(angle) * outer, at[1] + Math.sin(angle) * outer);
    }
    context.strokeStyle = fade(lighten(paint.color, 0.4), grown);
    context.lineWidth = 2 * stage.scale;
    context.stroke();
  },

  // Space warping round it, two tears opening across it onto the dark between the stars, then snapping shut in pieces
  Rend(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.4);
    const shown = share < 0.7 ? 1 : Math.min(1, decay(share) * 3);
    const tears: [from: Point, to: Point, drawn: number, gape: number][] = [
      [
        [at[0] - size * 2.2, at[1] - size * 1.5],
        [at[0] + size * 2.2, at[1] + size * 1.5],
        Math.min(1, share / 0.2),
        gapeOf(share),
      ],
      [
        [at[0] - size * 2, at[1] + size * 1.1],
        [at[0] + size * 2, at[1] - size * 1.1],
        Math.min(1, Math.max(0, (share - 0.2) / 0.15)),
        share < 0.7 ? Math.min(1, Math.max(0, (share - 0.3) / 0.35)) : gapeOf(share),
      ],
    ];

    for (let band = 0; band < 3; band += 1) {
      const held = (share * 2 + band / 3) % 1;

      hoop(context, at, size * (3 - held * 2.4), 0.45, band * 1.05 + share * 2, {
        color: light,
        alpha: swell(held) * shown * 0.7,
        width: 2 * stage.scale,
      });
    }
    orb(context, at, size * (1 + gapeOf(share) * 1.2), { ...paint, alpha: gapeOf(share) * 0.4 });
    for (const [index, [from, to, drawn, open]] of tears.entries()) {
      if (drawn <= 0) {
        continue;
      }
      const tip = between(from, to, drawn);

      edge(context, from, tip, size * (0.12 + open * 0.55), 0, { color: light, alpha: shown });
      edge(context, from, tip, size * open * 0.4, 0, { color: '#12061c', alpha: open });
      for (let glint = 0; glint < 5; glint += 1) {
        star(
          context,
          between(from, to, (glint + 0.5 + spread(seed, glint + index * 9) * 0.3) / 5),
          size * 0.14 * open,
          share * 4 + glint,
          {
            color: '#ffffff',
            alpha: open * swell((share * 3 + noise(seed, glint + index * 9)) % 1),
          },
        );
      }
    }
    if (share <= 0.7) {
      return;
    }
    const snap = (share - 0.7) / 0.3;

    star(context, at, size * (1.4 + snap * 2.4), 0.4, {
      color: '#ffffff',
      alpha: decay(Math.min(1, snap * 2)),
    });
    ring(context, at, size * (0.6 + snap * 3), {
      color: light,
      alpha: decay(snap),
      width: 2.6 * stage.scale,
    });
    shards(context, at, size * 3, many(14, weight), seed, snap, {
      color: light,
      alpha: decay(snap),
      width: 2.6 * stage.scale,
    });
  },

  // A wheel of light turning over it, shafts coming down all round it, then a pillar of judgement on it
  Verdict(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);
    const wheel = Math.min(1, share / VERDICT_WHEEL);
    const shown = late(share, 0.7);
    const crown: Point = [at[0], at[1] - size * 5];
    const shafts = many(10, weight);

    ripple(context, crown, size * 2.2 * wheel, {
      color: light,
      alpha: shown * wheel,
      width: 3 * stage.scale,
    });
    for (let glint = 0; glint < 12; glint += 1) {
      const angle = (glint / 12) * Math.PI * 2 + share * 3;

      star(
        context,
        [
          crown[0] + Math.cos(angle) * size * 2.2 * wheel,
          crown[1] + Math.sin(angle) * size * 0.75 * wheel,
        ],
        size * 0.3,
        angle,
        { color: '#ffffff', alpha: shown * wheel },
      );
    }
    for (let shaft = 0; shaft < shafts; shaft += 1) {
      const held = Math.max(
        0,
        Math.min(1, (share - VERDICT_WHEEL * 0.8 - (shaft / shafts) * 0.3) * 1.8),
      );

      if (held <= 0) {
        continue;
      }
      const angle = (shaft / shafts) * Math.PI * 2 + noise(seed, shaft) * 0.5;
      const foot: Point = [
        at[0] + Math.cos(angle) * size * 1.8,
        at[1] + size * 0.6 + Math.sin(angle) * size * 0.6,
      ];

      beam(context, [foot[0], foot[1] - size * 7], foot, Math.min(1, held * 3), size * 0.3, {
        ...paint,
        alpha: decay(held),
      });
      ripple(context, foot, size * (0.2 + held * 0.8), {
        ...paint,
        alpha: decay(held),
        width: 2 * stage.scale,
      });
    }
    if (share <= 0.55) {
      return;
    }
    const judged = (share - 0.55) / 0.45;

    beam(
      context,
      [at[0], at[1] + size * 0.9],
      [at[0], at[1] - size * 7],
      1,
      size * 1.8 * decay(judged),
      {
        ...paint,
        alpha: decay(judged),
      },
    );
    orb(context, at, size * (1 + judged * 1.6), { color: light, alpha: decay(judged) });
    star(context, at, size * (1.6 + judged * 2.4), judged, {
      color: '#ffffff',
      alpha: decay(Math.min(1, judged * 2.5)),
    });
    ring(context, at, size * (0.6 + judged * 3), {
      color: light,
      alpha: decay(judged),
      width: 3 * stage.scale,
    });
  },

  // Light drawn in across the ground under it, then flaring straight up in a column and rays
  Sunburst(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);
    const foot: Point = [at[0], at[1] + size * 0.9];

    if (share < SEED_FLARES) {
      const gather = share / SEED_FLARES;

      ripple(context, foot, size * (2.6 - gather * 1.8), {
        color: light,
        alpha: gather,
        width: 2.6 * stage.scale,
      });
      orb(context, at, size * 0.8 * gather, { color: light, alpha: gather * 0.6 });
      return;
    }
    const flare = (share - SEED_FLARES) / (1 - SEED_FLARES);
    const flash = flare < 0.1 ? flare / 0.1 : decay((flare - 0.1) / 0.9);

    beam(context, foot, [foot[0], foot[1] - size * 7], Math.min(1, flare * 4), size * 2.2 * flash, {
      ...paint,
      alpha: flash,
    });
    orb(context, at, size * (0.8 + flash * 2), { color: light, alpha: flash });
    star(context, at, size * (2 + flare * 3), flare, { color: '#ffffff', alpha: flash });
    for (let ray = 0; ray < 12; ray += 1) {
      const angle = (ray / 12) * Math.PI * 2 + noise(seed, ray) * 0.2;
      const length = size * (1 + flare * 4.5);

      lash(context, at, [at[0] + Math.cos(angle) * length, at[1] + Math.sin(angle) * length], 0, {
        color: light,
        alpha: flash * 0.8,
        width: 3 * stage.scale,
      });
    }
    for (let spore = 0; spore < many(18, weight); spore += 1) {
      orb(
        context,
        [
          at[0] + spread(seed, spore) * size * 2 * flare,
          at[1] - flare * size * (2 + noise(seed, spore + 20) * 4),
        ],
        2.4 * stage.scale,
        { color: light, alpha: decay(flare) },
      );
    }
    ring(context, at, size * (0.5 + flare * 3), {
      color: light,
      alpha: decay(flare),
      width: 2 * stage.scale,
    });
  },

  // It goes dark, and the cut comes out of the dark from behind it
  Ambush(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const dark = share < 0.45 ? share / 0.45 : decay((share - 0.45) / 0.55);

    hole(context, at, size * (1.2 + dark * 0.4), '#0a0612', dark * 0.85);
    motes(context, at, size * 1.6, many(8, weight), seed, share, {
      ...paint,
      alpha: dark * 0.7,
      width: 2.2 * stage.scale,
    });
    if (share <= 0.4) {
      return;
    }
    const after = (share - 0.4) / 0.6;
    const from: Point = [at[0] - size * 1.4, at[1] + size * 1.1];

    edge(
      context,
      from,
      between(from, [at[0] + size * 1.4, at[1] - size * 1.1], Math.min(1, after * 3.3)),
      size * 0.2,
      size * 0.3,
      { color: lighten(paint.color, 0.5), alpha: Math.min(1, decay(after) * 1.5) },
    );
    if (share <= 0.55) {
      return;
    }
    // The blow landing where the cut arrives
    const hit = (share - 0.55) / 0.45;

    orb(context, at, size * (0.5 + hit * 0.8), {
      color: lighten(paint.color, 0.6),
      alpha: decay(Math.min(1, hit * 2)),
    });
    ring(context, at, size * (0.4 + hit * 2), {
      color: lighten(paint.color, 0.5),
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    ripple(context, [at[0], at[1] + size * 0.9], size * (0.5 + hit * 2.2), {
      color: lighten(paint.color, 0.4),
      alpha: decay(hit) * 0.9,
      width: 3 * stage.scale,
    });
    burst(context, at, size * (0.6 + hit * 1.2), 8, seed, {
      color: lighten(paint.color, 0.5),
      alpha: decay(hit),
      width: 2.8 * stage.scale,
    });
  },

  // Lava wound up round it from the ground, turning as it rises
  Vortex(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const risen = Math.min(1, share * 2);
    const shown = swell(share);
    const lava = mix(paint.color, '#ff8a2a', 0.45);
    const crust = mix(paint.color, '#2a0800', 0.5);

    ripple(context, foot, size * 1.4, { color: lava, alpha: shown * 0.6, width: 3 * stage.scale });
    for (let band = 0; band < 3; band += 1) {
      for (let step = 0; step < 12; step += 1) {
        const along = step / 11;
        const turn = along * Math.PI * 2.6 + share * Math.PI * 3 + band * 2.1;
        const round = size * (0.6 + along * 0.7);

        // The front of the turn is the hot side, the back the crust
        orb(
          context,
          [
            at[0] + Math.cos(turn) * round,
            foot[1] - along * size * 3 * risen + Math.sin(turn) * round * 0.25,
          ],
          size * 0.2 * (1 - along * 0.4),
          { color: Math.sin(turn) > 0 ? lava : crust, alpha: shown * 0.9 },
        );
      }
    }
    motes(context, at, size * 1.8, many(8, weight), seed, share, {
      color: mix(paint.color, '#ffd84a', 0.6),
      alpha: shown,
      width: 2 * stage.scale,
    });
  },

  // A pillar of fire standing on it, its edge licked with every colour
  Pyre(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const top: Point = [at[0], foot[1] - size * 5];
    const up = Math.min(1, share * 2.5);
    const shown = share < 0.65 ? 1 : decay((share - 0.65) / 0.35);

    beam(context, foot, top, up, size * 1.3 * shown, { ...paint, alpha: shown * 0.8 });
    beam(context, foot, top, up, size * 0.6 * shown, { color: '#ffd84a', alpha: shown });
    for (let lick = 0; lick < 6; lick += 1) {
      const side = lick % 2 === 0 ? 1 : -1;
      const x = at[0] + side * size * (0.7 + lick * 0.05);

      lash(
        context,
        [x, foot[1]],
        [x + Math.sin(share * 20 + lick) * size * 0.2, foot[1] - size * 5 * up],
        Math.sin(share * 14 + lick) * size * 0.4,
        {
          color: RAINBOW[(lick + Math.floor(share * 12)) % RAINBOW.length],
          alpha: shown * 0.7,
          width: 2 * stage.scale,
        },
      );
    }
    ripple(context, foot, size * (0.8 + share * 1.6), {
      ...paint,
      alpha: decay(share),
      width: 2.4 * stage.scale,
    });
    motes(context, at, size * 2, many(8, weight), seed, share, {
      color: '#ffd84a',
      alpha: shown,
      width: 2 * stage.scale,
    });
  },

  // The ground cracks under it, then erupts in fire and rock
  Upheaval(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];

    ripple(context, foot, size * (0.8 + Math.min(1, share * 3) * 1.6), {
      color: '#1a0f08',
      alpha: decay(share),
      width: 4 * stage.scale,
    });
    if (share <= 0.2) {
      return;
    }
    const erupt = (share - 0.2) / 0.8;
    const jets = many(5, weight);

    for (let jet = 0; jet < jets; jet += 1) {
      const base: Point = [foot[0] + (jet / (jets - 1) - 0.5) * size * 2.4, foot[1]];

      beam(
        context,
        base,
        [base[0], base[1] - size * (2.5 + noise(seed, jet) * 2)],
        Math.min(1, erupt * 3),
        size * 0.35 * decay(erupt),
        { ...paint, alpha: decay(erupt) },
      );
    }
    orb(context, at, size * (0.6 + erupt * 1.4), { ...paint, alpha: decay(erupt) * 0.9 });
    shards(context, foot, size * 2.4, many(8, weight), seed, erupt, {
      color: mix(paint.color, '#5b4636', 0.5),
      alpha: decay(erupt),
      width: 2.8 * stage.scale,
    });
  },
  // A soft ball that bursts into a cloud of down, feathers drifting out of it
  Plume(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const open = 1 - (1 - Math.min(1, share * 2.5)) ** 2;
    const shown = share < 0.5 ? 1 : decay((share - 0.5) * 2);
    const soft = lighten(paint.color, 0.5);

    orb(context, at, size * (0.5 + open * 0.4), {
      color: '#ffffff',
      alpha: decay(Math.min(1, share * 3)),
    });
    for (let puff = 0; puff < many(8, weight); puff += 1) {
      const angle = noise(seed, puff) * Math.PI * 2;
      const out = size * (0.2 + open * (0.8 + noise(seed, puff + 10) * 0.6));

      orb(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.7],
        size * (0.4 + open * 0.3),
        { color: puff % 2 === 0 ? soft : '#ffffff', alpha: shown * 0.6 },
      );
    }
    for (let feather = 0; feather < many(6, weight); feather += 1) {
      petal(
        context,
        [
          at[0] + spread(seed, feather + 20) * size * 1.8 * open,
          at[1] + spread(seed, feather + 30) * size * 0.8 + share * size * 1.2,
        ],
        size * 0.2,
        Math.sin(share * 5 + feather) * 0.8 + Math.PI / 2,
        { color: '#ffffff', alpha: Math.min(1, share * 4) * decay(share) },
      );
    }
  },

  // Light drawn into a point, then flaring out of it in every direction
  Lustre(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);

    if (share < LUSTRE_GATHER) {
      const gather = share / LUSTRE_GATHER;

      orb(context, at, size * (1.2 - gather * 0.8), { ...paint, alpha: 0.4 + gather * 0.5 });
      ring(context, at, size * (2 - gather * 1.6), {
        color: light,
        alpha: gather,
        width: 2 * stage.scale,
      });
      return;
    }
    const flare = (share - LUSTRE_GATHER) / (1 - LUSTRE_GATHER);

    orb(context, at, size * (0.6 + flare * 2.2), { color: light, alpha: decay(flare) });
    burst(context, at, size * (0.8 + flare * 2.4), 12, seed, {
      color: light,
      alpha: decay(flare),
      width: 2.4 * stage.scale,
    });
    ring(context, at, size * (0.5 + flare * 3), {
      color: '#ffffff',
      alpha: decay(flare),
      width: 2 * stage.scale,
    });
  },

  // A star falling out of the sky onto it, then going off in a star of light
  Starfall(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);

    if (share < STARFALL_DROP) {
      const top: Point = [at[0] - size * 2.5, at[1] - size * 7];
      const fall = (share / STARFALL_DROP) ** 2;
      const spot = between(top, at, fall);

      lash(context, between(top, at, Math.max(0, fall - 0.25)), spot, 0, {
        ...paint,
        alpha: 0.6,
        width: 5 * stage.scale,
      });
      star(context, spot, size * 0.7, share * 6, { color: '#ffffff', alpha: 1 });
      return;
    }
    const blast = (share - STARFALL_DROP) / (1 - STARFALL_DROP);

    orb(context, at, size * (0.8 + blast * 1.8), { color: light, alpha: decay(blast) });
    star(context, at, size * (1.5 + blast * 2.5), blast * 0.6 - Math.PI / 2, {
      color: '#ffffff',
      alpha: decay(blast),
    });
    ring(context, at, size * (0.6 + blast * 2.6), {
      color: light,
      alpha: decay(blast),
      width: 2 * stage.scale,
    });
    for (let glint = 0; glint < many(8, weight); glint += 1) {
      const angle = noise(seed, glint) * Math.PI * 2;
      const out = size * (0.8 + blast * 2) * (0.5 + noise(seed, glint + 10) * 0.5);

      star(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        size * 0.2,
        blast * 4 + glint,
        { color: light, alpha: decay(blast) },
      );
    }
  },

  // Two great hands closing on it from either side and squeezing
  Grip(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const close = Math.min(1, share / GRIP_CLOSE) ** 2;
    const squeeze = Math.max(0, (share - GRIP_CLOSE) / (1 - GRIP_CLOSE));
    const shown = squeeze < 0.7 ? 1 : decay((squeeze - 0.7) / 0.3);
    // Trembling while it squeezes
    const jitter = squeeze > 0 ? Math.sin(share * 90) * size * 0.04 : 0;

    for (const side of [-1, 1]) {
      const palm = at[0] + side * size * (2.4 - close * 1.3) + jitter;

      orb(context, [palm + side * size * 0.3, at[1]], size * 0.7, { ...paint, alpha: shown * 0.6 });
      for (let finger = 0; finger < 4; finger += 1) {
        const y = at[1] + (finger - 1.5) * size * 0.5;

        lash(
          context,
          [palm, y],
          [
            palm - side * size * 1.1 * (0.4 + close * 0.6),
            y * (1 - close * 0.1) + at[1] * close * 0.1,
          ],
          side * size * 0.25 * close,
          { ...paint, alpha: shown, width: 5 * stage.scale },
        );
      }
    }
    if (squeeze <= 0) {
      return;
    }
    ring(context, at, size * (1.4 - squeeze * 0.8), {
      color: lighten(paint.color, 0.4),
      alpha: decay(squeeze),
      width: 2.4 * stage.scale,
    });
    burst(context, at, size * (0.4 + squeeze), 8, seed, {
      color: lighten(paint.color, 0.5),
      alpha: decay(squeeze),
      width: 2.4 * stage.scale,
    });
  },

  // Psychic light spiralling in on it, then tearing out of it in spikes
  Surge(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.45);

    if (share < SURGE_PULL) {
      const pull = share / SURGE_PULL;
      const count = many(10, weight);

      for (let one = 0; one < count; one += 1) {
        const angle = (one / count) * Math.PI * 2 + pull * Math.PI * 3;
        const out = size * 2.2 * (1 - pull * 0.85);

        orb(
          context,
          [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
          size * 0.18,
          { color: light, alpha: 0.9 },
        );
      }
      orb(context, at, size * (0.3 + pull * 0.5), { ...paint, alpha: pull });
      return;
    }
    const blast = (share - SURGE_PULL) / (1 - SURGE_PULL);

    orb(context, at, size * (0.8 + blast * 1.8), { ...paint, alpha: decay(blast) });
    burst(context, at, size * (1 + blast * 2), 12, seed, {
      color: light,
      alpha: decay(blast),
      width: 3.4 * stage.scale,
    });
    for (let shell = 0; shell < 3; shell += 1) {
      const held = Math.max(0, Math.min(1, blast * 1.4 - shell * 0.2));

      hoop(context, at, size * (0.8 + held * 2.6), 0.4 + shell * 0.15, shell * 1.1 + blast, {
        color: light,
        alpha: decay(held),
        width: 2 * stage.scale,
      });
    }
  },

  // A crescent moon rising over it, smaller ones circling, and silver falling
  Moonlit(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = Math.min(1, share * 4) * (share < 0.7 ? 1 : decay((share - 0.7) / 0.3));
    const moon: Point = [at[0], at[1] - size * (1.2 + Math.min(1, share * 2) * 1.2)];

    orb(context, moon, size * 1.1, { ...paint, alpha: shown * 0.5 });
    crescent(context, moon, size * 0.7, -Math.PI / 4, lighten(paint.color, 0.4), shown);
    for (let one = 0; one < 3; one += 1) {
      const angle = (one / 3) * Math.PI * 2 + share * Math.PI * 2;

      crescent(
        context,
        [at[0] + Math.cos(angle) * size * 1.4, at[1] + Math.sin(angle) * size * 0.4],
        size * 0.3,
        angle,
        paint.color,
        shown,
      );
    }
    for (let mote = 0; mote < many(10, weight); mote += 1) {
      const held = (share * 1.3 + noise(seed, mote)) % 1;

      orb(
        context,
        [at[0] + spread(seed, mote + 10) * size * 1.6, moon[1] + held * size * 3],
        2 * stage.scale,
        { color: '#ffffff', alpha: swell(held) * shown },
      );
    }
  },

  // Two hearts trading places between the pair of them
  Exchange(context, stage, share, { paint, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const held = Math.min(1, share / 0.7);
    const eased = held * held * (3 - 2 * held);
    const shown = share < 0.7 ? 1 : decay((share - 0.7) / 0.3);
    const trips: [from: Point, to: Point, lift: number, color: string][] = [
      [stage.source, at, size * 1.6, lighten(paint.color, 0.2)],
      [at, stage.source, size * 0.5, mix(paint.color, '#8a7cff', 0.5)],
    ];

    for (const [from, to, lift, color] of trips) {
      const along = between(from, to, eased);

      heart(context, [along[0], along[1] - Math.sin(Math.PI * eased) * lift], size * 0.45, {
        color,
        alpha: shown,
      });
    }
    if (share <= 0.7) {
      return;
    }
    const arrive = (share - 0.7) / 0.3;

    for (const end of [at, stage.source]) {
      ring(context, end, size * (0.4 + arrive * 1.4), {
        color: lighten(paint.color, 0.4),
        alpha: decay(arrive),
        width: 2.4 * stage.scale,
      });
    }
  },

  // A black sphere swelling up out of the ground and swallowing it, then collapsing
  Void(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const grow = Math.min(1, share / 0.4);
    const collapse = Math.max(0, (share - 0.6) / 0.4);
    const kept = 1 - collapse;
    const radius = size * (0.4 + grow * 1.4) * (1 - collapse * collapse);
    const centre: Point = [at[0], at[1] + size * 0.9 * (1 - grow)];

    orb(context, centre, radius * 1.35, { color: VOID_RIM, alpha: 0.5 * kept });
    hole(context, centre, radius, '#050308', 0.95);
    ring(context, centre, radius * 1.05, {
      color: VOID_RIM,
      alpha: 0.8 * kept,
      width: 2.4 * stage.scale,
    });
    for (let wisp = 0; wisp < many(8, weight); wisp += 1) {
      const held = (share * 1.6 + noise(seed, wisp)) % 1;
      const angle = noise(seed, wisp + 10) * Math.PI * 2;
      const out = size * 2.4 * (1 - held);

      lash(
        context,
        [
          centre[0] + Math.cos(angle) * (out + size * 0.4),
          centre[1] + Math.sin(angle) * (out + size * 0.4),
        ],
        [centre[0] + Math.cos(angle) * out, centre[1] + Math.sin(angle) * out],
        0,
        { ...paint, alpha: swell(held) * kept, width: 2 * stage.scale },
      );
    }
  },
  // A great ball of water slamming in from the caster's side, then a ring of spouts bursting up round it
  Cannon(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foam = lighten(paint.color, 0.55);

    if (share < CANNON_ARRIVE) {
      const out = size * 3.5 * (1 - share / CANNON_ARRIVE);
      const ball = backToward(at, stage.source, out);

      lash(context, backToward(at, stage.source, out + size * 2), ball, 0, {
        ...paint,
        alpha: 0.6,
        width: size * 0.5,
      });
      orb(context, ball, size * 0.9, { ...paint, alpha: 1 });
      return;
    }
    const splash = (share - CANNON_ARRIVE) / (1 - CANNON_ARRIVE);
    const foot: Point = [at[0], at[1] + size * 0.9];
    const spouts = many(6, weight);

    orb(context, at, size * (0.9 + splash * 1.2), { ...paint, alpha: decay(splash) * 0.8 });
    ripple(context, foot, size * (0.8 + splash * 2.6), {
      color: foam,
      alpha: decay(splash),
      width: 3.4 * stage.scale,
    });
    for (let spout = 0; spout < spouts; spout += 1) {
      const angle = (spout / spouts) * Math.PI * 2 + noise(seed, spout) * 0.4;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 1.6,
        foot[1] + Math.sin(angle) * size * 0.5,
      ];

      beam(
        context,
        base,
        [base[0], base[1] - size * (2 + noise(seed, spout + 10) * 1.5)],
        Math.min(1, splash * 3),
        size * 0.3 * decay(splash),
        { ...paint, alpha: decay(splash) },
      );
    }
    motes(context, at, size * 2.2, many(10, weight), seed, splash, {
      color: foam,
      alpha: decay(splash),
      width: 2.4 * stage.scale,
    });
  },
  // Psychic power gathered round the caster, a shell of shards hung round it, then all driven in at once
  Overload(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);
    const count = many(12, weight);

    if (share < OVERLOAD_GATHER + 0.1) {
      const charge = Math.min(1, share / OVERLOAD_GATHER);
      const kept = share < OVERLOAD_GATHER ? 1 : decay((share - OVERLOAD_GATHER) / 0.1);

      orb(context, stage.source, size * (0.6 + charge * 1.1), {
        ...paint,
        alpha: charge * kept * 0.7,
      });
      for (let band = 0; band < 3; band += 1) {
        hoop(context, stage.source, size * (1.4 + band * 0.3), 0.32, share * 6 + band * 1.05, {
          color: light,
          alpha: charge * kept * 0.8,
          width: 2 * stage.scale,
        });
      }
    }
    if (share < OVERLOAD_GATHER) {
      return;
    }
    const drive = Math.min(1, Math.max(0, (share - OVERLOAD_HOLD) / OVERLOAD_DRIVE));

    if (drive < 1) {
      const appear = Math.min(1, (share - OVERLOAD_GATHER) / 0.1);

      for (let shard = 0; shard < count; shard += 1) {
        const angle = (shard / count) * Math.PI * 2 + noise(seed, shard) * 0.3 + share * 1.2;
        const out = size * (2.4 - drive * 2.1) + size * 0.3;
        const spot: Point = [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8];

        edge(context, between(spot, at, -0.12), between(spot, at, 0.12), size * 0.16, 0, {
          color: light,
          alpha: appear,
        });
      }
      ring(context, at, size * (2.6 - ((share * 3) % 1) * 1.8), {
        color: light,
        alpha: appear * 0.6,
        width: 2 * stage.scale,
      });
      return;
    }
    const hit = (share - OVERLOAD_HOLD - OVERLOAD_DRIVE) / (1 - OVERLOAD_HOLD - OVERLOAD_DRIVE);

    orb(context, at, size * (1 + hit * 2), { color: light, alpha: decay(Math.min(1, hit * 1.3)) });
    star(context, at, size * (1.8 + hit * 2.4), hit, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2.5)),
    });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.2));

      if (held > 0) {
        hoop(context, at, size * (0.6 + held * 3.2), 0.35, wave * 1.05, {
          color: light,
          alpha: decay(held),
          width: 2.6 * stage.scale,
        });
      }
    }
    burst(context, at, size * (1.6 + hit * 2.4), count, seed, {
      color: light,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
  },

  // Air wound into a ball on the caster, loosed as a spiralling blast, and bursting over it in a gale
  Jetstream(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.6);

    if (share < JETSTREAM_FIRES + 0.1) {
      const charge = Math.min(1, share / JETSTREAM_FIRES);
      const kept = share < JETSTREAM_FIRES ? 1 : decay((share - JETSTREAM_FIRES) / 0.1);

      orb(context, stage.source, size * (0.5 + charge * 0.9), {
        ...paint,
        alpha: charge * kept * 0.7,
      });
      spiral(context, stage.source, size * (1.6 - charge * 0.8), 2, share * 6, {
        color: light,
        alpha: charge * kept,
        width: 2.4 * stage.scale,
      });
    }
    if (share < JETSTREAM_FIRES) {
      return;
    }
    const blow = (share - JETSTREAM_FIRES) / (1 - JETSTREAM_FIRES);
    const drawn = Math.min(1, blow * 5);
    const kept = late(blow, 0.6);

    beam(context, stage.source, at, drawn, size * 1.2, { ...paint, alpha: kept });
    funnel(context, stage.source, at, drawn, 3, size * 1.1, share * 30, {
      color: '#ffffff',
      alpha: kept * 0.7,
      width: 2.4 * stage.scale,
    });
    if (drawn < 1) {
      return;
    }
    const hit = (blow - 0.2) / 0.8;

    orb(context, at, size * (1 + hit * 1.6), { color: light, alpha: decay(hit) });
    star(context, at, size * (1.4 + hit * 2), 0, {
      color: '#ffffff',
      alpha: decay(Math.min(1, hit * 2.5)),
    });
    ring(context, at, size * (0.6 + hit * 3), {
      color: light,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    burst(context, at, size * (1.2 + hit * 3), many(14, weight), seed, {
      color: light,
      alpha: decay(hit),
      width: 2 * stage.scale,
    });
  },

  // A blade of light drawn in three quick cuts across it, the cuts left hanging, then going off together
  Resolute(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const light = lighten(paint.color, 0.5);
    const [first] = RESOLUTE_CUTS[0];

    // The blade catching the light where the first cut starts
    if (share < 0.16) {
      star(
        context,
        [at[0] + Math.cos(-first) * size * 1.6, at[1] + Math.sin(-first) * size * 1.6],
        size * 0.8,
        share * 6,
        { color: '#ffffff', alpha: swell(share / 0.16) },
      );
    }
    for (const [index, [from, to]] of RESOLUTE_CUTS.entries()) {
      const start = 0.08 + index * 0.16;
      const swing = (share - start) / 0.12;

      if (swing <= 0) {
        continue;
      }
      // The picture's y runs down, so the scene's angles turn the other way
      const end = from + (to - from) * Math.min(1, swing);
      const kept = late(share, RESOLUTE_FINALE + 0.1);

      sickle(context, at, size * 1.6, -from, -end, size * 0.45, { ...paint, alpha: kept * 0.6 });
      sickle(context, at, size * 1.6, -from, -end, size * 0.16, { color: '#ffffff', alpha: kept });
      if (swing >= 1) {
        const after = Math.min(1, (swing - 1) / 2);

        burst(context, at, size * 1.2, 6, seed + index, {
          color: light,
          alpha: decay(after),
          width: 2 * stage.scale,
        });
      }
    }
    if (share < RESOLUTE_FINALE) {
      return;
    }
    const finale = (share - RESOLUTE_FINALE) / (1 - RESOLUTE_FINALE);

    orb(context, at, size * (1 + finale * 1.6), { color: light, alpha: decay(finale) });
    star(context, at, size * (1.6 + finale * 2.4), 0.4, {
      color: '#ffffff',
      alpha: decay(Math.min(1, finale * 2.5)),
    });
    ring(context, at, size * (0.6 + finale * 3), {
      color: light,
      alpha: decay(finale),
      width: 2.6 * stage.scale,
    });
    motes(context, at, size * 2.6, many(12, weight), seed, finale, {
      color: light,
      alpha: decay(finale),
      width: 2.4 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default legends;
