import type { Point } from '../../stage';
import {
  beam,
  between,
  bolt,
  bubble,
  burst,
  decay,
  edge,
  heart,
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
  GMAX_MAGENTA,
  GMAX_RED,
  blot,
  cloudOver,
  dropped,
  fist,
  flame,
  gMaxPower,
  gigantic,
  note,
  strand,
  stretch,
  whip,
} from './g-max-power';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** G-Max Vine Lash: how many vines lash, and how many times each comes down */
export const VINES = 4;
export const LASHES = 3;

/** G-Max Cannonade: the shares of the payoff each cannon shot is fired at, and how long one flies */
export const CANNON_SHOTS = [0, 0.08, 0.16, 0.24, 0.32, 0.4];
export const CANNON_FLIGHT = 0.12;

/** G-Max Chi Strike: the shares of the payoff the reticle locks, and each aura fist lands */
export const CHI_LOCKS = 0.28;
export const CHI_FISTS = [0.32, 0.42, 0.52, 0.62];

/** G-Max Cuddle and Replenish: the share of the payoff the body comes down */
export const POUNCE_LANDS = 0.4;

/** G-Max Meltdown: the share of the payoff the molten glob lands */
export const MELT_LANDS = 0.3;

export const VINE_GREEN = '#3f9a3a';
export const LEAF_GREEN = '#7ad65a';
export const BLOOM_PINK = '#ff8fb0';
export const WILDFIRE = '#ff5a1f';
export const CANNON_BLUE = '#3a8cff';
export const SPRAY = '#7ec4ff';
/** G-Max Befuddle's scales: poison violet, paralysis yellow and sleep blue */
export const SCALE_TONES = ['#b46cff', '#ffe04a', '#7ad0ff'];
export const VOLT_YELLOW = '#ffe23a';
export const COIN_GOLD = '#ffcf33';
export const COIN_RIM = '#b8860b';
export const CHI_ORANGE = '#ff8a3a';
export const RETICLE = '#ffe9a0';
export const TERROR_SHADE = '#2a103e';
export const TERROR_VIOLET = '#9a4ae0';
export const GENGAR_EYE = '#ff3a5a';
export const FOAM = '#bfe8ff';
/** G-Max Resonance's aurora, green, teal and violet */
export const AURORA_TONES = ['#7affc0', '#6ad8ff', '#c49aff'];
export const LAPRAS_BLUE = '#8fd8ff';
export const EEVEE_BROWN = '#b07a4a';
export const EEVEE_CREAM = '#f3e3bf';
export const CUDDLE_PINK = '#ff8fc8';
export const SNORLAX_TEAL = '#2f5d6b';
export const SNORLAX_BELLY = '#efe0bc';
/** G-Max Replenish's berries: Cheri, Oran, Pecha, Sitrus and Leppa */
export const BERRY_TONES = ['#e8403a', '#3a6aff', '#ff9fd0', '#ffd23a', '#ff6a3a'];
export const HEAL_GREEN = '#8fe39a';
export const MALODOR_PURPLE = '#8a4ab8';
export const MALODOR_GREEN = '#7a9a3a';
export const GARBAGE = '#6a5a48';
export const MOLTEN = '#ff8a2a';
export const MELMETAL = '#7e8a9a';

/** Where the floor is under a body */
function footOf(at: Point, size: number): Point {
  return [at[0], at[1] + size * 0.9];
}

const gMaxMoves = {
  // Venusaur's giant vines rearing up round the target and lashing down over it, again and again
  GMaxVineLash(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const shown = Math.min(1, go * 6) * late(go, 0.85);

    ripple(context, foot, size * 2.4, {
      color: VINE_GREEN,
      alpha: shown * 0.5,
      width: 3 * stage.scale,
    });
    for (let vine = 0; vine < VINES; vine += 1) {
      const side = vine % 2 === 0 ? 1 : -1;
      const root: Point = [
        at[0] - side * size * (1.3 + Math.floor(vine / 2) * 0.7),
        foot[1] + size * (0.1 - Math.floor(vine / 2) * 0.3),
      ];
      const beat = (go * LASHES + vine * 0.23) % 1;
      const joints = whip(beat, side, size * 3.4);
      const points: Point[] = [];

      for (const [across, up] of joints) {
        points.push([root[0] + across, root[1] - up]);
      }
      strand(context, points, size * 0.5, mix(VINE_GREEN, '#1a3a1a', 0.3), shown);
      strand(context, points, size * 0.24, LEAF_GREEN, shown);
      for (let leaf = 2; leaf < points.length; leaf += 3) {
        petal(context, points[leaf], size * 0.28, beat * 4 + leaf, {
          color: LEAF_GREEN,
          alpha: shown,
        });
      }
      // The crack, where the tip comes down across the target
      const crack = stretch(beat, 0.6, 0.85);

      if (crack > 0 && crack < 1) {
        const tip = points[points.length - 1];

        burst(context, tip, size * (0.8 + crack), 8, seed + vine, {
          color: lighten(LEAF_GREEN, 0.5),
          alpha: decay(crack) * shown,
          width: 2.4 * stage.scale,
        });
        orb(context, at, size * 1.4, { color: LEAF_GREEN, alpha: decay(crack) * 0.4 * shown });
      }
    }
    motes(context, at, size * 3, many(10, weight), seed, go, {
      color: BLOOM_PINK,
      alpha: shown * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Charizard's fire pouring out of the cloud and spreading into a sea of flame that is left burning
  GMaxWildfire(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);
    const pour = stretch(go, 0, 0.3);
    const kept = late(go, 0.8);

    if (pour < 1) {
      beam(context, top, at, pour * 1.4, size * 1.2 * swell(pour * 0.9 + 0.1), {
        color: WILDFIRE,
        alpha: 0.9,
      });
    }
    const reached = stretch(go, 0.2, 0.55);

    orb(context, at, size * (1.4 + pour * 1.4), { color: WILDFIRE, alpha: decay(pour) * 0.6 });
    blot(
      context,
      foot,
      size * 4.2 * reached,
      size * 1.3 * reached,
      mix(WILDFIRE, '#5a1000', 0.5),
      kept * 0.5,
    );
    ripple(context, foot, size * 4.4 * reached, {
      color: lighten(WILDFIRE, 0.3),
      alpha: kept * 0.8,
      width: 3 * stage.scale,
    });
    for (let tongue = 0; tongue < many(16, weight); tongue += 1) {
      const angle = noise(seed, tongue) * Math.PI * 2;
      const out = Math.sqrt(noise(seed, tongue + 30)) * 3.8 * reached;
      const spot: Point = [
        foot[0] + Math.cos(angle) * size * out,
        foot[1] + Math.sin(angle) * size * out * 0.3,
      ];
      const flicker = 0.7 + Math.sin(share * 30 + tongue * 1.7) * 0.3;

      flame(
        context,
        spot,
        size * (0.9 + noise(seed, tongue + 60) * 0.9) * flicker * reached,
        WILDFIRE,
        kept,
      );
    }
    motes(context, at, size * 3.6, many(12, weight), seed, go, {
      color: '#ffd84a',
      alpha: kept,
      width: 2 * stage.scale,
    });
  },

  // Blastoise's cannons firing a barrage, then water pounding down out of the cloud into a whirl
  GMaxCannonade(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);

    for (const [index, fired] of CANNON_SHOTS.entries()) {
      const flight = stretch(go, fired, fired + CANNON_FLIGHT);
      const splash = stretch(go, fired + CANNON_FLIGHT, fired + CANNON_FLIGHT + 0.25);
      const from: Point = [
        stage.source[0] + (index % 2 === 0 ? -1 : 1) * size * 0.6,
        stage.source[1] - size * 0.5,
      ];

      if (flight > 0 && flight < 1) {
        beam(context, from, [at[0] + spread(seed, index) * size * 0.5, at[1]], flight, size * 0.9, {
          color: CANNON_BLUE,
          alpha: 0.9,
        });
      }
      if (splash > 0 && splash < 1) {
        ring(context, at, size * (0.6 + splash * 2), {
          color: SPRAY,
          alpha: decay(splash),
          width: 3 * stage.scale,
        });
        shards(context, at, size * 2.4, 6, seed + index, splash, {
          color: SPRAY,
          alpha: decay(splash),
          width: 2.4 * stage.scale,
        });
      }
    }
    // What is left behind: water still coming down on it, swirling where it lands
    const pound = stretch(go, 0.5, 1);

    if (pound > 0) {
      const top = cloudOver(stage);

      for (let whirl = 0; whirl < 3; whirl += 1) {
        ripple(context, foot, size * (1 + ((pound * 2 + whirl / 3) % 1) * 2.4), {
          color: CANNON_BLUE,
          alpha: late(pound, 0.6) * 0.8,
          width: 3 * stage.scale,
        });
      }
      for (let drop = 0; drop < 3; drop += 1) {
        const fall = (pound * 2.4 + drop / 3) % 1;
        const x = at[0] + spread(seed, drop + 50) * size * 1.2;

        edge(
          context,
          [x, top[1] + (foot[1] - top[1]) * Math.max(0, fall - 0.3)],
          [x, top[1] + (foot[1] - top[1]) * fall],
          size * 0.45,
          0,
          {
            color: lighten(CANNON_BLUE, 0.4),
            alpha: late(pound, 0.6) * 0.9,
          },
        );
      }
    }
  },

  // Butterfree's glittering scales of three colours spiralling down over the target
  GMaxBefuddle(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);
    const shown = Math.min(1, go * 5) * late(go, 0.8);

    orb(context, at, size * 2.2, { color: SCALE_TONES[0], alpha: shown * 0.3 });
    for (let scale = 0; scale < many(30, weight); scale += 1) {
      const fall = (go * 1.4 + noise(seed, scale)) % 1;
      const angle = fall * Math.PI * 4 + noise(seed, scale + 20) * Math.PI * 2;
      const round = size * (2 - fall * 0.9);
      const spot: Point = [
        at[0] + Math.cos(angle) * round,
        top[1] + (foot[1] - top[1]) * fall + Math.sin(angle) * round * 0.25,
      ];
      const tone = SCALE_TONES[scale % SCALE_TONES.length];

      petal(context, spot, size * 0.2, angle + share * 6, {
        color: tone,
        alpha: shown * swell(fall),
      });
      if (scale % 4 === 0) {
        star(context, spot, size * 0.22 * swell((share * 6 + scale * 0.3) % 1), 0, {
          color: '#ffffff',
          alpha: shown,
        });
      }
    }
    for (const [index, tone] of SCALE_TONES.entries()) {
      ripple(context, foot, size * (1.2 + ((go * 1.5 + index / 3) % 1) * 2), {
        color: tone,
        alpha: shown * 0.6,
        width: 2.4 * stage.scale,
      });
    }
  },

  // Pikachu's giant bolt crashing down out of the cloud and running out across the ground
  GMaxVoltCrash(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);
    const flick = Math.floor(share * 22);
    const strike = stretch(go, 0, 0.55);
    const bright = decay(strike) * (flick % 3 === 2 ? 0.5 : 1);

    if (strike < 1) {
      bolt(context, top, foot, seed + flick, {
        color: '#5a3a00',
        alpha: bright * 0.5,
        width: size * 0.9,
      });
      bolt(context, top, foot, seed + flick, {
        color: VOLT_YELLOW,
        alpha: bright,
        width: size * 0.4,
      });
      bolt(context, top, foot, seed + flick, {
        color: '#ffffff',
        alpha: bright,
        width: size * 0.14,
      });
    }
    const hit = stretch(go, 0.05, 1);

    orb(context, at, size * (2 + hit * 2.4), { color: VOLT_YELLOW, alpha: decay(hit) * 0.6 });
    orb(context, at, size * 1.4, { color: '#ffffff', alpha: decay(Math.min(1, hit * 2.5)) });
    for (let wave = 0; wave < 2; wave += 1) {
      ripple(context, foot, size * (1 + stretch(hit, wave * 0.2, wave * 0.2 + 0.6) * 4.5), {
        color: VOLT_YELLOW,
        alpha: decay(stretch(hit, wave * 0.2, wave * 0.2 + 0.6)),
        width: 3.4 * stage.scale,
      });
    }
    for (let arc = 0; arc < many(6, weight); arc += 1) {
      const angle = (arc / many(6, weight)) * Math.PI * 2 + noise(seed + flick, arc) * 0.5;
      const out = size * (1.6 + hit * 3);

      bolt(
        context,
        foot,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.3],
        seed + flick * 5 + arc,
        {
          color: lighten(VOLT_YELLOW, 0.4),
          alpha: late(hit, 0.4) * (flick % 2 === 0 ? 1 : 0.6),
          width: 2.4 * stage.scale,
        },
      );
    }
  },

  // Meowth's shower of gold coins raining out of the cloud and bouncing round the target
  GMaxGoldRush(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);
    const kept = late(go, 0.85);

    orb(context, at, size * 2, { color: COIN_GOLD, alpha: swell(go) * 0.35 });
    for (let coin = 0; coin < many(22, weight); coin += 1) {
      const fall = stretch(go, noise(seed, coin) * 0.5, noise(seed, coin) * 0.5 + 0.4);

      if (fall <= 0) {
        continue;
      }
      const angle = noise(seed, coin + 40) * Math.PI * 2;
      const out = size * (0.3 + noise(seed, coin + 60) * 2.6);
      const ground: Point = [
        foot[0] + Math.cos(angle) * out,
        foot[1] + Math.sin(angle) * out * 0.3,
      ];
      const high = dropped(fall, ground[1] - top[1]);
      const spin = Math.abs(Math.cos(share * 14 + coin));
      const spot: Point = [ground[0], ground[1] - high];
      const round = size * 0.32;

      blot(
        context,
        spot,
        round * Math.max(0.15, fall < 0.7 ? spin : 1),
        fall < 0.7 ? round : round * 0.4,
        COIN_RIM,
        kept,
      );
      blot(
        context,
        spot,
        round * 0.75 * Math.max(0.15, fall < 0.7 ? spin : 1),
        (fall < 0.7 ? round : round * 0.4) * 0.75,
        COIN_GOLD,
        kept,
      );
      if ((coin + Math.floor(share * 10)) % 5 === 0) {
        star(context, [spot[0] + round * 0.3, spot[1] - round * 0.3], round * 0.8, 0, {
          color: '#ffffff',
          alpha: kept,
        });
      }
    }
  },

  // A reticle locking onto the target for the critical hit, then Machamp's four aura fists slamming in
  GMaxChiStrike(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const lock = stretch(go, 0, CHI_LOCKS);
    const held = late(go, 0.75);

    for (let band = 0; band < 2; band += 1) {
      ring(context, at, size * (1.4 + (1 - lock) * (1.4 + band * 0.8)), {
        color: band === 0 ? RETICLE : GMAX_RED,
        alpha: held * 0.9,
        width: 2.6 * stage.scale,
      });
    }
    for (let tick = 0; tick < 4; tick += 1) {
      const angle = (tick / 4) * Math.PI * 2 + (1 - lock) * 1.5;
      const near = size * (1.6 + (1 - lock) * 1.2);

      edge(
        context,
        [at[0] + Math.cos(angle) * near, at[1] + Math.sin(angle) * near],
        [
          at[0] + Math.cos(angle) * (near + size * 1.1),
          at[1] + Math.sin(angle) * (near + size * 1.1),
        ],
        size * 0.12,
        0,
        { color: RETICLE, alpha: held },
      );
    }
    for (const [index, lands] of CHI_FISTS.entries()) {
      const angle = (index / CHI_FISTS.length) * Math.PI * 2 + Math.PI / 4;
      const flight = stretch(go, lands - 0.12, lands);
      const hit = stretch(go, lands, lands + 0.25);
      const from: Point = [at[0] + Math.cos(angle) * size * 5, at[1] + Math.sin(angle) * size * 4];

      if (flight > 0 && flight < 1) {
        const spot = between(from, at, flight);

        edge(context, between(from, at, Math.max(0, flight - 0.4)), spot, size * 0.4, 0, {
          color: CHI_ORANGE,
          alpha: 0.5,
        });
        fist(context, spot, size * 0.9, CHI_ORANGE, 1);
      }
      if (hit > 0 && hit < 1) {
        burst(context, at, size * (1.4 + hit * 2), 10, seed + index, {
          color: lighten(CHI_ORANGE, 0.5),
          alpha: decay(hit),
          width: 3 * stage.scale,
        });
        ring(context, at, size * (1 + hit * 2.4), {
          color: CHI_ORANGE,
          alpha: decay(hit),
          width: 3.4 * stage.scale,
        });
      }
    }
    const flare = stretch(go, CHI_FISTS[3], 1);

    if (flare > 0) {
      orb(context, at, size * (2 + flare * 1.6), { color: RETICLE, alpha: decay(flare) * 0.7 });
      star(context, at, size * 2.4 * decay(flare), flare, {
        color: '#ffffff',
        alpha: decay(flare),
      });
    }
  },

  // Gengar's shadow spreading under the target and shadow hands rising out of it to pin it down
  GMaxTerror(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const pool = stretch(go, 0, 0.25);
    const kept = late(go, 0.8);

    blot(context, foot, size * 3.4 * pool, size * 1.1 * pool, TERROR_SHADE, kept * 0.9);
    ripple(context, foot, size * 3.6 * pool, {
      color: TERROR_VIOLET,
      alpha: kept,
      width: 3 * stage.scale,
    });
    for (let hand = 0; hand < 6; hand += 1) {
      const angle = (hand / 6) * Math.PI * 2 + 0.3;
      const base: Point = [
        foot[0] + Math.cos(angle) * size * 2.8,
        foot[1] + Math.sin(angle) * size * 0.9,
      ];
      const reach = stretch(go, 0.15 + hand * 0.04, 0.5 + hand * 0.04);

      if (reach <= 0) {
        continue;
      }
      // Up out of the shadow, then over and closed on the target
      const grip: Point = [
        base[0] + (at[0] - base[0]) * reach * 0.7,
        base[1] - size * 1.8 * Math.sin(reach * Math.PI * 0.6) + (at[1] - base[1]) * reach * 0.4,
      ];
      const elbow: Point = [
        (base[0] + grip[0]) / 2 + Math.cos(angle) * size * 0.6,
        (base[1] + grip[1]) / 2 - size * 0.6,
      ];

      strand(context, [base, elbow, grip], size * 0.8, TERROR_SHADE, kept);
      blot(context, grip, size * 0.5, size * 0.45, TERROR_SHADE, kept);
      strand(context, [base, elbow, grip], size * 0.3, TERROR_VIOLET, kept * 0.7);
      for (let finger = 0; finger < 4; finger += 1) {
        const bend = Math.atan2(at[1] - grip[1], at[0] - grip[0]) + (finger - 1.5) * 0.45;
        const curl = size * (0.9 - reach * 0.3);

        strand(
          context,
          [
            grip,
            [grip[0] + Math.cos(bend) * curl, grip[1] + Math.sin(bend) * curl],
            [
              grip[0] + Math.cos(bend + 0.6) * curl * 1.4,
              grip[1] + Math.sin(bend + 0.6) * curl * 1.4,
            ],
          ],
          size * 0.3,
          TERROR_SHADE,
          kept,
        );
      }
    }
    const glare = stretch(go, 0.3, 0.45) * kept;

    for (const side of [-1, 1]) {
      const eye: Point = [at[0] + side * size * 0.8, at[1] - size * 1.5];

      orb(context, eye, size * 0.7, { color: GENGAR_EYE, alpha: glare * 0.6 });
      blot(context, eye, size * 0.4, size * 0.18, '#ffffff', glare);
    }
  },

  // Kingler's mountain of foam heaping up over the target and bursting
  GMaxFoamBurst(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const pop = stretch(go, 0.7, 1);

    for (let froth = 0; froth < many(30, weight); froth += 1) {
      const layer = noise(seed, froth);
      const grow = stretch(go, layer * 0.5, layer * 0.5 + 0.15);

      if (grow <= 0) {
        continue;
      }
      const wide = size * 3.2 * (1 - layer * 0.75);
      const spot: Point = [foot[0] + spread(seed, froth + 30) * wide, foot[1] - layer * size * 4.2];
      const round = size * (0.4 + noise(seed, froth + 60) * 0.5) * grow;
      const popped = stretch(
        pop,
        noise(seed, froth + 90) * 0.5,
        noise(seed, froth + 90) * 0.5 + 0.3,
      );

      if (popped <= 0) {
        bubble(context, spot, round, { color: FOAM, alpha: 0.9, width: 1.6 * stage.scale });
      } else if (popped < 1) {
        ring(context, spot, round * (1 + popped), {
          color: FOAM,
          alpha: decay(popped),
          width: 1.6 * stage.scale,
        });
      }
    }
    ripple(context, foot, size * 3.4, {
      color: FOAM,
      alpha: late(go, 0.7) * 0.7,
      width: 3 * stage.scale,
    });
  },

  // Lapras' song carried to the target in notes, and an aurora veil hung over its own side
  GMaxResonance(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const kept = late(go, 0.8);

    for (let line = 0; line < 8; line += 1) {
      const along = (go * 1.6 + line / 8) % 1;
      const [x, y] = between(stage.source, at, along);
      const tone = AURORA_TONES[line % AURORA_TONES.length];

      note(
        context,
        [x + Math.sin(along * 8 + line) * size * 0.8, y - Math.sin(Math.PI * along) * size * 2],
        size * 0.6,
        tone,
        kept * swell(along),
      );
    }
    for (let wave = 0; wave < 3; wave += 1) {
      const held = (go * 2 + wave / 3) % 1;

      ring(context, at, size * (0.8 + held * 2.4), {
        color: LAPRAS_BLUE,
        alpha: kept * decay(held),
        width: 2.6 * stage.scale,
      });
    }
    // The veil over its own side, rippling in three colours
    const veil = stretch(go, 0.1, 0.4) * kept;
    // Sized to the caster rather than to the blow: it is a veil over a side, not a hit
    const near = REACH * stage.scale;

    for (const [band, tone] of AURORA_TONES.entries()) {
      const points: Point[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const across = (step / 12 - 0.5) * near * 5;

        points.push([
          stage.source[0] + across,
          stage.source[1] -
            near * (1.7 + band * 0.45) +
            Math.sin(step * 0.9 + share * 8 + band) * near * 0.25,
        ]);
      }
      strand(context, points, near * 0.8, tone, veil * 0.35);
      strand(context, points, near * 0.22, lighten(tone, 0.4), veil * 0.8);
    }
  },

  // Eevee pouncing on the target as a giant, then hearts floating up round it
  GMaxCuddle(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);

    if (go < POUNCE_LANDS) {
      const leap = go / POUNCE_LANDS;
      const [x, y] = between(stage.source, at, leap);
      const body: Point = [x, y - size * 5 * Math.sin(Math.PI * leap)];

      blot(
        context,
        foot,
        size * (0.6 + leap * 1.8),
        size * 0.4 * (1 + leap),
        '#000000',
        leap * 0.35,
      );
      for (const side of [-1, 1]) {
        edge(
          context,
          [body[0] + side * size * 0.6, body[1] - size * 0.6],
          [body[0] + side * size * 1.1, body[1] - size * 1.5],
          size * 0.4,
          0,
          {
            color: EEVEE_BROWN,
            alpha: 1,
          },
        );
      }
      blot(context, body, size * 1.1, size * 0.95, EEVEE_BROWN, 1);
      blot(context, [body[0], body[1] + size * 0.5], size * 0.9, size * 0.4, EEVEE_CREAM, 1);
      return;
    }
    const hit = (go - POUNCE_LANDS) / (1 - POUNCE_LANDS);

    blot(
      context,
      at,
      size * 1.8 * (1 + hit * 0.3),
      size * 1.1 * (1 - hit * 0.3),
      EEVEE_BROWN,
      decay(Math.min(1, hit * 2.5)),
    );
    ripple(context, foot, size * (1.4 + hit * 3.4), {
      color: EEVEE_CREAM,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    shards(context, foot, size * 2.4, 8, seed, hit, {
      color: '#c8b08a',
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
    for (let love = 0; love < many(8, weight); love += 1) {
      const rise = stretch(hit, noise(seed, love) * 0.4, noise(seed, love) * 0.4 + 0.6);

      if (rise > 0 && rise < 1) {
        heart(
          context,
          [at[0] + spread(seed, love + 20) * size * 2.2, at[1] - rise * size * 3],
          size * 0.5,
          {
            color: CUDDLE_PINK,
            alpha: swell(rise),
          },
        );
      }
    }
  },

  // Snorlax coming down on the target, then berries raining over its own side to be eaten again
  GMaxReplenish(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);

    if (go < POUNCE_LANDS) {
      const fall = go / POUNCE_LANDS;
      const body: Point = [at[0], at[1] - size * 6 * (1 - fall * fall)];

      blot(context, foot, size * (1 + fall * 1.8), size * 0.5 * (1 + fall), '#000000', fall * 0.4);
      blot(context, body, size * 2, size * 1.8, SNORLAX_TEAL, 1);
      blot(context, [body[0], body[1] + size * 0.4], size * 1.4, size * 1.1, SNORLAX_BELLY, 1);
    } else {
      const hit = stretch(go, POUNCE_LANDS, 0.8);

      orb(context, at, size * (1.6 + hit * 2), { color: SNORLAX_BELLY, alpha: decay(hit) * 0.6 });
      for (let wave = 0; wave < 2; wave += 1) {
        ripple(context, foot, size * (1.6 + stretch(hit, wave * 0.2, 1) * 4), {
          color: SNORLAX_BELLY,
          alpha: decay(stretch(hit, wave * 0.2, 1)),
          width: 3.6 * stage.scale,
        });
      }
    }
    const rain = stretch(go, 0.3, 1);

    if (rain <= 0) {
      return;
    }
    // Sized to the caster rather than to the blow: these are its own side's berries
    const near = REACH * stage.scale;
    const home: Point = [stage.source[0], stage.source[1] + near * 0.9];

    orb(context, stage.source, near * 1.6, { color: HEAL_GREEN, alpha: swell(rain) * 0.45 });
    for (let berry = 0; berry < many(12, weight); berry += 1) {
      const fall = stretch(rain, noise(seed, berry) * 0.5, noise(seed, berry) * 0.5 + 0.45);

      if (fall <= 0) {
        continue;
      }
      const ground: Point = [
        home[0] + spread(seed, berry + 30) * near * 3,
        home[1] + spread(seed, berry + 60) * near * 0.6,
      ];
      const spot: Point = [ground[0], ground[1] - dropped(fall, near * 3.4)];
      const tone = BERRY_TONES[berry % BERRY_TONES.length];

      blot(context, spot, near * 0.36, near * 0.34, tone, late(rain, 0.8));
      petal(context, [spot[0] + near * 0.15, spot[1] - near * 0.4], near * 0.2, 0.8, {
        color: LEAF_GREEN,
        alpha: late(rain, 0.8),
      });
    }
    motes(context, stage.source, near * 1.8, many(8, weight), seed, rain, {
      color: HEAL_GREEN,
      alpha: late(rain, 0.7),
      width: 2.2 * stage.scale,
    });
  },

  // Garbodor's toxic garbage cloud billowing over the target, with rubbish thrown out of it
  GMaxMalodor(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const billow = stretch(go, 0, 0.35);
    const kept = late(go, 0.8);

    for (let puff = 0; puff < many(12, weight); puff += 1) {
      const angle = noise(seed, puff) * Math.PI * 2 + share * 1.5;
      const out = size * (0.4 + noise(seed, puff + 20) * 2) * billow;
      const boil = 1 + Math.sin(share * 12 + puff) * 0.12;

      blot(
        context,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.6 - size * 0.4],
        size * (0.8 + noise(seed, puff + 40) * 0.6) * billow * boil,
        size * (0.7 + noise(seed, puff + 40) * 0.5) * billow * boil,
        puff % 3 === 0 ? MALODOR_GREEN : MALODOR_PURPLE,
        kept * 0.75,
      );
    }
    shards(context, at, size * 3.4, many(10, weight), seed, go, {
      color: GARBAGE,
      alpha: kept,
      width: 3.4 * stage.scale,
    });
    for (let reek = 0; reek < 4; reek += 1) {
      const points: Point[] = [];
      const x = at[0] + (reek - 1.5) * size * 1.1;

      for (let step = 0; step <= 6; step += 1) {
        points.push([
          x + Math.sin(step * 1.4 + share * 10 + reek) * size * 0.3,
          at[1] - size * (1.4 + step * 0.4 + go * 1.2),
        ]);
      }
      strand(context, points, size * 0.14, lighten(MALODOR_GREEN, 0.3), kept * 0.8);
    }
    motes(context, at, size * 2.6, many(10, weight), seed, go, {
      color: '#c0e070',
      alpha: kept,
      width: 2.2 * stage.scale,
    });
  },

  // Melmetal's molten metal dropping from the cloud and splashing into pools that cool to steel
  GMaxMeltdown(context, stage, share, { paint, seed, weight }) {
    gMaxPower(context, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot = footOf(at, size);
    const top = cloudOver(stage);

    if (go < MELT_LANDS) {
      const fall = go / MELT_LANDS;
      const glob: Point = [at[0], top[1] + (at[1] - top[1]) * fall * fall];

      orb(context, glob, size * 2, { color: MOLTEN, alpha: 0.7 });
      blot(context, glob, size * 1.1, size * 1.3, lighten(MOLTEN, 0.4), 1);
      blot(context, [glob[0], glob[1] - size * 1.2], size * 0.4, size * 0.7, MOLTEN, 0.9);
      return;
    }
    const hit = (go - MELT_LANDS) / (1 - MELT_LANDS);
    const cool = mix(MOLTEN, MELMETAL, Math.min(1, hit * 1.4));

    orb(context, at, size * (1.8 + hit * 2), { color: MOLTEN, alpha: decay(hit) * 0.7 });
    ring(context, at, size * (1 + hit * 3), {
      color: lighten(MOLTEN, 0.5),
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    for (let pool = 0; pool < 5; pool += 1) {
      const angle = noise(seed, pool) * Math.PI * 2;
      const out = size * (0.4 + noise(seed, pool + 10) * 2.6) * Math.min(1, hit * 2);

      blot(
        context,
        [foot[0] + Math.cos(angle) * out, foot[1] + Math.sin(angle) * out * 0.3],
        size * (0.9 + noise(seed, pool + 20)) * Math.min(1, hit * 2.5),
        size * 0.3,
        cool,
        late(hit, 0.7),
      );
    }
    shards(context, at, size * 3.4, many(12, weight), seed, hit, {
      color: lighten(MOLTEN, 0.3),
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    motes(context, at, size * 2.4, many(8, weight), seed + 3, hit, {
      color: GMAX_MAGENTA,
      alpha: decay(hit) * 0.6,
      width: 2 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default gMaxMoves;
