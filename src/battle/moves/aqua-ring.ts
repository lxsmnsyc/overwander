import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { onUnitActs } from '../utils';

/**
 * Aqua Ring and Magnet Rise: what a pokemon puts round itself and
 * leaves there.
 *
 * The ring pays out when its holder acts rather than on a clock, the
 * way every per-turn residual here does: a turn is a move, so a unit
 * that is doing nothing is not being healed for it
 * https://bulbapedia.bulbagarden.net/wiki/Aqua_Ring_(move)
 */
const RING_SHARE = 1 / 16;

/** What each of the two draws round its user */
const WORN = new Map<Moves, Statuses>([
  [Moves.AquaRing, Statuses.AquaRinged],
  [Moves.MagnetRise, Statuses.MagnetRisen],
]);

export default function setupAquaRing(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const worn = WORN.get(event.move);

    if (worn != null) {
      event.source.addStatus(worn, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  // Paid as its wearer acts, which is what a turn is here
  onUnitActs(battle, (unit) => {
    const worn = unit.status[Statuses.AquaRinged];

    if (worn != null) {
      unit.triggerStatus(Statuses.AquaRinged, worn);
      unit.heal(worn, unit, unit.checkStat(Stats.HP, 0) * RING_SHARE, 0);
    }
  });

  // Nothing is worth drawing twice
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.AquaRing) {
      event.usable = event.source.status[Statuses.AquaRinged] == null;
    }
    if (event.usable && event.move === Moves.MagnetRise) {
      event.usable = event.source.status[Statuses.MagnetRisen] == null;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.AquaRing && event.source.status[Statuses.AquaRinged] != null) {
      event.score -= USELESS_PENALTY;
    }
  });
}
