import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { clearSpikes, layersUnder } from './spikes';

/**
 * Rapid Spin hits, raises the user's Speed through the shared
 * secondary table, and sweeps the ground its own side stands on
 * https://bulbapedia.bulbagarden.net/wiki/Rapid_Spin_(move)
 */
export default function setupRapidSpin(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move === Moves.RapidSpin) {
      clearSpikes(event.source.team);
    }
  });

  // The sweep is a bonus rather than the point of it, so nothing is
  // taken off a spin with no spikes to clear. It is worth more with
  // them, which is what the AI is told
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.RapidSpin && layersUnder(event.source.team) > 0) {
      event.score += USELESS_PENALTY;
    }
  });
}
