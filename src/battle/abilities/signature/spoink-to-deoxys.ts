import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';
import { createDamageTaken, createUnitState } from './__create';

/** The share of a blow the springs keep, and how much they hold */
export const STORED_BOUNCE_SHARE = 1 / 2;
export const STORED_BOUNCE_CAP = 1 / 2;

/** What a fresh set of spots is worth, and what it costs */
export const UNIQUE_SPOTS_RAISED = 2;
export const UNIQUE_SPOTS_LOWERED = 1;

/** The five a set of spots is rolled over */
const SPOTTED_STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
];

/** What walking into the pit costs whoever missed */
export const ANTLION_PIT_FRACTION = 1 / 8;

/** What each second of waiting is worth, and how long the wait counts */
export const PATIENT_STALK_STEP = 0.1;
export const PATIENT_STALK_MAX_STEPS = 5;
export const PATIENT_STALK_SECOND = 1000;

const spoinkToDeoxys = [
  // Spoink: the springs keep half of whatever lands on it, and the next
  // blow it lands gives the lot back
  createAbility(Abilities.StoredBounce, (battle) => {
    const damage = createDamageTaken(battle);
    const { state, lifecycles } = createUnitState<number>(battle);

    return new MergedLifecycle([
      ...damage.lifecycles,
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const taken = damage.taken(event);
        const target = event.target;

        if (
          !event.success ||
          taken == null ||
          taken <= 0 ||
          event.flags & DamageFlags.Indirect ||
          !target.alive ||
          !target.hasAbility(Abilities.StoredBounce)
        ) {
          return;
        }

        const held = (state.get(target) ?? 0) + taken * STORED_BOUNCE_SHARE;

        state.set(target, Math.min(target.checkStat(Stats.HP, 0) * STORED_BOUNCE_CAP, held));
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const held = state.get(source);

        if (
          !event.success ||
          !event.target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          held == null ||
          held <= 0 ||
          !source.hasAbility(Abilities.StoredBounce)
        ) {
          return;
        }

        state.set(source, 0);
        source.triggerAbility(Abilities.StoredBounce);

        source.damage(
          { type: EffectType.Ability, ability: Abilities.StoredBounce, unit: source },
          event.target,
          held,
          DamageFlags.Indirect,
        );
      }),
    ]);
  }),

  // Spinda: no two of them are marked the same, so each arrival rolls
  // its own pair of spots
  createAbility(Abilities.UniqueSpots, (battle) =>
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      const source = event.source;

      if (event.reactivation || !source.hasAbility(Abilities.UniqueSpots)) {
        return;
      }

      const raised = SPOTTED_STAGES[Math.floor(battle.random() * SPOTTED_STAGES.length)];
      const others = SPOTTED_STAGES.filter((stage) => stage !== raised);
      const lowered = others[Math.floor(battle.random() * others.length)];
      const cause = {
        type: EffectType.Ability,
        ability: Abilities.UniqueSpots,
        unit: source,
      } as const;

      source.triggerAbility(Abilities.UniqueSpots);
      source.addStage(raised, UNIQUE_SPOTS_RAISED, cause);
      source.addStage(lowered, -UNIQUE_SPOTS_LOWERED, cause);
    }),
  ),

  // Trapinch: the pit is the point. Whatever swings at it and misses
  // has already fallen in
  createAbility(Abilities.AntlionPit, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (
        event.hit ||
        target.type !== MoveTargetType.Unit ||
        parent.source === target.unit ||
        !target.unit.hasAbility(Abilities.AntlionPit)
      ) {
        return;
      }

      const pit = target.unit;

      pit.triggerAbility(Abilities.AntlionPit);
      pit.damage(
        { type: EffectType.Ability, ability: Abilities.AntlionPit, unit: pit },
        parent.source,
        parent.source.checkStat(Stats.HP, 0) * ANTLION_PIT_FRACTION,
        DamageFlags.Indirect,
      );
    }),
  ),

  // Cacnea: it waits for whatever it is following to tire, and the
  // whole wait goes into one blow
  createAbility(Abilities.PatientStalk, (battle) => {
    const { state, lifecycles } = createUnitState<{ steps: number; waited: number }>(battle);

    function held(unit: Unit): number {
      return state.get(unit)?.steps ?? 0;
    }

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const unit of battle.units()) {
          if (!unit.alive || !unit.hasAbility(Abilities.PatientStalk)) {
            continue;
          }

          if (unit.casting != null || unit.channeling != null) {
            continue;
          }

          const kept = state.get(unit) ?? { steps: 0, waited: 0 };
          const waited = kept.waited + event.duration;

          state.set(unit, {
            steps: Math.min(
              PATIENT_STALK_MAX_STEPS,
              kept.steps + Math.floor(waited / PATIENT_STALK_SECOND),
            ),
            waited: waited % PATIENT_STALK_SECOND,
          });
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const source = event.source;

        if (event.power != null && source.hasAbility(Abilities.PatientStalk)) {
          event.power *= 1 + PATIENT_STALK_STEP * held(source);
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          held(source) > 0 &&
          source.hasAbility(Abilities.PatientStalk)
        ) {
          source.triggerAbility(Abilities.PatientStalk);
          state.set(source, { steps: 0, waited: 0 });
        }
      }),
    ]);
  }),
];

export default spoinkToDeoxys;
