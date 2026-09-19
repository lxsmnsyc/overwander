import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { MoveFlags } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { isDanceMove } from '../../../data/moves/dances';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/**
 * What Pinwheel Forest holds: the tailors, the centipedes and the two
 * halves of its undergrowth.
 */

/** What a suit of leaves is worth to whoever is wearing it */
export const TAILOR_SCALE = 0.8;

/** How much harder its poison bites than anybody else's */
export const HURRY_VENOM_SCALE = 1.5;

/** The two kinds of poison a bite can leave */
const VENOMS = new Set<Statuses>([Statuses.Poisoned, Statuses.BadlyPoisoned]);

const setupAbilities = [
  /**
   * Tailor: it makes clothes for whoever needs them most, once each
   * time it arrives, and the leaves stay on for the rest of the fight.
   * One suit per teammate: it dresses the next one along rather than
   * making the same one a second coat
   */
  createAbility(Abilities.Tailor, (battle) => {
    /** Who is wearing leaves */
    const dressed = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.reactivation || !event.source.hasAbility(Abilities.Tailor)) {
          return;
        }

        let worst: Unit | undefined;

        for (const unit of event.source.team.units) {
          if (unit === event.source || !unit.alive || dressed.has(unit)) {
            continue;
          }
          if (worst == null || unit.health < worst.health) {
            worst = unit;
          }
        }

        if (worst == null) {
          return;
        }
        event.source.triggerAbility(Abilities.Tailor);
        dressed.add(worst);
      }),

      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        if (dressed.has(event.parent.target)) {
          event.value *= TAILOR_SCALE;
        }
      }),

      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        dressed.delete(event.source);
      }),
    ]);
  }),

  /**
   * Hurry Venom: its poison works faster than anybody else's. Marked
   * on whoever it bit rather than read off the status, since what
   * makes the poison quick is the centipede that left it there
   */
  createAbility(Abilities.HurryVenom, (battle) => {
    /** Who is carrying its poison rather than somebody else's */
    const bitten = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
        if (
          !VENOMS.has(event.status) ||
          event.cause.type === EffectType.None ||
          !event.cause.unit.hasAbility(Abilities.HurryVenom)
        ) {
          return;
        }
        event.cause.unit.triggerAbility(Abilities.HurryVenom);
        bitten.add(event.source);
      }),

      battle.on(BattleEvents.CheckUnitStatusDamage, EventPriority.Post, (event) => {
        if (VENOMS.has(event.status) && bitten.has(event.source)) {
          event.value *= HURRY_VENOM_SCALE;
        }
      }),

      battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
        if (VENOMS.has(event.status)) {
          bitten.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        bitten.delete(event.source);
      }),
    ]);
  }),

  /**
   * Spore Drift: the wind puts its powder where it likes. A Grass
   * type's own immunity and an Overcoat both answer the immunity
   * check, so clearing that covers each of them
   */
  createAbility(
    Abilities.SporeDrift,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune ||
            !event.source.hasAbility(Abilities.SporeDrift) ||
            !(getMoveData(event.move).flags & MoveFlags.Powder)
          ) {
            return;
          }
          event.immune = false;
          event.source.triggerAbility(Abilities.SporeDrift);
        }),

        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.accuracy != null &&
            event.source.hasAbility(Abilities.SporeDrift) &&
            getMoveData(event.move).flags & MoveFlags.Powder
          ) {
            event.accuracy = undefined;
          }
        }),
      ]),
  ),

  /**
   * Pollen Waltz: whatever a dance does for it, it does for the ones
   * dancing with it. Only the gains, and only off a dance of its own:
   * the copy arrives as an ability rather than as the move, so it
   * cannot set itself off again
   */
  createAbility(Abilities.PollenWaltz, (battle) =>
    battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
      const dancer = event.source;

      if (
        event.value <= 0 ||
        event.cause.type !== EffectType.Move ||
        event.cause.unit !== dancer ||
        !isDanceMove(event.cause.move) ||
        !dancer.hasAbility(Abilities.PollenWaltz)
      ) {
        return;
      }
      dancer.triggerAbility(Abilities.PollenWaltz);

      for (const unit of dancer.team.units) {
        if (unit !== dancer && unit.alive) {
          unit.addStage(event.stage, event.value, {
            type: EffectType.Ability,
            ability: Abilities.PollenWaltz,
            unit: dancer,
          });
        }
      }
    }),
  ),
];

export default setupAbilities;
