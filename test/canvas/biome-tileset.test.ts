import { describe, expect, it } from 'vitest';
import {
  ALONE,
  AUTOTILE_COUNT,
  SURROUNDED,
  autotileRow,
  withoutDiagonals,
} from '../../src/data/overworld/autotile';
import BiomeTileset, {
  asTilesetData,
  biomeTilesetPath,
  swapsBetween,
  variantAt,
} from '../../src/canvas/biome-tileset';

const TILE = 24;

/** A neighbourhood the fixture's ground was deliberately not drawn for. */
const SKIPPED = 0b0000_0111;

/** A description of the shape the processor writes. */
function described(over: Record<string, unknown> = {}): unknown {
  return {
    biome: 11,
    tile: TILE,
    width: 720,
    height: AUTOTILE_COUNT * TILE,
    variants: 3,
    cases: [],
    terrains: [
      { name: 'walls-a', role: 'wall', column: 0, palette: 0, missing: [] },
      { name: 'walls-b', role: 'wall', column: 3, palette: 1, missing: [] },
      { name: 'ground-a', role: 'ground', column: 6, palette: 0, missing: [autotileRow(SKIPPED)] },
      { name: 'ground-alt-1', role: 'ground', column: 12, palette: 2, missing: [] },
      { name: 'water', role: 'water', column: 9, palette: 2, missing: [] },
    ],
    palettes: [
      {
        frames: [
          ['#101010', '#202020'],
          ['#111111', '#222222'],
        ],
        speed: 8,
      },
      { frames: [['#303030']], speed: 8 },
      { frames: [['#404040'], ['#414141'], ['#424242']], speed: 12 },
    ],
    ...over,
  };
}

function tileset(over: Record<string, unknown> = {}): BiomeTileset {
  return new BiomeTileset('/sprites/biome/11/image.png', asTilesetData(described(over)));
}

describe('reading a tileset description', () => {
  it('keeps what the processor wrote', () => {
    const data = asTilesetData(described());

    expect(data.tile).toBe(TILE);
    expect(data.variants).toBe(3);
    expect(data.terrains).toHaveLength(5);
    expect(data.terrains[2].missing).toEqual([autotileRow(SKIPPED)]);
  });

  it('reads a file with nothing in it rather than throwing', () => {
    const data = asTilesetData(null);

    expect(data.terrains).toEqual([]);
    expect(data.palettes).toEqual([]);
    expect(data.tile).toBe(TILE);
  });

  it('calls a terrain nobody recognises something else', () => {
    const data = asTilesetData(
      described({ terrains: [{ name: 'lava', role: 'molten', column: 0, palette: -1 }] }),
    );

    expect(data.terrains[0].role).toBe('other');
  });
});

describe('which terrains a board takes', () => {
  it('takes the first of each role and leaves the alternatives', () => {
    const sheet = tileset();

    expect(sheet.has('wall')).toBe(true);
    expect(sheet.has('ground')).toBe(true);
    expect(sheet.has('water')).toBe(true);
    // Each terrain is cut out on its own now, so a spot is a place on
    // that terrain's sheet and nobody has to know the order
    expect(sheet.spot('water', SURROUNDED, 0)?.x).toBe(0);
  });

  it('answers nothing for a role the rip never drew', () => {
    const sheet = tileset({
      terrains: [{ name: 'walls-a', role: 'wall', column: 0, palette: 0, missing: [] }],
    });

    expect(sheet.has('water')).toBe(false);
    expect(sheet.spot('water', SURROUNDED, 0)).toBeNull();
  });
});

describe('finding a tile', () => {
  it('puts the neighbourhood on the row and the variation on the column', () => {
    const sheet = tileset();

    expect(sheet.spot('wall', ALONE, 0)).toEqual({ x: 0, y: autotileRow(ALONE) * TILE });
    expect(sheet.spot('wall', ALONE, 2)).toEqual({ x: 2 * TILE, y: autotileRow(ALONE) * TILE });
    expect(sheet.spot('ground', SURROUNDED, 1)).toEqual({
      x: TILE,
      y: autotileRow(SURROUNDED) * TILE,
    });
  });

  it('gives up the corners before it gives up the shape', () => {
    const sheet = tileset();

    // The fixture's ground has no tile for that neighbourhood, so it
    // falls to the same shape without its corners rather than to a
    // closed block, which would read as a hole in the floor
    expect(sheet.spot('ground', SKIPPED, 0)?.y).toBe(autotileRow(withoutDiagonals(SKIPPED)) * TILE);
  });

  it('falls all the way to the closed tile when neither was drawn', () => {
    const sheet = tileset({
      terrains: [
        {
          name: 'ground-a',
          role: 'ground',
          column: 0,
          palette: -1,
          missing: [autotileRow(SKIPPED), autotileRow(withoutDiagonals(SKIPPED))],
        },
      ],
    });

    expect(sheet.spot('ground', SKIPPED, 0)?.y).toBe(autotileRow(SURROUNDED) * TILE);
  });

  it('wraps a variation past the end rather than drawing nothing', () => {
    const sheet = tileset();

    expect(sheet.spot('wall', ALONE, 5)?.x).toBe(2 * TILE);
    expect(sheet.spot('wall', ALONE, -1)?.x).toBe(2 * TILE);
    expect(sheet.spot('water', ALONE, 4)?.x).toBe(TILE);
  });
});

describe('a tileset with nothing to cycle', () => {
  it('holds one frame for ever', () => {
    const sheet = tileset({ palettes: [] });

    expect(sheet.framesFor('ground')).toBe(1);
    expect(sheet.frameOf('ground', 0)).toBe(0);
    expect(sheet.frameOf('ground', 999_999)).toBe(0);
  });

  it('finds its tiles the same as one that cycles', () => {
    const still = tileset({ palettes: [] });

    expect(still.has('ground')).toBe(true);
    expect(still.spot('ground', SURROUNDED, 0)).toEqual(tileset().spot('ground', SURROUNDED, 0));
  });

  it('holds a beat of its own, so nothing divides by nothing', () => {
    expect(tileset({ palettes: [] }).speedFor('ground')).toBeGreaterThan(0);
  });

  it('treats a terrain naming no palette the same way', () => {
    const sheet = tileset({
      terrains: [{ name: 'ground-a', role: 'ground', column: 0, palette: -1, missing: [] }],
    });

    expect(sheet.framesFor('ground')).toBe(1);
    expect(sheet.spot('ground', SURROUNDED, 0)).not.toBeNull();
  });
});

describe('the palette clock', () => {
  it('gives every terrain the beat its own palette was given', () => {
    const sheet = tileset();

    // The wall and the ground share a palette; the water has its own
    expect(sheet.speedFor('wall')).toBe(8);
    expect(sheet.speedFor('ground')).toBe(8);
    expect(sheet.speedFor('water')).toBe(12);
  });

  it("counts a terrain through its own frames rather than the board's", () => {
    const sheet = tileset();

    expect(sheet.framesFor('wall')).toBe(2);
    expect(sheet.framesFor('water')).toBe(3);
  });

  it('runs the fast terrain ahead of the slow one', () => {
    const sheet = tileset();
    // A palette at 12 game frames holds one for 200ms, one at 8 holds
    // it for 133ms. At a second in they are nowhere near each other
    const now = 1000;

    expect(sheet.frameOf('water', now)).toBe(Math.floor(1000 / 200) % 3);
    expect(sheet.frameOf('wall', now)).toBe(Math.floor(1000 / (8000 / 60)) % 2);
    expect(sheet.frameOf('water', now)).not.toBe(sheet.frameOf('wall', now));
  });

  it('wraps each terrain within its own cycle', () => {
    const sheet = tileset();

    for (const now of [0, 137, 999, 100_000, 1_000_000]) {
      expect(sheet.frameOf('water', now)).toBeLessThan(sheet.framesFor('water'));
      expect(sheet.frameOf('wall', now)).toBeLessThan(sheet.framesFor('wall'));
    }
  });

  it('draws nothing until the sheet has loaded', () => {
    expect(tileset().tileAt('ground', SURROUNDED, 0, 0)).toBeNull();
  });

  it('says nothing about a role the rip never drew', () => {
    const sheet = tileset({
      terrains: [{ name: 'ground-a', role: 'ground', column: 0, palette: 0, missing: [] }],
    });

    expect(sheet.framesFor('water')).toBe(1);
    expect(sheet.frameOf('water', 5000)).toBe(0);
    expect(sheet.tileAt('water', SURROUNDED, 0, 0)).toBeNull();
  });
});

describe('which drawing of a tile a cell gets', () => {
  it('answers the same for the same cell every time', () => {
    expect(variantAt(3, 9, 3)).toBe(variantAt(3, 9, 3));
  });

  it('stays inside the variations there are', () => {
    for (let y = -4; y < 20; y += 1) {
      for (let x = -4; x < 20; x += 1) {
        expect(variantAt(x, y, 3)).toBeGreaterThanOrEqual(0);
        expect(variantAt(x, y, 3)).toBeLessThan(3);
      }
    }
  });

  it('does not lay the variations out in stripes', () => {
    const seen = new Set<number>();

    for (let x = 0; x < 16; x += 1) {
      seen.add(variantAt(x, 4, 3));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('has nothing to choose where there is one drawing', () => {
    expect(variantAt(7, 7, 1)).toBe(0);
  });
});

describe('what a palette frame does to the colours of the first', () => {
  it('maps each slot to what it becomes', () => {
    const swaps = swapsBetween(['#101010', '#202020'], ['#111111', '#222222']);

    expect(swaps.get(0x101010)).toBe(0x111111);
    expect(swaps.get(0x202020)).toBe(0x222222);
  });

  it('says nothing about a colour that does not move', () => {
    expect(swapsBetween(['#101010'], ['#101010']).size).toBe(0);
  });

  it('holds still a colour that two slots take in different directions', () => {
    // Only the colour survives into the atlas, so a colour that is two
    // slots cannot be told apart. Left alone it is a shade that does
    // not move; guessed at it is a stripe across the ground
    const swaps = swapsBetween(['#303030', '#303030'], ['#404040', '#505050']);

    expect(swaps.has(0x303030)).toBe(false);
  });

  it('keeps a colour that two slots agree on', () => {
    expect(swapsBetween(['#303030', '#303030'], ['#404040', '#404040']).get(0x303030)).toBe(
      0x404040,
    );
  });

  it('leaves a slot that goes transparent where it was', () => {
    expect(swapsBetween(['#303030'], [null]).size).toBe(0);
  });
});

describe('two biomes packed from one rip', () => {
  const named = (picks: Record<string, string>): BiomeTileset =>
    new BiomeTileset(
      '/x.png',
      asTilesetData(
        described({
          terrains: [
            { name: 'walls', role: 'wall', column: 0, palette: 0, missing: [] },
            { name: 'ground', role: 'ground', column: 1, palette: 0, missing: [] },
            { name: 'ground-alt-1', role: 'ground', column: 2, palette: 2, missing: [1] },
            { name: 'abyss', role: 'other', column: 3, palette: -1, missing: [] },
            { name: 'water', role: 'water', column: 4, palette: 2, missing: [] },
          ],
        }),
      ),
      picks,
    );

  it('takes the first terrain of a role when nobody named one', () => {
    expect(named({}).drawnAs('ground')).toBe('ground');
  });

  it('takes what the sheet was packed to draw with', () => {
    const packed = new BiomeTileset(
      '/x.png',
      asTilesetData(described({ draws: { ground: 'ground-alt-1' } })),
    );

    expect(packed.drawnAs('ground')).toBe('ground-alt-1');
  });

  it('takes the terrain the caller names instead', () => {
    expect(named({ ground: 'ground-alt-1' }).drawnAs('ground')).toBe('ground-alt-1');
  });

  it('lets the name win over the role, so any column can be the ground', () => {
    // The rips carry a column that is neither ground nor wall, and a
    // biome that wants it as its ground should have it
    const sheet = named({ ground: 'abyss' });

    expect(sheet.drawnAs('ground')).toBe('abyss');
    expect(sheet.has('ground')).toBe(true);
    expect(sheet.spot('ground', SURROUNDED, 0)).not.toBeNull();
  });

  it("carries the named terrain's own palette with it", () => {
    // ground-alt-1 cycles palette 2, where plain ground cycles 0
    expect(named({}).speedFor('ground')).toBe(8);
    expect(named({ ground: 'ground-alt-1' }).speedFor('ground')).toBe(12);
    expect(named({ ground: 'ground-alt-1' }).framesFor('ground')).toBe(3);
  });

  it('falls back to the role where the name answers to nothing', () => {
    // A table that has drifted from the files draws the ordinary
    // thing rather than nothing at all
    expect(named({ ground: 'ground-alt-9' }).drawnAs('ground')).toBe('ground');
  });

  it('leaves the roles nobody named alone', () => {
    const sheet = named({ ground: 'ground-alt-1' });

    expect(sheet.drawnAs('wall')).toBe('walls');
    expect(sheet.drawnAs('water')).toBe('water');
  });
});

describe('where a tileset is served from', () => {
  it('is the biome number', () => {
    expect(biomeTilesetPath(11)).toBe('/sprites/biome/11');
  });
});
