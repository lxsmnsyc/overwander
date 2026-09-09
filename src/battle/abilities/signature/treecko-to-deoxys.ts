import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { Weathers } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { isWeatherRainy, isWeatherSunny, onUnitActs } from '../../utils';
import { createAbility } from '../__create';
import {
  createGroveAbility,
  createGrowthAbility,
  createTimedMarks,
  createUnitCounter,
  createUnitState,
} from './__create';

/** What a target the pack has already opened up is worth */
export const PACK_HUNT_SCALE = 1.2;

/** What one crooked step takes off a blow aimed at it, and how many it keeps */
export const CROOKED_RUN_SCALE = 0.9;
export const CROOKED_RUN_MAX_STACKS = 3;

/** What the shell is worth both ways, how long it holds, and what opens it */
export const COCOON_SCALE = 0.5;
export const COCOON_DURATION = 4000;
export const COCOON_THRESHOLD = 1 / 2;

const treeckoToDeoxys = [
  // The Hoenn starters: one growth each, in the stat its line is built
  // on, set off by what that line does with a fight
  createGrowthAbility(Abilities.SapSurge, Stages.Speed, 'acts'),
  createGrowthAbility(Abilities.EmberSurge, Stages.Attack, 'lands'),
  createGrowthAbility(Abilities.SiltSurge, Stages.SpecialDefense, 'takes'),

  // Poochyena: it hunts what the pack has already been at. Kept on the
  // quarry, so it is dropped when that quarry leaves or falls
  createAbility(Abilities.PackHunt, (battle) => {
    const { state, lifecycles } = createUnitState<Set<Unit>>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type === EffectType.None
        ) {
          return;
        }

        const marks = state.get(event.target) ?? new Set<Unit>();

        marks.add(cause.unit);
        state.set(event.target, marks);
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;
        const source = event.source;

        if (
          event.power == null ||
          target.type !== MoveTargetType.Unit ||
          !source.hasAbility(Abilities.PackHunt)
        ) {
          return;
        }

        const marks = state.get(target.unit);

        if (marks == null) {
          return;
        }

        // The pack, not the hound itself: what it has bitten alone is
        // no easier for the next bite
        for (const hunter of marks) {
          if (hunter !== source && hunter.team.alliance === source.team.alliance) {
            event.power *= PACK_HUNT_SCALE;

            return;
          }
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Zigzagoon: it never comes at anything straight, and the run only
  // counts while nothing has caught it
  createAbility(Abilities.CrookedRun, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      ...onUnitActs(battle, (unit) => {
        const steps = counter.get(unit);

        if (steps >= CROOKED_RUN_MAX_STACKS || !unit.hasAbility(Abilities.CrookedRun)) {
          return;
        }

        counter.set(unit, steps + 1);
        unit.triggerAbility(Abilities.CrookedRun);
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.target.hasAbility(Abilities.CrookedRun)
        ) {
          counter.clear(event.target);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.accuracy == null ||
          target.type !== MoveTargetType.Unit ||
          !target.unit.hasAbility(Abilities.CrookedRun)
        ) {
          return;
        }

        event.accuracy *= CROOKED_RUN_SCALE ** counter.get(target.unit);
      }),
      ...lifecycles,
    ]);
  }),

  // Wurmple: the shell it grows into, borrowed once in a fight. It
  // covers both sides of a blow, so hiding costs it the exchange
  createAbility(Abilities.Cocoon, (battle) => {
    const shelled = createTimedMarks(battle);
    const spent = new Set<Unit>();

    return new MergedLifecycle([
      ...shelled.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          spent.has(target) ||
          !target.hasAbility(Abilities.Cocoon) ||
          target.health >= target.checkStat(Stats.HP, 0) * COCOON_THRESHOLD
        ) {
          return;
        }

        spent.add(target);
        target.triggerAbility(Abilities.Cocoon);
        shelled.mark(target, COCOON_DURATION);
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (shelled.has(parent.target)) {
          event.value *= COCOON_SCALE;
        }

        if (shelled.has(parent.source)) {
          event.value *= COCOON_SCALE;
        }
      }),
    ]);
  }),

  // Lotad and Seedot: counterparts, each calling up its own sky and
  // paid by it, so the last one in owns the weather
  createGroveAbility(Abilities.WaterBloom, Weathers.Rain, isWeatherRainy, 'heals'),
  createGroveAbility(Abilities.SunRoot, Weathers.Sunny, isWeatherSunny, 'strikes'),
];

export default treeckoToDeoxys;
