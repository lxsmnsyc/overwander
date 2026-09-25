import { EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';

/**
 * The three the region keeps out of the wild: the one that hands its
 * win round, the one that is two shapes of the same song, and the
 * fossil somebody bolted a cannon to.
 */

/** What a win is worth to everybody standing with the winner */
export const WINNERS_SHARE_STAGES = 1;

/** How much of a cast a machine running hot saves */
export const OVERCLOCK_SCALE = 0.75;

/** Where the machine stops saving and starts burning */
export const OVERCLOCK_THRESHOLD = 1 / 2;

/** What running hot past that point costs, each time it acts */
export const OVERCLOCK_SHARE = 1 / 16;

/** The two pairs a shape change turns over */
const COUNTERTUNE_PAIRS: [Stages, Stages][] = [
  [Stages.Attack, Stages.SpecialAttack],
  [Stages.Defense, Stages.SpecialDefense],
];

const setupAbilities = [
  /**
   * Winner's Share: the win is the team's rather than the holder's,
   * so it answers any enemy going down and not only the ones the
   * holder took. Two holders on one team still pay out once
   */
  createAbility(
    Abilities.WinnersShare,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
          const fallen = event.source;
          const served = new Set<Unit['team']>();

          for (const holder of getAbilityHolders(battle, Abilities.WinnersShare)) {
            if (
              !holder.alive ||
              holder.team.alliance === fallen.team.alliance ||
              served.has(holder.team)
            ) {
              continue;
            }
            served.add(holder.team);
            holder.triggerAbility(Abilities.WinnersShare);
          }
        }),

        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.WinnersShare) {
            return;
          }

          const cause = {
            type: EffectType.Ability,
            ability: Abilities.WinnersShare,
            unit: event.source,
          } as const;

          for (const mate of event.source.team.units) {
            if (mate.alive) {
              mate.addStage(Stages.Attack, WINNERS_SHARE_STAGES, cause);
              mate.addStage(Stages.SpecialAttack, WINNERS_SHARE_STAGES, cause);
            }
          }
        }),
      ]),
  ),

  /**
   * Countertune: the singer and the dancer are the same pokemon with
   * its halves swapped, so whatever it built up on one side it keeps
   * on the other. Stages only, never the stats underneath
   */
  createAbility(Abilities.Countertune, (battle) =>
    battle.on(BattleEvents.UnitSetSpecies, EventPriority.Post, (event) => {
      const holder = event.source;

      if (!holder.hasAbility(Abilities.Countertune)) {
        return;
      }

      holder.triggerAbility(Abilities.Countertune);

      for (const [physical, special] of COUNTERTUNE_PAIRS) {
        const held = holder.stages[physical];

        holder.stages[physical] = holder.stages[special];
        holder.stages[special] = held;
      }
    }),
  ),

  /**
   * Overclock: cast times only, never the cooldown, which is Speed's
   * to answer. Past half health the saving stops and the machine
   * starts paying for having run that hot
   */
  createAbility(
    Abilities.Overclock,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          const source = event.source;

          if (
            source.hasAbility(Abilities.Overclock) &&
            source.health > source.checkStat(Stats.HP, 0) * OVERCLOCK_THRESHOLD
          ) {
            event.duration *= OVERCLOCK_SCALE;
          }
        }),

        ...onUnitActs(battle, (unit) => {
          const max = unit.checkStat(Stats.HP, 0);

          if (
            !unit.alive ||
            !unit.hasAbility(Abilities.Overclock) ||
            unit.health > max * OVERCLOCK_THRESHOLD
          ) {
            return;
          }

          unit.triggerAbility(Abilities.Overclock);
          unit.damage(
            { type: EffectType.Ability, ability: Abilities.Overclock, unit },
            unit,
            Math.max(1, Math.floor(max * OVERCLOCK_SHARE)),
            DamageFlags.Indirect,
          );
        }),
      ]),
  ),
];

export default setupAbilities;
