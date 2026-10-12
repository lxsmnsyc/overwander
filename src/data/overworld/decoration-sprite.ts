// A record keyed by a const enum is indexed by number once the keys
// have been round-tripped through Object.entries; tsc wants the
// assertion back, tsgolint resolves the enum to number and calls it
// redundant
// oxlint-disable typescript/no-unnecessary-type-assertion
import * as v from 'valibot';
import type Biome from '../ids/biome';
import { BIOME_CONFIGS } from '../ids/biome';
import { DECORATION_IDS } from '../ids/names';
import { idOf } from '../yaml';
import Decoration, { BIOME_PICTURES, getBiomeDecorations } from './decoration';
import artFile from './decorations.yaml';
import snowFile from './snow-trees.yaml';

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

const ART = v.object({
  sheet: v.picklist([DECORATION_SHEET, TREE_SHEET]),
  pictures: v.array(v.string()),
});

/**
 * What each kind is drawn as where its biome says nothing more, out of
 * `decorations.yaml`.
 *
 * A list rather than one picture: a chunk rolls eight to twelve pieces
 * of scenery out of a list of three or four kinds, so one picture a
 * kind put the same rock down four times in a row
 */
const PICTURES: Record<number, DecorationArt> = {};

for (const [name, art] of Object.entries(v.parse(v.record(v.string(), ART), artFile))) {
  PICTURES[idOf<Decoration>(DECORATION_IDS, name, `decorations.yaml: ${name}`)] = {
    sheet: art.sheet,
    names: art.pictures,
  };
}

/**
 * What a biome draws instead, where it draws something of its own:
 * the `pictures` of its row in `biome-decorations.yaml`. A forest and
 * a savanna both put `Tree` on a cell and mean different things by it,
 * and a boulder in a bog is grown over where one in a tundra is under
 * snow
 */
const BY_BIOME: Record<number, Record<number, string[]>> = BIOME_PICTURES;

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

const SNOWY = (() => {
  const snowy = new Set<Biome>();

  for (const [biome, config] of Object.entries(BIOME_CONFIGS)) {
    if (config.temperature <= SNOW_LINE) {
      // The keys of a numeric-enum record come back as strings
      snowy.add(Number(biome) as Biome);
    }
  }
  return snowy;
})();

/**
 * What each tree is drawn as where it snows.
 *
 * The rip draws the snow as a coat, not as a tree, so the sheet carries
 * every tree with its own coat already composed onto it. A snowbound
 * pine is that pine's own trunk and shadow under the snow, which is
 * what lets a cold biome keep the shade of pine it chose.
 *
 * A tree left out goes bare in the cold. The palm is the one that means
 * it: there is no coat cut for it and no beach cold enough to want one.
 * The pairs are `snow-trees.yaml`
 */
const SNOW: Partial<Record<string, string>> = v.parse(v.record(v.string(), v.string()), snowFile);

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
  let kind = Decoration.Tree;

  for (const one of TREE_KINDS) {
    if (grown.has(one)) {
      kind = one;
      break;
    }
  }
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
  const names = (Object.hasOwn(BY_BIOME, biome) ? BY_BIOME[biome][kind] : undefined) ?? own.names;
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
        keep({ sheet: PICTURES[Number(kind)].sheet, name });
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
  const kinds: Decoration[] = [];

  for (const kind of Object.keys(Object.hasOwn(BY_BIOME, biome) ? BY_BIOME[biome] : {})) {
    kinds.push(Number(kind) as Decoration);
  }
  return kinds;
}
