import { Items } from '../ids/items';
import { NON_VOLATILE_STATUSES, Statuses } from '../ids/status';
import { itemText } from './__create';

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

/**
 * The word for what a cure takes off, by its template: the two
 * poisons share a word, so an Antidote reads as one cure rather than
 * two
 */
const CURE_WORDS = new Map<Statuses, string>([
  [Statuses.Poisoned, 'poison'],
  [Statuses.BadlyPoisoned, 'poison'],
  [Statuses.Sleeping, 'sleep'],
  [Statuses.Paralyzed, 'paralysis'],
  [Statuses.Burned, 'burn'],
  [Statuses.Frozen, 'freezing'],
]);

// How a bitter cost paid more than once reads, by its template
const BITTER_TIMES: { [bitter: number]: string } = {
  1: 'bitter',
  2: 'bitterTwice',
  3: 'bitterThrice',
};

/**
 * What a medicine does, in one line, worked out of its own entry
 * above rather than written twice: a potion that is retuned describes
 * itself correctly without being edited
 */
export function describeMedicine(item: Items): string {
  const effect = MEDICINES.get(item);

  if (effect == null) {
    throw new Error(`Item ${item} is not medicine`);
  }

  const parts: string[] = [];

  if (effect.revives >= 1) {
    parts.push(itemText('medicine', 'reviveFull'));
  } else if (effect.revives === 0.5) {
    parts.push(itemText('medicine', 'reviveHalf'));
  } else if (effect.revives > 0) {
    parts.push(itemText('medicine', 'revive', { percent: Math.round(effect.revives * 100) }));
  } else if (effect.restore === FULL) {
    parts.push(itemText('medicine', 'restoreAll'));
  } else if (effect.restore > 0) {
    parts.push(itemText('medicine', 'restore', { restore: effect.restore }));
  }

  if (effect.cures === EVERY_STATUS) {
    parts.push(itemText('medicine', 'cureAll'));
  } else if (effect.cures != null) {
    const cured = new Set<string>();

    for (const status of effect.cures) {
      cured.add(itemText('medicine', CURE_WORDS.get(status) ?? ''));
    }

    parts.push(itemText('medicine', 'cure', { cures: [...cured].join(' and ') }));
  }

  if (effect.bitter != null) {
    parts.push(itemText('medicine', BITTER_TIMES[effect.bitter] ?? 'bitter'));
  }
  return parts.join(' ');
}
