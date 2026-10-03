import type { Point } from '../../stage';
import {
  beam,
  between,
  bolt,
  burst,
  decay,
  edge,
  fade,
  heart,
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
  spread,
  star,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { settle } from './stats';
import { Z_GOLD, unleashed, zPower } from './z-power';

// Every share below is a share of the payoff, as `unleashed` counts it

/** Inferno Overdrive: the share the fireball lands at */
export const OVERDRIVE_LANDS = 0.3;

/** Hydro Vortex: the share the whirlpool has closed over it by, and the share it breaks */
export const VORTEX_CLOSES = 0.3;
export const VORTEX_BREAKS = 0.78;

/** Bloom Doom: the share the flowers have bloomed by */
export const DOOM_BLOOMS = 0.4;

/** Gigavolt Havoc: the share the sphere is thrown at, and the share it lands */
export const HAVOC_THROWN = 0.2;
export const HAVOC_LANDS = 0.45;

/** Shattered Psyche: the share it shatters at */
export const PSYCHE_SHATTERS = 0.7;

/** Shattered Psyche: where it is flung, in reaches across and up from where it stood */
export const PSYCHE_FLUNG: [right: number, up: number][] = [
  [0, 0],
  [0, 2.6],
  [-2.2, 1.4],
  [2.2, 2.2],
  [-1, 3],
  [0, 0],
];

/** Subzero Slammer: the share the pillar has risen by, the share it slams, and the share it shatters */
export const SLAMMER_RISES = 0.25;
export const SLAMMER_SLAMS = 0.42;
export const SLAMMER_SHATTERS = 0.78;

/** Devastating Drake: the share the dragon has climbed by, and the share it lands */
export const DRAKE_RISES = 0.3;
export const DRAKE_LANDS = 0.55;

/** Black Hole Eclipse: the share the hole has opened by, and the share it collapses */
export const ECLIPSE_OPENS = 0.2;
export const ECLIPSE_COLLAPSES = 0.75;

/** Twinkle Tackle: the share the tackle lands */
export const TWINKLE_HITS = 0.62;

/** Inferno Overdrive: the white-hot heart of the fire */
export const FLAME = '#fff0a0';

/** Bloom Doom: the colours the flowers open in */
export const BLOSSOMS = ['#ff8fc0', '#ffffff', '#ffd0e8', '#fff0a0'];

/** Shattered Psyche: its pink */
export const PSYCHE_PINK = '#ff7ad0';

/** Subzero Slammer: the pale face of the ice */
export const FROST = '#e8faff';

/** Black Hole Eclipse: the hole itself, and the light bending round it */
export const VOID = '#07030d';
export const HORIZON = '#b27aff';

/** Twinkle Tackle: the pastels of the fairy space */
export const PASTELS = ['#ffb8dc', '#d8c0ff', '#b8f0e0', '#bfe0ff', '#fff0b0'];

/** Shattered Psyche: where it has been flung to, as reaches across and up, eased between stops */
export function flungAt(along: number): [right: number, up: number] {
  const stops = PSYCHE_FLUNG.length - 1;
  const place = Math.max(0, Math.min(stops - 1e-6, along * stops));
  const index = Math.floor(place);
  const part = place - index;
  const eased = part * part * (3 - 2 * part);
  const [fromRight, fromUp] = PSYCHE_FLUNG[index];
  const [toRight, toUp] = PSYCHE_FLUNG[index + 1];

  return [fromRight + (toRight - fromRight) * eased, fromUp + (toUp - fromUp) * eased];
}

/** A stretch of an oval: `squash` of its width tall, turned by `tilt` */
function arc(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  squash: number,
  tilt: number,
  from: number,
  span: number,
  color: string,
  alpha: number,
  width: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, radius, radius * squash, tilt, from, from + span);
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.lineCap = 'round';
  context.stroke();
  context.lineCap = 'butt';
}

/** A four-pointed sparkle */
function sparkle(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  for (let point = 0; point < 8; point += 1) {
    const angle = turn + (point / 8) * Math.PI * 2;
    const reach = point % 2 === 0 ? size : size * 0.22;

    context[point === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach,
    );
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A five-petalled flower with a gold heart */
function blossom(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const angle = turn + (leaf / 5) * Math.PI * 2;

    petal(
      context,
      [x + Math.cos(angle) * size * 0.6, y + Math.sin(angle) * size * 0.6],
      size * 0.6,
      angle + Math.PI / 2,
      { color, alpha },
    );
  }
  orb(context, [x, y], size * 0.45, { color: Z_GOLD, alpha });
}

/** An ice pillar standing on its base, pointed at the top, tipped over by `turn` */
function pillar(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  width: number,
  height: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  context.save();
  context.translate(x, y);
  context.rotate(turn);
  context.beginPath();
  context.moveTo(-width, 0);
  context.lineTo(-width, -height * 0.8);
  context.lineTo(0, -height);
  context.lineTo(width, -height * 0.8);
  context.lineTo(width, 0);
  context.closePath();
  context.fillStyle = fade(color, alpha * 0.6);
  context.fill();
  context.strokeStyle = fade(FROST, alpha);
  context.lineWidth = Math.max(1, width * 0.12);
  context.stroke();
  // A lit face down one side, which is what reads as a prism rather than a slab
  context.fillStyle = fade(FROST, alpha * 0.5);
  context.fillRect(-width * 0.55, -height * 0.78, width * 0.3, height * 0.7);
  context.restore();
}

/** A dragon of light along a path: a tapering body behind the head, and horns swept back */
function wyrm(
  context: CanvasRenderingContext2D,
  place: (along: number) => Point,
  head: number,
  size: number,
  color: string,
  light: string,
  alpha: number,
): void {
  for (let segment = 14; segment >= 0; segment -= 1) {
    const along = head - (segment / 14) * 0.45;

    if (along >= 0) {
      orb(context, place(along), size * (0.95 - segment * 0.05), { color, alpha: alpha * 0.8 });
    }
  }
  const tip = place(head);
  const back = place(Math.max(0, head - 0.08));

  for (const side of [-1, 1]) {
    edge(context, tip, [back[0] + side * size * 1.1, back[1] - size * 0.9], size * 0.22, 0, {
      color: light,
      alpha,
    });
  }
  orb(context, tip, size * 1.2, { color: light, alpha });
}

const zElements = {
  // A great fireball hurled in an arc off the caster, then a towering pillar of fire mushrooming over it
  Overdrive(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const hot = mix(paint.color, FLAME, 0.5);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    if (payoff < OVERDRIVE_LANDS) {
      const flight = payoff / OVERDRIVE_LANDS;
      const place = (along: number): Point => {
        const [x, y] = between(stage.source, at, along);

        return [x, y - Math.sin(Math.PI * along) * size * 2.4];
      };
      const ball = size * (1.2 + flight * 0.8);

      for (let lick = 7; lick >= 0; lick -= 1) {
        orb(context, place(Math.max(0, flight - lick * 0.04)), ball * (1 - lick * 0.1), {
          color: lick < 3 ? hot : paint.color,
          alpha: 0.9 - lick * 0.1,
        });
      }
      orb(context, place(flight), ball * 0.7, { color: FLAME, alpha: 1 });
      motes(context, place(flight), ball * 1.6, many(10, weight), seed, flight, {
        color: hot,
        alpha: 0.9,
        width: 2.4 * stage.scale,
      });
      return;
    }
    const hit = (payoff - OVERDRIVE_LANDS) / (1 - OVERDRIVE_LANDS);
    const rise = settle(hit * 1.6);
    const kept = late(hit, 0.55);
    const tall = size * 7 * rise;
    const cap: Point = [foot[0], foot[1] - tall];

    orb(context, at, size * (1.6 + hit * 3), {
      color: FLAME,
      alpha: decay(Math.min(1, hit * 2.5)),
    });
    beam(context, foot, cap, 1, size * 2.6 * kept, { ...paint, alpha: kept });
    for (let lick = 0; lick < many(16, weight); lick += 1) {
      const held = (hit * 1.8 + noise(seed, lick)) % 1;

      orb(
        context,
        [foot[0] + spread(seed, lick + 5) * size * (0.6 + held), foot[1] - held * tall],
        size * (0.8 + held * 0.9),
        { color: held < 0.35 ? hot : paint.color, alpha: swell(held) * kept },
      );
    }
    // The cap the column mushrooms into
    for (let puff = 0; puff < 9; puff += 1) {
      const angle = (puff / 9) * Math.PI * 2 + hit;

      orb(
        context,
        [
          cap[0] + Math.cos(angle) * size * 2.4 * rise,
          cap[1] + Math.sin(angle) * size * 0.9 * rise,
        ],
        size * 1.4 * rise,
        { color: puff % 2 === 0 ? paint.color : hot, alpha: kept * 0.8 },
      );
    }
    orb(context, cap, size * 2 * rise, { color: FLAME, alpha: kept * 0.7 });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      if (held > 0) {
        ripple(context, foot, size * (1 + held * 4), {
          ...paint,
          alpha: decay(held) * 0.9,
          width: 3.4 * stage.scale,
        });
      }
    }
    motes(context, [foot[0], foot[1] - tall * 0.5], size * 4, many(16, weight), seed, hit, {
      color: hot,
      alpha: kept,
      width: 2.4 * stage.scale,
    });
    burst(context, at, size * (2.4 + hit * 2.4), 16, seed, {
      color: hot,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
  },

  // Water drawn round its feet into a towering whirlpool that swallows it spinning, then bursts apart
  Hydrovortex(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const foam = lighten(paint.color, 0.6);
    const deep = mix(paint.color, '#0a1a40', 0.4);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const close = settle(payoff / VORTEX_CLOSES);
    const broken = Math.max(0, (payoff - VORTEX_BREAKS) / (1 - VORTEX_BREAKS));
    const kept = decay(Math.min(1, broken * 2));
    const spin = share * 26;
    const layers = 7;

    orb(context, [at[0], at[1] - size * 0.6], size * 2.6 * close, {
      color: deep,
      alpha: kept * 0.55,
    });
    for (let layer = 0; layer < layers; layer += 1) {
      const centre: Point = [
        foot[0] + Math.sin(spin * 0.2 + layer) * size * 0.2,
        foot[1] - (layer / (layers - 1)) * close * size * 5,
      ];
      const radius = size * (2.6 - close * 1.4 + (layer / layers) * 1.6);

      ripple(context, centre, radius, { color: deep, alpha: kept * 0.6, width: size * 0.4 });
      for (let current = 0; current < 3; current += 1) {
        arc(
          context,
          centre,
          radius,
          0.34,
          0,
          spin + layer * 0.7 + (current / 3) * Math.PI * 2,
          1.4,
          foam,
          kept,
          2.6 * stage.scale,
        );
      }
    }
    for (let drop = 0; drop < many(14, weight); drop += 1) {
      const held = (share * 2 + noise(seed, drop)) % 1;
      const angle = spin * 0.5 + noise(seed, drop + 10) * Math.PI * 2;
      const out = size * (1.8 + held * 1.4);

      orb(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.34 - held * size * 6],
        size * 0.22,
        { color: foam, alpha: swell(held) * kept * close },
      );
    }
    if (broken <= 0) {
      return;
    }
    orb(context, at, size * (1.4 + broken * 2), { color: foam, alpha: decay(broken) * 0.8 });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, broken * 1.6 - wave * 0.25));

      if (held > 0) {
        ripple(context, foot, size * (1.6 + held * 3.6), {
          color: foam,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    motes(context, [at[0], at[1] - size], size * 4.4, many(20, weight), seed, broken, {
      color: foam,
      alpha: decay(broken),
      width: 2.6 * stage.scale,
    });
    burst(context, at, size * (2.4 + broken * 2), 14, seed, {
      ...paint,
      alpha: decay(broken),
      width: 3 * stage.scale,
    });
  },

  // A ring of flowers bursting into bloom round it and drinking in light, then a pillar of plant energy erupting out of it
  Doom(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const light = lighten(paint.color, 0.7);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const bloom = settle(payoff / DOOM_BLOOMS);
    const fired = Math.max(0, (payoff - DOOM_BLOOMS) / (1 - DOOM_BLOOMS));
    const kept = late(fired, 0.5);
    const flowers = many(9, weight);
    const spots: Point[] = [];

    ripple(context, foot, size * 2.6, {
      ...paint,
      alpha: bloom * kept * 0.7,
      width: 3 * stage.scale,
    });
    for (let flower = 0; flower < flowers; flower += 1) {
      const angle = (flower / flowers) * Math.PI * 2 + noise(seed, flower) * 0.3;
      const spot: Point = [
        foot[0] + Math.cos(angle) * size * 2.6,
        foot[1] + Math.sin(angle) * size * 0.9,
      ];

      spots.push(spot);
      blossom(
        context,
        spot,
        size * 0.7 * Math.min(1, bloom * (1.2 + noise(seed, flower + 10))),
        payoff * 2 + angle,
        BLOSSOMS[flower % BLOSSOMS.length],
        kept,
      );
    }
    if (fired <= 0) {
      // Light drawn in off every flower
      for (let mote = 0; mote < many(18, weight); mote += 1) {
        const held = (payoff * 3 + noise(seed, mote + 20)) % 1;

        orb(context, between(spots[mote % spots.length], at, held), size * 0.2, {
          color: light,
          alpha: swell(held) * bloom,
        });
      }
      orb(context, at, size * (0.4 + bloom * 1.2), { color: light, alpha: bloom * 0.8 });
      return;
    }
    const tall = size * 8 * Math.min(1, fired * 4);

    beam(context, foot, [foot[0], foot[1] - tall], 1, size * 3 * kept, { ...paint, alpha: kept });
    beam(context, foot, [foot[0], foot[1] - tall], 1, size * 1.3 * kept, {
      color: light,
      alpha: kept,
    });
    orb(context, at, size * (1.6 + swell(fired) * 1.8), {
      color: light,
      alpha: Math.max(kept * 0.6, decay(fired)),
    });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, fired * 1.6 - wave * 0.25));

      if (held > 0) {
        ring(context, at, size * (1 + held * 3.4), {
          ...paint,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    for (let leaf = 0; leaf < many(16, weight); leaf += 1) {
      const angle = noise(seed, leaf + 40) * Math.PI * 2;
      const out = size * (1 + fired * 4 * (0.5 + noise(seed, leaf + 50) * 0.5));

      petal(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8 - fired * size * 2],
        size * 0.35,
        angle + fired * 6,
        { color: BLOSSOMS[leaf % BLOSSOMS.length], alpha: decay(fired) },
      );
    }
    motes(context, at, size * 4, many(14, weight), seed, fired, {
      color: light,
      alpha: decay(fired),
      width: 2.4 * stage.scale,
    });
  },

  // A huge crackling sphere of lightning swelling over the caster, hurled at it, and bursting into a storm of bolts
  Havoc(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const light = lighten(paint.color, 0.6);
    const flick = Math.floor(share * 18);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    if (payoff < HAVOC_LANDS) {
      const held: Point = [stage.source[0], stage.source[1] - size * 2.6];
      const grow = settle(payoff / HAVOC_THROWN);
      const flight = Math.max(0, (payoff - HAVOC_THROWN) / (HAVOC_LANDS - HAVOC_THROWN));
      const ball = between(held, at, flight * flight);
      const radius = size * 1.8 * grow;

      if (flight > 0) {
        edge(
          context,
          between(held, at, Math.max(0, flight * flight - 0.25)),
          ball,
          radius * 0.8,
          0,
          {
            ...paint,
            alpha: 0.5,
          },
        );
      }
      orb(context, ball, radius * 1.5, { ...paint, alpha: 0.5 });
      orb(context, ball, radius, { color: light, alpha: 1 });
      ring(context, ball, radius * 1.1, { color: '#ffffff', alpha: 0.6, width: 2 * stage.scale });
      for (let fork = 0; fork < 5; fork += 1) {
        const angle = noise(seed + flick, fork) * Math.PI * 2;

        bolt(
          context,
          ball,
          [ball[0] + Math.cos(angle) * radius * 1.7, ball[1] + Math.sin(angle) * radius * 1.7],
          seed + flick * 7 + fork,
          { color: light, alpha: 0.9, width: 2 * stage.scale },
        );
      }
      return;
    }
    const hit = (payoff - HAVOC_LANDS) / (1 - HAVOC_LANDS);
    const bright = decay(hit) * (flick % 3 === 2 ? 0.55 : 1);
    const bolts = many(10, weight);

    orb(context, at, size * (2 + hit * 3), { color: light, alpha: decay(Math.min(1, hit * 1.6)) });
    orb(context, at, size * (1 + hit), { color: '#ffffff', alpha: decay(Math.min(1, hit * 3)) });
    for (let fork = 0; fork < bolts; fork += 1) {
      const angle = (fork / bolts) * Math.PI * 2 + noise(seed + flick, fork) * 0.6;
      const out = size * (2 + hit * 4) * (0.6 + noise(seed, fork + 20) * 0.4);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
        seed + flick * 11 + fork,
        { color: light, alpha: bright, width: 2.6 * stage.scale },
      );
    }
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      if (held > 0) {
        ring(context, at, size * (1 + held * 4), {
          ...paint,
          alpha: decay(held),
          width: 3.4 * stage.scale,
        });
      }
    }
    ripple(context, foot, size * (1.4 + hit * 3.6), {
      ...paint,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    burst(context, at, size * (2.6 + hit * 2.4), 16, seed, {
      color: light,
      alpha: bright,
      width: 3 * stage.scale,
    });
  },

  // Warping pink rings seize it and fling it about the field, then everything shatters into shards
  Psyche(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const pink = mix(paint.color, PSYCHE_PINK, 0.5);
    const pale = lighten(pink, 0.6);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const flung = (along: number): Point => {
      const [right, up] = flungAt(along);

      return [at[0] + right * size, at[1] - up * size];
    };

    if (payoff < PSYCHE_SHATTERS) {
      const held = payoff / PSYCHE_SHATTERS;
      const grip = Math.min(1, payoff * 8);
      const now = flung(held);
      const stops = PSYCHE_FLUNG.length - 1;
      const knock = (held * stops) % 1;

      for (let band = 0; band < 4; band += 1) {
        hoop(
          context,
          at,
          size * (3.6 - band * 0.5),
          Math.abs(Math.cos(share * 8 + band)),
          band * 0.8 + share * 3,
          { color: band % 2 === 0 ? pink : pale, alpha: grip * 0.7, width: 2.4 * stage.scale },
        );
      }
      for (let echo = 4; echo >= 0; echo -= 1) {
        orb(context, flung(held - echo * 0.03), size * 1.3, {
          color: pink,
          alpha: grip * (0.6 - echo * 0.1),
        });
      }
      ring(context, now, size * 1.4, { color: pale, alpha: grip, width: 2.6 * stage.scale });
      hoop(context, now, size * 1.8, Math.abs(Math.sin(share * 12)), share * 6, {
        color: pale,
        alpha: grip * 0.8,
        width: 2 * stage.scale,
      });
      // A jolt each time it is slammed to a stop
      if (held > 0.05 && knock < 0.25) {
        ring(context, now, size * (1 + knock * 6), {
          color: pale,
          alpha: decay(knock / 0.25),
          width: 3 * stage.scale,
        });
      }
      return;
    }
    const shattered = (payoff - PSYCHE_SHATTERS) / (1 - PSYCHE_SHATTERS);

    orb(context, at, size * (1.4 + shattered * 2), {
      color: pale,
      alpha: decay(Math.min(1, shattered * 2)),
    });
    // Cracks run out across the picture like broken glass
    for (let crack = 0; crack < 9; crack += 1) {
      const angle = (crack / 9) * Math.PI * 2 + noise(seed, crack) * 0.4;
      const out = size * (2.6 + noise(seed, crack + 9) * 1.6);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        seed + crack,
        {
          color: pale,
          alpha: decay(Math.min(1, shattered * 1.5)),
          width: 2 * stage.scale,
        },
      );
    }
    shards(context, at, size * 4.6, many(20, weight), seed, shattered, {
      color: pink,
      alpha: decay(shattered),
    });
    shards(context, at, size * 3.4, many(12, weight), seed + 5, shattered, {
      color: pale,
      alpha: decay(shattered),
    });
    ring(context, at, size * (1 + shattered * 4), {
      color: pink,
      alpha: decay(shattered),
      width: 3.4 * stage.scale,
    });
  },

  // Frost racing over the floor, a great pillar of ice rising and slamming down to freeze it in, then shattering
  Slammer(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const ice = lighten(paint.color, 0.4);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const risen = settle(payoff / SLAMMER_RISES);
    const broken = Math.max(0, (payoff - SLAMMER_SHATTERS) / (1 - SLAMMER_SHATTERS));
    const kept = decay(Math.min(1, broken * 3));
    const spikes = many(9, weight);

    ripple(context, foot, size * (1 + risen * 2.6), {
      color: FROST,
      alpha: kept * 0.8,
      width: 3 * stage.scale,
    });
    for (let spike = 0; spike < spikes; spike += 1) {
      const angle = (spike / spikes) * Math.PI * 2 + noise(seed, spike) * 0.4;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 2.4,
        foot[1] + Math.sin(angle) * size * 0.8,
      ];

      edge(
        context,
        base,
        [
          base[0] + Math.cos(angle) * size * 0.4,
          base[1] - size * (1 + noise(seed, spike + 10)) * risen,
        ],
        size * 0.35,
        0,
        { color: ice, alpha: kept },
      );
    }
    if (payoff < SLAMMER_SLAMS) {
      const slam = Math.max(0, (payoff - SLAMMER_RISES) / (SLAMMER_SLAMS - SLAMMER_RISES));

      pillar(
        context,
        [foot[0] + size * 2.6, foot[1]],
        size * 0.9,
        size * 6 * risen,
        -slam * slam * Math.PI * 0.48,
        ice,
        1,
      );
      return;
    }
    const struck = (payoff - SLAMMER_SLAMS) / (SLAMMER_SHATTERS - SLAMMER_SLAMS);

    if (broken <= 0) {
      pillar(context, [foot[0], foot[1] + size * 0.2], size * 1.8, size * 3.6, 0, ice, 0.9);
      for (let glint = 0; glint < 4; glint += 1) {
        sparkle(
          context,
          [
            at[0] + spread(seed, glint + 20) * size * 1.4,
            at[1] + spread(seed, glint + 30) * size * 1.4,
          ],
          size * 0.5 * swell((share * 3 + noise(seed, glint + 40)) % 1),
          0,
          '#ffffff',
          1,
        );
      }
      orb(context, at, size * (1.6 + struck * 2), {
        color: FROST,
        alpha: decay(Math.min(1, struck * 3)),
      });
      ripple(context, foot, size * (1.4 + struck * 3), {
        color: ice,
        alpha: decay(Math.min(1, struck * 2)),
        width: 3.4 * stage.scale,
      });
      return;
    }
    orb(context, at, size * (1.6 + broken * 2), { color: FROST, alpha: decay(broken) * 0.8 });
    shards(context, at, size * 4.6, many(22, weight), seed, broken, {
      color: ice,
      alpha: decay(broken),
    });
    shards(context, at, size * 3.2, many(12, weight), seed + 3, broken, {
      color: FROST,
      alpha: decay(broken),
    });
    sparkle(context, at, size * (2 + broken * 2), broken, '#ffffff', decay(broken));
    ring(context, at, size * (1 + broken * 3.4), {
      color: ice,
      alpha: decay(broken),
      width: 3 * stage.scale,
    });
  },

  // A dragon of aura climbing off the caster, then diving down onto it in a blast of dragon flame
  Drake(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const light = lighten(paint.color, 0.55);
    const aura = mix(paint.color, '#7a3cff', 0.35);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    if (payoff < DRAKE_RISES) {
      const up = settle(payoff / DRAKE_RISES);
      const place = (along: number): Point => [
        stage.source[0] + Math.sin(along * Math.PI * 3) * size * 0.9,
        stage.source[1] - along * size * 10,
      ];

      orb(context, stage.source, size * 1.6, { color: aura, alpha: decay(up) * 0.7 });
      wyrm(context, place, up, size, aura, light, 1);
      return;
    }
    if (payoff < DRAKE_LANDS) {
      const dive = (payoff - DRAKE_RISES) / (DRAKE_LANDS - DRAKE_RISES);
      const place = (along: number): Point => [
        at[0] - size * 3 * (1 - along) + Math.sin(along * Math.PI * 2) * size * 0.9 * (1 - along),
        at[1] - size * 10 * (1 - along) ** 1.4,
      ];

      ripple(context, foot, size * (0.6 + dive * 2), {
        ...paint,
        alpha: dive * 0.7,
        width: 3 * stage.scale,
      });
      wyrm(context, place, dive, size, aura, light, 1);
      return;
    }
    const hit = (payoff - DRAKE_LANDS) / (1 - DRAKE_LANDS);
    const kept = late(hit, 0.5);

    beam(context, foot, [foot[0], foot[1] - size * 7], 1, size * 2.4 * kept, {
      color: aura,
      alpha: kept,
    });
    orb(context, at, size * (1.6 + hit * 2.6), {
      color: light,
      alpha: decay(Math.min(1, hit * 1.6)),
    });
    for (let lick = 0; lick < many(16, weight); lick += 1) {
      const held = (hit * 1.8 + noise(seed, lick)) % 1;

      orb(
        context,
        [foot[0] + spread(seed, lick + 5) * size * (1 + held * 1.6), foot[1] - held * size * 5],
        size * (0.7 + held * 0.6),
        { color: held < 0.35 ? light : aura, alpha: swell(held) * kept },
      );
    }
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      if (held > 0) {
        ring(context, at, size * (1 + held * 3.6), {
          color: aura,
          alpha: decay(held),
          width: 3.4 * stage.scale,
        });
        ripple(context, foot, size * (1 + held * 4), {
          ...paint,
          alpha: decay(held) * 0.8,
          width: 3 * stage.scale,
        });
      }
    }
    burst(context, at, size * (2.4 + hit * 2.4), 16, seed, {
      color: light,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    motes(context, at, size * 4, many(14, weight), seed, hit, {
      color: light,
      alpha: kept,
      width: 2.4 * stage.scale,
    });
  },

  // A black hole tearing open on it and dragging everything in round a burning rim, then collapsing in a burst
  Eclipse(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const centre: Point = [at[0], at[1] - size * 0.3];
    const light = lighten(HORIZON, 0.5);
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const open = settle(payoff / ECLIPSE_OPENS);
    const collapse = Math.max(0, (payoff - ECLIPSE_COLLAPSES) / (1 - ECLIPSE_COLLAPSES));
    const pulled = Math.min(1, collapse / 0.25);
    const after = Math.max(0, (collapse - 0.25) / 0.75);
    const radius = size * 1.8 * open * (1 - pulled);

    if (radius > 0) {
      orb(context, centre, radius * 2.4, { color: HORIZON, alpha: 0.45 });
      for (let band = 0; band < 3; band += 1) {
        const held = (payoff * 2 + band / 3) % 1;

        ring(context, centre, radius * (3.6 - held * 2.6), {
          color: HORIZON,
          alpha: swell(held) * 0.6,
          width: 2.4 * stage.scale,
        });
      }
      // Matter spiralling in
      for (let mote = 0; mote < many(24, weight); mote += 1) {
        const held = (payoff * 2.4 + noise(seed, mote)) % 1;
        const angle = noise(seed, mote + 10) * Math.PI * 2 + held * 5;
        const out = radius * (3.2 - held * 2.2);

        orb(
          context,
          [centre[0] + Math.cos(angle) * out, centre[1] + Math.sin(angle) * out * 0.5],
          size * 0.2,
          { color: mote % 2 === 0 ? light : Z_GOLD, alpha: swell(held) },
        );
      }
      // The back of the disc, the hole over it, then the front of the disc across it
      arc(context, centre, radius * 1.7, 0.3, -0.25, Math.PI, Math.PI, HORIZON, 1, size * 0.3);
      context.beginPath();
      context.ellipse(centre[0], centre[1], radius, radius, 0, 0, Math.PI * 2);
      context.fillStyle = fade(VOID, 0.95);
      context.fill();
      ring(context, centre, radius, { color: light, alpha: 0.9, width: 2 * stage.scale });
      arc(context, centre, radius * 1.7, 0.3, -0.25, 0, Math.PI, light, 1, size * 0.3);
    }
    if (after <= 0) {
      return;
    }
    orb(context, centre, size * (1 + after * 4), { color: light, alpha: decay(after) });
    sparkle(context, centre, size * (2.4 + after * 2), 0, '#ffffff', decay(Math.min(1, after * 2)));
    ring(context, centre, size * (1 + after * 4.4), {
      color: HORIZON,
      alpha: decay(after),
      width: 3.4 * stage.scale,
    });
    burst(context, centre, size * (2.6 + after * 2.4), 16, seed, {
      color: light,
      alpha: decay(after),
      width: 3 * stage.scale,
    });
    shards(context, centre, size * 4, many(14, weight), seed, after, {
      color: mix(paint.color, VOID, 0.4),
      alpha: decay(after),
    });
  },

  // A pastel fairy space opening round it, full of stars and hearts, the caster circling in to a sparkling impact
  Twinkle(context, stage, share, { paint, seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const payoff = unleashed(share);

    zPower(context, stage, share, paint.color, seed);
    if (payoff <= 0) {
      return;
    }
    const space = settle(payoff / 0.2) * late(payoff, 0.8);
    const hit = Math.max(0, (payoff - TWINKLE_HITS) / (1 - TWINKLE_HITS));

    for (const [tone, color] of PASTELS.entries()) {
      const angle = (tone / PASTELS.length) * Math.PI * 2 + share * 1.5;

      orb(
        context,
        [at[0] + Math.cos(angle) * size * 2, at[1] + Math.sin(angle) * size * 1.2 - size * 0.4],
        size * 2.6 * space,
        { color, alpha: space * 0.5 },
      );
    }
    for (let float = 0; float < many(18, weight); float += 1) {
      const held = (payoff * 1.5 + noise(seed, float)) % 1;
      const spot: Point = [
        at[0] + spread(seed, float + 5) * size * 4.4,
        at[1] + size * 1.8 - held * size * 4.4,
      ];
      const alpha = swell(held) * space;
      const color = PASTELS[float % PASTELS.length];

      if (float % 3 === 0) {
        heart(context, spot, size * 0.3, { color: lighten(paint.color, 0.3), alpha });
      } else if (float % 3 === 1) {
        star(context, spot, size * 0.34, held * 3, { color, alpha });
      } else {
        sparkle(
          context,
          spot,
          size * 0.4 * swell((share * 3 + noise(seed, float + 9)) % 1),
          0,
          '#ffffff',
          alpha,
        );
      }
    }
    if (hit <= 0) {
      const orbit = payoff / TWINKLE_HITS;
      const place = (along: number): Point => {
        const [x, y] = between(stage.source, at, along);
        const angle = along * Math.PI * 3;
        const out = size * 2.6 * swell(along);

        return [x + Math.cos(angle) * out, y + Math.sin(angle) * out * 0.6];
      };

      for (let tail = 6; tail >= 0; tail -= 1) {
        orb(context, place(Math.max(0, orbit - tail * 0.03)), size * (0.8 - tail * 0.08), {
          color: PASTELS[tail % PASTELS.length],
          alpha: 0.85,
        });
      }
      sparkle(context, place(orbit), size * 1.2, share * 6, '#ffffff', 1);
      return;
    }
    sparkle(context, at, size * (2 + hit * 3), hit * 2, '#ffffff', decay(Math.min(1, hit * 2)));
    orb(context, at, size * (1.4 + hit * 2), { ...paint, alpha: decay(hit) });
    for (const [tone, color] of PASTELS.entries()) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - tone * 0.12));

      if (held > 0) {
        ring(context, at, size * (1 + held * 3.6), {
          color,
          alpha: decay(held),
          width: 3 * stage.scale,
        });
      }
    }
    for (let pop = 0; pop < many(14, weight); pop += 1) {
      const angle = (pop / many(14, weight)) * Math.PI * 2 + spread(seed, pop + 30) * 0.3;
      const out = size * (1 + hit * 3.6);
      const spot: Point = [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8];

      if (pop % 2 === 0) {
        heart(context, spot, size * 0.34, { color: lighten(paint.color, 0.3), alpha: decay(hit) });
      } else {
        star(context, spot, size * 0.4, hit * 4, {
          color: PASTELS[pop % PASTELS.length],
          alpha: decay(hit),
        });
      }
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default zElements;
