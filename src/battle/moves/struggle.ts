import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Struggle: what is thrown when there is nothing left to throw.
 *
 * Nobody learns it, nothing teaches it and no list of moves contains
 * it — it is the engine's answer to a pokemon that has been shut out
 * of its own move set. It costs a quarter of the user's whole health
 * whatever it lands for, so it is a way of losing slowly rather than
 * a way of standing still.
 *
 * **What counts as nothing left is not the same question here as it is
 * on a cartridge.** There, a move runs out of PP and stays out until
 * somebody heals it, so "no PP anywhere" is a lasting state. This
 * engine is real-time: a move is spent by going on cooldown and comes
 * back on its own a few seconds later, and a pokemon between cooldowns
 * has not run out of anything — it is waiting. Struggling then would
 * mean every pokemon in every fight killing itself in the gaps.
 *
 * So the test is not spent moves but **the chooser coming back with
 * nothing and nothing merely cooling**, which is the one state that
 * does not fix itself by waiting. That covers a move set shut off by
 * Disable or a status, and it covers a unit whose moves all still work
 * but reach nothing on the field: a Normal type facing only Ghosts has
 * a full move set, a swing of its own, and no way to touch anybody
 * with either. A cooldown that would have offered something is what
 * the chooser reports as waiting, and waiting is not struggling.
 *
 * https://bulbapedia.bulbagarden.net/wiki/Struggle_(move)
 */

/**
 * How much of the user's own health one Struggle costs. It is a
 * fraction of the maximum rather than of the damage dealt — which is
 * what makes it different from Take Down, and what makes struggling
 * into something that is immune to it still fatal
 */
export const STRUGGLE_RECOIL = 1 / 4;

export default function setupStruggle(battle: Battle): void {
  /**
   * The last word on what to do, after every other resolver has had
   * its say: a unit with a choice keeps it, and one with none at all
   * struggles.
   *
   * A raid boss does not. It is the clock the lobby is racing, and a
   * boss that answered a deadlock by taking a quarter of itself off
   * every few seconds would lose the raid on its own. It stands there
   * instead, which is the party's problem to solve
   */
  battle.on(BattleEvents.UnitAIChooseMove, EventPriority.Post, (event) => {
    if (event.choice != null || event.waiting || event.source.hasAbility(Abilities.Boss)) {
      return;
    }

    const targets: Unit[] = [];

    for (const unit of battle.units(event.source.team.alliance)) {
      if (unit.alive) {
        targets.push(unit);
      }
    }
    if (targets.length === 0) {
      return;
    }

    const target = targets[Math.floor(battle.random() * targets.length)];

    event.choice = {
      move: Moves.Struggle,
      target: { type: MoveTargetType.Unit, unit: target },
      // Nothing was scored: it was not chosen over anything, it is
      // what is left
      score: 0,
    };
  });

  /**
   * And what it costs. `Post`, so the hit itself has already been
   * resolved by the ordinary damage path — the recoil is paid whether
   * or not that hit landed for anything, which is the whole of what
   * makes Struggle a losing position rather than a free attack
   */
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Struggle) {
      return;
    }

    event.source.damage(
      // Not attributed to the move: a recoil that named Struggle as
      // its cause would be read as another Struggle by anything
      // watching for one, this listener included
      { type: EffectType.None },
      event.source,
      event.source.checkStat(Stats.HP, 0) * STRUGGLE_RECOIL,
      // Paid rather than suffered, so neither Rock Head nor Magic
      // Guard gets out of it
      DamageFlags.Indirect | DamageFlags.Cost,
    );
  });
}
