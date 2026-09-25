import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import { type EffectShape, many } from '../effect/shapes';
import {
  GUARDIAN_POUNDS,
  GUARDIAN_RISES,
  MOONLIGHT,
  MOONRAZE_HITS,
  MOONRAZE_OPEN,
  MOON_VIOLET,
  NOVA_BURSTS,
  NOVA_FALLS,
  NOVA_PINK,
  NOVA_RISES,
  NOVA_VIOLET,
  PRISM,
  SCALE_GOLD,
  SCOURED,
  SEVEN_ENDS,
  SEVEN_SINKS,
  SHADE,
  SHADE_FLAME,
  SKY_FIRES,
  SKY_LANDS,
  SKY_WHITE,
  SOUL,
  SOULBLAZE_FIRES,
  SOULBLAZE_HITS,
  STORM_BREAKS,
  STORM_RISES,
  SUNRAZE_CHARGES,
  SUNRAZE_HITS,
  SUN_GOLD,
  SUN_ORANGE,
  SUN_STEEL,
  TAPU_SHELL,
  TAPU_TONES,
  VOID,
} from '../effect/z-legends';
import { TAU, arcing, debris, gathering, sickle, sparks, spiral } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  toward,
} from './shapes';
import { unleashed, zPower } from './z-power';

/** Cracks running out along the floor from a spot */
function cracks(
  kit: EffectBatch,
  floor: Spot,
  reach: number,
  count: number,
  seed: number,
  colour: string,
  alpha: number,
): void {
  for (let crack = 0; crack < count; crack += 1) {
    const angle = (crack / count) * TAU + noise(seed, crack) * 0.5;
    const out = reach * (0.6 + noise(seed, crack + 20) * 0.4);
    const path: Spot[] = [];

    for (let step = 0; step <= 5; step += 1) {
      const along = step / 5;
      const wander = spread(seed, crack * 7 + step) * reach * 0.08 * Math.sin(Math.PI * along);

      path.push([
        floor[0] + Math.cos(angle) * out * along - Math.sin(angle) * wander,
        0.02,
        floor[2] + Math.sin(angle) * out * along + Math.cos(angle) * wander,
      ]);
    }
    kit.ribbon(path, reach * 0.05, colour, alpha, 0, { add: 0 });
  }
}

/** Strands winding round the line from one spot to another, widening as they go */
function maelstrom(
  kit: EffectBatch,
  from: Spot,
  to: Spot,
  drawn: number,
  strands: number,
  width: number,
  turn: number,
  colour: string,
  alpha: number,
  thick: number,
): void {
  for (let strand = 0; strand < strands; strand += 1) {
    const path: Spot[] = [];

    for (let step = 0; step <= 16; step += 1) {
      const along = (step / 16) * drawn;
      const angle = along * TAU * 2.5 + turn + (strand / strands) * TAU;
      const round = width * (0.25 + along);

      path.push(
        aside(kit, toward(from, to, along), Math.cos(angle) * round, 0, Math.sin(angle) * round),
      );
    }
    kit.ribbon(path, thick, colour, alpha, turn);
  }
}

const zLegends = {
  // A giant pastel guardian shell looming up behind the caster, its fists pounding down and cracking the ground
  Guardian(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const rise = Math.min(1, share / 0.2, done / GUARDIAN_RISES + 0.3);
    const kept = late(done, 0.85);
    const giant = aside(kit, stage.source, 0, reach * (1.5 + rise * 2.5), reach * 1.5);
    const hands = [
      aside(kit, giant, -reach * 3 * rise, -reach * 0.6),
      aside(kit, giant, reach * 3 * rise, -reach * 0.6),
    ];

    kit.glow(giant, reach * 4.6 * rise, TAPU_TONES[1], kept * 0.3, 0.2);
    for (const [side, start] of [Math.PI * 0.62, -Math.PI * 0.38].entries()) {
      sickle(
        kit,
        giant,
        reach * 2.6 * rise,
        start,
        start + Math.PI * 0.76,
        reach * 1.3,
        TAPU_SHELL,
        kept * 0.75,
        0.4,
      );
      sickle(
        kit,
        giant,
        reach * 2.6 * rise,
        start + 0.1,
        start + Math.PI * 0.66,
        reach * 0.4,
        TAPU_TONES[side * 2],
        kept * 0.8,
      );
    }
    kit.ribbon(
      [aside(kit, giant, 0, reach), aside(kit, giant, 0, reach * 3.4 * rise)],
      reach * 0.7,
      TAPU_TONES[2],
      kept * 0.85,
    );
    for (const side of [-1, 1]) {
      kit.glow(
        aside(kit, giant, side * reach * 0.6, reach * 0.2),
        reach * 0.4 * rise,
        '#ffffff',
        kept,
      );
    }
    for (const hand of hands) {
      kit.glow(hand, reach * 0.9 * rise, TAPU_SHELL, kept * 0.6, 0.3);
    }
    for (const [pound, lands] of GUARDIAN_POUNDS.entries()) {
      const fall = (done - lands + 0.1) / 0.1;
      const tone = TAPU_TONES[pound % TAPU_TONES.length];
      const hand = hands[pound % 2];

      if (fall > 0 && fall < 1) {
        const fist = toward(hand, aside(kit, at, 0, reach * 0.2), fall * fall);

        kit.trail(hand, fist, reach * 1.2, TAPU_SHELL, 0.5);
        kit.glow(fist, reach * 1.3, tone, 1, 0.5);
        kit.glow(fist, reach * 0.6, '#ffffff', 0.9);
        continue;
      }
      if (fall < 1) {
        continue;
      }
      const hit = Math.min(1, (done - lands) / 0.3);

      cracks(
        kit,
        floor,
        reach * (2 + pound * 0.6),
        6,
        seed + pound,
        mix(tone, '#5b4a3a', 0.5),
        late(done, 0.8),
      );
      kit.pool(floor, reach * (1.4 + hit * 2), tone, decay(hit) * 0.6);
      kit.glow(at, reach * (1 + hit * 1.8), tone, decay(hit), 0.6);
      kit.star(at, reach * (1.2 + hit * 2.4), pound, '#ffffff', decay(Math.min(1, hit * 2)));
      kit.ripple(floor, reach * (0.8 + hit * 3.4), 0.1, tone, decay(hit));
      debris(
        kit,
        aside(kit, floor, 0, reach * 0.2),
        reach * 1.2,
        many(8, weight),
        seed + pound,
        hit,
        mix(tone, '#7a6a58', 0.6),
        decay(hit),
      );
    }
  },

  // Sinking into its shadow, seven green-flamed blows out of the dark, and the soul drawn out of it
  SevenStar(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const sink = Math.min(1, done / SEVEN_SINKS);
    const kept = late(done, 0.85);
    const light = lighten(SHADE_FLAME, 0.5);

    kit.pool(floor, reach * 3 * Math.max(0.2, sink), SHADE, kept * 0.85, { add: 0 });
    if (done < SEVEN_SINKS) {
      const home = floorOf(stage.source);
      const head = toward(home, floor, sink);

      kit.trail(home, head, reach * 0.7, SHADE, 0.8);
      kit.glow(aside(kit, head, 0, reach * 0.3), reach * 0.7, SHADE_FLAME, 0.7, 0.3);
    }
    for (let lick = 0; lick < many(10, weight); lick += 1) {
      const rise = (share * 1.5 + noise(seed, lick)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, lick + 5) * reach * 1.6,
          rise * reach * 1.6,
          spread(seed, lick + 9) * reach,
        ),
        reach * 0.25 * (1 - rise * 0.5),
        SHADE_FLAME,
        swell(rise) * kept * sink * 0.8,
        0.3,
      );
    }
    for (let blow = 0; blow < 7; blow += 1) {
      const start = SEVEN_SINKS + (blow / 7) * (SEVEN_ENDS - SEVEN_SINKS - 0.06);
      const angle = (blow / 7) * TAU * 3 + spread(seed, blow) * 0.3;
      const from = aside(
        kit,
        at,
        Math.cos(angle) * reach * 2.6,
        -Math.sin(angle) * reach * 1.8,
        Math.sin(angle * 2) * reach * 0.5,
      );
      const thrown = (done - start) / 0.05;
      const impact = (done - start - 0.05) / 0.1;

      if (thrown > 0 && thrown < 1) {
        const fist = toward(from, at, thrown);

        kit.trail(from, fist, reach * 0.6, SHADE, 0.8);
        kit.trail(from, fist, reach * 0.24, SHADE_FLAME, 1);
        kit.glow(fist, reach * 0.55, light, 1, 0.6);
      }
      if (impact >= 0 && impact < 1) {
        kit.star(at, reach * (0.8 + impact * 1.2), angle, '#ffffff', decay(impact));
        sparks(kit, at, reach * 1.6, 8, seed + blow, impact, SHADE_FLAME, decay(impact));
      }
    }
    if (done < SEVEN_ENDS) {
      return;
    }
    const blast = (done - SEVEN_ENDS) / (1 - SEVEN_ENDS);
    const soul = aside(kit, at, Math.sin(blast * 7) * reach * 0.4, reach * (0.4 + blast * 5));

    kit.glow(at, reach * (1.4 + blast * 2), SHADE, decay(blast) * 0.8, 0, { add: 0 });
    kit.glow(at, reach * (1 + blast * 1.4), SHADE_FLAME, decay(blast), 0.5);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(blast, 1.6, wave * 0.25);

      kit.ring(
        at,
        reach * (0.8 + held * 3),
        0.1,
        wave % 2 === 0 ? SHADE_FLAME : SHADE,
        decay(held),
        {
          add: wave % 2 === 0 ? 1 : 0,
        },
      );
    }
    kit.trail(at, soul, reach * 0.5, SOUL, decay(blast) * 0.6);
    kit.glow(soul, reach * 0.7, SOUL, swell(Math.min(1, blast * 1.5)), 0.8);
  },

  // Mew soaring up, a pink sphere swelling over the field, bursting on it, and the floor left psychic pink
  Supernova(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const middle = toward(stage.source, at, 0.5);
    const high: Spot = [middle[0], Math.max(stage.source[1], at[1]) + reach * 6, middle[2]];

    if (done < NOVA_RISES) {
      const up = done / NOVA_RISES;

      kit.ribbon(
        [stage.source, arcing(stage.source, high, up * 0.5, reach), toward(stage.source, high, up)],
        reach * 0.4,
        NOVA_PINK,
        0.8,
        share * 10,
      );
    }
    if (done < NOVA_BURSTS) {
      const swollen = Math.min(1, share / 0.3, done / NOVA_FALLS + 0.2);
      const fall = Math.max(0, (done - NOVA_FALLS) / (NOVA_BURSTS - NOVA_FALLS));
      const sphere = toward(high, at, fall * fall);
      const radius = reach * 2.8 * swollen;

      kit.glow(sphere, radius * 1.5, NOVA_VIOLET, 0.4, 0.2);
      kit.glow(sphere, radius, NOVA_PINK, 0.9, 0.6);
      spiral(kit, sphere, radius * 1.3, 2, share * 3, lighten(NOVA_PINK, 0.5), 0.7, reach * 0.08);
      gathering(kit, sphere, radius * 2, many(14, weight), seed, share, NOVA_VIOLET);
      kit.pool(floor, reach * 3 * fall, NOVA_PINK, fall * 0.5);
      return;
    }
    const blast = (done - NOVA_BURSTS) / (1 - NOVA_BURSTS);
    const kept = late(blast, 0.6);

    kit.pool(floor, reach * (3 + blast * 5), NOVA_PINK, kept * 0.55, { add: 0.5 });
    kit.glow(
      at,
      reach * (3 + swell(Math.min(1, blast * 2)) * 2),
      NOVA_PINK,
      decay(Math.min(1, blast * 1.3)),
      0.4,
    );
    kit.glow(at, reach * 1.8, '#ffffff', decay(Math.min(1, blast * 2.5)));
    kit.star(at, reach * (3 + blast * 4), blast, '#ffffff', decay(Math.min(1, blast * 1.8)));
    for (let wave = 0; wave < 4; wave += 1) {
      const held = staged(blast, 1.8, wave * 0.22);

      kit.ring(
        at,
        reach * (1 + held * 5),
        0.08,
        wave % 2 === 0 ? NOVA_PINK : NOVA_VIOLET,
        decay(held),
      );
      kit.ripple(floor, reach * (1 + held * 6), 0.08, NOVA_PINK, decay(held) * 0.8);
    }
    sparks(
      kit,
      at,
      reach * (3 + blast * 3),
      18,
      seed,
      blast,
      lighten(NOVA_PINK, 0.5),
      decay(blast),
    );
  },

  // Blinding light gathered into a sun over it, then a prismatic column slamming down
  Skyburn(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const sun = aside(kit, at, 0, reach * 7);
    const charge = Math.min(1, share / 0.3, done / SKY_FIRES + 0.2);
    const kept = late(done, 0.75);

    kit.glow(sun, reach * 3 * charge, SUN_GOLD, kept * 0.5, 0.3);
    kit.glow(sun, reach * 1.8 * charge, SKY_WHITE, kept);
    for (const [tone, colour] of PRISM.entries()) {
      kit.ring(sun, reach * (2 + tone * 0.25) * charge, 0.05, colour, kept * 0.6);
    }
    sparks(kit, sun, reach * 4 * charge, 16, seed, share, SKY_WHITE, kept * 0.8);
    if (done < SKY_FIRES) {
      for (let mote = 0; mote < many(12, weight); mote += 1) {
        const held = (share * 1.6 + noise(seed, mote)) % 1;
        const from = aside(kit, stage.source, spread(seed, mote) * reach * 2);

        kit.glow(
          toward(from, sun, held),
          reach * 0.3,
          PRISM[mote % PRISM.length],
          swell(held),
          0.5,
        );
      }
      return;
    }
    const drawn = Math.min(1, (done - SKY_FIRES) / (SKY_LANDS - SKY_FIRES));
    const path = [sun, toward(sun, floor, drawn * 0.5), toward(sun, floor, drawn)];
    const thick = late(done, 0.7);

    for (const [tone, colour] of PRISM.entries()) {
      kit.ribbon(path, reach * (3.2 - tone * 0.35) * thick, colour, thick * 0.6, share * 8);
    }
    kit.ribbon(path, reach * 0.9 * thick, SKY_WHITE, thick, share * 14);
    if (done < SKY_LANDS) {
      return;
    }
    const hit = (done - SKY_LANDS) / (1 - SKY_LANDS);

    kit.pool(floor, reach * (2 + hit * 3), SKY_WHITE, late(hit, 0.4) * 0.7, { add: 0.5 });
    kit.glow(at, reach * (1.6 + hit * 2), SKY_WHITE, decay(hit));
    kit.star(at, reach * (2 + hit * 3), 0, '#ffffff', decay(Math.min(1, hit * 2)));
    for (const [tone, colour] of PRISM.entries()) {
      const held = staged(hit, 1.6, tone * 0.08);

      kit.ripple(floor, reach * (1 + held * 4), 0.06, colour, decay(held) * 0.8);
    }
  },

  // The caster rising as a blazing steel-bright sun and charging down on it in an arc of fire
  Sunraze(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const lift = aside(kit, stage.source, 0, reach * 3);

    if (done < SUNRAZE_HITS) {
      const up = Math.min(1, share / 0.3, done / SUNRAZE_CHARGES + 0.2);
      const along = Math.max(0, (done - SUNRAZE_CHARGES) / (SUNRAZE_HITS - SUNRAZE_CHARGES));
      const head =
        along > 0 ? arcing(lift, at, along * along, reach * 4) : toward(stage.source, lift, up);

      if (along > 0) {
        const path: Spot[] = [];

        for (let step = 0; step <= 6; step += 1) {
          path.push(
            arcing(lift, at, Math.max(0, along * along - 0.3 + (step / 6) * 0.3), reach * 4),
          );
        }
        kit.ribbon(path, reach * 2.4, SUN_ORANGE, 0.6, share * 10);
        kit.ribbon(path, reach, SUN_GOLD, 0.9, share * 14);
        sparks(kit, head, reach * 2, many(12, weight), seed, along, SUN_GOLD, 0.9);
      }
      kit.glow(head, reach * 2.6 * up, SUN_ORANGE, 0.6, 0.3);
      sparks(kit, head, reach * 3 * up, 12, seed + Math.floor(share * 20), 0.6, SUN_GOLD, 0.8);
      kit.glow(head, reach * 1.4 * up, SUN_STEEL, 1);
      kit.ring(head, reach * 1.5 * up, 0.1, SUN_STEEL, 0.9);
      kit.pool(floorOf(head), reach * 2 * up, SUN_ORANGE, 0.4);
      return;
    }
    const hit = (done - SUNRAZE_HITS) / (1 - SUNRAZE_HITS);

    kit.pool(floor, reach * (2 + hit * 2.4), SUN_ORANGE, late(hit, 0.5) * 0.6, { add: 0.5 });
    kit.glow(at, reach * (2 + hit * 2.4), SUN_ORANGE, decay(hit), 0.4);
    kit.glow(at, reach * 1.4, SUN_STEEL, decay(Math.min(1, hit * 2)));
    kit.star(at, reach * (2 + hit * 3), hit, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(hit, 1.6, wave * 0.25);

      kit.ring(at, reach * (1 + held * 3.4), 0.1, wave === 1 ? SUN_STEEL : SUN_GOLD, decay(held));
    }
    sparks(kit, at, reach * (2.6 + hit * 2.4), 16, seed, hit, SUN_GOLD, decay(hit));
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.6,
      many(16, weight),
      seed,
      hit,
      SUN_ORANGE,
      late(hit, 0.4),
    );
  },

  // A crescent moon over a dark violet void, and a spiralling maelstrom of moonlight driven down on it
  Moonraze(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const open = Math.min(1, share / 0.3, done / MOONRAZE_OPEN + 0.2);
    const kept = late(done, 0.8);
    const near = toward(stage.source, at, 0.3);
    const sky: Spot = [near[0], Math.max(stage.source[1], at[1]) + reach * 5.5, near[2]];

    kit.glow(sky, reach * 4 * open, MOON_VIOLET, kept * 0.4, 0.2);
    kit.puff(sky, reach * 2.6 * open, VOID, kept * 0.95);
    for (let star = 0; star < 8; star += 1) {
      kit.star(
        aside(
          kit,
          sky,
          spread(seed, star) * reach * 1.8 * open,
          spread(seed, star + 9) * reach * 1.8 * open,
        ),
        reach * 0.25 * swell((share * 2 + noise(seed, star)) % 1),
        0,
        MOONLIGHT,
        kept,
      );
    }
    sickle(
      kit,
      sky,
      reach * 2.4 * open,
      Math.PI * 0.35,
      -Math.PI * 0.95,
      reach * 1.1,
      MOONLIGHT,
      kept,
    );
    kit.ring(sky, reach * 2.9 * open, 0.06, MOON_VIOLET, kept);
    if (done < MOONRAZE_OPEN * 0.8) {
      return;
    }
    const drawn = Math.min(1, (done - MOONRAZE_OPEN * 0.8) / (MOONRAZE_HITS - MOONRAZE_OPEN * 0.8));
    const thick = late(done, 0.7);
    const path = [sky, toward(sky, at, drawn * 0.5), toward(sky, at, drawn)];

    maelstrom(
      kit,
      sky,
      at,
      drawn,
      4,
      reach * 1.6 * thick,
      share * 20,
      MOON_VIOLET,
      thick,
      reach * 0.14,
    );
    kit.ribbon(path, reach * 1.4 * thick, MOON_VIOLET, thick * 0.5, share * 8);
    kit.ribbon(path, reach * 0.5 * thick, MOONLIGHT, thick, share * 12);
    if (done < MOONRAZE_HITS) {
      return;
    }
    const hit = (done - MOONRAZE_HITS) / (1 - MOONRAZE_HITS);

    kit.pool(floorOf(at), reach * (2 + hit * 2), MOON_VIOLET, late(hit, 0.5) * 0.6);
    kit.puff(at, reach * (1.6 + hit * 1.6), VOID, late(hit, 0.5) * 0.7);
    spiral(kit, at, reach * (2.4 + hit), 3, share * 4, MOONLIGHT, decay(hit), reach * 0.1);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(hit, 1.6, wave * 0.25);

      kit.ring(
        at,
        reach * (0.8 + held * 3),
        0.1,
        wave % 2 === 0 ? MOON_VIOLET : MOONLIGHT,
        decay(held),
      );
    }
    kit.star(at, reach * (1.6 + hit * 2), share, '#ffffff', decay(Math.min(1, hit * 2)));
  },

  // A ring of jagged spires bursting up round it and shattering, and a wave scouring the floor clean
  Stormshards(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const rock = mix(paint.color, '#5e4c3c', 0.35);
    const face = lighten(paint.color, 0.4);
    const crack = Math.min(1, share / 0.3, done / STORM_RISES + 0.3);
    const spires = many(9, weight);

    kit.ripple(floor, reach * (1 + crack * 1.6), 0.1, rock, late(done, 0.5) * 0.8, { add: 0 });
    cracks(kit, floor, reach * 2.6 * crack, 7, seed, rock, late(done, 0.5));
    if (done < STORM_BREAKS) {
      const grow = Math.max(0, (done - STORM_RISES) / (STORM_BREAKS - STORM_RISES));

      for (let spire = 0; spire < spires; spire += 1) {
        const angle = (spire / spires) * TAU + noise(seed, spire) * 0.4;
        const base = aside(
          kit,
          floor,
          Math.cos(angle) * reach * 2.2,
          0,
          Math.sin(angle) * reach * 2.2,
        );
        const tall =
          reach *
          (2.6 + noise(seed, spire + 10) * 2) *
          Math.min(1, grow * 2.5 - (spire / spires) * 0.6);

        if (tall <= 0) {
          continue;
        }
        const top = aside(
          kit,
          base,
          -Math.cos(angle) * reach * 0.8,
          tall,
          -Math.sin(angle) * reach * 0.8,
        );
        const turn = kit.angleOn(base, top);

        kit.streak(toward(base, top, 0.5), tall * 0.55, reach * 0.9, turn, rock, 1, { add: 0 });
        kit.streak(toward(base, top, 0.4), tall * 0.4, reach * 0.3, turn, face, 0.9, { add: 0.2 });
      }
      return;
    }
    const broken = (done - STORM_BREAKS) / (1 - STORM_BREAKS);

    debris(
      kit,
      aside(kit, floor, 0, reach * 1.6),
      reach * 2,
      many(18, weight),
      seed,
      broken,
      rock,
      late(broken, 0.5),
    );
    debris(kit, at, reach * 1.3, many(10, weight), seed + 3, broken, face, decay(broken));
    kit.glow(at, reach * (1.2 + broken * 1.6), face, decay(Math.min(1, broken * 1.6)), 0.5);
    kit.star(at, reach * (1.4 + broken * 2), 0.4, '#ffffff', decay(Math.min(1, broken * 2.5)));
    sparks(kit, at, reach * (2 + broken * 2), 14, seed, broken, face, decay(broken));
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(broken, 1.4, wave * 0.3);

      kit.pool(floor, reach * (1 + held * 7), SCOURED, swell(held) * 0.5, { add: 0.3 });
      kit.ripple(floor, reach * (1 + held * 7), 0.06, SCOURED, decay(held));
    }
  },

  // A dance of clanging golden scales, then a blast of scale energy bursting over it in rings of every colour
  Soulblaze(kit, stage, share, { paint, seed, weight }) {
    zPower(kit, stage, share, paint.color, seed);

    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const done = unleashed(share);
    const light = lighten(SCALE_GOLD, 0.5);

    if (done < SOULBLAZE_FIRES + 0.1) {
      const kept = done < SOULBLAZE_FIRES ? 1 : decay((done - SOULBLAZE_FIRES) / 0.1);
      const shown = Math.min(1, share / 0.3) * kept;

      for (let scale = 0; scale < 8; scale += 1) {
        const angle = (scale / 8) * TAU + share * 8;
        const spot = aside(
          kit,
          stage.source,
          Math.cos(angle) * reach * 1.8,
          reach * 0.4,
          Math.sin(angle) * reach * 1.8,
        );

        kit.shard(spot, reach * 0.4, angle, SCALE_GOLD, shown, { add: 0.5 });
        kit.star(spot, reach * 0.35 * swell((share * 4 + scale / 8) % 1), 0, '#ffffff', shown);
      }
      for (let clang = 0; clang < 4; clang += 1) {
        const held = (share * 3 + clang / 4) % 1;

        kit.ring(
          stage.source,
          reach * (1 + held * 3),
          0.08,
          clang % 2 === 0 ? SCALE_GOLD : PRISM[clang],
          decay(held) * shown,
        );
      }
    }
    if (done < SOULBLAZE_FIRES) {
      return;
    }
    if (done < SOULBLAZE_HITS) {
      const flight = (done - SOULBLAZE_FIRES) / (SOULBLAZE_HITS - SOULBLAZE_FIRES);
      const head = toward(stage.source, at, flight);

      for (let scale = 0; scale < many(7, weight); scale += 1) {
        const back = toward(
          stage.source,
          at,
          Math.max(0, flight - 0.25 - noise(seed, scale) * 0.2),
        );
        const off = spread(seed, scale + 5) * reach * 0.8;

        kit.trail(
          aside(kit, back, 0, off),
          aside(kit, head, 0, off * 0.3),
          reach * 0.4,
          SCALE_GOLD,
          0.8,
        );
      }
      kit.glow(head, reach * 1.4, light, 1, 0.7);
      return;
    }
    const hit = (done - SOULBLAZE_HITS) / (1 - SOULBLAZE_HITS);

    kit.pool(floorOf(at), reach * (2 + hit * 2.4), SCALE_GOLD, late(hit, 0.5) * 0.5);
    kit.glow(
      at,
      reach * (1.6 + swell(Math.min(1, hit * 2)) * 1.6),
      SCALE_GOLD,
      decay(Math.min(1, hit * 1.3)),
      0.5,
    );
    kit.star(at, reach * (2 + hit * 3), hit, '#ffffff', decay(Math.min(1, hit * 2)));
    for (const [tone, colour] of PRISM.entries()) {
      const held = staged(hit, 1.8, tone * 0.12);

      kit.ring(at, reach * (0.8 + held * 4), 0.06, colour, decay(held));
    }
    for (let resonance = 0; resonance < 3; resonance += 1) {
      const held = (hit * 2.5 + resonance / 3) % 1;

      kit.ring(at, reach * (1 + held * 2), 0.08, SCALE_GOLD, decay(held) * late(hit, 0.5));
    }
    debris(kit, at, reach * 1.7, many(14, weight), seed, hit, SCALE_GOLD, decay(hit));
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default zLegends;
