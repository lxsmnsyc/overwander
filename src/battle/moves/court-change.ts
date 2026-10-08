import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Team from '../team';
import type Unit from '../unit';
import { sideConditions } from '../mechanics/side-conditions';
import { layersUnder, setSpikes } from './spikes';
import { setStealthRock } from './stealth-rock';

/**
 * The attacks that leave a hazard behind on the side they hit, and the
 * move that trades hazards between the sides.
 *
 * Stone Axe hangs Stealth Rock where it lands and Ceaseless Edge adds
 * a layer of Spikes, both only on a hit: the splinters are what the
 * blow leaves. Court Change carries everything laid on the user's side
 * across to the other one, and brings the other side's back: the
 * hazards at the depth they lie, and the screens, Mist, Safeguard and
 * Tailwind with the time each had left
 * https://bulbapedia.bulbagarden.net/wiki/Court_Change_(move)
 */

/**
 * The side across from the user. A fight has one, and a raid's boss
 * faces a lobby: the first team standing against it is the one traded
 * with
 */
function across(battle: Battle, unit: Unit): Team | undefined {
  const [first] = battle.teams(unit.team.alliance);

  return first;
}

export default function setupHazardMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.StoneAxe || event.parent.move === Moves.CeaselessEdge) {
      event.value = 100;
    }
  });

  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const { move, source, target } = event.parent;
    const cause = { type: EffectType.Move, move, unit: source } as const;

    if (move === Moves.StoneAxe) {
      setStealthRock(target.team, true, cause);
    }
    if (move === Moves.CeaselessEdge) {
      setSpikes(target.team, layersUnder(target.team) + 1, cause);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.CourtChange) {
      return;
    }

    const own = event.source.team;
    const other = across(battle, event.source);

    if (other == null) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const condition of sideConditions(battle)) {
      const ours = condition.read(own);
      const theirs = condition.read(other);

      condition.write(own, theirs, cause);
      condition.write(other, ours, cause);
    }
  });
}
