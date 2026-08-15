import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';

/**
 * Moves that hit for what the target weighs rather than for a power of
 * their own.
 *
 * https://bulbapedia.bulbagarden.net/wiki/Low_Kick_(move)
 */
const WEIGHT_MOVES = new Set<Moves>([Moves.LowKick]);

/**
 * What each weight is worth, lightest first: the ceiling in kilograms
 * a target has to come in under, and the power it takes if it does.
 * Anything heavier than the last ceiling takes `HEAVIEST_POWER`
 */
const WEIGHT_BRACKETS: [limit: number, power: number][] = [
  [10, 20],
  [25, 40],
  [50, 60],
  [100, 80],
  [200, 100],
];

const HEAVIEST_POWER = 120;

/**
 * What a weight-driven move lands for against a target this heavy
 */
export function getWeightPower(weight: number): number {
  for (const [limit, power] of WEIGHT_BRACKETS) {
    if (weight < limit) {
      return power;
    }
  }
  return HEAVIEST_POWER;
}

export default function setupWeightMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    // The registered power stands when there is no target to weigh —
    // the AI rates a move before it has one, and so does the dex
    if (
      event.power == null ||
      event.target.type !== MoveTargetType.Unit ||
      !WEIGHT_MOVES.has(event.move)
    ) {
      return;
    }

    event.power = getWeightPower(event.target.unit.weight);
  });
}
