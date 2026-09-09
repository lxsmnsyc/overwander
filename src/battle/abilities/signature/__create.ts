import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import type { Stages } from '../../../data/constants/stats';
import { Stats } from '../../../data/constants/stats';
import type Abilities from '../../../data/ids/abilities';
import type { Types } from '../../../data/constants/types';
import { DamageFlags, MoveAttackFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import { Statuses } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType, type UnitDamageEvent } from '../../events';
import { type Lifecycle, MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility } from '../__create';

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
 * Whether anybody still standing carries the ability, wherever they
 * stand. It is what a field-wide signature reads: the effect belongs
 * to the fight rather than to a side
 */
export function fieldHasAbility(battle: Battle, ability: Abilities): boolean {
  for (const unit of battle.units()) {
    if (unit.alive && unit.hasAbility(ability)) {
      return true;
    }
  }

  return false;
}

/**
 * The standing holder on the other side of the fight from this unit,
 * for an effect a holder works on its enemies
 */
/** A standing holder of this ability anywhere on the field */
export function fieldHolder(battle: Battle, ability: Abilities): Unit | undefined {
  for (const unit of battle.units()) {
    if (unit.alive && unit.hasAbility(ability)) {
      return unit;
    }
  }

  return undefined;
}

export function enemyHolder(battle: Battle, unit: Unit, ability: Abilities): Unit | undefined {
  for (const other of battle.units(unit.team.alliance)) {
    if (other.alive && other.hasAbility(ability)) {
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

/** Whether this is a physical move the pokemon actually chose */
export function isPhysicalMove(move: Moves): boolean {
  return !PSEUDO_MOVES.has(move) && getMoveData(move).category === MoveCategories.Physical;
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
