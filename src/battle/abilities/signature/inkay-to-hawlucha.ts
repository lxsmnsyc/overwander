import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, Moves } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createTimedMarks } from './__create';

/** How long a target keeps the squid's lights off it */
export const OVERTURN_COOLDOWN = turns(5);

/** The share of a shock the frills feed back to the team */
export const BACKFEED_SHARE = 1 / 16;

/** What each step of weight is worth to a body slammed onto it */
export const TOP_ROPE_STEP = 50;
export const TOP_ROPE_GAIN = 0.1;
export const TOP_ROPE_CAP = 1.5;

/** Every stage Topsy-Turvy would have something to turn over */
const TURNABLE = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/** Whether this one is carrying anything worth inverting */
function hasStages(unit: Unit): boolean {
  for (const stage of TURNABLE) {
    if (unit.stages[stage] !== 0) {
      return true;
    }
  }

  return false;
}

/**
 * The three Kalos meets on its way up: the squid that turns a fight
 * the other way round, the lizard that feeds its charge back to the
 * team, and the wrestler that hits for what it lands on
 */
const setupAbilities = [
  // Inkay: the lights go the wrong way up. Everything the target has
  // built comes off it, which the move already knows how to do
  createAbility(Abilities.Overturn, (battle) => {
    // How long each target is left alone, so one enemy is not turned
    // over as fast as it can raise anything
    const turned = createTimedMarks(battle);

    return new MergedLifecycle([
      ...turned.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const cause = event.cause;

        if (
          !event.success ||
          (event.flags & DamageFlags.Indirect) !== 0 ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !cause.unit.hasAbility(Abilities.Overturn) ||
          turned.has(target) ||
          !hasStages(target)
        ) {
          return;
        }

        turned.mark(target, OVERTURN_COOLDOWN);
        cause.unit.triggerAbility(Abilities.Overturn);
        cause.unit.triggerMove(Moves.TopsyTurvy, unitTarget(target), 0);
      }),
    ]);
  }),

  // Helioptile: the frills run both ways, so what it takes out of an
  // enemy is fed back down the line rather than kept
  createAbility(Abilities.Backfeed, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const cause = event.cause;

      if (
        !event.success ||
        (event.flags & DamageFlags.Indirect) !== 0 ||
        cause.type !== EffectType.Move ||
        cause.unit === event.target ||
        !cause.unit.hasAbility(Abilities.Backfeed) ||
        cause.unit.checkMoveType(cause.move, unitTarget(event.target)) !== Types.Electric
      ) {
        return;
      }

      const source = cause.unit;
      // Asked rather than taken: a Liquid Ooze turns the charge round
      const amount = source.checkDrain(event.target, event.value * BACKFEED_SHARE);

      source.triggerAbility(Abilities.Backfeed);

      if (amount < 0) {
        source.damage(cause, source, -amount, DamageFlags.Indirect);
        return;
      }

      for (const mate of source.team.units) {
        if (mate.alive) {
          mate.heal(cause, mate, amount, 0);
        }
      }
    }),
  ),

  // Hawlucha: a body dropped from the ropes is worth whatever it
  // lands on, so the heavier the target the harder the landing
  createAbility(Abilities.TopRope, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const attacker = parent.source;

      if (
        event.value <= 0 ||
        !attacker.hasAbility(Abilities.TopRope) ||
        !attacker.checkMoveContact(parent.move, unitTarget(parent.target))
      ) {
        return;
      }

      const steps = Math.floor(parent.target.checkWeight() / TOP_ROPE_STEP);

      if (steps > 0) {
        event.value *= Math.min(1 + steps * TOP_ROPE_GAIN, TOP_ROPE_CAP);
      }
    }),
  ),
];

export default setupAbilities;
