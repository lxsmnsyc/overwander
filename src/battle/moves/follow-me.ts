import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { Items } from '../../data/ids/items';
import { MoveTargets, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
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

/** The calls that pull the side's casts in; Rage Powder is the powder one */
const CALLS = new Set<Moves>([Moves.FollowMe, Moves.RagePowder]);

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

/** A Rage Powder is lost on a caster the powder cannot reach */
function aimsPast(caster: Unit, centre: Unit): boolean {
  const cause = centre.status[Statuses.Centered];

  return (
    cause?.type === EffectType.Move &&
    cause.move === Moves.RagePowder &&
    (caster.types.has(Types.Grass) ||
      caster.hasAbility(Abilities.Overcoat) ||
      caster.hasItem(Items.SafetyGoggles))
  );
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

    if (centre != null && centre !== aimed && !aimsPast(caster, centre)) {
      caster.updateCast({ target: { type: MoveTargetType.Unit, unit: centre } });
    }
  }

  // Everything already coming at the side turns the moment it is
  // called for
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (!CALLS.has(event.move)) {
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

  // With no teammate standing there is nobody to draw fire away from
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable || !CALLS.has(event.move)) {
      return;
    }

    for (const unit of event.source.team.units) {
      if (unit !== event.source && unit.alive) {
        return;
      }
    }
    event.usable = false;
  });
}
