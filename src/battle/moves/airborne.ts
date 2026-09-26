import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Smack Down pulls a pokemon out of the air and keeps it down for the
 * rest of the fight; Telekinesis holds one up. The hold itself is
 * `status/telekinetic.ts`
 * https://bulbapedia.bulbagarden.net/wiki/Smack_Down_(move)
 */

/** The moves that take their user up out of reach, which Smack Down ends */
const TAKEN_UP = new Set<Moves>([Moves.Fly, Moves.Bounce, Moves.SkyDrop]);

/** The blows that bring whatever they hit down to the ground */
const GROUNDING_MOVES = new Set<Moves>([Moves.SmackDown, Moves.ThousandArrows]);

/** What keeps a pokemon off the ground on top of its type */
const HELD_UP = [Statuses.MagnetRisen, Statuses.Telekinetic, Statuses.SkyDropped];

/** Whether a Telekinesis would take hold at all */
function canLift(unit: Unit): boolean {
  return (
    unit.status[Statuses.Telekinetic] == null &&
    unit.status[Statuses.Grounded] == null &&
    unit.status[Statuses.Rooted] == null
  );
}

export default function setupAirborneMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
    if (!GROUNDING_MOVES.has(event.move) || !event.success || !event.target.alive) {
      return;
    }

    const target = event.target;
    const hiding = target.status[Statuses.Invulnerable];

    if (hiding?.type === EffectType.Move && TAKEN_UP.has(hiding.move)) {
      target.removeStatus(Statuses.Invulnerable, hiding);
      target.interrupt();
    }
    for (const status of HELD_UP) {
      const cause = target.status[status];

      if (cause != null) {
        target.removeStatus(status, cause);
      }
    }

    // Grounded takes the place of Floating by itself
    target.addStatus(Statuses.Grounded, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Telekinesis || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (!canLift(target)) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    target.addStatus(Statuses.Telekinetic, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Telekinesis) {
      event.usable = event.target.type === MoveTargetType.Unit && canLift(event.target.unit);
    }
  });
}
