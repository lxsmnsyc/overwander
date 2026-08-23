import 'server-only';
import type { Raster } from './raster';

/**
 * Reading a dungeon tileset rip.
 *
 * These sheets are laid out for a person, not a program: a note box, a
 * title, a table of tiles, and a column of palettes down the right.
 * Nothing here knows any of their pixel positions. The table is found
 * as the largest block of ink, its grid is found by looking for the
 * lines, and the tile size is whatever pitch those lines repeat at, so
 * a rip of a different dungeon at a different size reads the same way.
 *
 * The one thing that is not derived is which column means which
 * terrain. That is written in the header row as English, and the
 * caller declares it instead.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One pixel as a single number, so colours compare with `===`. */
export function packed(raster: Raster, x: number, y: number): number {
  const at = (y * raster.width + x) * 4;
  const data = raster.data;

  return ((data[at] << 24) | (data[at + 1] << 16) | (data[at + 2] << 8) | data[at + 3]) >>> 0;
}

/** The stand-in for nothing: an unused slot, and a see-through pixel. */
export const MAGENTA = 0xff00ffff;

/**
 * `#rrggbb`, or `null` where the slot holds nothing. Magenta counts as
 * nothing: it is what these sheets key out, so two magenta slots are
 * two empty ones rather than two of the same colour
 */
export function hexOf(colour: number): string | null {
  if ((colour & 255) === 0 || colour === MAGENTA) {
    return null;
  }
  return `#${((colour >>> 8) & 0xffffff).toString(16).padStart(6, '0')}`;
}

/**
 * What the sheet is mounted on. Taken from a corner rather than by
 * counting: the busiest colour on a mostly-empty rip is the background
 * anyway, but a rip that is mostly one terrain would vote for that
 */
export function backgroundOf(raster: Raster): number {
  return packed(raster, 0, 0);
}

/**
 * Every island of ink, biggest first.
 *
 * The table comes out first because its grid lines join every cell of
 * it into one island. The notes, the title, the preview and each
 * palette are islands of their own
 */
export function blocksOf(raster: Raster, background: number): Rect[] {
  const seen = new Uint8Array(raster.width * raster.height);
  const found: Rect[] = [];
  const stack: number[] = [];

  for (let start = 0; start < seen.length; start += 1) {
    if (seen[start] === 1) {
      continue;
    }
    seen[start] = 1;
    if (packed(raster, start % raster.width, Math.floor(start / raster.width)) === background) {
      continue;
    }

    let left = raster.width;
    let right = -1;
    let top = raster.height;
    let bottom = -1;

    stack.push(start);
    while (stack.length > 0) {
      const at = stack.pop() ?? 0;
      const x = at % raster.width;
      const y = Math.floor(at / raster.width);

      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);

      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || ny < 0 || nx >= raster.width || ny >= raster.height) {
          continue;
        }
        const next = ny * raster.width + nx;

        if (seen[next] === 1) {
          continue;
        }
        seen[next] = 1;
        if (packed(raster, nx, ny) !== background) {
          stack.push(next);
        }
      }
    }
    found.push({ x: left, y: top, width: right - left + 1, height: bottom - top + 1 });
  }
  return found.sort((one, other) => other.width * other.height - one.width * one.height);
}

/** How much of a line may be something other than the line. */
const LINE_PURITY = 0.94;

/**
 * Whether this row or column of the block is a rule rather than
 * artwork: nearly every pixel of it the same colour, all the way
 * across
 */
function isRule(sample: (along: number) => number, length: number): boolean {
  const tally = new Map<number, number>();

  for (let along = 0; along < length; along += 1) {
    const colour = sample(along);

    tally.set(colour, (tally.get(colour) ?? 0) + 1);
  }
  return Math.max(...tally.values()) >= length * LINE_PURITY;
}

/**
 * How thick a run of uniform lines may be and still be a rule.
 *
 * Uniformity alone is not enough: a row of tiles that every terrain
 * left empty is one flat colour all the way across, and read as a rule
 * it would swallow a case rather than draw it. A rule is a hairline,
 * so anything thicker is content that happens to be plain
 */
const THICKEST_RULE = 4;

/** A run of one or more rules, and the gap it opens. */
interface Bands {
  /** Where the content between the rules starts and how far it runs. */
  bands: { at: number; size: number }[];
}

/**
 * The block cut into bands by its own rules. Consecutive rule lines
 * count as one edge, since a table drawn with a two-pixel border would
 * otherwise report a band of nothing between them
 */
function bandsOf(length: number, ruled: (at: number) => boolean): Bands {
  const rules = new Uint8Array(length);

  for (let at = 0; at < length; at += 1) {
    rules[at] = ruled(at) ? 1 : 0;
  }
  // Thick runs put back as content before anything is measured
  for (let at = 0; at < length;) {
    let end = at;

    while (end < length && rules[end] === 1) {
      end += 1;
    }
    if (end - at > THICKEST_RULE) {
      rules.fill(0, at, end);
    }
    at = end === at ? at + 1 : end;
  }

  const bands: { at: number; size: number }[] = [];
  let start: number | null = null;

  for (let at = 0; at <= length; at += 1) {
    if (at < length && rules[at] === 0) {
      start ??= at;
      continue;
    }
    if (start != null) {
      bands.push({ at: start, size: at - start });
      start = null;
    }
  }
  return { bands };
}

/** The size most of the bands are, which is the tile size. */
function pitchOf(bands: { size: number }[]): number {
  const tally = new Map<number, number>();

  for (const band of bands) {
    tally.set(band.size, (tally.get(band.size) ?? 0) + 1);
  }

  let best = 0;
  let most = 0;

  for (const [size, count] of tally) {
    // Ties go to the larger size, so a table with as many one-pixel
    // slivers as tiles does not call a sliver the tile
    if (count > most || (count === most && size > best)) {
      best = size;
      most = count;
    }
  }
  return best;
}

/**
 * Where the tiles of one axis sit, laid out from the pitch its rules
 * repeat at rather than from finding every one of them.
 *
 * A rule can go missing. These sheets mark a tile the ripper edited by
 * recolouring the line beside it, so a rule that is two colours down
 * its length is not uniform and is read as artwork; the two tiles it
 * separated arrive as one wide band, and a band that is not a whole
 * number of tiles has to be thrown away. That loses a terrain quietly.
 *
 * The table is a lattice, so it does not need every line. One tile
 * band for the origin and the gap the rest repeat at is enough to say
 * where all of them are, and that includes the ones *before* it: the
 * header of labels is ruled off with a border that stops at each
 * label, so the first row of tiles arrives joined to it and would
 * otherwise be dropped along with it.
 */
export function latticeOf(
  bands: { at: number; size: number }[],
  tile: number,
  start: number,
  end: number,
): number[] {
  const anchors = bands.filter((band) => band.size === tile).map((band) => band.at);

  if (anchors.length === 0) {
    // Nothing to measure a pitch against: fall back to whichever bands
    // divide by the tile, which is the answer when there are no rules
    // at all and the whole table came back as one band
    return bands.flatMap((band) =>
      band.size % tile === 0
        ? Array.from({ length: band.size / tile }, (_, step) => band.at + step * tile)
        : [],
    );
  }

  const gaps = new Map<number, number>();

  for (let at = 1; at < anchors.length; at += 1) {
    const gap = anchors[at] - anchors[at - 1];

    if (gap >= tile) {
      gaps.set(gap, (gaps.get(gap) ?? 0) + 1);
    }
  }

  let pitch = tile + 1;
  let most = 0;

  for (const [gap, count] of gaps) {
    if (count > most) {
      pitch = gap;
      most = count;
    }
  }

  const tiles: number[] = [];

  // Back from the first band that measured a whole tile, while another
  // whole one still fits inside the table
  for (let at = anchors[0] - pitch; at >= start; at -= pitch) {
    tiles.unshift(at);
  }
  for (let at = anchors[0]; at + tile <= end; at += pitch) {
    tiles.push(at);
  }
  return tiles;
}

/** The tile table, and where every row and column of it sits. */
export interface Table {
  bounds: Rect;
  /** How big one tile is, taken from the pitch the rules repeat at. */
  tile: number;
  /** Every column, the legend one included, left to right. */
  columns: { at: number; size: number }[];
  /** Every row, the header one included, top to bottom. */
  rows: { at: number; size: number }[];
}

/**
 * The table read off its own rules. Coordinates come back in the
 * sheet's own pixels, so a caller never has to add the block's corner
 * back on
 */
export function readTable(raster: Raster, bounds: Rect): Table {
  const across = bandsOf(bounds.width, (x) =>
    isRule((y) => packed(raster, bounds.x + x, bounds.y + y), bounds.height),
  );
  const down = bandsOf(bounds.height, (y) =>
    isRule((x) => packed(raster, bounds.x + x, bounds.y + y), bounds.width),
  );
  const tile = Math.max(pitchOf(across.bands), pitchOf(down.bands));

  if (tile < 4) {
    throw new Error('No tile grid was found in the sheet');
  }
  return {
    bounds,
    tile,
    columns: across.bands.map((band) => ({ at: bounds.x + band.at, size: band.size })),
    rows: down.bands.map((band) => ({ at: bounds.y + band.at, size: band.size })),
  };
}

/** How dark a legend square is drawn, and how light its middle is. */
const LEGEND_DARK = 60;
const LEGEND_LIGHT = 200;

/** The most colours a column can hold and still be a legend. */
const LEGEND_COLOURS = 4;

function brightness(colour: number): number {
  return (
    (((colour >>> 24) & 255) * 299 + ((colour >>> 16) & 255) * 587 + ((colour >>> 8) & 255) * 114) /
    1000
  );
}

/** Which bit of the mask each square of the legend's 3x3 carries. */
const LEGEND_BITS = [128, 1, 2, 64, 0, 4, 32, 16, 8];

/**
 * The neighbourhood one legend cell is drawn for, or nothing where
 * the cell is blank.
 *
 * Three squares by three, sampled at their middles. The background
 * showing through is a neighbour of some other terrain; anything drawn
 * is one of the same. The middle square is the tile itself and is
 * drawn lighter, which costs nothing to ignore since it carries no bit
 */
export function readLegend(raster: Raster, cell: Rect): number | null {
  const third = cell.width / 3;
  const down = cell.height / 3;
  let mask = 0;
  let drawn = false;

  for (let square = 0; square < 9; square += 1) {
    const x = Math.floor(cell.x + ((square % 3) + 0.5) * third);
    const y = Math.floor(cell.y + (Math.floor(square / 3) + 0.5) * down);
    const colour = packed(raster, x, y);

    if (colour === backgroundOf(raster) || (colour & 255) === 0) {
      continue;
    }
    drawn = true;
    mask |= LEGEND_BITS[square];
  }
  return drawn ? mask : null;
}

/**
 * Whether the column is legend rather than tiles.
 *
 * Not by how dark it is: a wall drawn in deep blue is as dark as the
 * legend's own ink. By how *few* colours it has. A legend is drawn in
 * two, on the background, where a terrain carries a sixteen-colour
 * palette, and it always has both a dark square and a light middle
 */
function isLegendColumn(
  raster: Raster,
  at: number,
  rows: number[],
  tile: number,
  background: number,
): boolean {
  const colours = new Set<number>();
  let dark = false;
  let light = false;

  for (const top of rows) {
    for (let y = top; y < top + tile; y += 1) {
      for (let x = at; x < at + tile; x += 1) {
        const colour = packed(raster, x, y);

        if (colour === background) {
          continue;
        }
        if (colour === MAGENTA) {
          return false;
        }
        colours.add(colour);
        if (colours.size > LEGEND_COLOURS) {
          return false;
        }
        dark ||= brightness(colour) < LEGEND_DARK;
        light ||= brightness(colour) > LEGEND_LIGHT;
      }
    }
  }
  return dark && light;
}

/**
 * How many columns on the left of the table are legend. The rips draw
 * one per tile the row stands for, so this is also how many tiles a
 * terrain's group holds
 */
export function legendWidth(
  raster: Raster,
  columns: number[],
  rows: number[],
  tile: number,
  background: number,
): number {
  let found = 0;

  while (found < columns.length && isLegendColumn(raster, columns[found], rows, tile, background)) {
    found += 1;
  }
  return found;
}

/** A palette as the rip draws it: one row of swatches per frame. */
export interface PaletteBlock {
  bounds: Rect;
  /** How wide one swatch is. */
  swatch: number;
  /** Frames down, slots across, `null` where the slot is transparent. */
  frames: (string | null)[][];
}

/** Every run of one colour along a row of the block, as spans. */
function runsAlong(raster: Raster, rect: Rect, y: number): { at: number; size: number }[] {
  const runs: { at: number; size: number }[] = [];
  let last = -1;
  let start = rect.x;

  for (let x = rect.x; x <= rect.x + rect.width; x += 1) {
    const colour = x < rect.x + rect.width ? packed(raster, x, y) : -2;

    if (colour === last) {
      continue;
    }
    if (x > start) {
      runs.push({ at: start, size: x - start });
    }
    last = colour;
    start = x;
  }
  return runs;
}

/** The fewest swatches a block has to hold to be a palette at all. */
const LEAST_SLOTS = 4;

/** How thin a run may be and still be the rule between two swatches. */
const THINNEST_SWATCH = 3;

/**
 * How much of its block a palette has to fill.
 *
 * A palette *is* its block, give or take a border and a caption. The
 * preview picture on these sheets holds a band of equal-width colours
 * that reads as a tiny grid, and this is what tells the two apart:
 * that band covers a twentieth of the picture it sits in
 */
const PALETTE_FILL = 0.6;

/**
 * The swatches on this row, or nothing where the row is not swatches.
 *
 * The rules between them are counted out rather than assumed absent:
 * these palettes are drawn as a grid with a hairline round every cell,
 * so a row of sixteen colours reads as thirty-three runs
 */
function swatchesAlong(
  raster: Raster,
  rect: Rect,
  y: number,
): { at: number; size: number }[] | null {
  const wide = runsAlong(raster, rect, y).filter((run) => run.size >= THINNEST_SWATCH);

  if (wide.length < LEAST_SLOTS) {
    return null;
  }
  return wide.every((run) => run.size === wide[0].size) ? wide : null;
}

/** A palette as the rip draws it: one row of swatches per frame. */
export interface PaletteBlock {
  bounds: Rect;
  /** How wide one swatch is. */
  swatch: number;
  /** Frames down, slots across, `null` where the slot is transparent. */
  frames: (string | null)[][];
}

/** A row's swatches as a key, so two rows can be compared for shape. */
function layoutKey(slots: { at: number; size: number }[]): string {
  return slots.map((slot) => slot.at).join(',');
}

/**
 * A palette read out of a block of ink, or nothing where the block is
 * a note, a preview or a caption.
 *
 * The shape every row agrees on is what a palette is. A picture can
 * hold a band of equal-width colours that reads as a row of swatches,
 * and one of these sheets puts its preview right beside the palettes,
 * so a single convincing row is not enough: a real palette is ruled
 * into cells, and every one of its rows breaks at the same places
 * whatever colours it holds.
 *
 * The commonest shape wins rather than the first found, so a caption
 * sitting against the top cannot claim the block before the grid does
 */
export function readPalette(raster: Raster, block: Rect): PaletteBlock | null {
  const rows = new Map<number, { at: number; size: number }[]>();
  const tally = new Map<string, number>();

  for (let y = block.y; y < block.y + block.height; y += 1) {
    const slots = swatchesAlong(raster, block, y);

    if (slots == null) {
      continue;
    }
    const key = layoutKey(slots);

    rows.set(y, slots);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }

  let shape = '';
  let most = 0;

  for (const [key, count] of tally) {
    if (count > most) {
      shape = key;
      most = count;
    }
  }
  if (most === 0) {
    return null;
  }

  const bands: { at: number; size: number }[] = [];
  let start: number | null = null;
  let slots: { at: number; size: number }[] = [];

  for (let y = block.y; y <= block.y + block.height; y += 1) {
    const found = rows.get(y);

    if (found != null && layoutKey(found) === shape) {
      start ??= y;
      slots = found;
      continue;
    }
    if (start != null) {
      bands.push({ at: start, size: y - start });
      start = null;
    }
  }
  if (slots.length === 0) {
    return null;
  }

  // Every frame of a palette is the same height, and none of them is a
  // hairline. A picture whose rows happen to break in the same places
  // does not hold to either
  const even = bands.filter((band) => band.size >= THINNEST_SWATCH);
  const heights = new Map<number, number>();

  for (const band of even) {
    heights.set(band.size, (heights.get(band.size) ?? 0) + 1);
  }

  let height = 0;
  let common = 0;

  for (const [size, count] of heights) {
    if (count > common) {
      height = size;
      common = count;
    }
  }
  const kept = even.filter((band) => band.size === height);

  if (kept.length === 0) {
    return null;
  }
  bands.length = 0;
  bands.push(...kept);

  const frames = bands.map((band) =>
    slots.map((slot) =>
      hexOf(packed(raster, slot.at + (slot.size >> 1), band.at + (band.size >> 1))),
    ),
  );
  const last = bands[bands.length - 1];
  const bounds = {
    x: slots[0].at,
    y: bands[0].at,
    width: slots[slots.length - 1].at + slots[0].size - slots[0].at,
    height: last.at + last.size - bands[0].at,
  };

  if (bounds.width * bounds.height < block.width * block.height * PALETTE_FILL) {
    return null;
  }
  return { bounds, swatch: slots[0].size, frames };
}
