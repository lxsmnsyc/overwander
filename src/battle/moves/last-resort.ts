import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * Last Resort: the move a pokemon reaches for once it has tried
 * everything else.
 *
 * In the main games it waits on the other moves being *used*, which
 * is the same thing said in a game with turns. Here it counts casts:
 * every other move the unit knows has to have gone out at least once
 * this fight, and leaving the field puts it back to the start
 * https://bulbapedia.bulbagarden.net/wiki/Last_Resort_(move)
 */
/**
 * What does not count towards having tried everything: the move
 * itself, and the two fallbacks every unit carries whether or not
 * anybody taught them. Waiting on a Struggle would mean the resort
 * only arrives once the pokemon has nothing left at all
 */
const NOT_TRIED = new Set<Moves>([Moves.LastResort, Moves.Struggle, Moves.Attack]);

export default function setupLastResort(battle: Battle): void {
  /** What each unit has cast this fight */
  const cast = new Map<Unit, Set<Moves>>();

  /** Whether everything else this unit knows has been out already */
  function exhausted(unit: Unit): boolean {
    // The slots are keyed by the move enum, which comes back as a
    // string from Object.keys
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    const known = (Object.keys(unit.moves).map(Number) as Moves[]).filter(
      (move) => !NOT_TRIED.has(move),
    );
    const spent = cast.get(unit);

    // Nothing else to try is not the same as having tried everything:
    // a pokemon knowing Last Resort alone never gets to use it
    return known.length > 0 && known.every((move) => spent?.has(move) === true);
  }

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    const spent = cast.get(event.source) ?? new Set<Moves>();

    spent.add(event.move);
    cast.set(event.source, spent);
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    cast.delete(event.source);
  });

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    cast.delete(event.source);
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.LastResort) {
      event.usable = exhausted(event.source);
    }
  });

  // Thrown before its time it does nothing at all, the way the main
  // games refuse it outright
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      event.move === Moves.LastResort &&
      event.target.type === MoveTargetType.Unit &&
      !exhausted(event.source)
    ) {
      event.immune = true;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.LastResort && !exhausted(event.source)) {
      event.score -= USELESS_PENALTY;
    }
  });
}
