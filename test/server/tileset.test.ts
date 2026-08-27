import { describe, expect, it } from 'vitest';
import { parseBiomes } from '../../src/server/sprites/graft';
import {
  AUTOTILE_CASES,
  AUTOTILE_COUNT,
  Around,
  SURROUNDED,
  autotileRow,
  canonicalMask,
  gridFromMask,
  maskFromGrid,
  rotateMask,
} from '../../src/data/overworld/autotile';
import { DEFAULT_TERRAINS } from '../../src/data/constants/tileset-rip';
import { blank } from '../../src/server/sprites/raster';
import type { Raster } from '../../src/server/sprites/raster';
import {
  backgroundOf,
  blocksOf,
  latticeOf,
  legendWidth,
  packed,
  readLegend,
  readPalette,
  readTable,
} from '../../src/server/sprites/rip';
import { biomeDestination } from '../../src/server/sprites/files';
import { roleFromName } from '../../src/data/overworld/terrain';
import {
  packTileset,
  parseSpeeds,
  parseTerrains,
  resolveDraws,
} from '../../src/server/sprites/tileset';

const TILE = 24;
const BANDS = 3;
const HEADER = 18;
const SWATCH = 10;
const SLOTS = 16;
const FRAMES = 8;

const TEAL = [0, 128, 128, 255] as const;
const RULE = [192, 128, 192, 255] as const;
const MAGENTA = [255, 0, 255, 255] as const;
const BLACK = [0, 0, 0, 255] as const;
const WHITE = [255, 255, 255, 255] as const;

/** One case per legend cell, which is how the rips fill the table. */
const CASES = AUTOTILE_CASES.filter((mask) => mask !== SURROUNDED).slice(0, 21);
const ROWS = CASES.length / BANDS;

/** The legend cell deliberately left blank, as row and band. */
const BLANK = { row: 2, band: 1 };

/** The terrain and band whose cells the fixture leaves undrawn. */
const HOLE = { terrain: 1, band: 2 };

function paint(
  raster: Raster,
  rect: { x: number; y: number; width: number; height: number },
  colour: readonly number[],
): void {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) {
        continue;
      }
      const at = (y * raster.width + x) * 4;

      raster.data[at] = colour[0];
      raster.data[at + 1] = colour[1];
      raster.data[at + 2] = colour[2];
      raster.data[at + 3] = colour[3];
    }
  }
}

/** A colour nothing else in the fixture uses, per cell. */
function shadeOf(terrain: number, band: number, row: number): readonly number[] {
  return [40 + terrain * 17, 30 + band * 61, 20 + row * 13, 255];
}

/** Which neighbourhood a legend cell stands for, or nothing. */
function caseAt(row: number, band: number): number | null {
  if (row === BLANK.row && band === BLANK.band) {
    return null;
  }
  return CASES[row * BANDS + band];
}

interface Fixture {
  raster: Raster;
  table: { x: number; y: number; width: number; height: number };
  columnAt: (index: number) => number;
  rowAt: (index: number) => number;
}

/**
 * A sheet laid out the way the rips are: a note, the table with its
 * legend columns, and bordered palettes down the right.
 *
 * The legend is several columns wide and each of them is a different
 * neighbourhood, which is what a terrain's group of tiles answers to.
 * Getting that wrong is the whole of what a rip reader gets wrong
 */
function ripFixture(
  terrains: number,
  marked = false,
  palettes = true,
  joinedHeader = false,
): Fixture {
  const tileColumns = terrains * BANDS;
  const columns = BANDS + tileColumns;
  const tableWidth = 1 + columns * (TILE + 1);
  const tableHeight = 1 + HEADER + 1 + ROWS * (TILE + 1);
  const raster = blank(tableWidth + 260, Math.max(tableHeight + 40, 460));

  paint(raster, { x: 0, y: 0, width: raster.width, height: raster.height }, TEAL);

  const table = { x: 10, y: 20, width: tableWidth, height: tableHeight };
  const columnAt = (index: number): number => table.x + 1 + index * (TILE + 1);
  const rowAt = (index: number): number => table.y + 1 + HEADER + 1 + index * (TILE + 1);

  // A note box, so the largest block has competition
  paint(raster, { x: 10, y: 2, width: 180, height: 14 }, BLACK);

  for (let index = 0; index <= columns; index += 1) {
    paint(raster, { x: columnAt(index) - 1, y: table.y, width: 1, height: table.height }, RULE);
  }
  // One rule recoloured half way down, the way these sheets mark a
  // tile somebody edited. It is no longer one colour, so no scan will
  // call it a rule and the two columns it parted arrive as one band
  if (marked) {
    paint(
      raster,
      { x: columnAt(BANDS + 1) - 1, y: table.y, width: 1, height: Math.floor(table.height / 2) },
      [255, 128, 255, 255],
    );
  }
  for (let index = 0; index <= ROWS; index += 1) {
    // The border under the header runs to the edge of each label and
    // no further on some sheets, so nothing full width is there to
    // find and the first row of tiles arrives joined to the header
    if (index === 0 && joinedHeader) {
      for (let column = 0; column < columns; column += 1) {
        paint(
          raster,
          { x: columnAt(column) + 4, y: rowAt(0) - 1, width: TILE - 8, height: 1 },
          RULE,
        );
      }
      continue;
    }
    paint(raster, { x: table.x, y: rowAt(index) - 1, width: table.width, height: 1 }, RULE);
  }
  paint(raster, { x: table.x, y: table.y, width: table.width, height: 1 }, RULE);

  // The header of labels: one box per column, which is what keeps
  // every row of it mixed. A header of a single flat colour is a row
  // no scan can tell from a rule
  for (let index = 0; index < columns; index += 1) {
    paint(raster, { x: columnAt(index), y: table.y + 1, width: TILE, height: HEADER }, [
      20 + index * 7,
      60,
      90 - index * 2,
      255,
    ]);
  }

  for (let row = 0; row < ROWS; row += 1) {
    const top = rowAt(row);

    for (let band = 0; band < BANDS; band += 1) {
      const mask = caseAt(row, band);

      if (mask == null) {
        continue;
      }
      const squares = gridFromMask(mask);

      // Background left showing is a neighbour of some other terrain,
      // the middle square is the tile itself and is drawn lighter
      for (let square = 0; square < 9; square += 1) {
        if (square !== 4 && !squares[square]) {
          continue;
        }
        paint(
          raster,
          {
            x: columnAt(band) + (square % 3) * (TILE / 3),
            y: top + Math.floor(square / 3) * (TILE / 3),
            width: TILE / 3,
            height: TILE / 3,
          },
          square === 4 ? WHITE : BLACK,
        );
      }
    }

    for (let terrain = 0; terrain < terrains; terrain += 1) {
      for (let band = 0; band < BANDS; band += 1) {
        const box = {
          x: columnAt(BANDS + terrain * BANDS + band),
          y: top,
          width: TILE,
          height: TILE,
        };

        if (terrain === HOLE.terrain && band === HOLE.band) {
          paint(raster, box, MAGENTA);
          continue;
        }
        paint(raster, box, shadeOf(terrain, band, row));
      }
    }
  }

  // Palettes down the right, each a bordered grid with its label
  // against the top
  for (let block = 0; block < (palettes ? 4 : 0); block += 1) {
    const left = table.x + table.width + 20;
    const top = 20 + block * (FRAMES * (SWATCH + 1) + 30);

    paint(raster, { x: left, y: top, width: 90, height: 8 }, [20, 40, 20, 255]);

    const grid = { x: left, y: top + 12 };

    paint(
      raster,
      {
        x: grid.x,
        y: grid.y,
        width: SLOTS * (SWATCH + 1) + 1,
        height: FRAMES * (SWATCH + 1) + 1,
      },
      [80, 80, 80, 255],
    );
    for (let frame = 0; frame < FRAMES; frame += 1) {
      for (let slot = 0; slot < SLOTS; slot += 1) {
        paint(
          raster,
          {
            x: grid.x + 1 + slot * (SWATCH + 1),
            y: grid.y + 1 + frame * (SWATCH + 1),
            width: SWATCH,
            height: SWATCH,
          },
          [block * 40 + slot * 3, frame * 20 + 10, slot * 15 + block, 255],
        );
      }
    }
  }
  // The preview picture these sheets carry beside their palettes: a
  // band of colours regular enough to read as swatches on some rows
  // and not on others
  const preview = { x: table.x + table.width + 20, y: 20 + 4 * (FRAMES * (SWATCH + 1) + 30) };

  for (let row = 0; row < 96; row += 1) {
    const wide = row % 2 === 0 ? 6 : 10;

    for (let at = 0; at * wide < 80; at += 1) {
      paint(raster, { x: preview.x + at * wide, y: preview.y + row, width: wide, height: 1 }, [
        30 + at * 9,
        60 + row,
        200 - at * 5,
        255,
      ]);
    }
  }
  return { raster, table, columnAt, rowAt };
}

describe('autotile cases', () => {
  it('reduces the 256 neighbourhoods to the 47 an artist draws', () => {
    expect(AUTOTILE_COUNT).toBe(47);
    expect(new Set(AUTOTILE_CASES).size).toBe(47);
  });

  it('ignores a corner whose two edges are not both filled', () => {
    expect(canonicalMask(0b0000_0010)).toBe(0);
    expect(canonicalMask(0b0000_0111)).toBe(0b0000_0111);
    expect(canonicalMask(0b0000_0011)).toBe(0b0000_0001);
  });

  it('reads a legend square back as the mask it was drawn from', () => {
    for (const mask of AUTOTILE_CASES) {
      expect(maskFromGrid(gridFromMask(mask))).toBe(mask);
      expect(autotileRow(mask)).toBe(AUTOTILE_CASES.indexOf(mask));
    }
  });

  it('sends every raw neighbourhood to a row that exists', () => {
    for (let mask = 0; mask < 256; mask += 1) {
      expect(autotileRow(mask)).toBeLessThan(AUTOTILE_COUNT);
    }
  });
});

describe('turning a neighbourhood with the camera', () => {
  it('moves every direction a quarter of the way round', () => {
    expect(rotateMask(Around.North, 1)).toBe(Around.East);
    expect(rotateMask(Around.East, 1)).toBe(Around.South);
    expect(rotateMask(Around.South, 1)).toBe(Around.West);
    expect(rotateMask(Around.West, 1)).toBe(Around.North);
    expect(rotateMask(Around.NorthEast, 1)).toBe(Around.SouthEast);
    expect(rotateMask(Around.NorthWest, 1)).toBe(Around.NorthEast);
  });

  it('leaves a neighbourhood alone at no turn and at four', () => {
    for (const mask of AUTOTILE_CASES) {
      expect(rotateMask(mask, 0)).toBe(mask);
      expect(rotateMask(mask, 4)).toBe(mask);
      expect(rotateMask(mask, -4)).toBe(mask);
    }
  });

  it('turns back to where it started', () => {
    for (const mask of AUTOTILE_CASES) {
      for (let turns = 0; turns < 4; turns += 1) {
        expect(rotateMask(rotateMask(mask, turns), -turns)).toBe(mask);
        expect(rotateMask(rotateMask(mask, turns), 4 - turns)).toBe(mask);
      }
    }
  });

  it('never turns a neighbourhood into one nobody drew', () => {
    for (const mask of AUTOTILE_CASES) {
      for (let turns = 0; turns < 4; turns += 1) {
        const turned = rotateMask(mask, turns);

        expect(canonicalMask(turned)).toBe(turned);
        expect(AUTOTILE_CASES).toContain(turned);
      }
    }
  });

  it('keeps the two that look the same from every side', () => {
    expect(rotateMask(SURROUNDED, 1)).toBe(SURROUNDED);
    expect(rotateMask(0, 1)).toBe(0);
  });
});

describe('reading a rip', () => {
  it('finds the table as the largest block of ink', () => {
    const { raster, table } = ripFixture(4);

    expect(blocksOf(raster, backgroundOf(raster))[0]).toEqual(table);
  });

  it('takes the tile size from the pitch its own rules repeat at', () => {
    const { raster, table } = ripFixture(4);

    expect(readTable(raster, table).tile).toBe(TILE);
  });

  it('keeps the header of labels out of the tile rows', () => {
    const { raster, table } = ripFixture(4);
    const read = readTable(raster, table);

    expect(read.rows[0].size).toBe(HEADER);
    expect(read.rows.filter((band) => band.size === TILE)).toHaveLength(ROWS);
  });

  it('counts the legend columns by how few colours they are drawn in', () => {
    const { raster, table, columnAt, rowAt } = ripFixture(4);
    const columns = Array.from({ length: BANDS + 12 }, (_, at) => columnAt(at));
    const rows = Array.from({ length: ROWS }, (_, at) => rowAt(at));

    expect(legendWidth(raster, columns, rows, TILE, backgroundOf(raster))).toBe(BANDS);
    expect(table.width).toBeGreaterThan(0);
  });

  it('reads each legend cell as the neighbourhood it was drawn for', () => {
    const { raster, columnAt, rowAt } = ripFixture(4);

    for (let row = 0; row < ROWS; row += 1) {
      for (let band = 0; band < BANDS; band += 1) {
        const read = readLegend(raster, {
          x: columnAt(band),
          y: rowAt(row),
          width: TILE,
          height: TILE,
        });

        expect(read).toBe(caseAt(row, band));
      }
    }
  });

  it('lays the grid out from its pitch, so a lost rule costs nothing', () => {
    const plain = ripFixture(4);
    const { raster, table } = ripFixture(4, true);
    const read = readTable(raster, table);
    const rowBands = read.rows[0].size === TILE ? read.rows.slice(1) : read.rows;
    const rows = latticeOf(rowBands, TILE, table.y, table.y + table.height);

    // The marked rule merges two columns into a band that is not a
    // whole number of tiles, which taken at face value loses a terrain
    expect(read.columns.some((band) => band.size !== TILE)).toBe(true);
    expect(latticeOf(read.columns, TILE, table.x, table.x + table.width)).toEqual(
      latticeOf(readTable(plain.raster, plain.table).columns, TILE, table.x, table.x + table.width),
    );
    expect(rows).toHaveLength(ROWS);
  });

  it('still packs every terrain when a rule has been marked', () => {
    const { data } = packTileset(ripFixture(4, true).raster, {
      biome: 1,
      terrains: parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2'),
      speeds: [8],
      draws: {},
    });

    expect(data.terrains).toHaveLength(4);
  });

  it('keeps the first row of tiles when it is joined to the header', () => {
    const { raster, table } = ripFixture(4, false, true, true);
    const read = readTable(raster, table);
    const rowBands = read.rows[0].size === TILE ? read.rows.slice(1) : read.rows;

    // The header and the first row of tiles arrive as one tall band,
    // which is not a whole number of tiles and would be dropped entire
    expect(read.rows[0].size).toBe(HEADER + 1 + TILE);
    expect(latticeOf(rowBands, TILE, table.y, table.y + table.height)).toHaveLength(ROWS);
  });

  it('packs every case when the first row is joined to the header', () => {
    const joined = packTileset(ripFixture(4, false, true, true).raster, {
      biome: 1,
      terrains: parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2'),
      speeds: [8],
      draws: {},
    });
    const plain = packTileset(ripFixture(4).raster, {
      biome: 1,
      terrains: parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2'),
      speeds: [8],
      draws: {},
    });

    expect(joined.read.rows).toBe(plain.read.rows);
    expect(joined.read.cases).toBe(plain.read.cases);
    expect(joined.data.terrains.map((one) => one.missing)).toEqual(
      plain.data.terrains.map((one) => one.missing),
    );
  });

  it('reads a bordered palette past the label sitting against it', () => {
    const { raster, table } = ripFixture(4);
    const read = blocksOf(raster, backgroundOf(raster))
      .filter((block) => block.x !== table.x || block.y !== table.y)
      .map((block) => readPalette(raster, block))
      .filter((one) => one != null);

    // Four, not five: the preview beside them is a picture, and its
    // rows do not all break in the same places
    expect(read).toHaveLength(4);
    expect(read[0].swatch).toBe(SWATCH);
    expect(read[0].frames).toHaveLength(FRAMES);
    expect(read[0].frames[0]).toHaveLength(SLOTS);
  });
});

describe('packing a tileset', () => {
  const terrains = parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2');
  const packed4 = (): ReturnType<typeof packTileset> =>
    packTileset(ripFixture(4).raster, { biome: 1, terrains, speeds: [8], draws: {} });

  it('gives every terrain a block of all 47 cases', () => {
    const { data, sheet, read } = packed4();

    expect(read.tile).toBe(TILE);
    expect(read.bands).toBe(BANDS);
    expect(read.columns).toBe(terrains.length * BANDS);
    expect(sheet.width).toBe(terrains.length * data.variants * TILE);
    expect(sheet.height).toBe(AUTOTILE_COUNT * TILE);
  });

  it('reads the legend columns as cases rather than as variations', () => {
    const { data, read } = packed4();

    // One drawing of each tile: the three columns of a group are three
    // neighbourhoods, not three versions of one
    expect(data.variants).toBe(1);
    expect(read.cases).toBe(CASES.length - 1);
  });

  it('names what each terrain is for from the front of its name', () => {
    expect(packed4().data.terrains.map((one) => one.role)).toEqual([
      'wall',
      'wall',
      'ground',
      'water',
    ]);
  });

  it('puts a tile where its legend said, not where it sat in the rip', () => {
    const { sheet } = packed4();

    for (let row = 0; row < ROWS; row += 1) {
      for (let band = 0; band < BANDS; band += 1) {
        const mask = caseAt(row, band);

        if (mask == null) {
          continue;
        }
        const expected = shadeOf(0, band, row);
        const at = { x: TILE >> 1, y: autotileRow(mask) * TILE + (TILE >> 1) };

        expect(packed(sheet, at.x, at.y) >>> 8).toBe(
          (expected[0] << 16) | (expected[1] << 8) | expected[2],
        );
      }
    }
  });

  it('counts a cell of the stand-in colour as nothing drawn', () => {
    const { data, sheet } = packed4();
    const skipped = CASES.filter((_, at) => at % BANDS === HOLE.band).map((mask) =>
      autotileRow(mask),
    );

    for (const row of skipped) {
      expect(data.terrains[HOLE.terrain].missing).toContain(row);
      expect(packed(sheet, HOLE.terrain * TILE + (TILE >> 1), row * TILE + (TILE >> 1)) & 255).toBe(
        0,
      );
    }
    expect(data.terrains[0].missing).not.toContain(autotileRow(CASES[HOLE.band]));
  });

  it('says which neighbourhoods the rip never drew at all', () => {
    const { data } = packed4();
    const drawn = new Set(CASES.filter((_, at) => at !== BLANK.row * BANDS + BLANK.band));

    for (const mask of AUTOTILE_CASES) {
      if (drawn.has(mask)) {
        continue;
      }
      expect(data.terrains[0].missing).toContain(autotileRow(mask));
    }
    expect(data.terrains[0].missing).toContain(autotileRow(SURROUNDED));
  });

  it('carries every palette frame through as data', () => {
    const { data } = packed4();

    expect(data.palettes).toHaveLength(4);
    expect(data.palettes[0].frames).toHaveLength(FRAMES);
    expect(data.palettes[0].frames[0]).toHaveLength(SLOTS);
    expect(data.palettes[0].speed).toBe(8);
    expect(data.terrains.map((one) => one.palette)).toEqual([0, 1, 0, 2]);
  });

  it('refuses a table whose groups do not divide by the terrains named', () => {
    const { raster } = ripFixture(3);

    expect(() => packTileset(raster, { biome: 1, terrains, speeds: [8], draws: {} })).toThrow(
      /not the 4 named/,
    );
  });
});

describe('a rip that carries no palettes', () => {
  const terrains = parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2');

  it('packs, and says every terrain cycles nothing', () => {
    const { data, read } = packTileset(ripFixture(4, false, false).raster, {
      biome: 1,
      terrains,
      speeds: [8],
      draws: {},
    });

    expect(read.palettes).toBe(0);
    expect(read.stuck).toBe(0);
    expect(data.palettes).toEqual([]);
    // The names still name one; there is simply nothing to point at
    expect(data.terrains.map((one) => one.palette)).toEqual([-1, -1, -1, -1]);
  });

  it('packs the same tiles as the rip that does', () => {
    const bare = packTileset(ripFixture(4, false, false).raster, {
      biome: 1,
      terrains,
      speeds: [8],
      draws: {},
    });
    const full = packTileset(ripFixture(4).raster, { biome: 1, terrains, speeds: [8], draws: {} });

    expect(bare.sheet.data.equals(full.sheet.data)).toBe(true);
    expect(bare.data.terrains.map((one) => one.missing)).toEqual(
      full.data.terrains.map((one) => one.missing),
    );
  });
});

describe('which terrain a biome is packed to draw with', () => {
  const terrains = parseTerrains('walls/0 ground/0 ground-alt-1/0 water/1');

  it('leaves a role unnamed where the form was left blank', () => {
    expect(resolveDraws(terrains, {})).toEqual({});
    expect(resolveDraws(terrains, { ground: '   ' })).toEqual({});
  });

  it('keeps the column the form named', () => {
    expect(resolveDraws(terrains, { ground: 'ground-alt-1' })).toEqual({ ground: 'ground-alt-1' });
  });

  it('refuses a name no column answers to', () => {
    // Quietly ignored it would draw the ordinary terrain and look
    // like the sheet had been packed right
    expect(() => resolveDraws(terrains, { ground: 'ground-alt-9' })).toThrow(/ground-alt-9/);
  });

  it('writes the choice into the sheet, and says what every role got', () => {
    const { data, read } = packTileset(ripFixture(4).raster, {
      biome: 1,
      terrains: parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2'),
      speeds: [8],
      draws: { ground: 'walls-b' },
    });

    expect(data.draws).toEqual({ ground: 'walls-b' });
    // A role nobody named still reports what it fell back to
    expect(read.draws).toEqual({ wall: 'walls-a', ground: 'walls-b', water: 'water' });
  });

  it('packs the same tiles whichever terrain it is told to draw with', () => {
    const plain = packTileset(ripFixture(4).raster, {
      biome: 1,
      terrains: parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2'),
      speeds: [8],
      draws: {},
    });
    const other = packTileset(ripFixture(4).raster, {
      biome: 1,
      terrains: parseTerrains('walls-a/0 walls-b/1 ground-a/0 water/2'),
      speeds: [8],
      draws: { ground: 'walls-b' },
    });

    // One rip, two biomes: same table, same atlas, different column
    // called the ground
    expect(other.sheet.data.equals(plain.sheet.data)).toBe(true);
    expect(other.data.draws).not.toEqual(plain.data.draws);
  });
});

describe('the terrain list', () => {
  it('reads the palette off the end of each name', () => {
    expect(parseTerrains('ground-a/0 water/2')).toEqual([
      { name: 'ground-a', palette: 0 },
      { name: 'water', palette: 2 },
    ]);
  });

  it('leaves a terrain with no palette alone', () => {
    expect(parseTerrains('rock')).toEqual([{ name: 'rock', palette: -1 }]);
  });

  it('describes the standard rip as ten columns', () => {
    expect(parseTerrains(DEFAULT_TERRAINS)).toHaveLength(10);
  });

  it('refuses an empty list', () => {
    expect(() => parseTerrains('  ')).toThrow();
  });
});

describe('what a terrain column is for', () => {
  it('reads the role out of the name whatever else is in it', () => {
    expect(roleFromName('walls')).toBe('wall');
    expect(roleFromName('walls-a')).toBe('wall');
    expect(roleFromName('wall-alt-1-b')).toBe('wall');
    expect(roleFromName('ground-a')).toBe('ground');
    expect(roleFromName('water')).toBe('water');
    expect(roleFromName('water-sparkle')).toBe('water');
  });

  it('calls a column naming two of them a transition, and neither', () => {
    // The shore column of a rip. Read as water it would be picked
    // ahead of the open sea and drawn across a whole chunk
    expect(roleFromName('water-ground')).toBe('other');
  });

  it('carries a terrain nobody recognises through as something else', () => {
    expect(roleFromName('lava')).toBe('other');
  });
});

describe('how fast a palette runs', () => {
  it('reads one number per palette', () => {
    expect(parseSpeeds('18 12')).toEqual([18, 12]);
  });

  it('falls back where the field is empty or nonsense', () => {
    expect(parseSpeeds('   ')).toEqual([8]);
    expect(parseSpeeds('quick')).toEqual([8]);
    expect(parseSpeeds('0 -4')).toEqual([8]);
  });

  it('gives each palette its own, and the last stands for the rest', () => {
    const { data } = packTileset(ripFixture(4).raster, {
      biome: 1,
      terrains: parseTerrains('walls-a/0 walls-b/1 ground-a/2 water/3'),
      speeds: [5, 9],
      draws: {},
    });

    expect(data.palettes.map((one) => one.speed)).toEqual([5, 9, 9, 9]);
  });
});

describe('where a tileset is written', () => {
  it('files it under the biome number', () => {
    expect(biomeDestination(11)).toEqual({
      image: 'sprites/biome/11/image.png',
      meta: 'sprites/biome/11/data.json',
    });
  });

  it('refuses a biome that is not one', () => {
    expect(() => biomeDestination(-1)).toThrow();
  });
});

describe('naming biomes to graft a wall onto', () => {
  it('takes a list however it is separated', () => {
    expect(parseBiomes('4 6 7')).toEqual([4, 6, 7]);
    expect(parseBiomes('4,6,7')).toEqual([4, 6, 7]);
    expect(parseBiomes(' 4 ,\n 6 ')).toEqual([4, 6]);
    expect(parseBiomes('')).toEqual([]);
  });

  it('refuses the whole list rather than grafting a shorter one', () => {
    // Half a list is worse than none: the biomes it skipped would keep
    // their trees and nobody would be told which
    expect(() => parseBiomes('4 nope 7')).toThrow('Not a biome');
    expect(() => parseBiomes('4 -2')).toThrow('Not a biome');
  });
});
