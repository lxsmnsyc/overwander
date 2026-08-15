import { TYPE_NAMES } from '../constants/types';
import { ItemFlags, ItemTypes, getMachineItem } from '../ids/items';
import type { Moves } from '../ids/moves';
import { MoveCategories } from '../ids/moves';
import { getMoveData } from '../moves';
import { getRegisteredSpecies, getSpeciesData } from '../species';
import { registerItem } from './__create';

/**
 * A machine's price follows the move it teaches: a status or weak
 * move is cheap, a solid attack costs more, and the heaviest hitters
 * are what a player saves up for
 */
const STRONG_MOVE_POWER = 90;
const SOLID_MOVE_POWER = 60;

const CHEAP_MACHINE_PRICE = 2000;
const SOLID_MACHINE_PRICE = 5000;
const STRONG_MACHINE_PRICE = 12_000;

/**
 * Selling one back fetches half of what it cost
 */
const MACHINE_RESALE = 0.5;

function priceOf(move: Moves): number {
  const data = getMoveData(move);

  if (data.category === MoveCategories.Status || (data.power ?? 0) < SOLID_MOVE_POWER) {
    return CHEAP_MACHINE_PRICE;
  }
  return (data.power ?? 0) >= STRONG_MOVE_POWER ? STRONG_MACHINE_PRICE : SOLID_MACHINE_PRICE;
}

/**
 * Every move any registered species can be taught, in dex order and
 * without repeats
 */
export function getTeachableMoves(): Moves[] {
  const moves = new Set<Moves>();

  for (const species of getRegisteredSpecies()) {
    for (const move of getSpeciesData(species).learnSet.teachable) {
      moves.add(move);
    }
  }
  return [...moves];
}

/**
 * Technical machines: one per teachable move, generated from the
 * species learn sets rather than written out, so a move added to any
 * species brings its machine along. They are stocked by the market
 * and never found — the overworld's caches and grottos hide balls,
 * stones and valuables instead.
 *
 * Species have to be registered first — the machines are read off
 * their learn sets.
 */
export default function registerMachines(): void {
  for (const move of getTeachableMoves()) {
    const buy = priceOf(move);

    registerItem(getMachineItem(move), {
      name: `TM ${getMoveData(move).name}`,
      description: `Teaches ${getMoveData(move).name} to a pokemon that can learn it. Spent on use.`,
      type: ItemTypes.Machine,
      // A machine is drawn in the colours of the move it teaches,
      // which is the whole of what a machine looks like: the `tm`
      // sheet holds one per type
      icon: `tm/${TYPE_NAMES[getMoveData(move).type].toLowerCase()}`,
      // A machine is used on a pokemon and spent by the teaching
      flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy,
      sell: buy * MACHINE_RESALE,
    });
  }
}
