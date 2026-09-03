import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveTargets, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Follow Me pulls what is coming at the user's side onto the user.
 *
 * A move is aimed when it is cast and it lands when the cast finishes,
 * so the pull happens at the aiming rather than at the landing: a
 * Follow Me turns every enemy already winding up on an ally, and every
 * enemy that starts winding up while it holds, onto the pokemon that
 * called for it. That is what makes it worth the cast in a fight
 * everybody is having at once
 * https://bulbapedia.bulbagarden.net/wiki/Follow_Me_(move)
 */

/** Whether the move is one aimed at a single pokemon */
function isSingleTarget(move: Moves): boolean {
  return getMoveData(move).target === MoveTargets.Unit;
}

/** The unit on that team drawing everything to itself, if any */
function centreOf(team: Unit['team']): Unit | undefined {
  for (const unit of team.units) {
    if (unit.alive && unit.status[Statuses.Centered] != null) {
      return unit;
    }
  }
  return undefined;
}

export default function setupFollowMe(battle: Battle): void {
  /**
   * Turns a cast in progress onto the centre, if it is aimed at
   * somebody else on that centre's side
   */
  function redirect(caster: Unit): void {
    const casting = caster.casting;

    if (casting == null || casting.target.type !== MoveTargetType.Unit) {
      return;
    }

    const aimed = casting.target.unit;

    if (aimed.team === caster.team || !isSingleTarget(casting.move)) {
      return;
    }

    const centre = centreOf(aimed.team);

    if (centre != null && centre !== aimed) {
      caster.updateCast({ target: { type: MoveTargetType.Unit, unit: centre } });
    }
  }

  // Everything already coming at the side turns the moment it is
  // called for
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move !== Moves.FollowMe) {
      return;
    }

    for (const team of battle.teams()) {
      if (team === event.source.team) {
        continue;
      }
      for (const unit of team.units) {
        redirect(unit);
      }
    }
  });

  // And everything aimed afterwards is aimed at the centre instead
  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    redirect(event.source);
  });
}
