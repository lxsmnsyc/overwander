import { EventPriority } from '../../core/event-emitter';
import { MAX_FRIENDSHIP } from '../../data/constants/friendship';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * What a move worked out of health, friendship or a die roll comes to.
 *
 * The registry carries no power for any of these, so the shared hit
 * resolver has nothing to swing with until this answers: a figure
 * here is the whole of the move's damage
 */

/**
 * Flail and Reversal, read off what is left of the user. The mainline
 * walks a table of five bands; the bands are what a player feels, so
 * they are kept
 */
const DESPERATION: [share: number, power: number][] = [
  [0.0417, 200],
  [0.1042, 150],
  [0.2083, 100],
  [0.3542, 80],
  [0.6875, 40],
  [1, 20],
];

function desperatePower(unit: Unit): number {
  const share = unit.health / unit.checkStat(Stats.HP, 0);

  for (const [limit, power] of DESPERATION) {
    if (share <= limit) {
      return power;
    }
  }
  return 20;
}

/**
 * The strongest a move read off friendship gets, which is the
 * mainline's 255 friendship over 2.5
 */
const FRIENDSHIP_POWER = 102;

/**
 * Present is a parcel: three sizes of hit, and one time in five it is
 * a gift rather than a hit
 */
const PRESENT_POWERS = [40, 40, 80, 120];

/**
 * Magnitude reads the ground: 4 through 10, weighted the way the
 * mainline weights them, with 7 the common one
 */
const MAGNITUDES: [weight: number, power: number][] = [
  [0.05, 10],
  [0.1, 30],
  [0.2, 50],
  [0.3, 70],
  [0.2, 90],
  [0.1, 110],
  [0.05, 150],
];

function magnitudePower(roll: number): number {
  let seen = 0;

  for (const [weight, power] of MAGNITUDES) {
    seen += weight;

    if (roll < seen) {
      return power;
    }
  }
  return 70;
}

/**
 * What each of them comes to. A table rather than a switch, so the
 * list of moves that work their power out is one place
 */
const VARIABLE_POWER: { [key in Moves]?: (source: Unit, roll: number) => number } = {
  [Moves.Flail]: (source) => desperatePower(source),
  [Moves.Reversal]: (source) => desperatePower(source),
  [Moves.Return]: (source) => friendshipPower(source.friendship),
  [Moves.Frustration]: (source) => friendshipPower(MAX_FRIENDSHIP - source.friendship),
  [Moves.Present]: (_source, roll) => PRESENT_POWERS[Math.floor(roll * PRESENT_POWERS.length)],
  [Moves.Magnitude]: (_source, roll) => magnitudePower(roll),
};

function friendshipPower(value: number): number {
  return Math.max(1, Math.round((value / MAX_FRIENDSHIP) * FRIENDSHIP_POWER));
}

export default function setupVariablePowerMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    const worked = VARIABLE_POWER[event.move];

    if (worked != null) {
      event.power = worked(event.source, battle.random());
    }
  });

  /**
   * The fifth Present: the parcel turns out to be food. It heals a
   * quarter of the target's health and lands nothing at all
   */
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Pre, (event) => {
    if (event.move !== Moves.Present || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    if (battle.random() < 0.2) {
      event.disabled = true;

      event.source.heal(
        { type: EffectType.Move, move: Moves.Present, unit: event.source },
        event.target.unit,
        event.target.unit.checkStat(Stats.HP, 0) / 4,
        0,
      );
    }
  });
}
