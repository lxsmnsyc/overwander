import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { PP_RESTORATIVES } from '../../data/items/medicine';
import { BattleEvents } from '../events';
import type Unit from '../unit';
import { createHeldItems, spendItem } from './__create';

/**
 * The PP restoratives: Ether, Max Ether, Elixir and Max Elixir.
 *
 * This game has no spendable PP. A move's cost is its cooldown, so
 * "points back" is time back, the way the Leppa Berry already reads
 * it. A restorative is held, answers one cooldown starting and is used
 * up, once a battle. Unlike the Leppa it is not a berry, so an enemy
 * Unnerve leaves it alone.
 *
 * - An Ether or Max Ether answers the first cooldown to start, and
 *   halves what is left of it or clears it
 * - An Elixir or Max Elixir waits until every move of the holder is
 *   cooling down at once, which is the game's run-out-of-PP, then
 *   halves or clears all of them
 */

/**
 * The moves every unit carries that are never a choice: the plain
 * attack and the Struggle, neither of which waits out a cooldown. An
 * Elixir does not count them as moves that have to be cooling down
 */
const NOT_A_CHOICE = new Set<Moves>([Moves.Attack, Moves.Struggle]);

/** The moves the unit chose, which the slots hold as strings of the enum */
function chosenMoves(unit: Unit): Moves[] {
  const chosen: Moves[] = [];

  for (const key of Object.keys(unit.moves)) {
    const move = Number(key) as Moves;

    if (!NOT_A_CHOICE.has(move)) {
      chosen.push(move);
    }
  }
  return chosen;
}

/** Whether every move the unit chose is cooling down */
function allCoolingDown(unit: Unit): boolean {
  const chosen = chosenMoves(unit);

  for (const move of chosen) {
    if (unit.moves[move]?.cooldown == null) {
      return false;
    }
  }
  return chosen.length > 0;
}

/** Take back half of the time a cooldown still has to run */
function halveCooldown(unit: Unit, move: Moves): void {
  const cooldown = unit.moves[move]?.cooldown;

  if (cooldown == null) {
    return;
  }

  const remaining = cooldown.duration - cooldown.progress;

  unit.updateCooldown(move, { duration: cooldown.progress + remaining / 2 });
}

export default createHeldItems(
  () => PP_RESTORATIVES.keys(),
  (battle, item) =>
    battle.on(BattleEvents.UnitStartCooldown, EventPriority.Post, (event) => {
      const unit = event.source;
      const { every, full } = PP_RESTORATIVES.get(item) ?? { every: false, full: false };

      if (every && !allCoolingDown(unit)) {
        return;
      }
      if (spendItem(unit, item) == null) {
        return;
      }

      // Taken before any of them is cleared: clearing one changes the list
      const moves = every ? chosenMoves(unit) : [event.move];

      for (const move of moves) {
        if (full) {
          unit.finishCooldown(move);
        } else {
          halveCooldown(unit, move);
        }
      }
    }),
);
