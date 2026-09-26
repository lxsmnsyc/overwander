import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/** The share of a blow that is held back, and how long it takes to arrive */
export const SEEPAGE_SHARE = 0.4;
export const SEEPAGE_DELAY = turns(2);

/**
 * The slug that soaks a blow and the bat that hears where it came
 * from. One argues with when damage lands, the other answers it
 */
const setupAbilities = [
  createAbility(Abilities.Seepage, (battle) => {
    // What each holder still owes, and how long it has to pay it
    const owed = new Map<Unit, { left: number; due: number }>();

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [unit, debt] of owed) {
        const share = Math.min(debt.left, (debt.left * event.duration) / debt.due);

        debt.due -= event.duration;
        debt.left -= share;

        if (share > 0 && unit.alive) {
          unit.damage(
            { type: EffectType.Ability, ability: Abilities.Seepage, unit },
            unit,
            share,
            DamageFlags.Indirect,
          );
        }

        if (debt.left <= 0 || debt.due <= 0 || !unit.alive) {
          owed.delete(unit);
        }
      }

      if (owed.size === 0) {
        clock.stop();
      }
    });

    clock.stop();

    return new MergedLifecycle([
      clock,
      // Held back before the blow is paid, so the slime is what the
      // hit meets rather than something that heals it afterwards
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        if (
          event.value <= 0 ||
          (event.flags & DamageFlags.Indirect) !== 0 ||
          !event.target.hasAbility(Abilities.Seepage)
        ) {
          return;
        }

        const held = event.value * SEEPAGE_SHARE;
        const debt = owed.get(event.target);

        event.value -= held;
        event.target.triggerAbility(Abilities.Seepage);

        // A second blow inside the window adds to what is owed and
        // starts the clock again rather than queueing behind it
        owed.set(event.target, {
          left: (debt?.left ?? 0) + held,
          due: SEEPAGE_DELAY,
        });
        clock.start();
      }),
    ]);
  }),

  createAbility(Abilities.Echolocation, (battle) => {
    // Every enemy each holder has heard land a move on it, and not yet answered
    const { state: heard, lifecycles } = createUnitState<Set<Unit>>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const holder = event.target;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          event.source.team === holder.team ||
          !holder.alive ||
          !holder.hasAbility(Abilities.Echolocation)
        ) {
          return;
        }

        const enemies = heard.get(holder) ?? new Set<Unit>();

        enemies.add(event.source);
        heard.set(holder, enemies);
      }),
      // Before the roll, the way Merciless answers, so armour still
      // refuses it at Post
      battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Pre, (event) => {
        const parent = event.parent;
        const holder = parent.source;

        if (
          event.critical ||
          !heard.get(holder)?.has(parent.target) ||
          !holder.hasAbility(Abilities.Echolocation)
        ) {
          return;
        }
        event.critical = true;

        // The AI asking what a move would do reads the critical but
        // does not spend it
        if (!(parent.flags & MoveAttackFlags.Simulated)) {
          heard.get(holder)?.delete(parent.target);
          holder.triggerAbility(Abilities.Echolocation);
        }
      }),
    ]);
  }),
];

export default setupAbilities;
