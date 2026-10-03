import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, mix, noise, spread, swell } from '../__paint';
import {
  ANCHOR_LANDS,
  AURORA_TONES,
  DARK_FLAME,
  DETONATE_BLOWS,
  DETONATE_LANDS,
  EMBER,
  ENFORCER_BURST,
  ENFORCER_GREEN,
  FIREWORK_TONES,
  HEAD_SEED,
  HOT,
  IRON,
  LARIAT_HITS,
  MADNESS_CRUSH,
  MADNESS_TONES,
  MOONGEIST_FIRE,
  MOON_DARK,
  MOON_VIOLET,
  PHOTON_BURST,
  PHOTON_GOLD,
  POLLEN,
  POLLEN_BURSTS,
  PRISM_FIRE,
  PRISM_TONES,
  SHACKLE_PINS,
  SHADOW,
  SPECTRAL,
  SPOT_LIGHT,
  STEEL_WHITE,
  SUNSTEEL_LANDS,
  SUN_FIRE,
  SUN_GOLD,
} from '../effect/alola';
import { type EffectShape, many } from '../effect/shapes';
import { settle, showing } from '../effect/stats';
import { TAU, arcing, debris, gathering, jet, sickle, smoke, sparks } from './pieces';
import {
  type LitShapePainter,
  aside,
  floorOf,
  landed,
  late,
  reachOf,
  staged,
  thrown,
  toward,
} from './shapes';

/** A spot turned about another on the picture, up positive */
function turned(kit: EffectBatch, at: Spot, x: number, y: number, turn: number): Spot {
  return aside(
    kit,
    at,
    x * Math.cos(turn) - y * Math.sin(turn),
    x * Math.sin(turn) + y * Math.cos(turn),
  );
}

/** One link of a chain, turned along the chain; every other one is seen edge-on */
function link(
  kit: EffectBatch,
  at: Spot,
  size: number,
  turn: number,
  edgeOn: boolean,
  colour: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  kit.oval(at, size, size * (edgeOn ? 0.16 : 0.5), turn, 0.3, colour, alpha);
}

/** A ring of links lying round a spot, `round` of the way closed */
function looped(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  size: number,
  turn: number,
  round: number,
  colour: string,
  alpha: number,
): void {
  const count = 14;

  for (let one = 0; one < count && one / count < round; one += 1) {
    const angle = (one / count) * TAU + turn;
    const spot = aside(kit, at, Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    const next = aside(kit, at, Math.cos(angle + 0.1) * radius, 0, Math.sin(angle + 0.1) * radius);

    link(kit, spot, size, kit.angleOn(spot, next), one % 2 === 1, colour, alpha);
  }
}

/** An anchor with its crown at the bottom when `turn` is 0 */
function anchor(
  kit: EffectBatch,
  at: Spot,
  size: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  const width = size * 0.18;
  const arms: Spot[] = [];

  kit.ribbon(
    [turned(kit, at, 0, size, turn), turned(kit, at, 0, -size * 0.7, turn)],
    width,
    colour,
    alpha,
    0,
    {
      add: 0,
    },
  );
  kit.ribbon(
    [
      turned(kit, at, -size * 0.45, size * 0.65, turn),
      turned(kit, at, size * 0.45, size * 0.65, turn),
    ],
    width,
    colour,
    alpha,
    0,
    { add: 0 },
  );
  for (let step = 0; step <= 8; step += 1) {
    const angle = -Math.PI * (0.15 + (step / 8) * 0.7);

    arms.push(
      turned(
        kit,
        at,
        Math.cos(angle) * size * 0.7,
        -size * 0.1 + Math.sin(angle) * size * 0.6,
        turn,
      ),
    );
  }
  kit.ribbon(arms, width, colour, alpha, 0, { add: 0 });
  kit.ring(turned(kit, at, 0, size * 1.15, turn), size * 0.2, 0.4, lighten(colour, 0.3), alpha);
  for (const tip of [arms[0], arms[arms.length - 1]]) {
    kit.shard(tip, size * 0.22, turn, colour, alpha);
  }
}

/** A hexagon outline standing on the picture, Zygarde's cell */
function hexagon(
  kit: EffectBatch,
  at: Spot,
  size: number,
  turn: number,
  colour: string,
  alpha: number,
): void {
  if (!(size > 0) || alpha <= 0) {
    return;
  }
  const path: Spot[] = [];

  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = turn + (corner / 6) * TAU;

    path.push(aside(kit, at, Math.cos(angle) * size, Math.sin(angle) * size));
  }
  kit.ribbon(path, size * 0.25, colour, alpha);
}

const alola = {
  // A sun disc flaring round the caster, then the caster coming down on it as a white-hot steel meteor
  Sunsteel(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);

    if (share < SUNSTEEL_LANDS) {
      const charge = Math.min(1, share / 0.15);
      const flight = Math.max(0, (share - 0.12) / (SUNSTEEL_LANDS - 0.12));
      const place = (along: number): Spot => arcing(stage.source, at, along, reach * 3);
      const head = place(flight ** 1.5);

      kit.glow(head, reach * (1 + charge * 0.8), SUN_GOLD, charge * 0.6, 0.4);
      kit.ring(head, reach * (1.2 + charge * 0.4), 0.12, SUN_GOLD, charge * 0.8);
      for (let ray = 0; ray < 12; ray += 1) {
        const angle = (ray / 12) * TAU + share * 3;
        const out = reach * (1.45 + noise(seed, ray) * 0.3 * charge);

        kit.streak(
          aside(kit, head, Math.cos(angle) * out, Math.sin(angle) * out),
          reach * (0.15 + noise(seed, ray) * 0.3 * charge),
          reach * 0.06,
          angle,
          SUN_GOLD,
          charge * 0.7,
        );
      }
      if (flight > 0) {
        const path: Spot[] = [];

        for (let step = 0; step <= 6; step += 1) {
          path.push(place(Math.max(0, flight - 0.3 + (step / 6) * 0.3) ** 1.5));
        }
        kit.ribbon(path, reach * 1.2, SUN_FIRE, 0.7, share * 10);
        kit.ribbon(path, reach * 0.5, STEEL_WHITE, 1, share * 14);
        sparks(kit, path[0], reach * 1.2, 8, seed, flight, SUN_GOLD, 0.8);
        kit.pool(floor, reach * (0.6 + flight * 1.6), SUN_FIRE, flight * 0.5);
      }
      kit.glow(head, reach * 0.7, STEEL_WHITE, 1);
      return;
    }
    const hit = (share - SUNSTEEL_LANDS) / (1 - SUNSTEEL_LANDS);

    kit.pool(floor, reach * (2 + hit * 2.4), SUN_FIRE, decay(hit) * 0.7, { add: 0.4 });
    kit.glow(at, reach * (1.2 + hit * 2), SUN_FIRE, decay(hit) * 0.8, 0.4);
    kit.glow(at, reach * (0.8 + hit * 1.2), STEEL_WHITE, decay(Math.min(1, hit * 1.6)));
    kit.star(at, reach * (1.6 + hit * 2), 0, '#ffffff', decay(Math.min(1, hit * 2.5)));
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(hit, 1.6, wave * 0.25);

      if (held > 0) {
        kit.ring(at, reach * (0.8 + held * 3), 0.1, SUN_GOLD, decay(held));
      }
    }
    kit.ripple(floor, reach * (1 + hit * 3), 0.12, SUN_FIRE, decay(hit) * 0.8);
    sparks(kit, at, reach * (2 + hit * 2), 16, seed, hit, SUN_GOLD, decay(hit));
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.3,
      many(10, weight),
      seed,
      hit,
      mix(paint.color, STEEL_WHITE, 0.4),
      late(hit, 0.5),
    );
  },

  // A crescent moon rising over the caster, a violet beam out of it, and a dark ghostly glow where it lands
  Moongeist(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const moon = aside(kit, stage.source, 0, reach * 2.2);
    const rise = Math.min(1, share / MOONGEIST_FIRE);
    const kept = late(share, 0.6);
    const pale = lighten(MOON_VIOLET, 0.6);

    kit.glow(moon, reach * 1.6 * rise, MOON_VIOLET, kept * 0.4, 0.3);
    sickle(kit, moon, reach * 1.1 * rise, Math.PI * 0.55, Math.PI * 1.45, reach * 0.55, pale, kept);
    if (share < MOONGEIST_FIRE) {
      gathering(kit, moon, reach * 2, 10, seed, share, pale);
      return;
    }
    const fired = (share - MOONGEIST_FIRE) / (1 - MOONGEIST_FIRE);
    const drawn = Math.min(1, fired * 5);
    const thick = Math.min(1, fired * 4) * late(fired, 0.55);
    const path = [moon, toward(moon, at, drawn * 0.5), toward(moon, at, drawn)];

    kit.ribbon(path, reach * 1.6 * thick, MOON_VIOLET, 0.6, share * 8);
    kit.ribbon(path, reach * 0.6 * thick, pale, 1, share * 12);
    if (drawn < 1) {
      return;
    }
    const glow = (fired - 0.2) / 0.8;

    kit.glow(at, reach * (1.4 + glow * 1.2), MOON_DARK, late(glow, 0.4) * 0.7, 0, { add: 0 });
    kit.pool(floorOf(at), reach * (1.6 + glow * 1.4), MOON_VIOLET, late(glow, 0.5) * 0.5);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(glow, 1.5, wave * 0.25);

      if (held > 0) {
        kit.ring(at, reach * (0.6 + held * 2.6), 0.1, MOON_VIOLET, decay(held));
      }
    }
    // Wisps curling up off it
    for (let wisp = 0; wisp < many(8, weight); wisp += 1) {
      const up = (share * 1.6 + noise(seed, wisp)) % 1;

      kit.leaf(
        aside(
          kit,
          at,
          spread(seed, wisp + 10) * reach * 1.6 + Math.sin(up * 6 + wisp) * reach * 0.3,
          -reach * 0.6 + up * reach * 3,
          spread(seed, wisp + 20) * reach,
        ),
        reach * 0.35 * (1 - up * 0.5),
        Math.sin(up * 4 + wisp) * 0.6,
        pale,
        swell(up) * late(glow, 0.5) * 0.8,
      );
    }
    kit.star(at, reach * (1.2 + glow * 1.4), glow, '#ffffff', decay(Math.min(1, glow * 2)));
  },

  // Light drawn in to a point under it, then a pillar of white-gold light bursting up through it
  Photon(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);

    if (share < PHOTON_BURST) {
      const gather = share / PHOTON_BURST;
      const count = many(12, weight);

      kit.pool(floor, reach * 1.4 * gather, PHOTON_GOLD, gather * 0.5);
      kit.ripple(floor, reach * (3 - gather * 2.4), 0.1, PHOTON_GOLD, gather * 0.8);
      for (let mote = 0; mote < count; mote += 1) {
        const angle = (mote / count) * TAU + noise(seed, mote) * 0.4;
        const out = reach * 3.2 * (1 - gather) * (0.6 + noise(seed, mote + 10) * 0.4);
        const from = aside(kit, floor, Math.cos(angle) * out, 0.05, Math.sin(angle) * out);

        kit.trail(from, toward(from, floor, 0.2), reach * 0.08, PHOTON_GOLD, gather);
      }
      kit.glow(floor, reach * (0.3 + gather * 0.8), PHOTON_GOLD, gather, 0.8);
      kit.star(floor, reach * gather * 1.2, share * 4, '#ffffff', gather);
      return;
    }
    const erupt = (share - PHOTON_BURST) / (1 - PHOTON_BURST);
    const kept = late(erupt, 0.5);
    const tall = reach * 9 * Math.min(1, erupt * 4);

    jet(kit, floor, tall, reach * 1.1 * kept, PHOTON_GOLD, '#ffffff', kept, share * 14);
    kit.pool(floor, reach * (2 + erupt * 2), PHOTON_GOLD, kept * 0.7, { add: 0.4 });
    kit.glow(at, reach * (1.2 + swell(erupt) * 1.2), PHOTON_GOLD, kept, 0.8);
    for (let wave = 0; wave < 3; wave += 1) {
      const held = staged(erupt, 1.5, wave * 0.25);

      if (held > 0) {
        kit.ripple(floor, reach * (1 + held * 3.4), 0.1, PHOTON_GOLD, decay(held));
      }
    }
    for (let spark = 0; spark < many(14, weight); spark += 1) {
      const up = (share * 1.8 + noise(seed, spark)) % 1;

      kit.star(
        aside(
          kit,
          floor,
          spread(seed, spark + 20) * reach * 1.3,
          up * tall,
          spread(seed, spark + 30) * reach,
        ),
        reach * 0.3 * swell(up),
        up * 3,
        '#ffffff',
        kept,
      );
    }
    kit.star(at, reach * (2 + erupt * 2), share * 2, '#ffffff', decay(Math.min(1, erupt * 2.5)));
  },

  // A prism of light turning on the caster, then a thick beam edged in every colour, and rainbow rings off the hit
  Prism(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const charge = Math.min(1, share / PRISM_FIRE);

    if (share < PRISM_FIRE + 0.1) {
      const kept = share < PRISM_FIRE ? 1 : decay((share - PRISM_FIRE) / 0.1);
      const outline: Spot[] = [];

      for (let corner = 0; corner <= 3; corner += 1) {
        const angle = -share * 8 + (corner / 3) * TAU + Math.PI / 2;

        outline.push(
          aside(kit, stage.source, Math.cos(angle) * reach * 1.3, Math.sin(angle) * reach * 1.3),
        );
      }
      kit.ribbon(outline, reach * 0.12, '#ffffff', kept * charge);
      for (const [tone, colour] of PRISM_TONES.entries()) {
        kit.ring(
          stage.source,
          reach * (0.5 + tone * 0.14) * (0.4 + charge * 0.6),
          0.08,
          colour,
          kept * charge * 0.7,
        );
      }
      kit.glow(stage.source, reach * (0.4 + charge), '#ffffff', kept * charge);
    }
    if (share < PRISM_FIRE) {
      return;
    }
    const fired = (share - PRISM_FIRE) / (1 - PRISM_FIRE);
    const drawn = Math.min(1, fired * 6);
    const thick = Math.min(1, fired * 4) * late(fired, 0.6);
    const path = [
      stage.source,
      toward(stage.source, at, drawn * 0.5),
      toward(stage.source, at, drawn),
    ];

    // Widest first and mostly paint, so each narrower colour covers the one outside it
    for (const [tone, colour] of PRISM_TONES.entries()) {
      kit.ribbon(path, reach * (2.5 - tone * 0.24) * thick, colour, thick, share * 8, { add: 0.3 });
    }
    kit.ribbon(path, reach * 0.7 * thick, '#ffffff', thick, share * 14);
    if (drawn < 1) {
      return;
    }
    const hit = (fired - 1 / 6) / (5 / 6);

    kit.pool(floorOf(at), reach * (2 + hit * 2), '#ffffff', late(hit, 0.5) * 0.5, { add: 0.4 });
    kit.glow(at, reach * (1.2 + swell(hit) * 1.2), '#ffffff', Math.max(thick, decay(hit)));
    for (const [tone, colour] of PRISM_TONES.entries()) {
      const held = Math.max(0, Math.min(1, hit * 1.4 - tone * 0.06));

      if (held > 0) {
        kit.ring(at, reach * (0.8 + held * 3 + tone * 0.15), 0.06, colour, decay(held));
      }
    }
    sparks(kit, at, reach * (2 + hit * 2), 14, seed, hit, '#ffffff', decay(hit));
  },

  // A green beam reaching over from the caster and tracing a Z across it, then the Z bursting
  Enforcer(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const wide = reach * 1.8;
    const tall = reach * 1.5;
    const corners = [
      aside(kit, at, -wide, tall),
      aside(kit, at, wide, tall),
      aside(kit, at, -wide, -tall),
      aside(kit, at, wide, -tall),
    ];
    const light = lighten(ENFORCER_GREEN, 0.55);
    const traced = Math.max(0, Math.min(1, (share - 0.1) / (ENFORCER_BURST - 0.1)));
    const kept =
      share < ENFORCER_BURST ? 1 : decay(((share - ENFORCER_BURST) / (1 - ENFORCER_BURST)) * 1.6);

    if (share < 0.2) {
      const width = reach * 0.5 * decay(Math.max(0, (share - 0.1) / 0.1));
      const head = toward(stage.source, corners[0], Math.min(1, share / 0.1));

      kit.ribbon(
        [stage.source, toward(stage.source, head, 0.5), head],
        width,
        ENFORCER_GREEN,
        1,
        share * 10,
      );
      kit.glow(head, reach * 0.4, light, 1, 0.6);
    }
    // Three strokes of the Z, each drawn in its turn
    let head = corners[0];

    for (let stroke = 0; stroke < 3; stroke += 1) {
      const along = Math.max(0, Math.min(1, traced * 3 - stroke));

      if (along <= 0) {
        break;
      }
      head = toward(corners[stroke], corners[stroke + 1], along);
      kit.ribbon([corners[stroke], head], reach * 0.7, ENFORCER_GREEN, kept * 0.5, share * 8);
      kit.ribbon([corners[stroke], head], reach * 0.24, light, kept, share * 12);
    }
    if (traced < 1) {
      kit.glow(head, reach * 0.6, light, Math.min(1, share * 8), 0.8);
    }
    if (share < ENFORCER_BURST) {
      return;
    }
    const blast = (share - ENFORCER_BURST) / (1 - ENFORCER_BURST);

    kit.pool(floorOf(at), reach * (1.6 + blast * 2.4), ENFORCER_GREEN, decay(blast) * 0.6);
    kit.glow(at, reach * (1.2 + blast * 2), ENFORCER_GREEN, decay(blast) * 0.8, 0.5);
    for (let cell = 0; cell < many(8, weight); cell += 1) {
      const angle = noise(seed, cell) * TAU;
      const out = reach * (1 + blast * 3 * (0.5 + noise(seed, cell + 10) * 0.5));

      hexagon(
        kit,
        aside(
          kit,
          at,
          Math.cos(angle) * out,
          Math.sin(angle) * out * 0.8,
          spread(seed, cell + 20) * reach,
        ),
        reach * 0.35,
        blast * 2 + cell,
        light,
        decay(blast),
      );
    }
    kit.ring(at, reach * (0.8 + blast * 3), 0.1, ENFORCER_GREEN, decay(blast));
    sparks(kit, at, reach * (2 + blast * 2), 12, seed, blast, light, decay(blast));
  },

  // Rippling curtains of green, teal and violet light hung over it, and glints drifting down out of them
  Aurora(kit, stage, share, { seed }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage);
    const shown = showing(share, 4, 0.7);
    const wide = reach * 2.6;

    for (const [curtain, colour] of AURORA_TONES.entries()) {
      const deep = reach * (1.6 - curtain * 0.2) * Math.min(1, share * 3);
      const top = reach * (2.6 + curtain * 0.5);
      const hem: Spot[] = [];
      const body: Spot[] = [];

      for (let step = 0; step <= 12; step += 1) {
        const across = -wide + (step / 12) * wide * 2;
        const wave = Math.sin(step * 0.9 + share * 7 + curtain * 1.7) * reach * 0.35;
        const away = curtain * reach * 0.4;

        hem.push(aside(kit, at, across, top - wave, away));
        body.push(aside(kit, at, across, top - wave - deep * 0.45, away));
      }
      kit.ribbon(body, deep, colour, shown * 0.35, share * 4, { add: 0.8 });
      kit.ribbon(hem, reach * 0.12, lighten(colour, 0.5), shown * 0.9, share * 6);
    }
    for (let fleck = 0; fleck < 10; fleck += 1) {
      const fall = (share * 1.2 + noise(seed, fleck)) % 1;

      kit.star(
        aside(
          kit,
          at,
          spread(seed, fleck + 20) * wide,
          reach * 2.4 - fall * reach * 3.2,
          spread(seed, fleck + 30) * reach,
        ),
        reach * 0.22 * swell(fall),
        fall * 3,
        '#ffffff',
        shown,
      );
    }
    kit.pool(floor, reach * 2, AURORA_TONES[1], shown * 0.3);
    kit.ripple(floor, reach * (1.4 + swell(share) * 0.6), 0.08, AURORA_TONES[1], shown * 0.6);
  },

  // A ghostly arrow shot into its shadow and pinning it, and a ring of spectral chain round the floor
  Shackle(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const pin = aside(kit, floor, -reach * 0.3, 0, -reach * 0.15);
    const bright = lighten(SPECTRAL, 0.4);

    kit.pool(floor, reach * 1.3, SHADOW, late(share, 0.6) * 0.6, { add: 0 });
    if (share < SHACKLE_PINS) {
      const flight = share / SHACKLE_PINS;
      const tip = toward(stage.source, pin, flight);

      kit.ribbon(
        [toward(stage.source, pin, Math.max(0, flight - 0.25)), tip],
        reach * 0.5,
        SPECTRAL,
        0.35,
        share * 8,
      );
      kit.trail(
        toward(stage.source, pin, Math.max(0, flight - 0.12)),
        tip,
        reach * 0.09,
        bright,
        1,
      );
      kit.glow(tip, reach * 0.22, bright, 1, 0.6);
      return;
    }
    const held = (share - SHACKLE_PINS) / (1 - SHACKLE_PINS);
    const kept = late(held, 0.6);
    const far = Math.hypot(
      pin[0] - stage.source[0],
      pin[1] - stage.source[1],
      pin[2] - stage.source[2],
    );

    // The arrow stays standing in the shadow, its shaft still pointing back the way it came
    kit.trail(
      toward(pin, stage.source, Math.min(1, (reach * 1.4) / (far || 1))),
      pin,
      reach * 0.09,
      bright,
      kept,
    );
    kit.glow(pin, reach * 0.25, bright, kept, 0.6);
    if (held < 0.25) {
      kit.ripple(pin, reach * (0.3 + held * 3), 0.15, SPECTRAL, decay(held / 0.25));
    }
    kit.ripple(floor, reach * 1.9, 0.05, SPECTRAL, kept * 0.4);
    looped(kit, floor, reach * 1.9, reach * 0.26, share * 0.8, held * 3, SPECTRAL, kept);
    for (let wisp = 0; wisp < many(6, weight); wisp += 1) {
      const up = (share * 1.4 + noise(seed, wisp)) % 1;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, wisp + 10) * reach * 1.2,
          up * reach * 2.4,
          spread(seed, wisp + 20) * reach,
        ),
        reach * 0.22,
        SPECTRAL,
        swell(up) * kept * 0.6,
        0.3,
      );
    }
  },

  // An anchor swung on its chain over onto it, a heavy landing, and the chain wound round it
  Anchor(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);

    if (share < ANCHOR_LANDS) {
      const swing = (share / ANCHOR_LANDS) ** 1.5;
      const head = arcing(stage.source, at, swing, reach * 4);
      const behind = arcing(stage.source, at, Math.max(0, swing - 0.05), reach * 4);
      const along = kit.angleOn(stage.source, head);
      const count = 10;

      kit.ribbon([stage.source, head], reach * 0.08, IRON, 0.8, 0, { add: 0 });
      for (let one = 0; one < count; one += 1) {
        link(
          kit,
          toward(stage.source, head, one / count),
          reach * 0.22,
          along,
          one % 2 === 1,
          IRON,
          0.8,
        );
      }
      anchor(kit, head, reach * 1.1, kit.angleOn(behind, head) + Math.PI / 2, IRON, 1);
      return;
    }
    const hit = (share - ANCHOR_LANDS) / (1 - ANCHOR_LANDS);
    const kept = late(hit, 0.6);

    kit.glow(at, reach * (0.8 + hit * 1.4), lighten(paint.color, 0.5), decay(Math.min(1, hit * 2)));
    sparks(kit, at, reach * (1.6 + hit * 1.6), 10, seed, hit, lighten(IRON, 0.5), decay(hit));
    kit.ripple(floor, reach * (1 + hit * 2.4), 0.12, paint.color, decay(hit) * 0.8);
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach,
      many(8, weight),
      seed,
      hit,
      IRON,
      decay(hit),
    );
    // The chain wound round it, pulled tighter as it goes
    for (let loop = 0; loop < 3; loop += 1) {
      const wound = Math.min(1, hit * 2.5 - loop * 0.3);

      if (wound > 0) {
        looped(
          kit,
          aside(kit, at, 0, reach * 0.6 - loop * reach * 0.6),
          reach * (1.6 - wound * 0.5),
          reach * 0.22,
          loop,
          wound,
          IRON,
          kept,
        );
      }
    }
    anchor(kit, aside(kit, floor, reach * 1.4, reach * 0.9), reach * 1.1, -0.3, IRON, kept);
  },

  // The caster spinning in with its arms out in rings of dark flame, and a clothesline across it
  Lariat(kit, stage, share, { paint, seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const dark = mix(paint.color, DARK_FLAME, 0.5);
    const centre = toward(stage.source, at, Math.min(1, share / LARIAT_HITS) ** 1.5);
    const waist = aside(kit, centre, 0, reach * 0.2);
    const kept = late(share, 0.7);
    const spin = share * 22;

    for (let tier = 0; tier < 2; tier += 1) {
      kit.ripple(
        aside(kit, waist, 0, -tier * reach * 0.5),
        reach * (1.7 - tier * 0.3),
        0.08,
        tier === 0 ? dark : EMBER,
        kept * 0.8,
        { add: tier === 0 ? 0 : 1 },
      );
    }
    for (const side of [0, Math.PI]) {
      const turn = spin + side;

      kit.ribbon(
        [waist, aside(kit, waist, Math.cos(turn) * reach * 1.7, 0, Math.sin(turn) * reach * 1.7)],
        reach * 0.3,
        dark,
        kept,
        0,
        { add: 0 },
      );
      // Flames licking off each hand, trailing behind the turn
      for (let lick = 0; lick < 4; lick += 1) {
        const back = turn - lick * 0.35;

        kit.glow(
          aside(
            kit,
            waist,
            Math.cos(back) * reach * 1.7,
            lick * reach * 0.1,
            Math.sin(back) * reach * 1.7,
          ),
          reach * (0.45 - lick * 0.08),
          lick === 0 ? EMBER : dark,
          kept * (1 - lick * 0.2),
          lick === 0 ? 0.5 : 0,
          { add: lick === 0 ? 1 : 0 },
        );
      }
    }
    if (share < LARIAT_HITS) {
      return;
    }
    const hit = (share - LARIAT_HITS) / (1 - LARIAT_HITS);

    // The arm drawn right across it
    kit.ribbon(
      [
        aside(kit, at, -reach * 2.2, reach * 0.3),
        aside(kit, at, 0, reach * 0.5),
        aside(kit, at, reach * 2.2, reach * 0.1),
      ],
      reach * 0.6 * decay(hit),
      EMBER,
      decay(hit),
      share * 10,
    );
    kit.pool(floorOf(at), reach * (1.4 + hit * 1.6), EMBER, decay(hit) * 0.5);
    kit.glow(at, reach * (0.8 + hit * 1.2), EMBER, decay(Math.min(1, hit * 1.6)), 0.6);
    kit.ring(at, reach * (0.6 + hit * 2.6), 0.14, dark, decay(hit), { add: 0 });
    sparks(kit, at, reach * (1.8 + hit * 1.8), 12, seed, hit, EMBER, decay(hit));
    sparks(kit, at, reach * 2.6, many(10, weight), seed + 5, hit, lighten(EMBER, 0.4), decay(hit));
  },

  // Pastel light and leaves swirling in on it from every side, then pressing in on it all at once
  Madness(kit, stage, share, { seed }) {
    const at = landed(stage);
    const reach = reachOf(stage) * 1.2;

    if (share < MADNESS_CRUSH) {
      const inward = share / MADNESS_CRUSH;

      for (let mote = 0; mote < 24; mote += 1) {
        const held = (share * 1.5 + noise(seed, mote)) % 1;
        const angle = noise(seed, mote + 30) * TAU + held * 2.4;
        const round = reach * 4.5 * (1 - held);
        const spot = aside(
          kit,
          at,
          Math.cos(angle) * round,
          Math.sin(angle) * round * 0.7,
          spread(seed, mote + 60) * round * 0.5,
        );
        const colour = MADNESS_TONES[mote % MADNESS_TONES.length];

        if (mote % 2 === 0) {
          kit.leaf(spot, reach * 0.3, angle + held * 4, colour, swell(held));
        } else {
          kit.star(spot, reach * 0.3, held * 3, colour, swell(held));
        }
      }
      for (const [tone, colour] of MADNESS_TONES.entries()) {
        const close = (share * 1.2 + tone / 4) % 1;

        kit.ring(at, reach * (0.6 + (1 - close) * 3.4), 0.08, colour, swell(close) * 0.8);
      }
      kit.pool(floorOf(at), reach * (3 - inward * 1.6), MADNESS_TONES[2], inward * 0.4);
      kit.glow(at, reach * (0.4 + inward * 0.6), MADNESS_TONES[0], inward * 0.6, 0.6);
      return;
    }
    const crush = (share - MADNESS_CRUSH) / (1 - MADNESS_CRUSH);

    for (const [tone, colour] of MADNESS_TONES.entries()) {
      const held = Math.min(1, crush * 3 - tone * 0.15);

      if (held > 0 && held < 1) {
        kit.ring(at, reach * (0.2 + 2.6 * (1 - held)), 0.1 + (1 - held) * 0.2, colour, 1);
      }
    }
    kit.pool(floorOf(at), reach * (1.4 + crush * 2), MADNESS_TONES[0], decay(crush) * 0.5);
    kit.glow(at, reach * (0.3 + 1.4 * swell(Math.min(1, crush * 1.5))), '#ffffff', decay(crush));
    kit.star(at, reach * (1 + crush * 2), crush, '#ffffff', decay(Math.min(1, crush * 2)));
    for (let fleck = 0; fleck < 8; fleck += 1) {
      const angle = (fleck / 8) * TAU + spread(seed, fleck) * 0.3;
      const out = reach * (0.5 + crush * 2.2);

      kit.star(
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out * 0.8),
        reach * 0.26,
        crush * 2,
        MADNESS_TONES[fleck % MADNESS_TONES.length],
        decay(crush),
      );
    }
  },

  // A cone of light coming down on it from above, and a bright circle on the floor round its feet
  Spotlight(kit, stage, share, { seed }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage);
    const shown = showing(share, 5, 0.75);
    const wide = reach * 1.7 * Math.min(1, share * 5);
    const high = reach * 6.9;
    const lamp = aside(kit, floor, 0, high);

    kit.panel(
      [
        aside(kit, floor, -reach * 0.25, high),
        aside(kit, floor, reach * 0.25, high),
        aside(kit, floor, wide),
        aside(kit, floor, -wide),
      ],
      SPOT_LIGHT,
      shown * 0.45,
    );
    kit.pool(floor, wide, SPOT_LIGHT, shown * 0.7);
    kit.ripple(floor, wide, 0.08, '#ffffff', shown * 0.8);
    kit.glow(lamp, reach * 0.6, SPOT_LIGHT, shown, 0.8);
    // Dust caught in the light
    for (let mote = 0; mote < 10; mote += 1) {
      const fall = (share * 0.8 + noise(seed, mote)) % 1;
      const half = reach * 0.25 + (wide - reach * 0.25) * fall;

      kit.glow(
        aside(
          kit,
          floor,
          spread(seed, mote + 10) * half * 0.8,
          high * (1 - fall),
          spread(seed, mote + 20) * half * 0.4,
        ),
        reach * 0.1,
        '#ffffff',
        shown * swell(fall) * 0.8,
        0.8,
      );
    }
  },

  // A big ball of pollen lobbed over onto it, bursting into a yellow cloud that drifts down
  Pollen(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const pale = lighten(POLLEN, 0.5);

    if (share < POLLEN_BURSTS) {
      const flight = share / POLLEN_BURSTS;
      const ball = arcing(stage.source, at, flight, reach * 4);

      for (let trail = 5; trail > 0; trail -= 1) {
        kit.glow(
          arcing(stage.source, at, Math.max(0, flight - trail * 0.05), reach * 4),
          reach * 0.3 * (1 - trail / 6),
          POLLEN,
          0.6 * (1 - trail / 6),
          0.3,
        );
      }
      kit.puff(ball, reach * 1.1, POLLEN, 1, { add: 0.3 });
      for (let fuzz = 0; fuzz < 10; fuzz += 1) {
        const angle = (fuzz / 10) * TAU + share * 6;

        kit.puff(
          aside(kit, ball, Math.cos(angle) * reach * 0.9, Math.sin(angle) * reach * 0.9),
          reach * 0.22,
          pale,
          1,
          { add: 0.3 },
        );
      }
      return;
    }
    const burst = (share - POLLEN_BURSTS) / (1 - POLLEN_BURSTS);
    const base = aside(kit, at, 0, reach * 0.3);

    kit.glow(at, reach * (1 + burst * 1.6), POLLEN, decay(Math.min(1, burst * 1.5)) * 0.8, 0.4);
    kit.ring(at, reach * (0.8 + burst * 2.4), 0.12, POLLEN, decay(burst));
    kit.pool(floorOf(at), reach * (1.2 + burst * 2), POLLEN, late(burst, 0.4) * 0.4);
    for (let grain = 0; grain < many(24, weight); grain += 1) {
      kit.glow(
        thrown(base, seed, grain, burst, reach * 2.6, reach * 1.2),
        reach * 0.16,
        grain % 3 === 0 ? pale : POLLEN,
        late(burst, 0.4),
        0.4,
      );
    }
    smoke(kit, at, reach * 2, 6, seed, burst, pale, decay(burst) * 0.5);
  },

  // The caster's head going off like a firework, and a fireball out of it bursting on the target
  Detonate(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const floor = floorOf(at);
    const reach = reachOf(stage, weight);
    const head = aside(kit, stage.source, 0, reach * 0.9);

    if (share < DETONATE_BLOWS) {
      const build = share / DETONATE_BLOWS;

      kit.glow(head, reach * (0.4 + build * 0.8), HOT, build);
      kit.star(head, reach * build, share * 6, '#ffffff', build);
    } else {
      const blown = Math.min(1, (share - DETONATE_BLOWS) / 0.45);
      const count = many(16, weight);
      const droop = blown * blown * reach * 1.2;

      kit.glow(head, reach * (1 + blown * 1.4), EMBER, decay(blown) * 0.8, 0.5);
      kit.ring(head, reach * (0.8 + blown * 2.4), 0.1, HOT, decay(blown));
      for (let spark = 0; spark < count; spark += 1) {
        const angle = (spark / count) * TAU + noise(HEAD_SEED, spark) * 0.3;
        const far = 3.2 * (0.6 + noise(HEAD_SEED, spark + 10) * 0.4);
        const out = reach * (0.6 + settle(blown) * far);
        const back = reach * (0.6 + settle(Math.max(0, blown - 0.12)) * far);
        const tip = aside(kit, head, Math.cos(angle) * out, Math.sin(angle) * out - droop);
        const colour = FIREWORK_TONES[spark % FIREWORK_TONES.length];

        kit.trail(
          aside(kit, head, Math.cos(angle) * back, Math.sin(angle) * back - droop * 0.6),
          tip,
          reach * 0.12,
          colour,
          decay(blown),
        );
        kit.star(tip, reach * 0.25, blown * 4, lighten(colour, 0.5), decay(blown));
      }
    }
    if (share > 0.15 && share < DETONATE_LANDS) {
      const ball = arcing(head, at, (share - 0.15) / (DETONATE_LANDS - 0.15), reach * 3);

      kit.glow(ball, reach * 0.8, EMBER, 1, 0.4);
      kit.glow(ball, reach * 0.4, HOT, 1);
    }
    if (share < DETONATE_LANDS) {
      return;
    }
    const hit = (share - DETONATE_LANDS) / (1 - DETONATE_LANDS);

    kit.pool(floor, reach * (2 + hit * 2.4), EMBER, decay(hit) * 0.7, { add: 0.4 });
    kit.glow(at, reach * (1.2 + hit * 2), EMBER, decay(hit) * 0.9, 0.4);
    kit.glow(at, reach * (0.8 + hit), HOT, decay(Math.min(1, hit * 1.5)));
    for (let wave = 0; wave < 2; wave += 1) {
      const held = staged(hit, 1.5, wave * 0.3);

      if (held > 0) {
        kit.ring(at, reach * (0.8 + held * 3), 0.1, HOT, decay(held));
      }
    }
    kit.ripple(floor, reach * (1 + hit * 3), 0.12, EMBER, decay(hit) * 0.8);
    sparks(kit, at, reach * (2.2 + hit * 2), 16, seed, hit, HOT, decay(hit));
    debris(
      kit,
      aside(kit, floor, 0, reach * 0.3),
      reach * 1.2,
      many(8, weight),
      seed,
      hit,
      EMBER,
      decay(hit),
    );
    smoke(kit, at, reach * 1.5, 5, seed, hit, '#4a3a3a', swell(hit) * 0.5);
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default alola;
