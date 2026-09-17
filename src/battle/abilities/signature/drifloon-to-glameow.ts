import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';

/** How often the string is taken hold of */
export const CARRY_OFF_CHANCE = 0.2;

/** What one uncoiling is worth, and how many it has in it */
export const SPRINGHEEL_STAGES = 1;
export const SPRINGHEEL_MAX_JUMPS = 3;

/** What a claw is worth against something pleased with itself */
export const VELVET_CLAWS_SCALE = 1.25;

/**
 * The balloon, the ears and the claws: one drifts off with what it
 * touches, one uncoils as it goes, and one goes for whatever has been
 * making itself comfortable
 */
const setupAbilities = [
  /**
   * Carry Off: the string is Whirlwind's, cast rather than rewritten,
   * so a raid boss refuses it and the move's own rules about who can
   * be moved hold
   */
  createAbility(Abilities.CarryOff, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        event.flags & MoveAttackFlags.Simulated ||
        !event.target.alive ||
        !source.hasAbility(Abilities.CarryOff) ||
        battle.random() >= CARRY_OFF_CHANCE
      ) {
        return;
      }

      source.triggerAbility(Abilities.CarryOff);
      source.triggerMove(Moves.Whirlwind, unitTarget(event.target), 0);
    }),
  ),

  /**
   * Springheel: the ears uncoil as it lands blows, and there are only
   * so many coils in them
   */
  createAbility(Abilities.Springheel, (battle) => {
    /** How far each holder has uncoiled */
    const jumped = new Map<Unit, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const spent = jumped.get(source) ?? 0;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          spent >= SPRINGHEEL_MAX_JUMPS ||
          !source.hasAbility(Abilities.Springheel)
        ) {
          return;
        }

        jumped.set(source, spent + 1);
        source.triggerAbility(Abilities.Springheel);
        source.addStage(Stages.Speed, SPRINGHEEL_STAGES, {
          type: EffectType.Ability,
          ability: Abilities.Springheel,
          unit: source,
        });
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        jumped.delete(event.source);
      }),
    ]);
  }),

  /**
   * Velvet Claws: it goes for whatever has been making itself
   * comfortable. Raising a stat is what marks a target, and the mark
   * stays whether or not the stage is still there
   */
  createAbility(Abilities.VelvetClaws, (battle) => {
    /** Who has raised a stat in this fight */
    const pleased = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
        if (event.value > 0) {
          pleased.add(event.source);
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.power == null ||
          target.type !== MoveTargetType.Unit ||
          !pleased.has(target.unit) ||
          !event.source.hasAbility(Abilities.VelvetClaws) ||
          !event.source.checkMoveContact(event.move, target)
        ) {
          return;
        }

        event.power *= VELVET_CLAWS_SCALE;
      }),
    ]);
  }),
];

export default setupAbilities;
