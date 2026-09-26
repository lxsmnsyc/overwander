import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { MoveFlags, type Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { onUnitActs } from '../utils';
import { createAbility, createNoContactAbility, createTypeShiftAbility } from './__create';

/** What a blow on something that has not yet acted is worth */
export const STAKEOUT_SCALE = 2;

/** Whether a move is carried on sound, which is what a voice can wet */
function isSound(move: Moves): boolean {
  return (getMoveData(move).flags & MoveFlags.Sound) !== 0;
}

/** Alola's abilities, as far as its lines are written */
const setupAbilities = [
  // Rowlet: it shoots its quills from where it stands
  createNoContactAbility(Abilities.LongReach),

  // Popplio: its songs go out as water rather than as air, and cost
  // nothing extra for it
  createTypeShiftAbility(Abilities.LiquidVoice, isSound, Types.Water),

  // Yungoos: the mainline's "switched in this turn" has no turn to
  // hang on, so the window is from an entrance to that unit's first
  // move. An entrance before a holder stood on the field goes unseen
  createAbility(Abilities.Stakeout, (battle) => {
    const fresh = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          fresh.add(event.source);
        }
      }),
      ...onUnitActs(battle, (unit) => {
        fresh.delete(unit);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        fresh.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        fresh.delete(event.source);
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;

        if (
          event.power != null &&
          target.type === MoveTargetType.Unit &&
          target.unit.team.alliance !== event.source.team.alliance &&
          fresh.has(target.unit) &&
          event.source.hasAbility(Abilities.Stakeout)
        ) {
          event.power *= STAKEOUT_SCALE;
        }
      }),
    ]);
  }),
];

export default function setupGen7Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
