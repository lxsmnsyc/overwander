import type { Point } from '../../stage';
import {
  beam,
  between,
  burst,
  decay,
  edge,
  fade,
  heart,
  late,
  lighten,
  motes,
  noise,
  orb,
  petal,
  ring,
  ripple,
  shards,
  sickle,
  slash,
  spread,
  star,
  swell,
} from '../__paint';
import { SIGNATURE_SCALE } from './galar';
import type { EffectShape, ShapePainter } from './shapes';
import { REACH, landing, many } from './shapes';

/** Dire Claw: how many rakes, how far apart they start, and how long each takes to cross */
export const DIRECLAW_RAKES = 3;
export const DIRECLAW_GAP = 0.1;
export const DIRECLAW_RAKE = 0.2;

/** Sneasler's toxic purple, the dark under it and the poison that drips off */
export const DIRECLAW_PURPLE = '#a24ae0';
export const DIRECLAW_DARK = '#2e1440';
export const DIRECLAW_DRIP = '#d07aff';

/** Psyshield Bash: the share the shield is rammed home by */
export const PSYSHIELD_LANDS = 0.35;

/** The shield's pale violet, its deep rim, and Wyrdeer's antlers */
export const SHIELD_VIOLET = '#d8c4ff';
export const SHIELD_DEEP = '#6a3ab0';
export const ANTLER_BROWN = '#4a3428';

/** Stone Axe: the share the axe chops in by, and how many splinters float round after */
export const STONEAXE_LANDS = 0.35;
export const STONEAXE_SPLINTERS = 5;

/** Kleavor's stone, its dark edges, the pale cutting edge and the haft */
export const AXE_STONE = '#9a8a74';
export const AXE_DARK = '#3a3028';
export const AXE_EDGE = '#e8e0cc';
export const AXE_HAFT = '#6a4a2a';

/** Mountain Gale: how many chunks break off, how far apart, and how long each falls */
export const GALE_CHUNKS = 4;
export const GALE_GAP = 0.12;
export const GALE_DROP = 0.22;

/** The glacier's ice, its deep blue, the pale of a fresh break and the dark rim */
export const GALE_ICE = '#bfe8ff';
export const GALE_DEEP = '#4a8ac0';
export const GALE_PALE = '#f4fbff';
export const GALE_DARK = '#2a4a6a';

/** Victory Dance: the share the spin ends and the flourish blooms at */
export const VICTORY_FLOURISH = 0.6;

/** Hisuian Lilligant's green, its red ribbon, its petals and the flourish gold */
export const LILLIGANT_GREEN = '#4aa84a';
export const VICTORY_RIBBON = '#e8445a';
export const VICTORY_PETAL = '#ffd0dc';
export const VICTORY_GOLD = '#ffe066';

/** Barb Barrage: how many barbs fly, and the share the last has stuck by */
export const BARB_COUNT = 7;
export const BARB_LANDS = 0.4;

/** Overqwil's dark barbs, their purple and the ooze */
export const BARB_DARK = '#2c1e3a';
export const BARB_PURPLE = '#8a3ac8';
export const BARB_OOZE = '#c86aff';

/** Esper Wing: the share the wings are spread by, and how many blades sweep */
export const ESPER_SPREAD = 0.3;
export const ESPER_BLADES = 5;

/** Hisuian Braviary's pale feathers and the psychic pink round them */
export const ESPER_FEATHER = '#f4ecff';
export const ESPER_PINK = '#e85ad8';
export const ESPER_DEEP = '#6a2a8a';

/** Bitter Malice: the share the mask has come up by, and how many wisps claw */
export const MALICE_RISEN = 0.3;
export const MALICE_WISPS = 5;

/** The mask's white, the violet round it, its hollows and the frost */
export const MALICE_WHITE = '#eef0ff';
export const MALICE_VIOLET = '#8a5ad8';
export const MALICE_DARK = '#24162e';
export const MALICE_FROST = '#c8f0ff';

/** Shelter: the share the shell has closed by */
export const SHELTER_CLOSED = 0.4;

/** The shell's steel, its dark seams and Hisuian Goodra's slime */
export const SHELL_STEEL = '#aab6c6';
export const SHELL_DARK = '#343c4a';
export const SHELL_SLIME = '#b48ae8';

/** Triple Arrows: how many arrows, how far apart, and how long each flies */
export const ARROW_COUNT = 3;
export const ARROW_GAP = 0.15;
export const ARROW_FLIGHT = 0.18;

/** The arrow's shaft, its dark head and Hisuian Decidueye's leaf fletching */
export const ARROW_SHAFT = '#8a6a44';
export const ARROW_HEAD = '#30302e';
export const ARROW_LEAF = '#4aa84a';
export const ARROW_KICK = '#ff8a4a';

/** Infernal Parade: how many flames march, and the share they swarm in at */
export const PARADE_FLAMES = 8;
export const PARADE_SWARM = 0.5;

/** The parade's ghostly violet, its pale core, its magenta tips and the dark under it */
export const PARADE_VIOLET = '#9a6aff';
export const PARADE_PALE = '#f0e8ff';
export const PARADE_MAGENTA = '#e04ac8';
export const PARADE_DEEP = '#3a1e6a';

/** Ceaseless Edge: the share the cut is through by, and how many splinters it leaves */
export const CEASELESS_CUTS = 0.3;
export const CEASELESS_SPLINTERS = 6;

/** Hisuian Samurott's dark arc, the seamitar's teal sheen and its shell */
export const CEASELESS_DARK = '#241e36';
export const CEASELESS_TEAL = '#5ac8d8';
export const CEASELESS_SHELL = '#dce8ee';

/** Lunar Blessing: the share the crescent is up by */
export const BLESSING_RISEN = 0.25;

/** Cresselia's silver, its pink and the moon's gold */
export const BLESSING_SILVER = '#eef0ff';
export const BLESSING_PINK = '#f6b8e8';
export const BLESSING_GOLD = '#ffe89a';
export const BLESSING_SHADE = '#6a5a9a';

/** Take Heart: how often the heart beats out a wave, in shares */
export const TAKEHEART_BEAT = 0.25;

/** Manaphy's blue, the heart's pale glow and its dark rim */
export const TAKEHEART_BLUE = '#3a9cff';
export const TAKEHEART_PALE = '#d0f0ff';
export const TAKEHEART_DARK = '#1a3a8a';

/** Chloroblast: the share the blast fires at */
export const CHLORO_FIRES = 0.35;

/** The chlorophyll green, its pale core, the deep under it and the recoil sparks */
export const CHLORO_GREEN = '#5aea4a';
export const CHLORO_PALE = '#eaffd0';
export const CHLORO_DEEP = '#1a6a2a';
export const CHLORO_SPARK = '#f4ff7a';

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

/** A filled outline through points with a dark rim, so a solid thing reads on snow */
function solid(
  context: CanvasRenderingContext2D,
  points: Point[],
  fill: string,
  rim: string,
  alpha: number,
  width: number,
): void {
  if (points.length < 3 || alpha <= 0) {
    return;
  }
  context.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    context[index === 0 ? 'moveTo' : 'lineTo'](x, y);
  }
  context.closePath();
  context.fillStyle = fade(fill, alpha);
  context.fill();
  context.strokeStyle = fade(rim, alpha * 0.8);
  context.lineWidth = Math.max(1, width);
  context.lineJoin = 'round';
  context.stroke();
  context.lineJoin = 'miter';
}

/** A broken lump of rock or ice: an uneven polygon turned by `turn` */
function chunk(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  turn: number,
  seed: number,
  fill: string,
  rim: string,
  alpha: number,
): void {
  const points: Point[] = [];

  for (let corner = 0; corner < 6; corner += 1) {
    const angle = turn + (corner / 6) * Math.PI * 2;
    const out = size * (0.7 + noise(seed, corner) * 0.4);

    points.push([x + Math.cos(angle) * out, y + Math.sin(angle) * out * 0.85]);
  }
  solid(context, points, fill, rim, alpha, size * 0.18);
}

/** A sharp splinter: a long diamond pointing along `turn` */
function spike(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  length: number,
  width: number,
  turn: number,
  fill: string,
  rim: string,
  alpha: number,
): void {
  const along: Point = [Math.cos(turn), Math.sin(turn)];
  const across: Point = [-along[1], along[0]];

  solid(
    context,
    [
      [x + along[0] * length, y + along[1] * length],
      [x + across[0] * width, y + across[1] * width],
      [x - along[0] * length * 0.4, y - along[1] * length * 0.4],
      [x - across[0] * width, y - across[1] * width],
    ],
    fill,
    rim,
    alpha,
    width * 0.4,
  );
}

/** A hexagon's corners round a point */
function hexagon([x, y]: Point, radius: number, turn: number): Point[] {
  const points: Point[] = [];

  for (let corner = 0; corner < 6; corner += 1) {
    const angle = turn + (corner / 6) * Math.PI * 2;

    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return points;
}

/** A ghostly flame: a tongue pointing up with a dark edge and a pale core */
function wisp(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  size: number,
  flicker: number,
  alpha: number,
): void {
  const lean = Math.sin(flicker) * 0.25;

  petal(context, [x, y - size * 0.3], size * 1.25, lean, {
    color: PARADE_DEEP,
    alpha: alpha * 0.6,
  });
  petal(context, [x, y - size * 0.3], size * 1.1, lean, { color: PARADE_MAGENTA, alpha });
  petal(context, [x, y - size * 0.1], size * 0.8, lean * 0.6, { color: PARADE_VIOLET, alpha });
  orb(context, [x, y + size * 0.2], size * 0.45, { color: PARADE_PALE, alpha });
}

const hisuiSignatures = {
  // Three long toxic claw rakes torn across it one after another, the
  // marks left glowing purple and poison dripping off them
  Direclaw(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = late(share, 0.55);

    for (let rake = 0; rake < DIRECLAW_RAKES; rake += 1) {
      const run = (share - rake * DIRECLAW_GAP) / DIRECLAW_RAKE;

      if (run <= 0) {
        continue;
      }
      const shift = (rake - (DIRECLAW_RAKES - 1) / 2) * size * 0.8;
      const from: Point = [at[0] - size * 1.8 + shift, at[1] - size * 1.8 + shift * 0.4];
      const to: Point = [at[0] + size * 1.4 + shift, at[1] + size * 1.6 + shift * 0.4];
      const head = between(from, to, Math.min(1, run));

      edge(context, from, head, size * 0.42, size * 0.3, { color: DIRECLAW_DARK, alpha: shown });
      edge(context, from, head, size * 0.3, size * 0.3, { color: DIRECLAW_PURPLE, alpha: shown });
      edge(context, between(from, head, 0.15), head, size * 0.1, size * 0.25, {
        color: lighten(DIRECLAW_DRIP, 0.5),
        alpha: shown,
      });
      // Drips shaken off along the rake and falling away
      for (let drop = 0; drop < 3; drop += 1) {
        const fall = Math.max(0, run - 0.3 - drop * 0.15) * 0.9;

        if (fall <= 0 || fall >= 1) {
          continue;
        }
        const off = between(from, to, 0.3 + drop * 0.25);

        orb(
          context,
          [off[0] + spread(seed, rake * 3 + drop) * size * fall, off[1] + fall ** 2 * size * 2.4],
          size * 0.22,
          { color: DIRECLAW_DRIP, alpha: decay(fall) },
        );
      }
    }
    orb(context, at, size * 1.4, { color: DIRECLAW_PURPLE, alpha: swell(share) * 0.35 });
    motes(context, at, size * 2.2, many(10, weight), seed, share, {
      color: DIRECLAW_DRIP,
      alpha: shown * 0.8,
      width: 2.4 * stage.scale,
    });
  },

  // A glowing hexagonal shield carried in front of a pair of antlers,
  // rammed into it, then flaring and cracking into hexagons
  Psyshield(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const run = Math.min(1, share / PSYSHIELD_LANDS) ** 1.6;
    const centre = between(between(stage.source, at, 0.45), at, run);
    const shown = late(share, 0.5);
    const radius = size * 1.5;

    // The antlers just behind the shield's top edge, toward the caster
    for (const side of [-1, 1]) {
      const root: Point = [centre[0] + side * size * 0.5, centre[1] - size * 0.6];
      const tip: Point = [root[0] + side * size * 1.6, root[1] - size * 1.8];

      strokeThrough(
        context,
        [root, between(root, tip, 0.5), tip],
        3 * stage.scale,
        ANTLER_BROWN,
        shown,
      );
      strokeThrough(
        context,
        [between(root, tip, 0.5), [root[0] + side * size * 0.3, root[1] - size * 1.9]],
        2.4 * stage.scale,
        ANTLER_BROWN,
        shown,
      );
      orb(context, tip, size * 0.3, { color: SHIELD_DEEP, alpha: shown });
    }
    orb(context, centre, radius * 1.4, { color: SHIELD_VIOLET, alpha: shown * 0.35 });
    solid(
      context,
      hexagon(centre, radius, Math.PI / 6),
      SHIELD_VIOLET,
      SHIELD_DEEP,
      shown * 0.75,
      size * 0.2,
    );
    const inner = hexagon(centre, radius * 0.6, Math.PI / 6);

    strokeThrough(context, [...inner, inner[0]], 1.6 * stage.scale, '#ffffff', shown * 0.8);
    star(context, [centre[0] - radius * 0.4, centre[1] - radius * 0.4], size * 0.45, share * 4, {
      color: '#ffffff',
      alpha: shown,
    });
    if (share < PSYSHIELD_LANDS) {
      return;
    }
    const hit = (share - PSYSHIELD_LANDS) / (1 - PSYSHIELD_LANDS);

    orb(context, at, size * (1 + hit * 1.8), { color: SHIELD_VIOLET, alpha: decay(hit) * 0.8 });
    ring(context, at, size * (1.4 + hit * 2.6), {
      color: SHIELD_DEEP,
      alpha: decay(hit),
      width: 3 * stage.scale,
    });
    // The shield's light breaking into little hexagons thrown out
    for (let piece = 0; piece < many(8, weight); piece += 1) {
      const angle = noise(seed, piece) * Math.PI * 2;
      const out = size * (1 + hit * 2.4);

      solid(
        context,
        hexagon(
          [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8],
          size * 0.35,
          hit * 3,
        ),
        SHIELD_VIOLET,
        SHIELD_DEEP,
        decay(hit),
        size * 0.1,
      );
    }
    burst(context, at, size * (1.4 + hit * 1.6), 10, seed + 1, {
      color: '#ffffff',
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A stone axe swung down onto it, a crack of rock where it bites, and
  // sharp splinters left floating round it like Stealth Rock
  Stoneaxe(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const pivot: Point = [at[0] + size * 2.2, at[1] + size * 0.4];
    const length = size * 2.6;
    const start = -Math.PI * 0.45;
    const end = -Math.PI;
    const swing = Math.min(1, share / STONEAXE_LANDS) ** 1.8;
    const angle = start + (end - start) * swing;

    if (share < STONEAXE_LANDS + 0.12) {
      const shown = late(share, STONEAXE_LANDS);
      const tip: Point = [pivot[0] + Math.cos(angle) * length, pivot[1] + Math.sin(angle) * length];
      const along: Point = [Math.cos(angle), Math.sin(angle)];
      const ahead: Point = [Math.sin(angle), -Math.cos(angle)];
      const corner = (forward: number, out: number): Point => [
        tip[0] + ahead[0] * forward * size + along[0] * out * size,
        tip[1] + ahead[1] * forward * size + along[1] * out * size,
      ];

      // The blur of the swing behind the head
      sickle(context, pivot, length, start, angle, size * 0.9, {
        color: AXE_STONE,
        alpha: shown * 0.3,
      });
      edge(context, pivot, tip, size * 0.2, 0, { color: AXE_HAFT, alpha: shown });
      solid(
        context,
        [
          corner(-0.35, -0.35),
          corner(-0.35, 0.35),
          corner(1, 0.8),
          corner(1.15, 0),
          corner(1, -0.8),
        ],
        AXE_STONE,
        AXE_DARK,
        shown,
        size * 0.18,
      );
      strokeThrough(
        context,
        [corner(1, 0.8), corner(1.15, 0), corner(1, -0.8)],
        2 * stage.scale,
        AXE_EDGE,
        shown,
      );
    }
    if (share < STONEAXE_LANDS) {
      return;
    }
    const hit = (share - STONEAXE_LANDS) / (1 - STONEAXE_LANDS);
    const held = late(hit, 0.75);

    orb(context, at, size * (1 + hit), { color: AXE_EDGE, alpha: decay(hit * 2) * 0.8 });
    shards(context, at, size * 2.6, many(10, weight), seed, hit, {
      color: AXE_STONE,
      alpha: decay(hit),
      width: 3.4 * stage.scale,
    });
    // The splinters rise out of the bite and settle into a slow orbit round it
    for (let one = 0; one < STONEAXE_SPLINTERS; one += 1) {
      const round = (one / STONEAXE_SPLINTERS) * Math.PI * 2 + hit * 1.6;
      const out = Math.min(1, hit * 3);
      const spot: Point = [
        at[0] + Math.cos(round) * size * 2 * out,
        at[1] + Math.sin(round) * size * 0.9 * out + Math.sin(hit * 8 + one) * size * 0.15,
      ];

      spike(
        context,
        spot,
        size * 0.55,
        size * 0.22,
        -Math.PI / 2 + spread(seed, one) * 0.6,
        AXE_STONE,
        AXE_DARK,
        held,
      );
    }
  },

  // A glacier shelf hanging above it, great chunks of ice breaking off
  // one after another and crashing down onto it in a spray of frost
  Mountaingale(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const top = at[1] - size * 4.6;
    const shelf = late(share, 0.55);
    const shelfPoints: Point[] = [];

    for (let step = 0; step <= 8; step += 1) {
      shelfPoints.push([
        at[0] - size * 3 + step * size * 0.75,
        top - size * (0.5 + noise(seed, step) * 0.4),
      ]);
    }
    for (let step = 8; step >= 0; step -= 1) {
      shelfPoints.push([
        at[0] - size * 3 + step * size * 0.75,
        top + size * (0.2 + noise(seed, step + 20) * 0.5),
      ]);
    }
    solid(context, shelfPoints, GALE_ICE, GALE_DARK, shelf, size * 0.15);
    for (let icicle = 0; icicle < 5; icicle += 1) {
      spike(
        context,
        [at[0] - size * 2.4 + icicle * size * 1.2, top + size * 0.5],
        size * 0.6,
        size * 0.16,
        Math.PI / 2,
        GALE_PALE,
        GALE_DEEP,
        shelf,
      );
    }
    for (let one = 0; one < GALE_CHUNKS; one += 1) {
      const fall = (share - one * GALE_GAP) / GALE_DROP;

      if (fall < 0) {
        continue;
      }
      const lands: Point = [at[0] + spread(seed, one + 30) * size * 1, at[1] - size * 0.2];
      const turn = noise(seed, one + 40) * Math.PI;

      if (fall < 1) {
        const from: Point = [lands[0] + spread(seed, one + 50) * size * 0.6, top + size * 0.4];

        chunk(
          context,
          between(from, lands, fall ** 1.7),
          size * (1 - one * 0.1),
          turn + fall,
          seed + one,
          GALE_ICE,
          GALE_DARK,
          1,
        );
        continue;
      }
      const crash = Math.min(1, (fall - 1) * GALE_DROP * 3.5);

      if (crash >= 1) {
        continue;
      }
      // The chunk splitting into pieces on impact, a burst of frost
      for (let piece = 0; piece < 3; piece += 1) {
        const side = piece - 1;

        chunk(
          context,
          [
            lands[0] + side * size * crash * 1.2,
            lands[1] + size * 0.3 - swell(crash) * size * 0.5 + crash * size * 0.4,
          ],
          size * 0.45,
          turn + side * crash * 2,
          seed + one * 3 + piece,
          GALE_ICE,
          GALE_DARK,
          decay(crash),
        );
      }
      burst(context, lands, size * (1 + crash * 1.6), 9, seed + one, {
        color: GALE_PALE,
        alpha: decay(crash),
        width: 2.6 * stage.scale,
      });
    }
    const after = Math.max(0, (share - GALE_DROP) / (1 - GALE_DROP));

    if (after <= 0) {
      return;
    }
    orb(context, at, size * (1.2 + after * 1.4), { color: GALE_PALE, alpha: swell(after) * 0.6 });
    ripple(context, [at[0], at[1] + size * 0.8], size * (1 + after * 2.6), {
      color: GALE_DEEP,
      alpha: decay(after),
      width: 3 * stage.scale,
    });
    shards(context, at, size * 2.6, many(12, weight), seed + 9, after, {
      color: GALE_ICE,
      alpha: decay(after),
      width: 3 * stage.scale,
    });
  },

  // A whirling ballet spin: a red ribbon spiralling up round the caster,
  // petals wheeling with it, then a flourish of golden light on top
  Victorydance(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const head = Math.min(1, share / VICTORY_FLOURISH);
    const tail = Math.max(0, head - 0.45);
    const shown = late(share, 0.75);
    const helix = (along: number): Point => {
      const angle = along * Math.PI * 4 + share * Math.PI * 2;

      return [
        at[0] + Math.cos(angle) * size * 1.5,
        at[1] + size * 0.9 - along * size * 2.6 + Math.sin(angle) * size * 0.4,
      ];
    };
    const ribbon: Point[] = [];

    for (let step = 0; step <= 20; step += 1) {
      ribbon.push(helix(tail + ((head - tail) * step) / 20));
    }
    ripple(context, [at[0], at[1] + size * 0.9], size * 1.6, {
      color: LILLIGANT_GREEN,
      alpha: shown * 0.7,
      width: 2.4 * stage.scale,
    });
    strokeThrough(context, ribbon, 3.4 * stage.scale, VICTORY_RIBBON, shown, '#5a1420');
    strokeThrough(context, ribbon, 1.2 * stage.scale, lighten(VICTORY_RIBBON, 0.6), shown);
    for (let one = 0; one < 8; one += 1) {
      const angle = (one / 8) * Math.PI * 2 + share * Math.PI * 5;
      const rise = (share * 0.8 + noise(seed, one)) % 1;

      petal(
        context,
        [
          at[0] + Math.cos(angle) * size * 2,
          at[1] + size * 0.6 - rise * size * 2.4 + Math.sin(angle) * size * 0.5,
        ],
        size * 0.32,
        angle,
        {
          color: one % 2 === 0 ? VICTORY_PETAL : LILLIGANT_GREEN,
          alpha: Math.min(1, share * 10) * shown,
        },
      );
    }
    if (share < VICTORY_FLOURISH) {
      return;
    }
    const bloom = (share - VICTORY_FLOURISH) / (1 - VICTORY_FLOURISH);
    const crown: Point = [at[0], at[1] - size * 1.8];

    orb(context, crown, size * (0.8 + bloom), { color: VICTORY_GOLD, alpha: decay(bloom) * 0.8 });
    star(context, crown, size * (0.6 + swell(Math.min(1, bloom * 2)) * 0.5), bloom * 2, {
      color: '#ffffff',
      alpha: decay(bloom),
    });
    ring(context, crown, size * (0.6 + bloom * 1.8), {
      color: VICTORY_GOLD,
      alpha: decay(bloom),
      width: 2.4 * stage.scale,
    });
    motes(context, crown, size * 2, many(10, weight), seed + 3, bloom, {
      color: VICTORY_PETAL,
      alpha: decay(bloom),
      width: 2.6 * stage.scale,
    });
  },

  // A fan of dark poison barbs shot out of the caster, sticking into it
  // all over and oozing purple
  Barbs(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = late(share, 0.75);

    for (let one = 0; one < BARB_COUNT; one += 1) {
      const leave = (one / BARB_COUNT) * (BARB_LANDS - 0.22);
      const flight = (share - leave) / 0.22;

      if (flight < 0) {
        continue;
      }
      const fan = one / (BARB_COUNT - 1) - 0.5;
      const lands: Point = [at[0] + fan * size * 2.2, at[1] + spread(seed, one) * size * 0.8];
      const bend: Point = [
        between(stage.source, lands, 0.5)[0] + fan * size * 4,
        between(stage.source, lands, 0.5)[1],
      ];
      const place = (t: number): Point =>
        between(between(stage.source, bend, t), between(bend, lands, t), t);

      if (flight < 1) {
        const tip = place(flight);
        const back = place(Math.max(0, flight - 0.08));

        spike(
          context,
          tip,
          size * 0.6,
          size * 0.2,
          Math.atan2(tip[1] - back[1], tip[0] - back[0]),
          BARB_DARK,
          BARB_PURPLE,
          1,
        );
        continue;
      }
      const ooze = Math.min(1, (flight - 1) * 0.22 * 3);
      const back = place(0.92);
      const turn = Math.atan2(lands[1] - back[1], lands[0] - back[0]);

      // Stuck in, the tail out the way it came, ooze running down off it
      spike(
        context,
        [lands[0] - Math.cos(turn) * size * 0.3, lands[1] - Math.sin(turn) * size * 0.3],
        size * 0.6,
        size * 0.2,
        turn,
        BARB_DARK,
        BARB_PURPLE,
        shown,
      );
      orb(context, lands, size * (0.4 + swell(ooze) * 0.3), {
        color: BARB_OOZE,
        alpha: shown * 0.7,
      });
      orb(context, [lands[0], lands[1] + ooze * size * 1.2], size * 0.18, {
        color: BARB_OOZE,
        alpha: decay(ooze) * shown,
      });
    }
    motes(context, at, size * 2, many(8, weight), seed + 5, share, {
      color: BARB_OOZE,
      alpha: swell(share) * 0.8,
      width: 2.4 * stage.scale,
    });
  },

  // Pale wings spread over the caster in a pink psychic aura, then
  // blades of feathered light streaming over and sweeping across it
  Esper(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const open = Math.min(1, share / ESPER_SPREAD);
    const wings = Math.min(1, share * 8) * late(share, 0.5);
    const back: Point = [stage.source[0], stage.source[1] - size * 0.9];

    orb(context, back, size * 2.4, { color: ESPER_PINK, alpha: wings * 0.4 });
    for (const side of [-1, 1]) {
      for (let feather = 0; feather < 5; feather += 1) {
        const angle = -Math.PI / 2 + side * (0.4 + feather * 0.28 * open);
        const tip: Point = [
          back[0] + Math.cos(angle) * size * 2.8,
          back[1] + Math.sin(angle) * size * 2.2,
        ];

        petal(context, between(back, tip, 0.55), size * 1.3, angle + Math.PI / 2, {
          color: ESPER_DEEP,
          alpha: wings * 0.7,
        });
        petal(context, between(back, tip, 0.58), size * 1.1, angle + Math.PI / 2, {
          color: ESPER_FEATHER,
          alpha: wings,
        });
      }
    }
    for (let blade = 0; blade < ESPER_BLADES; blade += 1) {
      const leave = 0.1 + blade * 0.06;
      const flight = (share - leave) / 0.2;

      if (flight < 0) {
        continue;
      }
      const lands: Point = [
        at[0] + spread(seed, blade) * size * 1.2,
        at[1] + spread(seed, blade + 9) * size * 0.8,
      ];

      if (flight < 1) {
        const from: Point = [back[0] + (blade - 2) * size * 0.8, back[1] - size];
        const tip = between(from, lands, flight);
        const tail = between(from, lands, Math.max(0, flight - 0.25));

        edge(context, tail, tip, size * 0.35, 0, { color: ESPER_PINK, alpha: 0.8 });
        edge(context, tail, tip, size * 0.18, 0, { color: ESPER_FEATHER, alpha: 1 });
        continue;
      }
      const sweep = Math.min(1, (flight - 1) * 0.2 * 2.2);

      if (sweep >= 1) {
        continue;
      }
      sickle(
        context,
        lands,
        size * 1.4,
        -Math.PI * 0.9 + blade,
        -Math.PI * 0.9 + blade + Math.PI * 0.8 * Math.min(1, sweep * 3),
        size * 0.4,
        {
          color: ESPER_PINK,
          alpha: decay(sweep),
        },
      );
      sickle(
        context,
        lands,
        size * 1.4,
        -Math.PI * 0.9 + blade,
        -Math.PI * 0.9 + blade + Math.PI * 0.8 * Math.min(1, sweep * 3),
        size * 0.14,
        {
          color: ESPER_FEATHER,
          alpha: decay(sweep),
        },
      );
    }
    const hit = Math.max(0, (share - 0.3) / 0.7);

    orb(context, at, size * (1 + hit * 1.2), { color: ESPER_PINK, alpha: swell(hit) * 0.5 });
    motes(context, at, size * 2.4, many(10, weight), seed + 2, hit, {
      color: ESPER_FEATHER,
      alpha: decay(hit),
      width: 2.4 * stage.scale,
    });
  },

  // A pale grudge mask rising over it with hollow eyes and a jagged
  // grin, frosty spectral wisps clawing in at it from every side
  Malice(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const risen = Math.min(1, share / MALICE_RISEN);
    const shown = Math.min(1, 0.35 + risen) * late(share, 0.7);
    const face: Point = [
      at[0],
      at[1] - size * (0.6 + risen * 0.8) + Math.sin(share * 12) * size * 0.1,
    ];

    orb(context, at, size * 1.8, { color: MALICE_DARK, alpha: shown * 0.35 });
    // The mask, rimmed in violet, its hollows dark and glowing at the back
    context.beginPath();
    context.ellipse(face[0], face[1], size * 1.25, size * 1.55, 0, 0, Math.PI * 2);
    context.fillStyle = fade(MALICE_WHITE, shown * 0.9);
    context.fill();
    context.strokeStyle = fade(MALICE_VIOLET, shown);
    context.lineWidth = Math.max(1, size * 0.18);
    context.stroke();
    for (const side of [-1, 1]) {
      const eye: Point = [face[0] + side * size * 0.5, face[1] - size * 0.35];

      context.beginPath();
      context.ellipse(eye[0], eye[1], size * 0.34, size * 0.2, side * 0.45, 0, Math.PI * 2);
      context.fillStyle = fade(MALICE_DARK, shown);
      context.fill();
      orb(context, eye, size * 0.14, { color: MALICE_VIOLET, alpha: shown });
    }
    const grin: Point[] = [];

    for (let tooth = 0; tooth <= 6; tooth += 1) {
      grin.push([
        face[0] - size * 0.7 + tooth * size * 0.233,
        face[1] + size * (0.55 + (tooth % 2) * 0.25),
      ]);
    }
    strokeThrough(context, grin, 2.4 * stage.scale, MALICE_DARK, shown);
    for (let one = 0; one < MALICE_WISPS; one += 1) {
      const run = (share * 1.8 + one / MALICE_WISPS) % 1;
      const angle = (one / MALICE_WISPS) * Math.PI * 2 + noise(seed, one);
      const out = size * (3.2 - run * 2.4);
      const from: Point = [at[0] + Math.cos(angle) * out, at[1] + Math.sin(angle) * out * 0.8];
      const to: Point = [at[0] + Math.cos(angle) * out * 0.5, at[1] + Math.sin(angle) * out * 0.4];
      const fading = swell(run) * late(share, 0.8);

      edge(context, from, to, size * 0.2, size * 0.5, {
        color: MALICE_VIOLET,
        alpha: fading * 0.6,
      });
      edge(context, from, to, size * 0.1, size * 0.5, { color: MALICE_FROST, alpha: fading });
    }
    const claws = Math.max(0, (share - 0.35) / 0.4);

    if (claws > 0 && claws < 1) {
      for (let mark = 0; mark < 3; mark += 1) {
        slash(context, [at[0] + (mark - 1) * size * 0.45, at[1]], size * 1.2, 1.2, {
          color: MALICE_FROST,
          alpha: decay(claws),
          width: 2.6 * stage.scale,
        });
      }
    }
    motes(context, at, size * 2.4, many(10, weight), seed + 4, share, {
      color: MALICE_FROST,
      alpha: shown * 0.8,
      width: 2 * stage.scale,
    });
  },

  // Steel plates curling up from both sides over the caster and closing
  // into a shell, slime running down its sheen, a clang glint on top
  Shelter(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const close = Math.min(1, share / SHELTER_CLOSED) ** 0.8;
    const shown = late(share, 0.8);
    const base: Point = [at[0], at[1] + size * 0.6];

    for (let band = 0; band < 3; band += 1) {
      const radius = size * (1.7 - band * 0.35);
      const reach = (Math.PI / 2) * Math.min(1, close * (1 + band * 0.15));

      for (const [from, to] of [
        [Math.PI, Math.PI + reach],
        [0, -reach],
      ]) {
        sickle(context, base, radius, from, to, size * 0.55, { color: SHELL_DARK, alpha: shown });
        sickle(context, base, radius, from, to, size * 0.42, { color: SHELL_STEEL, alpha: shown });
      }
    }
    // The slime sheen: a pale highlight running over, drops sliding down
    const sheen = (share * 1.5) % 1;

    sickle(
      context,
      base,
      size * 1.5,
      Math.PI + sheen * Math.PI,
      Math.PI + sheen * Math.PI + 0.4,
      size * 0.16,
      {
        color: lighten(SHELL_SLIME, 0.5),
        alpha: shown * close,
      },
    );
    for (let drop = 0; drop < 4; drop += 1) {
      const slide = (share * 1.2 + noise(seed, drop)) % 1;
      const along = -Math.PI / 2 + (drop % 2 === 0 ? -1 : 1) * slide * (Math.PI / 2) * 0.9;

      orb(
        context,
        [base[0] + Math.cos(along) * size * 1.75, base[1] + Math.sin(along) * size * 1.75],
        size * 0.18,
        { color: SHELL_SLIME, alpha: swell(slide) * shown * close },
      );
    }
    if (share < SHELTER_CLOSED) {
      return;
    }
    const clang = (share - SHELTER_CLOSED) / (1 - SHELTER_CLOSED);
    const top: Point = [base[0], base[1] - size * 1.7];

    star(context, top, size * (0.5 + swell(Math.min(1, clang * 2.5)) * 0.6), clang, {
      color: '#ffffff',
      alpha: decay(clang * 1.4),
    });
    ring(context, top, size * (0.4 + clang * 1.6), {
      color: SHELL_STEEL,
      alpha: decay(clang),
      width: 2.4 * stage.scale,
    });
    burst(context, top, size * 1.2, 8, seed, {
      color: '#ffffff',
      alpha: decay(clang * 2),
      width: 2 * stage.scale,
    });
  },

  // Three leaf-fletched arrows loosed one after another, each thudding
  // in with a kick of force, left stuck in it
  Triplearrows(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const shown = late(share, 0.75);

    for (let one = 0; one < ARROW_COUNT; one += 1) {
      const flight = (share - one * ARROW_GAP) / ARROW_FLIGHT;

      if (flight < 0) {
        continue;
      }
      const lands: Point = [at[0] + (one - 1) * size * 0.6, at[1] + spread(seed, one) * size * 0.5];
      const from: Point = [stage.source[0] + (one - 1) * size * 0.4, stage.source[1] - size];
      const rise = size * 1.2;
      const place = (t: number): Point => {
        const spot = between(from, lands, t);

        return [spot[0], spot[1] - Math.sin(Math.PI * t) * rise];
      };
      const tip = place(Math.min(1, flight));
      const back = place(Math.max(0, Math.min(1, flight) - 0.06));
      const turn = Math.atan2(tip[1] - back[1], tip[0] - back[0]);
      const tail: Point = [tip[0] - Math.cos(turn) * size * 2, tip[1] - Math.sin(turn) * size * 2];
      const alpha = flight < 1 ? 1 : shown;
      const sunk = flight < 1 ? 0 : size * 0.4;
      const point: Point = [tip[0] + Math.cos(turn) * sunk, tip[1] + Math.sin(turn) * sunk];

      if (flight < 1) {
        edge(context, place(Math.max(0, flight - 0.3)), tail, size * 0.12, 0, {
          color: '#ffffff',
          alpha: 0.5,
        });
      }
      strokeThrough(
        context,
        [point, [tail[0] + Math.cos(turn) * sunk, tail[1] + Math.sin(turn) * sunk]],
        2.4 * stage.scale,
        ARROW_SHAFT,
        alpha,
        ARROW_HEAD,
      );
      if (flight < 1) {
        spike(context, point, size * 0.45, size * 0.22, turn, ARROW_HEAD, '#000000', alpha);
      }
      for (const side of [-1, 1]) {
        petal(
          context,
          [
            tail[0] + Math.cos(turn) * sunk - Math.sin(turn) * side * size * 0.2,
            tail[1] + Math.sin(turn) * sunk + Math.cos(turn) * side * size * 0.2,
          ],
          size * 0.38,
          turn + Math.PI / 2 + side * 0.5,
          { color: ARROW_LEAF, alpha },
        );
      }
      if (flight < 1) {
        continue;
      }
      // The thud: a kick of force out of the spot it struck
      const thud = Math.min(1, (flight - 1) * ARROW_FLIGHT * 3.5);

      if (thud >= 1) {
        continue;
      }
      orb(context, lands, size * (0.8 + thud * 1.2), {
        color: ARROW_KICK,
        alpha: decay(thud) * 0.7,
      });
      ring(context, lands, size * (0.6 + thud * 2), {
        color: '#ffffff',
        alpha: decay(thud),
        width: 3 * stage.scale,
      });
      burst(context, lands, size * (1 + thud * 1.4), 8, seed + one, {
        color: ARROW_KICK,
        alpha: decay(thud),
        width: 2.8 * stage.scale,
      });
      motes(context, lands, size * 1.6, 5, seed + one + 10, thud, {
        color: ARROW_LEAF,
        alpha: decay(thud),
        width: 2.4 * stage.scale,
      });
    }
  },

  // Ghostly purple flames marching round it in a ring, hopping as they
  // go, then breaking ranks and swarming in to burst over it
  Parade(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.6];
    const shown = Math.min(1, share * 8);

    ripple(context, foot, size * 2.6, {
      color: PARADE_VIOLET,
      alpha: shown * late(share, PARADE_SWARM) * 0.5,
      width: 2 * stage.scale,
    });
    for (let one = 0; one < PARADE_FLAMES; one += 1) {
      const angle = (one / PARADE_FLAMES) * Math.PI * 2 + share * Math.PI * 1.6;
      const hop = Math.abs(Math.sin(share * 24 + one)) * size * 0.4;
      const round: Point = [
        foot[0] + Math.cos(angle) * size * 2.6,
        foot[1] + Math.sin(angle) * size * 0.8 - size * 0.4 - hop,
      ];
      const leave = PARADE_SWARM + (one / PARADE_FLAMES) * 0.15;
      const swarm = Math.max(0, Math.min(1, (share - leave) / 0.15));

      if (swarm >= 1) {
        continue;
      }
      const spot = between(round, at, swarm ** 1.5);

      orb(context, [round[0], round[1] + hop + size * 0.45], size * 0.35, {
        color: PARADE_DEEP,
        alpha: shown * decay(swarm) * 0.35,
      });
      wisp(context, spot, size * 0.55, share * 20 + one, shown);
    }
    const burstAt = PARADE_SWARM + 0.1;

    if (share < burstAt) {
      return;
    }
    const blaze = (share - burstAt) / (1 - burstAt);

    orb(context, at, size * (1 + blaze * 1.6), {
      color: PARADE_VIOLET,
      alpha: swell(Math.min(1, blaze * 1.5)) * 0.8,
    });
    for (let tongue = 0; tongue < 5; tongue += 1) {
      wisp(
        context,
        [
          at[0] + (tongue - 2) * size * 0.6,
          at[1] - swell(blaze) * size * (0.6 + noise(seed, tongue) * 0.8),
        ],
        size * 0.6,
        share * 20 + tongue,
        decay(blaze),
      );
    }
    motes(context, at, size * 2.6, many(12, weight), seed, blaze, {
      color: PARADE_MAGENTA,
      alpha: decay(blaze),
      width: 2.6 * stage.scale,
    });
  },

  // A dark seamitar arc slashed across it with a teal sheen on the edge,
  // and the blade's shell splinters scattered round it, stuck in the ground
  Ceaseless(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const foot: Point = [at[0], at[1] + size * 0.8];
    const centre: Point = [at[0] + size * 0.6, at[1] + size * 1.2];
    const radius = size * 2.4;
    const start = -Math.PI * 0.15;
    const cut = Math.min(1, share / CEASELESS_CUTS) ** 1.3;
    const end = start - cut * Math.PI * 0.9;
    const arc = late(share, 0.45);

    sickle(context, centre, radius, start, end, size * 1.1, {
      color: CEASELESS_DARK,
      alpha: arc * 0.85,
    });
    sickle(context, centre, radius * 1.04, start, end, size * 0.35, {
      color: CEASELESS_TEAL,
      alpha: arc,
    });
    sickle(context, centre, radius * 1.06, start, end, size * 0.1, {
      color: '#ffffff',
      alpha: arc,
    });
    if (share < CEASELESS_CUTS) {
      return;
    }
    const after = (share - CEASELESS_CUTS) / (1 - CEASELESS_CUTS);
    const stuck = late(after, 0.8);

    orb(context, at, size * (1 + after * 1.2), {
      color: CEASELESS_TEAL,
      alpha: decay(after * 2) * 0.6,
    });
    for (let one = 0; one < CEASELESS_SPLINTERS; one += 1) {
      const angle = (one / CEASELESS_SPLINTERS) * Math.PI * 2 + noise(seed, one) * 0.6;
      const rest: Point = [
        foot[0] + Math.cos(angle) * size * 2.2,
        foot[1] + Math.sin(angle) * size * 0.7,
      ];
      const fly = Math.min(1, after / 0.35);
      const spot = between(at, rest, fly);
      const lift = Math.sin(Math.PI * fly) * size * 1.4;
      const turn = fly < 1 ? fly * 8 + one : -Math.PI / 2 + spread(seed, one + 10) * 0.4;

      if (fly >= 1) {
        ripple(context, rest, size * 0.4, {
          color: CEASELESS_DARK,
          alpha: stuck * 0.5,
          width: 2 * stage.scale,
        });
      }
      spike(
        context,
        [spot[0], spot[1] - lift],
        size * 0.6,
        size * 0.2,
        turn,
        CEASELESS_SHELL,
        CEASELESS_DARK,
        stuck,
      );
    }
    shards(context, at, size * 2, many(8, weight), seed + 3, after, {
      color: CEASELESS_SHELL,
      alpha: decay(after * 1.5),
      width: 2.6 * stage.scale,
    });
  },

  // A silver crescent moon rising over the caster's side, soft light
  // pouring down from it and moonbeam sparkles drifting up
  Blessing(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const risen = Math.min(1, share / BLESSING_RISEN);
    const shown = Math.min(1, share * 8) * late(share, 0.75);
    const moon: Point = [at[0], at[1] - size * (2.4 + risen * 0.8)];
    const pour = Math.max(0, (share - BLESSING_RISEN * 0.6) / (1 - BLESSING_RISEN * 0.6));

    orb(context, moon, size * 1.6, { color: BLESSING_SILVER, alpha: shown * 0.5 });
    sickle(context, moon, size * 0.9, Math.PI * 0.35, Math.PI * 1.65, size * 0.75, {
      color: BLESSING_SHADE,
      alpha: shown * 0.6,
    });
    sickle(context, moon, size * 0.9, Math.PI * 0.35, Math.PI * 1.65, size * 0.6, {
      color: BLESSING_SILVER,
      alpha: shown,
    });
    sickle(context, moon, size * 0.95, Math.PI * 0.5, Math.PI * 1.5, size * 0.18, {
      color: BLESSING_PINK,
      alpha: shown,
    });
    if (pour <= 0) {
      return;
    }
    const falling = swell(Math.min(1, pour * 1.2)) * shown;

    for (let ray = 0; ray < 5; ray += 1) {
      const out = (ray - 2) / 2;

      edge(
        context,
        [moon[0] + out * size * 0.4, moon[1]],
        [at[0] + out * size * 2, at[1] + size * 0.8],
        size * 0.35,
        0,
        {
          color: ray % 2 === 0 ? BLESSING_SILVER : BLESSING_GOLD,
          alpha: falling * 0.55,
        },
      );
    }
    orb(context, at, size * 1.6, { color: BLESSING_GOLD, alpha: falling * 0.5 });
    ripple(context, [at[0], at[1] + size * 0.8], size * (1.2 + pour * 1.2), {
      color: BLESSING_PINK,
      alpha: decay(pour) * shown,
      width: 2.4 * stage.scale,
    });
    for (let one = 0; one < many(8, weight); one += 1) {
      const rise = (pour * 1.4 + noise(seed, one)) % 1;

      star(
        context,
        [at[0] + spread(seed, one + 10) * size * 2, at[1] + size * 0.8 - rise * size * 2.6],
        size * 0.28,
        rise * 3,
        {
          color: one % 2 === 0 ? '#ffffff' : BLESSING_PINK,
          alpha: swell(rise) * shown,
        },
      );
    }
  },

  // A blue heart lit in the caster's chest, swelling with each beat,
  // waves of courage rippling out and cleansing sparkles drifting off
  Takeheart(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight * SIGNATURE_SCALE;
    const shown = Math.min(1, share * 10) * late(share, 0.8);
    const beat = (share / TAKEHEART_BEAT) % 1;
    const swelling = 0.5 + Math.min(1, share * 2) * 0.35 + swell(beat) * 0.15;

    orb(context, at, size * 1.8 * swelling, { color: TAKEHEART_BLUE, alpha: shown * 0.5 });
    heart(context, [at[0], at[1] + size * 0.05], size * 0.62 * swelling, {
      color: TAKEHEART_DARK,
      alpha: shown,
    });
    heart(context, at, size * 0.52 * swelling, { color: TAKEHEART_BLUE, alpha: shown });
    heart(context, [at[0] - size * 0.08, at[1] - size * 0.08], size * 0.22 * swelling, {
      color: TAKEHEART_PALE,
      alpha: shown,
    });
    for (let wave = 0; wave < 4; wave += 1) {
      const out = share / TAKEHEART_BEAT - wave;

      if (out < 0 || out > 1.6) {
        continue;
      }
      ring(context, at, size * (0.6 + out * 1.6), {
        color: TAKEHEART_PALE,
        alpha: decay(out / 1.6) * shown,
        width: 2.6 * stage.scale,
      });
      ripple(context, [at[0], at[1] + size * 0.8], size * (0.8 + out * 1.8), {
        color: TAKEHEART_BLUE,
        alpha: decay(out / 1.6) * shown * 0.8,
        width: 2.4 * stage.scale,
      });
    }
    for (let one = 0; one < many(8, weight); one += 1) {
      const rise = (share * 1.3 + noise(seed, one)) % 1;

      star(
        context,
        [at[0] + spread(seed, one + 20) * size * 1.8, at[1] - rise * size * 2.4],
        size * 0.24,
        rise * 4,
        {
          color: '#ffffff',
          alpha: swell(rise) * shown,
        },
      );
    }
  },

  // The caster's body filling with green chlorophyll light, then a huge
  // green blast cannoned across, and sparks of recoil spitting back at it
  Chloroblast(context, stage, share, { seed, weight }) {
    const at = landing(stage);
    const size = REACH * stage.scale * weight;
    const source = stage.source;

    if (share < CHLORO_FIRES + 0.1) {
      const charge = Math.min(1, share / CHLORO_FIRES);
      const held = late(share, CHLORO_FIRES);

      orb(context, source, size * (0.8 + charge * 1.4), {
        color: CHLORO_GREEN,
        alpha: held * (0.4 + charge * 0.5),
      });
      // Light drawn in from round it
      for (let mote = 0; mote < 10; mote += 1) {
        const pull = (charge * 1.8 + noise(seed, mote)) % 1;
        const angle = noise(seed, mote + 20) * Math.PI * 2;
        const out = size * (3 - pull * 2.4);
        const spot: Point = [source[0] + Math.cos(angle) * out, source[1] + Math.sin(angle) * out];

        edge(context, spot, between(spot, source, 0.25), size * 0.12, 0, {
          color: CHLORO_PALE,
          alpha: held * swell(pull),
        });
      }
      ring(context, source, size * (2.4 - charge * 1.4), {
        color: CHLORO_DEEP,
        alpha: held * 0.6,
        width: 2.4 * stage.scale,
      });
    }
    if (share < CHLORO_FIRES) {
      return;
    }
    const fire = (share - CHLORO_FIRES) / (1 - CHLORO_FIRES);
    const reach = Math.min(1, fire / 0.15);
    const blast = late(fire, 0.5);
    const head = between(source, at, reach);

    edge(context, source, head, size * 1.3, 0, { color: CHLORO_DEEP, alpha: blast * 0.55 });
    beam(context, source, at, reach, size * 1.8, { color: CHLORO_GREEN, alpha: blast });
    if (reach >= 1) {
      const hit = (fire - 0.15) / 0.85;

      orb(context, at, size * (1.4 + hit * 1.6), { color: CHLORO_GREEN, alpha: decay(hit) * 0.8 });
      ring(context, at, size * (1.2 + hit * 2.6), {
        color: CHLORO_PALE,
        alpha: decay(hit),
        width: 3 * stage.scale,
      });
      burst(context, at, size * (1.6 + hit * 1.6), 12, seed, {
        color: CHLORO_PALE,
        alpha: decay(hit),
        width: 2.6 * stage.scale,
      });
    }
    // The recoil: sparks spitting back off the caster
    burst(context, source, size * (1 + fire * 1.4), 8, seed + 1 + Math.floor(fire * 8), {
      color: CHLORO_SPARK,
      alpha: decay(fire),
      width: 2.4 * stage.scale,
    });
    motes(context, source, size * 1.8, many(8, weight), seed + 2, fire, {
      color: CHLORO_SPARK,
      alpha: decay(fire),
      width: 2.4 * stage.scale,
    });
  },
} satisfies Partial<Record<EffectShape, ShapePainter>>;

export default hisuiSignatures;
