import { AttackPriority } from '../../core/event-emitter';
import { countsAgainstSlots } from '../../data/constants/slots';
import Abilities from '../../data/ids/abilities';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The four moves that move abilities about: two copy or trade, two
 * take one away
 */
export const ABILITY_MOVES = new Set<Moves>([
  Moves.RolePlay,
  Moves.SkillSwap,
  Moves.GastroAcid,
  Moves.WorrySeed,
]);

/**
 * What these moves can actually take hold of: what the unit is
 * carrying rather than what its species is known for, so an ability
 * that arrived by one of these can leave by the other.
 *
 * The special tier is left out. A Boss, a shadow and the mark left
 * where a shadow was are marks of what a pokemon **is**, so they are
 * not a thing to copy, trade or shut off: a raid whose boss had been
 * talked out of being one would lose its health pool mid-fight
 */
function abilitiesOf(unit: Unit): Abilities[] {
  return (
    Object.entries(unit.abilities)
      .filter(([ability, carried]) => carried && countsAgainstSlots(Number(ability)))
      // The list is keyed by the ability enum, which comes back as a
      // string from Object.entries
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      .map(([ability]) => Number(ability) as Abilities)
  );
}

export default function setupAbilityMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (event.move === Moves.RolePlay) {
      const copying = abilitiesOf(target);

      if (copying.length === 0) {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
        return;
      }

      for (const ability of abilitiesOf(event.source)) {
        event.source.removeAbility(ability);
      }
      for (const ability of copying) {
        event.source.addAbility(ability);
      }
      return;
    }

    // Gastro Acid takes one of the target's abilities and gives
    // nothing back; Worry Seed puts Insomnia where the one it took
    // was, so a sleeper is worth nothing to whatever was counting on
    // it sleeping.
    //
    // One rather than the lot: a unit here may hold several, and a
    // move that stripped a pokemon bare would be a different move
    if (event.move === Moves.GastroAcid || event.move === Moves.WorrySeed) {
      const held = abilitiesOf(target);

      if (held.length > 0) {
        target.removeAbility(held[Math.floor(battle.random() * held.length)]);
      } else if (event.move === Moves.GastroAcid) {
        // Nothing to shut off is nothing done
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
        return;
      }
      if (event.move === Moves.WorrySeed) {
        target.addAbility(Abilities.Insomnia);
      }
      return;
    }

    if (event.move !== Moves.SkillSwap) {
      return;
    }

    const mine = abilitiesOf(event.source);
    const theirs = abilitiesOf(target);

    if (mine.length === 0 && theirs.length === 0) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    for (const ability of mine) {
      event.source.removeAbility(ability);
    }
    for (const ability of theirs) {
      target.removeAbility(ability);
    }
    for (const ability of theirs) {
      event.source.addAbility(ability);
    }
    for (const ability of mine) {
      target.addAbility(ability);
    }
  });
}
