import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import turns from '../turn';
import type Unit from '../unit';

/**
 * The two Dark moves that wait for their moment.
 *
 * Both read "this turn" in the mainline, which is nothing here: a
 * fight on a clock has no turn a target could already have taken. A
 * window does the same job. Payback catches a target that has just
 * committed to something, Assurance one that is already bleeding, and
 * either way the reward is for striking at the right moment rather
 * than for moving second
 */
const WINDOW = turns(1);

/** How much harder either lands when its moment is there */
const PAID_BACK = 2;

/** The two that wait, so the check below is one lookup rather than two */
const WAITING = new Set<Moves>([Moves.Payback, Moves.Assurance]);

export default function setupPayback(battle: Battle): void {
  /** How long is left of each unit's window, in milliseconds */
  const cast = new Map<Unit, number>();
  const hurt = new Map<Unit, number>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const window of [cast, hurt]) {
      for (const [unit, left] of window) {
        if (left <= event.duration) {
          window.delete(unit);
        } else {
          window.set(unit, left - event.duration);
        }
      }
    }
    if (cast.size === 0 && hurt.size === 0) {
      timer.stop();
    }
  });

  timer.stop();

  const open = (window: Map<Unit, number>, unit: Unit): void => {
    window.set(unit, WINDOW);
    timer.start();
  };

  battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
    open(cast, event.source);
  });

  // Damage that landed, so a throw the target shrugged off is not a
  // wound Assurance can lean on
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (event.success && event.value > 0) {
      open(hurt, event.target);
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const window = event.move === Moves.Payback ? cast : hurt;

    if (WAITING.has(event.move) && window.has(event.target.unit)) {
      event.power *= PAID_BACK;
    }
  });
}
