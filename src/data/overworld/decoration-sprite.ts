// A record keyed by a const enum is indexed by number once the keys
// have been round-tripped through Object.entries; tsc wants the
// assertion back, tsgolint resolves the enum to number and calls it
// redundant
// oxlint-disable typescript/no-unnecessary-type-assertion
import Biome, { BIOME_CONFIGS } from '../ids/biome';
import Decoration, { getBiomeDecorations } from './decoration';

/**
 * Where a piece of scenery is drawn from, and which one a biome grows.
 *
 * Two sheets rather than one: the rip draws every tree in four or five
 * shades and the biomes want different ones, so the trees are their own
 * atlas and a board is not reloading eleven rocks every time a biome is
 * given a tree of its own. Both are packed in the same cell, so a cell
 * of either is worth the same on the board.
 */

/** The sheets, under the overworld sprite root. */
export const DECORATION_SHEET = 'decorations';
export const TREE_SHEET = 'trees';

export interface DecorationPicture {
  /** The sheet it is drawn from. */
  sheet: string;
  /** The picture on that sheet. */
  name: string;
}

/** The pictures one kind may be drawn as, and where they are packed. */
interface DecorationArt {
  sheet: string;
  /** The pictures, in the order the cells of a chunk pick them. */
  names: string[];
}

/**
 * What each kind is drawn as where its biome says nothing more.
 *
 * A list rather than one picture: a chunk rolls eight to twelve pieces
 * of scenery out of a list of three or four kinds, so one picture a
 * kind put the same rock down four times in a row.
 *
 * Written out rather than derived from `DECORATION_NAMES`: that table
 * is what a player is told a thing is, and renaming one should not
 * repoint it at a picture that is not there
 */
const PICTURES: Record<Decoration, DecorationArt> = {
  [Decoration.Tree]: { sheet: TREE_SHEET, names: ['broadleaf'] },
  [Decoration.Pine]: { sheet: TREE_SHEET, names: ['pine'] },
  [Decoration.Palm]: { sheet: TREE_SHEET, names: ['palm'] },
  [Decoration.Cactus]: { sheet: DECORATION_SHEET, names: ['cactus', 'cactus-flower'] },
  [Decoration.Shrub]: {
    sheet: DECORATION_SHEET,
    names: ['shrub', 'shrub-spiky', 'shrub-tall', 'shrub-dark'],
  },
  [Decoration.Grass]: {
    sheet: DECORATION_SHEET,
    names: ['grass', 'grass-broad', 'grass-blades', 'grass-fern'],
  },
  [Decoration.Flower]: {
    sheet: DECORATION_SHEET,
    names: ['flower', 'flower-white', 'flower-blue'],
  },
  [Decoration.Rock]: { sheet: DECORATION_SHEET, names: ['rock', 'rock-pair', 'rock-brown'] },
  [Decoration.Boulder]: {
    sheet: DECORATION_SHEET,
    names: ['boulder', 'boulder-brown', 'boulder-stack'],
  },
  [Decoration.Reed]: { sheet: DECORATION_SHEET, names: ['reed'] },
  [Decoration.Coral]: {
    sheet: DECORATION_SHEET,
    names: ['coral', 'coral-brain', 'coral-red', 'coral-small'],
  },
  [Decoration.Ice]: {
    sheet: DECORATION_SHEET,
    names: ['ice', 'ice-shards', 'ice-shard', 'ice-floe'],
  },
  [Decoration.Mushroom]: { sheet: DECORATION_SHEET, names: ['mushroom', 'mushroom-red'] },
  [Decoration.Stump]: {
    sheet: DECORATION_SHEET,
    names: ['stump', 'log', 'stump-pale', 'log-moss'],
  },
};

/**
 * What a biome draws instead, where it draws something of its own.
 *
 * A forest and a savanna both put `Tree` on a cell and mean different
 * things by it, and the same trunk in both is what made every biome
 * look alike before there were sheets at all. The same argument reaches
 * the props: a boulder in a bog is grown over and one in a tundra is
 * under snow, and the rip drew both.
 *
 * A kind left out draws the list above, which is what makes this a
 * short table rather than one row per biome
 */
const BY_BIOME: Partial<Record<Biome, Partial<Record<Decoration, string[]>>>> = {
  // Ocean floor: coral, and the stones it grows on
  [Biome.CoralReef]: { [Decoration.Coral]: ['coral', 'coral-brain', 'coral-red'] },
  [Biome.PolarOcean]: { [Decoration.Ice]: ['ice-floe', 'ice-shards', 'ice'] },
  // Shore: the sea has taken the soil, so what grows is low and tough
  [Biome.Beach]: { [Decoration.Shrub]: ['shrub', 'shrub-tall', 'shrub-flower'] },
  [Biome.RockyCoast]: {
    [Decoration.Rock]: ['rock', 'rock-pair', 'rock-iced'],
    [Decoration.Shrub]: ['shrub-star', 'shrub', 'shrub-tall'],
  },
  // Wetlands: everything standing in water is grown over
  [Biome.Mangrove]: { [Decoration.Tree]: ['dark'] },
  [Biome.Swamp]: { [Decoration.Stump]: ['log-moss', 'stump', 'log'] },
  [Biome.Bog]: { [Decoration.Stump]: ['log-moss', 'stump', 'stump-pale'] },
  // Tropics: closed canopy, ferns under it, moss on the stone
  [Biome.TropicalRainforest]: { [Decoration.Tree]: ['jungle'] },
  [Biome.TropicalSeasonalForest]: {
    [Decoration.Tree]: ['olive'],
    [Decoration.Shrub]: ['shrub-fern', 'shrub', 'shrub-tall'],
  },
  // What survives a dry season: sparse, and more bark than leaf
  [Biome.Savanna]: {
    [Decoration.Tree]: ['dry'],
    [Decoration.Grass]: ['grass-blades', 'grass', 'grass-broad'],
    [Decoration.Rock]: ['rock-brown', 'rock', 'rock-pair'],
  },
  [Biome.Desert]: {
    [Decoration.Rock]: ['rock-brown', 'rock-pair', 'rock'],
    [Decoration.Boulder]: ['boulder-brown', 'boulder-stack', 'boulder'],
  },
  // Open country: one round tree standing on its own in the grass
  [Biome.Grassland]: {
    [Decoration.Tree]: ['round'],
    [Decoration.Flower]: ['flower', 'flower-white', 'flower-blue'],
  },
  [Biome.Shrubland]: {
    [Decoration.Shrub]: ['shrub', 'shrub-spiky', 'shrub-flower', 'shrub-tall'],
  },
  [Biome.Steppe]: { [Decoration.Grass]: ['grass-blades', 'grass-broad', 'grass'] },
  // Thin cover, and the season showing in it
  [Biome.Woodland]: {
    [Decoration.Tree]: ['autumn'],
    [Decoration.Flower]: ['flower-white', 'flower-blue', 'flower'],
  },
  [Biome.TemperateForest]: {
    [Decoration.Shrub]: ['shrub-fern', 'shrub-sapling', 'shrub'],
    [Decoration.Stump]: ['stump', 'log', 'log-moss', 'stump-dark'],
  },
  [Biome.TemperateRainforest]: {
    [Decoration.Tree]: ['jungle'],
    [Decoration.Stump]: ['log-moss', 'stump', 'log'],
  },
  // Cold: snow on everything that does not move
  [Biome.ColdDesert]: {
    [Decoration.Rock]: ['rock-snow', 'rock-pair', 'rock-iced'],
    [Decoration.Boulder]: ['boulder-snow', 'boulder-brown', 'boulder'],
    [Decoration.Shrub]: ['shrub-conifer', 'shrub-sapling', 'shrub-dark'],
  },
  [Biome.Taiga]: { [Decoration.Rock]: ['rock-snow', 'rock-iced', 'rock-pair'] },
  [Biome.Tundra]: {
    [Decoration.Rock]: ['rock-snow', 'rock-iced', 'rock-pair'],
    [Decoration.Shrub]: ['shrub-star', 'shrub-conifer', 'shrub-dark'],
  },
  [Biome.Glacier]: { [Decoration.Rock]: ['rock-iced', 'rock-snow', 'rock-pair'] },
  // Highlands: bare stone, and one tree line's worth of trees
  [Biome.Mountain]: {
    [Decoration.Pine]: ['pine-dark'],
    [Decoration.Boulder]: ['boulder', 'boulder-stack', 'boulder-brown'],
  },
  [Biome.AlpineTundra]: {
    [Decoration.Rock]: ['rock-snow', 'rock-iced', 'rock-pair'],
    [Decoration.Shrub]: ['shrub-star', 'shrub-dark', 'shrub-conifer'],
  },
  // Both of its trees are the mountain's: short, dark and holding on
  [Biome.MontaneForest]: {
    [Decoration.Tree]: ['fir'],
    [Decoration.Pine]: ['pine-blue'],
    [Decoration.Boulder]: ['boulder-moss', 'boulder', 'boulder-stack'],
  },
  [Biome.Volcano]: {
    [Decoration.Boulder]: ['boulder-stack', 'boulder', 'boulder-brown'],
    [Decoration.Rock]: ['rock-pair', 'rock-brown', 'rock'],
  },
  [Biome.Badlands]: {
    [Decoration.Boulder]: ['boulder-brown', 'boulder-stack', 'boulder'],
    [Decoration.Rock]: ['rock-brown', 'rock-pair', 'rock'],
  },
};

/**
 * How cold a biome has to be before its trees are drawn under snow.
 *
 * A line rather than a list, because the answer is already in the
 * world: a biome carries the temperature it was placed by, and a tree
 * standing in a taiga is under snow for the same reason the taiga is
 * there at all.
 *
 * It sits **below the mountain**, which is the one biome the line has
 * to be drawn against: the mountain's own tiles are bare rock and its
 * walls carry no snow, so a white pine standing on them read as a tree
 * from somewhere else. Only the taiga grows a tree above the line now
 */
export const SNOW_LINE = -0.3;

const SNOWY = new Set<Biome>(
  Object.entries(BIOME_CONFIGS)
    .filter(([, config]) => config.temperature <= SNOW_LINE)
    // The keys of a numeric-enum record come back as strings
    .map(([biome]) => Number(biome) as Biome),
);

/**
 * What each tree is drawn as where it snows.
 *
 * The rip draws the snow as a coat, not as a tree, so the sheet carries
 * every tree with its own coat already composed onto it. A snowbound
 * pine is that pine's own trunk and shadow under the snow, which is
 * what lets a cold biome keep the shade of pine it chose.
 *
 * A tree left out goes bare in the cold. The palm is the one that means
 * it: there is no coat cut for it and no beach cold enough to want one
 */
const SNOW: Partial<Record<string, string>> = {
  round: 'round-snow',
  broadleaf: 'broadleaf-snow',
  dark: 'dark-snow',
  jungle: 'jungle-snow',
  olive: 'olive-snow',
  autumn: 'autumn-snow',
  dry: 'dry-snow',
  fir: 'fir-snow',
  pine: 'pine-snow',
  'pine-dark': 'pine-dark-snow',
  'pine-blue': 'pine-blue-snow',
};

/** What counts as a tree to hide a grotto under, in order of preference. */
const TREE_KINDS = [Decoration.Tree, Decoration.Pine, Decoration.Palm];

/**
 * The tree a hidden grotto is hiding as.
 *
 * It is a tree and nothing else, which is the whole of how it hides:
 * the biome's own tree, drawn the way every other tree on the chunk is
 * drawn, snow included. What is behind it is only found by walking up
 * to it
 */
export function grottoPicture(biome: Biome, cell = 0): DecorationPicture {
  const grown = new Set(getBiomeDecorations(biome));
  // Whichever tree the biome actually grows, drawn exactly as that
  // tree: a taiga grows pines and nothing else, so a grotto standing
  // there as a broadleaf would be the one tree on the chunk that stood
  // out. A biome that grows no tree at all falls back to the plain one
  const kind = TREE_KINDS.find((one) => grown.has(one)) ?? Decoration.Tree;

  return decorationPicture(kind, biome, cell);
}

/**
 * The picture one piece of scenery is drawn as: the biome it stands in
 * says which pictures, and the cell it stands on says which of them.
 *
 * By the cell rather than at random so a chunk drawn again is the chunk
 * that was there, and so two rocks side by side are two rocks
 */
export default function decorationPicture(
  kind: Decoration,
  biome: Biome,
  cell = 0,
): DecorationPicture {
  const own = PICTURES[kind];
  const names = BY_BIOME[biome]?.[kind] ?? own.names;
  const name = names[Math.abs(cell) % names.length] ?? own.names[0];

  // Only the trees take snow. A rock in a taiga is a rock, and a white
  // one would be a rock nobody could see against the ground
  if (own.sheet !== TREE_SHEET || !SNOWY.has(biome)) {
    return { sheet: own.sheet, name };
  }
  return { sheet: own.sheet, name: SNOW[name] ?? name };
}

/** Every picture either sheet is expected to carry. */
export function decorationPictures(): DecorationPicture[] {
  const found = new Map<string, DecorationPicture>();
  const keep = (picture: DecorationPicture): void => {
    found.set(`${picture.sheet}/${picture.name}`, picture);
  };

  for (const art of Object.values(PICTURES)) {
    for (const name of art.names) {
      keep({ sheet: art.sheet, name });
    }
  }
  for (const overrides of Object.values(BY_BIOME)) {
    for (const [kind, names] of Object.entries(overrides)) {
      for (const name of names) {
        keep({ sheet: PICTURES[Number(kind) as Decoration].sheet, name });
      }
    }
  }
  // Every snowbound tree that is drawn at all. Named by the table
  // rather than reached through a biome, so the set does not shrink to
  // whichever cold biomes happen to grow a tree today
  for (const [tree, snow] of Object.entries(SNOW)) {
    if (snow != null && found.has(`${TREE_SHEET}/${tree}`)) {
      keep({ sheet: TREE_SHEET, name: snow });
    }
  }
  return [...found.values()];
}

/** Whether a biome's trees are drawn under snow. */
export function isSnowy(biome: Biome): boolean {
  return SNOWY.has(biome);
}

/**
 * The kinds a biome draws a picture of its own for. A kind here that
 * the biome does not actually grow is a row nothing ever reads
 */
export function biomeVariants(biome: Biome): Decoration[] {
  return Object.keys(BY_BIOME[biome] ?? {}).map(Number) as Decoration[];
}
