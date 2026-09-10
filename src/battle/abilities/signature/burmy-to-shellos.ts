import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { Species } from '../../../data/ids/species';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/** The two sides a patch goes up, and how many holes are worth patching */
const PATCHED_STAGES = [Stages.Defense, Stages.SpecialDefense];
export const PATCHWORK_MAX_PATCHES = 3;

/** What the far shore is worth to the move it is thrown with */
export const TWO_SEAS_SCALE = 1.25;

/** Which type each shell answers with, the east one being the blue one */
const SHELL_TYPE: { [key in Species]?: Types } = {
  [Species.Shellos]: Types.Water,
  [Species.Gastrodon]: Types.Water,
  [Species.ShellosEast]: Types.Ground,
  [Species.GastrodonEast]: Types.Ground,
};

/**
 * The bagworm and the sea slug: one is built out of what it is hit
 * with, the other out of which side of the world it was met on
 */
const setupAbilities = [
  /**
   * Patchwork: a hole is only worth patching once, so a long fight
   * leaves it harder than it started and a burst of one type does not
   */
  createAbility(Abilities.Patchwork, (battle) => {
    /** What each holder has already been hit with */
    const found = new Map<Unit, Set<Types>>();

    function patch(unit: Unit, type: Types): void {
      let seen = found.get(unit);

      if (!seen) {
        seen = new Set();
        found.set(unit, seen);
      }
      if (seen.has(type) || seen.size >= PATCHWORK_MAX_PATCHES) {
        return;
      }

      seen.add(type);
      unit.triggerAbility(Abilities.Patchwork);

      for (const stage of PATCHED_STAGES) {
        unit.addStage(stage, 1, {
          type: EffectType.Ability,
          ability: Abilities.Patchwork,
          unit,
        });
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          event.target.alive &&
          event.target !== event.source &&
          event.target.hasAbility(Abilities.Patchwork)
        ) {
          patch(event.target, event.type);
        }
      }),
      // The case is rebuilt for the next fight, not carried over
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        found.delete(event.source);
      }),
    ]);
  }),

  /**
   * Two Seas: the shell says which half of the sea it came out of,
   * and that is the half it fights with
   */
  createAbility(Abilities.TwoSeas, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const shell = SHELL_TYPE[event.source.species];

      if (
        event.power == null ||
        shell == null ||
        !event.source.hasAbility(Abilities.TwoSeas) ||
        event.source.checkMoveType(event.move, event.target) !== shell
      ) {
        return;
      }

      event.power *= TWO_SEAS_SCALE;
    }),
  ),
];

export default setupAbilities;
