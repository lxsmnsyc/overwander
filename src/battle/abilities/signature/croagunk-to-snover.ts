import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { isCentered } from '../../status/centered';
import { isWeatherHail, unitTarget } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';

/** How much of the wind-up is left once the fight is decided */
export const FINISHER_SCALE = 0.75;

/** Where a target counts as one blow from finished */
export const FINISHER_THRESHOLD = 1 / 4;

/** Where a teammate is hurt enough to be worth covering */
export const FALSE_EYES_THRESHOLD = 1 / 2;

/** What frozen bark leaves of a fire */
export const EVERGREEN_SCALE = 0.5;

/** Whether the unit is down to the share that ends the wind-up */
function nearlyDone(unit: Unit): boolean {
  return unit.health <= unit.checkStat(Stats.HP, 0) * FINISHER_THRESHOLD;
}

/**
 * The frog, the fish and the tree: one throws faster once the fight
 * is decided, one wears the blow meant for somebody worse off, and
 * one stands in the winter it brought with it
 */
const setupAbilities = [
  /**
   * Finisher: the wind-up is what shortens, never the cooldown, so
   * Speed still says how often the line gets to throw anything
   */
  createAbility(
    Abilities.Finisher,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          const target = event.target;

          if (
            target.type === MoveTargetType.Unit &&
            nearlyDone(target.unit) &&
            event.source.hasAbility(Abilities.Finisher)
          ) {
            event.duration *= FINISHER_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, (event) => {
          const target = event.target;

          if (
            target.type === MoveTargetType.Unit &&
            nearlyDone(target.unit) &&
            event.source.hasAbility(Abilities.Finisher)
          ) {
            event.duration *= FINISHER_SCALE;
          }
        }),
      ]),
  ),

  /**
   * False Eyes: the pattern draws the blow across rather than turning
   * it away, so the move lands whole on the fish, accuracy and all,
   * and only what was aimed at one thing can be drawn. Its party
   * rather than its side, the way Hidden Den reads one: a raid ally is
   * not somebody it is swimming with
   */
  createAbility(Abilities.FalseEyes, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveRedirect, EventPriority.Post, (event) => {
      const aimed = event.redirect;

      if (aimed.type !== MoveTargetType.Unit) {
        return;
      }

      const hurt = aimed.unit;

      if (
        event.source.team.alliance === hurt.team.alliance ||
        hurt.health > hurt.checkStat(Stats.HP, 0) * FALSE_EYES_THRESHOLD ||
        // A Follow Me was a cast somebody spent on being aimed at
        isCentered(hurt)
      ) {
        return;
      }

      // Nothing is covered by taking a blow that was going to bounce
      // off anyway, and a teammate drawing the move (Storm Drain, Water
      // Absorb) is owed what it drew
      if (
        event.source.checkMoveImmunity(
          event.move,
          aimed,
          event.source.checkMoveType(event.move, aimed),
        )
      ) {
        return;
      }

      for (const decoy of getAbilityHolders(battle, Abilities.FalseEyes)) {
        if (
          decoy !== hurt &&
          decoy.alive &&
          decoy.team === hurt.team &&
          decoy.hasAbility(Abilities.FalseEyes)
        ) {
          decoy.triggerAbility(Abilities.FalseEyes);
          event.redirect = unitTarget(decoy);
          return;
        }
      }
    }),
  ),

  /**
   * Evergreen: the frost on the bark is what answers the fire, so the
   * line has to be standing in its own weather to be worth anything
   */
  createAbility(Abilities.Evergreen, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const target = event.parent.target;

      if (
        event.parent.type === Types.Fire &&
        event.unit === event.parent.source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        target.hasAbility(Abilities.Evergreen) &&
        isWeatherHail(target)
      ) {
        event.value *= EVERGREEN_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
