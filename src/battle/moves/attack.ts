import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { USELESS_PENALTY } from '../ai/score';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';

/**
 * Attack: the swing every pokemon carries.
 *
 * A cartridge fight is turn-shaped, so a pokemon always has something
 * to do when its turn comes. This one is real-time: a move is spent by
 * going on cooldown and comes back a second or several later, and a
 * pokemon whose every move was cooling had nothing at all to do. It
 * stood there. Two of them stood there together, and a battle read as
 * a pair of timers running down.
 *
 * So every unit is fielded knowing this as well as whatever it was
 * fielded with. It is an ordinary move in every other respect — it
 * sits in the move set, it cools like the rest, the AI scores it
 * against the rest — and it is deliberately feeble: ten power against
 * a real move's hundred, back about once a second. Nothing ever picks
 * it over something the pokemon actually knows; it is what is left
 * when everything else is on the clock.
 *
 * **It is not Struggle.** Struggle is for a pokemon shut out of its
 * move set for good — everything disabled — and it costs a quarter of
 * the user's health to say so. Waiting a moment for a cooldown is a
 * different state, and this is its answer. A pokemon whose swing has
 * been disabled along with everything else still struggles.
 */

export default function setupAttack(battle: Battle): void {
  /**
   * What a pokemon is made of is what it swings with. The move is
   * registered typeless and given the user's own first type here, so a
   * Charmander's swing is Fire and a Geodude's is Rock — and a pokemon
   * that has been made something else by Conversion swings as whatever
   * it now is, since the type is read off the unit rather than off the
   * species it started as
   */
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move !== Moves.Attack) {
      return;
    }

    // Nothing to be made of is nothing to swing with: a unit whose
    // types have all been stripped keeps the typeless move it was
    // registered as
    const worn = [...event.source.types];

    if (worn.length > 0) {
      event.type = worn[0];
    }
  });

  /**
   * And scored below everything. A swing is what a pokemon does when
   * it has nothing better, so it must lose to anything else that
   * could be cast — including a move that would do nothing at all,
   * since a Growl that lands beats ten points of damage that ends the
   * turn the pokemon could have spent setting up.
   *
   * The penalty is `USELESS_PENALTY` twice over: one of those is what
   * a move nobody should pick is docked, so the swing has to come in
   * under even that. It still scores above nothing, which is what
   * makes it the answer when there is no other candidate at all
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Attack) {
      event.score -= USELESS_PENALTY * 2;
    }
  });

  /**
   * Every unit is fielded with it. `Post`, so it lands after the
   * ordinary bookkeeping a team does when a unit joins it — and on
   * joining a team rather than on being given a species, because a
   * unit that never had a species is still something standing on the
   * field with hands
   */
  battle.on(BattleEvents.TeamAddUnit, EventPriority.Post, (event) => {
    event.unit.addMove(Moves.Attack);
  });
}
