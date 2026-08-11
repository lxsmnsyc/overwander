import { ItemFlags, ItemTypes, Items } from '../ids/items';
import { NON_VOLATILE_STATUSES, Statuses } from '../ids/status';
import { registerItem } from './__create';

/**
 * Medicine: what a party is put right with between fights.
 *
 * A battle leaves health and a status behind, and the three kinds
 * here are the three answers to that. A **potion** gives health back.
 * A **cure** takes a status off. A **revive** brings a fainted pokemon
 * round, which nothing else in the bag does — a potion handed to a
 * pokemon that is already down does nothing, exactly as it does not
 * in the mainline games.
 *
 * The **herbal** four answer the same three problems more cheaply and
 * charge for it in friendship: they are the choice between a party
 * put right today and a pokemon that thinks well of the player a
 * month from now.
 *
 * Unlike a berry, none of it is held: medicine is used, and a unit
 * cannot carry a potion into a raid to drink mid-fight. That is what
 * keeps berries worth holding.
 *
 * What each one does is written once here and read by both sides —
 * the dialog offering it and the server spending it — the same way
 * the berry tables are.
 */

/**
 * How much a full restore gives back. It is not a real number: it is
 * "as much as there is", clamped by the pool it is poured into
 */
const FULL = Number.POSITIVE_INFINITY;

/**
 * Everything a Full Heal or a Full Restore takes off
 */
const EVERY_STATUS = new Set(NON_VOLATILE_STATUSES);

export interface MedicineEffect {
  /**
   * Health it gives back, or `FULL` for as much as the pool holds.
   * Zero for something that only cures
   */
  restore: number;
  /**
   * What it takes off, or null when it cures nothing
   */
  cures: Set<Statuses> | null;
  /**
   * The share of the pool it brings a **fainted** pokemon back at.
   * Zero for everything that is not a revive — and a revive is the
   * only thing that works on a pokemon at zero
   */
  revives: number;
  /**
   * How bitter it is, in mouthfuls: how many times the herbal
   * friendship loss is taken when it goes down. Zero for everything
   * that is not herbal, which is everything a shop bottles
   */
  bitter?: number;
}

/**
 * Every medicine and what it does. A potion's numbers are the
 * mainline's, which are tuned against the same stat formula this game
 * derives health from
 */
export const MEDICINES = new Map<Items, MedicineEffect>([
  [Items.Potion, { restore: 20, cures: null, revives: 0 }],
  [Items.SuperPotion, { restore: 60, cures: null, revives: 0 }],
  [Items.HyperPotion, { restore: 120, cures: null, revives: 0 }],
  [Items.MaxPotion, { restore: FULL, cures: null, revives: 0 }],
  // The one item that does both halves of the job at once, which is
  // what makes it worth what it costs
  [Items.FullRestore, { restore: FULL, cures: EVERY_STATUS, revives: 0 }],
  [
    Items.Antidote,
    { restore: 0, cures: new Set([Statuses.Poisoned, Statuses.BadlyPoisoned]), revives: 0 },
  ],
  [Items.BurnHeal, { restore: 0, cures: new Set([Statuses.Burned]), revives: 0 }],
  [Items.IceHeal, { restore: 0, cures: new Set([Statuses.Frozen]), revives: 0 }],
  [Items.Awakening, { restore: 0, cures: new Set([Statuses.Sleeping]), revives: 0 }],
  [Items.ParalyzeHeal, { restore: 0, cures: new Set([Statuses.Paralyzed]), revives: 0 }],
  [Items.FullHeal, { restore: 0, cures: EVERY_STATUS, revives: 0 }],
  // A revive brings a pokemon back on half a pool; the Max on a whole
  // one. Neither does anything to a pokemon that is still standing
  [Items.Revive, { restore: 0, cures: null, revives: 0.5 }],
  [Items.MaxRevive, { restore: 0, cures: null, revives: 1 }],
  // The herbal four. Each one out-does the bottle it stands beside —
  // the powder beats a Super Potion, the root beats a Hyper Potion,
  // the herb is a Max Revive — and each is paid for in what the
  // pokemon thinks of the player rather than in gold
  [Items.EnergyPowder, { restore: 50, cures: null, revives: 0, bitter: 1 }],
  [Items.EnergyRoot, { restore: 200, cures: null, revives: 0, bitter: 2 }],
  [Items.HealPowder, { restore: 0, cures: EVERY_STATUS, revives: 0, bitter: 1 }],
  [Items.RevivalHerb, { restore: 0, cures: null, revives: 1, bitter: 3 }],
]);

/**
 * Whether the item is medicine
 */
export function isMedicine(item: Items): boolean {
  return MEDICINES.has(item);
}

/**
 * Whether the item is one of the revives — the only things that lift
 * a fainted pokemon
 */
export function isRevive(item: Items): boolean {
  return (MEDICINES.get(item)?.revives ?? 0) > 0;
}

/**
 * How many mouthfuls of bitterness the item costs, for the friendship
 * that is docked when it goes down. Zero for anything that is not
 * herbal, so every caller can ask without checking first
 */
export function bitterness(item: Items): number {
  return MEDICINES.get(item)?.bitter ?? 0;
}

/**
 * Whether the item is herbal — cheap, effective, and paid for in
 * friendship
 */
export function isHerbal(item: Items): boolean {
  return bitterness(item) > 0;
}

const MEDICINE_RESALE = 0.5;

/**
 * Registered with the market in mind: medicine is the one thing gold
 * is always worth spending on, so unlike a berry or a bottle cap it
 * carries a price
 */
function registerMedicine(item: Items, name: string, buy: number): void {
  registerItem(item, {
    name,
    type: ItemTypes.Medicine,
    // Used on a pokemon and spent doing it; never held, so nothing
    // drinks a potion mid-battle
    flags: ItemFlags.Usable | ItemFlags.Consumable | ItemFlags.Marketable,
    buy,
    sell: buy * MEDICINE_RESALE,
  });
}

export default function registerMedicines(): void {
  registerMedicine(Items.Potion, 'Potion', 300);
  registerMedicine(Items.SuperPotion, 'Super Potion', 700);
  registerMedicine(Items.HyperPotion, 'Hyper Potion', 1500);
  registerMedicine(Items.MaxPotion, 'Max Potion', 2500);
  registerMedicine(Items.FullRestore, 'Full Restore', 3000);
  registerMedicine(Items.Antidote, 'Antidote', 200);
  registerMedicine(Items.BurnHeal, 'Burn Heal', 200);
  registerMedicine(Items.IceHeal, 'Ice Heal', 200);
  registerMedicine(Items.Awakening, 'Awakening', 200);
  registerMedicine(Items.ParalyzeHeal, 'Paralyze Heal', 200);
  registerMedicine(Items.FullHeal, 'Full Heal', 600);
  // A revive is what a lost raid costs, so it is priced like one
  registerMedicine(Items.Revive, 'Revive', 2000);
  registerMedicine(Items.MaxRevive, 'Max Revive', 4000);
  // The herbal four are the cheap answer to all three problems, and
  // every price here undercuts the bottle it competes with. What they
  // cost instead is friendship, which is the one thing gold cannot buy
  // back — a groomer sells half of what is left, never the last of it
  registerMedicine(Items.EnergyPowder, 'Energy Powder', 500);
  registerMedicine(Items.EnergyRoot, 'Energy Root', 800);
  registerMedicine(Items.HealPowder, 'Heal Powder', 450);
  registerMedicine(Items.RevivalHerb, 'Revival Herb', 2800);
}
