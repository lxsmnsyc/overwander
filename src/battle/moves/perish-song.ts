import { AttackPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { BattleModes } from '../core';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The most a favourable song is worth to the AI, reached once the
 * enemy stands to lose a whole unit's worth of HP more than its own side
 */
export const PERISH_TRADE_BONUS = 8;

/**
 * Everything that hears the song starts counting, the singer
 * included. A move that reaches the whole field is resolved once per
 * unit, so this only has to answer for the one in front of it
 */
export default function setupPerishSong(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.PerishSong || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    event.target.unit.addStatus(Statuses.Perishing, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });

  /** The HP share this unit would lose to the song, 0 if it would not start counting */
  function doomed(singer: Unit, unit: Unit): number {
    const target = { type: MoveTargetType.Unit, unit } as const;
    const cause = { type: EffectType.Move, move: Moves.PerishSong, unit: singer } as const;

    if (
      !unit.alive ||
      unit.status[Statuses.Perishing] != null ||
      singer.checkMoveImmunity(
        Moves.PerishSong,
        target,
        singer.checkMoveType(Moves.PerishSong, target),
      ) ||
      unit.checkStatusImmunity(Statuses.Perishing, cause)
    ) {
      return 0;
    }
    return unit.health / Math.max(1, unit.checkStat(Stats.HP, 0));
  }

  /** How much more HP the enemy side would lose than the singer's own, in whole units */
  function tradeOf(singer: Unit): number {
    let own = 0;
    let enemy = 0;

    for (const unit of singer.team.units) {
      own += doomed(singer, unit);
    }
    for (const unit of battle.units(singer.team.alliance)) {
      enemy += doomed(singer, unit);
    }
    return enemy > 0 ? enemy - own : 0;
  }

  /**
   * Nobody sings it in a raid. The song reaches the whole field and a
   * boss refuses it, so the only side left counting is the party: sung
   * by a member it empties the lobby, and sung by the boss it wins the
   * fight outright.
   *
   * Anywhere else the AI sings only when the enemy loses more than its
   * own side does, the singer included
   */
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      event.usable &&
      event.move === Moves.PerishSong &&
      (battle.mode === BattleModes.Raid || tradeOf(event.source) <= 0)
    ) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.PerishSong) {
      const trade = tradeOf(event.source);

      if (trade > 0) {
        event.score += Math.max(1, Math.round(PERISH_TRADE_BONUS * Math.min(1, trade)));
      }
    }
  });
}
