import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import type { Moves } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, MoveTargetType } from '../../events';
import { type Lifecycle, MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import PROTECTED_ABILITIES from '../protected';
import { createAbility } from './create';

/**
 * https://bulbapedia.bulbagarden.net/wiki/Mold_Breaker_(Ability)
 *
 * While a holder's move resolves against a target, the target's
 * abilities read as absent (via the CheckUnitAbility query), so
 * defensive abilities like Levitate, Filter or Shell Armor cannot
 * hinder the attack. The windows open at Prepare (before every
 * regular listener) and close at Cleanup, which always runs even when
 * the event is disabled mid-emission: the brackets cannot leak. The
 * window is suspended while UnitDamage emissions run, so post-damage
 * contact abilities (Static, Aftermath, ...) still fire like in the
 * games.
 *
 * Turboblaze and Teravolt are the same rule under another name, which
 * is why this takes the id rather than naming one
 */
/**
 * The windows a piercing attack opens over its target, for whatever
 * `pierces` says is piercing: the holder of an ability, or one move
 * whoever throws it
 */
export function createPierceWindows(
  battle: Battle,
  pierces: (source: Unit, move: Moves) => boolean,
): Lifecycle[] {
  const EXEMPT = new Set<Abilities>([Abilities.NeutralizingGas, ...PROTECTED_ABILITIES]);

  /**
   * Nested per-defender window counts for in-flight holder attacks
   * (the whole pipeline is synchronous, so bracketing the entry
   * events at Prepare/Cleanup scopes every nested query); the opened
   * map remembers each event's pushed defender in case the target is
   * retargeted mid-flight (e.g. Lightning Rod)
   */
  const ignored = new Map<Unit, number>();
  const opened = new WeakMap<object, Unit>();

  // Damage application (and its post-damage reactions) sees real
  // abilities: the suppression only covers the move's resolution
  let suspended = 0;

  function push(event: object, target: Unit): void {
    opened.set(event, target);
    ignored.set(target, (ignored.get(target) ?? 0) + 1);
  }

  function pop(event: object): void {
    const target = opened.get(event);

    if (target) {
      opened.delete(event);

      const count = ignored.get(target) ?? 0;

      if (count <= 1) {
        ignored.delete(target);
      } else {
        ignored.set(target, count - 1);
      }
    }
  }

  return [
    // Pure query: an ignored defender's abilities read as absent
    battle.on(BattleEvents.CheckUnitAbility, EventPriority.Post, (event) => {
      if (
        event.enabled &&
        suspended === 0 &&
        ignored.has(event.source) &&
        !EXEMPT.has(event.ability)
      ) {
        event.enabled = false;
      }
    }),
    // Target resolution window (immunity, accuracy, effects)
    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Prepare, (event) => {
      if (
        event.target.type === MoveTargetType.Unit &&
        event.target.unit !== event.source &&
        pierces(event.source, event.move)
      ) {
        push(event, event.target.unit);
      }
    }),
    battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Cleanup, (event) => {
      pop(event);
    }),
    // Attack resolution window (damage math, criticals)
    battle.on(BattleEvents.UnitAttack, AttackPriority.Prepare, (event) => {
      if (event.target !== event.source && pierces(event.source, event.move)) {
        push(event, event.target);
      }
    }),
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      pop(event);
    }),
    // The AI's speculative windows: what it asks about a move it is
    // considering has to be answered the way the move will actually
    // resolve, or the holder refuses a Ground move against a
    // Levitator it could hit and underrates every hit it would take
    // through Filter. Same brackets, same nesting, no second copy of
    // what is ignored
    battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Prepare, (event) => {
      if (
        event.target.type === MoveTargetType.Unit &&
        event.target.unit !== event.source &&
        pierces(event.source, event.move)
      ) {
        push(event, event.target.unit);
      }
    }),
    battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Cleanup, (event) => {
      pop(event);
    }),
    battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Prepare, (event) => {
      if (
        event.target.type === MoveTargetType.Unit &&
        event.target.unit !== event.source &&
        pierces(event.source, event.move)
      ) {
        push(event, event.target.unit);
      }
    }),
    battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Cleanup, (event) => {
      pop(event);
    }),
    // Damage bracket: suspend the suppression for the application
    // and every post-damage reaction nested in it
    battle.on(BattleEvents.UnitDamage, AttackPriority.Prepare, () => {
      if (ignored.size > 0) {
        suspended += 1;
      }
    }),
    battle.on(BattleEvents.UnitDamage, AttackPriority.Cleanup, () => {
      if (suspended > 0) {
        suspended -= 1;
      }
    }),
  ];
}

export default function createMoldBreakerAbility(ability: Abilities): (battle: Battle) => void {
  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        ...createPierceWindows(battle, (source) => source.hasAbility(ability)),
        // For visual cues: the classic entry announcement
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(ability)) {
            event.source.triggerAbility(ability);
          }
        }),
      ]),
  );
}
