import { EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from '../__create';
import { BONEWEAR_STAGES, WARCRY_STAGES, createCarrionAbility } from './__create';

/**
 * Routes 9 and 10: the blade that will not be outdone, and the two
 * birds that never share a sky.
 */

/** What being shown up is worth to something carrying that many edges */
export const HONED_STAGES = 1;

const setupAbilities = [
  /**
   * Honed: the Defiant already in the line answers a stat coming off
   * it, so this answers one going onto whatever it is facing. Between
   * the two, nothing done to a stat goes unanswered
   */
  createAbility(
    Abilities.Honed,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
          const raised = event.source;
          const cause = event.cause;

          // Its own answer is a boost too, so two of them facing each
          // other would raise each other forever
          if (
            event.value <= 0 ||
            (cause.type === EffectType.Ability && cause.ability === Abilities.Honed)
          ) {
            return;
          }

          for (const rival of battle.units(raised.team.alliance)) {
            if (rival.alive && rival.hasAbility(Abilities.Honed)) {
              rival.triggerAbility(Abilities.Honed);
            }
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Honed) {
            event.source.addStage(Stages.Attack, HONED_STAGES, {
              type: EffectType.Ability,
              ability: Abilities.Honed,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  /** Warcry: it fights on for the one that went down beside it */
  createCarrionAbility(Abilities.Warcry, true, [[Stages.Attack, WARCRY_STAGES]]),

  /** Bonewear: another bone for the dress, off whatever it outlived */
  createCarrionAbility(Abilities.Bonewear, false, [
    [Stages.Defense, BONEWEAR_STAGES],
    [Stages.SpecialDefense, BONEWEAR_STAGES],
  ]),
];

export default setupAbilities;
