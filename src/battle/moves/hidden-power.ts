import { EventPriority } from '../../core/event-emitter';
import { Stats, StatsKind } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * The sixteen types Hidden Power comes in. Normal and Fairy are not
 * among them, which is the mainline's list and the reason the
 * registry types the move Normal: what it is registered as is what a
 * dex entry shows, and what it is thrown as is worked out here
 */
const HIDDEN_TYPES = [
  Types.Fighting,
  Types.Flying,
  Types.Poison,
  Types.Ground,
  Types.Rock,
  Types.Bug,
  Types.Ghost,
  Types.Steel,
  Types.Fire,
  Types.Water,
  Types.Grass,
  Types.Electric,
  Types.Psychic,
  Types.Ice,
  Types.Dragon,
  Types.Dark,
];

/**
 * The order the genes are read in, which is not the order the stats
 * are listed in: the mainline reads Speed before the two special ones
 */
const GENE_ORDER = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.Speed,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
];

/**
 * Which of the sixteen this individual's genes come to. Only the last
 * bit of each value counts, which is why two pokemon with the same
 * stats can throw different types
 */
export function hiddenPowerType(unit: Unit): Types {
  let bits = 0;

  for (const [at, stat] of GENE_ORDER.entries()) {
    bits += (unit.stats[StatsKind.Individual][stat] & 1) << at;
  }

  return HIDDEN_TYPES[Math.floor((bits * HIDDEN_TYPES.length) / 64)];
}

export default function setupHiddenPower(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move === Moves.HiddenPower) {
      event.type = hiddenPowerType(event.source);
    }
  });
}
