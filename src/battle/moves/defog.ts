import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Team from '../team';
import { clearSpikes, layersUnder } from './spikes';
import { clearStealthRock, stonesOver } from './stealth-rock';
import { clearToxicSpikes, toxicLayersUnder } from './toxic-spikes';

/**
 * Defog: a wind through the field. It sweeps the ground on both sides
 * clear, since a gale does not stop at the halfway line, and takes
 * down the screens over the side it is aimed at. The Evasion drop
 * rides the shared stage table.
 *
 * The modern rule, which is the one where it clears both sides rather
 * than only the target's
 * https://bulbapedia.bulbagarden.net/wiki/Defog_(move)
 */
const SCREENS = [
  TeamStatuses.Reflect,
  TeamStatuses.LightScreen,
  TeamStatuses.Mist,
  TeamStatuses.Safeguard,
  TeamStatuses.LuckyChant,
];

function hazardsUnder(team: Team): boolean {
  return layersUnder(team) > 0 || toxicLayersUnder(team) > 0 || stonesOver(team);
}

function screensOver(team: Team): boolean {
  for (const screen of SCREENS) {
    if (team.status[screen] != null) {
      return true;
    }
  }
  return false;
}

export default function setupDefog(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Defog || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    for (const team of battle.teams()) {
      clearSpikes(team);
      clearToxicSpikes(team);
      clearStealthRock(team);
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const screen of SCREENS) {
      event.target.unit.team.removeStatus(screen, cause);
    }
  });

  // Worth more than the Evasion drop when there is something to sweep
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Defog || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const swept =
      hazardsUnder(event.source.team) ||
      hazardsUnder(event.target.unit.team) ||
      screensOver(event.target.unit.team);

    if (!swept) {
      event.score -= USELESS_PENALTY / 2;
    }
  });
}
