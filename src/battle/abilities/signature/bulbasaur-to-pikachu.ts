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
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MULTI_HIT_MOVES } from '../../moves/multi-hit';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createDamageTaken, createFieldAbility, createUnitState, isPhysicalMove } from './__create';

/**
 * Whether the second needle applies: a physical move that strikes
 * once on its own. A move that already lands several blows keeps its
 * own count
 */
function isTwinStingerMove(move: Moves): boolean {
  return isPhysicalMove(move) && MULTI_HIT_MOVES[move] == null;
}

/** What each of the two needles is worth on its own */
export const TWIN_STINGER_POWER_SCALE = 0.6;

/** What the draught takes off the wind-ups on its own side */
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
  // The Kanto starters: each tilts the field toward its own type and
  // away from the one that type beats, its own side standing in it too
  createFieldAbility(Abilities.VerdantField, Types.Grass, Types.Water),
  createFieldAbility(Abilities.EmberField, Types.Fire, Types.Grass),
  createFieldAbility(Abilities.DelugeField, Types.Water, Types.Fire),

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
  createAbility(Abilities.Slipstream, (battle) => {
    /** Whether a bird is beating up a draught on this unit's side */
    function drafting(unit: Unit): boolean {
      for (const bird of battle.units()) {
        if (
          bird.alive &&
          bird.team.alliance === unit.team.alliance &&
          bird.hasAbility(Abilities.Slipstream)
        ) {
          return true;
        }
      }

      return false;
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (drafting(event.source)) {
          event.duration *= SLIPSTREAM_SCALE;
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, (event) => {
        if (drafting(event.source)) {
          event.duration *= SLIPSTREAM_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Slipstream)) {
          event.source.triggerAbility(Abilities.Slipstream);
        }
      }),
    ]);
  }),

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
