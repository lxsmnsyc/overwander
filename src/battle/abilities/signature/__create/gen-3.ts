import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import { Stages, Stats } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import type { Types } from '../../../../data/constants/types';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../../../data/ids/moves';
import { getWeatherMove } from '../../../../data/moves';
import { Statuses, TeamStatuses, type Weathers } from '../../../../data/ids/status';
import type Battle from '../../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../../events';
import { type Lifecycle, MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { isPrimalWeather, onUnitActs, slipsTraps } from '../../../utils';
import { createAbility, getAbilityHolders } from '../../__create';
import { STAT_STAGES, createStatExtremes } from '../../__create/stats';
import {
  allyHolder,
  createTimedMarks,
  createUnitCounter,
  createUnitState,
  fieldHolder,
  isPoisoned,
} from './helpers';

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
        if (event.success && held.has(event.source) && !slipsTraps(event.source)) {
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
 * What the golems share: each stands sealed for its first seconds
 * on the field, taking and dealing half, and then wakes for good, a
 * quarter harder and two stages up in the stat it was built around.
 *
 * The one that made the other three deals its own `sealedScale`, since
 * Slow Start is already taking that half off it and a second helping
 * would be two penalties for one seal
 */
export function createSealedAbility(
  ability: Abilities,
  stage: Stages,
  sealedScale = SEALED_SCALE,
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
          event.value *= sealed(parent.source) ? sealedScale : WOKEN_SCALE;
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
