import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveFlags } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import { BattleEvents } from '../../events';
import { createAbility, getAbilityHolders } from '../__create';
import type Unit from '../../unit';

/** What one other bird still up is worth to the flock */
export const FLOCK_SCALE = 1.05;

/** Where the flock stops paying, five birds in */
export const FLOCK_CEILING = 1.25;

/** What the dam leaves of anything indirect */
export const LODGE_SCALE = 0.75;

/** What the chorus is worth to a sound move */
export const CHORUS_SCALE = 1.2;

/** Whether anybody on this unit's side is holding the ability up */
function backed(unit: Unit, ability: Abilities): boolean {
  for (const holder of getAbilityHolders(unit.battle, ability)) {
    if (holder.alive && holder.team === unit.team && holder.hasAbility(ability)) {
      return true;
    }
  }

  return false;
}

/**
 * Sinnoh's three route openers, each worth what it stands with rather
 * than what it is: the flock, the lodge behind the dam, and the
 * chorus a cricket conducts
 */
const setupAbilities = [
  /**
   * Murmuration: a Starly alone is a Starly, and the AI can see the
   * flock it would be breaking up
   */
  createAbility(Abilities.Murmuration, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (event.power == null || !event.source.hasAbility(Abilities.Murmuration)) {
        return;
      }

      let flock = 1;

      for (const mate of event.source.team.units) {
        if (mate !== event.source && mate.alive) {
          flock *= FLOCK_SCALE;
        }
      }

      event.power *= Math.min(flock, FLOCK_CEILING);
    }),
  ),

  /**
   * Lodgework: the dam holds for the whole lodge. A cost is what a
   * pokemon spent on purpose rather than what was done to it, so it
   * is paid in full, and a negative amount is a drain healing
   */
  createAbility(Abilities.Lodgework, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      if (
        event.value > 0 &&
        event.flags & DamageFlags.Indirect &&
        !(event.flags & (DamageFlags.Cost | DamageFlags.Pure)) &&
        backed(event.target, Abilities.Lodgework)
      ) {
        event.value *= LODGE_SCALE;
      }
    }),
  ),

  /**
   * Chorus: a Kricketune conducts rather than sings alone, so the
   * lift reaches every sound move on its side, its own among them
   */
  createAbility(Abilities.Chorus, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        getMoveData(event.move).flags & MoveFlags.Sound &&
        backed(event.source, Abilities.Chorus)
      ) {
        event.power *= CHORUS_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
