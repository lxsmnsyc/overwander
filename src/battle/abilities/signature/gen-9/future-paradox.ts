import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import { Stats } from '../../../../data/constants/stats';
import { Types } from '../../../../data/constants/types';
import Abilities from '../../../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, MoveFlags, Moves } from '../../../../data/ids/moves';
import { Statuses, Terrains } from '../../../../data/ids/status';
import { getMoveData } from '../../../../data/moves';
import { isPunchMove } from '../../../../data/moves/punches';
import { healWorth } from '../../../ai/score';
import type Battle from '../../../battle';
import {
  BattleEvents,
  EffectType,
  type MoveTarget,
  MoveTargetType,
  type UnitAttackEvent,
} from '../../../events';
import { type Lifecycle, MergedLifecycle } from '../../../lifecycle';
import { GUARD_MOVES } from '../../../moves/protect';
import { stonesOver } from '../../../moves/stealth-rock';
import { GUARDS } from '../../../moves/team-guards';
import turns from '../../../turn';
import type Unit from '../../../unit';
import { isPrimalWeather } from '../../../weather';
import { createAbility } from '../../__create';
import { createTimedMarks } from '../__create';

/** How long Track Laying rests between the stones it lays */
export const TRACK_LAYING_COOLDOWN = 15_000;

/** What an Ice Pack heals the teammate it is thrown at, as a share of their HP */
export const ICE_PACK_HEAL = 1 / 4;

/** How long an Iron Grip keeps its target from guarding */
export const IRON_GRIP_DURATION = turns(2);

/** How often a Fire move of Toxic Exhaust's poisons */
export const TOXIC_EXHAUST_CHANCE = 0.2;

/** How long Sand Generator rests between the storms it raises */
export const SAND_GENERATOR_COOLDOWN = 15_000;

/** How long after a hit Afterimage's quicker wind-up waits to be used */
export const AFTERIMAGE_WINDOW = 1000;

/** What Afterimage leaves of the next wind-up */
export const AFTERIMAGE_SCALE = 0.6;

/** What Terrain Edge's slicing moves hit for while a terrain is up */
export const TERRAIN_EDGE_BOOST = 1.3;

/** Whether a landed attack is one an ability should answer, not the AI weighing one */
function landedForReal(battle: Battle, event: UnitAttackEvent): boolean {
  return (
    event.success &&
    !(event.flags & MoveAttackFlags.Simulated) &&
    !battle.estimating &&
    event.source.team.alliance !== event.target.team.alliance
  );
}

/** The guards that turn a move away, Endure left out since it only holds on */
function isProtectMove(move: Moves): boolean {
  return GUARD_MOVES[move] === Statuses.Protected || GUARDS[move] != null;
}

/** The teammate an Ice Pack holder's move is aimed at, or nobody */
function packedMate(source: Unit, move: Moves, target: MoveTarget): Unit | undefined {
  if (
    target.type === MoveTargetType.Unit &&
    target.unit !== source &&
    target.unit.team.alliance === source.team.alliance &&
    getMoveData(move).category !== MoveCategories.Status &&
    source.hasAbility(Abilities.IcePack) &&
    source.checkMoveType(move, target) === Types.Ice
  ) {
    return target.unit;
  }
  return undefined;
}

/** Whether a terrain is laid anywhere the holder or its target stands */
function terrainUp(battle: Battle, source: Unit, target: MoveTarget): boolean {
  return (
    battle.terrain.current !== Terrains.None ||
    source.team.terrain.current !== Terrains.None ||
    (target.type === MoveTargetType.Unit && target.unit.team.terrain.current !== Terrains.None)
  );
}

/**
 * Marks that let go after a while or as soon as their unit starts a
 * cast, whichever comes first
 */
function createCastWindow(battle: Battle): {
  mark(unit: Unit, duration: number): void;
  has(unit: Unit): boolean;
  lifecycles: Lifecycle[];
} {
  const marks = new Map<Unit, number>();

  const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [unit, left] of marks) {
      if (left > event.duration) {
        marks.set(unit, left - event.duration);
      } else {
        marks.delete(unit);
      }
    }
    if (marks.size === 0) {
      clock.stop();
    }
  });

  clock.stop();

  return {
    mark(unit, duration) {
      marks.set(unit, duration);
      clock.start();
    },
    has: (unit) => marks.has(unit),
    lifecycles: [
      clock,
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        marks.delete(event.source);
      }),
    ],
  };
}

/**
 * Paldea's Future Paradoxes, each a machine built to do one job of the
 * pokemon it copies, and nothing shared between them
 */
const futureParadox: ReturnType<typeof createAbility>[] = [
  // Iron Treads: the treads lay rock behind whatever it runs over. The
  // move's own rules decide whether the stones can hang
  createAbility(Abilities.TrackLaying, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const side = event.target.team;

        if (
          event.type !== Types.Ground ||
          !landedForReal(battle, event) ||
          !source.alive ||
          resting.has(source) ||
          stonesOver(side) ||
          !source.hasAbility(Abilities.TrackLaying)
        ) {
          return;
        }

        resting.mark(source, TRACK_LAYING_COOLDOWN);
        source.triggerAbility(Abilities.TrackLaying);
        source.triggerMove(Moves.StealthRock, { type: MoveTargetType.Team, team: side }, 0);
      }),
    ]);
  }),

  // Iron Bundle: an Ice move thrown at a friend is a cold pack, not a
  // blow. Refused as an immunity, so no secondary effect rides it either
  createAbility(
    Abilities.IcePack,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (!event.immune && packedMate(event.source, event.move, event.target) != null) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;
          const mate = packedMate(parent.source, parent.move, parent.target);

          if (mate == null || !mate.alive) {
            return;
          }

          parent.source.triggerAbility(Abilities.IcePack);
          parent.source.heal(
            { type: EffectType.Ability, ability: Abilities.IcePack, unit: parent.source },
            mate,
            mate.checkStat(Stats.HP, 0) * ICE_PACK_HEAL,
            0,
          );
        }),
        // The heal rides a failed move, which the chooser never sees
        battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
          const mate = packedMate(event.source, event.move, event.target);

          if (mate != null) {
            event.score += healWorth(mate, ICE_PACK_HEAL);
          }
        }),
        battle.on(BattleEvents.CheckUnitAIMoveFeeds, AttackPriority.Post, (event) => {
          const mate = packedMate(event.source, event.move, event.target);

          if (mate != null && healWorth(mate, ICE_PACK_HEAL) > 0) {
            event.feeds = true;
          }
        }),
      ]),
  ),

  // Iron Hands: what it has hold of cannot raise a guard
  createAbility(Abilities.IronGrip, (battle) => {
    const gripped = createTimedMarks(battle);

    return new MergedLifecycle([
      ...gripped.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (
          isPunchMove(event.move) &&
          landedForReal(battle, event) &&
          event.target.alive &&
          event.source.hasAbility(Abilities.IronGrip)
        ) {
          event.source.triggerAbility(Abilities.IronGrip);
          gripped.mark(event.target, IRON_GRIP_DURATION);
        }
      }),
      battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
        if (event.success && gripped.has(event.source) && isProtectMove(event.move)) {
          event.success = false;
        }
      }),
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
        if (event.usable && gripped.has(event.source) && isProtectMove(event.move)) {
          event.usable = false;
        }
      }),
    ]);
  }),

  // Iron Moth: its fire burns dirty
  createAbility(Abilities.ToxicExhaust, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        event.type !== Types.Fire ||
        !landedForReal(battle, event) ||
        !event.target.alive ||
        !source.hasAbility(Abilities.ToxicExhaust) ||
        battle.random() >= TOXIC_EXHAUST_CHANCE
      ) {
        return;
      }

      source.triggerAbility(Abilities.ToxicExhaust);
      event.target.addStatus(Statuses.Poisoned, {
        type: EffectType.Ability,
        ability: Abilities.ToxicExhaust,
        unit: source,
      });
    }),
  ),

  // Iron Thorns: a current through it spins up the sand. Cast as
  // Sandstorm, the way Sand Spit raises its storm
  createAbility(Abilities.SandGenerator, (battle) => {
    const resting = createTimedMarks(battle);

    return new MergedLifecycle([
      ...resting.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          event.type !== Types.Electric ||
          !landedForReal(battle, event) ||
          !target.alive ||
          resting.has(target) ||
          !target.hasAbility(Abilities.SandGenerator) ||
          isPrimalWeather(battle.weather.current)
        ) {
          return;
        }

        resting.mark(target, SAND_GENERATOR_COOLDOWN);
        target.triggerAbility(Abilities.SandGenerator);
        target.triggerMove(Moves.Sandstorm, { type: MoveTargetType.None }, 0);
      }),
    ]);
  }),

  // Iron Valiant: struck, it is already moving. The quicker wind-up is
  // spent on the next cast or lost after the window
  createAbility(Abilities.Afterimage, (battle) => {
    const quick = createCastWindow(battle);

    return new MergedLifecycle([
      ...quick.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          event.category !== MoveCategories.Status &&
          landedForReal(battle, event) &&
          target.alive &&
          target.hasAbility(Abilities.Afterimage)
        ) {
          target.triggerAbility(Abilities.Afterimage);
          quick.mark(target, AFTERIMAGE_WINDOW);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (quick.has(event.source) && event.source.hasAbility(Abilities.Afterimage)) {
          event.duration *= AFTERIMAGE_SCALE;
        }
      }),
    ]);
  }),

  // Iron Leaves: its blade is sharpest on laid ground, whatever the
  // ground is laid with
  createAbility(Abilities.TerrainEdge, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(Abilities.TerrainEdge) &&
        (getMoveData(event.move).flags & MoveFlags.Slicing) !== 0 &&
        terrainUp(battle, event.source, event.target)
      ) {
        event.power *= TERRAIN_EDGE_BOOST;
      }
    }),
  ),
];

export default futureParadox;
