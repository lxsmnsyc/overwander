import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { Moves } from '../../../data/ids/moves';
import { TeamStatuses } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility, getAbilityHolders } from '../__create';
import { STAT_STAGES, createStatExtremes, firstEnemy } from './__create';

/**
 * What the old city and the back alleys hold: the gang, the guardian,
 * the coffin and the rubbish.
 */

/** What each teammate at its back is worth, and where that stops */
export const GANG_UP_STEP = 0.1;
export const GANG_UP_MAX = 1.3;

/** What the mask takes off whoever it watched kill a teammate */
export const DEATH_MASK_STAGES = 2;

/** What a guardian will not have laid on its ground */
const HAZARDS = new Set<TeamStatuses>([
  TeamStatuses.Spikes,
  TeamStatuses.ToxicSpikes,
  TeamStatuses.StealthRock,
]);

const setupAbilities = [
  /**
   * Gang Up: a Scrafty is worth what the rest of the gang is worth,
   * so the count is of its own team rather than the whole alliance
   */
  createAbility(Abilities.GangUp, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (!source.hasAbility(Abilities.GangUp)) {
        return;
      }

      let backing = 0;

      for (const mate of source.team.units) {
        if (mate !== source && mate.alive) {
          backing += 1;
        }
      }

      event.value *= Math.min(GANG_UP_MAX, 1 + backing * GANG_UP_STEP);
    }),
  ),

  /**
   * Ward Circle: nothing is laid on the ground it patrols. The sweep
   * on arrival covers whatever was down before it got there
   */
  createAbility(
    Abilities.WardCircle,
    (battle) =>
      new MergedLifecycle([
        // Nothing asks a team whether it is immune before laying a
        // hazard on it, so the laying itself is what gets stopped
        battle.on(BattleEvents.TeamAddStatus, EventPriority.Pre, (event) => {
          if (!HAZARDS.has(event.status)) {
            return;
          }

          for (const holder of getAbilityHolders(battle, Abilities.WardCircle)) {
            if (
              holder.alive &&
              holder.team === event.team &&
              holder.hasAbility(Abilities.WardCircle)
            ) {
              event.disabled = true;
              holder.triggerAbility(Abilities.WardCircle);
              return;
            }
          }
        }),

        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          const source = event.source;

          if (event.reactivation || !source.hasAbility(Abilities.WardCircle)) {
            return;
          }

          let swept = false;

          for (const status of HAZARDS) {
            if (source.team.status[status] != null) {
              source.team.removeStatus(status, {
                type: EffectType.Ability,
                ability: Abilities.WardCircle,
                unit: source,
              });
              swept = true;
            }
          }

          if (swept) {
            source.triggerAbility(Abilities.WardCircle);
          }
        }),
      ]),
  ),

  /**
   * Death Mask: it takes the face of whoever it watched kill somebody
   * it stood with, which costs that one whatever it is best at
   */
  createAbility(Abilities.DeathMask, (battle) => {
    const stats = createStatExtremes();

    return battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const fallen = event.source;
      const killer = event.attacker;

      if (killer === fallen || !killer.alive || killer.team === fallen.team) {
        return;
      }

      for (const mourner of fallen.team.units) {
        if (mourner === fallen || !mourner.alive || !mourner.hasAbility(Abilities.DeathMask)) {
          continue;
        }

        const stage = STAT_STAGES[stats.extremes(killer).highest];

        if (stage == null) {
          return;
        }
        mourner.triggerAbility(Abilities.DeathMask);
        killer.addStage(stage, -DEATH_MASK_STAGES, {
          type: EffectType.Ability,
          ability: Abilities.DeathMask,
          unit: mourner,
        });
        return;
      }
    });
  }),

  /**
   * Litterbug: it drops what it is carrying wherever it turns up. The
   * cast rides the trigger so the cue and the hazard are one thing
   */
  createAbility(
    Abilities.Litterbug,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.Litterbug)) {
            event.source.triggerAbility(Abilities.Litterbug);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Litterbug) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy != null) {
            event.source.triggerMove(
              Moves.ToxicSpikes,
              { type: MoveTargetType.Team, team: enemy.team },
              0,
            );
          }
        }),
      ]),
  ),
];

export default setupAbilities;
