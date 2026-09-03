import { AttackPriority } from '../../core/event-emitter';
import type Abilities from '../../data/ids/abilities';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The two moves that move abilities about: one copies the target's,
 * the other trades. Both work on what each is actually carrying
 * rather than on what its species is known for, so an ability that
 * arrived by one of these can leave by the other.
 */
function abilitiesOf(unit: Unit): Abilities[] {
  return (
    Object.entries(unit.abilities)
      .filter(([, carried]) => carried)
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
