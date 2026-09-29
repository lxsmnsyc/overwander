import { TYPE_NAMES } from '../constants/types';
import { ItemFlags, ItemTypes, getMachineItem } from '../ids/items';
import { MoveCategories, Moves } from '../ids/moves';
import { TUTOR_ONLY_MOVES, getMoveData } from '../moves';
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
 * Every move a machine is stocked for: what any registered species can
 * be taught, in dex order and without repeats, less the tutor's own
 */
export function getTeachableMoves(): Moves[] {
  const moves = new Set<Moves>();

  for (const species of getRegisteredSpecies()) {
    for (const move of getSpeciesData(species).learnSet.teachable) {
      if (!TUTOR_ONLY_MOVES.has(move)) {
        moves.add(move);
      }
    }
  }
  return [...moves];
}

/**
 * Machines no longer stocked, for moves that were filed as teachable
 * by mistake: egg moves, which no species can now be taught. They stay
 * registered so a bag still holding one can read it
 */
const RETIRED_MACHINE_MOVES: Moves[] = [
  Moves.PoisonPowder,
  Moves.Growth,
  Moves.Bite,
  Moves.StunSpore,
  Moves.HornAttack,
  Moves.Recover,
  Moves.Slam,
  Moves.Constrict,
  Moves.RockThrow,
  Moves.Stomp,
  Moves.Mist,
  Moves.AcidArmor,
  Moves.MindReader,
  Moves.Flail,
  Moves.FeintAttack,
  Moves.Spark,
  Moves.Pursuit,
  Moves.Yawn,
  Moves.Astonish,
  Moves.Feint,
  Moves.HeadSmash,
  Moves.GuardSplit,
];

/**
 * The machines nobody stocks any more: the tutor's own and the retired
 * ones. A vendor buys one back for everything it cost
 */
export function getWithdrawnMachineMoves(): Moves[] {
  return [...TUTOR_ONLY_MOVES, ...RETIRED_MACHINE_MOVES];
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

    registerMachine(move, {
      description: `Teaches ${getMoveData(move).name} to a pokemon that can learn it. Spent on use.`,
      flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
      buy,
      sell: buy * MACHINE_RESALE,
    });
  }
  // Off the market, and bought back at the full price so nobody who
  // paid for one is out of pocket
  for (const move of getWithdrawnMachineMoves()) {
    registerMachine(move, {
      description: `Teaches ${getMoveData(move).name} to a pokemon that can learn it. No longer sold; a vendor buys it back for what it cost.`,
      flags: ItemFlags.Usable | ItemFlags.Consumable,
      buy: priceOf(move),
      sell: priceOf(move),
    });
  }
}

function registerMachine(
  move: Moves,
  terms: { description: string; flags: ItemFlags; buy: number; sell: number },
): void {
  registerItem(getMachineItem(move), {
    name: `TM ${getMoveData(move).name}`,
    // A machine is drawn in the colours of the move it teaches, which is
    // the whole of what a machine looks like: the `tm` sheet holds one per type
    icon: `tm/${TYPE_NAMES[getMoveData(move).type].toLowerCase()}`,
    type: ItemTypes.Machine,
    ...terms,
  });
}
