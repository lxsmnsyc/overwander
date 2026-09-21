import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, StatFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/** The share of a blow that is held back, and how long it takes to arrive */
export const SEEPAGE_SHARE = 0.4;
export const SEEPAGE_DELAY = turns(2);

/** What outrunning the target is worth */
export const OUTPACE_SCALE = 1.3;

/**
 * The slug that soaks a blow and the bat that is already past it. One
 * argues with when damage lands, the other with who moved first
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

  createAbility(Abilities.Outpace, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const attacker = parent.source;

      if (event.value <= 0 || !attacker.hasAbility(Abilities.Outpace)) {
        return;
      }

      const mine = attacker.resolveStat(Stats.Speed, StatFlags.Attack);
      const theirs = parent.target.resolveStat(Stats.Speed, StatFlags.Attack);

      if (mine > theirs) {
        event.value *= OUTPACE_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
