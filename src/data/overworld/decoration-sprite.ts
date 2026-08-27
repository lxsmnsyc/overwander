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

/**
 * What each kind is drawn as where its biome says nothing more.
 *
 * Written out rather than derived from `DECORATION_NAMES`: that table
 * is what a player is told a thing is, and renaming one should not
 * repoint it at a picture that is not there
 */
const PICTURES: Record<Decoration, DecorationPicture> = {
  [Decoration.Tree]: { sheet: TREE_SHEET, name: 'broadleaf' },
  [Decoration.Pine]: { sheet: TREE_SHEET, name: 'pine' },
  [Decoration.Palm]: { sheet: TREE_SHEET, name: 'palm' },
  [Decoration.Cactus]: { sheet: DECORATION_SHEET, name: 'cactus' },
  [Decoration.Shrub]: { sheet: DECORATION_SHEET, name: 'shrub' },
  [Decoration.Grass]: { sheet: DECORATION_SHEET, name: 'grass' },
  [Decoration.Flower]: { sheet: DECORATION_SHEET, name: 'flower' },
  [Decoration.Rock]: { sheet: DECORATION_SHEET, name: 'rock' },
  [Decoration.Boulder]: { sheet: DECORATION_SHEET, name: 'boulder' },
  [Decoration.Reed]: { sheet: DECORATION_SHEET, name: 'reed' },
  [Decoration.Coral]: { sheet: DECORATION_SHEET, name: 'coral' },
  [Decoration.Ice]: { sheet: DECORATION_SHEET, name: 'ice' },
  [Decoration.Mushroom]: { sheet: DECORATION_SHEET, name: 'mushroom' },
  [Decoration.Stump]: { sheet: DECORATION_SHEET, name: 'stump' },
};

/**
 * The tree a biome grows, where it grows one of its own.
 *
 * A forest and a savanna both put `Tree` on a cell and mean different
 * things by it, and the same trunk in both is what made every biome
 * look alike before there were sheets at all. Only trees vary: a rock
 * is a rock on a mountain and in a bog, and giving one a per-biome tint
 * would be colouring the sheet rather than furnishing the world.
 *
 * A biome left out draws the picture above, which is what makes this a
 * short table rather than one row per biome
 */
const BY_BIOME: Partial<Record<Biome, Partial<Record<Decoration, string>>>> = {
  // Open country: one round tree standing on its own in the grass
  [Biome.Grassland]: { [Decoration.Tree]: 'round' },
  // Thin cover, and the season showing in it
  [Biome.Woodland]: { [Decoration.Tree]: 'autumn' },
  // What survives a dry season: sparse, and more bark than leaf
  [Biome.Savanna]: { [Decoration.Tree]: 'dry' },
  [Biome.TropicalSeasonalForest]: { [Decoration.Tree]: 'olive' },
  // Closed canopy, which is the whole of what a rainforest is
  [Biome.TropicalRainforest]: { [Decoration.Tree]: 'jungle' },
  [Biome.TemperateRainforest]: { [Decoration.Tree]: 'jungle' },
  // Standing in the water it grows out of, so the darkest of them
  [Biome.Mangrove]: { [Decoration.Tree]: 'dark' },
  // Both of its trees are the mountain's: short, dark and holding on
  [Biome.MontaneForest]: { [Decoration.Tree]: 'fir', [Decoration.Pine]: 'pine-blue' },
  [Biome.Mountain]: { [Decoration.Pine]: 'pine-dark' },
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
export function grottoPicture(biome: Biome): DecorationPicture {
  const grown = new Set(getBiomeDecorations(biome));
  // Whichever tree the biome actually grows, drawn exactly as that
  // tree: a taiga grows pines and nothing else, so a grotto standing
  // there as a broadleaf would be the one tree on the chunk that stood
  // out. A biome that grows no tree at all falls back to the plain one
  const kind = TREE_KINDS.find((one) => grown.has(one)) ?? Decoration.Tree;

  return decorationPicture(kind, biome);
}

/**
 * The picture one piece of scenery is drawn as, in the biome it is
 * standing in
 */
export default function decorationPicture(kind: Decoration, biome: Biome): DecorationPicture {
  const own = PICTURES[kind];
  const name = BY_BIOME[biome]?.[kind] ?? own.name;

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

  for (const picture of Object.values(PICTURES)) {
    keep(picture);
  }
  for (const overrides of Object.values(BY_BIOME)) {
    for (const [kind, name] of Object.entries(overrides)) {
      keep({ sheet: PICTURES[Number(kind) as Decoration].sheet, name });
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
