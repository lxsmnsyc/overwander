import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, Moves } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';

/** What the bed of petals gives an ally each time it moves */
export const PETAL_BED_FRACTION = 1 / 16;

/** The first enemy still standing, for an ability that casts at one */
function firstEnemy(battle: Battle, unit: Unit): Unit | undefined {
  for (const enemy of battle.units(unit.team.alliance)) {
    if (enemy.alive) {
      return enemy;
    }
  }

  return undefined;
}

/** The standing holder on this unit's own side */
function guardedBy(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const ally of battle.units()) {
    if (ally.alive && ally.team.alliance === unit.team.alliance && ally.hasAbility(ability)) {
      return ally;
    }
  }

  return undefined;
}

const chikoritaToCelebi = [
  // Chikorita: the party stands in something that mends them. Paid as
  // each ally reaches for a move, and never to the flower itself
  createAbility(
    Abilities.PetalBed,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (unit.hasAbility(Abilities.PetalBed)) {
            return;
          }

          const flower = guardedBy(battle, unit, Abilities.PetalBed);

          if (!flower) {
            return;
          }

          flower.triggerAbility(Abilities.PetalBed);

          flower.heal(
            { type: EffectType.Ability, ability: Abilities.PetalBed, unit: flower },
            unit,
            unit.checkStat(Stats.HP, 0) * PETAL_BED_FRACTION,
            0,
          );
        }),
      ),
  ),

  // Cyndaquil: the back flares as it arrives, and what that does is
  // Will-O-Wisp's business rather than this ability's
  createAbility(
    Abilities.Ignition,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.Ignition)) {
            event.source.triggerAbility(Abilities.Ignition);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Ignition) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.WillOWisp, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  // Totodile: it bites and does not let go, which is the hold Bind
  // already knows how to put on
  createAbility(Abilities.GatorGrip, (battle) => {
    // The bind is itself a contact move, so without this the grip would
    // grip its own grip
    const gripping = new Set<Unit>();

    return battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        event.flags & MoveAttackFlags.Simulated ||
        gripping.has(source) ||
        !source.hasAbility(Abilities.GatorGrip) ||
        !source.checkMoveContact(event.move, unitTarget(target))
      ) {
        return;
      }

      gripping.add(source);
      source.triggerAbility(Abilities.GatorGrip);
      source.triggerMove(Moves.Bind, unitTarget(target), 0);
      gripping.delete(source);
    });
  }),

  // Sentret: it is the one watching, so nothing catches its side
  // unawares
  createAbility(Abilities.Sentry, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
      if (!event.critical) {
        return;
      }

      const lookout = guardedBy(battle, event.parent.target, Abilities.Sentry);

      if (lookout) {
        event.critical = false;

        lookout.triggerAbility(Abilities.Sentry);
      }
    }),
  ),
];

export default chikoritaToCelebi;
