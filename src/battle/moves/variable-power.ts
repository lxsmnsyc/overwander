import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MAX_FRIENDSHIP } from '../../data/constants/friendship';
import { Stats } from '../../data/constants/stats';
import { Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
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

/** What the gift puts back, and so how hurt a teammate must be */
const PRESENT_GIFT_SHARE = 0.25;

/** The most handing one to a teammate is worth */
const GIFT_BONUS = 6;

/**
 * Gyro Ball is thrown by the slower of the two: the wider the gap the
 * harder it lands, and a user faster than its target barely swings it
 */
const GYRO_RATIO = 25;
const GYRO_CEILING = 150;

/** Wring Out squeezes what is left, so a whole target is the worst to wring */
const WRING_OUT_CEILING = 120;

/**
 * Trump Card, once its premise is translated. In the mainline it is
 * the card you are down to, and PP here is a cooldown rather than a
 * pool that drains, so it is the card you have already played: each
 * cast in this fight makes the next one land harder, and the last is
 * worth digging five casts for
 */
const TRUMP_CARD_POWERS = [40, 50, 60, 80, 200];

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

/**
 * The moves that read the unit in front of them rather than the one
 * casting. Kept apart from `VARIABLE_POWER` because a move cast at
 * nobody has nothing to read, and these are all cast at a unit
 */
const TARGETED_POWER: { [key in Moves]?: (source: Unit, target: Unit) => number } = {
  [Moves.GyroBall]: (source, target) =>
    Math.max(
      1,
      Math.min(
        GYRO_CEILING,
        Math.floor(
          (GYRO_RATIO * target.checkStat(Stats.Speed, 0)) /
            Math.max(1, source.checkStat(Stats.Speed, 0)) +
            1,
        ),
      ),
    ),
  [Moves.WringOut]: (_source, target) =>
    Math.max(
      1,
      Math.floor(WRING_OUT_CEILING * (target.health / Math.max(1, target.checkStat(Stats.HP, 0)))),
    ),
};

export default function setupVariablePowerMoves(battle: Battle): void {
  /** How many Trump Cards each unit has played in this fight */
  const played = new Map<Unit, number>();

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    const worked = VARIABLE_POWER[event.move];

    if (worked != null) {
      event.power = worked(event.source, battle.random());
      return;
    }

    const targeted = TARGETED_POWER[event.move];

    if (targeted != null && event.target.type === MoveTargetType.Unit) {
      event.power = targeted(event.source, event.target.unit);
      return;
    }

    if (event.move === Moves.TrumpCard) {
      const spent = played.get(event.source) ?? 0;

      event.power = TRUMP_CARD_POWERS[Math.min(spent, TRUMP_CARD_POWERS.length - 1)];
    }
  });

  // Counted as it lands rather than as it is cast, so a card the
  // target never saw is not one the user has played
  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (event.move === Moves.TrumpCard) {
      played.set(event.source, (played.get(event.source) ?? 0) + 1);
    }
  });

  // A unit that has left the field is holding a fresh hand when it
  // comes back
  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    played.delete(event.source);
  });
  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    played.delete(event.source);
  });

  /**
   * A Present handed to the player's own side is a gamble on the
   * parcel being food: four times in five it hurts a teammate
   * instead. Worth it only for one that is hurt enough to want the
   * quarter, and never for one that is nearly whole
   */
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.move !== Moves.Present ||
      event.target.type !== MoveTargetType.Unit ||
      event.target.unit.team.alliance !== event.source.team.alliance
    ) {
      return;
    }

    const target = event.target.unit;
    const whole = Math.max(1, target.checkStat(Stats.HP, 0));
    const missing = (whole - target.health) / whole;

    if (missing < PRESENT_GIFT_SHARE) {
      event.score -= USELESS_PENALTY;
      return;
    }

    event.score += Math.round(GIFT_BONUS * missing);
  });

  /**
   * The fifth Present: the parcel turns out to be food. It heals a
   * quarter of the target's health and lands nothing at all
   */
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Pre, (event) => {
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
