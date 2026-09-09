import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags, Moves } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { PASSED_STAGES } from '../../moves/switch-out';
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

  // Hoothoot: the owl settles in and the light bends around its side,
  // which is Reflect's business rather than this ability's
  createAbility(
    Abilities.WatchfulRoost,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.WatchfulRoost)) {
            event.source.triggerAbility(Abilities.WatchfulRoost);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.WatchfulRoost) {
            event.source.triggerMove(
              Moves.Reflect,
              { type: MoveTargetType.Team, team: event.source.team },
              0,
            );
          }
        }),
      ]),
  ),

  // Ledyba: what it built up goes down the line, the way a baton does,
  // however it was taken off the field
  createAbility(Abilities.Relay, (battle) => {
    // Stages are wiped as a unit leaves, so they are taken down before
    // the walk and handed over once the pair have swapped places
    const carried = new Map<Unit, number[]>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitSwitch, EventPriority.Pre, (event) => {
        const source = event.source;

        if (source === event.target || !source.hasAbility(Abilities.Relay)) {
          return;
        }

        const stages = PASSED_STAGES.map((stage) => source.stages[stage]);

        if (stages.some((stage) => stage !== 0)) {
          carried.set(source, stages);

          source.triggerAbility(Abilities.Relay);
        }
      }),
      battle.on(BattleEvents.UnitFinishSwitch, EventPriority.Post, (event) => {
        const passed = carried.get(event.source);

        if (passed == null) {
          return;
        }

        carried.delete(event.source);

        const cause = {
          type: EffectType.Ability,
          ability: Abilities.Relay,
          unit: event.source,
        } as const;

        for (const [at, stage] of PASSED_STAGES.entries()) {
          const difference = passed[at] - event.target.stages[stage];

          if (difference !== 0) {
            event.target.addStage(stage, difference, cause);
          }
        }
      }),
    ]);
  }),

  // Spinarak: the web goes up before anything walks into it, and what
  // silk does to a stride is String Shot's business
  createAbility(
    Abilities.SilkSnare,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.SilkSnare)) {
            event.source.triggerAbility(Abilities.SilkSnare);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.SilkSnare) {
            // String Shot already reaches everything opposite, so one
            // cast covers the field
            event.source.triggerMove(Moves.StringShot, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  // Chinchou: the lantern goes up as it arrives, and whatever swims at
  // it is Confuse Ray's to deal with
  createAbility(
    Abilities.LanternLure,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.LanternLure)) {
            event.source.triggerAbility(Abilities.LanternLure);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.LanternLure) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.ConfuseRay, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),
];

export default chikoritaToCelebi;
