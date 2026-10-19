import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import { Stages, Stats } from '../../../../data/constants/stats';
import { Types } from '../../../../data/constants/types';
import Abilities from '../../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, MoveFlags, Moves } from '../../../../data/ids/moves';
import { Statuses, Terrains } from '../../../../data/ids/status';
import { STATUS_MOVES } from '../../../../data/battle';
import { getMoveData } from '../../../../data/moves';
import { isPseudoMove } from '../../../../data/moves/pseudo';
import type Battle from '../../../battle';
import { BattleEvents, EffectType, MoveTargetType, type UnitAttackEvent } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import { registerSideCondition } from '../../../mechanics/side-conditions';
import { MAJOR_STATUS_CONDITIONS } from '../../../status';
import type Team from '../../../team';
import { TAILWIND_DURATION } from '../../../moves/tailwind';
import turns from '../../../turn';
import type Unit from '../../../unit';
import { unitTarget } from '../../../unit-checks';
import onUnitActs from '../../../acts';
import { countHeldItems, stealableItem } from '../../../items/held';
import { createAbility, getAbilityHolders } from '../../__create';
import { allyHolder, createNextCastPenalty, createTimedMarks } from '../__create';

/** How much harder Bubble Shock's Electric moves hit a soaked target */
export const BUBBLE_SHOCK_SCALE = 1.5;
/** How long a Water move leaves its target soaked */
export const BUBBLE_SHOCK_WINDOW = turns(2);

/** How much harder Lightning Dive's Electric moves hit with the wind behind */
export const LIGHTNING_DIVE_SCALE = 1.3;

/** What Windswept leaves of the next wind-up */
export const WINDSWEPT_SCALE = 0.5;

/** The share of its HP a burn gives back to a Heat Tolerance holder */
export const HEAT_TOLERANCE_FRACTION = 1 / 8;

/** The share of HP a teammate has to fall under for Ball Toss */
export const BALL_TOSS_THRESHOLD = 1 / 3;

/** How long one target rests between Stare Down's Taunts */
export const STARE_DOWN_COOLDOWN = turns(5);

/** Whether a landed attack is one an ability should answer, not the AI weighing one */
function landedForReal(battle: Battle, event: UnitAttackEvent): boolean {
  return event.success && !(event.flags & MoveAttackFlags.Simulated) && !battle.estimating;
}

/** Whether a resolved blow does damage that a multiplier can scale */
function scalable(event: UnitAttackEvent): boolean {
  return !(event.flags & MoveAttackFlags.Pure) && !(event.flags & MoveAttackFlags.Confused);
}

/**
 * Tailwind keeps its clock to itself, so Lightning Dive keeps a copy:
 * set as the move takes effect, run down on the battle's clock, and
 * carried across by Court Change like any other side condition. It
 * runs whether or not a holder is out, since a wind can rise first
 */
function trackTailwind(battle: Battle): ReadonlyMap<Team, number> {
  const remaining = new Map<Team, number>();

  const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [team, left] of remaining) {
      if (left <= event.duration) {
        remaining.delete(team);
      } else {
        remaining.set(team, left - event.duration);
      }
    }
    if (remaining.size === 0) {
      clock.stop();
    }
  });

  clock.stop();

  registerSideCondition(battle, {
    read: (team) => remaining.get(team),
    write: (team, value) => {
      if (value == null) {
        remaining.delete(team);
      } else {
        remaining.set(team, value);
        clock.start();
      }
    },
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (event.move === Moves.Tailwind) {
      remaining.set(event.source.team, TAILWIND_DURATION);
      clock.start();
    }
  });

  return remaining;
}

/** Whether the move rides on the wind */
function isWindMove(move: Moves): boolean {
  // A confused pokemon's self-hit is a pseudo move with no data of its own
  return !isPseudoMove(move) && (getMoveData(move).flags & MoveFlags.Wind) !== 0;
}

/**
 * Paldea from Tadbulb to Wiglett: the coast, the sky and the dry
 * country, each line working what it lives in into how it fights
 */
const tadbulbToWiglett: ReturnType<typeof createAbility>[] = [
  // Tadbulb: water carries the charge, so a target still wet from a
  // Water move, anybody's, takes the shock harder
  createAbility(Abilities.BubbleShock, (battle) => {
    const soaked = createTimedMarks(battle);

    return new MergedLifecycle([
      ...soaked.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (event.type === Types.Water && landedForReal(battle, event) && event.target.alive) {
          soaked.mark(event.target, BUBBLE_SHOCK_WINDOW);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.type === Types.Electric &&
          scalable(parent) &&
          soaked.has(parent.target) &&
          parent.source.hasAbility(Abilities.BubbleShock)
        ) {
          event.value *= BUBBLE_SHOCK_SCALE;
        }
      }),
    ]);
  }),

  // Wattrel: it dives with the wind at its back
  createAbility(Abilities.LightningDive, (battle) => {
    const tailwind = trackTailwind(battle);

    return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        parent.type === Types.Electric &&
        scalable(parent) &&
        tailwind.has(parent.source.team) &&
        parent.source.hasAbility(Abilities.LightningDive)
      ) {
        event.value *= LIGHTNING_DIVE_SCALE;
      }
    });
  }),

  // Bramblin: any wind on the field, either side's, sets it rolling.
  // A status wind (Tailwind, Whirlwind) has no blow, so it counts as
  // it takes effect
  createAbility(Abilities.Windswept, (battle) => {
    const rolling = createNextCastPenalty(battle, WINDSWEPT_SCALE);

    function sweep(): void {
      if (battle.estimating) {
        return;
      }
      for (const holder of getAbilityHolders(battle, Abilities.Windswept)) {
        if (holder.alive && holder.hasAbility(Abilities.Windswept)) {
          rolling.mark(holder);
          holder.triggerAbility(Abilities.Windswept);
        }
      }
    }

    return new MergedLifecycle([
      ...rolling.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (isWindMove(event.move) && landedForReal(battle, event)) {
          sweep();
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
        if (isWindMove(event.move) && getMoveData(event.move).category === MoveCategories.Status) {
          sweep();
        }
      }),
    ]);
  }),

  // Toedscool: the mat under the grass draws the sickness out along
  // with the terrain's heal. The terrain heals with no cause of its
  // own, which is how its heal is told from any other
  createAbility(Abilities.MyceliumMat, (battle) =>
    battle.on(BattleEvents.UnitHeal, EventPriority.Post, (event) => {
      const mate = event.target;

      if (
        event.cause.type !== EffectType.None ||
        !mate.alive ||
        mate.checkTerrain() !== Terrains.Grassy
      ) {
        return;
      }

      const holder = allyHolder(battle, mate, Abilities.MyceliumMat);

      if (holder == null) {
        return;
      }

      for (const status of MAJOR_STATUS_CONDITIONS) {
        if (mate.status[status] != null) {
          holder.triggerAbility(Abilities.MyceliumMat);
          mate.removeStatus(status, {
            type: EffectType.Ability,
            ability: Abilities.MyceliumMat,
            unit: holder,
          });
          return;
        }
      }
    }),
  ),

  // Capsakid: the heat is food rather than harm. The burn stays on, so
  // nothing else can be put on in its place
  createAbility(
    Abilities.HeatTolerance,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Pre, (event) => {
          if (
            event.status === Statuses.Burned &&
            event.source.hasAbility(Abilities.HeatTolerance)
          ) {
            event.disabled = true;
          }
        }),
        ...onUnitActs(battle, (unit) => {
          if (
            unit.alive &&
            unit.status[Statuses.Burned] != null &&
            unit.hasAbility(Abilities.HeatTolerance)
          ) {
            unit.triggerAbility(Abilities.HeatTolerance);
            unit.heal(
              { type: EffectType.Ability, ability: Abilities.HeatTolerance, unit },
              unit,
              unit.checkStat(Stats.HP, 0) * HEAT_TOLERANCE_FRACTION,
              0,
            );
          }
        }),
        // The burn halves physical damage; this undoes it, unless Guts
        // already has
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;
          const source = parent.source;

          if (
            parent.category === MoveCategories.Physical &&
            scalable(parent) &&
            source.status[Statuses.Burned] != null &&
            source.hasAbility(Abilities.HeatTolerance) &&
            !source.hasAbility(Abilities.Guts)
          ) {
            event.value *= 2;
          }
        }),
        // Burning it is a gift, so the AI is refused it
        battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
          if (
            event.usable &&
            STATUS_MOVES[event.move] === Statuses.Burned &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.HeatTolerance)
          ) {
            event.usable = false;
          }
        }),
      ]),
  ),

  // Rellor: it rolls what it carries over to a teammate in trouble
  createAbility(Abilities.BallToss, (battle) => {
    const thrown = new Set<Unit>();
    const before = new WeakMap<object, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        before.set(event, event.target.health);
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const mate = event.target;
        const was = before.get(event);

        if (was == null || battle.estimating || !mate.alive) {
          return;
        }

        const line = mate.checkStat(Stats.HP, 0) * BALL_TOSS_THRESHOLD;

        if (was < line || mate.health >= line || countHeldItems(mate) > 0) {
          return;
        }

        for (const holder of mate.team.units) {
          if (
            holder === mate ||
            !holder.alive ||
            thrown.has(holder) ||
            !holder.hasAbility(Abilities.BallToss)
          ) {
            continue;
          }

          const item = stealableItem(holder);

          if (item == null) {
            continue;
          }

          thrown.add(holder);
          holder.triggerAbility(Abilities.BallToss);
          holder.removeItem(item, {
            type: EffectType.Ability,
            ability: Abilities.BallToss,
            unit: holder,
          });
          mate.addItem(item);
          return;
        }
      }),
    ]);
  }),

  // Flittle: one look and the target can think of nothing but hitting
  // back. Each target rests between stares, whoever stared
  createAbility(Abilities.StareDown, (battle) => {
    const stared = createTimedMarks(battle);

    return new MergedLifecycle([
      ...stared.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const { source, target } = event;

        if (
          event.type !== Types.Psychic ||
          !landedForReal(battle, event) ||
          source.team.alliance === target.team.alliance ||
          !source.alive ||
          !target.alive ||
          stared.has(target) ||
          !source.hasAbility(Abilities.StareDown)
        ) {
          return;
        }

        stared.mark(target, STARE_DOWN_COOLDOWN);
        source.triggerAbility(Abilities.StareDown);
        source.triggerMove(Moves.Taunt, unitTarget(target), 0);
      }),
    ]);
  }),

  // Tinkatink: whatever a teammate uses up, it hammers out again. One
  // remake per teammate, and only for an item the teammate spent itself
  createAbility(Abilities.Tinker, (battle) => {
    const remade = new Set<Unit>();

    return battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const mate = event.source;

      if (event.cause.type !== EffectType.Item || !mate.alive || remade.has(mate)) {
        return;
      }

      const holder = allyHolder(battle, mate, Abilities.Tinker);

      if (holder == null) {
        return;
      }

      remade.add(mate);
      holder.triggerAbility(Abilities.Tinker);
      mate.addItem(event.item);
    });
  }),

  // Wiglett: it ducks into the sand, and the quake passes over it
  createAbility(
    Abilities.SandDuck,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
          const { source, move, target } = event.parent;

          if (!event.hit || target.type !== MoveTargetType.Unit) {
            return;
          }

          const holder = target.unit;

          if (
            holder === source ||
            source.checkMoveType(move, target) !== Types.Ground ||
            !holder.hasAbility(Abilities.SandDuck)
          ) {
            return;
          }

          event.hit = false;

          if (!battle.estimating) {
            holder.triggerAbility(Abilities.SandDuck);
            holder.addStage(Stages.Speed, 1, {
              type: EffectType.Ability,
              ability: Abilities.SandDuck,
              unit: holder,
            });
          }
        }),
        // A Ground move at it only feeds it, so the AI is refused one
        battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
          if (
            event.usable &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.source.checkMoveType(event.move, event.target) === Types.Ground &&
            event.target.unit.hasAbility(Abilities.SandDuck)
          ) {
            event.usable = false;
          }
        }),
      ]),
  ),
];

export default tadbulbToWiglett;
