import { EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { StatFlags } from '../../../data/ids/moves';
import type { UnitAttackEvent } from '../../events';
import type Unit from '../../unit';
import type Abilities from '../../../data/ids/abilities';
import type { Statuses } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from './create';

/** Abilities that refuse something: a status, a stat drop, a critical, an aim */
/**
 * Meta ability for status-immunity abilities (Limber, Vital Spirit,
 * Insomnia, Water Veil, Immunity): the statuses cannot land, a cue
 * fires on blocked applications, and gaining the ability cures any
 * blocked status already present
 * https://bulbapedia.bulbagarden.net/wiki/Limber_(Ability)
 */
export function createLimberAbility(
  targetAbility: Abilities,
  statuses: Statuses[],
): (battle: Battle) => void {
  const blocked = new Set(statuses);

  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        // Pure query: the statuses cannot land
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            blocked.has(event.status) &&
            event.source.hasAbility(targetAbility)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (blocked.has(event.status) && event.source.hasAbility(targetAbility)) {
            event.source.triggerAbility(targetAbility);
          }
        }),
        // Gaining the ability also cures a blocked status already
        // present (modern mechanics)
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          if (event.ability === targetAbility) {
            for (const status of blocked) {
              if (event.source.status[status] != null) {
                event.source.removeStatus(status, {
                  type: EffectType.Ability,
                  ability: targetAbility,
                  unit: event.source,
                });
              }
            }
          }
        }),
      ]),
  );
}

/**
 * Meta ability for Keen Eye and Illuminate (modern mechanics): other
 * units cannot lower the holder's accuracy, and the holder's own
 * attacks ignore the target's evasion stages
 * https://bulbapedia.bulbagarden.net/wiki/Keen_Eye_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Illuminate_(Ability)
 */
function accuracyStageFactor(stage: number): number {
  const clamped = Math.max(-6, Math.min(stage, 6));
  return clamped < 0 ? 3 / (3 - clamped) : (3 + clamped) / 3;
}

export function createKeenEyeAbility(targetAbility: Abilities): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.stage === Stages.Accuracy &&
            event.value < 0 &&
            event.source.hasAbility(targetAbility) &&
            event.cause.type !== EffectType.None &&
            event.cause.unit !== event.source
          ) {
            event.success = false;

            // A cue is something a watcher sees, so it waits for a real
            // attempt rather than the AI weighing one
            if (!event.simulated) {
              event.source.triggerAbility(targetAbility);
            }
          }
        }),
        // The holder's attacks ignore the target's evasion stages:
        // compensate the stage factor the shared resolver applied
        battle.on(BattleEvents.UnitTriggerMoveResolveAccuracy, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.accuracy != null &&
            parent.target.type === MoveTargetType.Unit &&
            parent.source.hasAbility(targetAbility)
          ) {
            const accuracy = parent.source.checkStage(Stages.Accuracy, StatFlags.Attack);
            const evasion = parent.target.unit.checkStage(Stages.Evasion, StatFlags.Attack);

            if (evasion !== 0) {
              event.accuracy *=
                accuracyStageFactor(accuracy) / accuracyStageFactor(accuracy - evasion);
            }
          }
        }),
      ]),
  );
}

/**
 * Meta ability for Shell Armor and Battle Armor: critical hits never
 * land on the holder
 * https://bulbapedia.bulbagarden.net/wiki/Shell_Armor_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Battle_Armor_(Ability)
 */
export function createShellArmorAbility(targetAbility: Abilities): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
      if (event.critical && event.parent.target.hasAbility(targetAbility)) {
        event.critical = false;
      }
    }),
  );
}

/**
 * Meta ability for the super-effective softeners (Filter, Solid Rock):
 * a quarter off whatever lands super effective.
 *
 * The effectiveness arrives one type at a time, so the multipliers are
 * gathered per attack and the reduction is paid once, on the damage
 */
export function createFilterAbility(targetAbility: Abilities): (battle: Battle) => void {
  const FACTOR = 0.75;

  return createAbility(targetAbility, (battle) => {
    const totals = new WeakMap<UnitAttackEvent, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        if (event.parent.target.hasAbility(targetAbility)) {
          totals.set(event.parent, (totals.get(event.parent) ?? 1) * event.multiplier);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const total = totals.get(event.parent);

        if (total != null && total > 1) {
          event.value *= FACTOR;
        }
      }),
    ]);
  });
}

/**
 * Meta ability for the two that rewrite a stat change on its way in
 * (Contrary, Simple). The change is refused and re-made through
 * `restage`, with the holder held aside so the second call does not
 * come straight back through here
 * https://bulbapedia.bulbagarden.net/wiki/Contrary_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Simple_(Ability)
 */
export function createRestageAbility(
  targetAbility: Abilities,
  restage: (value: number) => number,
): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) => {
    const rewriting = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
        if (
          !event.success ||
          event.value === 0 ||
          rewriting.has(event.source) ||
          !event.source.hasAbility(targetAbility)
        ) {
          return;
        }

        event.success = false;

        // The refusal is the whole answer for the AI weighing a move:
        // the rewritten change belongs to a cast that actually happened
        if (event.simulated) {
          return;
        }
        event.source.triggerAbility(targetAbility);

        rewriting.add(event.source);
        event.source.addStage(event.stage, restage(event.value), event.cause);
        rewriting.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        rewriting.delete(event.source);
      }),
    ]);
  });
}
