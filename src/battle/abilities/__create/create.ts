import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import type { EventListenerLifecycle } from '../../../core/event-emitter';
import type Abilities from '../../../data/ids/abilities';
import { RISKY_PENALTY } from '../../ai/score';
import type Battle from '../../core';
import type { CheckUnitAIMoveScoreEvent } from '../../events';
import { BattleEvents, MoveTargetType } from '../../events';
import type { Lifecycle } from '../../lifecycle';
import type Unit from '../../unit';

/**
 * Who carries what, kept per battle. The factory below already needs
 * it to know when an ability's listeners should be running, so it is
 * shared: an effect asking whether a holder is standing walks the one
 * or two units that carry the ability rather than the whole field,
 * which on a raid roster of forty-nine is the difference between a
 * lookup and a sweep
 */
const HOLDERS = new WeakMap<Battle, Map<Abilities, Set<Unit>>>();

function holdersOf(battle: Battle, ability: Abilities): Set<Unit> {
  let known = HOLDERS.get(battle);

  if (!known) {
    known = new Map();
    HOLDERS.set(battle, known);
  }

  let units = known.get(ability);

  if (!units) {
    units = new Set();
    known.set(ability, units);
  }

  return units;
}

/**
 * Everyone carrying this ability, whether or not they are still
 * standing and whether or not something is suppressing it. A reader
 * that cares about either has to say so: `unit.alive` for the first
 * and `unit.hasAbility` for the second, which is cheap over a set of
 * one or two
 */
export function getAbilityHolders(battle: Battle, ability: Abilities): ReadonlySet<Unit> {
  return holdersOf(battle, ability);
}

/**
 * How an ability is registered, and the hook the ones that answer a
 * touch ride
 */
export function createAbility(
  ability: Abilities,
  setup: (battle: Battle) => Lifecycle,
): ((battle: Battle) => void) & { ability: Abilities } {
  // The id rides along on the returned starter, so a list of abilities
  // can say which ones it holds without being written out twice
  return Object.assign(startAbility, { ability });

  function startAbility(battle: Battle): void {
    const lifecycle = setup(battle);

    const units = holdersOf(battle, ability);

    function enableAbility(current: Abilities, source: Unit): void {
      if (current === ability) {
        units.add(source);

        if (units.size === 1) {
          lifecycle.start();
        }
      }
    }

    function disableAbility(current: Abilities, source: Unit): void {
      if (ability === current) {
        units.delete(source);

        if (units.size === 0) {
          lifecycle.stop();
        }
      }
    }

    battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
      disableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitEnableAbility, EventPriority.Post, (event) => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitDisableAbility, EventPriority.Post, (event) => {
      disableAbility(event.ability, event.source);
    });
  }
}

/**
 * The AI half of an ability that punishes whoever touches its holder
 * — Static, Flame Body, Poison Point, Effect Spore, Cute Charm.
 *
 * It is only the *warning*: what the ability actually does to the
 * attacker stays where it is written, since each of the five does
 * something different with a different chance. This is the one thing
 * they share, and it is a thing the AI cannot work out for itself —
 * the effect fires on a damage event that the speculative pass never
 * emits, so without being told, a pokemon punches a Static Pikachu
 * exactly as readily as it punches anything else.
 *
 * A warning rather than a refusal: the move still lands, so it loses
 * to an equally good one that costs nothing and beats standing about
 */
export function createContactHazard(
  battle: Battle,
  targetAbility: Abilities,
): EventListenerLifecycle<CheckUnitAIMoveScoreEvent> {
  return battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.target.type === MoveTargetType.Unit &&
      event.target.unit !== event.source &&
      event.source.checkMoveContact(event.move, event.target) &&
      event.target.unit.hasAbility(targetAbility)
    ) {
      event.score -= RISKY_PENALTY;
    }
  });
}
