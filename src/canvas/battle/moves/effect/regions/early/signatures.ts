import { TYPE_COLORS, Types } from '../../../../../../data/constants/types';
import type { Point } from '../../../../stage';
import {
  between,
  bolt,
  burst,
  decay,
  fade,
  heart,
  hoop,
  late,
  lighten,
  motes,
  noise,
  orb,
  ring,
  ripple,
  shards,
  sickle,
  spiral,
  spread,
  star,
  swell,
} from '../../../__paint';
import { SIGNATURE_SCALE } from '../galar/legends';
import type { EffectShape, ShapePainter } from '../../shapes';
import { REACH, landing, many } from '../../shapes';

/** Barrage: the most eggs drawn, how long each is in the air, and the share the last lands by */
export const EGG_COUNT = 5;
export const EGG_FLIGHT = 0.3;
export const EGG_LANDS = 0.65;

/** Exeggcute's pale shell, the shade round it and the yolk inside */
export const EGG_SHELL = '#fbeee0';
export const EGG_SHADE = '#8a6a5a';
export const EGG_YOLK = '#ffd23a';

/** Bone Club: the share the club comes down by */
export const CLUB_LANDS = 0.35;

/** Marowak's bone, the shade under it and the dust it raises */
export const BONE_WHITE = '#f4ecd8';
export const BONE_SHADE = '#6a5a44';
export const CLUB_DUST = '#b89a6a';

/** Lovely Kiss: the share the heart leaves the lips, and the share it lands */
export const KISS_BLOWN = 0.2;
export const KISS_LANDS = 0.5;

/** Jynx's red lips, their dark, the lipstick heart and the drowsy Zs */
export const LIPS_RED = '#e8203a';
export const LIPS_DARK = '#7a0e22';
export const KISS_PINK = '#ff6a9a';
export const DROWSY_LILAC = '#d8c8ff';
export const DROWSY_SHADE = '#4a3a7a';

/** Conversion: the share the first facet flips at, and the share the last has */
export const FACETS_FLIP = 0.2;
export const FACETS_FLIPPED = 0.65;

/** Porygon's wire, the dark under it, and the types its facets turn */
export const WIRE_CYAN = '#8af4ff';
export const WIRE_DARK = '#1e2e5a';
export const CONVERSION_COLOURS = [
  TYPE_COLORS[Types.Fire],
  TYPE_COLORS[Types.Water],
  TYPE_COLORS[Types.Grass],
  TYPE_COLORS[Types.Electric],
  TYPE_COLORS[Types.Psychic],
  TYPE_COLORS[Types.Ice],
  TYPE_COLORS[Types.Dragon],
  TYPE_COLORS[Types.Fairy],
];

/** Kinesis: the share the spoon has bent all the way by */
export const SPOON_BENT = 0.6;

/** The spoon's silver and the shade under it */
export const SPOON_SILVER = '#e4e8f0';
export const SPOON_SHADE = '#4a5060';

/** Sketch: the share the outline is traced by, and the share the copy reaches the caster */
export const SKETCH_TRACED = 0.5;
export const SKETCH_RETURNS = 0.8;

/** Smeargle's green paint and the brown of its tail */
export const SKETCH_PAINT = '#4ac85a';
export const SKETCH_SHADE = '#1e4a24';
export const SMEARGLE_TAIL = '#8a6a44';

/** Conversion 2: the share the wash starts down, and the share it covers the shell */
export const WASH_STARTS = 0.25;
export const WASH_COVERS = 0.7;

/** Porygon2's pink and blue shell */
export const PORYGON2_PINK = '#f0688a';
export const PORYGON2_BLUE = '#3a6ad8';

/** Volt Tackle: the share the sphere strikes, and the share the sparks snap back at */
export const VOLT_LANDS = 0.35;
export const VOLT_RECOILS = 0.55;

/** The sphere's yellow and the white of its crackle */
export const VOLT_YELLOW = '#ffe03a';
export const VOLT_WHITE = '#fffbe0';

/** Chatter: how many notes fly, and the share the last arrives by */
export const CHATTER_NOTES = 7;
export const CHATTER_ARRIVES = 0.6;

/** Chatot's colours, and the dark its notes are inked in */
export const CHATOT_COLOURS = ['#3ab0f0', '#ffd23a', '#5ae06a', '#ff5a5a', '#ffffff'];
export const CHATOT_INK = '#222230';

/** Attack Order: how many Combee fly, the share the swarm reaches it, and the share the last stings */
export const ORDER_BEES = 7;
export const ORDER_ARRIVES = 0.35;
export const ORDER_STUNG = 0.7;

/** Combee's gold, the dark of its stripes and its wings */
export const COMBEE_GOLD = '#ffb81e';
export const COMBEE_DARK = '#4a3010';
export const COMBEE_WING = '#f4fbff';

/** Gear Grind: how many gears, how long each flies, how long each grinds, and the gap between them */
export const GEARS = 2;
export const GEAR_FLIGHT = 0.22;
export const GEAR_GRINDS = 0.3;
export const GEAR_GAP = 0.22;

/** Klinklang's steel, the dark of its teeth and the sparks off them */
export const GEAR_STEEL = '#c8d0dc';
export const GEAR_DARK = '#3a4250';
export const GEAR_SPARK = '#ffd25a';

/** A line through points, with a wider dark line under it when `under` is given */
function strokeThrough(
  context: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  color: string,
  alpha: number,
  under?: string,
): void {
  if (points.length < 2 || alpha <= 0) {
    return;
  }
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
  }
  if (under != null) {
    context.strokeStyle = fade(under, alpha * 0.55);
    context.lineWidth = width * 2.2;
    context.stroke();
  }
  context.strokeStyle = fade(color, alpha);
  context.lineWidth = width;
  context.stroke();
  context.lineCap = 'butt';
  context.lineJoin = 'miter';
}

/** A filled oval with a dark rim, so a pale thing reads on snow */
function body(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  across: number,
  up: number,
  turn: number,
  color: string,
  rim: string,
  alpha: number,
): void {
  if (alpha <= 0) {
    return;
  }
  context.beginPath();
  context.ellipse(x, y, Math.max(0.5, across), Math.max(0.5, up), turn, 0, Math.PI * 2);
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade(rim, alpha * 0.7);
  context.lineWidth = Math.max(1, Math.min(across, up) * 0.18);
  context.stroke();
}

/** A filled polygon through points with a dark rim */
function polygon(
  context: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  rim: string,
  alpha: number,
  width: number,
): void {
  if (alpha <= 0) {
    return;
  }
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
  }
  context.closePath();
  context.fillStyle = fade(color, alpha);
  context.fill();
  context.strokeStyle = fade(rim, alpha * 0.8);
  context.lineWidth = width;
  context.lineJoin = 'round';
  context.stroke();
  context.lineJoin = 'miter';
}

/** The corners of a regular polygon round a point, turned by `turn` */
function corners([x, y]: Point, radius: number, sides: number, turn: number, squash = 1): Point[] {
  const points: Point[] = [];

  for (let side = 0; side < sides; side += 1) {
    const angle = turn + (side / sides) * Math.PI * 2;

    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * squash]);
  }
  return points;
}

/** A Z drawn as three strokes, the shape a sleeping pokemon breathes out */
function zed(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  width: number,
  alpha: number,
): void {
  strokeThrough(
    context,
    [
      [x - size, y - size],
      [x + size, y - size],
      [x - size, y + size],
      [x + size, y + size],
    ],
    width,
    DROWSY_LILAC,
    alpha,
    DROWSY_SHADE,
  );
}

/** A music note: an inked head, a stem and a flag, in one of Chatot's colours */
function note(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  color: string,
  alpha: number,
): void {
  const top: Point = [x + size * 0.55, y - size * 1.8];

  strokeThrough(context, [[x + size * 0.55, y], top], size * 0.22, CHATOT_INK, alpha);
  strokeThrough(
    context,
    [top, [top[0] + size * 0.6, top[1] + size * 0.5], [top[0] + size * 0.5, top[1] + size]],
    size * 0.22,
    CHATOT_INK,
    alpha,
  );
  body(context, [x, y], size * 0.65, size * 0.48, -0.4, color, CHATOT_INK, alpha);
}

/** A Combee: three gold hexagons in a cluster with wings, the one in front bigger */
function combee(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  flap: number,
  alpha: number,
): void {
  const wing = size * (0.5 + Math.abs(Math.sin(flap)) * 0.3);

  body(
    context,
    [x - size * 0.9, y - size * 0.7],
    wing,
    wing * 0.55,
    -0.5,
    COMBEE_WING,
    '#8aa0b0',
    alpha * 0.85,
  );
  body(
    context,
    [x + size * 0.9, y - size * 0.7],
    wing,
    wing * 0.55,
    0.5,
    COMBEE_WING,
    '#8aa0b0',
    alpha * 0.85,
  );
  for (const [dx, dy, scale] of [
    [-0.5, -0.45, 0.55],
    [0.5, -0.45, 0.55],
    [0, 0.25, 0.65],
  ] as const) {
    const hub: Point = [x + dx * size, y + dy * size];

    polygon(
      context,
      corners(hub, size * scale, 6, Math.PI / 6),
      COMBEE_GOLD,
      COMBEE_DARK,
      alpha,
      Math.max(1, size * 0.12),
    );
    orb(context, [hub[0] - size * 0.15 * scale, hub[1] - size * 0.05], size * 0.1, {
      color: COMBEE_DARK,
      alpha,
    });
  }
}

/** A gear: a toothed steel wheel turned by `turn`, with a dark hub */
function gear(
  context: CanvasRenderingContext2D,
  at: Point,
  radius: number,
  turn: number,
  alpha: number,
): void {
  const points: Point[] = [];

  for (let tooth = 0; tooth < 10; tooth += 1) {
    for (const [step, out] of [
      [0, 1],
      [0.35, 1],
      [0.5, 0.78],
      [0.85, 0.78],
    ] as const) {
      const angle = turn + ((tooth + step) / 10) * Math.PI * 2;

      points.push([at[0] + Math.cos(angle) * radius * out, at[1] + Math.sin(angle) * radius * out]);
    }
  }
  polygon(context, points, GEAR_STEEL, GEAR_DARK, alpha, Math.max(1, radius * 0.1));
  body(context, at, radius * 0.4, radius * 0.4, 0, lighten(GEAR_STEEL, 0.4), GEAR_DARK, alpha);
  body(context, at, radius * 0.16, radius * 0.16, 0, GEAR_DARK, GEAR_DARK, alpha);
}

/** The colour a type-changing move turns to, picked by its seed */
function convertedTo(seed: number): string {
  return CONVERSION_COLOURS[Math.floor(noise(seed, 1) * CONVERSION_COLOURS.length)];
}

const earlySignatures = {
  // Pale eggs lobbed high one after another, each landing on it and
  // cracking open in a little pop of shell and yolk
  Eggbarrage(context, stage, share, { seed, weight, hits = EGG_COUNT }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const count = Math.max(2, Math.min(EGG_COUNT, Math.round(hits)));

    for (let egg = 0; egg < count; egg += 1) {
      const leave = (egg / count) * (EGG_LANDS - EGG_FLIGHT);
      const flight = (share - leave) / EGG_FLIGHT;

      if (flight < 0) {
        continue;
      }
      const spot: Point = [
        at[0] + spread(seed, egg) * size * 0.8,
        at[1] + spread(seed, egg + 10) * size * 0.5,
      ];

      if (flight < 1) {
        const from: Point = [stage.source[0] + spread(seed, egg + 20) * size, stage.source[1]];
        const line = between(from, spot, flight);
        const high: Point = [line[0], line[1] - Math.sin(Math.PI * flight) * size * 3.5];

        body(context, high, size * 0.42, size * 0.55, flight * 6, EGG_SHELL, EGG_SHADE, 1);
        orb(context, [high[0] - size * 0.12, high[1] - size * 0.18], size * 0.12, {
          color: '#ffffff',
          alpha: 0.9,
        });
        continue;
      }
      const pop = Math.min(1, (flight - 1) * 1.2);

      if (pop >= 1) {
        continue;
      }
      // The shell in two halves flying apart, and the yolk splashed between
      orb(context, spot, size * (0.5 + pop * 0.8), { color: EGG_YOLK, alpha: decay(pop) * 0.9 });
      for (const side of [-1, 1]) {
        const half: Point = [spot[0] + side * pop * size * 0.9, spot[1] - swell(pop) * size * 0.5];

        context.save();
        context.beginPath();
        context.ellipse(half[0], half[1], size * 0.42, size * 0.55, side * pop * 1.5, 0, Math.PI);
        context.closePath();
        context.fillStyle = fade(EGG_SHELL, decay(pop));
        context.fill();
        context.strokeStyle = fade(EGG_SHADE, decay(pop) * 0.7);
        context.lineWidth = Math.max(1, size * 0.08);
        context.stroke();
        context.restore();
      }
      ring(context, spot, size * (0.4 + pop * 1.2), {
        color: '#ffffff',
        alpha: decay(pop),
        width: 2.4 * stage.scale,
      });
      burst(context, spot, size * (0.7 + pop), 7, seed + egg, {
        color: EGG_YOLK,
        alpha: decay(pop),
        width: 2 * stage.scale,
      });
    }
  },

  // A thick bone club swung down from above onto it, a hard crack of
  // white lines where it hits and a puff of dust off the ground
  Boneclub(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * 1.2;
    const grip: Point = [at[0] + size * 2.4, at[1] + size * 0.3];
    const length = size * 2.6;
    const start = -Math.PI * 0.35;
    const end = -Math.PI;
    const swing = Math.min(1, share / CLUB_LANDS) ** 1.6;
    const angle = start + (end - start) * swing;
    const shown = late(share, 0.6);
    const head: Point = [grip[0] + Math.cos(angle) * length, grip[1] + Math.sin(angle) * length];

    // The blur of the swing, behind the club as it comes down
    sickle(context, grip, length * 0.9, start, angle, size * 0.8, {
      color: BONE_WHITE,
      alpha: late(share, 0.4) * 0.45,
    });
    strokeThrough(context, [grip, head], size * 0.36, BONE_WHITE, shown, BONE_SHADE);
    for (const [knobAt, knob] of [
      [grip, 0.28],
      [head, 0.42],
    ] as const) {
      const across = Math.sin(angle) * size * knob * 0.7;
      const down = -Math.cos(angle) * size * knob * 0.7;

      body(
        context,
        [knobAt[0] + across, knobAt[1] + down],
        size * knob,
        size * knob,
        0,
        BONE_WHITE,
        BONE_SHADE,
        shown,
      );
      body(
        context,
        [knobAt[0] - across, knobAt[1] - down],
        size * knob,
        size * knob,
        0,
        BONE_WHITE,
        BONE_SHADE,
        shown,
      );
    }
    if (share < CLUB_LANDS) {
      return;
    }
    const hit = (share - CLUB_LANDS) / (1 - CLUB_LANDS);
    const foot: Point = [at[0], at[1] + size * 0.8];

    orb(context, at, size * (1 + hit * 1.2), { color: '#ffffff', alpha: decay(hit * 2.5) * 0.8 });
    burst(context, head, size * (1.4 + hit * 1.4), 9, seed, {
      color: '#ffffff',
      alpha: decay(hit * 1.6),
      width: 3 * stage.scale,
    });
    ripple(context, foot, size * (1 + hit * 2.4), {
      color: CLUB_DUST,
      alpha: decay(hit) * 0.8,
      width: 3 * stage.scale,
    });
    for (let cloud = 0; cloud < many(7, weight); cloud += 1) {
      const heading = noise(seed, cloud + 30) * Math.PI * 2;
      const out = size * (0.8 + hit * 1.8);

      orb(
        context,
        [
          foot[0] + Math.cos(heading) * out,
          foot[1] + Math.sin(heading) * out * 0.34 - hit * size * 0.9,
        ],
        size * (0.5 + hit * 0.7),
        { color: CLUB_DUST, alpha: swell(Math.min(1, hit * 1.3)) * 0.4 },
      );
    }
    shards(context, foot, size * 2, many(8, weight), seed + 1, hit, {
      color: BONE_SHADE,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A big pair of red lips puckering by the caster and blowing a kiss,
  // a lipstick heart floating over onto it, then drowsy Zs rising off it
  Kiss(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const mouth: Point = [
      stage.source[0] + (at[0] - stage.source[0]) * 0.2,
      stage.source[1] + (at[1] - stage.source[1]) * 0.2 - size * 1.2,
    ];
    const lips = Math.min(1, share * 10) * late(share, KISS_BLOWN + 0.15);
    const pucker = 1 - swell(Math.min(1, share / KISS_BLOWN)) * 0.35;

    // Two lobes for the upper lip, one wide one for the lower
    body(
      context,
      [mouth[0] - size * 0.45 * pucker, mouth[1] - size * 0.2],
      size * 0.6 * pucker,
      size * 0.32,
      0.2,
      LIPS_RED,
      LIPS_DARK,
      lips,
    );
    body(
      context,
      [mouth[0] + size * 0.45 * pucker, mouth[1] - size * 0.2],
      size * 0.6 * pucker,
      size * 0.32,
      -0.2,
      LIPS_RED,
      LIPS_DARK,
      lips,
    );
    body(
      context,
      [mouth[0], mouth[1] + size * 0.25],
      size * 0.95 * pucker,
      size * 0.4,
      0,
      LIPS_RED,
      LIPS_DARK,
      lips,
    );
    strokeThrough(
      context,
      [
        [mouth[0] - size * pucker, mouth[1]],
        [mouth[0], mouth[1] + size * 0.06],
        [mouth[0] + size * pucker, mouth[1]],
      ],
      1.6 * stage.scale,
      LIPS_DARK,
      lips,
    );
    orb(context, [mouth[0] - size * 0.3, mouth[1] - size * 0.3], size * 0.15, {
      color: '#ffffff',
      alpha: lips * 0.8,
    });
    if (share >= KISS_BLOWN * 0.5 && share < KISS_LANDS) {
      const flight = (share - KISS_BLOWN * 0.5) / (KISS_LANDS - KISS_BLOWN * 0.5);
      const line = between(mouth, at, flight);
      const spot: Point = [
        line[0] + Math.sin(flight * Math.PI * 3) * size * 0.4,
        line[1] - Math.sin(Math.PI * flight) * size * 1.2,
      ];

      heart(context, spot, size * (0.9 + flight * 0.3), { color: LIPS_DARK, alpha: 0.6 });
      heart(context, spot, size * (0.75 + flight * 0.3), { color: KISS_PINK, alpha: 1 });
      motes(context, spot, size * 0.9, 4, seed, (share * 3) % 1, {
        color: lighten(KISS_PINK, 0.4),
        alpha: 0.8,
        width: 2 * stage.scale,
      });
    }
    if (share < KISS_LANDS) {
      return;
    }
    const sleep = (share - KISS_LANDS) / (1 - KISS_LANDS);

    orb(context, at, size * (1 + sleep), { color: KISS_PINK, alpha: decay(sleep * 2) * 0.6 });
    heart(context, [at[0], at[1] - sleep * size], size * (0.9 + sleep), {
      color: KISS_PINK,
      alpha: decay(sleep * 2.5),
    });
    for (let one = 0; one < 3; one += 1) {
      const rise = Math.min(1, Math.max(0, sleep * 1.6 - one * 0.25));

      if (rise <= 0) {
        continue;
      }
      zed(
        context,
        [
          at[0] + size * (0.5 + one * 0.4) + Math.sin(rise * 6) * size * 0.15,
          at[1] - size * (0.8 + rise * 1.6),
        ],
        size * (0.22 + one * 0.08),
        2 * stage.scale,
        swell(Math.min(1, rise * 1.2)),
      );
    }
  },

  // The caster drawn as a turning wireframe of polygons, its facets
  // flipping one by one to the colour of the type it is taking
  Conversion(context, stage, share, { seed, weight, paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const centre: Point = [at[0], at[1] - size * 0.2];
    const radius = size * 1.6;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const turn = share * 1.2;
    const squash = 0.75 + Math.cos(share * Math.PI * 2) * 0.15;
    const inner = corners(centre, radius * 0.55, 6, turn, squash);
    const outer = corners(centre, radius, 6, turn + Math.PI / 6, squash);
    const colour = convertedTo(seed);
    const facets: Point[][] = [];

    for (let side = 0; side < 6; side += 1) {
      const next = (side + 1) % 6;

      facets.push([centre, inner[side], inner[next]]);
      facets.push([inner[side], inner[next], outer[side]]);
      facets.push([inner[next], outer[side], outer[next]]);
    }
    for (const [index, facet] of facets.entries()) {
      const flipAt = FACETS_FLIP + noise(seed, index + 5) * (FACETS_FLIPPED - FACETS_FLIP - 0.1);
      const flip = Math.min(1, Math.max(0, (share - flipAt) / 0.1));
      // Shrunk to its middle and back out as it flips over
      const scale = Math.abs(Math.cos(flip * Math.PI));
      const mid: Point = [
        (facet[0][0] + facet[1][0] + facet[2][0]) / 3,
        (facet[0][1] + facet[1][1] + facet[2][1]) / 3,
      ];
      const points: Point[] = [];

      for (const corner of facet) {
        points.push(between(mid, corner, Math.max(0.1, scale)));
      }
      polygon(
        context,
        points,
        flip < 0.5 ? lighten(paint.color, 0.2) : colour,
        WIRE_DARK,
        shown * 0.75,
        1,
      );
    }
    for (let side = 0; side < 6; side += 1) {
      const next = (side + 1) % 6;

      strokeThrough(context, [centre, inner[side]], 1.4 * stage.scale, WIRE_CYAN, shown, WIRE_DARK);
      strokeThrough(
        context,
        [inner[side], inner[next], outer[side], outer[next], inner[next]],
        1.4 * stage.scale,
        WIRE_CYAN,
        shown,
        WIRE_DARK,
      );
    }
    const done = Math.max(0, (share - FACETS_FLIPPED) / (1 - FACETS_FLIPPED));

    if (done > 0) {
      ring(context, centre, radius * (1 + done * 0.8), {
        color: colour,
        alpha: decay(done),
        width: 3 * stage.scale,
      });
      star(context, [centre[0] + radius * 0.5, centre[1] - radius * 0.5], size * 0.6, done * 3, {
        color: '#ffffff',
        alpha: swell(done),
      });
    }
  },

  // A silver spoon floating over it, bending further with each psychic
  // ring that pulses out round it
  Spoon(context, stage, share, { seed, weight, paint }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const bend = Math.min(1, share / SPOON_BENT) ** 1.3;
    const bob = Math.sin(share * Math.PI * 4) * size * 0.15;
    const handle: Point = [at[0], at[1] - size * 1.2 + bob];
    const neck: Point = [handle[0], handle[1] - size * 1.1];
    const fold = bend * Math.PI * 0.45;
    const tip: Point = [
      neck[0] + Math.sin(fold) * size * 1.1,
      neck[1] - Math.cos(fold) * size * 1.1,
    ];
    const bowl = between(neck, tip, 0.75);

    for (let pulse = 0; pulse < 3; pulse += 1) {
      const out = (share * 2.2 + pulse / 3) % 1;

      ring(context, neck, size * (0.4 + out * 2.2), {
        color: paint.color,
        alpha: swell(out) * shown * 0.9,
        width: 2.6 * stage.scale,
      });
    }
    orb(context, neck, size * 1.4, { color: paint.color, alpha: shown * 0.3 });
    strokeThrough(
      context,
      [handle, neck, between(neck, tip, 0.4)],
      size * 0.22,
      SPOON_SILVER,
      shown,
      SPOON_SHADE,
    );
    body(context, bowl, size * 0.36, size * 0.55, fold, SPOON_SILVER, SPOON_SHADE, shown);
    star(context, [bowl[0] - size * 0.1, bowl[1] - size * 0.15], size * 0.4, share * 4, {
      color: '#ffffff',
      alpha: shown * swell((share * 2) % 1),
    });
    // The wobble in its sight: a hoop turning about its eyes
    hoop(context, at, size * 1.3, Math.cos(share * Math.PI * 3), 0.2, {
      color: lighten(paint.color, 0.3),
      alpha: Math.min(1, share * 3) * shown * 0.8,
      width: 2 * stage.scale,
    });
    motes(context, neck, size * 1.6, many(6, weight), seed, (share * 1.5) % 1, {
      color: lighten(paint.color, 0.4),
      alpha: shown * 0.8,
      width: 2 * stage.scale,
    });
  },

  // A paintbrush tail tip tracing a stroke round its outline, then a copy
  // of that stroke lifting off and flying back to the caster
  Sketch(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const traced = Math.min(1, share / SKETCH_TRACED);
    const outline = (centre: Point, scale: number, upTo: number): Point[] => {
      const points: Point[] = [];

      for (let step = 0; step <= Math.ceil(upTo * 32); step += 1) {
        const angle = -Math.PI / 2 + (step / 32) * Math.PI * 2;
        const wobble = 1 + Math.sin(angle * 3) * 0.08;

        points.push([
          centre[0] + Math.cos(angle) * size * 1.3 * scale * wobble,
          centre[1] + Math.sin(angle) * size * 1.6 * scale * wobble,
        ]);
      }
      return points;
    };
    const stroke = outline(at, 1, traced);

    strokeThrough(context, stroke, 3 * stage.scale, SKETCH_PAINT, late(share, 0.6), SKETCH_SHADE);
    if (share < SKETCH_TRACED) {
      const tip = stroke[stroke.length - 1];
      const back: Point = [tip[0] + size * 0.7, tip[1] + size * 0.9];

      // The tail end, a tuft of brush loaded with paint
      strokeThrough(context, [back, tip], size * 0.2, SMEARGLE_TAIL, 1);
      body(
        context,
        between(back, tip, 0.85),
        size * 0.3,
        size * 0.5,
        -0.65,
        SKETCH_PAINT,
        SKETCH_SHADE,
        1,
      );
      return;
    }
    const fly = Math.min(1, (share - SKETCH_TRACED) / (SKETCH_RETURNS - SKETCH_TRACED));
    const line = between(at, stage.source, fly);
    const spot: Point = [line[0], line[1] - Math.sin(Math.PI * fly) * size * 1.6];

    if (fly < 1) {
      strokeThrough(
        context,
        outline(spot, 0.6, 1),
        2.6 * stage.scale,
        SKETCH_PAINT,
        1,
        SKETCH_SHADE,
      );
      motes(context, spot, size, 5, seed, fly, {
        color: lighten(SKETCH_PAINT, 0.4),
        alpha: 0.8,
        width: 2 * stage.scale,
      });
      return;
    }
    const kept = (share - SKETCH_RETURNS) / (1 - SKETCH_RETURNS);

    ring(context, stage.source, size * (0.8 + kept * 1.6), {
      color: SKETCH_PAINT,
      alpha: decay(kept),
      width: 3 * stage.scale,
    });
    star(context, [stage.source[0], stage.source[1] - size], size * 0.6, kept * 3, {
      color: '#ffffff',
      alpha: swell(kept),
    });
  },

  // Porygon2's smooth curved shell turning in place, a wash of a type's
  // colour sweeping down over it from top to bottom
  Reconvert(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const centre: Point = [at[0], at[1] - size * 0.2];
    const across = size * 1.5;
    const up = size * 1.25;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const colour = convertedTo(seed + 3);
    const wash = Math.min(1, Math.max(0, (share - WASH_STARTS) / (WASH_COVERS - WASH_STARTS)));
    const line = centre[1] - up + wash * up * 2;

    body(context, centre, across, up, 0, PORYGON2_PINK, WIRE_DARK, shown * 0.85);
    // The blue bands round the shell, turning as it turns
    for (let band = 0; band < 2; band += 1) {
      hoop(
        context,
        centre,
        across * (0.95 - band * 0.25),
        Math.cos(share * Math.PI * 2 + band),
        Math.PI / 2,
        {
          color: PORYGON2_BLUE,
          alpha: shown,
          width: 3 * stage.scale,
        },
      );
    }
    if (wash > 0) {
      context.save();
      context.beginPath();
      context.ellipse(centre[0], centre[1], across, up, 0, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = fade(colour, shown * 0.7);
      context.fillRect(centre[0] - across, centre[1] - up, across * 2, line - (centre[1] - up));
      context.restore();
      strokeThrough(
        context,
        [
          [centre[0] - across * Math.sqrt(Math.max(0, 1 - ((line - centre[1]) / up) ** 2)), line],
          [centre[0] + across * Math.sqrt(Math.max(0, 1 - ((line - centre[1]) / up) ** 2)), line],
        ],
        2.4 * stage.scale,
        '#ffffff',
        shown * decay(wash * 0.8),
      );
    }
    orb(context, [centre[0] - across * 0.4, centre[1] - up * 0.45], size * 0.4, {
      color: '#ffffff',
      alpha: shown * 0.7,
    });
    if (wash >= 1) {
      const done = (share - WASH_COVERS) / (1 - WASH_COVERS);

      ring(context, centre, across * (1 + done * 0.8), {
        color: colour,
        alpha: decay(done),
        width: 3 * stage.scale,
      });
    }
  },

  // A crackling yellow sphere streaking in at it, a big electric blast
  // where it strikes, then sparks snapping back at the caster
  Volt(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = Math.max(0.05, Math.min(1, share / VOLT_LANDS) ** 1.2);
    const head = between(stage.source, at, run);
    const flick = Math.floor(share * 18);

    if (share < VOLT_LANDS) {
      const tail = between(stage.source, head, 0.4);

      orb(context, between(tail, head, 0.5), size * 0.9, { color: VOLT_YELLOW, alpha: 0.35 });
      bolt(context, tail, head, seed + flick, {
        color: VOLT_YELLOW,
        alpha: 0.8,
        width: 2.4 * stage.scale,
      });
      orb(context, head, size * 1.6, { color: VOLT_YELLOW, alpha: 0.75 });
      ring(context, head, size * 1.5, { color: VOLT_WHITE, alpha: 1, width: 3 * stage.scale });
      for (let arc = 0; arc < 4; arc += 1) {
        const angle = noise(seed + flick, arc) * Math.PI * 2;

        bolt(
          context,
          [head[0] + Math.cos(angle) * size * 1.5, head[1] + Math.sin(angle) * size * 1.5],
          [head[0] + Math.cos(angle) * size * 2.4, head[1] + Math.sin(angle) * size * 2.4],
          seed + flick * 5 + arc,
          { color: VOLT_WHITE, alpha: 1, width: 2 * stage.scale },
        );
      }
      return;
    }
    const hit = (share - VOLT_LANDS) / (1 - VOLT_LANDS);

    orb(context, at, size * (1.4 + hit * 2.4), { color: VOLT_YELLOW, alpha: decay(hit) * 0.85 });
    orb(context, at, size * (1 + hit), { color: VOLT_WHITE, alpha: decay(hit * 2) });
    ring(context, at, size * (1.2 + hit * 3.6), {
      color: VOLT_YELLOW,
      alpha: decay(hit),
      width: 4 * stage.scale,
    });
    for (let arc = 0; arc < many(6, weight); arc += 1) {
      const angle = noise(seed + flick, arc + 10) * Math.PI * 2;
      const out = size * (2 + hit * 2);

      bolt(
        context,
        at,
        [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out],
        seed + flick * 3 + arc,
        {
          color: VOLT_YELLOW,
          alpha: decay(hit),
          width: 2.4 * stage.scale,
        },
      );
    }
    const back = (share - VOLT_RECOILS) / (1 - VOLT_RECOILS);

    if (back <= 0) {
      return;
    }
    // The recoil: arcs jumping back down the line onto the caster
    for (let arc = 0; arc < 2; arc += 1) {
      bolt(context, between(at, stage.source, 0.2), stage.source, seed + flick * 7 + arc, {
        color: VOLT_YELLOW,
        alpha: decay(back) * 0.9,
        width: 2 * stage.scale,
      });
    }
    burst(context, stage.source, size * (1 + back), 8, seed + flick, {
      color: VOLT_WHITE,
      alpha: decay(back),
      width: 2.4 * stage.scale,
    });
  },

  // Bright music notes and coloured squiggles spilling out of the
  // caster toward it, then dizzy swirls turning round its head
  Chatter(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const mouth: Point = [stage.source[0], stage.source[1] - size];

    for (let one = 0; one < CHATTER_NOTES; one += 1) {
      const leave = (one / CHATTER_NOTES) * (CHATTER_ARRIVES - 0.3);
      const flight = (share - leave) / 0.3;

      if (flight < 0 || flight > 1) {
        continue;
      }
      const line = between(mouth, at, flight);
      const side = spread(seed, one) * size * 1.2;
      const spot: Point = [
        line[0] + side + Math.sin(flight * Math.PI * 4 + one) * size * 0.4,
        line[1],
      ];
      const colour = CHATOT_COLOURS[one % CHATOT_COLOURS.length];

      if (one % 3 === 2) {
        // A speech squiggle rather than a note
        const points: Point[] = [];

        for (let step = 0; step <= 8; step += 1) {
          points.push([
            spot[0] - size * 0.6 + step * size * 0.15,
            spot[1] + Math.sin(step * 1.6 + share * 20) * size * 0.2,
          ]);
        }
        strokeThrough(context, points, 2.4 * stage.scale, colour, swell(flight) * 1.5, CHATOT_INK);
        continue;
      }
      note(context, spot, size * 0.5, colour, Math.min(1, swell(flight) * 2));
    }
    const dizzy = Math.max(0, (share - 0.3) / 0.7);

    if (dizzy <= 0) {
      return;
    }
    const head: Point = [at[0], at[1] - size * 1.1];

    for (let swirl = 0; swirl < 3; swirl += 1) {
      const angle = dizzy * Math.PI * 4 + (swirl / 3) * Math.PI * 2;

      spiral(
        context,
        [head[0] + Math.cos(angle) * size * 1.1, head[1] + Math.sin(angle) * size * 0.4],
        size * 0.45,
        2,
        dizzy * 2,
        {
          color: CHATOT_COLOURS[swirl],
          alpha: swell(dizzy) * 1.2,
          width: 2.2 * stage.scale,
        },
      );
    }
    ripple(context, head, size * 1.1, {
      color: CHATOT_COLOURS[1],
      alpha: swell(dizzy) * 0.7,
      width: 2 * stage.scale,
    });
  },

  // A swarm of little gold Combee flying in a tight V, then diving one
  // after another to sting all over it
  Attackorder(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const lead: Point = [at[0], at[1] - size * 2.6];
    const approach = Math.min(1, share / ORDER_ARRIVES);
    const from: Point = [stage.source[0], stage.source[1] - size * 2];
    const front = between(from, lead, approach);

    for (let bee = 0; bee < ORDER_BEES; bee += 1) {
      // The leader at the point of the V and the rest back along both arms
      const rank = Math.ceil(bee / 2);
      const side = Math.sign(bee) * (bee % 2 === 0 ? 1 : -1);
      const place: Point = [front[0] + side * rank * size * 0.9, front[1] + rank * size * 0.7];
      const dives = ORDER_ARRIVES + (bee / ORDER_BEES) * (ORDER_STUNG - ORDER_ARRIVES - 0.12);
      const dive = (share - dives) / 0.12;
      const flap = share * 60 + bee;

      if (dive < 0) {
        combee(context, place, size * 0.4, flap, 1);
        continue;
      }
      const spot: Point = [
        at[0] + spread(seed, bee) * size * 1.1,
        at[1] + spread(seed, bee + 20) * size * 0.9,
      ];

      if (dive < 1) {
        const head = between(place, spot, dive ** 1.5);

        strokeThrough(
          context,
          [between(place, spot, Math.max(0, dive - 0.4) ** 1.5), head],
          size * 0.15,
          COMBEE_GOLD,
          0.6,
        );
        combee(context, head, size * 0.4, flap, 1);
        continue;
      }
      const sting = Math.min(1, (dive - 1) * 2.5);

      if (sting >= 1) {
        continue;
      }
      burst(context, spot, size * (0.5 + sting * 0.8), 6, seed + bee, {
        color: '#ffffff',
        alpha: decay(sting),
        width: 2.4 * stage.scale,
      });
      star(context, spot, size * 0.5, sting * 2, { color: COMBEE_GOLD, alpha: decay(sting) });
      combee(context, [spot[0], spot[1] - sting * size], size * 0.4, flap, decay(sting));
    }
    orb(context, at, size * 1.4, {
      color: COMBEE_GOLD,
      alpha:
        Math.max(0, Math.min(1, (share - ORDER_ARRIVES) * 4)) * late(share, ORDER_STUNG) * 0.35,
    });
  },

  // Two big steel gears thrown spinning one after the other, each
  // grinding into it in a spray of sparks
  Grind(context, stage, share, { seed, weight, hits = GEARS }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const count = Math.max(1, Math.min(GEARS, Math.round(hits)));

    for (let one = 0; one < count; one += 1) {
      const leave = one * GEAR_GAP;
      const flight = (share - leave) / GEAR_FLIGHT;

      if (flight < 0) {
        continue;
      }
      const side = one === 0 ? -1 : 1;
      const spot: Point = [at[0] + side * size * 0.5, at[1] - size * 0.2];
      const turn = share * 30 * side;

      if (flight < 1) {
        const from: Point = [stage.source[0] + side * size * 1.2, stage.source[1] - size * 0.5];
        const line = between(from, spot, flight);
        const head: Point = [line[0] + side * Math.sin(Math.PI * flight) * size * 1.4, line[1]];

        gear(context, head, size * 0.9, turn, 1);
        continue;
      }
      const grind = (flight - 1) * (GEAR_FLIGHT / GEAR_GRINDS);

      if (grind >= 1.3) {
        continue;
      }
      const alpha = late(Math.min(1, grind / 1.3), 0.75);
      const shake: Point = [spot[0] + Math.sin(share * 90) * size * 0.08, spot[1]];

      orb(context, shake, size * 1.2, {
        color: GEAR_SPARK,
        alpha: alpha * swell(Math.min(1, grind)) * 0.5,
      });
      gear(context, shake, size * 0.9, turn, alpha);
      burst(
        context,
        [shake[0], shake[1] + size * 0.7],
        size * 1.4,
        8,
        seed + one + Math.floor(share * 20),
        {
          color: GEAR_SPARK,
          alpha: alpha * (grind < 1 ? 1 : 0),
          width: 2.4 * stage.scale,
        },
      );
      motes(
        context,
        [shake[0], shake[1] + size * 0.7],
        size * 2,
        many(8, weight),
        seed + one,
        Math.min(1, grind),
        {
          color: GEAR_SPARK,
          alpha,
          width: 2.4 * stage.scale,
        },
      );
    }
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default earlySignatures;
