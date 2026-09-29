import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import type Unit from '../../unit';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/** What a dive onto something in the middle of a move is worth */
export const STOOP_SCALE = 1.3;

/** How far the dust off a wing takes an eye, and how far it ever goes */
export const WINGSCALE_STAGES = 1;
export const WINGSCALE_FLOOR = 2;

/** The guard a loosened wall no longer offers */
const GUARDED = new Set<Stats>([Stats.Defense, Stats.SpecialDefense]);

/** Whether the unit is part way through a move, which is when a bird stoops */
function committed(unit: Unit): boolean {
  return unit.casting != null || unit.channeling != null;
}

/**
 * The three the first roads out of Kalos's towns are walked past: the
 * rabbit that digs the ground out from under a guard, the robin that
 * falls on whatever is busy, and the butterfly whose dust puts an eye
 * out of true
 */
const setupAbilities = [
  createAbility(Abilities.LoosenedEarth, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const stage = event.stat === Stats.Defense ? Stages.Defense : Stages.SpecialDefense;

      // The ears go under the wall rather than through it: what the
      // target built up counts for nothing, and what it lost still does
      if (
        event.unit === parent.target &&
        parent.type === Types.Ground &&
        GUARDED.has(event.stat) &&
        parent.source.hasAbility(Abilities.LoosenedEarth) &&
        event.unit.stages[stage] > 0
      ) {
        event.value = event.unit.checkStat(event.stat, 0);
      }
    }),
  ),

  createAbility(Abilities.Stoop, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        parent.type === Types.Flying &&
        parent.source.hasAbility(Abilities.Stoop) &&
        committed(parent.target)
      ) {
        event.value *= STOOP_SCALE;
      }
    }),
  ),

  createAbility(Abilities.Wingscale, (battle) => {
    // How much dust each target has taken, so the floor is per target
    // rather than per fight. It is kept on the target, so it goes when
    // that target leaves the field or falls
    const { state, lifecycles } = createUnitState<number>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          (event.flags & MoveAttackFlags.Simulated) !== 0 ||
          !event.source.hasAbility(Abilities.Wingscale) ||
          target === event.source ||
          !target.alive
        ) {
          return;
        }

        const taken = state.get(target) ?? 0;

        if (taken >= WINGSCALE_FLOOR) {
          return;
        }
        state.set(target, taken + WINGSCALE_STAGES);
        event.source.triggerAbility(Abilities.Wingscale);
        target.addStage(Stages.Accuracy, -WINGSCALE_STAGES, {
          type: EffectType.Ability,
          ability: Abilities.Wingscale,
          unit: event.source,
        });
      }),
    ]);
  }),
];

export default setupAbilities;
