import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { getCastTime } from '../mechanics/move/timing';
import turns from '../turn';

/**
 * Trick Room: the room reverses turn order in the mainline, and there
 * is no turn order here. What it bends instead is the wind-up: while
 * the room stands, every cast on the field is timed as if its move's
 * priority were the opposite sign. A quick jab takes the long wind-up
 * a Focus Punch does, and the moves that wait longest snap out first.
 *
 * Cooldowns are left alone, so Speed still decides how often a move
 * comes round: the room changes who lands first, not who acts more
 * https://bulbapedia.bulbagarden.net/wiki/Trick_Room_(move)
 */
const DURATION = turns(5);

export default function setupTrickRoom(battle: Battle): void {
  /** How long the room still stands, over the whole field */
  let remaining = 0;

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.TrickRoom) {
      // A second casting takes the room down, the way the mainline's
      // does, rather than holding it open for another 10 seconds
      remaining = remaining > 0 ? 0 : DURATION;
    }
  });

  battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    if (remaining > 0) {
      remaining = Math.max(0, remaining - event.duration);
    }
  });

  battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
    if (remaining > 0) {
      event.duration = getCastTime(-event.source.checkMovePriority(event.move, event.target));
    }
  });

  // Standing the room up inside itself only takes it down again, which
  // is never what the AI wants
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.TrickRoom && remaining > 0) {
      event.score -= USELESS_PENALTY;
    }
  });
}
