import { MoveAffects, MoveTargets } from '../../../data/ids/moves';
import type Alliance from '../../alliance';
import type Battle from '../../core';
import type { MoveTarget } from '../../events';
import { MoveTargetType } from '../../events';
import type Team from '../../team';
import type Unit from '../../unit';

/** Who a move reaches, once it is known what it was aimed at */
/**
 * Whether this move reaches whoever is being considered.
 *
 * A move aimed at one pokemon is refused before it is cast if that
 * pokemon is down (`CheckUnitCanCast`), but a move that goes out to
 * everybody has nobody to refuse: it walks the roster. So the roster
 * is what is filtered, and the fallen are left out of it unless the
 * move asked for them
 */
function reaches(affects: number, unit: Unit): boolean {
  return unit.alive || (affects & MoveAffects.Fainted) !== 0;
}

/** The same question about a whole team: is there anybody left on it. */
function reachesTeam(affects: number, team: Team): boolean {
  if ((affects & MoveAffects.Fainted) !== 0) {
    return true;
  }
  for (const unit of team.units) {
    if (unit.alive) {
      return true;
    }
  }
  return false;
}

function teamUnits(source: Unit, team: Team, flags: number, found: MoveTarget[]): void {
  for (const unit of team.units) {
    if (source !== unit && reaches(flags, unit)) {
      found.push({ type: MoveTargetType.Unit, unit });
    }
  }
}

function allianceUnits(source: Unit, alliance: Alliance, flags: number, found: MoveTarget[]): void {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      teamUnits(source, team, flags, found);
    }
  }
}

function wholeTeam(team: Team, flags: number, found: MoveTarget[]): void {
  if (reachesTeam(flags, team)) {
    found.push({ type: MoveTargetType.Team, team });
  }
}

function allianceTeams(source: Unit, alliance: Alliance, flags: number, found: MoveTarget[]): void {
  for (const team of alliance.teams) {
    if (team !== source.team) {
      wholeTeam(team, flags, found);
    }
  }
}

/**
 * Everybody a move is about to land on.
 *
 * A move aimed at one pokemon is that pokemon. One that goes out to
 * everybody is worked out here instead, from the flags: which sides it
 * reaches, whether it lands per pokemon or per team, and whether it
 * counts the fallen.
 *
 * It is exported because the **field** needs the same answer as the
 * engine and half a beat earlier: a move is drawn crossing the gap
 * during the wait, and it has to know how many gaps that is before the
 * engine walks the roster. The two can differ — somebody may go down
 * mid-flight — so this is a picture of the field as the move left,
 * which is exactly what a thing in the air is
 */
export default function resolveMoveTargets(
  battle: Battle,
  source: Unit,
  aimed: MoveTarget,
  target: MoveTargets,
  affects: number,
): MoveTarget[] {
  // A move cast at one of something lands on the one it was aimed at
  if (target !== MoveTargets.None) {
    return [aimed];
  }

  const found: MoveTarget[] = [];

  if (affects & MoveAffects.Unit) {
    if (affects & MoveAffects.Self) {
      found.push({ type: MoveTargetType.Unit, unit: source });
    }
    if (affects & MoveAffects.Own) {
      teamUnits(source, source.team, affects, found);
    }
    if (affects & MoveAffects.Ally) {
      allianceUnits(source, source.team.alliance, affects, found);
    }
    if (affects & MoveAffects.Enemy) {
      for (const team of battle.teams(source.team.alliance)) {
        teamUnits(source, team, affects, found);
      }
    }
  } else if (affects & MoveAffects.Team) {
    if (affects & MoveAffects.Own) {
      wholeTeam(source.team, affects, found);
    }
    if (affects & MoveAffects.Ally) {
      allianceTeams(source, source.team.alliance, affects, found);
    }
    if (affects & MoveAffects.Enemy) {
      for (const team of battle.teams(source.team.alliance)) {
        wholeTeam(team, affects, found);
      }
    }
  } else {
    // A move that reaches nothing in particular still happens: the
    // weather, the field, and everything a pokemon does to itself
    return [{ type: MoveTargetType.None }];
  }
  return found;
}
