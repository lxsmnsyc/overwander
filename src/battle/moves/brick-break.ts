import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';

/**
 * Brick Break: the screens come down first, so the hit that follows
 * lands on an unshielded pokemon rather than through the wall it just
 * broke
 * https://bulbapedia.bulbagarden.net/wiki/Brick_Break_(move)
 */
const SCREENS = [TeamStatuses.Reflect, TeamStatuses.LightScreen];

export default function setupBrickBreak(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
    if (event.move !== Moves.BrickBreak || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const screen of SCREENS) {
      event.target.unit.team.removeStatus(screen, cause);
    }
  });
}
