import { Stats, getHealthStat, getIV, getOtherStat } from '../data/constants/stats';
import type { Items } from '../data/ids/items';
import { getNatureFactor } from '../data/ids/natures';
import { NON_VOLATILE_MASK, NON_VOLATILE_STATUSES, Statuses, statusFlag } from '../data/ids/status';
import type { Species } from '../data/ids/species';
import { BERRY_HEALS, BERRY_STATUS_CURES } from '../data/items/berries';
import { MEDICINES } from '../data/items/medicine';
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
 * The statuses a pokemon carries out of a battle live with the ids,
 * since what they are is a property of the statuses rather than of
 * the catch. A unit can hold several at once — poisoned and asleep is
 * an ordinary way to come out of a raid — so the record keeps the
 * whole list rather than the worst of them
 */
export { NON_VOLATILE_STATUSES };

/**
 * Whether the status is one a pokemon keeps after the fight
 */
export function isNonVolatileStatus(status: Statuses): boolean {
  return statusFlag(status) !== 0;
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
  [Statuses.Switching]: 'Switching',
  [Statuses.Protected]: 'Protected',
  [Statuses.Enduring]: 'Enduring',
  [Statuses.Cornered]: 'Cornered',
  [Statuses.Nightmared]: 'Nightmare',
  [Statuses.Perishing]: 'Perishing',
  [Statuses.Bonded]: 'Bonded',
  [Statuses.Cursed]: 'Cursed',
  [Statuses.Encored]: 'Encored',
  [Statuses.Identified]: 'Identified',
  [Statuses.Comatose]: 'Comatose',
  [Statuses.Taunted]: 'Taunted',
  [Statuses.Tormented]: 'Tormented',
  [Statuses.Imprisoned]: 'Imprisoned',
  [Statuses.Rooted]: 'Rooted',
  [Statuses.Drowsy]: 'Drowsy',
  [Statuses.Centered]: 'Centered',
  [Statuses.Coated]: 'Coated',
  [Statuses.Snatching]: 'Snatching',
  [Statuses.Grudging]: 'Grudging',
  [Statuses.Uproaring]: 'Uproar',
  [Statuses.Helped]: 'Helped',
};

/**
 * Everything maximum health is derived from. A catch record satisfies
 * it, and so does a frozen snapshot of one
 */
export interface HealthSource {
  species: Species;
  level: number;
  /**
   * The packed individual values; only the health slice is read
   */
  ivs: number;
  effortValues: Record<Stats, number>;
}

/**
 * How much health the pokemon has when it is whole. It is derived
 * rather than stored, so it follows a level, an evolution or a
 * polished value on its own
 */
export function getMaxHealth(source: HealthSource): number {
  return getHealthStat(
    source.level,
    getSpeciesData(source.species).stats[Stats.HP],
    getIV(source.ivs, Stats.HP),
    source.effortValues[Stats.HP],
  );
}

/**
 * Everything the six stats are derived from: a health source plus the
 * nature that tilts five of them
 */
export interface StatsSource extends HealthSource {
  nature: number;
}

/**
 * What its six stats actually come to. Derived the same way maximum
 * health is, and for the same reason: a level or a polished value
 * moves them on its own. It is what an evolution asking about a stat
 * is measured against
 */
export function getStats(source: StatsSource): Record<Stats, number> {
  const base = getSpeciesData(source.species).stats;
  const one = (stat: Stats): number => {
    const value = getIV(source.ivs, stat);
    const effort = source.effortValues[stat];

    return stat === Stats.HP
      ? getHealthStat(source.level, base[stat], value, effort)
      : getOtherStat(source.level, base[stat], value, effort, getNatureFactor(source.nature, stat));
  };

  return {
    [Stats.HP]: one(Stats.HP),
    [Stats.Attack]: one(Stats.Attack),
    [Stats.Defense]: one(Stats.Defense),
    [Stats.SpecialAttack]: one(Stats.SpecialAttack),
    [Stats.SpecialDefense]: one(Stats.SpecialDefense),
    [Stats.Speed]: one(Stats.Speed),
  };
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
   * Every non-volatile status it is carrying, as a mask of
   * `StatusFlags`. A pokemon can be several things at once, so what it
   * has is a set — and a set of named things is a bitfield
   */
  statuses: number;
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
  return caught.statuses !== 0 || caught.health < getMaxHealth(caught);
}

/**
 * What one item is worth to one pokemon: how much health it restores
 * and what it takes off. It covers both things a player heals with —
 * a berry off the bush and medicine out of the bag — because from the
 * record's point of view they are the same act.
 *
 * A berry's numbers are the berry's own, the same ones the battle
 * reads, so an Oran is worth ten points here as well as there. What
 * is *not* read is the battle's threshold: in a fight the berry
 * decides when to eat itself, and out of one the player decides.
 *
 * A revive is the only thing that lifts a **fainted** pokemon, and it
 * is the only thing that does nothing to one still standing. Every
 * other item is the other way round: a potion poured over a pokemon
 * that is already down does nothing, the way it does not in the
 * mainline games
 */
function effectOf(item: Items): {
  restore: (max: number) => number;
  cures: Set<Statuses> | null;
  revives: number;
} {
  const medicine = MEDICINES.get(item);

  if (medicine != null) {
    return { restore: () => medicine.restore, cures: medicine.cures, revives: medicine.revives };
  }

  // A berry's heal is a share of the pool as often as a flat figure,
  // so it is resolved against the pokemon it is fed to
  const restoring = BERRY_HEALS.get(item);

  return {
    restore: (max) => (restoring == null ? 0 : Math.max(1, Math.floor(restoring.heal(max)))),
    cures: BERRY_STATUS_CURES.get(item) ?? null,
    revives: 0,
  };
}

/**
 * Where an item leaves a pokemon: the health it restores, and the
 * statuses it takes off.
 *
 * Answers null when the item would do nothing, and nothing is exactly
 * what is not worth spending it on — the wrong cure, a pokemon
 * already whole, a potion on a fainted one, a revive on a standing
 * one, or an item whose only use is inside a battle (Leppa restores
 * what this game spends as a cooldown, and Persim cures something no
 * record carries)
 */
export function healedByItem(caught: HealthState & HealthSource, item: Items): HealthState | null {
  const max = getMaxHealth(caught);
  const effect = effectOf(item);
  const down = isFainted(caught);

  // A revive is the whole of what it does: it brings a pokemon back
  // on its share of the pool, and it is the only thing that reaches
  // one at zero
  if (effect.revives > 0) {
    return down ? { health: Math.max(1, Math.round(max * effect.revives)), statuses: 0 } : null;
  }
  if (down) {
    return null;
  }

  const restore = effect.restore(max);
  const health = restore > 0 ? Math.min(max, caught.health + restore) : caught.health;
  // An item takes off everything it covers rather than the first
  // thing it finds: a Lum on a pokemon that is poisoned *and*
  // paralyzed clears both, which is what it does in a battle too
  let statuses = caught.statuses;

  for (const cured of effect.cures ?? []) {
    statuses &= ~statusFlag(cured);
  }

  return health === caught.health && statuses === caught.statuses ? null : { health, statuses };
}

/**
 * The statuses of a pokemon, kept to the ones a fight can leave
 * behind. It is what a report is put through before it is written: a
 * battle that says a pokemon is confused is describing something that
 * ended with it, and the mask makes that one AND
 */
export function carriedStatuses(statuses: number): number {
  return statuses & NON_VOLATILE_MASK;
}
