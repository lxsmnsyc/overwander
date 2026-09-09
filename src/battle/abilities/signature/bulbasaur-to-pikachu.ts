import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  MoveTargets,
  type Moves,
  affectsFoesOnly,
} from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type Battle from '../../core';
import {
  BattleEvents,
  type CheckUnitMoveTimeEvent,
  EffectType,
  MoveTargetType,
} from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MULTI_HIT_MOVES } from '../../moves/multi-hit';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import {
  createDamageTaken,
  createUnitCounter,
  createUnitState,
  fieldHasAbility,
  isPhysicalMove,
} from './__create';

/**
 * Whether the second needle applies: a physical move that strikes
 * once on its own. A move that already lands several blows keeps its
 * own count
 */
function isTwinStingerMove(move: Moves): boolean {
  return isPhysicalMove(move) && MULTI_HIT_MOVES[move] == null;
}

/** What share of a blow the bulb keeps hold of */
export const SEED_CACHE_BANK_FRACTION = 1 / 4;

/** How far the bank can fill, as a share of the holder's max HP */
export const SEED_CACHE_CAP_FRACTION = 1 / 2;

/** What one landed Fire move takes off the wind-up */
export const AFTERBURN_STEP = 0.15;

/** How many of them the flame holds */
export const AFTERBURN_MAX_STACKS = 3;

/** What the pressure behind a shot is worth */
export const OVERPRESSURE_POWER_SCALE = 1.3;

/** What one shot leaves behind on the cannons */
export const OVERPRESSURE_COOLDOWN_STEP = 0.2;

/** How far the fouling builds */
export const OVERPRESSURE_MAX_STACKS = 3;

/** What each of the two needles is worth on its own */
export const TWIN_STINGER_POWER_SCALE = 0.6;

/** What the draught takes off every wind-up on the field */
export const SLIPSTREAM_SCALE = 0.8;

/** What a bite takes off the target, over and above the blow */
export const NIBBLE_FRACTION = 1 / 32;

/** What one blow on the same target as the last is worth */
export const RELENTLESS_STEP = 0.1;

/** How far it presses one target before it can press no harder */
export const RELENTLESS_MAX_STACKS = 4;

/** How often the coils tighten, and what they take when they do */
export const SQUEEZE_INTERVAL = 1000;
export const SQUEEZE_FRACTION = 1 / 16;

/** What the arc carries to the next enemy along */
export const CHAIN_LIGHTNING_FRACTION = 1 / 3;

/**
 * Who the arc jumps to: the next enemy still standing that is not the
 * one already struck
 */
function nextAlongTheArc(battle: Battle, source: Unit, struck: Unit): Unit | undefined {
  for (const unit of battle.units(source.team.alliance)) {
    if (unit !== struck && unit.alive) {
      return unit;
    }
  }

  return undefined;
}

const bulbasaurToPikachu = [
  // Bulbasaur: the seed on its back grows on what it is fed, so
  // punching it is what loads the shot it fires back
  createAbility(Abilities.SeedCache, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);
    const damage = createDamageTaken(battle);

    return new MergedLifecycle([
      ...damage.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const taken = damage.taken(event);

        if (!event.success || taken == null || !event.target.hasAbility(Abilities.SeedCache)) {
          return;
        }

        const target = event.target;
        const cap = target.checkStat(Stats.HP, 0) * SEED_CACHE_CAP_FRACTION;

        counter.set(target, Math.min(cap, counter.get(target) + taken * SEED_CACHE_BANK_FRACTION));
      }),
      // The bank rides on the blow itself rather than on the move's
      // power, so a resisted Grass move still delivers all of it
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;
        const source = parent.source;

        if (
          parent.type !== Types.Grass ||
          parent.category === MoveCategories.Status ||
          !source.hasAbility(Abilities.SeedCache)
        ) {
          return;
        }

        const bank = counter.get(source);

        if (bank <= 0) {
          return;
        }

        event.value += bank;

        // The AI weighs a move by running this same resolver, so a
        // bank it is only thinking about must survive the thought
        if (!(parent.flags & MoveAttackFlags.Simulated)) {
          counter.clear(source);
          source.triggerAbility(Abilities.SeedCache);
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Charmander: the tail flame feeds on its own fire, so a chain of
  // hits winds the line up and a single whiff blows it out
  createAbility(Abilities.Afterburn, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    function discount(event: CheckUnitMoveTimeEvent): void {
      const held = counter.get(event.source);

      if (held > 0 && event.source.hasAbility(Abilities.Afterburn)) {
        event.duration *= 1 - AFTERBURN_STEP * held;
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const parent = event.parent;
        const source = parent.source;

        if (!source.hasAbility(Abilities.Afterburn)) {
          return;
        }

        const fire = source.checkMoveType(parent.move, parent.target) === Types.Fire;

        if (!event.hit || !fire) {
          counter.clear(source);
          return;
        }

        counter.set(source, Math.min(AFTERBURN_MAX_STACKS, counter.get(source) + 1));
        source.triggerAbility(Abilities.Afterburn);
      }),
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, discount),
      battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, discount),
      ...lifecycles,
    ]);
  }),

  // Squirtle: the shell cannons are worth more the harder they are
  // driven, and they foul as they go
  createAbility(Abilities.Overpressure, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          event.source.hasAbility(Abilities.Overpressure) &&
          event.source.checkMoveType(event.move, event.target) === Types.Water
        ) {
          event.power *= OVERPRESSURE_POWER_SCALE;
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveCooldown, EventPriority.Post, (event) => {
        const held = counter.get(event.source);

        if (held > 0 && event.source.hasAbility(Abilities.Overpressure)) {
          event.duration *= 1 + OVERPRESSURE_COOLDOWN_STEP * held;
        }
      }),
      // Only a shot that lands fouls the cannons; anything else it
      // reaches for vents them
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const parent = event.parent;
        const source = parent.source;

        if (!source.hasAbility(Abilities.Overpressure)) {
          return;
        }

        if (source.checkMoveType(parent.move, parent.target) !== Types.Water) {
          counter.clear(source);
          return;
        }

        if (event.hit) {
          counter.set(source, Math.min(OVERPRESSURE_MAX_STACKS, counter.get(source) + 1));
          source.triggerAbility(Abilities.Overpressure);
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Caterpie: dust drifts, so what it aims at one enemy settles over
  // the whole far side. The same widening a Boss gets
  createAbility(Abilities.PowderBurst, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Post, (event) => {
      if (
        event.target === MoveTargets.Unit &&
        affectsFoesOnly(event.affects) &&
        getMoveData(event.move).category === MoveCategories.Status &&
        event.source.hasAbility(Abilities.PowderBurst)
      ) {
        event.target = MoveTargets.None;
      }
    }),
  ),

  // Weedle: two needles rather than one, so everything a landed blow
  // sets off is set off twice. Moves that already strike several
  // times are left alone
  createAbility(Abilities.TwinStinger, (battle) => {
    // The second needle must not grow a third
    const striking = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          isTwinStingerMove(event.move) &&
          event.source.hasAbility(Abilities.TwinStinger)
        ) {
          event.power *= TWIN_STINGER_POWER_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          !event.target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          striking.has(source) ||
          !isTwinStingerMove(event.move) ||
          !source.hasAbility(Abilities.TwinStinger)
        ) {
          return;
        }

        striking.add(source);
        source.triggerAbility(Abilities.TwinStinger);
        source.attack(
          event.target,
          event.move,
          event.value,
          event.type,
          event.category,
          event.flags,
        );
        striking.delete(source);
      }),
    ]);
  }),

  // Pidgey: the draught it beats up carries everybody along, its
  // enemies included, so it is a bet on being the fastest thing in it
  createAbility(
    Abilities.Slipstream,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          if (fieldHasAbility(battle, Abilities.Slipstream)) {
            event.duration *= SLIPSTREAM_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.Slipstream)) {
            event.source.triggerAbility(Abilities.Slipstream);
          }
        }),
      ]),
  ),

  // Rattata: the teeth do their own work whatever the blow was worth,
  // so armour is no answer to it
  createAbility(Abilities.Nibble, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      if (
        event.success &&
        event.category !== MoveCategories.Status &&
        !(event.flags & MoveAttackFlags.Simulated) &&
        event.source.hasAbility(Abilities.Nibble)
      ) {
        event.source.triggerAbility(Abilities.Nibble);

        event.source.damage(
          { type: EffectType.Ability, ability: Abilities.Nibble, unit: event.source },
          event.target,
          event.target.checkStat(Stats.HP, 0) * NIBBLE_FRACTION,
          DamageFlags.Indirect,
        );
      }
    }),
  ),
  // Spearow: it picks one thing and does not let go, so a fight it
  // keeps on one target is worth more than a fight it spreads
  createAbility(Abilities.Relentless, (battle) => {
    const { state, lifecycles } = createUnitState<{ target: Unit; stacks: number }>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const held = state.get(event.source);

        if (
          event.power != null &&
          held != null &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit === held.target &&
          event.source.hasAbility(Abilities.Relentless)
        ) {
          event.power *= 1 + RELENTLESS_STEP * held.stacks;
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.hasAbility(Abilities.Relentless)
        ) {
          return;
        }

        const held = state.get(source);

        if (held?.target === event.target) {
          held.stacks = Math.min(RELENTLESS_MAX_STACKS, held.stacks + 1);
        } else {
          state.set(source, { target: event.target, stacks: 1 });
        }

        source.triggerAbility(Abilities.Relentless);
      }),
      ...lifecycles,
    ]);
  }),

  // Ekans: the coils tighten while it is busy with something else, so
  // the last thing it got hold of pays for every wind-up
  createAbility(Abilities.Squeeze, (battle) => {
    const { state, lifecycles } = createUnitState<Unit>(battle);

    let waited = 0;

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      waited += event.duration;

      if (waited < SQUEEZE_INTERVAL) {
        return;
      }

      waited = 0;

      for (const [snake, caught] of state) {
        if (!snake.alive || !caught.alive || (snake.casting == null && snake.channeling == null)) {
          continue;
        }

        snake.triggerAbility(Abilities.Squeeze);

        snake.damage(
          { type: EffectType.Ability, ability: Abilities.Squeeze, unit: snake },
          caught,
          caught.checkStat(Stats.HP, 0) * SQUEEZE_FRACTION,
          DamageFlags.Indirect,
        );
      }
    });

    return new MergedLifecycle([
      clock,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          event.target.alive &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          source.hasAbility(Abilities.Squeeze) &&
          source.checkMoveContact(event.move, unitTarget(event.target))
        ) {
          state.set(source, event.target);
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Pikachu: the charge does not stop at what it was aimed at. The arc
  // is indirect, so it neither crits nor carries the move's rider
  createAbility(Abilities.ChainLightning, (battle) => {
    const damage = createDamageTaken(battle);

    return new MergedLifecycle([
      ...damage.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const taken = damage.taken(event);
        const cause = event.cause;
        const source = event.source;

        if (
          !event.success ||
          taken == null ||
          taken <= 0 ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          !source.hasAbility(Abilities.ChainLightning) ||
          source.checkMoveType(cause.move, unitTarget(event.target)) !== Types.Electric
        ) {
          return;
        }

        const next = nextAlongTheArc(battle, source, event.target);

        if (!next) {
          return;
        }

        source.triggerAbility(Abilities.ChainLightning);

        source.damage(
          { type: EffectType.Ability, ability: Abilities.ChainLightning, unit: source },
          next,
          taken * CHAIN_LIGHTNING_FRACTION,
          DamageFlags.Indirect,
        );
      }),
    ]);
  }),
];

export default bulbasaurToPikachu;
