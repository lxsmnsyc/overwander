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
  funnel,
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
import {
  GMAX_DARK,
  GMAX_MAGENTA,
  blot,
  cloudOver,
  fist,
  flame,
  gMaxPower,
  gigantic,
  strand,
  stretch,
  zee,
} from './g-max-power';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** G-Max Drum Solo: the shares of the payoff each drumbeat is struck, and how long its shock takes to cross */
export const DRUM_BEATS = [0, 0.16, 0.32, 0.48];
export const DRUM_CROSS = 0.16;

/** G-Max Fireball: the share of the payoff the ball lands */
export const FIREBALL_LANDS = 0.42;

/** G-Max Hydrosnipe: the share of the payoff the shot is fired, and the share it strikes */
export const SNIPE_FIRES = 0.38;
export const SNIPE_HITS = 0.46;

/** G-Max Stonesurge and Steelsurge: the share of the payoff the pieces are thrown, and the share they settle */
export const SURGE_THROWN = 0.2;
export const SURGE_SETTLES = 0.5;

/** G-Max Volcalith: how many spires erupt round the target */
export const SPIRES = 6;

/** G-Max Tartness and Sweetness: the share of the payoff the fruit or the syrup lands */
export const FRUIT_LANDS = 0.28;

/** G-Max Centiferno: how many segments the fire coil is drawn from, and the share it has closed by */
export const COIL_SEGMENTS = 22;
export const COIL_CLOSES = 0.4;

/** G-Max One Blow: the share of the payoff the fist comes down */
export const ONE_BLOW_LANDS = 0.32;

/** G-Max Rapid Flow: the shares of the payoff each water fist lands */
export const FLOW_FISTS = [0.12, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68];

export const DRUM_GREEN = '#5ac04a';
export const DRUM_WOOD = '#8a5a34';
export const ROOT_BROWN = '#6a4a2a';
export const FIREBALL = '#ff6a1a';
export const FIREBALL_HOT = '#ffe07a';
export const SNIPE_BLUE = '#4ab4ff';
export const WIND = '#c8dcf0';
export const CORVIKNIGHT = '#33406e';
export const GRAVITY = '#8a6aff';
export const GRAVITY_DARK = '#1a1036';
export const DREDNAW_WATER = '#4aa0ff';
export const STONE = '#8a7a66';
export const SPIRE_ROCK = '#4a3a34';
export const MAGMA = '#ff6a1a';
export const APPLE_RED = '#e0403a';
export const APPLE_GREEN = '#8ac83a';
export const ACID = '#b8d828';
export const NECTAR = '#ffb23a';
export const HONEY = '#ffd27a';
export const SAND = '#c8a060';
export const TOXIC_PURPLE = '#a84aff';
export const SHOCK_YELLOW = '#ffe84a';
export const CENTI_FIRE = '#ff7a1a';
export const CENTI_BODY = '#7a2a10';
export const SMITE_PINK = '#ff9ad8';
export const SNOOZE_HAZE = '#9a7ad0';
export const GRIMMSNARL = '#3a1a4a';
export const CREAM = '#fff0f5';
export const CREAM_PINK = '#ffb3d0';
export const SPRINKLE_TONES = ['#ff5a8a', '#5ad0ff', '#ffe04a', '#7ae07a', '#c08aff'];
export const COPPER = '#d0805a';
export const STEEL = '#d4dbe4';
export const DRAIN_CYAN = '#5ae0ff';
export const DURALUDON = '#9aa8c8';
export const ONE_DARK = '#26222e';
export const ONE_RED = '#ff4a3a';
export const FLOW_BLUE = '#3ab0ff';

/** Where the floor is under a body */
function footOf(at: Point, size: number): Point {
  return [at[0], at[1] + size * 0.9];
}

/** A jagged stone: five corners round a middle, turned */
function rock(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  color: string,
  alpha: number,
): void {
  context.beginPath();
  for (let corner = 0; corner < 5; corner += 1) {
    const angle = turn + (corner / 5) * Math.PI * 2;
    const out = size * (corner % 2 === 0 ? 1 : 0.6);

    context[corner === 0 ? 'moveTo' : 'lineTo'](
      x + Math.cos(angle) * out,
      y + Math.sin(angle) * out,
    );
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** A spike standing out of the floor, leaning: wide at its foot and pointed at its tip */
function spike(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  height: number,
  lean: number,
  width: number,
  color: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  context.beginPath();
  context.moveTo(x - width, y);
  context.lineTo(x + Math.sin(lean) * height, y - Math.cos(lean) * height);
  context.lineTo(x + width, y);
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
}

/** Where a piece thrown out of a spot to a ring round it is, arcing over */
function arced(from: Point, to: Point, along: number, height: number): Point {
  const [x, y] = between(from, to, along);

  return [x, y - Math.sin(Math.PI * along) * height];
}

const gMaxGalar = {
  // Rillaboom's drum beating shockwaves across the field, and roots bursting up round the target
  GMaxDrumSolo(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    // Rillaboom's drum and the beats leaving it are sized to the caster, not to the blow
    const near = REACH * stage.scale;
    const home = footOf(stage.source, near);
    const kept = late(go, 0.85);
    const drum = Math.min(1, go * 6) * late(go, 0.7);
    let thump = 1;

    for (const beat of DRUM_BEATS) {
      if (go >= beat && go < beat + 0.05) {
        thump = 0.85;
      }
    }

    // Beside the caster rather than over it
    const stand = home[0] + near * 1.6;

    blot(context, [stand, home[1] - near * 0.7], near * 0.9, near * 0.75, DRUM_WOOD, drum);
    blot(
      context,
      [stand, home[1] - near * 1.3],
      near * 0.95 * thump,
      near * 0.4,
      lighten(DRUM_GREEN, 0.4),
      drum,
    );
    for (const beat of DRUM_BEATS) {
      const cross = stretch(go, beat, beat + DRUM_CROSS);
      const after = stretch(go, beat + DRUM_CROSS, beat + DRUM_CROSS + 0.25);

      if (cross > 0 && cross < 1) {
        ripple(context, home, near * (1.4 + cross * 2), {
          color: DRUM_GREEN,
          alpha: decay(cross),
          width: 3 * stage.scale,
        });
        ripple(context, between(home, foot, cross), near * 1.2 + size * cross, {
          color: lighten(DRUM_GREEN, 0.3),
          alpha: 0.9,
          width: 4 * stage.scale,
        });
      }
      if (after > 0 && after < 1) {
        ripple(context, foot, size * (1 + after * 3), {
          color: DRUM_GREEN,
          alpha: decay(after),
          width: 4 * stage.scale,
        });
        orb(context, at, size * 1.4, { color: DRUM_GREEN, alpha: decay(after) * 0.5 });
      }
    }
    for (let root = 0; root < 5; root += 1) {
      const grow = stretch(go, 0.3 + root * 0.06, 0.55 + root * 0.06);

      if (grow <= 0) {
        continue;
      }
      const angle = (root / 5) * Math.PI * 2 + 0.4;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 1.6,
        foot[1] + Math.sin(angle) * size * 0.5,
      ];
      const points: Point[] = [base];

      for (let joint = 1; joint <= 4; joint += 1) {
        points.push([
          base[0] + Math.sin(joint * 0.9 + root) * size * 0.35,
          base[1] - joint * size * 0.8 * grow,
        ]);
      }
      strand(context, points, size * 1.3, ROOT_BROWN, kept);
      strand(context, points, size * 0.3, DRUM_GREEN, kept * 0.8);
    }
  },

  // Cinderace kicking a giant flaming ball in a high arc that bursts on the target
  GMaxFireball(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);

    if (go < FIREBALL_LANDS) {
      const flight = go / FIREBALL_LANDS;

      for (let trail = 5; trail >= 1; trail -= 1) {
        orb(
          context,
          arced(stage.source, at, Math.max(0, flight - trail * 0.05), size * 4),
          size * (1.6 - trail * 0.2),
          {
            color: FIREBALL,
            alpha: (1 - trail / 6) * 0.6,
          },
        );
      }
      const ball = arced(stage.source, at, flight, size * 4);

      orb(context, ball, size * 2.4, { color: FIREBALL, alpha: 0.8 });
      blot(context, ball, size * 1.2, size * 1.2, FIREBALL_HOT, 1);
      hoop(context, ball, size * 1.2, Math.abs(Math.cos(flight * 12)), 0.4, {
        color: FIREBALL,
        alpha: 1,
        width: 2.4 * stage.scale,
      });
      return;
    }
    const hit = (go - FIREBALL_LANDS) / (1 - FIREBALL_LANDS);

    orb(context, at, size * (2 + hit * 3), { color: FIREBALL, alpha: decay(hit) * 0.7 });
    orb(context, at, size * (1.4 + hit), {
      color: FIREBALL_HOT,
      alpha: decay(Math.min(1, hit * 1.8)),
    });
    ring(context, at, size * (1.2 + hit * 4), {
      color: FIREBALL_HOT,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    for (let tongue = 0; tongue < 10; tongue += 1) {
      const angle = (tongue / 10) * Math.PI * 2;
      const out = size * (1 + hit * 2.6);

      flame(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.3],
        size * 1.6 * late(hit, 0.3),
        FIREBALL,
        1,
      );
    }
    shards(context, at, size * 4, many(12, weight), seed, hit, {
      color: FIREBALL_HOT,
      alpha: decay(hit),
      width: 2.6 * stage.scale,
    });
  },

  // Inteleon's sight settling on the target, then one thin shot of water straight through it
  GMaxHydrosnipe(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const aim = stretch(go, 0, SNIPE_FIRES);
    const sight = late(go, SNIPE_HITS);
    const muzzle: Point = [stage.source[0], stage.source[1] - size * 0.6];
    const beyond: Point = [at[0] + (at[0] - muzzle[0]) * 0.6, at[1] + (at[1] - muzzle[1]) * 0.6];

    edge(context, muzzle, at, size * 0.04, 0, { color: SNIPE_BLUE, alpha: sight * 0.5 });
    ring(context, at, size * (1.2 + (1 - aim) * 2.6), {
      color: SNIPE_BLUE,
      alpha: sight,
      width: 2 * stage.scale,
    });
    ring(context, at, size * 0.3, { color: '#ffffff', alpha: sight, width: 2 * stage.scale });
    for (let hair = 0; hair < 4; hair += 1) {
      const angle = (hair / 4) * Math.PI * 2 + (1 - aim) * 0.8;
      const near = size * 0.5;
      const far = size * (1.8 + (1 - aim) * 2.6);

      edge(
        context,
        [at[0] + Math.cos(angle) * near, at[1] + Math.sin(angle) * near],
        [at[0] + Math.cos(angle) * far, at[1] + Math.sin(angle) * far],
        size * 0.06,
        0,
        { color: '#ffffff', alpha: sight },
      );
    }
    const shot = stretch(go, SNIPE_FIRES, SNIPE_HITS);

    if (shot > 0) {
      const shown = late(go, 0.6);

      beam(context, muzzle, beyond, shot, size * 0.45, { color: SNIPE_BLUE, alpha: shown });
      ring(context, muzzle, size * (0.6 + shot * 1.4), {
        color: lighten(SNIPE_BLUE, 0.5),
        alpha: decay(shot),
        width: 3 * stage.scale,
      });
    }
    const hit = stretch(go, SNIPE_HITS, 1);

    if (hit > 0) {
      orb(context, at, size * (1.2 + hit * 1.6), { color: SNIPE_BLUE, alpha: decay(hit) * 0.7 });
      ring(context, at, size * (0.8 + hit * 3), {
        color: lighten(SNIPE_BLUE, 0.6),
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      shards(context, at, size * 3, many(10, weight), seed, hit, {
        color: lighten(SNIPE_BLUE, 0.4),
        alpha: decay(hit),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Corviknight's gale tearing across the field, dark steel feathers whirling in it
  GMaxWindRage(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const blow = Math.min(1, go * 5) * late(go, 0.75);

    funnel(context, stage.source, at, Math.min(1, go * 3), 4, size * 1.6, share * 14, {
      color: WIND,
      alpha: blow * 0.7,
      width: 3 * stage.scale,
    });
    for (let gust = 0; gust < many(12, weight); gust += 1) {
      const run = (go * 2.2 + noise(seed, gust)) % 1;
      const y = at[1] + spread(seed, gust + 20) * size * 2.4;
      const x = at[0] + (run - 0.5) * size * 12;

      edge(
        context,
        [x - size * 1.6, y],
        [x + size * 1.6, y],
        size * 0.12,
        spread(seed, gust + 40) * size * 0.4,
        {
          color: WIND,
          alpha: blow * swell(run),
        },
      );
    }
    for (let feather = 0; feather < many(10, weight); feather += 1) {
      const turn = share * 9 + noise(seed, feather) * Math.PI * 2;
      const out = size * (1 + noise(seed, feather + 30) * 2);

      petal(
        context,
        [at[0] + Math.cos(turn) * out, at[1] + Math.sin(turn) * out * 0.5],
        size * 0.4,
        turn * 2,
        {
          color: CORVIKNIGHT,
          alpha: blow,
        },
      );
    }
    // Whatever was laid on the field swept off it
    const sweep = stretch(go, 0.3, 1);

    for (let wave = 0; wave < 3; wave += 1) {
      const held = stretch(sweep, wave * 0.15, wave * 0.15 + 0.6);

      ripple(context, [foot[0] + held * size * 5, foot[1]], size * (1.4 + held * 1.4), {
        color: WIND,
        alpha: swell(held) * 0.7,
        width: 2.6 * stage.scale,
      });
    }
  },

  // Orbeetle's gravity well opening under the target, dragging everything round it in and down
  GMaxGravitas(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const open = stretch(go, 0, 0.25);
    const kept = late(go, 0.8);

    blot(context, foot, size * 3 * open, size * 1 * open, GRAVITY_DARK, kept * 0.85);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = (go * 1.8 + wave / 3) % 1;

      ripple(context, foot, size * 3.6 * (1 - held), {
        color: GRAVITY,
        alpha: kept * swell(held),
        width: 3 * stage.scale,
      });
    }
    for (let press = 0; press < 2; press += 1) {
      const held = (go * 1.5 + press / 2) % 1;

      ripple(context, [at[0], at[1] - size * 3 + held * size * 3.9], size * (2.4 - held * 0.6), {
        color: lighten(GRAVITY, 0.4),
        alpha: kept * swell(held),
        width: 3.4 * stage.scale,
      });
    }
    for (let mote = 0; mote < many(18, weight); mote += 1) {
      const pull = (go * 1.2 + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 20) * Math.PI * 2 + pull * Math.PI * 3;
      const out = size * 3.6 * (1 - pull);

      star(
        context,
        [
          foot[0] + Math.cos(angle) * out,
          foot[1] + Math.sin(angle) * out * 0.33 - (1 - pull) * size * 1.4,
        ],
        size * 0.2,
        0,
        {
          color: lighten(GRAVITY, 0.6),
          alpha: kept * swell(pull),
        },
      );
    }
    orb(context, foot, size * 1.4, { color: GRAVITY, alpha: kept * 0.5 });
  },

  // Drednaw's water bursting up under the target and jagged stones scattered to hover round it
  GMaxStonesurge(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const geyser = stretch(go, 0, 0.35);

    if (geyser < 1) {
      beam(
        context,
        foot,
        [foot[0], foot[1] - size * 5],
        Math.min(1, geyser * 2),
        size * 1.6 * decay(geyser),
        {
          color: DREDNAW_WATER,
          alpha: 0.9,
        },
      );
      ring(context, at, size * (1 + geyser * 3), {
        color: lighten(DREDNAW_WATER, 0.4),
        alpha: decay(geyser),
        width: 3 * stage.scale,
      });
    }
    scattered(context, stage, share, seed, weight, STONE, 'rock');
  },

  // Coalossal's rock spires erupting out of the ground round the target, magma glowing at their feet
  GMaxVolcalith(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const kept = late(go, 0.8);

    blot(
      context,
      foot,
      size * 3.6 * Math.min(1, go * 4),
      size * 1.1 * Math.min(1, go * 4),
      MAGMA,
      kept * 0.4,
    );
    // The back of the ring first, so the front ones stand in front of the target
    for (let spire = 0; spire <= SPIRES; spire += 1) {
      const angle = spire === SPIRES ? 0 : (spire / SPIRES) * Math.PI * 2 + 0.3;
      const out = spire === SPIRES ? 0 : size * 2.4;
      const base: Point = [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.33];
      const rise = stretch(go, noise(seed, spire) * 0.3, noise(seed, spire) * 0.3 + 0.15);

      if (rise <= 0) {
        continue;
      }
      const tall =
        size *
        (spire === SPIRES ? 4 : 2.4 + noise(seed, spire + 10) * 1.6) *
        Math.min(1, rise * 1.2);

      orb(context, base, size * 1.2, { color: MAGMA, alpha: kept * 0.7 });
      spike(context, base, tall, spread(seed, spire + 20) * 0.3, size * 0.7, SPIRE_ROCK, kept);
      spike(
        context,
        base,
        tall * 0.4,
        spread(seed, spire + 20) * 0.3,
        size * 0.3,
        MAGMA,
        kept * 0.9,
      );
      if (rise < 1) {
        shards(context, base, size * 2.4, 5, seed + spire, rise, {
          color: SPIRE_ROCK,
          alpha: decay(rise),
          width: 2.6 * stage.scale,
        });
      }
    }
    motes(context, at, size * 3.4, many(12, weight), seed, go, {
      color: lighten(MAGMA, 0.4),
      alpha: kept,
      width: 2 * stage.scale,
    });
  },

  // Flapple's sour apple bursting over the target and spraying acid down onto it
  GMaxTartness(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);
    // Bursts just over the target, below the cloud it fell from
    const over: Point = [at[0], at[1] - REACH * stage.scale * 1.8];

    if (go < FRUIT_LANDS) {
      const fall = go / FRUIT_LANDS;
      const apple: Point = [at[0], top[1] + (over[1] - top[1]) * fall];

      blot(context, apple, size * 1.3, size * 1.2, APPLE_RED, 1);
      blot(
        context,
        [apple[0] - size * 0.4, apple[1] - size * 0.3],
        size * 0.5,
        size * 0.4,
        APPLE_GREEN,
        0.9,
      );
      petal(context, [apple[0] + size * 0.3, apple[1] - size * 1.3], size * 0.4, 0.8, {
        color: APPLE_GREEN,
        alpha: 1,
      });
      return;
    }
    const spray = (go - FRUIT_LANDS) / (1 - FRUIT_LANDS);

    orb(context, over, size * (1.4 + spray * 2), { color: ACID, alpha: decay(spray) * 0.6 });
    shards(context, over, size * 2.4, 6, seed, spray, {
      color: APPLE_RED,
      alpha: decay(spray),
      width: 3 * stage.scale,
    });
    for (let drop = 0; drop < many(18, weight); drop += 1) {
      const fly = stretch(spray, noise(seed, drop) * 0.3, noise(seed, drop) * 0.3 + 0.45);
      const angle = noise(seed, drop + 10) * Math.PI * 2;
      const land: Point = [
        foot[0] + Math.cos(angle) * size * (0.5 + noise(seed, drop + 20) * 2.6),
        foot[1] + Math.sin(angle) * size * 0.6,
      ];

      if (fly > 0 && fly < 1) {
        const [x, y] = between(over, land, fly);

        petal(context, [x, y - Math.sin(Math.PI * fly) * size * 1.2], size * 0.22, Math.PI, {
          color: ACID,
          alpha: 1,
        });
      } else if (fly >= 1) {
        const splat = stretch(spray, noise(seed, drop) * 0.3 + 0.45, 1);

        ripple(context, land, size * (0.3 + splat * 0.6), {
          color: ACID,
          alpha: decay(splat),
          width: 2 * stage.scale,
        });
        bubble(context, [land[0], land[1] - splat * size * 0.8], size * 0.14, {
          color: ACID,
          alpha: decay(splat),
          width: stage.scale,
        });
      }
    }
  },

  // Appletun's syrup landing on the target, then sweet nectar raining over its own side to heal it
  GMaxSweetness(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const top = cloudOver(stage);

    if (go < FRUIT_LANDS) {
      const fall = go / FRUIT_LANDS;
      const glob: Point = [at[0], top[1] + (at[1] - top[1]) * fall * fall];

      orb(context, glob, size * 1.8, { color: NECTAR, alpha: 0.6 });
      petal(context, glob, size * 1.1, Math.PI, { color: HONEY, alpha: 1 });
    } else {
      const hit = stretch(go, FRUIT_LANDS, 0.7);

      orb(context, at, size * (1.6 + hit * 1.6), { color: NECTAR, alpha: decay(hit) * 0.7 });
      ring(context, at, size * (1 + hit * 2.6), {
        color: HONEY,
        alpha: decay(hit),
        width: 3.4 * stage.scale,
      });
      shards(context, at, size * 2.6, 8, seed, hit, {
        color: HONEY,
        alpha: decay(hit),
        width: 2.6 * stage.scale,
      });
    }
    const rain = stretch(go, 0.25, 1);

    if (rain <= 0) {
      return;
    }
    // Sized to the caster rather than to the blow: this falls over its own side
    const near = REACH * stage.scale;
    const home = stage.source;

    orb(context, home, near * 2.2, { color: HONEY, alpha: swell(rain) * 0.5 });
    for (let drop = 0; drop < many(16, weight); drop += 1) {
      const fall = (rain * 1.6 + noise(seed, drop)) % 1;
      const x = home[0] + spread(seed, drop + 30) * near * 2.6;

      petal(context, [x, home[1] - near * 4 + fall * near * 5], near * 0.26, Math.PI, {
        color: NECTAR,
        alpha: late(rain, 0.8) * swell(fall),
      });
    }
    motes(context, home, near * 2, many(10, weight), seed, rain, {
      color: '#fff2b0',
      alpha: late(rain, 0.7),
      width: 2.2 * stage.scale,
    });
  },

  // Sandaconda's sand whirling up round the target in a vortex
  GMaxSandblast(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const kept = Math.min(1, go * 5) * late(go, 0.8);

    blot(context, foot, size * 3, size * 1, mix(SAND, '#5a4020', 0.3), kept * 0.5);
    for (let band = 0; band < 7; band += 1) {
      const rise = band / 6;

      hoop(
        context,
        [at[0] + Math.sin(share * 8 + band) * size * 0.3, foot[1] - rise * size * 5],
        size * (0.8 + rise * 2.2),
        0.3,
        0,
        {
          color: band % 2 === 0 ? SAND : lighten(SAND, 0.3),
          alpha: kept * 0.8,
          width: size * 0.3,
        },
      );
    }
    for (let grain = 0; grain < many(26, weight); grain += 1) {
      const rise = (go * 1.5 + noise(seed, grain)) % 1;
      const angle = noise(seed, grain + 20) * Math.PI * 2 + share * 14;
      const round = size * (0.8 + rise * 2.2);

      blot(
        context,
        [
          at[0] + Math.cos(angle) * round,
          foot[1] - rise * size * 5 + Math.sin(angle) * round * 0.3,
        ],
        size * 0.12,
        size * 0.12,
        lighten(SAND, 0.2),
        kept,
      );
    }
  },

  // Toxtricity's toxic electricity crackling over the target in violet and yellow
  GMaxStunShock(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const kept = late(go, 0.8);
    const flick = Math.floor(share * 24);

    orb(context, at, size * 2.6, { color: TOXIC_PURPLE, alpha: kept * 0.45 });
    orb(context, at, size * 1.4, {
      color: SHOCK_YELLOW,
      alpha: kept * (flick % 2 === 0 ? 0.6 : 0.3),
    });
    for (let arc = 0; arc < many(8, weight); arc += 1) {
      const angle = noise(seed + flick, arc) * Math.PI * 2;
      const out = size * (2 + noise(seed + flick, arc + 9) * 1.6);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        seed + flick * 7 + arc,
        {
          color: arc % 2 === 0 ? TOXIC_PURPLE : SHOCK_YELLOW,
          alpha: kept,
          width: 2.6 * stage.scale,
        },
      );
    }
    for (let drop = 0; drop < many(10, weight); drop += 1) {
      const rise = (go * 1.4 + noise(seed, drop)) % 1;

      bubble(
        context,
        [at[0] + spread(seed, drop + 20) * size * 2, at[1] + size * 0.8 - rise * size * 3],
        size * 0.25,
        {
          color: TOXIC_PURPLE,
          alpha: kept * swell(rise),
          width: 1.4 * stage.scale,
        },
      );
    }
  },

  // Centiskorch's body coiling down round the target as a ring of fire that keeps burning
  GMaxCentiferno(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const coil = stretch(go, 0, COIL_CLOSES);
    const kept = late(go, 0.8);

    ripple(context, foot, size * 2.6, {
      color: CENTI_FIRE,
      alpha: kept * coil,
      width: 4 * stage.scale,
    });
    for (let segment = 0; segment < COIL_SEGMENTS; segment += 1) {
      const along = segment / COIL_SEGMENTS;

      if (along > coil) {
        continue;
      }
      // Down the helix while it closes, and round the floor once it has
      const angle = along * Math.PI * 4 + share * 5;
      const high =
        (1 - along / Math.max(0.01, coil)) *
        size *
        4 *
        (1 - stretch(go, COIL_CLOSES, COIL_CLOSES + 0.2));
      const spot: Point = [
        foot[0] + Math.cos(angle) * size * 2.6,
        foot[1] + Math.sin(angle) * size * 0.85 - high,
      ];

      orb(context, spot, size * 0.9, { color: CENTI_FIRE, alpha: kept * 0.6 });
      blot(context, spot, size * 0.45, size * 0.38, CENTI_BODY, kept);
      flame(
        context,
        spot,
        size * (1 + Math.sin(share * 30 + segment) * 0.3),
        CENTI_FIRE,
        kept * 0.9,
      );
    }
    orb(context, at, size * 1.6, { color: CENTI_FIRE, alpha: kept * coil * 0.4 });
  },

  // Hatterene's pillar of judgement light coming down on the target under a halo
  GMaxSmite(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);
    const down = stretch(go, 0, 0.2);
    const kept = late(go, 0.7);

    beam(context, top, foot, down, size * 2.4 * kept, { color: SMITE_PINK, alpha: 0.6 });
    beam(context, top, foot, down, size * 1 * kept, { color: '#ffffff', alpha: 0.9 });
    hoop(context, [at[0], at[1] - size * 2.6], size * 1.4, 0.3, 0, {
      color: lighten(SMITE_PINK, 0.4),
      alpha: kept,
      width: 3 * stage.scale,
    });
    for (let wave = 0; wave < 2; wave += 1) {
      const held = (go * 1.6 + wave / 2) % 1;

      ripple(context, foot, size * (1.2 + held * 3), {
        color: SMITE_PINK,
        alpha: kept * decay(held),
        width: 3 * stage.scale,
      });
    }
    for (let glint = 0; glint < many(12, weight); glint += 1) {
      const fall = (go * 1.4 + noise(seed, glint)) % 1;

      star(
        context,
        [at[0] + spread(seed, glint + 20) * size * 1.6, top[1] + (foot[1] - top[1]) * fall],
        size * 0.28,
        fall * 3,
        {
          color: '#ffffff',
          alpha: kept * swell(fall),
        },
      );
    }
  },

  // Grimmsnarl's huge yawn breathing a sleepy haze over the target, Zs drifting up out of it
  GMaxSnooze(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    // The yawn is the caster's own mouth, so it is sized to the caster
    const near = REACH * stage.scale;
    const mouth: Point = [stage.source[0], stage.source[1] - near * 1.6];
    const yawn = swell(stretch(go, 0, 0.5));

    // Dark lips round a wide pink mouth
    blot(context, mouth, near * 1.2 * yawn, near * 1.2 * yawn, GRIMMSNARL, 1);
    blot(
      context,
      [mouth[0], mouth[1] + near * 0.1 * yawn],
      near * 0.95 * yawn,
      near * 0.9 * yawn,
      '#ff7aa8',
      1,
    );
    for (let puff = 0; puff < 10; puff += 1) {
      const drift = stretch(go, 0.1 + puff * 0.03, 0.55 + puff * 0.03);

      if (drift <= 0 || drift >= 1) {
        continue;
      }
      const [x, y] = between(mouth, at, drift);

      blot(
        context,
        [x + spread(seed, puff) * size, y + spread(seed, puff + 10) * size * 0.6],
        size * (0.6 + drift * 1.2),
        size * (0.5 + drift),
        SNOOZE_HAZE,
        swell(drift) * 0.45,
      );
    }
    const sleep = stretch(go, 0.45, 1);

    if (sleep > 0) {
      orb(context, at, size * 2.4, { color: SNOOZE_HAZE, alpha: late(sleep, 0.5) * 0.5 });
      for (let letter = 0; letter < 3; letter += 1) {
        const rise = stretch(sleep, letter * 0.15, letter * 0.15 + 0.7);

        if (rise > 0 && rise < 1) {
          zee(
            context,
            [
              at[0] + size * (0.6 + letter * 0.5) + Math.sin(rise * 6) * size * 0.3,
              at[1] - size * (1 + rise * 2.4),
            ],
            size * (0.7 + letter * 0.25),
            mix(SNOOZE_HAZE, GRIMMSNARL, 0.3),
            swell(rise),
          );
        }
      }
    }
  },

  // Alcremie's cream splashing on the target, then cream and sprinkles raining over its own side to heal it
  GMaxFinale(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hit = stretch(go, 0, 0.45);

    if (hit < 1) {
      orb(context, at, size * (1.6 + hit * 2), { color: CREAM_PINK, alpha: decay(hit) * 0.7 });
      ring(context, at, size * (1 + hit * 2.6), {
        color: CREAM,
        alpha: decay(hit),
        width: 4 * stage.scale,
      });
      shards(context, at, size * 2.6, 8, seed, hit, {
        color: CREAM,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
    }
    const rain = stretch(go, 0.2, 1);

    if (rain <= 0) {
      return;
    }
    // Sized to the caster rather than to the blow: this falls over its own side
    const near = REACH * stage.scale;
    const home = stage.source;
    const kept = late(rain, 0.8);

    orb(context, home, near * 2.2, { color: CREAM_PINK, alpha: swell(rain) * 0.45 });
    for (let dollop = 0; dollop < many(8, weight); dollop += 1) {
      const fall = (rain * 1.3 + noise(seed, dollop)) % 1;
      const spot: Point = [
        home[0] + spread(seed, dollop + 30) * near * 2.6,
        home[1] - near * 4 + fall * near * 5,
      ];

      blot(
        context,
        spot,
        near * 0.42,
        near * 0.32,
        dollop % 2 === 0 ? CREAM : CREAM_PINK,
        kept * swell(fall),
      );
      blot(
        context,
        [spot[0], spot[1] - near * 0.28],
        near * 0.22,
        near * 0.2,
        CREAM,
        kept * swell(fall),
      );
    }
    for (let sprinkle = 0; sprinkle < many(20, weight); sprinkle += 1) {
      const fall = (rain * 1.8 + noise(seed, sprinkle + 50)) % 1;
      const spot: Point = [
        home[0] + spread(seed, sprinkle + 70) * near * 3,
        home[1] - near * 4 + fall * near * 5,
      ];
      const turn = noise(seed, sprinkle + 90) * Math.PI;

      edge(
        context,
        [spot[0] - Math.cos(turn) * near * 0.18, spot[1] - Math.sin(turn) * near * 0.18],
        [spot[0] + Math.cos(turn) * near * 0.18, spot[1] + Math.sin(turn) * near * 0.18],
        near * 0.06,
        0,
        {
          color: SPRINKLE_TONES[sprinkle % SPRINKLE_TONES.length],
          alpha: kept * swell(fall),
        },
      );
    }
  },

  // Copperajah's steel shards flung out of the hit and stuck in the ground all round the target
  GMaxSteelsurge(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const hit = stretch(go, 0, 0.3);

    if (hit < 1) {
      orb(context, at, size * (1.6 + hit * 2), { color: COPPER, alpha: decay(hit) * 0.7 });
      ring(context, at, size * (1 + hit * 2.8), {
        color: STEEL,
        alpha: decay(hit),
        width: 4 * stage.scale,
      });
    }
    scattered(context, stage, share, seed, weight, STEEL, 'spike');
  },

  // Duraludon draining the target's energy up out of it in streams of light
  GMaxDepletion(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const top = cloudOver(stage);
    const kept = late(go, 0.8);
    const grip = stretch(go, 0, 0.25);

    for (let band = 0; band < 3; band += 1) {
      ring(context, at, size * (1.4 + band * 0.7) * (1.6 - grip * 0.6), {
        color: band === 1 ? DURALUDON : DRAIN_CYAN,
        alpha: kept * grip * 0.8,
        width: 2.6 * stage.scale,
      });
    }
    orb(context, at, size * 2 * (1 - go * 0.6), { color: DRAIN_CYAN, alpha: kept * 0.6 });
    for (let stream = 0; stream < many(14, weight); stream += 1) {
      const rise = (go * 1.8 + noise(seed, stream)) % 1;
      const x = at[0] + spread(seed, stream + 20) * size * 1.4 * (1 - rise * 0.6);
      const y = at[1] + (top[1] - at[1]) * rise;

      edge(context, [x, y + size * 0.7], [x, y], size * 0.12, 0, {
        color: stream % 3 === 0 ? GMAX_MAGENTA : DRAIN_CYAN,
        alpha: kept * swell(rise),
      });
      blot(context, [x, y], size * 0.14, size * 0.14, '#ffffff', kept * swell(rise));
    }
  },

  // Single Strike Urshifu's one huge dark fist driven down through whatever guards the target
  GMaxOneBlow(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);

    if (go < ONE_BLOW_LANDS) {
      const fall = go / ONE_BLOW_LANDS;
      const spot: Point = [at[0], top[1] + (at[1] - size * 1.2 - top[1]) * fall * fall];

      for (let side = 0; side < 6; side += 1) {
        const from = (side / 6) * Math.PI * 2;
        const to = ((side + 1) / 6) * Math.PI * 2;

        edge(
          context,
          [at[0] + Math.cos(from) * size * 1.8, at[1] + Math.sin(from) * size * 1.6],
          [at[0] + Math.cos(to) * size * 1.8, at[1] + Math.sin(to) * size * 1.6],
          size * 0.1,
          0,
          {
            color: '#bfe0ff',
            alpha: 0.4 + fall * 0.5,
          },
        );
      }
      edge(context, [spot[0], spot[1] - size * 3], spot, size * 1.2, 0, {
        color: ONE_RED,
        alpha: 0.35,
      });
      fist(context, spot, size * 1.8, ONE_DARK, 1);
      orb(context, spot, size * 2.6, { color: ONE_RED, alpha: 0.35 });
      return;
    }
    const hit = (go - ONE_BLOW_LANDS) / (1 - ONE_BLOW_LANDS);

    shards(context, at, size * 4, 12, seed, hit, {
      color: '#bfe0ff',
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    orb(context, at, size * (2 + hit * 2.6), { color: ONE_RED, alpha: decay(hit) * 0.7 });
    orb(context, at, size * (1.4 + hit), {
      color: GMAX_DARK,
      alpha: decay(Math.min(1, hit * 1.6)),
    });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = stretch(hit, wave * 0.15, wave * 0.15 + 0.6);

      ripple(context, foot, size * (1.2 + held * 5), {
        color: wave === 1 ? ONE_RED : ONE_DARK,
        alpha: decay(held),
        width: 4 * stage.scale,
      });
    }
    for (let crack = 0; crack < 7; crack += 1) {
      const angle = (crack / 7) * Math.PI * 2 + noise(seed, crack);
      const out = size * (1.6 + noise(seed, crack + 10) * 2) * Math.min(1, hit * 3);

      bolt(
        context,
        foot,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.33],
        seed + crack,
        {
          color: ONE_DARK,
          alpha: late(hit, 0.5),
          width: 3 * stage.scale,
        },
      );
    }
    burst(context, at, size * 3.6, 14, seed, {
      color: ONE_RED,
      alpha: decay(Math.min(1, hit * 2)),
      width: 3 * stage.scale,
    });
  },

  // Rapid Strike Urshifu's torrent: a rushing current and a flurry of water fists from every side
  GMaxRapidFlow(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const kept = late(go, 0.8);

    funnel(context, stage.source, at, Math.min(1, go * 4), 3, size * 1.2, share * 16, {
      color: FLOW_BLUE,
      alpha: kept * 0.8,
      width: 4 * stage.scale,
    });
    for (const [index, lands] of FLOW_FISTS.entries()) {
      const angle = noise(seed, index) * Math.PI * 2;
      const flight = stretch(go, lands - 0.08, lands);
      const hit = stretch(go, lands, lands + 0.18);
      const from: Point = [at[0] + Math.cos(angle) * size * 4, at[1] + Math.sin(angle) * size * 3];

      if (flight > 0 && flight < 1) {
        const spot = between(from, at, flight);

        edge(context, between(from, at, Math.max(0, flight - 0.5)), spot, size * 0.35, 0, {
          color: FLOW_BLUE,
          alpha: 0.6,
        });
        fist(context, spot, size * 0.7, lighten(FLOW_BLUE, 0.2), 1);
      }
      if (hit > 0 && hit < 1) {
        ring(context, at, size * (0.8 + hit * 2), {
          color: lighten(FLOW_BLUE, 0.5),
          alpha: decay(hit),
          width: 3 * stage.scale,
        });
        shards(context, at, size * 2.2, 6, seed + index, hit, {
          color: lighten(FLOW_BLUE, 0.5),
          alpha: decay(hit),
          width: 2.2 * stage.scale,
        });
      }
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

/**
 * G-Max Stonesurge's stones and Steelsurge's spikes: thrown out of the
 * hit in arcs and left round the target, stones hovering and spikes
 * stuck in the floor
 */
function scattered(
  context: CanvasRenderingContext2D,
  stage: Stage,
  share: number,
  seed: number,
  weight: number,
  color: string,
  kind: 'rock' | 'spike',
): void {
  const go = gigantic(share);
  const at = landing(stage);
  const size = REACH * stage.scale * weight;
  const foot = footOf(at, size);
  const kept = late(go, 0.85);
  const tint = kind === 'rock' ? color : COPPER;

  for (let piece = 0; piece < 8; piece += 1) {
    const thrown = stretch(go, SURGE_THROWN + piece * 0.02, SURGE_SETTLES + piece * 0.02);

    if (thrown <= 0) {
      continue;
    }
    const angle = (piece / 8) * Math.PI * 2 + noise(seed, piece) * 0.5;
    const out = size * (2 + noise(seed, piece + 10) * 1.4);
    const rest: Point = [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.33];

    if (kind === 'rock') {
      const bob = Math.sin(share * 10 + piece) * size * 0.2;
      const hover: Point = [rest[0], rest[1] - size * 0.8 + bob];
      const spot = thrown < 1 ? arced(at, hover, thrown, size * 2) : hover;

      blot(context, rest, size * 0.5, size * 0.16, '#000000', kept * 0.3 * thrown);
      rock(
        context,
        spot,
        size * 0.5,
        noise(seed, piece + 20) * 6 + (1 - thrown) * 6,
        piece % 2 === 0 ? color : lighten(color, 0.25),
        kept,
      );
      continue;
    }
    if (thrown < 1) {
      const spot = arced(at, rest, thrown, size * 2.4);

      spike(
        context,
        [spot[0], spot[1] + size * 0.5],
        size * 1.2,
        (1 - thrown) * 6 + angle,
        size * 0.18,
        piece % 2 === 0 ? tint : STEEL,
        kept,
      );
    } else {
      spike(
        context,
        rest,
        size * 1.3,
        Math.cos(angle) * 0.4,
        size * 0.22,
        piece % 2 === 0 ? tint : STEEL,
        kept,
      );
      if ((piece + Math.floor(share * 12)) % 4 === 0) {
        star(
          context,
          [rest[0] + Math.cos(angle) * size * 0.3, rest[1] - size * 1.1],
          size * 0.3,
          0,
          { color: '#ffffff', alpha: kept },
        );
      }
    }
  }
}

export default gMaxGalar;
