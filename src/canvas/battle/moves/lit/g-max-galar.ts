import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import type { LitStage } from '../__painted';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import {
  ACID,
  APPLE_GREEN,
  APPLE_RED,
  CENTI_BODY,
  CENTI_FIRE,
  COIL_CLOSES,
  COIL_SEGMENTS,
  COPPER,
  CORVIKNIGHT,
  CREAM,
  CREAM_PINK,
  DRAIN_CYAN,
  DREDNAW_WATER,
  DRUM_BEATS,
  DRUM_CROSS,
  DRUM_GREEN,
  DRUM_WOOD,
  DURALUDON,
  FIREBALL,
  FIREBALL_HOT,
  FIREBALL_LANDS,
  FLOW_BLUE,
  FLOW_FISTS,
  FRUIT_LANDS,
  GRAVITY,
  GRAVITY_DARK,
  GRIMMSNARL,
  HONEY,
  MAGMA,
  NECTAR,
  ONE_BLOW_LANDS,
  ONE_DARK,
  ONE_RED,
  ROOT_BROWN,
  SAND,
  SHOCK_YELLOW,
  SMITE_PINK,
  SNIPE_BLUE,
  SNIPE_FIRES,
  SNIPE_HITS,
  SNOOZE_HAZE,
  SPIRES,
  SPIRE_ROCK,
  SPRINKLE_TONES,
  STEEL,
  STONE,
  SURGE_SETTLES,
  SURGE_THROWN,
  TOXIC_PURPLE,
  WIND,
} from '../effect/g-max-galar';
import {
  GMAX_DARK,
  GMAX_MAGENTA,
  cloudOver,
  fist,
  flame,
  gMaxPower,
  gigantic,
  stretch,
  zee,
} from './g-max-power';
import { TAU, arcing, bolt, debris, sparks } from './pieces';
import { type LitShapePainter, aside, floorOf, landed, late, reachOf, toward } from './shapes';

/** A spot on the floor round another, at an angle and a distance */
function around(kit: EffectBatch, floor: Spot, angle: number, distance: number): Spot {
  return aside(kit, floor, Math.cos(angle) * distance, 0, Math.sin(angle) * distance * 0.8);
}

/**
 * A spike standing out of the floor: broken pieces stacked narrowing up
 * its length, so it is jagged and painted rather than a glowing band
 */
function spike(
  kit: EffectBatch,
  base: Spot,
  height: number,
  lean: number,
  width: number,
  colour: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  const tiers = Math.max(1, Math.min(5, Math.round(height / (width * 1.4))));

  for (let tier = 0; tier < tiers; tier += 1) {
    const along = tier / tiers;
    const size = width * (1 - along * 0.6);
    const up = along * height + size * 0.6;

    kit.shard(
      aside(kit, base, Math.sin(lean) * up, Math.cos(lean) * up),
      size,
      -lean,
      colour,
      alpha,
    );
  }
}

/** A helix of points along a path, for a stream that winds as it goes */
function stream(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  reach: number,
  turn: number,
  strands: number,
  colour: string,
  alpha: number,
  width: number,
): void {
  for (let strand = 0; strand < strands; strand += 1) {
    const path: Spot[] = [];

    for (let step = 0; step <= 14; step += 1) {
      const along = (step / 14) * reach;
      const phase = along * TAU * 1.25 + turn + (strand / strands) * TAU;
      const round = width * (0.25 + along);

      // Wound round the line rather than along it, which the camera looks straight down
      path.push(
        aside(kit, toward(from, to, along), Math.sin(phase) * round, Math.cos(phase) * round * 0.5),
      );
    }
    kit.ribbon(path, width * 0.16, colour, alpha, 0, { add: 0.4 });
  }
}

const gMaxGalar = {
  GMaxDrumSolo(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const home = floorOf(stage.source);
    const reach = reachOf(stage, weight);
    const kept = late(go, 0.85);
    const drum = Math.min(1, go * 6) * late(go, 0.7);
    let thump = 1;

    for (const beat of DRUM_BEATS) {
      if (go >= beat && go < beat + 0.05) {
        thump = 0.85;
      }
    }
    // Rillaboom's drum, sized to the caster: a wooden shell and a green head that gives on each beat
    const near = reachOf(stage);
    const stand = aside(kit, home, near * 1.6);
    const head = aside(kit, stand, 0, near * 1.3);

    kit.puff(aside(kit, stand, 0, near * 0.7), near * 0.9, DRUM_WOOD, drum);
    kit.pool(head, near * 0.95 * thump, lighten(DRUM_GREEN, 0.3), drum, { add: 0.1 });
    kit.ripple(head, near * 0.95 * thump, 0.12, mix(DRUM_WOOD, '#000000', 0.3), drum, { add: 0 });
    for (const beat of DRUM_BEATS) {
      const cross = stretch(go, beat, beat + DRUM_CROSS);
      const after = stretch(go, beat + DRUM_CROSS, beat + DRUM_CROSS + 0.25);

      if (cross > 0 && cross < 1) {
        kit.ripple(home, near * (1.4 + cross * 2), 0.1, DRUM_GREEN, decay(cross));
        kit.ripple(
          toward(home, floor, cross),
          near * 1.2 + reach * cross,
          0.14,
          lighten(DRUM_GREEN, 0.3),
          0.9,
        );
      }
      if (after > 0 && after < 1) {
        kit.ripple(floor, reach * (1 + after * 3), 0.12, DRUM_GREEN, decay(after));
        kit.glow(at, reach * 1.4, DRUM_GREEN, decay(after) * 0.5, 0.2);
      }
    }
    for (let root = 0; root < 5; root += 1) {
      const grow = stretch(go, 0.3 + root * 0.06, 0.55 + root * 0.06);

      if (grow <= 0) {
        continue;
      }
      const base = around(kit, floor, (root / 5) * TAU + 0.4, reach * 1.6);
      const path: Spot[] = [base];

      for (let joint = 1; joint <= 4; joint += 1) {
        path.push(
          aside(kit, base, Math.sin(joint * 0.9 + root) * reach * 0.35, joint * reach * 0.8 * grow),
        );
      }
      kit.ribbon(path, reach * 1.3, ROOT_BROWN, kept, 0, { add: 0 });
      kit.ribbon(path, reach * 0.3, DRUM_GREEN, kept * 0.8);
    }
  },

  GMaxFireball(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);

    if (go < FIREBALL_LANDS) {
      const flight = go / FIREBALL_LANDS;

      for (let trail = 5; trail >= 1; trail -= 1) {
        kit.glow(
          arcing(stage.source, at, Math.max(0, flight - trail * 0.05), reach * 4),
          reach * (1.6 - trail * 0.2),
          FIREBALL,
          (1 - trail / 6) * 0.6,
          0.2,
        );
      }
      const ball = arcing(stage.source, at, flight, reach * 4);

      kit.glow(ball, reach * 2.4, FIREBALL, 0.8, 0.5);
      kit.puff(ball, reach * 1.2, FIREBALL_HOT, 1, { add: 0.5 });
      kit.oval(
        ball,
        reach * 1.2,
        reach * 1.2 * Math.max(0.1, Math.abs(Math.cos(flight * 12))),
        0.4,
        0.15,
        FIREBALL,
        1,
      );
      return;
    }
    const hit = (go - FIREBALL_LANDS) / (1 - FIREBALL_LANDS);

    kit.pool(floor, reach * (2 + hit * 4), FIREBALL, decay(hit) * 0.8, { add: 0.6 });
    kit.glow(at, reach * (2 + hit * 3), FIREBALL, decay(hit) * 0.7, 0.5);
    kit.glow(at, reach * (1.4 + hit), FIREBALL_HOT, decay(Math.min(1, hit * 1.8)));
    kit.ring(at, reach * (1.2 + hit * 4), 0.12, FIREBALL_HOT, decay(hit));
    for (let tongue = 0; tongue < 10; tongue += 1) {
      flame(
        kit,
        around(kit, floor, (tongue / 10) * TAU, reach * (1 + hit * 2.6)),
        reach * 1.6 * late(hit, 0.3),
        FIREBALL,
        1,
      );
    }
    debris(kit, at, reach * 1.8, many(12, weight), seed, hit, FIREBALL_HOT, decay(hit));
  },

  GMaxHydrosnipe(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const aim = stretch(go, 0, SNIPE_FIRES);
    const sight = late(go, SNIPE_HITS);
    const muzzle = aside(kit, stage.source, 0, reach * 0.6);
    const beyond = toward(muzzle, at, 1.6);

    kit.trail(muzzle, at, reach * 0.06, SNIPE_BLUE, sight * 0.5);
    kit.ring(at, reach * (1.2 + (1 - aim) * 2.6), 0.05, SNIPE_BLUE, sight);
    kit.ring(at, reach * 0.3, 0.3, '#ffffff', sight);
    for (let hair = 0; hair < 4; hair += 1) {
      const angle = (hair / 4) * TAU + (1 - aim) * 0.8;
      const far = reach * (1.8 + (1 - aim) * 2.6);

      kit.ribbon(
        [
          aside(kit, at, Math.cos(angle) * reach * 0.5, Math.sin(angle) * reach * 0.5),
          aside(kit, at, Math.cos(angle) * far, Math.sin(angle) * far),
        ],
        reach * 0.1,
        '#ffffff',
        sight,
      );
    }
    const shot = stretch(go, SNIPE_FIRES, SNIPE_HITS);

    if (shot > 0) {
      const shown = late(go, 0.6);
      const head = toward(muzzle, beyond, shot);

      kit.ribbon([muzzle, head], reach * 0.7, SNIPE_BLUE, shown * 0.9, share * 10, { add: 0.3 });
      kit.ribbon([muzzle, head], reach * 0.2, '#ffffff', shown, share * 10);
      kit.ring(muzzle, reach * (0.6 + shot * 1.4), 0.12, lighten(SNIPE_BLUE, 0.5), decay(shot));
    }
    const hit = stretch(go, SNIPE_HITS, 1);

    if (hit > 0) {
      kit.glow(at, reach * (1.2 + hit * 1.6), SNIPE_BLUE, decay(hit) * 0.7, 0.4);
      kit.ring(at, reach * (0.8 + hit * 3), 0.1, lighten(SNIPE_BLUE, 0.6), decay(hit));
      debris(
        kit,
        at,
        reach * 1.4,
        many(10, weight),
        seed,
        hit,
        lighten(SNIPE_BLUE, 0.4),
        decay(hit),
      );
    }
  },

  GMaxWindRage(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const blow = Math.min(1, go * 5) * late(go, 0.75);

    stream(
      kit,
      stage.source,
      at,
      Math.min(1, go * 3),
      share * 14,
      4,
      WIND,
      blow * 0.7,
      reach * 1.6,
    );
    for (let gust = 0; gust < many(12, weight); gust += 1) {
      const run = (go * 2.2 + noise(seed, gust)) % 1;

      kit.streak(
        aside(
          kit,
          at,
          (run - 0.5) * reach * 12,
          spread(seed, gust + 20) * reach * 2.4,
          spread(seed, gust + 30) * reach,
        ),
        reach * 1.6,
        reach * 0.12,
        0,
        WIND,
        blow * swell(run),
      );
    }
    for (let feather = 0; feather < many(10, weight); feather += 1) {
      const turn = share * 9 + noise(seed, feather) * TAU;
      const out = reach * (1 + noise(seed, feather + 30) * 2);

      kit.leaf(
        aside(kit, at, Math.cos(turn) * out, Math.sin(turn) * out * 0.5, Math.sin(turn) * out),
        reach * 0.45,
        turn * 2,
        CORVIKNIGHT,
        blow,
      );
    }
    const sweep = stretch(go, 0.3, 1);

    for (let wave = 0; wave < 3; wave += 1) {
      const held = stretch(sweep, wave * 0.15, wave * 0.15 + 0.6);

      kit.ripple(
        aside(kit, floor, held * reach * 5),
        reach * (1.4 + held * 1.4),
        0.08,
        WIND,
        swell(held) * 0.7,
      );
    }
  },

  GMaxGravitas(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const open = stretch(go, 0, 0.25);
    const kept = late(go, 0.8);

    kit.pool(floor, reach * 3 * open, GRAVITY_DARK, kept * 0.85, { add: 0 });
    kit.pool(floor, reach * 1.4, GRAVITY, kept * 0.5, { add: 0.6 });
    for (let wave = 0; wave < 3; wave += 1) {
      const held = (go * 1.8 + wave / 3) % 1;

      kit.ripple(floor, reach * 3.6 * (1 - held), 0.1, GRAVITY, kept * swell(held));
    }
    for (let press = 0; press < 2; press += 1) {
      const held = (go * 1.5 + press / 2) % 1;

      kit.ripple(
        [at[0], at[1] + reach * 3 * (1 - held), at[2]],
        reach * (2.4 - held * 0.6),
        0.1,
        lighten(GRAVITY, 0.4),
        kept * swell(held),
      );
    }
    for (let mote = 0; mote < many(18, weight); mote += 1) {
      const pull = (go * 1.2 + noise(seed, mote)) % 1;
      const angle = noise(seed, mote + 20) * TAU + pull * Math.PI * 3;
      const spot = around(kit, floor, angle, reach * 3.6 * (1 - pull));

      kit.star(
        [spot[0], (1 - pull) * reach * 1.4, spot[2]],
        reach * 0.26,
        0,
        lighten(GRAVITY, 0.6),
        kept * swell(pull),
      );
    }
  },

  GMaxStonesurge(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const geyser = stretch(go, 0, 0.35);

    if (geyser < 1) {
      const head = aside(kit, floor, 0, reach * 5 * Math.min(1, geyser * 2));

      kit.ribbon([floor, head], reach * 1.6 * decay(geyser), DREDNAW_WATER, 0.7, share * 8);
      kit.ribbon(
        [floor, head],
        reach * 0.6 * decay(geyser),
        lighten(DREDNAW_WATER, 0.6),
        0.9,
        share * 8,
      );
      kit.ring(at, reach * (1 + geyser * 3), 0.1, lighten(DREDNAW_WATER, 0.4), decay(geyser));
    }
    scattered(kit, stage, share, seed, weight, STONE, 'rock');
  },

  GMaxVolcalith(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const kept = late(go, 0.8);

    kit.pool(floor, reach * 3.6 * Math.min(1, go * 4), MAGMA, kept * 0.6, { add: 0.5 });
    for (let spire = 0; spire <= SPIRES; spire += 1) {
      const centre = spire === SPIRES;
      const base = centre ? floor : around(kit, floor, (spire / SPIRES) * TAU + 0.3, reach * 2.4);
      const rise = stretch(go, noise(seed, spire) * 0.3, noise(seed, spire) * 0.3 + 0.15);

      if (rise <= 0) {
        continue;
      }
      const tall =
        reach * (centre ? 4 : 2.4 + noise(seed, spire + 10) * 1.6) * Math.min(1, rise * 1.2);

      kit.glow(base, reach * 1.2, MAGMA, kept * 0.7, 0.4);
      spike(kit, base, tall, spread(seed, spire + 20) * 0.3, reach * 0.7, SPIRE_ROCK, kept);
      spike(kit, base, tall * 0.4, spread(seed, spire + 20) * 0.3, reach * 0.3, MAGMA, kept * 0.9);
      if (rise < 1) {
        debris(kit, base, reach * 1.2, 5, seed + spire, rise, SPIRE_ROCK, decay(rise));
      }
    }
    sparks(
      kit,
      aside(kit, floor, 0, reach),
      reach * 3.4,
      many(12, weight),
      seed,
      go,
      lighten(MAGMA, 0.4),
      kept,
    );
  },

  GMaxTartness(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);
    // Bursts just over the target, below the cloud it fell from
    const over = aside(kit, at, 0, reachOf(stage) * 1.8);

    if (go < FRUIT_LANDS) {
      const apple = toward(top, over, go / FRUIT_LANDS);

      kit.puff(apple, reach * 1.3, APPLE_RED, 1, { add: 0.2 });
      kit.puff(
        aside(kit, apple, -reach * 0.4, reach * 0.3, -reach * 0.3),
        reach * 0.5,
        APPLE_GREEN,
        0.9,
        { add: 0.2 },
      );
      kit.leaf(aside(kit, apple, reach * 0.3, reach * 1.3), reach * 0.4, 0.8, APPLE_GREEN, 1);
      return;
    }
    const spray = (go - FRUIT_LANDS) / (1 - FRUIT_LANDS);

    kit.glow(over, reach * (1.4 + spray * 2), ACID, decay(spray) * 0.6, 0.3);
    debris(kit, over, reach * 1.2, 6, seed, spray, APPLE_RED, decay(spray));
    for (let drop = 0; drop < many(18, weight); drop += 1) {
      const start = noise(seed, drop) * 0.3;
      const fly = stretch(spray, start, start + 0.45);
      const land = around(
        kit,
        floor,
        noise(seed, drop + 10) * TAU,
        reach * (0.5 + noise(seed, drop + 20) * 2.6),
      );

      if (fly > 0 && fly < 1) {
        kit.glow(arcing(over, land, fly, reach * 1.2), reach * 0.4, ACID, 1, 0.3, { add: 0.15 });
      } else if (fly >= 1) {
        const splat = stretch(spray, start + 0.45, 1);

        kit.ripple(land, reach * (0.3 + splat * 0.6), 0.2, ACID, decay(splat));
        kit.bubble(aside(kit, land, 0, splat * reach * 0.8), reach * 0.14, ACID, decay(splat));
      }
    }
  },

  GMaxSweetness(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);

    if (go < FRUIT_LANDS) {
      const fall = go / FRUIT_LANDS;
      const glob = toward(top, at, fall * fall);

      kit.glow(glob, reach * 1.8, NECTAR, 0.6, 0.3);
      kit.puff(glob, reach * 1, HONEY, 1, { add: 0.3 });
    } else {
      const hit = stretch(go, FRUIT_LANDS, 0.7);

      kit.glow(at, reach * (1.6 + hit * 1.6), NECTAR, decay(hit) * 0.7, 0.4);
      kit.ring(at, reach * (1 + hit * 2.6), 0.12, HONEY, decay(hit));
      debris(kit, at, reach * 1.3, 8, seed, hit, HONEY, decay(hit));
    }
    const rain = stretch(go, 0.25, 1);

    if (rain <= 0) {
      return;
    }
    // Sized to the caster rather than to the blow: this falls over its own side
    const near = reachOf(stage);
    const home = stage.source;

    kit.glow(home, near * 2.2, HONEY, swell(rain) * 0.5, 0.3);
    kit.pool(floorOf(home), near * 2.4, NECTAR, swell(rain) * 0.5, { add: 0.5 });
    for (let drop = 0; drop < many(16, weight); drop += 1) {
      const fall = (rain * 1.6 + noise(seed, drop)) % 1;

      kit.leaf(
        aside(
          kit,
          home,
          spread(seed, drop + 30) * near * 2.6,
          near * 4 - fall * near * 5,
          spread(seed, drop + 40) * near,
        ),
        near * 0.28,
        Math.PI / 2,
        NECTAR,
        late(rain, 0.8) * swell(fall),
      );
    }
    sparks(kit, home, near * 2, many(10, weight), seed, rain, '#fff2b0', late(rain, 0.7));
  },

  GMaxSandblast(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const kept = Math.min(1, go * 5) * late(go, 0.8);

    kit.pool(floor, reach * 3, mix(SAND, '#5a4020', 0.3), kept * 0.6, { add: 0 });
    for (let band = 0; band < 7; band += 1) {
      const rise = band / 6;

      kit.ripple(
        aside(kit, floor, Math.sin(share * 8 + band) * reach * 0.3, rise * reach * 5),
        reach * (0.8 + rise * 2.2),
        0.18,
        band % 2 === 0 ? SAND : lighten(SAND, 0.3),
        kept * 0.8,
        { add: 0.2 },
      );
    }
    for (let grain = 0; grain < many(26, weight); grain += 1) {
      const rise = (go * 1.5 + noise(seed, grain)) % 1;
      const angle = noise(seed, grain + 20) * TAU + share * 14;
      const spot = around(kit, floor, angle, reach * (0.8 + rise * 2.2));

      kit.glow([spot[0], rise * reach * 5, spot[2]], reach * 0.14, lighten(SAND, 0.2), kept, 0, {
        add: 0.2,
      });
    }
  },

  GMaxStunShock(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const kept = late(go, 0.8);
    const flick = Math.floor(share * 24);

    kit.glow(at, reach * 2.6, TOXIC_PURPLE, kept * 0.45, 0.2);
    kit.glow(at, reach * 1.4, SHOCK_YELLOW, kept * (flick % 2 === 0 ? 0.6 : 0.3));
    kit.pool(floorOf(at), reach * 3, TOXIC_PURPLE, kept * 0.5, { add: 0.5 });
    for (let arc = 0; arc < many(8, weight); arc += 1) {
      const angle = noise(seed + flick, arc) * TAU;
      const out = reach * (2 + noise(seed + flick, arc + 9) * 1.6);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        seed + flick * 7 + arc,
        reach * 0.5,
        reach * 0.07,
        arc % 2 === 0 ? TOXIC_PURPLE : SHOCK_YELLOW,
        kept,
      );
    }
    for (let drop = 0; drop < many(10, weight); drop += 1) {
      const rise = (go * 1.4 + noise(seed, drop)) % 1;

      kit.bubble(
        aside(kit, at, spread(seed, drop + 20) * reach * 2, -reach * 0.8 + rise * reach * 3),
        reach * 0.25,
        TOXIC_PURPLE,
        kept * swell(rise),
      );
    }
  },

  GMaxCentiferno(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const coil = stretch(go, 0, COIL_CLOSES);
    const kept = late(go, 0.8);
    const settled = stretch(go, COIL_CLOSES, COIL_CLOSES + 0.2);

    kit.ripple(floor, reach * 2.6, 0.12, CENTI_FIRE, kept * coil);
    kit.pool(floor, reach * 3, CENTI_FIRE, kept * coil * 0.5, { add: 0.6 });
    for (let segment = 0; segment < COIL_SEGMENTS; segment += 1) {
      const along = segment / COIL_SEGMENTS;

      if (along > coil) {
        continue;
      }
      const angle = along * TAU * 2 + share * 5;
      const high = (1 - along / Math.max(0.01, coil)) * reach * 4 * (1 - settled);
      const ground = around(kit, floor, angle, reach * 2.6);
      const spot: Spot = [ground[0], reach * 0.4 + high, ground[2]];

      kit.glow(spot, reach * 0.9, CENTI_FIRE, kept * 0.6, 0.3);
      kit.puff(spot, reach * 0.45, CENTI_BODY, kept);
      flame(kit, spot, reach * (1 + Math.sin(share * 30 + segment) * 0.3), CENTI_FIRE, kept * 0.9);
    }
    kit.glow(at, reach * 1.6, CENTI_FIRE, kept * coil * 0.4, 0.3);
  },

  GMaxSmite(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);
    const head = toward(top, floor, stretch(go, 0, 0.2));
    const kept = late(go, 0.7);

    kit.ribbon([top, head], reach * 2.8 * kept, SMITE_PINK, 0.8, share * 6, { add: 0.4 });
    kit.ribbon([top, head], reach * 1 * kept, '#ffffff', 0.9, share * 6);
    kit.pool(floor, reach * 2.6, SMITE_PINK, kept * 0.8, { add: 0.6 });
    kit.ripple(aside(kit, at, 0, reach * 2.6), reach * 1.4, 0.12, lighten(SMITE_PINK, 0.4), kept);
    for (let wave = 0; wave < 2; wave += 1) {
      const held = (go * 1.6 + wave / 2) % 1;

      kit.ripple(floor, reach * (1.2 + held * 3), 0.1, SMITE_PINK, kept * decay(held));
    }
    for (let glint = 0; glint < many(12, weight); glint += 1) {
      const fall = (go * 1.4 + noise(seed, glint)) % 1;

      kit.star(
        aside(
          kit,
          toward(top, floor, fall),
          spread(seed, glint + 20) * reach * 1.6,
          0,
          spread(seed, glint + 30) * reach,
        ),
        reach * 0.36,
        fall * 3,
        '#ffffff',
        kept * swell(fall),
      );
    }
  },

  GMaxSnooze(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    // The yawn is the caster's own mouth, so it is sized to the caster
    const near = reachOf(stage);
    const mouth = aside(kit, stage.source, 0, near * 1.6);
    const yawn = swell(stretch(go, 0, 0.5));

    if (yawn > 0) {
      // Dark lips round a wide pink mouth
      kit.puff(mouth, near * 1.2 * yawn, GRIMMSNARL, 1);
      kit.puff(
        aside(kit, mouth, 0, -near * 0.1 * yawn, -near * 0.3),
        near * 0.95 * yawn,
        '#ff7aa8',
        1,
      );
    }
    for (let puff = 0; puff < 10; puff += 1) {
      const drift = stretch(go, 0.1 + puff * 0.03, 0.55 + puff * 0.03);

      if (drift <= 0 || drift >= 1) {
        continue;
      }
      kit.puff(
        aside(
          kit,
          toward(mouth, at, drift),
          spread(seed, puff) * reach,
          spread(seed, puff + 10) * reach * 0.6,
        ),
        reach * (0.6 + drift * 1.2),
        SNOOZE_HAZE,
        swell(drift) * 0.45,
      );
    }
    const sleep = stretch(go, 0.45, 1);

    if (sleep > 0) {
      kit.glow(at, reach * 2.4, SNOOZE_HAZE, late(sleep, 0.5) * 0.5, 0);
      for (let letter = 0; letter < 3; letter += 1) {
        const rise = stretch(sleep, letter * 0.15, letter * 0.15 + 0.7);

        if (rise > 0 && rise < 1) {
          zee(
            kit,
            aside(
              kit,
              at,
              reach * (0.6 + letter * 0.5) + Math.sin(rise * 6) * reach * 0.3,
              reach * (1 + rise * 2.4),
            ),
            reach * (0.7 + letter * 0.25),
            mix(SNOOZE_HAZE, GRIMMSNARL, 0.3),
            swell(rise),
          );
        }
      }
    }
  },

  GMaxFinale(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const hit = stretch(go, 0, 0.45);

    if (hit < 1) {
      kit.glow(at, reach * (1.6 + hit * 2), CREAM_PINK, decay(hit) * 0.7, 0.4);
      kit.ring(at, reach * (1 + hit * 2.6), 0.14, CREAM, decay(hit));
      debris(kit, at, reach * 1.3, 8, seed, hit, CREAM, decay(hit));
    }
    const rain = stretch(go, 0.2, 1);

    if (rain <= 0) {
      return;
    }
    // Sized to the caster rather than to the blow: this falls over its own side
    const near = reachOf(stage);
    const home = stage.source;
    const kept = late(rain, 0.8);

    kit.glow(home, near * 2.2, CREAM_PINK, swell(rain) * 0.45, 0.3);
    for (let dollop = 0; dollop < many(8, weight); dollop += 1) {
      const fall = (rain * 1.3 + noise(seed, dollop)) % 1;
      const spot = aside(
        kit,
        home,
        spread(seed, dollop + 30) * near * 2.6,
        near * 4 - fall * near * 5,
        spread(seed, dollop + 40) * near,
      );

      kit.puff(spot, near * 0.42, dollop % 2 === 0 ? CREAM : CREAM_PINK, kept * swell(fall), {
        add: 0.2,
      });
      kit.puff(aside(kit, spot, 0, near * 0.28), near * 0.22, CREAM, kept * swell(fall), {
        add: 0.2,
      });
    }
    for (let sprinkle = 0; sprinkle < many(20, weight); sprinkle += 1) {
      const fall = (rain * 1.8 + noise(seed, sprinkle + 50)) % 1;

      kit.streak(
        aside(
          kit,
          home,
          spread(seed, sprinkle + 70) * near * 3,
          near * 4 - fall * near * 5,
          spread(seed, sprinkle + 80) * near,
        ),
        near * 0.2,
        near * 0.07,
        noise(seed, sprinkle + 90) * Math.PI,
        SPRINKLE_TONES[sprinkle % SPRINKLE_TONES.length],
        kept * swell(fall),
        { add: 0.2 },
      );
    }
  },

  GMaxSteelsurge(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const hit = stretch(go, 0, 0.3);

    if (hit < 1) {
      kit.glow(at, reach * (1.6 + hit * 2), COPPER, decay(hit) * 0.7, 0.4);
      kit.ring(at, reach * (1 + hit * 2.8), 0.12, STEEL, decay(hit));
    }
    scattered(kit, stage, share, seed, weight, STEEL, 'spike');
  },

  GMaxDepletion(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);
    const kept = late(go, 0.8);
    const grip = stretch(go, 0, 0.25);

    for (let band = 0; band < 3; band += 1) {
      kit.ring(
        at,
        reach * (1.4 + band * 0.7) * (1.6 - grip * 0.6),
        0.06,
        band === 1 ? DURALUDON : DRAIN_CYAN,
        kept * grip * 0.8,
      );
    }
    kit.glow(at, reach * 2 * (1 - go * 0.6), DRAIN_CYAN, kept * 0.6, 0.4);
    for (let line = 0; line < many(14, weight); line += 1) {
      const rise = (go * 1.8 + noise(seed, line)) % 1;
      const spot = aside(
        kit,
        toward(at, top, rise),
        spread(seed, line + 20) * reach * 1.4 * (1 - rise * 0.6),
        0,
        spread(seed, line + 30) * reach,
      );

      kit.streak(
        aside(kit, spot, 0, -reach * 0.35),
        reach * 0.35,
        reach * 0.12,
        Math.PI / 2,
        line % 3 === 0 ? GMAX_MAGENTA : DRAIN_CYAN,
        kept * swell(rise),
      );
      kit.glow(spot, reach * 0.18, '#ffffff', kept * swell(rise));
    }
  },

  GMaxOneBlow(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const top = cloudOver(stage);

    if (go < ONE_BLOW_LANDS) {
      const fall = go / ONE_BLOW_LANDS;
      const spot = toward(top, aside(kit, at, 0, reach * 1.2), fall * fall);

      for (let side = 0; side < 6; side += 1) {
        const from = (side / 6) * TAU;
        const to = ((side + 1) / 6) * TAU;

        kit.trail(
          aside(kit, at, Math.cos(from) * reach * 1.8, Math.sin(from) * reach * 1.6),
          aside(kit, at, Math.cos(to) * reach * 1.8, Math.sin(to) * reach * 1.6),
          reach * 0.12,
          '#bfe0ff',
          0.4 + fall * 0.5,
        );
      }
      kit.ribbon([aside(kit, spot, 0, reach * 3), spot], reach * 1.6, ONE_RED, 0.6);
      kit.glow(spot, reach * 3, ONE_RED, 0.8, 0.2);
      fist(kit, spot, reach * 1.8, ONE_DARK, 1);
      return;
    }
    const hit = (go - ONE_BLOW_LANDS) / (1 - ONE_BLOW_LANDS);

    debris(kit, at, reach * 2, 12, seed, hit, '#bfe0ff', decay(hit));
    kit.glow(at, reach * (2 + hit * 2.6), ONE_RED, decay(hit) * 0.7, 0.4);
    kit.puff(at, reach * (1.4 + hit), GMAX_DARK, decay(Math.min(1, hit * 1.6)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = stretch(hit, wave * 0.15, wave * 0.15 + 0.6);

      kit.ripple(
        floor,
        reach * (1.2 + held * 5),
        0.14,
        wave === 1 ? ONE_RED : ONE_DARK,
        decay(held),
        { add: wave === 1 ? 1 : 0 },
      );
    }
    for (let crack = 0; crack < 7; crack += 1) {
      const angle = (crack / 7) * TAU + noise(seed, crack);
      const out = reach * (1.6 + noise(seed, crack + 10) * 2) * Math.min(1, hit * 3);

      kit.ribbon(
        [floor, around(kit, floor, angle, out * 0.5), around(kit, floor, angle + 0.15, out)],
        reach * 0.16,
        ONE_DARK,
        late(hit, 0.5),
        0,
        { add: 0 },
      );
    }
    sparks(kit, at, reach * 3.6, 14, seed, hit, ONE_RED, decay(Math.min(1, hit * 2)));
  },

  GMaxRapidFlow(kit, stage, share, { paint, seed, weight }) {
    gMaxPower(kit, stage, share, paint.color, seed);
    const go = gigantic(share);

    if (go <= 0) {
      return;
    }
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const kept = late(go, 0.8);

    stream(
      kit,
      stage.source,
      at,
      Math.min(1, go * 4),
      share * 16,
      3,
      FLOW_BLUE,
      kept * 0.8,
      reach * 1.2,
    );
    for (const [index, lands] of FLOW_FISTS.entries()) {
      const angle = noise(seed, index) * TAU;
      const flight = stretch(go, lands - 0.08, lands);
      const hit = stretch(go, lands, lands + 0.18);
      const from = aside(kit, at, Math.cos(angle) * reach * 4, Math.sin(angle) * reach * 3);

      if (flight > 0 && flight < 1) {
        const spot = toward(from, at, flight);

        kit.trail(toward(from, at, Math.max(0, flight - 0.5)), spot, reach * 0.45, FLOW_BLUE, 0.6);
        fist(kit, spot, reach * 0.7, lighten(FLOW_BLUE, 0.2), 1);
      }
      if (hit > 0 && hit < 1) {
        kit.ring(at, reach * (0.8 + hit * 2), 0.12, lighten(FLOW_BLUE, 0.5), decay(hit));
        debris(kit, at, reach * 1.1, 6, seed + index, hit, lighten(FLOW_BLUE, 0.5), decay(hit));
      }
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

/**
 * G-Max Stonesurge's stones and Steelsurge's spikes: thrown out of the
 * hit in arcs and left round the target, stones hovering and spikes
 * stuck in the floor
 */
function scattered(
  kit: EffectBatch,
  stage: LitStage,
  share: number,
  seed: number,
  weight: number,
  colour: string,
  kind: 'rock' | 'spike',
): void {
  const go = gigantic(share);
  const at = landed(stage);
  const floor = floorOf(at);
  const reach = reachOf(stage, weight);
  const kept = late(go, 0.85);
  // Stones in two greys, spikes in copper and steel
  const dark = kind === 'rock' ? colour : COPPER;
  const pale = kind === 'rock' ? lighten(colour, 0.25) : STEEL;

  for (let piece = 0; piece < 8; piece += 1) {
    const thrown = stretch(go, SURGE_THROWN + piece * 0.02, SURGE_SETTLES + piece * 0.02);

    if (thrown <= 0) {
      continue;
    }
    const angle = (piece / 8) * TAU + noise(seed, piece) * 0.5;
    const rest = around(kit, floor, angle, reach * (2 + noise(seed, piece + 10) * 1.4));
    const tone = piece % 2 === 0 ? dark : pale;

    if (kind === 'rock') {
      const hover = aside(kit, rest, 0, reach * 0.8 + Math.sin(share * 10 + piece) * reach * 0.2);
      const spot = thrown < 1 ? arcing(at, hover, thrown, reach * 2) : hover;

      kit.pool(rest, reach * 0.5, '#000000', kept * 0.3 * thrown, { add: 0 });
      kit.shard(spot, reach * 0.42, noise(seed, piece + 20) * 6 + (1 - thrown) * 6, tone, kept);
      continue;
    }
    if (thrown < 1) {
      spike(
        kit,
        arcing(at, rest, thrown, reach * 2.4),
        reach * 1.2,
        (1 - thrown) * 6 + angle,
        reach * 0.18,
        tone,
        kept,
      );
    } else {
      spike(kit, rest, reach * 1.3, Math.cos(angle) * 0.4, reach * 0.22, tone, kept);
      if ((piece + Math.floor(share * 12)) % 4 === 0) {
        kit.star(
          aside(kit, rest, Math.cos(angle) * reach * 0.3, reach * 1.1),
          reach * 0.4,
          0,
          '#ffffff',
          kept,
        );
      }
    }
  }
}

export default gMaxGalar;
