import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';
import { createGrowthAbility, createUnitState } from './__create';

/** What a target the pack has already opened up is worth */
export const PACK_HUNT_SCALE = 1.2;

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
];

export default treeckoToDeoxys;
