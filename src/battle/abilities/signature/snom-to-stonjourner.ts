import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import {
  MoveAffects,
  MoveAttackFlags,
  MoveCategories,
  MoveTargets,
  Moves,
} from '../../../data/ids/moves';
import { Weathers } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, MoveTargetType, type UnitAttackEvent } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { hasAttackEffect } from '../../moves/status';
import turns from '../../turn';
import type Unit from '../../unit';
import { isOwnBerry, skyOverTeam, unitTarget } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';
import { createTimedMarks, createUnitState } from './__create';

/** How many blows the troopers soften, and by how much */
export const RANK_AND_FILE_HITS = 5;
export const RANK_AND_FILE_SCALE = 0.5;

/** How long an attendant waits between heals */
export const ATTENDANT_COOLDOWN = turns(4);

/** How long a Dreepy takes to come back to its launcher */
export const DREEPY_LAUNCH_COOLDOWN = turns(5);

/** How often the stones line up with the sun, and for how long */
export const SOLSTICE_INTERVAL = turns(15);
export const SOLSTICE_DURATION = turns(3);
export const SOLSTICE_SCALE = 1.3;

/** Whether a move goes out over a whole side rather than at one */
function spreadsOverUnits(unit: Unit, move: Moves): boolean {
  const targeting = unit.checkMoveTargeting(move);

  return (
    targeting.target === MoveTargets.None &&
    (targeting.affects & MoveAffects.Unit) !== 0 &&
    (targeting.affects & MoveAffects.Enemy) !== 0
  );
}

/** The standing Overhang holder this enemy move would be pulled onto, if any */
function overhangFor(battle: Battle, source: Unit, move: Moves, struck: Unit): Unit | undefined {
  if (struck.team.alliance === source.team.alliance || !spreadsOverUnits(source, move)) {
    return undefined;
  }

  for (const holder of getAbilityHolders(battle, Abilities.Overhang)) {
    if (
      holder !== struck &&
      holder.alive &&
      holder.team === struck.team &&
      holder.hasAbility(Abilities.Overhang)
    ) {
      return holder;
    }
  }

  return undefined;
}

/** Whether a real blow landed on somebody across the field */
function landedOnEnemy(event: UnitAttackEvent): boolean {
  return (
    event.success &&
    event.target.alive &&
    (event.flags & MoveAttackFlags.Simulated) === 0 &&
    event.target.team.alliance !== event.source.team.alliance
  );
}

/**
 * The Galar families from Circhester to Spikemuth: the larva that
 * sends back what clings to it, the penguin whose ice comes off as
 * hail, the troop that shares out a blow, the attendant, the hungry
 * hamster, the overhanging tower, the dragon that launches its young
 * and the stone circle that keeps the sun's time
 */
const setupAbilities = [
  // Snom: the frost scales send back whatever rides in on a blow. The
  // copy is the attacker's own blow on itself, so it cannot bounce
  // again, and a self-boost (Metal Claw) still lands where it was meant
  createAbility(Abilities.MirrorScales, (battle) =>
    battle.on(BattleEvents.UnitAttackEffect, EventPriority.Pre, (event) => {
      const { source, target, move } = event.parent;

      if (
        source === target ||
        !source.alive ||
        !hasAttackEffect(move) ||
        !target.hasAbility(Abilities.MirrorScales)
      ) {
        return;
      }

      event.disabled = true;
      target.triggerAbility(Abilities.MirrorScales);

      battle.emit(BattleEvents.UnitAttackEffect, {
        id: 'UnitAttackEffect',
        disabled: false,
        parent: { ...event.parent, target: source },
      });
    }),
  ),

  // Eiscue: a hard knock chips the ice head, and the chips come down
  // as hail. It reaches for the move, so Hail's own duration holds
  createAbility(Abilities.ChippedIce, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        event.source === target ||
        event.category !== MoveCategories.Physical ||
        (event.flags & MoveAttackFlags.Simulated) !== 0 ||
        !target.hasAbility(Abilities.ChippedIce) ||
        skyOverTeam(target.team) !== Weathers.None
      ) {
        return;
      }

      target.triggerAbility(Abilities.ChippedIce);
      target.triggerMove(Moves.Hail, { type: MoveTargetType.None }, 0);
    }),
  ),

  // Falinks: the brass keeps the line together, so the first few
  // blows are shared down the troop. A blow the AI only weighs is
  // softened too but spends no trooper
  createAbility(Abilities.RankAndFile, (battle) => {
    const taken = new Map<Unit, number>();

    return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const target = event.parent.target;
      const count = taken.get(target) ?? 0;

      if (
        count >= RANK_AND_FILE_HITS ||
        event.parent.source === target ||
        !target.hasAbility(Abilities.RankAndFile)
      ) {
        return;
      }

      event.value *= RANK_AND_FILE_SCALE;

      if ((event.parent.flags & MoveAttackFlags.Simulated) === 0) {
        taken.set(target, count + 1);
        target.triggerAbility(Abilities.RankAndFile);
      }
    });
  }),

  // Indeedee: it waits on its party, and a blow that found a weakness
  // is the one it answers with Heal Pulse
  createAbility(Abilities.Attendant, (battle) => {
    const resting = createTimedMarks(battle);
    // The whole matchup, since a weakness is only known once every
    // defending type has been worked through
    const effectiveness = new WeakMap<UnitAttackEvent, number>();

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        effectiveness.set(event.parent, (effectiveness.get(event.parent) ?? 1) * event.multiplier);
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const hurt = event.target;

        if (
          !event.success ||
          !hurt.alive ||
          event.source === hurt ||
          (event.flags & MoveAttackFlags.Simulated) !== 0 ||
          (effectiveness.get(event) ?? 1) <= 1
        ) {
          return;
        }

        for (const holder of getAbilityHolders(battle, Abilities.Attendant)) {
          if (
            holder !== hurt &&
            holder.alive &&
            holder.team === hurt.team &&
            holder.hasAbility(Abilities.Attendant) &&
            !resting.has(holder)
          ) {
            resting.mark(holder, ATTENDANT_COOLDOWN);
            holder.triggerAbility(Abilities.Attendant);
            holder.triggerMove(Moves.HealPulse, unitTarget(hurt), 0);
          }
        }
      }),
    ]);
  }),

  // Morpeko: nobody eats in front of it, so an enemy's Berry earns the
  // eater a Nuzzle
  createAbility(Abilities.HangrySpark, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const eater = event.source;

      if (!eater.alive || !isOwnBerry(event.cause, eater)) {
        return;
      }

      for (const holder of getAbilityHolders(battle, Abilities.HangrySpark)) {
        if (
          holder.alive &&
          holder.team.alliance !== eater.team.alliance &&
          holder.hasAbility(Abilities.HangrySpark)
        ) {
          holder.triggerAbility(Abilities.HangrySpark);
          holder.triggerMove(Moves.Nuzzle, unitTarget(eater), 0);
        }
      }
    }),
  ),

  // Duraludon: the tower leans over its party, so a move that would
  // sweep the side breaks on it and nobody behind it is struck. The
  // move's hits elsewhere (the caster's own side) are left alone
  createAbility(
    Abilities.Overhang,
    (battle) =>
      new MergedLifecycle([
        // The cue, once per cast rather than once per sheltered teammate
        battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Pre, (event) => {
          const source = event.source;

          if (!spreadsOverUnits(source, event.move)) {
            return;
          }

          for (const holder of getAbilityHolders(battle, Abilities.Overhang)) {
            if (
              !holder.alive ||
              holder.team.alliance === source.team.alliance ||
              !holder.hasAbility(Abilities.Overhang)
            ) {
              continue;
            }

            for (const mate of holder.team.units) {
              if (mate !== holder && mate.alive) {
                holder.triggerAbility(Abilities.Overhang);
                break;
              }
            }
          }
        }),
        battle.on(BattleEvents.CheckUnitTriggerMoveTarget, AttackPriority.Post, (event) => {
          if (
            event.success &&
            event.target.type === MoveTargetType.Unit &&
            overhangFor(battle, event.source, event.move, event.target.unit) != null
          ) {
            event.success = false;
          }
        }),
      ]),
  ),

  // Dreepy: the Dragon move is the launch, and the Dreepy it throws
  // goes on at whoever else is standing
  createAbility(Abilities.DreepyLaunch, (battle) => {
    const launched = createTimedMarks(battle);

    return new MergedLifecycle([
      ...launched.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.type !== Types.Dragon ||
          !landedOnEnemy(event) ||
          !source.alive ||
          launched.has(source) ||
          !source.hasAbility(Abilities.DreepyLaunch)
        ) {
          return;
        }

        for (const enemy of battle.units(source.team.alliance)) {
          if (enemy !== event.target && enemy.alive) {
            launched.mark(source, DREEPY_LAUNCH_COOLDOWN);
            source.triggerAbility(Abilities.DreepyLaunch);
            source.triggerMove(Moves.DragonDarts, unitTarget(enemy), 0);
            return;
          }
        }
      }),
    ]);
  }),

  // Stonjourner: the circle keeps the sun's time on the battle clock,
  // and its whole team strikes while the light lines up
  createAbility(Abilities.Solstice, (battle) => {
    const { state, lifecycles } = createUnitState<{ since: number; lit: number }>(battle);

    /** Whether some holder on this team has the light through the stones */
    function lit(unit: Unit): boolean {
      for (const holder of getAbilityHolders(battle, Abilities.Solstice)) {
        if (
          holder.team === unit.team &&
          holder.alive &&
          holder.hasAbility(Abilities.Solstice) &&
          (state.get(holder)?.lit ?? 0) > 0
        ) {
          return true;
        }
      }

      return false;
    }

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const holder of getAbilityHolders(battle, Abilities.Solstice)) {
          if (!holder.alive || !holder.hasAbility(Abilities.Solstice)) {
            continue;
          }

          const clock = state.get(holder) ?? { since: 0, lit: 0 };

          clock.lit = Math.max(0, clock.lit - event.duration);
          clock.since += event.duration;

          if (clock.since >= SOLSTICE_INTERVAL) {
            clock.since -= SOLSTICE_INTERVAL;
            clock.lit = SOLSTICE_DURATION;
            holder.triggerAbility(Abilities.Solstice);
          }

          state.set(holder, clock);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        if (lit(event.parent.source)) {
          event.value *= SOLSTICE_SCALE;
        }
      }),
    ]);
  }),
];

export default setupAbilities;
