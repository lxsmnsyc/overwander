import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { Statuses } from '../../../data/ids/status';
import { MoveCategories, Moves } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, type EffectCause, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { ABSORB_MOVES } from '../../moves/absorb';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitCounter } from './__create';

/** What the hide turns aside, and what a cracked hide lets through */
export const REGAL_HIDE_GUARD_SCALE = 0.7;
export const REGAL_HIDE_EXPOSED_SCALE = 1.15;

/** The share of health the hide holds down to */
export const REGAL_HIDE_THRESHOLD = 1 / 2;

/** What venom already in the blood is worth to the next blow */
export const REGAL_VENOM_SCALE = 1.3;

/** What each lost tail buys */
export const NINE_TAILS_STEP = 0.08;

/** How many tails there are to lose */
export const NINE_TAILS_MAX_STACKS = 9;

/** What the song is worth, in how long it holds and what it lands for */
export const LULLABY_SLEEP_SCALE = 1.5;
export const LULLABY_POWER_SCALE = 1.5;

/** What a drain is worth to it, and what every other heal is worth */
export const BLOODTHIRST_DRAIN_SCALE = 1.5;
export const BLOODTHIRST_HEAL_SCALE = 0.5;

/** Whether the unit is carrying poison of either kind */
function isPoisoned(unit: Unit): boolean {
  return unit.status[Statuses.Poisoned] != null || unit.status[Statuses.BadlyPoisoned] != null;
}

/** Whether the effect came from a unit carrying the ability */
function causedBy(cause: EffectCause, ability: Abilities): boolean {
  return cause.type !== EffectType.None && cause.unit.hasAbility(ability);
}

/**
 * Whether the heal is one taken out of somebody else: a draining move,
 * or the seed's own tithe
 */
function isDrainHeal(cause: EffectCause): boolean {
  return (
    cause.type === EffectType.Move &&
    (ABSORB_MOVES.has(cause.move) || cause.move === Moves.LeechSeed)
  );
}

/** The ally furthest from full, for the wish to go to */
function neediestAlly(battle: Battle, unit: Unit): Unit | undefined {
  let found: Unit | undefined;
  let lowest = 1;

  for (const ally of battle.units()) {
    if (ally === unit || !ally.alive || ally.team.alliance !== unit.team.alliance) {
      continue;
    }

    const share = ally.health / ally.checkStat(Stats.HP, 0);

    if (share < 1 && share < lowest) {
      found = ally;
      lowest = share;
    }
  }

  return found;
}

const sandshrewToOddish = [
  // Sandshrew: it answers a blow by rolling tighter, which is Defense
  // Curl's own business rather than this ability's
  createAbility(
    Abilities.CurlUp,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (event.success && event.target.alive && event.target.hasAbility(Abilities.CurlUp)) {
            event.target.triggerAbility(Abilities.CurlUp);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.CurlUp) {
            event.source.triggerMove(Moves.DefenseCurl, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  // Nidoran (female): armour with a line in it. Above the line the
  // hide turns a blow aside, below it nothing does
  createAbility(Abilities.RegalHide, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (
        event.unit !== parent.source ||
        (event.stat !== Stats.Attack && event.stat !== Stats.SpecialAttack) ||
        !target.hasAbility(Abilities.RegalHide)
      ) {
        return;
      }

      if (target.health < target.checkStat(Stats.HP, 0) * REGAL_HIDE_THRESHOLD) {
        event.value *= REGAL_HIDE_EXPOSED_SCALE;
      } else if (parent.category === MoveCategories.Physical) {
        event.value *= REGAL_HIDE_GUARD_SCALE;
      }
    }),
  ),

  // Nidoran (male): the venom is the point. What it poisons only gets
  // worse, and what is already poisoned is what it hits hardest
  createAbility(
    Abilities.RegalVenom,
    (battle) =>
      new MergedLifecycle([
        // The mild poison never lands: it is refused and the worse one
        // put on instead, which is a different status and so no loop
        battle.on(BattleEvents.UnitAddStatus, EventPriority.Pre, (event) => {
          const cause = event.cause;

          if (
            event.status !== Statuses.Poisoned ||
            cause.type === EffectType.None ||
            cause.type === EffectType.Weather ||
            cause.unit === event.source ||
            !cause.unit.hasAbility(Abilities.RegalVenom)
          ) {
            return;
          }

          event.disabled = true;

          cause.unit.triggerAbility(Abilities.RegalVenom);
          event.source.addStatus(Statuses.BadlyPoisoned, cause);
        }),
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.unit === parent.source &&
            (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
            parent.source.hasAbility(Abilities.RegalVenom) &&
            isPoisoned(parent.target)
          ) {
            event.value *= REGAL_VENOM_SCALE;
          }
        }),
      ]),
  ),

  // Clefairy: the wish is for somebody else, and Wish is the move that
  // knows how a wish arrives
  createAbility(
    Abilities.WishingWell,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (!unit.hasAbility(Abilities.WishingWell)) {
            return;
          }

          const ally = neediestAlly(battle, unit);

          if (!ally) {
            return;
          }

          unit.triggerAbility(Abilities.WishingWell);
          unit.triggerMove(Moves.Wish, unitTarget(ally), 0);
        }),
      ),
  ),

  // Vulpix: every hit it walks away from costs a tail, and every tail
  // it has lost is in the next thing it throws
  createAbility(Abilities.NineTails, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        const lost = counter.get(event.source);

        if (
          lost > 0 &&
          event.stat === Stats.SpecialAttack &&
          event.source.hasAbility(Abilities.NineTails)
        ) {
          event.value *= 1 + NINE_TAILS_STEP * lost;
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (!event.success || !target.alive || !target.hasAbility(Abilities.NineTails)) {
          return;
        }

        const lost = counter.get(target);

        if (lost < NINE_TAILS_MAX_STACKS) {
          counter.set(target, lost + 1);
          target.triggerAbility(Abilities.NineTails);
        }
      }),
      ...lifecycles,
    ]);
  }),
  // Jigglypuff: the song is the setup rather than a nuisance, so it
  // holds longer and everything after it lands harder
  createAbility(
    Abilities.Lullaby,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
          if (event.status === Statuses.Sleeping && causedBy(event.cause, Abilities.Lullaby)) {
            event.duration *= LULLABY_SLEEP_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.unit === parent.source &&
            (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
            parent.source.hasAbility(Abilities.Lullaby) &&
            parent.target.status[Statuses.Sleeping] != null
          ) {
            event.value *= LULLABY_POWER_SCALE;
          }
        }),
      ]),
  ),

  // Zubat: it lives off what it takes out of something else, and off
  // nothing else. A berry is half the meal for it that it is for
  // anybody
  createAbility(
    Abilities.Bloodthirst,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitDrain, EventPriority.Post, (event) => {
          if (event.value > 0 && event.source.hasAbility(Abilities.Bloodthirst)) {
            event.value *= BLOODTHIRST_DRAIN_SCALE;

            event.source.triggerAbility(Abilities.Bloodthirst);
          }
        }),
        // Before Exact, which is where the health actually goes back
        battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
          if (event.target.hasAbility(Abilities.Bloodthirst) && !isDrainHeal(event.cause)) {
            event.value *= BLOODTHIRST_HEAL_SCALE;
          }
        }),
      ]),
  ),

  // Oddish: it plants itself to work, and Ingrain is what being planted
  // already means here
  createAbility(
    Abilities.DeepRoots,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.DeepRoots)) {
            event.source.triggerAbility(Abilities.DeepRoots);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.DeepRoots) {
            event.source.triggerMove(Moves.Ingrain, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),
];

export default sandshrewToOddish;
