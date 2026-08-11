import type { Stats } from '../data/constants/stats';
import { STAT_ORDER, getHealthStat } from '../data/constants/stats';
import type { Items } from '../data/ids/items';
import { Statuses } from '../data/ids/status';
import type { Species } from '../data/ids/species';
import { BERRY_HEALS, BERRY_STATUS_CURES } from '../data/items/berries';
import { getSpeciesData } from '../data/species';

/**
 * What a battle leaves behind, and what it takes to put it right.
 *
 * A fight used to cost a party only what it ate. It costs health and
 * a status now: a pokemon walks out of a raid at whatever health it
 * had when the boss fell, still burned if it was burned, and walks
 * into the next fight that way. That is what makes a party something
 * a player looks after rather than an inventory row — and what makes
 * a berry worth carrying rather than selling.
 *
 * Health is stored as a plain number on the catch record, because
 * maximum health is derived: it changes when the pokemon levels,
 * evolves or has its values polished. Whenever the maximum moves, the
 * current health moves with it in proportion, so a pokemon that was
 * half hurt stays half hurt rather than being quietly healed or
 * quietly finished off.
 */

/**
 * The statuses a pokemon carries out of a battle. Everything else —
 * confusion, flinching, a substitute, the field's own effects — is
 * volatile: it belongs to the fight and ends with it.
 *
 * A unit can hold several of these at once — poisoned and asleep is
 * an ordinary way to come out of a raid — so the record keeps the
 * whole list rather than the worst of them
 */
export const NON_VOLATILE_STATUSES: Statuses[] = [
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Sleeping,
  Statuses.Paralyzed,
  Statuses.Burned,
  Statuses.Frozen,
];

const NON_VOLATILE = new Set(NON_VOLATILE_STATUSES);

/**
 * Whether the status is one a pokemon keeps after the fight
 */
export function isNonVolatileStatus(status: Statuses): boolean {
  return NON_VOLATILE.has(status);
}

/**
 * How a status reads to a player
 */
export const STATUS_NAMES: Record<Statuses, string> = {
  [Statuses.Seeding]: 'Seeded',
  [Statuses.Poisoned]: 'Poisoned',
  [Statuses.Sleeping]: 'Asleep',
  [Statuses.BadlyPoisoned]: 'Badly poisoned',
  [Statuses.Paralyzed]: 'Paralyzed',
  [Statuses.Minimized]: 'Minimized',
  [Statuses.Invulnerable]: 'Invulnerable',
  [Statuses.Raging]: 'Raging',
  [Statuses.Biding]: 'Biding',
  [Statuses.Confused]: 'Confused',
  [Statuses.Recharging]: 'Recharging',
  [Statuses.Substituted]: 'Substituted',
  [Statuses.Burned]: 'Burned',
  [Statuses.Trapped]: 'Trapped',
  [Statuses.Flinched]: 'Flinched',
  [Statuses.Frozen]: 'Frozen',
  [Statuses.FocusEnergy]: 'Focused',
  [Statuses.Infatuated]: 'Infatuated',
  [Statuses.Grounded]: 'Grounded',
  [Statuses.Floating]: 'Floating',
  [Statuses.Submerged]: 'Submerged',
  [Statuses.Dormant]: 'Dormant',
};

/**
 * Everything maximum health is derived from. A catch record satisfies
 * it, and so does a frozen snapshot of one
 */
export interface HealthSource {
  species: Species;
  level: number;
  ivs: Record<Stats, number>;
  effortValues: Record<Stats, number>;
}

/**
 * How much health the pokemon has when it is whole. It is derived
 * rather than stored, so it follows a level, an evolution or a
 * polished value on its own
 */
export function getMaxHealth(source: HealthSource): number {
  const stat = STAT_ORDER[0];

  return getHealthStat(
    source.level,
    getSpeciesData(source.species).stats[stat],
    source.ivs[stat],
    source.effortValues[stat],
  );
}

/**
 * Where health lands when the maximum moves. The share is what is
 * kept, not the number: a pokemon at 50 of 100 comes out at 60 of 120.
 *
 * Two edges are deliberate. A pokemon that was down stays down — an
 * evolution is not a revival — and a pokemon that was up, however
 * barely, never falls to zero from a rounding step it did not deserve
 */
export function rescaleHealth(health: number, from: number, to: number): number {
  if (health <= 0 || from <= 0) {
    return 0;
  }
  return Math.min(to, Math.max(1, Math.round((health / from) * to)));
}

/**
 * The health and status fields of a catch, which is all these rules
 * read
 */
export interface HealthState {
  health: number;
  /**
   * Every non-volatile status it is carrying, in the order the
   * fight left them. A pokemon can be several things at once
   */
  statuses: Statuses[];
}

/**
 * Whether the pokemon is down. A fainted catch cannot be fielded in
 * anything: a raid, a grunt's challenge, a lobby it is only waiting
 * in. Nothing in the game revives one on its own, so a berry is the
 * way back up
 */
export function isFainted(caught: HealthState): boolean {
  return caught.health <= 0;
}

/**
 * Whether the pokemon is anything other than whole and clean: hurt,
 * statused, or both. It is what an item asks before it is spent —
 * there is nothing for a berry to do to a pokemon in perfect shape
 */
export function needsCare(caught: HealthState & HealthSource): boolean {
  return caught.statuses.length > 0 || caught.health < getMaxHealth(caught);
}

/**
 * What a berry leaves a pokemon at when it is handed one outside a
 * battle: whatever it restores, and whatever it cures.
 *
 * The tables are the berry's own — the same ones the battle reads —
 * so an Oran is worth ten points here as well as there, and a Pecha
 * takes poison off wherever the poison came from. The battle's
 * threshold is not consulted: in a fight the berry decides when to
 * eat itself, and out of one the player decides.
 *
 * A berry works on a pokemon that is **down**, which is deliberate:
 * nothing in the game revives, so an Oran Berry is how a fainted
 * pokemon comes back rather than a dead end nobody can leave.
 *
 * Answers null when the berry would do nothing — the wrong cure, a
 * pokemon already whole, or a berry whose only use is inside a battle
 * (Leppa restores what this game spends as a cooldown, and Persim
 * cures something no record carries)
 */
export function healedByBerry(caught: HealthState & HealthSource, item: Items): HealthState | null {
  const max = getMaxHealth(caught);
  const restoring = BERRY_HEALS.get(item);
  const curing = BERRY_STATUS_CURES.get(item);
  let health = caught.health;

  if (restoring != null && health < max) {
    health = Math.min(max, health + Math.max(1, Math.floor(restoring.heal(max))));
  }

  // A berry takes off everything it covers rather than the first
  // thing it finds: a Lum on a pokemon that is poisoned *and*
  // paralyzed clears both, which is what it does in a battle too
  const statuses = curing == null ? caught.statuses : caught.statuses.filter((s) => !curing.has(s));

  return health === caught.health && statuses.length === caught.statuses.length
    ? null
    : { health, statuses };
}

/**
 * The statuses of a pokemon, kept to the ones a fight can leave
 * behind and to one of each. It is what a report is put through
 * before it is written: a battle that says a pokemon is confused is
 * describing something that ended with it
 */
export function carriedStatuses(statuses: Statuses[]): Statuses[] {
  return [...new Set(statuses.filter(isNonVolatileStatus))];
}
