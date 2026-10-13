import type EffectBatch from '../../../three/effect-batch';
import type { Spot } from '../../../three/effect-batch';
import { decay, lighten, noise, spread, swell } from '../__paint';
import {
  BONE_SHADE,
  BONE_WHITE,
  CHATOT_COLOURS,
  CHATOT_INK,
  CHATTER_ARRIVES,
  CHATTER_NOTES,
  CLUB_DUST,
  CLUB_LANDS,
  COMBEE_DARK,
  COMBEE_GOLD,
  COMBEE_WING,
  CONVERSION_COLOURS,
  DROWSY_LILAC,
  DROWSY_SHADE,
  EGG_COUNT,
  EGG_FLIGHT,
  EGG_LANDS,
  EGG_SHADE,
  EGG_SHELL,
  EGG_YOLK,
  FACETS_FLIP,
  FACETS_FLIPPED,
  GEARS,
  GEAR_DARK,
  GEAR_FLIGHT,
  GEAR_GAP,
  GEAR_GRINDS,
  GEAR_SPARK,
  GEAR_STEEL,
  KISS_BLOWN,
  KISS_LANDS,
  KISS_PINK,
  LIPS_DARK,
  LIPS_RED,
  ORDER_ARRIVES,
  ORDER_BEES,
  ORDER_STUNG,
  PORYGON2_BLUE,
  PORYGON2_PINK,
  SKETCH_PAINT,
  SKETCH_RETURNS,
  SKETCH_SHADE,
  SKETCH_TRACED,
  SMEARGLE_TAIL,
  SPOON_BENT,
  SPOON_SHADE,
  SPOON_SILVER,
  VOLT_LANDS,
  VOLT_RECOILS,
  VOLT_WHITE,
  VOLT_YELLOW,
  WASH_COVERS,
  WASH_STARTS,
  WIRE_CYAN,
  WIRE_DARK,
} from '../effect/early-signatures';
import { SIGNATURE_SCALE } from '../effect/galar';
import { type EffectShape, many } from '../effect/shapes';
import { TAU, arcing, bolt, debris, sickle, smoke, sparks, spiral } from './pieces';
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

/** A line painted dark under a brighter one, so it reads on any ground */
function strand(
  kit: EffectBatch,
  path: Spot[],
  width: number,
  colour: string,
  shade: string,
  alpha: number,
): void {
  if (path.length < 2 || alpha <= 0) {
    return;
  }
  kit.ribbon(path, width * 2.2, shade, alpha * 0.85, 0, { add: 0 });
  kit.ribbon(path, width, colour, alpha, 0, { add: 0.3 });
}

/** The corners of a regular polygon round a spot on the picture, turned by `turn` */
function corners(
  kit: EffectBatch,
  at: Spot,
  radius: number,
  sides: number,
  turn: number,
  squash = 1,
): Spot[] {
  const points: Spot[] = [];

  for (let side = 0; side < sides; side += 1) {
    const angle = turn + (side / sides) * TAU;

    points.push(aside(kit, at, Math.cos(angle) * radius, Math.sin(angle) * radius * squash));
  }
  return points;
}

/** A pale egg painted over a darker rim, with a shine */
function egg(kit: EffectBatch, at: Spot, size: number, alpha: number): void {
  kit.puff(at, size * 1.15, EGG_SHADE, alpha * 0.6);
  kit.puff(at, size, EGG_SHELL, alpha);
  kit.glow(aside(kit, at, -size * 0.25, size * 0.3), size * 0.25, '#ffffff', alpha * 0.8, 0.5);
}

/** A Z of three strokes, painted lilac over a dark line */
function zed(kit: EffectBatch, at: Spot, size: number, width: number, alpha: number): void {
  strand(
    kit,
    [
      aside(kit, at, -size, size),
      aside(kit, at, size, size),
      aside(kit, at, -size, -size),
      aside(kit, at, size, -size),
    ],
    width,
    DROWSY_LILAC,
    DROWSY_SHADE,
    alpha,
  );
}

/** A music note: an inked head, a stem and a flag */
function note(kit: EffectBatch, at: Spot, size: number, colour: string, alpha: number): void {
  const foot = aside(kit, at, size * 0.55, 0);
  const top = aside(kit, foot, 0, size * 1.8);

  kit.ribbon([foot, top], size * 0.22, CHATOT_INK, alpha, 0, { add: 0 });
  kit.ribbon(
    [top, aside(kit, top, size * 0.6, -size * 0.5), aside(kit, top, size * 0.5, -size)],
    size * 0.22,
    CHATOT_INK,
    alpha,
    0,
    { add: 0 },
  );
  kit.puff(at, size * 0.75, CHATOT_INK, alpha);
  kit.puff(at, size * 0.6, colour, alpha);
}

/** A Combee: three gold hexagons in a cluster with wings */
function combee(kit: EffectBatch, at: Spot, size: number, flap: number, alpha: number): void {
  const wing = size * (0.5 + Math.abs(Math.sin(flap)) * 0.3);

  for (const side of [-1, 1]) {
    kit.leaf(
      aside(kit, at, side * size * 0.9, size * 0.7),
      wing * 1.6,
      side * (Math.PI / 2 - 0.5),
      COMBEE_WING,
      alpha * 0.85,
    );
  }
  for (const [right, up, scale] of [
    [-0.5, 0.45, 0.55],
    [0.5, 0.45, 0.55],
    [0, -0.25, 0.65],
  ] as const) {
    const hub = aside(kit, at, right * size, up * size);
    const rim = corners(kit, hub, size * scale, 6, Math.PI / 6);

    kit.puff(hub, size * scale * 1.05, COMBEE_GOLD, alpha);
    kit.ribbon([...rim, rim[0]], size * 0.12, COMBEE_DARK, alpha, 0, { add: 0 });
    kit.puff(aside(kit, hub, -size * 0.15 * scale, size * 0.05), size * 0.12, COMBEE_DARK, alpha);
  }
}

/** A gear: a steel wheel with teeth round its rim and a dark hub */
function gear(kit: EffectBatch, at: Spot, radius: number, turn: number, alpha: number): void {
  for (let tooth = 0; tooth < 10; tooth += 1) {
    const angle = turn + ((tooth + 0.2) / 10) * TAU;

    kit.shard(
      aside(kit, at, Math.cos(angle) * radius * 0.88, Math.sin(angle) * radius * 0.88),
      radius * 0.32,
      angle,
      GEAR_DARK,
      alpha,
    );
  }
  kit.puff(at, radius * 0.95, GEAR_DARK, alpha);
  kit.puff(at, radius * 0.82, GEAR_STEEL, alpha);
  kit.puff(at, radius * 0.4, lighten(GEAR_STEEL, 0.4), alpha);
  kit.puff(at, radius * 0.16, GEAR_DARK, alpha);
}

/** The colour a type-changing move turns to, picked by its seed */
function convertedTo(seed: number): string {
  return CONVERSION_COLOURS[Math.floor(noise(seed, 1) * CONVERSION_COLOURS.length)];
}

const earlySignatures = {
  Eggbarrage(kit, stage, share, { seed, weight, hits = EGG_COUNT }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const count = Math.max(2, Math.min(EGG_COUNT, Math.round(hits)));

    for (let one = 0; one < count; one += 1) {
      const leave = (one / count) * (EGG_LANDS - EGG_FLIGHT);
      const flight = (share - leave) / EGG_FLIGHT;

      if (flight < 0) {
        continue;
      }
      const spot = aside(
        kit,
        at,
        spread(seed, one) * reach * 0.8,
        -spread(seed, one + 10) * reach * 0.5,
      );

      if (flight < 1) {
        const from = aside(kit, stage.source, spread(seed, one + 20) * reach, 0);

        egg(kit, arcing(from, spot, flight, reach * 3.5), reach * 0.5, 1);
        continue;
      }
      const pop = Math.min(1, (flight - 1) * 1.2);

      if (pop >= 1) {
        continue;
      }
      // The shell in two halves flying apart, and the yolk splashed between
      kit.puff(spot, reach * (0.4 + pop * 0.5), EGG_YOLK, decay(pop) * 0.9);
      kit.glow(spot, reach * (0.5 + pop * 0.8), EGG_YOLK, decay(pop) * 0.6, 0.4);
      for (const side of [-1, 1]) {
        kit.shard(
          aside(kit, spot, side * pop * reach * 0.9, swell(pop) * reach * 0.5),
          reach * 0.5,
          side * pop * 1.5,
          EGG_SHADE,
          decay(pop),
        );
        kit.shard(
          aside(kit, spot, side * pop * reach * 0.9, swell(pop) * reach * 0.5),
          reach * 0.42,
          side * pop * 1.5,
          EGG_SHELL,
          decay(pop),
        );
      }
      kit.ring(spot, reach * (0.4 + pop * 1.2), 0.1, '#ffffff', decay(pop));
      sparks(kit, spot, reach * (0.7 + pop), 7, seed + one, pop, EGG_YOLK, decay(pop));
    }
  },

  Boneclub(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * 1.2;
    const grip = aside(kit, at, reach * 2.4, -reach * 0.3);
    const length = reach * 2.6;
    const start = Math.PI * 0.35;
    const end = Math.PI;
    const swing = Math.min(1, share / CLUB_LANDS) ** 1.6;
    const angle = start + (end - start) * swing;
    const shown = late(share, 0.6);
    const head = aside(kit, grip, Math.cos(angle) * length, Math.sin(angle) * length);

    // The blur of the swing, painted pale behind the club as it comes down
    sickle(
      kit,
      grip,
      length * 0.9,
      start,
      angle,
      reach * 0.8,
      BONE_WHITE,
      late(share, 0.4) * 0.45,
      0.2,
    );
    strand(kit, [grip, toward(grip, head, 0.5), head], reach * 0.36, BONE_WHITE, BONE_SHADE, shown);
    for (const [knobAt, knob] of [
      [grip, 0.28],
      [head, 0.42],
    ] as const) {
      const across = -Math.sin(angle) * reach * knob * 0.7;
      const up = Math.cos(angle) * reach * knob * 0.7;

      for (const side of [-1, 1]) {
        const spot = aside(kit, knobAt, side * across, side * up);

        kit.puff(spot, reach * knob * 1.2, BONE_SHADE, shown * 0.8);
        kit.puff(spot, reach * knob, BONE_WHITE, shown);
      }
    }
    if (share < CLUB_LANDS) {
      return;
    }
    const hit = (share - CLUB_LANDS) / (1 - CLUB_LANDS);
    const floor = floorOf(at);

    kit.glow(at, reach * (1 + hit * 1.2), '#ffffff', decay(hit * 2.5) * 0.8);
    sparks(kit, head, reach * (1.4 + hit * 1.4), 9, seed, hit, '#ffffff', decay(hit * 1.6));
    kit.ripple(floor, reach * (1 + hit * 2.4), 0.12, CLUB_DUST, decay(hit) * 0.8, { add: 0 });
    smoke(
      kit,
      floor,
      reach * (1.4 + hit * 1.6),
      many(7, weight),
      seed + 30,
      hit,
      CLUB_DUST,
      swell(Math.min(1, hit * 1.3)) * 0.4,
    );
    debris(kit, floor, reach * 1.6, many(8, weight), seed + 1, hit, BONE_SHADE, decay(hit));
  },

  Kiss(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const mouth = aside(kit, toward(stage.source, at, 0.2), 0, reach * 1.2);
    const lips = Math.min(1, share * 10) * late(share, KISS_BLOWN + 0.15);
    const pucker = 1 - swell(Math.min(1, share / KISS_BLOWN)) * 0.35;

    // Two lobes for the upper lip, one wide one for the lower, painted solid
    for (const side of [-1, 1]) {
      const lobe = aside(kit, mouth, side * reach * 0.45 * pucker, reach * 0.2);

      kit.puff(lobe, reach * 0.55 * pucker, LIPS_DARK, lips);
      kit.puff(lobe, reach * 0.45 * pucker, LIPS_RED, lips);
    }
    const lower = aside(kit, mouth, 0, -reach * 0.25);

    kit.ribbon(
      [aside(kit, lower, -reach * 0.6 * pucker, 0), aside(kit, lower, reach * 0.6 * pucker, 0)],
      reach * 0.75,
      LIPS_DARK,
      lips,
      0,
      { add: 0 },
    );
    kit.ribbon(
      [aside(kit, lower, -reach * 0.55 * pucker, 0), aside(kit, lower, reach * 0.55 * pucker, 0)],
      reach * 0.6,
      LIPS_RED,
      lips,
      0,
      { add: 0 },
    );
    kit.glow(
      aside(kit, mouth, -reach * 0.3, reach * 0.3),
      reach * 0.18,
      '#ffffff',
      lips * 0.8,
      0.5,
    );
    if (share >= KISS_BLOWN * 0.5 && share < KISS_LANDS) {
      const flight = (share - KISS_BLOWN * 0.5) / (KISS_LANDS - KISS_BLOWN * 0.5);
      const spot = aside(
        kit,
        toward(mouth, at, flight),
        Math.sin(flight * Math.PI * 3) * reach * 0.4,
        Math.sin(Math.PI * flight) * reach * 1.2,
      );

      kit.heart(spot, reach * (1.9 + flight * 0.6), 0, LIPS_DARK, 0.6);
      kit.heart(spot, reach * (1.6 + flight * 0.6), 0, KISS_PINK, 1);
      sparks(kit, spot, reach * 0.9, 4, seed, (share * 3) % 1, lighten(KISS_PINK, 0.4), 0.8);
    }
    if (share < KISS_LANDS) {
      return;
    }
    const sleep = (share - KISS_LANDS) / (1 - KISS_LANDS);

    kit.glow(at, reach * (1 + sleep), KISS_PINK, decay(sleep * 2) * 0.6, 0.3);
    kit.heart(
      aside(kit, at, 0, sleep * reach),
      reach * (1.8 + sleep * 2),
      0,
      KISS_PINK,
      decay(sleep * 2.5),
    );
    for (let one = 0; one < 3; one += 1) {
      const rise = Math.min(1, Math.max(0, sleep * 1.6 - one * 0.25));

      if (rise <= 0) {
        continue;
      }
      zed(
        kit,
        aside(
          kit,
          at,
          reach * (0.5 + one * 0.4) + Math.sin(rise * 6) * reach * 0.15,
          reach * (0.8 + rise * 1.6),
        ),
        reach * (0.22 + one * 0.08),
        reach * 0.07,
        swell(Math.min(1, rise * 1.2)),
      );
    }
  },

  Conversion(kit, stage, share, { seed, weight, paint }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const centre = aside(kit, at, 0, reach * 0.2);
    const radius = reach * 1.6;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const turn = share * 1.2;
    const squash = 0.75 + Math.cos(share * Math.PI * 2) * 0.15;
    const inner = corners(kit, centre, radius * 0.55, 6, turn, squash);
    const outer = corners(kit, centre, radius, 6, turn + Math.PI / 6, squash);
    const colour = convertedTo(seed);
    const facets: Spot[][] = [];

    for (let side = 0; side < 6; side += 1) {
      const next = (side + 1) % 6;

      facets.push([centre, inner[side], inner[next]]);
      facets.push([inner[side], inner[next], outer[side]]);
      facets.push([inner[next], outer[side], outer[next]]);
    }
    // Each facet a painted chip at its middle, turned edge-on and back as it flips
    for (const [index, facet] of facets.entries()) {
      const flipAt = FACETS_FLIP + noise(seed, index + 5) * (FACETS_FLIPPED - FACETS_FLIP - 0.1);
      const flip = Math.min(1, Math.max(0, (share - flipAt) / 0.1));
      const scale = Math.max(0.1, Math.abs(Math.cos(flip * Math.PI)));
      const mid: Spot = [
        (facet[0][0] + facet[1][0] + facet[2][0]) / 3,
        (facet[0][1] + facet[1][1] + facet[2][1]) / 3,
        (facet[0][2] + facet[1][2] + facet[2][2]) / 3,
      ];

      kit.shard(
        mid,
        radius * (index % 3 === 0 ? 0.24 : 0.3) * scale,
        kit.angleOn(mid, facet[0]),
        flip < 0.5 ? lighten(paint.color, 0.2) : colour,
        shown * 0.85,
      );
    }
    for (let side = 0; side < 6; side += 1) {
      const next = (side + 1) % 6;

      strand(kit, [centre, inner[side]], reach * 0.06, WIRE_CYAN, WIRE_DARK, shown);
      strand(
        kit,
        [inner[side], inner[next], outer[side], outer[next], inner[next]],
        reach * 0.06,
        WIRE_CYAN,
        WIRE_DARK,
        shown,
      );
    }
    const done = Math.max(0, (share - FACETS_FLIPPED) / (1 - FACETS_FLIPPED));

    if (done > 0) {
      kit.ring(centre, radius * (1 + done * 0.8), 0.08, colour, decay(done));
      kit.star(
        aside(kit, centre, radius * 0.5, radius * 0.5),
        reach * 0.8,
        done * 3,
        '#ffffff',
        swell(done),
      );
    }
  },

  Spoon(kit, stage, share, { seed, weight, paint }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const bend = Math.min(1, share / SPOON_BENT) ** 1.3;
    const bob = Math.sin(share * Math.PI * 4) * reach * 0.15;
    const handle = aside(kit, at, 0, reach * 1.2 + bob);
    const neck = aside(kit, handle, 0, reach * 1.1);
    const fold = bend * Math.PI * 0.45;
    const tip = aside(kit, neck, Math.sin(fold) * reach * 1.1, Math.cos(fold) * reach * 1.1);
    const bowl = toward(neck, tip, 0.75);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const out = (share * 2.2 + pulse / 3) % 1;

      kit.ring(neck, reach * (0.4 + out * 2.2), 0.08, paint.color, swell(out) * shown * 0.9);
    }
    kit.glow(neck, reach * 1.4, paint.color, shown * 0.3, 0.2);
    strand(
      kit,
      [handle, neck, toward(neck, tip, 0.4)],
      reach * 0.22,
      SPOON_SILVER,
      SPOON_SHADE,
      shown,
    );
    kit.puff(bowl, reach * 0.55, SPOON_SHADE, shown);
    kit.puff(bowl, reach * 0.45, SPOON_SILVER, shown);
    kit.star(
      aside(kit, bowl, -reach * 0.1, reach * 0.15),
      reach * 0.55,
      share * 4,
      '#ffffff',
      shown * swell((share * 2) % 1),
    );
    // The wobble in its sight: an oval turning about its eyes
    kit.oval(
      at,
      reach * 1.3,
      reach * 1.3 * Math.max(0.08, Math.abs(Math.cos(share * Math.PI * 3))),
      0.2,
      0.08,
      lighten(paint.color, 0.3),
      Math.min(1, share * 3) * shown * 0.8,
    );
    sparks(
      kit,
      neck,
      reach * 1.6,
      many(6, weight),
      seed,
      (share * 1.5) % 1,
      lighten(paint.color, 0.4),
      shown * 0.8,
    );
  },

  Sketch(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const traced = Math.min(1, share / SKETCH_TRACED);
    const outline = (centre: Spot, scale: number, upTo: number): Spot[] => {
      const path: Spot[] = [];

      for (let step = 0; step <= Math.ceil(upTo * 32); step += 1) {
        const angle = Math.PI / 2 - (step / 32) * TAU;
        const wobble = 1 + Math.sin(angle * 3) * 0.08;

        path.push(
          aside(
            kit,
            centre,
            Math.cos(angle) * reach * 1.3 * scale * wobble,
            Math.sin(angle) * reach * 1.6 * scale * wobble,
          ),
        );
      }
      return path;
    };
    const stroke = outline(at, 1, traced);

    strand(kit, stroke, reach * 0.12, SKETCH_PAINT, SKETCH_SHADE, late(share, 0.6));
    if (share < SKETCH_TRACED) {
      const tip = stroke[stroke.length - 1];
      const back = aside(kit, tip, reach * 0.7, -reach * 0.9);

      // The tail end, a tuft of brush loaded with paint
      kit.ribbon([back, tip], reach * 0.2, SMEARGLE_TAIL, 1, 0, { add: 0 });
      kit.leaf(toward(back, tip, 0.85), reach * 1, 0.65, SKETCH_SHADE, 1);
      kit.leaf(toward(back, tip, 0.85), reach * 0.8, 0.65, SKETCH_PAINT, 1);
      return;
    }
    const fly = Math.min(1, (share - SKETCH_TRACED) / (SKETCH_RETURNS - SKETCH_TRACED));

    if (fly < 1) {
      const spot = arcing(at, stage.source, fly, reach * 1.6);

      strand(kit, outline(spot, 0.6, 1), reach * 0.1, SKETCH_PAINT, SKETCH_SHADE, 1);
      sparks(kit, spot, reach, 5, seed, fly, lighten(SKETCH_PAINT, 0.4), 0.8);
      return;
    }
    const kept = (share - SKETCH_RETURNS) / (1 - SKETCH_RETURNS);

    kit.ring(stage.source, reach * (0.8 + kept * 1.6), 0.1, SKETCH_PAINT, decay(kept), {
      add: 0.3,
    });
    kit.star(aside(kit, stage.source, 0, reach), reach * 0.8, kept * 3, '#ffffff', swell(kept));
  },

  Reconvert(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const centre = aside(kit, at, 0, reach * 0.2);
    const across = reach * 1.5;
    const up = reach * 1.25;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const colour = convertedTo(seed + 3);
    const wash = Math.min(1, Math.max(0, (share - WASH_STARTS) / (WASH_COVERS - WASH_STARTS)));
    const rows = 9;

    // The shell painted in rows, each pink until the wash has passed it
    for (let row = 0; row < rows; row += 1) {
      const height = 1 - ((row + 0.5) / rows) * 2;
      const half = across * Math.sqrt(Math.max(0, 1 - height * height));
      const washed = (row + 0.5) / rows < wash;
      const level = aside(kit, centre, 0, height * up);

      kit.ribbon(
        [aside(kit, level, -half, 0), aside(kit, level, half, 0)],
        ((up * 2) / rows) * 1.15,
        washed ? colour : PORYGON2_PINK,
        shown * 0.9,
        0,
        { add: 0 },
      );
    }
    for (let band = 0; band < 2; band += 1) {
      kit.oval(
        centre,
        across *
          (0.95 - band * 0.25) *
          Math.max(0.08, Math.abs(Math.cos(share * Math.PI * 2 + band))),
        up * (0.95 - band * 0.2),
        0,
        0.1,
        PORYGON2_BLUE,
        shown,
      );
    }
    if (wash > 0 && wash < 1) {
      const height = 1 - wash * 2;
      const half = across * Math.sqrt(Math.max(0, 1 - height * height));
      const level = aside(kit, centre, 0, height * up);

      kit.ribbon(
        [aside(kit, level, -half, 0), aside(kit, level, half, 0)],
        reach * 0.12,
        '#ffffff',
        shown,
      );
    }
    kit.glow(
      aside(kit, centre, -across * 0.4, up * 0.45),
      reach * 0.4,
      '#ffffff',
      shown * 0.7,
      0.5,
    );
    if (wash >= 1) {
      const done = (share - WASH_COVERS) / (1 - WASH_COVERS);

      kit.ring(centre, across * (1 + done * 0.8), 0.08, colour, decay(done));
    }
  },

  Volt(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const run = Math.max(0.05, Math.min(1, share / VOLT_LANDS) ** 1.2);
    const head = toward(stage.source, at, run);
    const flick = Math.floor(share * 18);

    if (share < VOLT_LANDS) {
      const tail = toward(stage.source, head, 0.4);

      kit.trail(tail, head, reach * 0.9, VOLT_YELLOW, 0.35);
      bolt(kit, tail, head, seed + flick, reach, reach * 0.08, VOLT_YELLOW, 0.8);
      kit.glow(head, reach * 1.6, VOLT_YELLOW, 0.75, 0.4);
      kit.ring(head, reach * 1.5, 0.1, VOLT_WHITE, 1);
      for (let arc = 0; arc < 4; arc += 1) {
        const angle = noise(seed + flick, arc) * TAU;

        bolt(
          kit,
          aside(kit, head, Math.cos(angle) * reach * 1.5, Math.sin(angle) * reach * 1.5),
          aside(kit, head, Math.cos(angle) * reach * 2.4, Math.sin(angle) * reach * 2.4),
          seed + flick * 5 + arc,
          reach * 0.4,
          reach * 0.06,
          VOLT_WHITE,
          1,
        );
      }
      return;
    }
    const hit = (share - VOLT_LANDS) / (1 - VOLT_LANDS);

    kit.glow(at, reach * (1.4 + hit * 2.4), VOLT_YELLOW, decay(hit) * 0.85);
    kit.glow(at, reach * (1 + hit), VOLT_WHITE, decay(hit * 2));
    kit.ring(at, reach * (1.2 + hit * 3.6), 0.1, VOLT_YELLOW, decay(hit));
    kit.pool(floorOf(at), reach * (1.6 + hit * 2), VOLT_YELLOW, decay(hit) * 0.5);
    for (let arc = 0; arc < many(6, weight); arc += 1) {
      const angle = noise(seed + flick, arc + 10) * TAU;
      const out = reach * (2 + hit * 2);

      bolt(
        kit,
        at,
        aside(kit, at, Math.cos(angle) * out, Math.sin(angle) * out),
        seed + flick * 3 + arc,
        reach * 0.6,
        reach * 0.08,
        VOLT_YELLOW,
        decay(hit),
      );
    }
    const back = (share - VOLT_RECOILS) / (1 - VOLT_RECOILS);

    if (back <= 0) {
      return;
    }
    // The recoil: arcs jumping back down the line onto the caster
    for (let arc = 0; arc < 2; arc += 1) {
      bolt(
        kit,
        toward(at, stage.source, 0.2),
        stage.source,
        seed + flick * 7 + arc,
        reach,
        reach * 0.07,
        VOLT_YELLOW,
        decay(back) * 0.9,
      );
    }
    sparks(kit, stage.source, reach * (1 + back), 8, seed + flick, back, VOLT_WHITE, decay(back));
  },

  Chatter(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const mouth = aside(kit, stage.source, 0, reach);

    for (let one = 0; one < CHATTER_NOTES; one += 1) {
      const leave = (one / CHATTER_NOTES) * (CHATTER_ARRIVES - 0.3);
      const flight = (share - leave) / 0.3;

      if (flight < 0 || flight > 1) {
        continue;
      }
      const spot = aside(
        kit,
        toward(mouth, at, flight),
        spread(seed, one) * reach * 1.2 + Math.sin(flight * Math.PI * 4 + one) * reach * 0.4,
        0,
      );
      const colour = CHATOT_COLOURS[one % CHATOT_COLOURS.length];

      if (one % 3 === 2) {
        // A speech squiggle rather than a note
        const path: Spot[] = [];

        for (let step = 0; step <= 8; step += 1) {
          path.push(
            aside(
              kit,
              spot,
              -reach * 0.6 + step * reach * 0.15,
              Math.sin(step * 1.6 + share * 20) * reach * 0.2,
            ),
          );
        }
        strand(kit, path, reach * 0.1, colour, CHATOT_INK, Math.min(1, swell(flight) * 1.5));
        continue;
      }
      note(kit, spot, reach * 0.5, colour, Math.min(1, swell(flight) * 2));
    }
    const dizzy = Math.max(0, (share - 0.3) / 0.7);

    if (dizzy <= 0) {
      return;
    }
    const head = aside(kit, at, 0, reach * 1.1);

    for (let swirl = 0; swirl < 3; swirl += 1) {
      const angle = dizzy * Math.PI * 4 + (swirl / 3) * TAU;

      spiral(
        kit,
        aside(kit, head, Math.cos(angle) * reach * 1.1, Math.sin(angle) * reach * 0.4),
        reach * 0.45,
        2,
        dizzy * 2,
        CHATOT_COLOURS[swirl],
        Math.min(1, swell(dizzy) * 1.2),
        reach * 0.08,
      );
    }
    kit.oval(head, reach * 1.1, reach * 0.37, 0, 0.08, CHATOT_COLOURS[1], swell(dizzy) * 0.7);
  },

  Attackorder(kit, stage, share, { seed, weight }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight);
    const lead = aside(kit, at, 0, reach * 2.6);
    const approach = Math.min(1, share / ORDER_ARRIVES);
    const from = aside(kit, stage.source, 0, reach * 2);
    const front = toward(from, lead, approach);

    for (let bee = 0; bee < ORDER_BEES; bee += 1) {
      // The leader at the point of the V and the rest back along both arms
      const rank = Math.ceil(bee / 2);
      const side = Math.sign(bee) * (bee % 2 === 0 ? 1 : -1);
      const place = aside(kit, front, side * rank * reach * 0.9, -rank * reach * 0.7);
      const dives = ORDER_ARRIVES + (bee / ORDER_BEES) * (ORDER_STUNG - ORDER_ARRIVES - 0.12);
      const dive = (share - dives) / 0.12;
      const flap = share * 60 + bee;

      if (dive < 0) {
        combee(kit, place, reach * 0.4, flap, 1);
        continue;
      }
      const spot = aside(
        kit,
        at,
        spread(seed, bee) * reach * 1.1,
        -spread(seed, bee + 20) * reach * 0.9,
      );

      if (dive < 1) {
        const head = toward(place, spot, dive ** 1.5);

        kit.trail(
          toward(place, spot, Math.max(0, dive - 0.4) ** 1.5),
          head,
          reach * 0.15,
          COMBEE_GOLD,
          0.6,
        );
        combee(kit, head, reach * 0.4, flap, 1);
        continue;
      }
      const sting = Math.min(1, (dive - 1) * 2.5);

      if (sting >= 1) {
        continue;
      }
      sparks(kit, spot, reach * (0.5 + sting * 0.8), 6, seed + bee, sting, '#ffffff', decay(sting));
      kit.star(spot, reach * 0.7, sting * 2, COMBEE_GOLD, decay(sting));
      combee(kit, aside(kit, spot, 0, sting * reach), reach * 0.4, flap, decay(sting));
    }
    kit.glow(
      at,
      reach * 1.4,
      COMBEE_GOLD,
      Math.max(0, Math.min(1, (share - ORDER_ARRIVES) * 4)) * late(share, ORDER_STUNG) * 0.35,
      0.2,
    );
  },

  Grind(kit, stage, share, { seed, weight, hits = GEARS }) {
    const at = landed(stage);
    const reach = reachOf(stage, weight) * SIGNATURE_SCALE;
    const count = Math.max(1, Math.min(GEARS, Math.round(hits)));

    for (let one = 0; one < count; one += 1) {
      const flight = (share - one * GEAR_GAP) / GEAR_FLIGHT;

      if (flight < 0) {
        continue;
      }
      const side = one === 0 ? -1 : 1;
      const spot = aside(kit, at, side * reach * 0.5, reach * 0.2);
      const turn = share * 30 * side;

      if (flight < 1) {
        const from = aside(kit, stage.source, side * reach * 1.2, reach * 0.5);
        const head = aside(
          kit,
          toward(from, spot, flight),
          side * Math.sin(Math.PI * flight) * reach * 1.4,
          0,
        );

        gear(kit, head, reach * 0.9, turn, 1);
        continue;
      }
      const grind = (flight - 1) * (GEAR_FLIGHT / GEAR_GRINDS);

      if (grind >= 1.3) {
        continue;
      }
      const alpha = late(Math.min(1, grind / 1.3), 0.75);
      const shake = aside(kit, spot, Math.sin(share * 90) * reach * 0.08, 0);
      const below = aside(kit, shake, 0, -reach * 0.7);

      kit.glow(shake, reach * 1.2, GEAR_SPARK, alpha * swell(Math.min(1, grind)) * 0.5, 0.3);
      gear(kit, shake, reach * 0.9, turn, alpha);
      if (grind < 1) {
        sparks(
          kit,
          below,
          reach * 1.4,
          8,
          seed + one + Math.floor(share * 20),
          (share * 8) % 1,
          GEAR_SPARK,
          alpha,
        );
      }
      for (let spark = 0; spark < many(8, weight); spark += 1) {
        kit.glow(
          thrown(below, seed + one, spark, Math.min(1, grind), reach * 2, reach),
          reach * 0.12,
          GEAR_SPARK,
          alpha,
          0.6,
        );
      }
    }
  },
} satisfies Partial<Record<EffectShape, LitShapePainter>>;

export default earlySignatures;
