import { BIOME_COLORS } from '../data/biome';
import type Biome from '../data/ids/biome';
import { ORTHOGONAL } from '../overworld/grid';
import { readGround } from '../overworld/ground';
import { isRouteAt } from '../overworld/route';
import { TERRACE_TOP, levelAt } from '../overworld/terrace';
import { isRoadAt, isTownAt } from '../overworld/town';
import type World from '../overworld/world';

/**
 * What one cell of the world is painted as on a map: its country's
 * colour with the water darkened, a town pale and a route rust, lit by
 * how high it stands, and the step up to higher ground drawn dark.
 * The world demo and the in-game world map both paint with it.
 */

export type Shade = [red: number, green: number, blue: number];

/** How dark the water is drawn against the country it sits in */
const WATER_SHADE = 0.45;

/** What rock is drawn as, whatever country it comes through */
export const ROCK: Shade = [64, 60, 58];

/** A town's ground, so the settled country stands out */
export const TOWN: Shade = [214, 196, 164];

/** A town's streets, darker than the ground they run over */
export const ROAD: Shade = [150, 122, 88];

/** The roads between towns */
export const ROUTE: Shade = [178, 96, 60];

/** The step up to higher ground, which is where a cliff stands */
export const FACE: Shade = [24, 20, 18];

/** How much darker the lowest level is drawn than the highest */
const LEVEL_SHADE = 0.55;

const PALETTE = new Map<Biome, Shade>();

/** A country's colour as its three channels, read once */
function colourOf(biome: Biome): Shade {
  const known = PALETTE.get(biome);

  if (known != null) {
    return known;
  }
  const hex = BIOME_COLORS[biome].replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((one) => one + one)
          .join('')
      : hex;
  const shade: Shade = [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];

  PALETTE.set(biome, shade);
  return shade;
}

export interface ShadeOptions {
  /** Whether the routes between towns are drawn */
  roads?: boolean;
  /** Whether the ground is lit by its level, with the steps drawn dark */
  levels?: boolean;
  /**
   * How many cells away higher ground is looked for. A map reading every
   * other cell looks two away, so it never steps over a cliff
   */
  reach?: number;
}

export default function shadeCell(
  world: World,
  x: number,
  y: number,
  { roads = true, levels = true, reach = 1 }: ShadeOptions = {},
): Shade {
  const { biome, role } = readGround(world, x, y);
  let shade = ROCK;

  if (isTownAt(world, x, y) && role === 'ground') {
    shade = isRoadAt(world, x, y) ? ROAD : TOWN;
  } else if (roads && isRouteAt(world, x, y)) {
    // Drawn over whatever it crosses, as a bridge or a cutting would be
    shade = ROUTE;
  } else if (role !== 'wall') {
    const [red, green, blue] = colourOf(biome);

    shade =
      role === 'water'
        ? [
            Math.round(red * WATER_SHADE),
            Math.round(green * WATER_SHADE),
            Math.round(blue * WATER_SHADE),
          ]
        : [red, green, blue];
  }
  if (!levels) {
    return shade;
  }
  const level = levelAt(world, x, y);

  if (ORTHOGONAL.some(([dx, dy]) => levelAt(world, x + dx * reach, y + dy * reach) > level)) {
    return FACE;
  }
  const lit = 1 - LEVEL_SHADE + (level / TERRACE_TOP) * LEVEL_SHADE;

  return [
    Math.min(0xff, Math.round(shade[0] * lit)),
    Math.min(0xff, Math.round(shade[1] * lit)),
    Math.min(0xff, Math.round(shade[2] * lit)),
  ];
}
