import { AttackPriority } from '../../core/event-emitter';
import { MoveCategories, MoveTargets, type Moves, affectsFoesOnly } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';

/**
 * Aiming a hit at one's own side.
 *
 * The main games let any single-target attack be pointed at a
 * teammate, and the reason is absorption: a Thunderbolt into a Volt
 * Absorb is a heal, a Surf into a Storm Drain is a stage. So the
 * chooser offers every teammate as a target for these, and refuses
 * the aim unless the hit cannot land at all. What a feed is worth is
 * each absorbing ability's own answer, written where the ability is.
 *
 * A move whose own table names an ally is not one of these: it was
 * let onto that side for something other than its damage. Neither is
 * one that goes out to everybody, which decides who it catches by
 * its flags rather than by being aimed
 */
export function feedsOwnSide(move: Moves): boolean {
  const data = getMoveData(move);

  return (
    data.category !== MoveCategories.Status &&
    data.target === MoveTargets.Unit &&
    affectsFoesOnly(data.affects)
  );
}

export default function setupFriendlyFire(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      !event.usable ||
      event.target.type !== MoveTargetType.Unit ||
      event.target.unit === event.source ||
      event.target.unit.team.alliance !== event.source.team.alliance ||
      !feedsOwnSide(event.move)
    ) {
      return;
    }

    // Only a hit that cannot land is worth pointing that way
    event.usable = event.source.checkMoveImmunity(
      event.move,
      event.target,
      event.source.checkMoveType(event.move, event.target),
    );
  });
}
