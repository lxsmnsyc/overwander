import * as v from 'valibot';
import type Biome from '../ids/biome';
import { BIOME_IDS, PHENOMENON_IDS } from '../ids/names';
import Phenomenon from '../ids/phenomena';
import namesFile from '../text/en/phenomena.yaml';
import { idOf, idsOf } from '../yaml';
import biomesFile from './biome-phenomena.yaml';
import { ItemTypes, Items } from '../ids/items';
import { listItemsByType } from '../items';
import { GEMS } from '../items/gems';
import { MEGA_STONES } from '../items/mega-stones';
import { PLATES } from '../items/plates';
import { SIGNATURE_CRYSTALS, TYPE_CRYSTALS } from '../items/z-crystals';
import { isValuable } from '../items/valuables';
import { MAX_WING_STATS, WING_STATS } from '../items/wings';
import { type ItemPoolEntry, type ItemRarityGroups, getItemBand, getItemOdds } from './item-pool';
import { EvolutionMethod } from '../ids/species';
import { getRegisteredSpecies, getSpeciesData } from '../species';

export default Phenomenon;

/** What each phenomenon is called, out of `text/en/phenomena.yaml` */
export const PHENOMENON_NAMES: Record<number, string> = {};

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  PHENOMENON_NAMES[idOf<Phenomenon>(PHENOMENON_IDS, name, `text/en/phenomena.yaml: ${name}`)] =
    title;
}

/**
 * What each biome can host, drawn from uniformly every window, out of
 * `biome-phenomena.yaml`. A biome with an empty list never shows one
 */
export const BIOME_PHENOMENA: Record<number, Phenomenon[]> = {};

for (const [name, hosted] of Object.entries(
  v.parse(v.record(v.string(), v.array(v.string())), biomesFile),
)) {
  const where = `biome-phenomena.yaml: ${name}`;

  BIOME_PHENOMENA[idOf<Biome>(BIOME_IDS, name, where)] = idsOf<Phenomenon>(
    PHENOMENON_IDS,
    hosted,
    where,
  );
}

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
 * The floor under every value of a pokemon a phenomenon startles out,
 * the raid's and the sky's number. It stacks with a favouring sky
 */
export const PHENOMENON_MIN_IV = 9;

/**
 * How often a grotto holds an **egg** of the biome instead of the
 * pokemon it was going to hide. One in sixty-four, which is the rare
 * band's odds again — an egg found this way costs no walk to a nest
 * and no fee to a breeder, so it should be the thing a player
 * remembers finding
 */
export const GROTTO_EGG_CHANCE = 1 / 64;

const POOLS = new Map<Phenomenon, Items[]>();
const BANDED = new Map<Phenomenon, ItemRarityGroups>();

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
      // No `evolvesInto` entry names the cord: it stands in for the
      // trade itself, so a line asking for a trade is a line asking
      // for it
      if ((evolution.method & EvolutionMethod.Trade) !== 0) {
        asked.add(Items.LinkingCord);
      }
    }
  }
  const items: Items[] = [];

  for (const item of listItemsByType(ItemTypes.Evolution)) {
    if (asked.has(item)) {
      items.push(item);
    }
  }
  return items;
}

/**
 * What each of a phenomenon's drops is worth against the others.
 *
 * Most of a pool is peers, and a flat draw over peers is right: one
 * gem is worth about what the next gem is worth, and so is one plate,
 * one wing, one stone. The **valuables are not peers**. A shoal shell
 * and a relic crown are three thousand times apart in gold, and drawn
 * flat the crown came out of a ripple as often as the shell did.
 *
 * So they are weighted by what the ground already thinks of them,
 * which keeps the ladder defined in one place, and the group is left
 * holding exactly the share its count gave it: a dust cloud pays in
 * gold as often as it did, it just stops paying six hundred thousand
 * of it for a puddle
 */
function weigh(items: Items[]): ItemPoolEntry[] {
  let valuables = 0;
  let ground = 0;

  for (const item of items) {
    if (isValuable(item)) {
      valuables += 1;
      ground += getItemOdds(item);
    }
  }
  // Nothing to weight by leaves them as flat as everything else,
  // rather than as a pool nothing can be drawn from
  const share = ground === 0 ? 0 : valuables / ground;
  const entries: ItemPoolEntry[] = [];

  for (const item of items) {
    entries.push({ item, weight: isValuable(item) ? getItemOdds(item) * share : 1 });
  }
  return entries;
}

/**
 * Which of a phenomenon's bands an item is drawn in.
 *
 * The ground's answer, with three moved. **Base** goes to the floor,
 * because a phenomenon does not leave what a walk turns up anyway, and
 * so does an item the ground hides **nowhere** — a gem, which no cache
 * has ever held — since the floor is where a thing with no scarcity of
 * its own belongs.
 *
 * The ground's **special** goes down to prized rather than to the
 * floor. A pool picked by type reaches exactly one of the ground's
 * specials, and a band of one hands its whole width to whatever stands
 * in it. The special band holds the Max wings alone
 */
function bandOf(item: Items): keyof ItemRarityGroups {
  // The Max wings are a shadow's own special, found nowhere else
  if (MAX_WING_STATS.has(item)) {
    return 'special';
  }
  const band = getItemBand(item);

  if (band === 'special') {
    return 'prized';
  }
  // Scarce is the ground's step, not a phenomenon's: a shadow drops
  // only wings, and a band of nothing but wings above an empty floor
  // would leave most shadows empty-handed
  return band == null || band === 'base' || band === 'scarce' ? 'uncommon' : band;
}

/**
 * The pool split into the bands a drop is drawn through, weighted
 * inside each. Built and kept the same way the list is.
 *
 * Two draws rather than one: the band says how good the find is, and
 * the weights say which find it is. That is the same shape the ground
 * uses, one band richer, and it is why a relic crown coming out of a
 * ripple is a story rather than an afternoon
 */
export function getPhenomenonGroups(phenomenon: Phenomenon): ItemRarityGroups {
  const built = BANDED.get(phenomenon);

  if (built != null) {
    return built;
  }
  const sorted = new Map<keyof ItemRarityGroups, Items[]>();

  for (const item of getPhenomenonItems(phenomenon)) {
    const band = bandOf(item);

    sorted.set(band, [...(sorted.get(band) ?? []), item]);
  }
  const groups: ItemRarityGroups = {
    // Never drawn from: the odds leave it no width
    base: [],
    special: weigh(sorted.get('special') ?? []),
    uncommon: weigh(sorted.get('uncommon') ?? []),
    scarce: [],
    rare: weigh(sorted.get('rare') ?? []),
    prized: weigh(sorted.get('prized') ?? []),
  };

  BANDED.set(phenomenon, groups);
  return groups;
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
      ...MEGA_STONES.keys(),
      ...TYPE_CRYSTALS.keys(),
      ...SIGNATURE_CRYSTALS.keys(),
      Items.DynamaxBand,
      ...listItemsByType(ItemTypes.Valuable),
    ];
  }
  if (phenomenon === Phenomenon.RipplingWater) {
    return listItemsByType(ItemTypes.Valuable);
  }
  // A grotto hides a pokemon and nothing a player picks up, so it is
  // the empty list the fall-through gives
  return phenomenon === Phenomenon.FlyingShadow
    ? [...WING_STATS.keys(), ...MAX_WING_STATS.keys()]
    : [];
}
