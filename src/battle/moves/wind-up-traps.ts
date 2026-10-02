import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveCategories, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The two moves that punish what hits them while they are wound up.
 *
 * Beak Blast heats up during its wind-up and burns anything that makes
 * contact before it fires. Shell Trap only goes off when a physical
 * hit lands on it from the other side during the wind-up, and it goes
 * off at once when one does; a wind-up nobody hits fizzles
 * https://bulbapedia.bulbagarden.net/wiki/Shell_Trap_(move)
 */
export default function setupWindUpTraps(battle: Battle): void {
  /** Shell Traps set off by a hit, and fired on its back */
  const sprung = new Set<Unit>();

  battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
    const { source, target } = event;

    if (!event.success || source === target) {
      return;
    }

    const winding = target.casting?.move;

    if (
      winding === Moves.BeakBlast &&
      source.checkMoveContact(event.move, { type: MoveTargetType.Unit, unit: target })
    ) {
      source.addStatus(Statuses.Burned, {
        type: EffectType.Move,
        move: Moves.BeakBlast,
        unit: target,
      });
    }

    if (
      winding === Moves.ShellTrap &&
      event.category === MoveCategories.Physical &&
      source.team.alliance !== target.team.alliance &&
      !sprung.has(target)
    ) {
      sprung.add(target);
      target.interrupt();
      target.triggerMove(Moves.ShellTrap, { type: MoveTargetType.None }, 0);
    }
  });

  battle.on(BattleEvents.CheckUnitTriggerMove, EventPriority.Post, (event) => {
    if (event.success && event.move === Moves.ShellTrap && !sprung.has(event.source)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (event.move === Moves.ShellTrap) {
      sprung.delete(event.source);
    }
  });
}
