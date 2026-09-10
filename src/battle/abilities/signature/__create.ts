import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import type Abilities from '../../../data/ids/abilities';
import type { Types } from '../../../data/constants/types';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  MoveFlags,
  MoveTargets,
  Moves,
} from '../../../data/ids/moves';
import { getMoveData, getWeatherMove } from '../../../data/moves';
import { Statuses, TeamStatuses, type Weathers } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType, type UnitDamageEvent } from '../../events';
import { type Lifecycle, MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { isPrimalWeather, onUnitActs } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';

/**
 * What the signature abilities that remember something share: state
 * kept per unit and dropped when that unit arrives on the field or
 * falls. An ability lifting and settling again is not an arrival
 */
export function createUnitState<T>(battle: Battle): {
  state: Map<Unit, T>;
  lifecycles: Lifecycle[];
} {
  const state = new Map<Unit, T>();

  return {
    state,
    lifecycles: [
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          state.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        state.delete(event.source);
      }),
    ],
  };
}

/** A tally per unit, with an unwritten one reading zero */
export interface UnitCounter {
  get(unit: Unit): number;
  set(unit: Unit, value: number): void;
  clear(unit: Unit): void;
}

export function createUnitCounter(battle: Battle): {
  counter: UnitCounter;
  lifecycles: Lifecycle[];
} {
  const { state, lifecycles } = createUnitState<number>(battle);

  return {
    counter: {
      get: (unit) => state.get(unit) ?? 0,
      set(unit, value) {
        state.set(unit, value);
      },
      clear(unit) {
        state.delete(unit);
      },
    },
    lifecycles,
  };
}

/**
 * What a blow actually took off, which is not what it asked for:
 * overkill and a non-lethal clamp both settle out of the health
 * standing before it. Read it from a UnitDamage listener at Post
 */
export function createDamageTaken(battle: Battle): {
  taken(event: UnitDamageEvent): number | undefined;
  lifecycles: Lifecycle[];
} {
  const standing = new WeakMap<object, number>();

  return {
    taken(event) {
      const before = standing.get(event);

      if (before == null) {
        return undefined;
      }

      standing.delete(event);

      return Math.max(0, before - event.target.health);
    },
    lifecycles: [
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        standing.set(event, event.target.health);
      }),
    ],
  };
}

/**
 * A standing holder of this ability anywhere on the field, or none.
 *
 * The candidates come from the ability factory's own holder list
 * rather than from a sweep of the field, since these questions are
 * asked from checks that run on every stat and every hit. The two
 * things the list does not know are still asked of each candidate:
 * whether it is still standing, and whether something is suppressing
 * what it carries
 */
export function fieldHolder(battle: Battle, ability: Abilities): Unit | undefined {
  for (const unit of getAbilityHolders(battle, ability)) {
    if (unit.alive && unit.hasAbility(ability)) {
      return unit;
    }
  }

  return undefined;
}

/**
 * Whether anybody still standing carries the ability, wherever they
 * stand. It is what a field-wide signature reads: the effect belongs
 * to the fight rather than to a side
 */
export function fieldHasAbility(battle: Battle, ability: Abilities): boolean {
  return fieldHolder(battle, ability) != null;
}

/**
 * The standing holder on the other side of the fight from this unit,
 * for an effect a holder works on its enemies
 */
export function enemyHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of getAbilityHolders(battle, ability)) {
    if (other.alive && other.team.alliance !== unit.team.alliance && other.hasAbility(ability)) {
      return other;
    }
  }

  return undefined;
}

/**
 * The standing holder on this unit's own side, itself included: an
 * effect that reaches everybody under the same banner
 */
export function sideHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of getAbilityHolders(battle, ability)) {
    if (other.alive && other.team === unit.team && other.hasAbility(ability)) {
      return other;
    }
  }

  return undefined;
}

/**
 * The standing holder beside this unit, itself excluded: an effect one
 * pokemon works on the rest of its side
 */
export function allyHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of getAbilityHolders(battle, ability)) {
    if (other !== unit && other.alive && other.team === unit.team && other.hasAbility(ability)) {
      return other;
    }
  }

  return undefined;
}

/**
 * The moves no signature reads: a confused unit hitting itself, the
 * bare fallback swing and the last resort. None of them are the
 * pokemon's own attack, and one of them has no registry entry to ask
 */
const PSEUDO_MOVES = new Set<Moves>([Moves._Confused, Moves.Struggle, Moves.Attack]);

/** Whether the move is one of the three no signature reads */
export function isPseudoMove(move: Moves): boolean {
  return PSEUDO_MOVES.has(move);
}

/** Whether this is a physical move the pokemon actually chose */
export function isPhysicalMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && getMoveData(move).category === MoveCategories.Physical;
}

/** Whether the move is one aimed at a single pokemon the holder chose */
export function isSingleTargetMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && getMoveData(move).target === MoveTargets.Unit;
}

/** Whether the move is one carried on sound the pokemon actually chose */
export function isSoundMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && (getMoveData(move).flags & MoveFlags.Sound) !== 0;
}

/** Whether the move is held down over steps rather than let go at once */
export function isChannelledMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && (getMoveData(move).steps ?? 0) > 0;
}

/**
 * The shared half of every effect that slows down the next thing a
 * unit reaches for: a coil, a spiral, a blow to the head. The mark is
 * dropped as the cast begins rather than as it is asked about, since
 * the AI asks about a cast time many times before one starts
 */
export function createNextCastPenalty(
  battle: Battle,
  scale: number,
): {
  mark(unit: Unit): void;
  lifecycles: Lifecycle[];
} {
  const marked = new Set<Unit>();

  return {
    mark(unit) {
      marked.add(unit);
    },
    lifecycles: [
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (marked.has(event.source)) {
          event.duration *= scale;
        }
      }),
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        marked.delete(event.source);
      }),
    ],
  };
}

/**
 * Marks that let go on their own, for the effects that hold somebody
 * for a few seconds rather than until something happens. The clock
 * only runs while at least one mark stands
 */
export function createTimedMarks(battle: Battle): {
  mark(unit: Unit, duration: number): void;
  has(unit: Unit): boolean;
  lifecycles: Lifecycle[];
} {
  const marks = new Map<Unit, number>();

  const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    const expired: Unit[] = [];

    for (const [unit, left] of marks) {
      const next = left - event.duration;

      if (next <= 0) {
        expired.push(unit);
      } else {
        marks.set(unit, next);
      }
    }

    for (const unit of expired) {
      marks.delete(unit);
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
    lifecycles: [clock],
  };
}

/**
 * The five a fight is fought with. HP is left out: it is not a stat a
 * pokemon leans on, it is the room it has to be wrong in
 */
export const BATTLE_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

/**
 * Reads which of a unit's five stats stand highest and lowest. Asking
 * for a stat emits the same event the caller is answering, so the
 * measurement raises a flag the caller checks before it does anything
 */
/** What a field tilted toward a type is worth, and against one */
export const FIELD_RAISED_SCALE = 1.2;
export const FIELD_LOWERED_SCALE = 0.8;

/**
 * What the Kanto starters share: each tilts the whole field toward its
 * own type and away from the one that type beats, its own side included.
 * Read where the blow's damage is worked out, so it reaches every move
 * of that type whoever threw it
 */
export function createFieldAbility(
  ability: Abilities,
  raised: Types,
  lowered: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const holder = fieldHolder(battle, ability);

      if (!holder) {
        return;
      }

      if (parent.type === raised) {
        event.value *= FIELD_RAISED_SCALE;
      } else if (parent.type === lowered) {
        event.value *= FIELD_LOWERED_SCALE;
      }
    }),
  );
}

/** What a mark left on something takes each time it moves, and the deeper bite */
export const MARK_FRACTION = 1 / 16;
export const MARK_DEEP_FRACTION = 1 / 8;

/** What each starter's mark does besides taking its share */
export type MarkRider = 'drink' | 'kindle' | 'hold';

/**
 * What the Johto starters share: a landed move leaves the line's own
 * element on whatever it hit, and that thing pays for it every time it
 * moves. The mark is kept on the marked unit, so it goes when that unit
 * leaves the field or falls
 */
export function createMarkAbility(
  ability: Abilities,
  rider: MarkRider,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const { state, lifecycles } = createUnitState<Unit>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.hasAbility(ability)
        ) {
          return;
        }

        // A jaw holds one thing: marking something else lets the last
        // one go
        if (rider === 'hold') {
          for (const [marked, marker] of state) {
            if (marker === source && marked !== target) {
              state.delete(marked);
            }
          }
        }

        state.set(target, source);
      }),
      ...onUnitActs(battle, (unit) => {
        const marker = state.get(unit);

        if (marker == null || !marker.alive || !marker.hasAbility(ability)) {
          return;
        }

        const deep =
          rider === 'hold' || (rider === 'kindle' && unit.status[Statuses.Burned] != null);
        const amount = unit.checkStat(Stats.HP, 0) * (deep ? MARK_DEEP_FRACTION : MARK_FRACTION);
        const cause = { type: EffectType.Ability, ability, unit: marker } as const;

        marker.triggerAbility(ability);
        marker.damage(cause, unit, amount, DamageFlags.Indirect);

        if (rider === 'drink') {
          marker.heal(cause, marker, amount, 0);
        }
      }),
      ...lifecycles,
    ]);
  });
}

/** How far a starter may grow a stat on its own */
export const GROWTH_MAX_STAGES = 3;

/** What sets a starter growing: its own action, its blows, or the ones it takes */
export type GrowthTrigger = 'acts' | 'lands' | 'takes';

/**
 * What a region's three starters share: each grows through a fight in
 * the stat its line is built on, a stage at a time and only so far.
 * Stages rather than a hidden multiplier, so a Haze strips the growth
 * and everything that reads a stage sees it
 */
export function createGrowthAbility(
  ability: Abilities,
  stage: Stages,
  trigger: GrowthTrigger,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    function grow(unit: Unit): void {
      const held = counter.get(unit);

      if (held >= GROWTH_MAX_STAGES || !unit.hasAbility(ability)) {
        return;
      }

      counter.set(unit, held + 1);
      unit.triggerAbility(ability);
      unit.addStage(stage, 1, { type: EffectType.Ability, ability, unit });
    }

    function watch(): Lifecycle[] {
      if (trigger === 'acts') {
        return onUnitActs(battle, grow);
      }

      if (trigger === 'lands') {
        return [
          battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
            if (event.hit) {
              grow(event.parent.source);
            }
          }),
        ];
      }

      return [
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (event.success && !(event.flags & DamageFlags.Indirect) && event.target.alive) {
            grow(event.target);
          }
        }),
      ];
    }

    return new MergedLifecycle([...watch(), ...lifecycles]);
  });
}

/**
 * What the three Sinnoh starters share: each is braced for one kind of
 * blow. The first one of that kind each fight lands for half of what
 * it was worth, or fails outright where it is a status move, and what
 * the holder does with it is the family's own.
 *
 * A status move is vetoed in the query and paid for on the real
 * failure, so a speculative immunity check never spends the brace
 */
export function createBraceAbility(
  ability: Abilities,
  blow: MoveCategories,
  build: (battle: Battle) => { answer: (unit: Unit) => void; lifecycles?: Lifecycle[] },
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    /** Who has already taken the blow it was braced for */
    const spent = new Set<Unit>();
    const { answer, lifecycles = [] } = build(battle);

    function braced(unit: Unit): boolean {
      return !spent.has(unit) && unit.hasAbility(ability);
    }

    function brace(unit: Unit): void {
      spent.add(unit);
      unit.triggerAbility(ability);
      answer(unit);
    }

    if (blow !== MoveCategories.Status) {
      return new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.value > 0 &&
            parent.category === blow &&
            !(parent.flags & MoveAttackFlags.Simulated) &&
            braced(parent.target)
          ) {
            event.value /= 2;
            brace(parent.target);
          }
        }),
        ...lifecycles,
      ]);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          getMoveData(event.move).category === MoveCategories.Status &&
          braced(event.target.unit)
        ) {
          event.immune = true;
        }
      }),
      // Spent only when a real move actually failed against it
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.target.type === MoveTargetType.Unit &&
          parent.target.unit !== parent.source &&
          getMoveData(parent.move).category === MoveCategories.Status &&
          braced(parent.target.unit)
        ) {
          brace(parent.target.unit);
        }
      }),
      ...lifecycles,
    ]);
  });
}

/**
 * What the three Kanto birds share: the beat of the wings as one takes
 * the field costs every enemy a stage of whatever that bird's weather
 * works on. Nothing in it reads a type, so a regional form of the same
 * bird would beat its wings the same way
 */
export function createWingbeatAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(ability)) {
            event.source.triggerAbility(ability);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== ability) {
            return;
          }

          const source = event.source;
          const cause = { type: EffectType.Ability, ability, unit: source } as const;

          for (const enemy of battle.units(source.team.alliance)) {
            if (enemy.alive) {
              enemy.addStage(stage, -1, cause);
            }
          }
        }),
      ]),
  );
}

/**
 * What the three legendary beasts share: the first blow that would
 * finish one leaves it standing on 1 HP, cured of whatever it was
 * carrying, and a stage sharper in the stat that beast is built on.
 * Once per battle rather than once per arrival, the way a revival is
 */
export function createRisenAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const spent = new Set<Unit>();

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const target = event.target;

      if (
        !target.alive ||
        event.flags & DamageFlags.Indirect ||
        event.value < target.health ||
        spent.has(target) ||
        !target.hasAbility(ability)
      ) {
        return;
      }

      spent.add(target);
      event.value = target.health - 1;

      const cause = { type: EffectType.Ability, ability, unit: target } as const;

      target.triggerAbility(ability);
      target.cure(cause);
      target.addStage(stage, 1, cause);
    });
  });
}

/**
 * The mean of a unit's five battle stats, with the same guard the
 * extremes carry: reading the stats asks the stat check again, and a
 * listener built on this must sit that reading out
 */
export function createStatAverage(): {
  measuring(): boolean;
  average(unit: Unit): number;
} {
  let measuring = false;

  return {
    measuring: () => measuring,
    average(unit) {
      measuring = true;

      let total = 0;

      for (const stat of BATTLE_STATS) {
        total += unit.checkStat(stat, 0);
      }

      measuring = false;

      return total / BATTLE_STATS.length;
    },
  };
}

export function createStatExtremes(): {
  measuring(): boolean;
  extremes(unit: Unit): { highest: Stats; lowest: Stats };
} {
  let measuring = false;

  return {
    measuring: () => measuring,
    extremes(unit) {
      measuring = true;

      let highest = BATTLE_STATS[0];
      let lowest = BATTLE_STATS[0];
      let highestValue = Number.NEGATIVE_INFINITY;
      let lowestValue = Number.POSITIVE_INFINITY;

      for (const stat of BATTLE_STATS) {
        const value = unit.checkStat(stat, 0);

        if (value > highestValue) {
          highest = stat;
          highestValue = value;
        }

        if (value < lowestValue) {
          lowest = stat;
          lowestValue = value;
        }
      }

      measuring = false;

      return { highest, lowest };
    },
  };
}

/** What one poisoned enemy is worth to the court, and how many it counts */
export const REGAL_COURT_STEP = 0.15;
export const REGAL_COURT_MAX_ENEMIES = 3;

/** Which half of the court an ability is: the shield or the spear */
export type RegalCourtSide = 'defends' | 'attacks';

/** Whether the unit is carrying poison of either kind */
function isPoisoned(unit: Unit): boolean {
  return unit.status[Statuses.Poisoned] != null || unit.status[Statuses.BadlyPoisoned] != null;
}

/** How many of the holder's enemies are standing there poisoned */
function poisonedEnemies(battle: Battle, holder: Unit): number {
  let counted = 0;

  for (const enemy of battle.units(holder.team.alliance)) {
    if (enemy.alive && isPoisoned(enemy)) {
      counted += 1;
    }
  }

  return Math.min(REGAL_COURT_MAX_ENEMIES, counted);
}

/**
 * What the two Nidoran lines share: both are paid in poison, so every
 * poisoned enemy on the field lifts the holder. The female takes her
 * due on the defending side and the male his on the attacking one,
 * which is why either one poisoning is worth something to both
 */
export function createRegalCourtAbility(
  ability: Abilities,
  side: RegalCourtSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const defends = side === 'defends';

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const holder = defends ? parent.target : parent.source;
      const wanted = defends
        ? event.stat === Stats.Defense || event.stat === Stats.SpecialDefense
        : event.stat === Stats.Attack || event.stat === Stats.SpecialAttack;

      if (!wanted || event.unit !== holder || !holder.hasAbility(ability)) {
        return;
      }

      const counted = poisonedEnemies(battle, holder);

      if (counted > 0) {
        event.value *= 1 + REGAL_COURT_STEP * counted;
      }
    }),
  );
}

/** What the shell keeps out, and what the blade cuts through */
export const FOSSIL_SHELL_SCALE = 1.25;
export const FOSSIL_BLADE_SCALE = 0.75;

/** Which fossil an ability is: the shell that holds or the blade that opens it */
export type FossilSide = 'shell' | 'blade';

/**
 * What the two Kanto fossils share: both are written on the defending
 * side of a blow, the shell raising its own and the blade cutting into
 * whatever it strikes. Meeting the counterpart is what answers either,
 * since the two multiply back toward nothing
 */
export function createFossilAbility(
  ability: Abilities,
  side: FossilSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const shell = side === 'shell';

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const holder = shell ? parent.target : parent.source;

      if (
        (event.stat !== Stats.Defense && event.stat !== Stats.SpecialDefense) ||
        event.unit !== parent.target ||
        !holder.hasAbility(ability)
      ) {
        return;
      }

      event.value *= shell ? FOSSIL_SHELL_SCALE : FOSSIL_BLADE_SCALE;
    }),
  );
}

/** What its own sky is worth to each of the two: a heal, or harder blows */
export const GROVE_HEAL_FRACTION = 1 / 16;
export const GROVE_DAMAGE_SCALE = 1.3;

/** Which way a grove line is paid by its sky */
export type GroveBoon = 'heals' | 'strikes';

/**
 * What Lotad and Seedot share: each calls up its own sky on taking the
 * field and lives off it, so whichever arrived last owns the weather
 * and the two cancel. The sky is set by casting the move that calls it,
 * the way Drought casts Sunny Day
 */
export function createGroveAbility(
  ability: Abilities,
  weather: Weathers,
  inWeather: (unit: Unit) => boolean,
  boon: GroveBoon,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    function paid(unit: Unit): boolean {
      return unit.alive && unit.hasAbility(ability) && inWeather(unit);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        // A primal sky is not something an ability argues with
        if (event.source.hasAbility(ability) && !isPrimalWeather(battle.weather.current)) {
          event.source.triggerAbility(ability);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability !== ability) {
          return;
        }

        const move = getWeatherMove(weather);

        if (move == null) {
          event.source.setWeather(weather);
          return;
        }

        event.source.triggerMove(move, { type: MoveTargetType.None }, 0);
      }),
      ...(boon === 'heals'
        ? onUnitActs(battle, (unit) => {
            if (!paid(unit)) {
              return;
            }

            unit.heal(
              { type: EffectType.Ability, ability, unit },
              unit,
              unit.checkStat(Stats.HP, 0) * GROVE_HEAL_FRACTION,
              0,
            );
          })
        : [
            battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
              if (paid(event.parent.source)) {
                event.value *= GROVE_DAMAGE_SCALE;
              }
            }),
          ]),
    ]);
  });
}

/** The stages a deceiver goes looking for, highest first */
const CLAIMED_STAGES = [
  Stages.Attack,
  Stages.SpecialAttack,
  Stages.Speed,
  Stages.Defense,
  Stages.SpecialDefense,
  Stages.Accuracy,
  Stages.Evasion,
];

/** Which half of the pair an ability is: the one that knocks off, or the one that keeps */
export type DeceiverSide = 'strips' | 'steals';

/** The raised stage standing highest on the unit, if it has one */
function highestRaised(unit: Unit): Stages | undefined {
  let found: Stages | undefined;
  let highest = 0;

  for (const stage of CLAIMED_STAGES) {
    const held = unit.stages[stage];

    if (held > highest) {
      found = stage;
      highest = held;
    }
  }

  return found;
}

/**
 * What Sableye and Mawile share: a landed move takes a raised stage off
 * whatever it hit. Sableye leaves it on the floor and Mawile keeps it,
 * which is the whole difference between the two
 */
export function createDeceiverAbility(
  ability: Abilities,
  side: DeceiverSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const steals = side === 'steals';

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;
      const target = event.target;

      if (
        !event.success ||
        !target.alive ||
        event.flags & MoveAttackFlags.Simulated ||
        !source.hasAbility(ability)
      ) {
        return;
      }

      const stage = highestRaised(target);

      // Explicit null check: the first Stages enum member is 0
      if (stage == null) {
        return;
      }

      const cause = { type: EffectType.Ability, ability, unit: source } as const;

      source.triggerAbility(ability);
      target.addStage(stage, -1, cause);

      if (steals) {
        source.addStage(stage, 1, cause);
      }
    }),
  );
}

/** Which stage answers each of the five battle stats */
export const STAT_STAGES: Partial<Record<Stats, Stages>> = {
  [Stats.Attack]: Stages.Attack,
  [Stats.Defense]: Stages.Defense,
  [Stats.SpecialAttack]: Stages.SpecialAttack,
  [Stats.SpecialDefense]: Stages.SpecialDefense,
  [Stats.Speed]: Stages.Speed,
};

/** How many times one cheerleader's shout counts in a battle */
export const CHEER_MAX_SHOUTS = 3;

/** Which of the two an ability is: the one that lifts, or the one that drags */
export type CheerSide = 'cheers' | 'jeers';

/**
 * What Plusle and Minun share: a shout each time they act, worked on
 * whichever stat the pokemon it is aimed at leans on most. Plusle picks
 * the ally that needs it and Minun the enemy standing best, so the two
 * work opposite ends of the same field
 */
export function createCheerAbility(
  ability: Abilities,
  side: CheerSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const cheers = side === 'cheers';

  return createAbility(ability, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);
    const stats = createStatExtremes();

    /** The ally furthest from full, or the enemy closest to it */
    function aimedAt(unit: Unit): Unit | undefined {
      let found: Unit | undefined;
      let best = cheers ? Number.POSITIVE_INFINITY : 0;

      for (const other of battle.units()) {
        // The cheer is for its own party; the jeer is for anybody
        // under a different banner
        const ours = cheers ? other.team === unit.team : other.team.alliance === unit.team.alliance;

        if (!other.alive || (cheers ? !ours || other === unit : ours)) {
          continue;
        }

        const share = other.health / other.checkStat(Stats.HP, 0);

        if (cheers ? share < best : share > best) {
          found = other;
          best = share;
        }
      }

      return found;
    }

    return new MergedLifecycle([
      ...onUnitActs(battle, (unit) => {
        const shouted = counter.get(unit);

        if (shouted >= CHEER_MAX_SHOUTS || !unit.hasAbility(ability) || stats.measuring()) {
          return;
        }

        const aimed = aimedAt(unit);

        if (!aimed) {
          return;
        }

        counter.set(unit, shouted + 1);
        unit.triggerAbility(ability);

        const stat = stats.extremes(aimed).highest;
        const stage = STAT_STAGES[stat];

        // Explicit null check: the first Stages enum member is 0
        if (stage != null) {
          aimed.addStage(stage, cheers ? 1 : -1, { type: EffectType.Ability, ability, unit });
        }
      }),
      ...lifecycles,
    ]);
  });
}

/** What the venom half puts on, and what the claws get out of it */
export const FEUD_SCALE = 1.4;

/** Which half of the feud an ability is */
export type FeudSide = 'deepens' | 'punishes';

/**
 * What Zangoose and Seviper share: the venom they have been fighting
 * over. Seviper works whatever poison is already in something down into
 * the worse kind, and a poisoned anything is what Zangoose tears into,
 * which is why the feud settles nothing: Zangoose cannot be poisoned in
 * the first place. Putting the poison on is Poison Touch's job, which
 * Seviper's own pool already carries
 */
export function createFeudAbility(
  ability: Abilities,
  side: FeudSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  if (side === 'deepens') {
    return createAbility(ability, (battle) =>
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.hasAbility(ability) ||
          !isPoisoned(target)
        ) {
          return;
        }

        const cause = { type: EffectType.Ability, ability, unit: source } as const;

        source.triggerAbility(ability);

        // The mild kind is taken off first: the two are different
        // statuses, so the worse one cannot simply be laid on top
        target.removeStatus(Statuses.Poisoned, cause);
        target.addStatus(Statuses.BadlyPoisoned, cause);
      }),
    );
  }

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const target = event.target;

      if (
        event.power == null ||
        target.type !== MoveTargetType.Unit ||
        !event.source.hasAbility(ability) ||
        !isPoisoned(target.unit)
      ) {
        return;
      }

      event.power *= FEUD_SCALE;
    }),
  );
}

/** What each meteorite's aura is worth while nothing blots it out */
export const ECLIPSE_RAISED_SCALE = 1.15;
export const ECLIPSE_LOWERED_SCALE = 0.85;

/** Which side of the field a meteorite's aura settles over */
export type EclipseSide = 'enemies' | 'allies';

/**
 * What Lunatone and Solrock share: an aura over one side of the field
 * that the other one standing anywhere blots out. Two stones in the sky
 * at once is an eclipse, and an eclipse is neither of them
 */
export function createEclipseAbility(
  ability: Abilities,
  counterpart: Abilities,
  side: EclipseSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  const enemies = side === 'enemies';

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      // The other stone standing anywhere is the eclipse
      if (fieldHolder(battle, counterpart)) {
        return;
      }

      const stone = fieldHolder(battle, ability);

      if (stone == null) {
        return;
      }

      const struck = event.parent.target;
      // The aura over its own side covers the party it flies with; the
      // one thrown at the far side covers everybody under another
      // banner
      const ours = enemies
        ? struck.team.alliance === stone.team.alliance
        : struck.team === stone.team;

      if (enemies !== ours) {
        event.value *= enemies ? ECLIPSE_RAISED_SCALE : ECLIPSE_LOWERED_SCALE;
      }
    }),
  );
}

/** How long the roots hold, what they take off, and what the claws get */
export const FOSSIL_HOLD_DURATION = 6000;
export const FOSSIL_HOLD_SCALE = 0.7;
export const FOSSIL_RUSH_SCALE = 1.3;

/** Which of Hoenn's two fossils an ability is */
export type FossilPairSide = 'anchors' | 'chases';

/**
 * What Lileep and Anorith share: whether a thing can get away. Lileep
 * pins whatever it touches down and slows it; Anorith is worth more
 * against anything that cannot keep up, which is exactly what Lileep
 * leaves behind
 */
export function createFossilPairAbility(
  ability: Abilities,
  side: FossilPairSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  if (side === 'chases') {
    return createAbility(ability, (battle) =>
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;
        const source = event.source;

        if (
          event.power == null ||
          target.type !== MoveTargetType.Unit ||
          !source.hasAbility(ability) ||
          target.unit.checkStat(Stats.Speed, 0) >= source.checkStat(Stats.Speed, 0)
        ) {
          return;
        }

        event.power *= FOSSIL_RUSH_SCALE;
      }),
    );
  }

  return createAbility(ability, (battle) => {
    const held = createTimedMarks(battle);

    return new MergedLifecycle([
      ...held.lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          event.target.alive &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          source.hasAbility(ability)
        ) {
          source.triggerAbility(ability);
          held.mark(event.target, FOSSIL_HOLD_DURATION);
        }
      }),
      battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
        if (event.success && held.has(event.source)) {
          event.success = false;
        }
      }),
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.stat === Stats.Speed && held.has(event.source)) {
          event.value *= FOSSIL_HOLD_SCALE;
        }
      }),
    ]);
  });
}

/** How long a golem stands sealed, and what a sealed one is worth both ways */
export const SEALED_DURATION = 8000;
export const SEALED_SCALE = 0.5;

/** What a woken golem is worth, and how far the waking lifts its own stat */
export const WOKEN_SCALE = 1.25;
export const WOKEN_STAGES = 2;

/**
 * What the three Regis share: each stands sealed for its first seconds
 * on the field, taking and dealing half, and then wakes for good, a
 * quarter harder and two stages up in the stat it was built around
 */
export function createSealedAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const { state, lifecycles } = createUnitState<number>(battle);

    function sealed(unit: Unit): boolean {
      return unit.hasAbility(ability) && (state.get(unit) ?? 0) < SEALED_DURATION;
    }

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const golem of getAbilityHolders(battle, ability)) {
          if (!golem.alive || !golem.hasAbility(ability)) {
            continue;
          }

          const stood = state.get(golem) ?? 0;

          if (stood >= SEALED_DURATION) {
            continue;
          }

          state.set(golem, stood + event.duration);

          // The seal breaks once, and what it lets out stays out
          if (stood + event.duration >= SEALED_DURATION) {
            golem.triggerAbility(ability);
            golem.addStage(stage, WOKEN_STAGES, {
              type: EffectType.Ability,
              ability,
              unit: golem,
            });
          }
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (parent.source.hasAbility(ability)) {
          event.value *= sealed(parent.source) ? SEALED_SCALE : WOKEN_SCALE;
        }

        if (sealed(parent.target)) {
          event.value *= SEALED_SCALE;
        }
      }),
    ]);
  });
}

/** What the sister's wing is worth, and what the brother's dive is */
export const EON_SHIELD_SCALE = 0.8;
export const EON_LANCE_SCALE = 1.25;

/** Undoes a screen's own reduction, the way Infiltrator does */
const EON_SCREEN_COMPENSATION = 4096 / 2732;

/** Which screen answers which half of a blow */
const EON_SCREENS: { [key in MoveCategories]?: TeamStatuses } = {
  [MoveCategories.Physical]: TeamStatuses.Reflect,
  [MoveCategories.Special]: TeamStatuses.LightScreen,
};

/** Which of the two an ability is: the one that guards or the one that pierces */
export type EonSide = 'shields' | 'pierces';

/**
 * What Latias and Latios share: one flies over its side and one flies
 * through whatever the far side put up. The sister's wing never covers
 * herself, and the brother's dive counts a screen for nothing
 */
export function createEonAbility(
  ability: Abilities,
  side: EonSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  if (side === 'shields') {
    return createAbility(ability, (battle) =>
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const target = event.parent.target;

        // The sister's wing never covers herself
        if (allyHolder(battle, target, ability)) {
          event.value *= EON_SHIELD_SCALE;
        }
      }),
    );
  }

  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (!parent.source.hasAbility(ability)) {
        return;
      }

      event.value *= EON_LANCE_SCALE;

      const screen = EON_SCREENS[parent.category];

      if (
        screen != null &&
        parent.target.team.status[screen] != null &&
        !(parent.flags & MoveAttackFlags.Confused)
      ) {
        event.value *= EON_SCREEN_COMPENSATION;
      }
    }),
  );
}

/** How far a titan wakes, what its own element is then worth, and when */
export const PRIMAL_STAGES = 2;
export const PRIMAL_SCALE = 1.3;
export const PRIMAL_THRESHOLD = 1 / 2;

/**
 * What the three superancient pokemon share: each is holding back until
 * the fight turns. The first time one drops below half it wakes for
 * good, two stages up in the stat it fights with and a third harder
 * with the element it was made to move
 */
export function createPrimalAbility(
  ability: Abilities,
  stage: Stages,
  type: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const woken = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        woken.delete(event.source);
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          woken.has(target) ||
          !target.hasAbility(ability) ||
          target.health >= target.checkStat(Stats.HP, 0) * PRIMAL_THRESHOLD
        ) {
          return;
        }

        woken.add(target);
        target.triggerAbility(ability);
        target.addStage(stage, PRIMAL_STAGES, { type: EffectType.Ability, ability, unit: target });
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (woken.has(parent.source) && parent.type === type) {
          event.value *= PRIMAL_SCALE;
        }
      }),
    ]);
  });
}
