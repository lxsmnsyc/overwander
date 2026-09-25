import type { Point } from '../../stage';
import {
  between,
  bolt,
  burst,
  decay,
  edge,
  fade,
  funnel,
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
  spiral,
  spread,
  swell,
} from '../__paint';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';
import { unleashed, zPower } from './z-power';

/** Guardian of Alola: the payoff share the guardian has risen by, and when each fist lands */
export const GUARDIAN_RISES = 0.3;
export const GUARDIAN_POUNDS = [0.42, 0.58, 0.74];

/** Soul-Stealing 7-Star Strike: the payoff share it has sunk into the shadow by, and the last blast */
export const SEVEN_SINKS = 0.15;
export const SEVEN_ENDS = 0.74;

/** Genesis Supernova: the payoff shares Mew has soared by, the sphere drops, and it bursts */
export const NOVA_RISES = 0.15;
export const NOVA_FALLS = 0.42;
export const NOVA_BURSTS = 0.52;

/** Light That Burns the Sky: the payoff shares the sun fires at and the light lands */
export const SKY_FIRES = 0.35;
export const SKY_LANDS = 0.45;

/** Searing Sunraze Smash: the payoff shares the sun charges at and strikes */
export const SUNRAZE_CHARGES = 0.28;
export const SUNRAZE_HITS = 0.58;

/** Menacing Moonraze Maelstrom: the payoff shares the void is open by and the beam lands */
export const MOONRAZE_OPEN = 0.28;
export const MOONRAZE_HITS = 0.45;

/** Splintered Stormshards: the payoff shares the spires rise from and shatter at */
export const STORM_RISES = 0.1;
export const STORM_BREAKS = 0.5;

/** Clangorous Soulblaze: the payoff shares the scales are loosed at and land */
export const SOULBLAZE_FIRES = 0.35;
export const SOULBLAZE_HITS = 0.5;

/** The four guardians' pastels: Koko, Lele, Bulu, Fini */
export const TAPU_TONES = ['#fff08a', '#ffb3de', '#ffc98a', '#b8e2ff'];
export const TAPU_SHELL = '#f8eeff';

/** Marshadow's green flame, the shadow it hides in, and the soul it takes */
export const SHADE_FLAME = '#5cff9a';
export const SHADE = '#140c1e';
export const SOUL = '#eafff2';

/** Mew's pink and the violet round it */
export const NOVA_PINK = '#ff7ad6';
export const NOVA_VIOLET = '#a46bff';

/** Ultra Necrozma's light, from the rim of the beam in */
export const PRISM = ['#9a6bff', '#5ab4ff', '#6aff8e', '#fff05a', '#ffa84a', '#ff5a6a'];
export const SKY_WHITE = '#fffbe8';

/** Solgaleo's sun and steel */
export const SUN_ORANGE = '#ff7a24';
export const SUN_GOLD = '#ffd24a';
export const SUN_STEEL = '#eef3fa';

/** Lunala's moonlight and the void behind it */
export const MOONLIGHT = '#ece6ff';
export const VOID = '#1a0a34';
export const MOON_VIOLET = '#8a4dff';

/** The pale wash that leaves the floor clean */
export const SCOURED = '#f2ede4';

/** Kommo-o's golden scales */
export const SCALE_GOLD = '#ffcf4a';

/** A four-pointed glint */
function glint(
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

/** A soft round of colour lying flat on the floor */
function wash(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  color: string,
  alpha: number,
): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  // Nested rounds rather than a gradient, which would be round rather than flat
  for (let layer = 0; layer < 3; layer += 1) {
    const out = radius * (1 - layer * 0.3);

    context.beginPath();
    context.ellipse(x, y, out, out * 0.34, 0, 0, Math.PI * 2);
    context.fillStyle = fade(color, alpha * 0.4);
    context.fill();
  }
}

/** A straight band of flat colour, for light drawn in layers */
function band(
  context: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  width: number,
  color: string,
  alpha: number,
): void {
  if (!(width > 0) || alpha <= 0) {
    return;
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(from[0], from[1]);
  context.lineTo(to[0], to[1]);
  context.stroke();
  context.lineCap = 'butt';
}

/** Cracks running out along the floor from a spot */
function cracks(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  count: number,
  seed: number,
  color: string,
  alpha: number,
  width: number,
): void {
  for (let crack = 0; crack < count; crack += 1) {
    const angle = (crack / count) * Math.PI * 2 + noise(seed, crack) * 0.5;
    const out = radius * (0.6 + noise(seed, crack + 20) * 0.4);

    bolt(
      context,
      [x, y],
      [x + Math.cos(angle) * out, y + Math.sin(angle) * out * 0.34],
      seed + crack,
      {
        color,
        alpha,
        width,
      },
    );
  }
}

const zLegends = {
  // A giant pastel guardian shell looming up behind the caster, its fists pounding down and cracking the ground
  Guardian(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const done = unleashed(share);
    const rise = Math.min(1, share / 0.2, done / GUARDIAN_RISES + 0.3);
    const kept = late(done, 0.85);
    const giant: Point = [stage.source[0], stage.source[1] - size * (1.5 + rise * 2.5)];
    const hands: Point[] = [
      [giant[0] - size * 3 * rise, giant[1] + size * 0.6],
      [giant[0] + size * 3 * rise, giant[1] + size * 0.6],
    ];

    orb(context, giant, size * 4.6 * rise, { color: TAPU_TONES[1], alpha: kept * 0.3 });
    for (const [side, start] of [Math.PI * 0.62, -Math.PI * 0.38].entries()) {
      sickle(context, giant, size * 2.6 * rise, start, start + Math.PI * 0.76, size * 1.3, {
        color: TAPU_SHELL,
        alpha: kept * 0.75,
      });
      sickle(context, giant, size * 2.6 * rise, start + 0.1, start + Math.PI * 0.66, size * 0.4, {
        color: TAPU_TONES[side * 2],
        alpha: kept * 0.8,
      });
    }
    edge(
      context,
      [giant[0], giant[1] - size],
      [giant[0], giant[1] - size * 3.4 * rise],
      size * 0.9,
      0,
      {
        color: TAPU_TONES[2],
        alpha: kept * 0.85,
      },
    );
    for (const side of [-1, 1]) {
      orb(context, [giant[0] + side * size * 0.6, giant[1] - size * 0.2], size * 0.4 * rise, {
        color: '#ffffff',
        alpha: kept,
      });
    }
    for (const hand of hands) {
      orb(context, hand, size * 0.9 * rise, { color: TAPU_SHELL, alpha: kept * 0.6 });
    }
    for (const [pound, lands] of GUARDIAN_POUNDS.entries()) {
      const fall = (done - lands + 0.1) / 0.1;
      const tone = TAPU_TONES[pound % TAPU_TONES.length];
      const hand = hands[pound % 2];

      if (fall > 0 && fall < 1) {
        const fist = between(hand, [at[0], at[1] - size * 0.2], fall * fall);

        edge(context, hand, fist, size * 1.2, 0, { color: TAPU_SHELL, alpha: 0.5 });
        orb(context, fist, size * 1.3, { color: tone, alpha: 1 });
        orb(context, fist, size * 0.6, { color: '#ffffff', alpha: 0.9 });
        continue;
      }
      if (fall < 1) {
        continue;
      }
      const hit = Math.min(1, (done - lands) / 0.3);

      cracks(
        context,
        foot,
        size * (2 + pound * 0.6),
        6,
        seed + pound,
        mix(tone, '#5b4a3a', 0.5),
        late(done, 0.8),
        2.4 * stage.scale,
      );
      orb(context, at, size * (1 + hit * 1.8), { color: tone, alpha: decay(hit) });
      glint(context, at, size * (1.2 + hit * 2.4), pound, '#ffffff', decay(Math.min(1, hit * 2)));
      ripple(context, foot, size * (0.8 + hit * 3.4), {
        color: tone,
        alpha: decay(hit),
        width: 3.2 * stage.scale,
      });
      shards(context, foot, size * 2.4, many(8, weight), seed + pound, hit, {
        color: mix(tone, '#7a6a58', 0.6),
        alpha: decay(hit),
      });
    }
  },

  // Sinking into its shadow, seven green-flamed blows out of the dark, and the soul drawn out of it
  SevenStar(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const done = unleashed(share);
    const sink = Math.min(1, done / SEVEN_SINKS);
    const kept = late(done, 0.85);
    const light = lighten(SHADE_FLAME, 0.5);

    wash(context, foot, size * 3 * Math.max(0.2, sink), SHADE, kept * 0.85);
    if (done < SEVEN_SINKS) {
      const home: Point = [stage.source[0], stage.source[1] + size * 0.9];

      edge(context, home, between(home, foot, sink), size * 0.7, 0, { color: SHADE, alpha: 0.8 });
      orb(context, between(home, foot, sink), size * 0.7, { color: SHADE_FLAME, alpha: 0.7 });
    }
    motes(context, foot, size * 2.4, many(10, weight), seed, (share * 1.5) % 1, {
      color: SHADE_FLAME,
      alpha: kept * sink * 0.8,
      width: 2 * stage.scale,
    });
    for (let blow = 0; blow < 7; blow += 1) {
      const start = SEVEN_SINKS + (blow / 7) * (SEVEN_ENDS - SEVEN_SINKS - 0.06);
      const angle = (blow / 7) * Math.PI * 2 * 3 + spread(seed, blow) * 0.3;
      const from: Point = [
        at[0] + Math.cos(angle) * size * 2.6,
        at[1] + Math.sin(angle) * size * 1.8,
      ];
      const thrown = (done - start) / 0.05;
      const impact = (done - start - 0.05) / 0.1;

      if (thrown > 0 && thrown < 1) {
        const fist = between(from, at, thrown);

        edge(context, from, fist, size * 0.6, 0, { color: SHADE, alpha: 0.8 });
        edge(context, from, fist, size * 0.24, 0, { color: SHADE_FLAME, alpha: 1 });
        orb(context, fist, size * 0.55, { color: light, alpha: 1 });
      }
      if (impact >= 0 && impact < 1) {
        glint(context, at, size * (0.8 + impact * 1.2), angle, '#ffffff', decay(impact));
        burst(context, at, size * 1.6, 8, seed + blow, {
          color: SHADE_FLAME,
          alpha: decay(impact),
          width: 2.6 * stage.scale,
        });
      }
    }
    if (done < SEVEN_ENDS) {
      return;
    }
    const blast = (done - SEVEN_ENDS) / (1 - SEVEN_ENDS);
    const soul: Point = [
      at[0] + Math.sin(blast * 7) * size * 0.4,
      at[1] - size * (0.4 + blast * 5),
    ];

    orb(context, at, size * (1.4 + blast * 2), { color: SHADE, alpha: decay(blast) * 0.8 });
    orb(context, at, size * (1 + blast * 1.4), { color: SHADE_FLAME, alpha: decay(blast) });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, blast * 1.6 - wave * 0.25));

      ring(context, at, size * (0.8 + held * 3), {
        color: wave % 2 === 0 ? SHADE_FLAME : SHADE,
        alpha: decay(held),
        width: 3.4 * stage.scale,
      });
    }
    edge(context, at, soul, size * 0.5, size * 0.3, { color: SOUL, alpha: decay(blast) * 0.6 });
    orb(context, soul, size * 0.7, { color: SOUL, alpha: swell(Math.min(1, blast * 1.5)) });
  },

  // Mew soaring up, a pink sphere swelling over the field, bursting on it, and the floor left psychic pink
  Supernova(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const done = unleashed(share);
    const high: Point = [
      (stage.source[0] + at[0]) / 2,
      Math.min(stage.source[1], at[1]) - size * 6,
    ];

    if (done < NOVA_RISES) {
      const up = done / NOVA_RISES;

      edge(context, stage.source, between(stage.source, high, up), size * 0.4, size, {
        color: NOVA_PINK,
        alpha: 0.8,
      });
    }
    if (done < NOVA_BURSTS) {
      const swollen = Math.min(1, share / 0.3, done / NOVA_FALLS + 0.2);
      const fall = Math.max(0, (done - NOVA_FALLS) / (NOVA_BURSTS - NOVA_FALLS));
      const sphere = between(high, at, fall * fall);
      const radius = size * 2.8 * swollen;

      orb(context, sphere, radius * 1.5, { color: NOVA_VIOLET, alpha: 0.4 });
      orb(context, sphere, radius, { color: NOVA_PINK, alpha: 0.9 });
      spiral(context, sphere, radius * 1.3, 2, share * 3, {
        color: lighten(NOVA_PINK, 0.5),
        alpha: 0.7,
        width: 2 * stage.scale,
      });
      motes(context, sphere, radius * 2 * (1 - swollen * 0.6), many(14, weight), seed, swollen, {
        color: NOVA_VIOLET,
        alpha: 0.8,
        width: 2.2 * stage.scale,
      });
      wash(context, foot, size * 3 * fall, NOVA_PINK, fall * 0.5);
      return;
    }
    const blast = (done - NOVA_BURSTS) / (1 - NOVA_BURSTS);
    const kept = late(blast, 0.6);

    wash(context, foot, size * (3 + blast * 5), NOVA_PINK, kept * 0.55);
    orb(context, at, size * (3 + swell(Math.min(1, blast * 2)) * 2), {
      color: NOVA_PINK,
      alpha: decay(Math.min(1, blast * 1.3)),
    });
    orb(context, at, size * 1.8, { color: '#ffffff', alpha: decay(Math.min(1, blast * 2.5)) });
    glint(context, at, size * (3 + blast * 4), blast, '#ffffff', decay(Math.min(1, blast * 1.8)));
    for (let wave = 0; wave < 4; wave += 1) {
      const held = Math.max(0, Math.min(1, blast * 1.8 - wave * 0.22));

      ring(context, at, size * (1 + held * 5), {
        color: wave % 2 === 0 ? NOVA_PINK : NOVA_VIOLET,
        alpha: decay(held),
        width: 3.6 * stage.scale,
      });
      ripple(context, foot, size * (1 + held * 6), {
        color: NOVA_PINK,
        alpha: decay(held) * 0.8,
        width: 3 * stage.scale,
      });
    }
    burst(context, at, size * (3 + blast * 3), 18, seed, {
      color: lighten(NOVA_PINK, 0.5),
      alpha: decay(blast),
      width: 3 * stage.scale,
    });
  },

  // Blinding light gathered into a sun over it, then a prismatic column slamming down
  Skyburn(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const done = unleashed(share);
    const sun: Point = [at[0], at[1] - size * 7];
    const charge = Math.min(1, share / 0.3, done / SKY_FIRES + 0.2);
    const kept = late(done, 0.75);

    orb(context, sun, size * 3 * charge, { color: SUN_GOLD, alpha: kept * 0.5 });
    orb(context, sun, size * 1.8 * charge, { color: SKY_WHITE, alpha: kept });
    for (const [tone, color] of PRISM.entries()) {
      ring(context, sun, size * (2 + tone * 0.25) * charge, {
        color,
        alpha: kept * 0.6,
        width: 2 * stage.scale,
      });
    }
    burst(context, sun, size * 4 * charge, 16, seed, {
      color: SKY_WHITE,
      alpha: kept * 0.8,
      width: 2.6 * stage.scale,
    });
    if (done < SKY_FIRES) {
      for (let mote = 0; mote < many(12, weight); mote += 1) {
        const held = (share * 1.6 + noise(seed, mote)) % 1;
        const from: Point = [stage.source[0] + spread(seed, mote) * size * 2, stage.source[1]];

        orb(context, between(from, sun, held), size * 0.3, {
          color: PRISM[mote % PRISM.length],
          alpha: swell(held),
        });
      }
      return;
    }
    const drawn = Math.min(1, (done - SKY_FIRES) / (SKY_LANDS - SKY_FIRES));
    const head = between(sun, foot, drawn);
    const thick = late(done, 0.7);

    for (const [tone, color] of PRISM.entries()) {
      band(context, sun, head, size * (3.2 - tone * 0.35) * thick, color, thick * 0.7);
    }
    band(context, sun, head, size * 0.9 * thick, SKY_WHITE, thick);
    if (done < SKY_LANDS) {
      return;
    }
    const hit = (done - SKY_LANDS) / (1 - SKY_LANDS);

    wash(context, foot, size * (2 + hit * 3), SKY_WHITE, late(hit, 0.4) * 0.7);
    orb(context, at, size * (1.6 + hit * 2), { color: SKY_WHITE, alpha: decay(hit) });
    glint(context, at, size * (2 + hit * 3), 0, '#ffffff', decay(Math.min(1, hit * 2)));
    for (const [tone, color] of PRISM.entries()) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - tone * 0.08));

      ripple(context, foot, size * (1 + held * 4), {
        color,
        alpha: decay(held) * 0.8,
        width: 2.6 * stage.scale,
      });
    }
  },

  // The caster rising as a blazing steel-bright sun and charging down on it in an arc of fire
  Sunraze(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const done = unleashed(share);
    const lift: Point = [stage.source[0], stage.source[1] - size * 3];
    const place = (along: number): Point => {
      const spot = between(lift, at, along);

      return [spot[0], spot[1] - Math.sin(Math.PI * along) * size * 4];
    };

    if (done < SUNRAZE_HITS) {
      const up = Math.min(1, share / 0.3, done / SUNRAZE_CHARGES + 0.2);
      const along = Math.max(0, (done - SUNRAZE_CHARGES) / (SUNRAZE_HITS - SUNRAZE_CHARGES));
      const head = along > 0 ? place(along * along) : between(stage.source, lift, up);

      if (along > 0) {
        const tail = place(Math.max(0, along * along - 0.3));

        edge(context, tail, head, size * 2.4, 0, { color: SUN_ORANGE, alpha: 0.6 });
        edge(context, tail, head, size * 1, 0, { color: SUN_GOLD, alpha: 0.9 });
        motes(context, head, size * 2, many(12, weight), seed, along, {
          color: SUN_GOLD,
          alpha: 0.9,
          width: 2.4 * stage.scale,
        });
      }
      orb(context, head, size * 2.6 * up, { color: SUN_ORANGE, alpha: 0.6 });
      burst(context, head, size * 3 * up, 12, seed + Math.floor(share * 20), {
        color: SUN_GOLD,
        alpha: 0.8,
        width: 3 * stage.scale,
      });
      orb(context, head, size * 1.4 * up, { color: SUN_STEEL, alpha: 1 });
      ring(context, head, size * 1.5 * up, {
        color: SUN_STEEL,
        alpha: 0.9,
        width: 3 * stage.scale,
      });
      return;
    }
    const hit = (done - SUNRAZE_HITS) / (1 - SUNRAZE_HITS);

    wash(context, foot, size * (2 + hit * 2.4), SUN_ORANGE, late(hit, 0.5) * 0.6);
    orb(context, at, size * (2 + hit * 2.4), { color: SUN_ORANGE, alpha: decay(hit) });
    orb(context, at, size * 1.4, { color: SUN_STEEL, alpha: decay(Math.min(1, hit * 2)) });
    glint(context, at, size * (2 + hit * 3), hit, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      ring(context, at, size * (1 + held * 3.4), {
        color: wave === 1 ? SUN_STEEL : SUN_GOLD,
        alpha: decay(held),
        width: 3.4 * stage.scale,
      });
    }
    burst(context, at, size * (2.6 + hit * 2.4), 16, seed, {
      color: SUN_GOLD,
      alpha: decay(hit),
      width: 3.2 * stage.scale,
    });
    motes(context, foot, size * 3.4, many(16, weight), seed, hit, {
      color: SUN_ORANGE,
      alpha: late(hit, 0.4),
      width: 2.4 * stage.scale,
    });
  },

  // A crescent moon over a dark violet void, and a spiralling maelstrom of moonlight driven down on it
  Moonraze(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const done = unleashed(share);
    const open = Math.min(1, share / 0.3, done / MOONRAZE_OPEN + 0.2);
    const kept = late(done, 0.8);
    const sky: Point = [
      stage.source[0] + (at[0] - stage.source[0]) * 0.3,
      Math.min(stage.source[1], at[1]) - size * 5.5,
    ];

    orb(context, sky, size * 4 * open, { color: MOON_VIOLET, alpha: kept * 0.4 });
    orb(context, sky, size * 2.6 * open, { color: VOID, alpha: kept * 0.95 });
    for (let star = 0; star < 8; star += 1) {
      glint(
        context,
        [
          sky[0] + spread(seed, star) * size * 1.8 * open,
          sky[1] + spread(seed, star + 9) * size * 1.8 * open,
        ],
        size * 0.25 * swell((share * 2 + noise(seed, star)) % 1),
        0,
        MOONLIGHT,
        kept,
      );
    }
    sickle(context, sky, size * 2.4 * open, -Math.PI * 0.35, Math.PI * 0.95, size * 1.1, {
      color: MOONLIGHT,
      alpha: kept,
    });
    ring(context, sky, size * 2.9 * open, {
      color: MOON_VIOLET,
      alpha: kept,
      width: 3 * stage.scale,
    });
    if (done < MOONRAZE_OPEN * 0.8) {
      return;
    }
    const drawn = Math.min(1, (done - MOONRAZE_OPEN * 0.8) / (MOONRAZE_HITS - MOONRAZE_OPEN * 0.8));
    const thick = late(done, 0.7);

    funnel(context, sky, at, drawn, 4, size * 1.6 * thick, share * 20, {
      color: MOON_VIOLET,
      alpha: thick,
      width: 3.4 * stage.scale,
    });
    band(context, sky, between(sky, at, drawn), size * 1.4 * thick, MOON_VIOLET, thick * 0.5);
    band(context, sky, between(sky, at, drawn), size * 0.5 * thick, MOONLIGHT, thick);
    if (done < MOONRAZE_HITS) {
      return;
    }
    const hit = (done - MOONRAZE_HITS) / (1 - MOONRAZE_HITS);

    orb(context, at, size * (1.6 + hit * 1.6), { color: VOID, alpha: late(hit, 0.5) * 0.8 });
    spiral(context, at, size * (2.4 + hit), 3, share * 4, {
      color: MOONLIGHT,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = Math.max(0, Math.min(1, hit * 1.6 - wave * 0.25));

      ring(context, at, size * (0.8 + held * 3), {
        color: wave % 2 === 0 ? MOON_VIOLET : MOONLIGHT,
        alpha: decay(held),
        width: 3 * stage.scale,
      });
    }
    glint(context, at, size * (1.6 + hit * 2), share, '#ffffff', decay(Math.min(1, hit * 2)));
  },

  // A ring of jagged spires bursting up round it and shattering, and a wave scouring the floor clean
  Stormshards(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.9];
    const done = unleashed(share);
    const rock = mix(paint.color, '#5e4c3c', 0.35);
    const face = lighten(paint.color, 0.4);
    const crack = Math.min(1, share / 0.3, done / STORM_RISES + 0.3);
    const spires = many(9, weight);

    ripple(context, foot, size * (1 + crack * 1.6), {
      color: rock,
      alpha: late(done, 0.5) * 0.8,
      width: 3 * stage.scale,
    });
    cracks(context, foot, size * 2.6 * crack, 7, seed, rock, late(done, 0.5), 2.2 * stage.scale);
    if (done < STORM_BREAKS) {
      const grow = Math.max(0, (done - STORM_RISES) / (STORM_BREAKS - STORM_RISES));

      for (let spire = 0; spire < spires; spire += 1) {
        const angle = (spire / spires) * Math.PI * 2 + noise(seed, spire) * 0.4;
        const base: Point = [
          foot[0] + Math.cos(angle) * size * 2.2,
          foot[1] + Math.sin(angle) * size * 0.75,
        ];
        const tall =
          size *
          (2.6 + noise(seed, spire + 10) * 2) *
          Math.min(1, grow * 2.5 - (spire / spires) * 0.6);

        if (tall <= 0) {
          continue;
        }
        const tip: Point = [base[0] - Math.cos(angle) * size * 0.8, base[1] - tall];

        edge(context, base, tip, size * 0.9, spread(seed, spire + 20) * size * 0.3, {
          color: rock,
          alpha: 1,
        });
        edge(context, base, between(base, tip, 0.8), size * 0.3, 0, { color: face, alpha: 0.9 });
      }
      return;
    }
    const broken = (done - STORM_BREAKS) / (1 - STORM_BREAKS);

    shards(context, [at[0], foot[1] - size * 1.6], size * 4, many(18, weight), seed, broken, {
      color: rock,
      alpha: late(broken, 0.5),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.6, many(10, weight), seed + 3, broken, {
      color: face,
      alpha: decay(broken),
    });
    orb(context, at, size * (1.2 + broken * 1.6), {
      color: face,
      alpha: decay(Math.min(1, broken * 1.6)),
    });
    glint(context, at, size * (1.4 + broken * 2), 0.4, '#ffffff', decay(Math.min(1, broken * 2.5)));
    burst(context, at, size * (2 + broken * 2), 14, seed, {
      color: face,
      alpha: decay(broken),
      width: 3 * stage.scale,
    });
    for (let wave = 0; wave < 2; wave += 1) {
      const held = Math.max(0, Math.min(1, broken * 1.4 - wave * 0.3));

      wash(context, foot, size * (1 + held * 7), SCOURED, swell(held) * 0.5);
      ripple(context, foot, size * (1 + held * 7), {
        color: SCOURED,
        alpha: decay(held),
        width: 3.4 * stage.scale,
      });
    }
  },

  // A dance of clanging golden scales, then a blast of scale energy bursting over it in rings of every colour
  Soulblaze(context, stage, share, { paint, seed, weight }) {
    zPower(context, stage, share, paint.color, seed);

    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const done = unleashed(share);
    const light = lighten(SCALE_GOLD, 0.5);

    if (done < SOULBLAZE_FIRES + 0.1) {
      const kept = done < SOULBLAZE_FIRES ? 1 : decay((done - SOULBLAZE_FIRES) / 0.1);
      const shown = Math.min(1, share / 0.3) * kept;

      for (let scale = 0; scale < 8; scale += 1) {
        const angle = (scale / 8) * Math.PI * 2 + share * 8;
        const spot: Point = [
          stage.source[0] + Math.cos(angle) * size * 1.8,
          stage.source[1] + Math.sin(angle) * size * 0.8 - size * 0.4,
        ];

        edge(context, spot, [spot[0], spot[1] - size * 0.7], size * 0.5, 0, {
          color: SCALE_GOLD,
          alpha: shown,
        });
        glint(context, spot, size * 0.35 * swell((share * 4 + scale / 8) % 1), 0, '#ffffff', shown);
      }
      for (let clang = 0; clang < 4; clang += 1) {
        const held = (share * 3 + clang / 4) % 1;

        ring(context, stage.source, size * (1 + held * 3), {
          color: clang % 2 === 0 ? SCALE_GOLD : PRISM[clang],
          alpha: decay(held) * shown,
          width: 3 * stage.scale,
        });
      }
    }
    if (done < SOULBLAZE_FIRES) {
      return;
    }
    if (done < SOULBLAZE_HITS) {
      const flight = (done - SOULBLAZE_FIRES) / (SOULBLAZE_HITS - SOULBLAZE_FIRES);
      const head = between(stage.source, at, flight);

      for (let scale = 0; scale < many(7, weight); scale += 1) {
        const back = between(
          stage.source,
          at,
          Math.max(0, flight - 0.25 - noise(seed, scale) * 0.2),
        );
        const off = spread(seed, scale + 5) * size * 0.8;

        edge(context, [back[0], back[1] + off], [head[0], head[1] + off * 0.3], size * 0.4, 0, {
          color: SCALE_GOLD,
          alpha: 0.8,
        });
      }
      orb(context, head, size * 1.4, { color: light, alpha: 1 });
      return;
    }
    const hit = (done - SOULBLAZE_HITS) / (1 - SOULBLAZE_HITS);

    orb(context, at, size * (1.6 + swell(Math.min(1, hit * 2)) * 1.6), {
      color: SCALE_GOLD,
      alpha: decay(Math.min(1, hit * 1.3)),
    });
    glint(context, at, size * (2 + hit * 3), hit, '#ffffff', decay(Math.min(1, hit * 2)));
    for (const [tone, color] of PRISM.entries()) {
      const held = Math.max(0, Math.min(1, hit * 1.8 - tone * 0.12));

      ring(context, at, size * (0.8 + held * 4), {
        color,
        alpha: decay(held),
        width: 3 * stage.scale,
      });
    }
    for (let resonance = 0; resonance < 3; resonance += 1) {
      const held = (hit * 2.5 + resonance / 3) % 1;

      ring(context, at, size * (1 + held * 2), {
        color: SCALE_GOLD,
        alpha: decay(held) * late(hit, 0.5),
        width: 2.4 * stage.scale,
      });
    }
    shards(context, at, size * 3.4, many(14, weight), seed, hit, {
      color: SCALE_GOLD,
      alpha: decay(hit),
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default zLegends;
