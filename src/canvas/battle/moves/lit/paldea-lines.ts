import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  AQUA_BLUE,
  AQUA_DANCED,
  AQUA_FOAM,
  AQUA_STEPS,
  ARMOR_APART,
  ARMOR_FIRE,
  ARMOR_FIRES,
  ARMOR_FLIGHT,
  ARMOR_GOLD,
  ARMOR_RED,
  ARMOR_SHELLS,
  BITTER_BLUE,
  BITTER_CROSSED,
  BITTER_DARK,
  BITTER_VIOLET,
  BOUQUET_LANDS,
  BULL_GLASS,
  BULL_HIDE,
  BULL_HORN,
  BULL_LANDS,
  COINS,
  COINS_LANDED,
  COIN_DARK,
  COIN_GLINT,
  COIN_GOLD,
  CONFETTI,
  DRILL_BLUE,
  DRILL_LANDS,
  DRILL_SHIELD,
  DRILL_STEEL,
  DRILL_YELLOW,
  GIGATON_DARK,
  GIGATON_LANDS,
  GIGATON_PINK,
  GIGATON_STEEL,
  MATCHA_FROTH,
  MATCHA_GREEN,
  MATCHA_LANDS,
  MATCHA_STEAM,
  MATCHA_WHISKED,
  MEOWSCARADA_GREEN,
  MEOWSCARADA_PINK,
  MOON_DARK,
  MOON_LIGHT,
  MOON_RED,
  MOON_RISEN,
  RAGE_FIST,
  RAGE_LANDS,
  RAGE_PURPLE,
  RAGE_RED,
  RESPECTS_DARK,
  RESPECTS_GATHER,
  RESPECTS_WISP,
  REVIVAL_GOLD,
  REVIVAL_RISEN,
  REVIVAL_WHITE,
  SHOCK_FIRST,
  SHOCK_ORANGE,
  SHOCK_SECOND,
  SHOCK_SPENT,
  SHOCK_WHITE,
  SHOCK_YELLOW,
  SKELEDIRGE_GOLD,
  SKELEDIRGE_ORANGE,
  SKELEDIRGE_RED,
  TORCH_REACHES,
  TWIN_CROSS,
  TWIN_FIRST,
  TWIN_GOLD,
  TWIN_PINK,
  TWIN_SECOND,
} from '../effect/paldea-lines';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, arcing, bolt, debris, smoke, sparks, spiral } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  thrown,
  toward,
} from './shapes';

/** A flame standing up off a spot: painted red under a lit tip */
function flame(
  kit: EffectBatch,
  at: Spot,
  height: number,
  lean: number,
  colour: string,
  tip: string,
  alpha: number,
): void {
  if (!(height > 0) || alpha <= 0) {
    return;
  }
  const top = aside(kit, at, lean, height);

  kit.ribbon([at, aside(kit, at, lean * 0.4, height * 0.5), top], height * 0.28, colour, alpha, 0, {
    add: 0,
  });
  kit.trail(at, toward(at, top, 0.7), height * 0.12, tip, alpha);
}

/** A music note: a painted head, stem and flag, with a little light round it */
function note(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  const stem = aside(kit, at, size * 0.42, 0);
  const top = aside(kit, stem, 0, size * 1.5);

  kit.puff(at, size * 0.55, colour, alpha);
  kit.ribbon([stem, top, aside(kit, top, size * 0.5, -size * 0.6)], size * 0.2, colour, alpha, 0, {
    add: 0,
  });
  kit.glow(at, size * 1.2, SKELEDIRGE_ORANGE, alpha * 0.6, 0.4);
}

/** A coin: a gold disc painted with a dark rim and a glint on it */
function coin(kit: EffectBatch, at: Spot, size: number, spin: number, alpha: number): void {
  const wide = Math.max(0.2, Math.abs(Math.cos(spin)));

  kit.ribbon(
    [aside(kit, at, 0, size), aside(kit, at, 0, -size)],
    size * 2 * wide,
    COIN_DARK,
    alpha,
    0,
    {
      add: 0,
    },
  );
  kit.ribbon(
    [aside(kit, at, 0, size * 0.8), aside(kit, at, 0, -size * 0.8)],
    size * 1.6 * wide,
    COIN_GOLD,
    alpha,
    0,
    { add: 0 },
  );
}

/** A hexagon of shield light round a spot */
function hexagon(kit: EffectBatch, at: Spot, radius: number, colour: string, alpha: number): void {
  if (!(radius > 0) || alpha <= 0) {
    return;
  }
  for (let side = 0; side < 6; side += 1) {
    const from = Math.PI / 6 + (side / 6) * TAU;
    const to = Math.PI / 6 + ((side + 1) / 6) * TAU;

    kit.trail(
      aside(kit, at, Math.cos(from) * radius, Math.sin(from) * radius),
      aside(kit, at, Math.cos(to) * radius, Math.sin(to) * radius),
      radius * 0.08,
      colour,
      alpha,
    );
  }
  kit.glow(at, radius, colour, alpha * 0.25, 0.2);
}

/** The vein mark of anger: four short bent strokes round a spot, painted red */
function anger(kit: EffectBatch, at: Spot, size: number, alpha: number): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  for (let corner = 0; corner < 4; corner += 1) {
    const angle = Math.PI / 4 + (corner / 4) * TAU;
    const middle = aside(kit, at, Math.cos(angle) * size * 0.6, Math.sin(angle) * size * 0.6);

    kit.ribbon(
      [
        aside(kit, middle, Math.cos(angle + 1.2) * size * 0.5, Math.sin(angle + 1.2) * size * 0.5),
        aside(kit, middle, Math.cos(angle) * size * 0.25, Math.sin(angle) * size * 0.25),
        aside(kit, middle, Math.cos(angle - 1.2) * size * 0.5, Math.sin(angle - 1.2) * size * 0.5),
      ],
      size * 0.28,
      RAGE_RED,
      alpha,
      0,
      { add: 0 },
    );
  }
}

/** A fist: a pale block with four knuckles along its top, painted */
function fist(kit: EffectBatch, at: Spot, size: number, alpha: number): void {
  kit.ribbon(
    [aside(kit, at, -size * 0.8, size * 0.2), aside(kit, at, size * 0.8, size * 0.2)],
    size * 1.2,
    RAGE_FIST,
    alpha,
    0,
    {
      add: 0,
    },
  );
  for (let knuckle = 0; knuckle < 4; knuckle += 1) {
    kit.puff(
      aside(kit, at, -size * 0.6 + knuckle * size * 0.4, size * 0.75),
      size * 0.3,
      RAGE_FIST,
      alpha,
    );
  }
}

const paldeaLines = {
  Bouquet(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < BOUQUET_LANDS) {
      const run = share / BOUQUET_LANDS;
      const head = arcing(stage.source, at, run, reach * 4);
      const turn = run * 5;

      for (let stem = -1; stem <= 1; stem += 1) {
        const angle = turn + stem * 0.6 + Math.PI / 2;
        const tip = aside(kit, head, Math.cos(angle) * reach * 1.1, Math.sin(angle) * reach * 1.1);

        kit.ribbon([toward(tip, head, 1.6), tip], reach * 0.14, MEOWSCARADA_GREEN, 1, 0, {
          add: 0,
        });
        for (let leaf = 0; leaf < 5; leaf += 1) {
          const out = turn + stem + (leaf / 5) * TAU;

          kit.leaf(
            aside(kit, tip, Math.cos(out) * reach * 0.35, Math.sin(out) * reach * 0.35),
            reach * 0.5,
            out,
            MEOWSCARADA_PINK,
            1,
          );
        }
        kit.puff(tip, reach * 0.2, '#ffd84a', 1);
      }
      sparks(kit, head, reach * 1.4, 6, seed, run, CONFETTI[0], 0.8);
      return;
    }
    const pop = (share - BOUQUET_LANDS) / (1 - BOUQUET_LANDS);

    kit.glow(at, reach * (0.8 + pop * 2), '#fff0f6', decay(pop * 2.5));
    kit.glow(at, reach * (1.2 + pop * 1.6), MEOWSCARADA_PINK, decay(pop) * 0.7);
    kit.ring(at, reach * (1 + pop * 2.6), 0.08, lighten(MEOWSCARADA_PINK, 0.4), decay(pop));
    for (let leaf = 0; leaf < many(14, weight); leaf += 1) {
      kit.leaf(
        thrown(at, seed, leaf, pop, reach * 3, reach * 1.4),
        reach * 0.55,
        noise(seed, leaf) * TAU + pop * 6,
        leaf % 3 === 0 ? MEOWSCARADA_GREEN : MEOWSCARADA_PINK,
        decay(pop),
      );
    }
    for (let bit = 0; bit < many(12, weight); bit += 1) {
      kit.shard(
        thrown(at, seed + 5, bit, pop, reach * 3.4, reach * 2),
        reach * 0.3,
        pop * 8 + bit,
        CONFETTI[bit % CONFETTI.length],
        decay(pop),
      );
    }
    for (let glint = 0; glint < 4; glint += 1) {
      const angle = (glint / 4) * TAU + 0.4;

      kit.star(
        aside(kit, at, Math.cos(angle) * reach * 1.8, Math.sin(angle) * reach * 1.4),
        reach * 0.5 * swell(Math.min(1, pop * 1.5)),
        pop * 3,
        CONFETTI[0],
        decay(pop),
      );
    }
  },

  Torch(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.min(1, share / TORCH_REACHES);
    const fading = late(share, 0.6);
    const along = (t: number, lift = 0): Spot =>
      aside(
        kit,
        toward(stage.source, at, t),
        0,
        Math.sin(t * Math.PI * 3 - share * 10) * reach * 0.6 + lift,
      );
    const path: Spot[] = [];

    for (let step = 0; step <= 12; step += 1) {
      path.push(along(run * (step / 12)));
    }
    kit.ribbon(path, reach * 0.8, SKELEDIRGE_RED, fading * 0.7, share * 4, { add: 0 });
    kit.ribbon(path, reach * 0.4, SKELEDIRGE_ORANGE, fading, share * 4);
    kit.glow(along(run), reach * 1.1, SKELEDIRGE_GOLD, fading);
    for (let one = 0; one < 4; one += 1) {
      const t = run * (0.25 + one * 0.22);
      const lift = (one % 2 === 0 ? 1 : -0.4) * reach * 1.1;

      note(
        kit,
        along(t, lift),
        reach * 0.7,
        one % 2 === 0 ? SKELEDIRGE_GOLD : SKELEDIRGE_ORANGE,
        fading,
      );
    }
    if (share < TORCH_REACHES) {
      return;
    }
    const flare = (share - TORCH_REACHES) / (1 - TORCH_REACHES);
    const floor = floorOf(at);

    kit.glow(at, reach * (1.2 + flare * 1.4), SKELEDIRGE_ORANGE, decay(flare) * 0.8);
    kit.pool(floor, reach * (1.4 + flare), SKELEDIRGE_ORANGE, decay(flare) * 0.6);
    for (let tongue = 0; tongue < many(7, weight); tongue += 1) {
      const high = reach * (1.6 + noise(seed, tongue + 10) * 1.4) * swell(Math.min(1, flare * 1.6));

      flame(
        kit,
        aside(kit, floor, spread(seed, tongue) * reach * 1.8, 0, spread(seed, tongue + 50) * reach),
        high,
        spread(seed, tongue + 30) * reach * 0.4,
        SKELEDIRGE_RED,
        SKELEDIRGE_GOLD,
        decay(flare),
      );
    }
    sparks(kit, at, reach * 2.2, many(10, weight), seed + 1, flare, SKELEDIRGE_GOLD, decay(flare));
  },

  Stepdance(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const shown = Math.min(1, share * 6) * late(share, 0.75);
    const path: Spot[] = [];

    for (let step = 0; step <= 18; step += 1) {
      const t = step / 18;
      const angle = t * Math.PI * 2.4 + share * Math.PI * 4;

      path.push(
        aside(
          kit,
          at,
          Math.cos(angle) * reach * 2,
          reach * (t * 1.8 - 0.8),
          Math.sin(angle) * reach * 2,
        ),
      );
    }
    kit.ribbon(path, reach * 0.3, AQUA_BLUE, shown * 0.8, share * 3, { add: 0.4 });
    for (let one = 0; one < AQUA_STEPS; one += 1) {
      const lands = 0.02 + (one / (AQUA_STEPS - 1)) * (AQUA_DANCED - 0.02);

      if (share < lands) {
        break;
      }
      const after = Math.min(1, (share - lands) / 0.35);
      const side = one % 2 === 0 ? -1 : 1;
      const spot = aside(kit, at, (one / (AQUA_STEPS - 1) - 0.5) * reach * 3, -side * reach * 0.5);

      // The print, painted in water, then the splash it goes up in
      kit.puff(aside(kit, spot, 0, reach * 0.2), reach * 0.4, AQUA_BLUE, decay(after) * 0.9);
      kit.puff(aside(kit, spot, 0, -reach * 0.4), reach * 0.25, AQUA_BLUE, decay(after) * 0.9);
      kit.ring(spot, reach * (0.5 + after * 1.4), 0.1, AQUA_FOAM, decay(after));
      for (let drop = 0; drop < 5; drop += 1) {
        kit.bubble(
          thrown(spot, seed + one, drop, after, reach * 1.2, reach),
          reach * 0.18,
          AQUA_FOAM,
          decay(after),
        );
      }
    }
    if (share > AQUA_DANCED) {
      const end = (share - AQUA_DANCED) / (1 - AQUA_DANCED);

      kit.glow(at, reach * (1 + end * 1.6), AQUA_BLUE, decay(end) * 0.6);
      kit.ripple(floorOf(at), reach * (1.2 + end * 2.4), 0.1, AQUA_FOAM, decay(end));
    }
  },

  Bull(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const glass = late(share, 0.25) * Math.min(1, share * 6);
    const front = toward(at, stage.source, 0.12);

    if (share < BULL_LANDS) {
      const run = (share / BULL_LANDS) ** 1.6;
      const near = toward(at, stage.source, (1 - run) * 0.35);
      const half = reach * 2.2;
      const floor = floorOf(front);

      kit.panel(
        [
          aside(kit, floor, -half, reach * 2.6),
          aside(kit, floor, half, reach * 2.6),
          aside(kit, floor, half, 0),
          aside(kit, floor, -half, 0),
        ],
        BULL_GLASS,
        glass,
      );
      for (const side of [-1, 1]) {
        const base = aside(kit, near, side * reach * 1.8, -reach * 1.2);
        const tip = aside(kit, near, side * reach * 0.4, reach * 0.4);
        const bend = aside(kit, toward(base, tip, 0.5), side * reach * 0.7, -reach * 0.3);

        kit.ribbon([base, bend, tip], reach * 0.6, BULL_HIDE, 0.6, 0, { add: 0 });
        kit.ribbon([base, bend, tip], reach * 0.4, BULL_HORN, 1, 0, { add: 0 });
      }
      return;
    }
    const hit = (share - BULL_LANDS) / (1 - BULL_LANDS);

    kit.glow(at, reach * (1 + hit * 2.2), '#fff4e0', decay(hit * 2.5));
    kit.glow(at, reach * (1.3 + hit * 1.6), '#e86a3a', decay(hit) * 0.6);
    kit.ring(at, reach * (1 + hit * 3), 0.08, BULL_HORN, decay(hit));
    for (let crack = 0; crack < 6; crack += 1) {
      const angle = (crack / 6) * TAU + noise(seed, crack) * 0.6;
      const out = reach * 2.4 * Math.min(1, hit * 4);

      bolt(
        kit,
        front,
        aside(kit, front, Math.cos(angle) * out, Math.sin(angle) * out),
        seed + crack,
        reach,
        reach * 0.08,
        '#ffffff',
        decay(hit * 1.6),
      );
    }
    for (let piece = 0; piece < many(16, weight); piece += 1) {
      kit.shard(
        thrown(front, seed + 1, piece, hit, reach * 4, reach * 2),
        reach * 0.5,
        noise(seed + 1, piece) * TAU + hit * 5,
        BULL_GLASS,
        decay(hit),
      );
    }
    sparks(kit, at, reach * (1.6 + hit * 2), 10, seed + 2, hit, '#ffffff', decay(hit));
  },

  Coins(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const gone = late(share, 0.75);
    const floor = floorOf(at);

    kit.glow(
      aside(kit, at, 0, reach * 3),
      reach * 2.4,
      COIN_GOLD,
      Math.min(1, share * 5) * late(share, 0.5) * 0.4,
    );
    for (let one = 0; one < COINS; one += 1) {
      const leave = (one / COINS) * (COINS_LANDED - 0.25);
      const lands = leave + 0.25;

      if (share < leave) {
        continue;
      }
      const spot = aside(
        kit,
        floor,
        spread(seed, one) * reach * 1.6,
        reach * 0.3,
        spread(seed, one + 60) * reach,
      );
      const spin = share * 14 + one;

      if (share < lands) {
        const fall = ((share - leave) / 0.25) ** 1.5;
        const high = aside(kit, at, spread(seed, one) * reach * 1.6, reach * 4);

        coin(kit, toward(high, toward(spot, at, 0.4), fall), reach * 0.42, spin, 1);
        continue;
      }
      const after = Math.min(1, (share - lands) / 0.3);
      const lying = thrown(toward(spot, at, 0.4), seed + one, 0, after, reach * 1.6, reach * 0.9);

      coin(
        kit,
        [lying[0], Math.max(reach * 0.3, lying[1]), lying[2]],
        reach * 0.42,
        after < 0.7 ? spin : 1.2,
        gone,
      );
      if (after < 0.4) {
        kit.star(
          aside(kit, lying, 0, reach * 0.5),
          reach * 0.6 * swell(after / 0.4),
          after * 4,
          COIN_GLINT,
          gone,
        );
      }
    }
    if (share > 0.3) {
      sparks(kit, at, reach * 2, many(10, weight), seed + 3, (share - 0.3) / 0.7, COIN_GLINT, gone);
    }
  },

  Hyperdrill(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const gap = Math.hypot(at[0] - stage.source[0], at[2] - stage.source[2]) || 1;
    const push =
      share < DRILL_LANDS ? (share / DRILL_LANDS) ** 1.3 : 1 + (share - DRILL_LANDS) * 0.6;
    const tip = toward(at, stage.source, ((1 - push) * reach * 2.4) / gap);
    const base = toward(tip, stage.source, (reach * 3) / gap);
    const shown = late(share, 0.7);
    const bored = Math.max(0, (share - DRILL_LANDS) / (1 - DRILL_LANDS));

    hexagon(
      kit,
      at,
      reach * 1.7,
      DRILL_SHIELD,
      (bored > 0 ? decay(bored * 1.5) : 0.8) * Math.min(1, share * 8),
    );
    if (bored > 0) {
      for (let crack = 0; crack < 5; crack += 1) {
        const angle = (crack / 5) * TAU + noise(seed, crack);
        const out = reach * 1.7 * Math.min(1, bored * 4);

        bolt(
          kit,
          at,
          aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
          seed + crack,
          reach,
          reach * 0.08,
          '#ffffff',
          decay(bored * 1.5),
        );
      }
    }
    // The cone in painted bands that run down it as it turns. Seen end on
    // it shortens, so it is lifted a little to keep its length on the picture
    for (let band = 0; band < 6; band += 1) {
      const from = band / 6;
      const to = (band + 1) / 6;
      const lift = (t: number): Spot => aside(kit, toward(base, tip, t), 0, (1 - t) * reach * 0.6);
      const turn = (band + share * 12) % 2 < 1;

      kit.ribbon(
        [lift(from), lift(to)],
        reach * 2.2 * (1 - (from + to) / 2),
        turn ? DRILL_YELLOW : DRILL_BLUE,
        shown,
        0,
        {
          add: 0,
        },
      );
    }
    kit.trail(aside(kit, base, 0, reach * 0.6), tip, reach * 0.2, DRILL_STEEL, shown * 0.6);
    if (bored > 0) {
      const out = toward(at, stage.source, (-reach * 1.6) / gap);

      kit.glow(at, reach * (1 + bored), DRILL_YELLOW, decay(bored) * 0.6);
      sparks(
        kit,
        out,
        reach * (1.4 + bored * 2),
        12,
        seed + Math.floor(share * 20),
        bored,
        lighten(DRILL_YELLOW, 0.4),
        decay(bored),
      );
      debris(
        kit,
        out,
        reach * 1.5,
        many(12, weight),
        seed + 7,
        bored,
        mix(DRILL_STEEL, '#5a4a3a', 0.4),
        decay(bored),
      );
    }
  },

  Twin(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const ends: [Spot, string, number][] = [
      [aside(kit, stage.source, -reach * 1.6, reach * 0.8), TWIN_PINK, TWIN_FIRST],
      [aside(kit, stage.source, reach * 1.6, -reach * 0.2), TWIN_GOLD, TWIN_SECOND],
    ];

    for (const [index, [from, colour, leaves]] of ends.entries()) {
      const charge = Math.min(1, share / leaves);
      const run = (share - leaves) / TWIN_CROSS;

      if (run < 0) {
        kit.glow(from, reach * (0.4 + charge * 0.7), colour, 0.5 + charge * 0.5);
        sparks(kit, from, reach * 1.4, 6, seed + index, 1 - charge, colour, 0.8);
        continue;
      }
      const hit = Math.min(1, Math.max(0, (run - 1) / 1.6));
      const fading = decay(hit);
      const head = toward(from, at, Math.min(1, run));

      // A painted band under the light, so the beam reads on snow too
      kit.ribbon([from, head], reach * 0.7, mix(colour, '#3a1a3a', 0.4), fading * 0.5, 0, {
        add: 0,
      });
      kit.ribbon([from, head], reach * 0.45, colour, fading, share * 6);
      kit.trail(from, head, reach * 0.12, lighten(colour, 0.8), fading);
      kit.glow(from, reach * 0.8, colour, fading);
      if (run >= 1) {
        kit.glow(at, reach * (1 + hit * 1.8), colour, fading * 0.8);
        kit.ring(at, reach * (0.8 + hit * 2.4), 0.08, lighten(colour, 0.5), fading);
        sparks(
          kit,
          at,
          reach * (1.2 + hit * 1.6),
          8,
          seed + index,
          hit,
          lighten(colour, 0.3),
          fading,
        );
      }
    }
    if (share > 0.7) {
      sparks(
        kit,
        at,
        reach * 2,
        many(8, weight),
        seed + 9,
        (share - 0.7) / 0.3,
        TWIN_PINK,
        late(share, 0.8),
      );
    }
  },

  Ragefist(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    if (share < RAGE_LANDS) {
      const run = (share / RAGE_LANDS) ** 1.4;
      const spot = toward(toward(at, stage.source, 0.4), at, run);
      const big = reach * (0.8 + run * 0.5);

      for (let tongue = 0; tongue < 6; tongue += 1) {
        const across = (tongue / 5 - 0.5) * big * 2;

        flame(
          kit,
          aside(kit, spot, across, -big * 0.6),
          big * (1.4 + noise(seed, tongue) * 0.8),
          across * 0.5,
          tongue % 2 === 0 ? RAGE_PURPLE : RAGE_RED,
          lighten(RAGE_PURPLE, 0.5),
          0.85,
        );
      }
      fist(kit, spot, big, 1);
      anger(kit, aside(kit, spot, big * 1.3, big * 1.2), big * 0.35, run);
      return;
    }
    const hit = (share - RAGE_LANDS) / (1 - RAGE_LANDS);
    const flare = swell(Math.min(1, hit * 1.4));
    const floor = floorOf(at);

    kit.glow(at, reach * (1 + hit * 2), '#fff0f4', decay(hit * 3));
    kit.glow(at, reach * (1.4 + hit * 1.4), RAGE_PURPLE, decay(hit) * 0.7);
    for (let tongue = 0; tongue < many(8, weight); tongue += 1) {
      flame(
        kit,
        aside(kit, floor, spread(seed, tongue) * reach * 2, 0, spread(seed, tongue + 40) * reach),
        reach * (2 + noise(seed, tongue + 9) * 1.6) * flare,
        spread(seed, tongue + 4) * reach * 0.6,
        tongue % 2 === 0 ? RAGE_PURPLE : RAGE_RED,
        lighten(RAGE_PURPLE, 0.5),
        decay(hit) * 0.9,
      );
    }
    kit.ring(at, reach * (1 + hit * 2.6), 0.08, RAGE_RED, decay(hit));
    for (let mark = 0; mark < 3; mark += 1) {
      anger(
        kit,
        aside(kit, at, (mark - 1) * reach * 1.6, reach * (1.4 + hit * 1.2 + (mark % 2) * 0.5)),
        reach * 0.38 * Math.min(1, hit * 4),
        late(hit, 0.6),
      );
    }
    sparks(kit, at, reach * (1.4 + hit * 1.8), 10, seed + 1, hit, RAGE_RED, decay(hit));
  },

  Armor(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);

    for (let shell = 0; shell < ARMOR_SHELLS; shell += 1) {
      const fires = ARMOR_FIRES + shell * ARMOR_APART;
      const lands = fires + ARMOR_FLIGHT;
      const home = aside(kit, stage.source, (shell - 1) * reach * 1.4, reach * 0.6);

      if (share < fires) {
        const lift = share / fires;
        const spot = aside(kit, home, 0, lift * reach * 0.8);

        kit.glow(spot, reach * (0.5 + lift * 0.5), ARMOR_FIRE, 0.4 + lift * 0.5);
        kit.shard(spot, reach * 0.8, lift * 2 + shell, ARMOR_RED, 1);
        continue;
      }
      if (share < lands) {
        const run = ((share - fires) / ARMOR_FLIGHT) ** 1.2;
        const head = arcing(home, at, run, reach * 1.2);
        const tail = arcing(home, at, Math.max(0, run - 0.35), reach * 1.2);

        kit.trail(tail, head, reach * 0.3, ARMOR_FIRE, 0.8);
        kit.glow(head, reach * 0.9, ARMOR_FIRE, 1);
        kit.shard(head, reach * 0.7, run * 8 + shell, ARMOR_RED, 1);
        continue;
      }
      const hit = Math.min(1, (share - lands) / 0.3);
      const spot = aside(kit, at, (shell - 1) * reach * 0.5, spread(seed, shell) * reach * 0.4);

      kit.glow(spot, reach * (0.9 + hit * 1.8), '#fff2c8', decay(hit * 2.5));
      kit.glow(spot, reach * (1.2 + hit * 1.4), ARMOR_FIRE, decay(hit) * 0.8);
      kit.ring(spot, reach * (0.8 + hit * 2.4), 0.08, ARMOR_GOLD, decay(hit));
      debris(kit, spot, reach * 1.2, 6, seed + shell, hit, ARMOR_RED, decay(hit));
    }
    if (share > ARMOR_FIRES + ARMOR_FLIGHT) {
      const after = (share - ARMOR_FIRES - ARMOR_FLIGHT) / (1 - ARMOR_FIRES - ARMOR_FLIGHT);

      smoke(kit, at, reach * 1.6, 5, seed + 5, after, '#5a4a44', decay(after) * 0.35);
      sparks(kit, at, reach * 2.4, many(10, weight), seed + 5, after, ARMOR_GOLD, decay(after));
    }
  },

  Bitter(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const long = reach * 2.4;
    const cuts: [Spot, Spot, number][] = [
      [aside(kit, at, -long, long), aside(kit, at, long, -long), 0],
      [aside(kit, at, long, long), aside(kit, at, -long, -long), 0.14],
    ];

    for (const [index, [from, to, starts]] of cuts.entries()) {
      const run = Math.min(1, Math.max(0, (share - starts) / 0.18));
      const fading = late(share, 0.6);

      if (share < starts) {
        kit.ribbon([from, toward(from, to, 0.25)], reach * 0.3, BITTER_DARK, 0.8, 0, { add: 0 });
        kit.trail(from, toward(from, to, 0.25), reach * 0.08, BITTER_VIOLET, 0.8);
        continue;
      }
      const back = toward(from, to, Math.max(0, run - 0.7));
      const head = toward(from, to, run);

      kit.ribbon([back, head], reach * 0.55, BITTER_VIOLET, fading * 0.7, share * 4);
      kit.ribbon([back, head], reach * 0.3, BITTER_DARK, fading, 0, { add: 0 });
      kit.trail(back, head, reach * 0.08, BITTER_BLUE, fading);
      sparks(kit, head, reach * 1.2, 5, seed + index, run, BITTER_BLUE, fading);
    }
    if (share < BITTER_CROSSED) {
      return;
    }
    const drain = (share - BITTER_CROSSED) / (1 - BITTER_CROSSED);

    kit.glow(at, reach * (1 + drain * 1.2), BITTER_VIOLET, decay(drain) * 0.6);
    for (let mote = 0; mote < many(10, weight); mote += 1) {
      const t = Math.min(1, Math.max(0, drain * 1.4 - noise(seed, mote) * 0.4));

      if (t <= 0 || t >= 1) {
        continue;
      }
      const spot = aside(
        kit,
        arcing(at, stage.source, t, reach),
        spread(seed, mote + 10) * reach * 2 * Math.sin(Math.PI * t),
      );

      kit.glow(spot, reach * 0.45, mote % 2 === 0 ? BITTER_BLUE : BITTER_VIOLET, 1);
    }
    kit.glow(stage.source, reach * swell(drain), BITTER_BLUE, 0.6);
  },

  Doubleshock(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const source = stage.source;
    const charged =
      share < SHOCK_SPENT
        ? Math.min(1, share * 6)
        : decay((share - SHOCK_SPENT) / (1 - SHOCK_SPENT));

    kit.puff(source, reach * 1.2, SHOCK_ORANGE, charged * 0.3);
    kit.glow(source, reach * (1 + charged * 0.6), SHOCK_YELLOW, charged * 0.7);
    for (let spark = 0; spark < 5; spark += 1) {
      const flick = seed + spark + Math.floor(share * 16);
      const angle = noise(flick, spark) * TAU;
      const out = reach * (1 + charged * 0.8);

      bolt(
        kit,
        source,
        aside(kit, source, Math.cos(angle) * out, Math.sin(angle) * out),
        flick,
        reach,
        reach * 0.08 * Math.max(0.4, charged),
        spark % 2 === 0 ? SHOCK_YELLOW : SHOCK_ORANGE,
        charged,
      );
    }
    for (const [index, strikes] of [SHOCK_FIRST, SHOCK_SECOND].entries()) {
      const after = (share - strikes) / 0.22;

      if (after < 0 || after > 1) {
        continue;
      }
      const flick = seed + index * 7 + Math.floor(after * 6);

      bolt(kit, source, at, flick, reach, reach * 0.35, SHOCK_ORANGE, decay(after));
      bolt(kit, source, at, flick, reach, reach * 0.15, SHOCK_WHITE, decay(after));
      bolt(kit, source, at, flick + 3, reach, reach * 0.1, SHOCK_YELLOW, decay(after) * 0.8);
      kit.glow(at, reach * (1.2 + after * 1.6), SHOCK_YELLOW, decay(after));
      sparks(kit, at, reach * (1.4 + after * 1.6), 10, flick, after, SHOCK_WHITE, decay(after));
    }
    if (share > SHOCK_SPENT) {
      const out = (share - SHOCK_SPENT) / (1 - SHOCK_SPENT);

      smoke(kit, source, reach * 1.2, 5, seed + 4, out, '#9a9488', decay(out) * 0.4);
    }
  },

  Gigaton(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const floor = floorOf(at);
    // The head: a pink block between two steel faces, with its handle running up
    const hammer = (head: Spot, alpha: number): void => {
      kit.ribbon(
        [aside(kit, head, 0, reach * 0.8), aside(kit, head, 0, reach * 4.2)],
        reach * 0.5,
        GIGATON_PINK,
        alpha,
        0,
        {
          add: 0,
        },
      );
      kit.ribbon(
        [aside(kit, head, -reach * 2, 0), aside(kit, head, reach * 2, 0)],
        reach * 2.4,
        GIGATON_DARK,
        alpha,
        0,
        {
          add: 0,
        },
      );
      kit.ribbon(
        [aside(kit, head, -reach * 1.5, 0), aside(kit, head, reach * 1.5, 0)],
        reach * 2,
        GIGATON_PINK,
        alpha,
        0,
        {
          add: 0,
        },
      );
      for (const side of [-1, 1]) {
        kit.ribbon(
          [aside(kit, head, side * reach * 1.6, 0), aside(kit, head, side * reach * 2.1, 0)],
          reach * 2.4,
          GIGATON_STEEL,
          alpha,
          0,
          { add: 0 },
        );
      }
    };

    if (share < GIGATON_LANDS) {
      const fall = (share / GIGATON_LANDS) ** 2;

      hammer(aside(kit, at, (1 - fall) * reach * 1.5, reach * 1.2 + (1 - fall) * reach * 6), 1);
      kit.ripple(floor, reach * 2.4, 0.06, GIGATON_DARK, fall * 0.4, { add: 0 });
      return;
    }
    const hit = (share - GIGATON_LANDS) / (1 - GIGATON_LANDS);
    const squash = decay(Math.min(1, hit * 3));

    if (squash > 0) {
      hammer(aside(kit, at, 0, reach * 1.2), squash);
    }
    kit.glow(at, reach * (1.2 + hit * 2.4), '#fff4fa', decay(hit * 2.5));
    kit.pool(floor, reach * (1.6 + hit * 2), GIGATON_PINK, decay(hit) * 0.6);
    kit.pit(floor, reach * 3 * Math.min(1, hit * 3), decay(hit), GIGATON_DARK, decay(hit));
    for (let wave = 0; wave < 2; wave += 1) {
      kit.ripple(
        floor,
        reach * (1.4 + hit * (3.6 - wave * 1.2)),
        0.1,
        wave === 0 ? GIGATON_STEEL : GIGATON_PINK,
        decay(hit),
      );
    }
    debris(
      kit,
      at,
      reach * 1.8,
      many(14, weight),
      seed + 1,
      hit,
      mix(GIGATON_STEEL, '#6a5a4a', 0.5),
      decay(hit),
    );
  },

  Bloodmoon(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const rise = Math.min(1, share / MOON_RISEN);
    const shown = Math.min(1, share * 6) * late(share, 0.75);
    // Low behind the target, so it stays in the picture over a far pokemon
    const moon = aside(kit, at, 0, reach * (1.2 + swell(rise / 2) * 1.4), reach * 0.5);
    const radius = reach * 1.8;

    kit.puff(moon, radius * 2, MOON_DARK, shown * 0.3);
    kit.glow(moon, radius * 1.5, MOON_LIGHT, shown * 0.5, 0.3);
    kit.puff(moon, radius, MOON_RED, shown);
    for (let sea = 0; sea < 4; sea += 1) {
      const angle = noise(seed, sea) * TAU;
      const out = radius * 0.5 * noise(seed, sea + 9);

      kit.puff(
        aside(kit, moon, Math.cos(angle) * out, Math.sin(angle) * out),
        radius * 0.25,
        MOON_DARK,
        shown * 0.5,
      );
    }
    if (share < MOON_RISEN) {
      return;
    }
    const shine = (share - MOON_RISEN) / (1 - MOON_RISEN);
    const fading = late(shine, 0.5);
    const head = toward(moon, at, Math.min(1, shine * 4));

    kit.ribbon([moon, head], reach * 1.4, MOON_DARK, fading * 0.4, 0, { add: 0 });
    kit.ribbon([moon, head], reach * 1.1, MOON_RED, fading, share * 5);
    kit.trail(moon, head, reach * 0.3, lighten(MOON_LIGHT, 0.6), fading);
    if (shine > 0.25) {
      const hit = (shine - 0.25) / 0.75;

      kit.glow(at, reach * (1.2 + hit * 1.6), MOON_LIGHT, decay(hit) * 0.8);
      kit.ring(at, reach * (1 + hit * 2.6), 0.08, lighten(MOON_RED, 0.4), decay(hit));
      kit.ripple(floorOf(at), reach * (1.2 + hit * 2.4), 0.1, MOON_RED, decay(hit));
      sparks(kit, at, reach * (1.4 + hit * 1.6), 10, seed + 1, hit, MOON_LIGHT, decay(hit));
    }
  },

  Matcha(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    // Whisked beside the caster rather than over it, so the caster stays in sight
    const cup = aside(kit, stage.source, reach * 1.6, reach * 0.8);
    const whisk = Math.min(1, share / MATCHA_WHISKED);
    const held = late(share, 0.35);

    kit.puff(cup, reach * (0.5 + whisk * 0.3), MATCHA_GREEN, held * 0.85);
    spiral(kit, cup, reach * 0.8, 3, share * 6, MATCHA_FROTH, held, reach * 0.08);
    for (let froth = 0; froth < 8; froth += 1) {
      const angle = noise(seed, froth) * TAU + share * 8;

      kit.bubble(
        aside(
          kit,
          cup,
          Math.cos(angle) * reach * (0.4 + whisk * 0.8),
          reach * 0.3 + noise(seed, froth + 8) * reach * whisk,
        ),
        reach * 0.2,
        MATCHA_FROTH,
        held,
      );
    }
    if (share < MATCHA_WHISKED) {
      return;
    }
    const spray = Math.min(1, (share - MATCHA_WHISKED) / (MATCHA_LANDS - MATCHA_WHISKED));
    const fading = late(share, 0.6);

    for (let drop = 0; drop < 10; drop += 1) {
      const t = spray - drop * 0.06;

      if (t <= 0 || t >= 1) {
        continue;
      }
      kit.puff(
        arcing(cup, at, t, reach * 3.2),
        reach * (0.7 - drop * 0.04),
        drop % 3 === 0 ? MATCHA_FROTH : MATCHA_GREEN,
        fading,
      );
    }
    if (share < MATCHA_LANDS) {
      return;
    }
    const after = (share - MATCHA_LANDS) / (1 - MATCHA_LANDS);

    kit.glow(at, reach * (1.2 + after * 1.4), MATCHA_GREEN, decay(after) * 0.8);
    kit.ripple(floorOf(at), reach * (1 + after * 2.4), 0.1, MATCHA_GREEN, decay(after), {
      add: 0.3,
    });
    for (let drop = 0; drop < many(10, weight); drop += 1) {
      kit.puff(
        thrown(at, seed + 1, drop, after, reach * 2.4, reach * 1.4),
        reach * 0.22,
        MATCHA_FROTH,
        decay(after),
      );
    }
    smoke(
      kit,
      aside(kit, at, 0, reach * 0.6),
      reach * 1.4,
      4,
      seed + 2,
      after,
      MATCHA_STEAM,
      decay(after) * 0.4,
    );
    for (let mote = 0; mote < 6; mote += 1) {
      const t = Math.min(1, after * 1.3 - noise(seed, mote + 30) * 0.3);

      if (t <= 0 || t >= 1) {
        continue;
      }
      kit.glow(
        aside(
          kit,
          arcing(at, stage.source, t, reach),
          spread(seed, mote) * reach * 1.6 * Math.sin(Math.PI * t),
        ),
        reach * 0.4,
        lighten(MATCHA_GREEN, 0.4),
        1,
      );
    }
  },

  Revival(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const rise = Math.min(1, share / REVIVAL_RISEN);
    const shown = Math.min(1, share * 5) * late(share, 0.7);
    const halo = aside(kit, at, 0, reach * (1.4 + rise * 0.6));

    kit.oval(halo, reach * 1.2, reach * 0.36, 0, 0.3, REVIVAL_GOLD, shown);
    kit.glow(at, reach * (0.8 + rise * 1.2), REVIVAL_WHITE, shown * 0.7);
    for (let ray = 0; ray < 5; ray += 1) {
      const foot = aside(kit, floorOf(at), (ray - 2) * reach * 0.4);

      kit.trail(
        foot,
        aside(kit, foot, 0, reach * (1 + rise * 3)),
        reach * 0.1,
        REVIVAL_GOLD,
        shown * 0.6 * swell((ray + 0.5) / 5),
      );
    }
    sparks(kit, at, reach * 2, many(12, weight), seed, share, REVIVAL_GOLD, shown);
    kit.star(halo, reach * 0.5, share * 4, REVIVAL_WHITE, shown);
  },

  Respects(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const gather = Math.min(1, share / RESPECTS_GATHER);

    if (share < RESPECTS_GATHER) {
      for (let wisp = 0; wisp < 5; wisp += 1) {
        const angle = (wisp / 5) * TAU + gather * 2;
        const out = reach * (3 - gather * 2.4);
        const spot = aside(
          kit,
          at,
          Math.cos(angle) * out,
          reach * 0.6 + Math.sin(angle) * out * 0.5,
        );

        kit.puff(spot, reach * 0.4, RESPECTS_WISP, Math.min(1, share * 6));
        kit.glow(spot, reach * 0.3, '#ffffff', Math.min(1, share * 6));
      }
      kit.puff(at, reach * 1.6, RESPECTS_DARK, gather * 0.35);
      return;
    }
    const hit = (share - RESPECTS_GATHER) / (1 - RESPECTS_GATHER);

    kit.glow(at, reach * (1 + hit * 2), RESPECTS_WISP, decay(hit) * 0.8);
    kit.ring(at, reach * (1 + hit * 3), 0.08, lighten(RESPECTS_WISP, 0.3), decay(hit));
    sparks(kit, at, reach * (1.4 + hit * 2), 10, seed, hit, RESPECTS_WISP, decay(hit));
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default paldeaLines;
