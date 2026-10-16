import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { isPunchMove } from '../../../data/moves/punches';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MULTI_HIT_MOVES } from '../../moves/multi-hit';
import type Unit from '../../unit';
import { isOwnBerry } from '../../utils';
import { createAbility } from '../__create';
import { createNextCastPenalty, createUnitState, enemyHolder } from './__create';

/** How much longer a newcomer's first wind-up takes past a Tripwire */
export const TRIPWIRE_SCALE = 1.5;

/** How far a Knockback blow sets back the wind-up it catches */
export const KNOCKBACK_SETBACK = 500;

/** How often a Static Palms punch paralyses */
export const STATIC_PALMS_CHANCE = 0.2;

/** Whether a landed attack is one an ability should answer, not the AI weighing one */
function landedForReal(battle: Battle, event: UnitAttackEvent): boolean {
  return (
    event.success &&
    !(event.flags & MoveAttackFlags.Simulated) &&
    !battle.estimating &&
    event.source.team.alliance !== event.target.team.alliance
  );
}

/** Where a brood's strikes go: the one it aimed at first, then each other enemy standing */
function broodOrder(battle: Battle, holder: Unit, aimed: Unit): Unit[] {
  const order = [aimed];

  for (const enemy of battle.units(holder.team.alliance)) {
    if (enemy !== aimed && enemy.alive) {
      order.push(enemy);
    }
  }
  return order;
}

interface Brood {
  move: Moves;
  aimed: Unit;
  strike: number;
  /** Whether the cue has shown for this cast */
  cued: boolean;
}

const lechonkToTandemaus = [
  // Lechonk: whatever it eats goes on the belly
  createAbility(
    Abilities.PigOut,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
          const unit = event.source;

          if (isOwnBerry(event.cause, unit) && unit.alive && unit.hasAbility(Abilities.PigOut)) {
            unit.triggerAbility(Abilities.PigOut);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.PigOut) {
            event.source.triggerMove(Moves.Stockpile, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  // Tarountula: the thread is laid across the way in. Those standing
  // when the fight opens never cross it, so it waits for the first tick
  createAbility(Abilities.Tripwire, (battle) => {
    let underway = false;
    const penalty = createNextCastPenalty(battle, TRIPWIRE_SCALE);

    // Kept outside the ability's lifecycle, so a holder that arrives
    // later still knows the fight is on
    const opening = battle.on(BattleEvents.Tick, EventPriority.Post, () => {
      underway = true;
      opening.stop();
    });

    return new MergedLifecycle([
      ...penalty.lifecycles,
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!underway || event.reactivation) {
          return;
        }

        const holder = enemyHolder(battle, event.source, Abilities.Tripwire);

        if (holder != null) {
          holder.triggerAbility(Abilities.Tripwire);
          penalty.mark(event.source);
        }
      }),
    ]);
  }),

  // Nymble: a kick that lands throws off whatever the target was
  // lining up, without taking the move away from it
  createAbility(Abilities.Knockback, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const casting = event.target.casting;

      if (
        casting == null ||
        casting.time.progress <= 0 ||
        !landedForReal(battle, event) ||
        !event.target.alive ||
        !source.hasAbility(Abilities.Knockback) ||
        !source.checkMoveContact(event.move, { type: MoveTargetType.Unit, unit: event.target })
      ) {
        return;
      }

      source.triggerAbility(Abilities.Knockback);
      event.target.updateCast({
        time: {
          duration: casting.time.duration,
          progress: Math.max(0, casting.time.progress - KNOCKBACK_SETBACK),
        },
      });
    }),
  ),

  // Pawmi: the charge in its paw pads goes out with every punch
  createAbility(Abilities.StaticPalms, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        !landedForReal(battle, event) ||
        !event.target.alive ||
        !isPunchMove(event.move) ||
        !source.hasAbility(Abilities.StaticPalms) ||
        battle.random() >= STATIC_PALMS_CHANCE
      ) {
        return;
      }

      source.triggerAbility(Abilities.StaticPalms);
      event.target.addStatus(Statuses.Paralyzed, {
        type: EffectType.Ability,
        ability: Abilities.StaticPalms,
        unit: source,
      });
    }),
  ),

  // Tandemaus: the family goes every which way. The strikes are thrown
  // again at the next enemy along rather than retargeted in place, so
  // every bracket around an attack sees the unit it actually lands on.
  // The strikes still stop once the first target falls, as any
  // multi-hit move's do
  createAbility(Abilities.ScatterBrood, (battle) => {
    const { state, lifecycles } = createUnitState<Brood>(battle);
    const thrown = new WeakSet<UnitAttackEvent>();

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Pre, (event) => {
        const source = event.source;

        if (
          event.steps === 0 &&
          event.target.type === MoveTargetType.Unit &&
          MULTI_HIT_MOVES[event.move] != null &&
          event.target.unit.team.alliance !== source.team.alliance &&
          source.hasAbility(Abilities.ScatterBrood)
        ) {
          state.set(source, { move: event.move, aimed: event.target.unit, strike: 0, cued: false });
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Prepare, (event) => {
        const source = event.source;
        const brood = state.get(source);

        if (
          brood == null ||
          brood.move !== event.move ||
          thrown.has(event) ||
          event.flags & MoveAttackFlags.Simulated ||
          battle.estimating ||
          !source.hasAbility(Abilities.ScatterBrood)
        ) {
          return;
        }

        const order = broodOrder(battle, source, brood.aimed);
        const next = order[brood.strike % order.length];

        brood.strike += 1;
        if (next === event.target) {
          return;
        }

        event.disabled = true;
        if (!brood.cued) {
          brood.cued = true;
          source.triggerAbility(Abilities.ScatterBrood);
        }

        const redirected: UnitAttackEvent = {
          ...event,
          disabled: false,
          target: next,
          success: false,
        };

        thrown.add(redirected);
        battle.emit(BattleEvents.UnitAttack, redirected);
      }),
    ]);
  }),
];

export default lechonkToTandemaus;
