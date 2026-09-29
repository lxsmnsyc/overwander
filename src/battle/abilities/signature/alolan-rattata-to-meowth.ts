import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, Moves } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { isOwnBerry, isWeatherHail, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState, firstEnemy } from './__create';

/** What Fire and Fighting moves do to the forged ice */
export const FROSTFORGED_SCALE = 0.75;

const FORGED_AGAINST = new Set([Types.Fire, Types.Fighting]);

/**
 * The Alolan lines: the rat that grows on rich food, the mouse forged
 * in the snow, the fox that raises the aurora, the mole whose hair
 * snares, and the cat too proud to be ignored
 */
const setupAbilities = [
  // Alolan Rattata: a berry it eats itself goes straight to its bite
  createAbility(Abilities.RichDiet, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const { cause, source } = event;

      // Eaten rather than knocked away: a consumed item carries its own cause
      if (
        cause.type !== EffectType.Item ||
        cause.item !== event.item ||
        !isOwnBerry(cause, source) ||
        !source.alive ||
        !source.hasAbility(Abilities.RichDiet)
      ) {
        return;
      }
      source.triggerAbility(Abilities.RichDiet);
      source.addStage(Stages.Attack, 1, {
        type: EffectType.Ability,
        ability: Abilities.RichDiet,
        unit: source,
      });
    }),
  ),

  // Alolan Sandshrew: the snow it was forged in softens both of the
  // blows it is weakest to
  createAbility(Abilities.Frostforged, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const { target, type } = event.parent;

      if (FORGED_AGAINST.has(type) && target.hasAbility(Abilities.Frostforged)) {
        event.value *= FROSTFORGED_SCALE;
      }
    }),
  ),

  // Alolan Vulpix: under falling snow it raises the aurora as it arrives.
  // Aurora Veil answers for its own duration and for whether snow is up
  createAbility(
    Abilities.AuroraCrown,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          const source = event.source;

          if (
            !event.reactivation &&
            source.hasAbility(Abilities.AuroraCrown) &&
            isWeatherHail(source)
          ) {
            source.triggerAbility(Abilities.AuroraCrown);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.AuroraCrown) {
            event.source.triggerMove(
              Moves.AuroraVeil,
              { type: MoveTargetType.Team, team: event.source.team },
              0,
            );
          }
        }),
      ]),
  ),

  // Alolan Diglett: the first hand that touches it after each entrance
  // is caught in its hair. Bind answers for the hold itself
  createAbility(Abilities.WireSnare, (battle) => {
    const { state: spent, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const { cause, target } = event;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !cause.unit.alive ||
          !target.alive ||
          spent.get(target) === true ||
          !target.hasAbility(Abilities.WireSnare) ||
          !cause.unit.checkMoveContact(cause.move, unitTarget(target))
        ) {
          return;
        }
        spent.set(target, true);
        target.triggerAbility(Abilities.WireSnare);
        target.triggerMove(Moves.Bind, unitTarget(cause.unit), 0);
      }),
    ]);
  }),

  // Alolan Meowth: it arrives looking down on whoever it meets
  createAbility(
    Abilities.TauntingGaze,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.TauntingGaze)) {
            event.source.triggerAbility(Abilities.TauntingGaze);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.TauntingGaze) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.Taunt, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),
];

export default setupAbilities;
