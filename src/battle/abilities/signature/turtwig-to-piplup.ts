import { EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import type Unit from '../../unit';
import { createBraceAbility } from './__create';

/** What a flare is worth on the move it rides */
const FLARE_SCALE = 1.5;

/**
 * Sinnoh's three starters, braced for a different blow each: the
 * turtle for a physical one, the chimp for a special one, the penguin
 * for anything that would rather talk than fight
 */
const setupAbilities = [
  /**
   * Bark Brace: the shell puts roots down. Ingrain is what roots mean
   * here, so the heal, the hold on leaving and everything else are the
   * move's own
   */
  createBraceAbility(Abilities.BarkBrace, MoveCategories.Physical, () => ({
    answer: (unit: Unit) => {
      unit.triggerMove(Moves.Ingrain, { type: MoveTargetType.None }, 0);
    },
  })),

  /**
   * Cinder Brace: the blow stokes the flame, and the flame goes into
   * the next move that lands
   */
  createBraceAbility(Abilities.CinderBrace, MoveCategories.Special, (battle) => {
    /** Who is carrying a flare it has not spent yet */
    const flaring = new Set<Unit>();

    return {
      answer: (unit: Unit) => {
        flaring.add(unit);
      },
      lifecycles: [
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.value > 0 &&
            !(parent.flags & MoveAttackFlags.Simulated) &&
            flaring.has(parent.source)
          ) {
            flaring.delete(parent.source);
            event.value *= FLARE_SCALE;
          }
        }),
      ],
    };
  }),

  /**
   * Crest Brace: being talked at rather than fought is the insult it
   * takes the stage from
   */
  createBraceAbility(Abilities.CrestBrace, MoveCategories.Status, () => ({
    answer: (unit: Unit) => {
      unit.addStage(Stages.SpecialAttack, 1, {
        type: EffectType.Ability,
        ability: Abilities.CrestBrace,
        unit,
      });
    },
  })),
];

export default setupAbilities;
