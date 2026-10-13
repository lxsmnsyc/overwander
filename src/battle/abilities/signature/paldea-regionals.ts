import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { HEALING_MOVES } from '../../moves/recover';
import turns from '../../turn';
import { createAbility } from '../__create';
import { createTimedMarks } from './__create';

/** How long Bog Down holds an enemy that struck it with a Ground move */
export const BOG_DOWN_DURATION = turns(3);

/** How much faster a raging Paldean Tauros winds up */
export const RAGING_SCALE = 0.8;

/** How much faster Tea Service winds up a heal for a teammate */
export const TEA_SERVICE_SCALE = 0.6;

/**
 * Paldea's regional lines and the tea pair's support half: the mud a
 * Clodsire sinks a striker into, the bull that charges harder once it
 * is angry, and the tea poured quicker for a guest
 */
const setupAbilities = [
  // Paldean Wooper and Clodsire: a Ground move sinks the one who threw
  // it into the bog, and it cannot get out for a while
  createAbility(Abilities.BogDown, (battle) => {
    const stuck = createTimedMarks(battle);

    return new MergedLifecycle([
      ...stuck.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const attacker = event.source;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          battle.estimating ||
          event.type !== Types.Ground ||
          attacker.team.alliance === event.target.team.alliance ||
          !event.target.hasAbility(Abilities.BogDown)
        ) {
          return;
        }

        event.target.triggerAbility(Abilities.BogDown);
        stuck.mark(attacker, BOG_DOWN_DURATION);
      }),
      battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
        if (event.success && stuck.has(event.source)) {
          event.success = false;
        }
      }),
    ]);
  }),

  // Paldean Tauros: once its Attack is up, it charges in quicker
  createAbility(Abilities.Raging, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      const source = event.source;

      if (source.hasAbility(Abilities.Raging) && source.stages[Stages.Attack] > 0) {
        event.duration *= RAGING_SCALE;
      }
    }),
  ),

  // Poltchageist and Sinistcha: a healing move for a teammate is poured
  // quicker than one it drinks itself
  createAbility(Abilities.TeaService, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        source.hasAbility(Abilities.TeaService) &&
        HEALING_MOVES.has(event.move) &&
        target.type === MoveTargetType.Unit &&
        target.unit !== source &&
        target.unit.team === source.team
      ) {
        event.duration *= TEA_SERVICE_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
