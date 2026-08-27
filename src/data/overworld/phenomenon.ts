import Biome from '../ids/biome';
import { ItemTypes, type Items } from '../ids/items';
import { listItemsByType } from '../items';
import { GEMS } from '../items/gems';
import { PLATES } from '../items/plates';
import { WING_STATS } from '../items/wings';
import { getRegisteredSpecies, getSpeciesData } from '../species';

/**
 * Something happening on a patch of ground rather than something
 * buried in it.
 *
 * A phenomenon is the one landmark whose *kind* is rolled rather than
 * fixed: the cell is the chunk's own like every other landmark, but
 * what is going on there is drawn from what the biome can host and
 * changes every hour. Water ripples where there is water; dust rises
 * where there is dust; a shadow passes over open country.
 *
 * Every one of them can turn out to be a pokemon — the uncommon and
 * rare bands only, so a phenomenon is worth walking to — and every one
 * but the grotto can turn out to be something to carry home instead.
 * What that something is is the phenomenon's own: what a dust cloud
 * kicks up is not what washes up on a ripple
 */
const enum Phenomenon {
  /**
   * A tucked-away hollow. It is the only one with no item in it at
   * all: what a grotto hides is a pokemon, and once in a great while
   * an egg of the biome's own
   */
  HiddenGrotto = 0,
  /**
   * Dust rising off dry ground. The richest of them: what it kicks up
   * is anything the ground had in it — a gem, a stone, a plate or a
   * valuable
   */
  DustCloud = 1,
  /**
   * A ring spreading on open water. What surfaces is a valuable: the
   * pearls and star pieces the sea keeps
   */
  RipplingWater = 2,
  /**
   * Something passing overhead. What it drops is a wing, which is the
   * only training a pokemon ever gets that its levels did not pay for
   */
  FlyingShadow = 3,
}

export default Phenomenon;

export const PHENOMENON_NAMES: Record<Phenomenon, string> = {
  [Phenomenon.HiddenGrotto]: 'Hidden Grotto',
  [Phenomenon.DustCloud]: 'Dust Cloud',
  [Phenomenon.RipplingWater]: 'Rippling Water',
  [Phenomenon.FlyingShadow]: 'Flying Shadow',
};

/**
 * What each biome can host, drawn from uniformly every window.
 *
 * It is the ground that decides: open water ripples and does nothing
 * else, a desert raises dust and nothing else, and the places that are
 * two things at once — a beach, a mangrove — host both of theirs. A
 * biome with an empty list never shows one at all, which is what
 * `Beyond` is: nothing lives there to be startled
 */
export const BIOME_PHENOMENA: Record<Biome, Phenomenon[]> = {
  [Biome.DeepOcean]: [Phenomenon.RipplingWater],
  [Biome.Ocean]: [Phenomenon.RipplingWater],
  [Biome.CoralReef]: [Phenomenon.RipplingWater],
  // Sand and sea, so both
  [Biome.Beach]: [Phenomenon.RipplingWater, Phenomenon.DustCloud],
  [Biome.Mangrove]: [Phenomenon.RipplingWater, Phenomenon.HiddenGrotto],
  [Biome.Swamp]: [Phenomenon.RipplingWater, Phenomenon.HiddenGrotto],
  [Biome.TropicalRainforest]: [Phenomenon.HiddenGrotto, Phenomenon.FlyingShadow],
  [Biome.TropicalSeasonalForest]: [Phenomenon.HiddenGrotto, Phenomenon.FlyingShadow],
  [Biome.Savanna]: [Phenomenon.DustCloud, Phenomenon.FlyingShadow],
  [Biome.Desert]: [Phenomenon.DustCloud],
  [Biome.Shrubland]: [Phenomenon.HiddenGrotto, Phenomenon.DustCloud],
  [Biome.Grassland]: [Phenomenon.HiddenGrotto, Phenomenon.FlyingShadow],
  [Biome.TemperateForest]: [Phenomenon.HiddenGrotto, Phenomenon.FlyingShadow],
  [Biome.TemperateRainforest]: [Phenomenon.HiddenGrotto, Phenomenon.RipplingWater],
  [Biome.ColdDesert]: [Phenomenon.DustCloud],
  [Biome.Taiga]: [Phenomenon.HiddenGrotto, Phenomenon.FlyingShadow],
  [Biome.Tundra]: [Phenomenon.DustCloud, Phenomenon.FlyingShadow],
  [Biome.Mountain]: [Phenomenon.DustCloud, Phenomenon.FlyingShadow],
  [Biome.AlpineTundra]: [Phenomenon.DustCloud, Phenomenon.FlyingShadow],
  [Biome.Volcano]: [Phenomenon.DustCloud, Phenomenon.FlyingShadow],
  [Biome.Glacier]: [Phenomenon.DustCloud],
  [Biome.Woodland]: [Phenomenon.HiddenGrotto, Phenomenon.FlyingShadow],
  [Biome.Steppe]: [Phenomenon.DustCloud, Phenomenon.FlyingShadow],
  [Biome.MontaneForest]: [Phenomenon.HiddenGrotto, Phenomenon.FlyingShadow],
  [Biome.PolarOcean]: [Phenomenon.RipplingWater],
  [Biome.Badlands]: [Phenomenon.DustCloud, Phenomenon.FlyingShadow],
  [Biome.RockyCoast]: [Phenomenon.RipplingWater, Phenomenon.FlyingShadow],
  [Biome.Bog]: [Phenomenon.RipplingWater, Phenomenon.HiddenGrotto],
  [Biome.KelpForest]: [Phenomenon.RipplingWater],
  // Nothing lives beyond the map, so nothing is startled out of it
  [Biome.Beyond]: [],
};

/**
 * How often a phenomenon turns out to be something to pick up rather
 * than something to meet. Half, so neither answer is the one a player
 * is really walking towards — the grotto is the exception, and has no
 * item side at all
 */
export const PHENOMENON_ITEM_CHANCE = 0.5;

/**
 * How often the pokemon behind one is drawn from the **rare** band
 * rather than the uncommon one. It is the rare spawn band's own odds:
 * a phenomenon lifts the floor rather than the ceiling
 */
export const PHENOMENON_RARE_CHANCE = 1 / 8;

/**
 * How often a grotto holds an **egg** of the biome instead of the
 * pokemon it was going to hide. One in sixty-four, which is the rare
 * band's odds again — an egg found this way costs no walk to a nest
 * and no fee to a breeder, so it should be the thing a player
 * remembers finding
 */
export const GROTTO_EGG_CHANCE = 1 / 64;

const POOLS = new Map<Phenomenon, Items[]>();

/**
 * What this phenomenon can leave behind, worked out on the first ask —
 * the item registry is filled by `registerItems()`, so a list built at
 * import time would be a list of nothing.
 *
 * A grotto answers an empty list: it has no item side, and a caller
 * can ask without knowing which one it is holding
 */
export function getPhenomenonItems(phenomenon: Phenomenon): Items[] {
  const built = POOLS.get(phenomenon);

  if (built != null) {
    return built;
  }

  const pool = buildPool(phenomenon);

  POOLS.set(phenomenon, pool);
  return pool;
}

/**
 * The evolution items some registered line actually asks for.
 *
 * Most of the family is registered against generations this game has
 * not: a Reaper Cloth and a Dawn Stone have a name, a picture and
 * nothing on earth to spend them on. Kicking up the whole type made a
 * dust cloud mostly a disappointment, so it is derived from the lines
 * rather than listed, and a stone earns its place the day something
 * asks for it
 */
function spendableStones(): Items[] {
  const asked = new Set<Items>();

  for (const species of getRegisteredSpecies()) {
    for (const evolution of getSpeciesData(species).evolvesInto ?? []) {
      if (evolution.item != null) {
        asked.add(evolution.item);
      }
    }
  }
  return listItemsByType(ItemTypes.Evolution).filter((item) => asked.has(item));
}

function buildPool(phenomenon: Phenomenon): Items[] {
  // Everything the ground itself holds. The stones are in here as much
  // as the nuggets, which is what makes a dust cloud worth crossing a
  // desert for
  if (phenomenon === Phenomenon.DustCloud) {
    return [
      ...GEMS.keys(),
      ...spendableStones(),
      ...PLATES.keys(),
      ...listItemsByType(ItemTypes.Valuable),
    ];
  }
  if (phenomenon === Phenomenon.RipplingWater) {
    return listItemsByType(ItemTypes.Valuable);
  }
  // A grotto hides a pokemon and nothing a player picks up, so it is
  // the empty list the fall-through gives
  return phenomenon === Phenomenon.FlyingShadow ? [...WING_STATS.keys()] : [];
}
