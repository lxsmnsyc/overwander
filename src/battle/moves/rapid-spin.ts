import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import type Team from '../team';
import type Unit from '../unit';
import { clearSpikes, layersUnder } from './spikes';
import { clearStealthRock, stonesOver } from './stealth-rock';
import { clearStickyWeb, webOver } from './sticky-web';
import { clearToxicSpikes, toxicLayersUnder } from './toxic-spikes';

/**
 * Rapid Spin hits, raises the user's Speed through the shared
 * secondary table, sweeps every hazard off its own side, and spins the
 * user free of a bind or a Leech Seed. The modern rule: it once cleared
 * the spikes alone
 * https://bulbapedia.bulbagarden.net/wiki/Rapid_Spin_(move)
 */

/** What the spin shakes off the user */
const SHAKEN = [Statuses.Trapped, Statuses.Seeding];

function hazardsUnder(team: Team): boolean {
  return layersUnder(team) > 0 || toxicLayersUnder(team) > 0 || stonesOver(team) || webOver(team);
}

function heldDown(unit: Unit): boolean {
  for (const status of SHAKEN) {
    if (unit.status[status] != null) {
      return true;
    }
  }
  return false;
}

export default function setupRapidSpin(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move !== Moves.RapidSpin) {
      return;
    }

    const team = event.source.team;

    clearSpikes(team);
    clearToxicSpikes(team);
    clearStealthRock(team);
    clearStickyWeb(team);

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;

    for (const status of SHAKEN) {
      if (event.source.status[status] != null) {
        event.source.removeStatus(status, cause);
      }
    }
  });

  // The sweep is a bonus rather than the point of it, so nothing is
  // taken off a spin with nothing to clear. It is worth more with
  // something to clear, which is what the AI is told
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.move === Moves.RapidSpin &&
      (hazardsUnder(event.source.team) || heldDown(event.source))
    ) {
      event.score += USELESS_PENALTY;
    }
  });
}
