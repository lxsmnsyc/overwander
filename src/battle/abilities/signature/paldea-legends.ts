import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { Terrains } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { getCastTime } from '../../mechanics/move/timing';
import { HAPPY_HOUR_FACTOR, PAY_DAY_COINS_PER_LEVEL } from '../../moves/pay-day';
import type Team from '../../team';
import turns from '../../turn';
import type Unit from '../../unit';
import { isWeatherSunny } from '../../utils';
import { createAbility } from '../__create';
import { createTimedMarks } from './__create';

/** How long a Treasure of Ruin keeps a struck target's stat from rising */
export const STUNTED_DURATION = turns(3);

/** What the box legends' wind-ups come to in their own field */
export const FULL_THROTTLE_SCALE = 0.8;

/**
 * How long Coin Scatter rests between scatters: the shortest cast Pay
 * Day's ceiling counts, so the coins never outrun it
 */
export const COIN_SCATTER_REST = getCastTime(0);

/** The moves that already pay coins of their own as they land */
const PAYING_MOVES = new Set<Moves>([Moves.PayDay, Moves.GMaxGoldRush, Moves.MakeItRain]);

/** Whether a landed attack is one an ability should answer, not the AI weighing one */
function landedForReal(battle: Battle, event: UnitAttackEvent): boolean {
  return (
    event.success &&
    !(event.flags & MoveAttackFlags.Simulated) &&
    !battle.estimating &&
    event.source.team.alliance !== event.target.team.alliance
  );
}

/**
 * The Treasures of Ruin: whatever the holder lands a move on cannot
 * raise one stat for a while, refreshed by every hit
 */
function createStuntedAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const stunted = createTimedMarks(battle);

    return new MergedLifecycle([
      ...stunted.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (!landedForReal(battle, event) || !event.target.alive || !source.hasAbility(ability)) {
          return;
        }
        if (!stunted.has(event.target)) {
          source.triggerAbility(ability);
        }
        stunted.mark(event.target, STUNTED_DURATION);
      }),
      battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
        if (
          event.success &&
          event.value > 0 &&
          event.stage === stage &&
          stunted.has(event.source)
        ) {
          event.success = false;
        }
      }),
    ]);
  });
}

/** The box legends: in the field each was built for, every wind-up is quicker */
function createFullThrottleAbility(
  ability: Abilities,
  inField: (unit: Unit) => boolean,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      if (event.source.hasAbility(ability) && inField(event.source)) {
        event.duration *= FULL_THROTTLE_SCALE;
      }
    }),
  );
}

const paldeaLegends = [
  // Gimmighoul: every blow shakes coins loose. It rests a shortest cast
  // between scatters, the pace Pay Day's ceiling allows for
  createAbility(Abilities.CoinScatter, (battle) => {
    const resting = createTimedMarks(battle);
    const happy = new WeakSet<Team>();

    return new MergedLifecycle([
      ...resting.lifecycles,
      // Happy Hour doubles what was already picked up, and pay-day.ts
      // keeps its own record private, so this one is kept beside it
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
        if (event.move === Moves.HappyHour) {
          happy.add(event.source.team);
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.category === MoveCategories.Status ||
          !landedForReal(battle, event) ||
          resting.has(source) ||
          !source.hasAbility(Abilities.CoinScatter)
        ) {
          return;
        }

        resting.mark(source, COIN_SCATTER_REST);
        // A move that pays its own way spends the scatter rather than doubling it
        if (PAYING_MOVES.has(event.move)) {
          return;
        }
        source.triggerAbility(Abilities.CoinScatter);
        source.coins +=
          PAY_DAY_COINS_PER_LEVEL * source.level * (happy.has(source.team) ? HAPPY_HOUR_FACTOR : 1);
      }),
    ]);
  }),

  // Wo-Chien, Chien-Pao, Ting-Lu and Chi-Yu: each relic stunts the
  // stat its own Ruin ability lowers
  createStuntedAbility(Abilities.WitheredTablets, Stages.Attack),
  createStuntedAbility(Abilities.ShatteredSword, Stages.Defense),
  createStuntedAbility(Abilities.CrackedVessel, Stages.SpecialAttack),
  createStuntedAbility(Abilities.ScatteredBeads, Stages.SpecialDefense),

  // Koraidon and Miraidon
  createFullThrottleAbility(Abilities.SunSprint, isWeatherSunny),
  createFullThrottleAbility(
    Abilities.DriveMode,
    (unit) => unit.checkTerrain() === Terrains.Electric,
  ),
];

export default paldeaLegends;
