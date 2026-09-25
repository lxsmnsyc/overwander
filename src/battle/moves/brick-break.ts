import { AttackPriority } from '../../core/event-emitter';
import { MoveAttackFlags, Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';

/**
 * Brick Break: the screens come down once the hit roll has passed and
 * before the damage resolves, so a miss leaves them standing and the
 * blow that lands is not reduced by them
 * https://bulbapedia.bulbagarden.net/wiki/Brick_Break_(move)
 */
const SCREENS = [TeamStatuses.Reflect, TeamStatuses.LightScreen];

/** Brick Break, and Psychic Fangs which bites through the same way */
const SCREEN_BREAKERS = new Set<Moves>([Moves.BrickBreak, Moves.PsychicFangs]);

export default function setupBrickBreak(battle: Battle): void {
  battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
    if (!SCREEN_BREAKERS.has(event.move) || event.flags & MoveAttackFlags.Simulated) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const screen of SCREENS) {
      event.target.team.removeStatus(screen, cause);
    }
  });
}
