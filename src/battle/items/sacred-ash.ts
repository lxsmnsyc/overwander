import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import { BattleEvents } from '../events';
import { type Lifecycle, MergedLifecycle } from '../lifecycle';
import type Team from '../team';
import { createHeldItem, holds, spendItem } from './__create';

/**
 * The Sacred Ash: a whole team back on its feet, once.
 *
 * It answers its holder fainting rather than anything the holder does,
 * which makes it the only item in the game that is worth carrying by a
 * pokemon that is going to lose. The pause before it lands is the
 * point of it — the ash is a moment, not a reflex, and the battle's own
 * grace period is long enough that a team can be brought back inside it
 * rather than the fight being called over their bodies.
 */

/**
 * How long the ash takes to work
 */
export const SACRED_ASH_DELAY = 1000;

export default createHeldItem(Items.SacredAsh, (battle): Lifecycle => {
  /**
   * Teams that have already spent one. A second ash on the same side
   * is dead weight from that moment: it is disabled where it lies
   * rather than taken away, so its holder can still see what it is
   * carrying
   */
  const spent = new Set<Team>();

  /**
   * How long each team's ash has left to work. It outlives the item,
   * which is why the lifecycle below refuses to stop while anything is
   * still owing
   */
  const rising = new Map<Team, number>();

  function smother(team: Team): void {
    for (const unit of team.units) {
      if (holds(unit, Items.SacredAsh)) {
        unit.disableItem(Items.SacredAsh);
      }
    }
  }

  const listening = new MergedLifecycle([
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const team = event.source.team;

      if (spent.has(team) || !holds(event.source, Items.SacredAsh)) {
        return;
      }

      // Marked before it is spent, not after: spending the ash is what
      // closes its own gate, and the gate asks whether anything is
      // still rising
      spent.add(team);
      rising.set(team, SACRED_ASH_DELAY);

      if (!spendItem(event.source, Items.SacredAsh)) {
        spent.delete(team);
        rising.delete(team);
        return;
      }

      // Whatever else the side is carrying is ash somebody has already
      // used: one is all a team ever gets
      smother(team);
    }),

    // And a second one picked up afterwards is no better than the ones
    // that were already there
    battle.on(BattleEvents.UnitAddItem, EventPriority.Post, (event) => {
      if (event.item === Items.SacredAsh && spent.has(event.source.team)) {
        event.source.disableItem(Items.SacredAsh);
      }
    }),

    battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [team, remaining] of [...rising]) {
        const left = remaining - event.duration;

        if (left > 0) {
          rising.set(team, left);
          continue;
        }

        rising.delete(team);

        for (const unit of team.units) {
          if (unit.alive) {
            continue;
          }

          unit.revive(unit.checkStat(Stats.HP, 0));

          // Whatever it was waiting on, it is not waiting on it any
          // more: a pokemon brought back mid-cooldown would spend the
          // second chance standing still
          for (const key in unit.moves) {
            // tsc requires the assertion to index the Moves-mapped
            // record; tsgolint resolves the const enum to number and
            // disagrees
            // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
            unit.finishCooldown(Number(key) as Moves);
          }
        }
      }
    }),
  ]);

  return {
    start: () => {
      listening.start();
    },
    /**
     * The ash is spent the moment its holder falls and works a second
     * later, so the listeners have to outlast the item itself
     */
    stop: () => {
      if (rising.size === 0) {
        listening.stop();
      }
    },
  };
});
