import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import type { Types } from '../../../data/constants/types';
import type { MoveFlags } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import Abilities from '../../../data/ids/abilities';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { createAbility } from './create';
import { createHealFeedScoring } from './scoring';

/** Abilities that change what a blow is worth, or what its holder weighs */
/**
 * An ability that only changes what its holder weighs: Light Metal
 * halves it and Heavy Metal doubles it, which the weight-driven moves
 * then read (a Low Kick lands harder on the heavier one)
 */
export function createWeightAbility(ability: Abilities, scale: number): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitWeight, EventPriority.Post, (event) => {
      if (event.source.hasAbility(ability)) {
        event.weight *= scale;
      }
    }),
  );
}

const HUGE_POWER_SCALE = 2;

/**
 * An ability that simply doubles its holder's Attack: Huge Power and
 * Pure Power, which are one effect printed under two names
 */
export function createHugePowerAbility(ability: Abilities): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat === Stats.Attack && event.source.hasAbility(ability)) {
        event.value *= HUGE_POWER_SCALE;
      }
    }),
  );
}

const POLARITY_BOOST = 1.5;

/**
 * Plus and Minus, which answer each other rather than themselves: a
 * holder's Special Attack rises while anybody on its side carries
 * either of the two. The mainline pairs them that way from Gen 5 on,
 * and a pair that only answered its own name would leave a lone
 * Manectric beside a lone Plusle doing nothing
 */
export function createPolarityAbility(ability: Abilities): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat !== Stats.SpecialAttack || !event.source.hasAbility(ability)) {
        return;
      }

      for (const ally of event.source.team.units) {
        if (ally !== event.source && ally.alive && hasPolarity(ally)) {
          event.value *= POLARITY_BOOST;
          return;
        }
      }
    }),
  );
}

function hasPolarity(unit: Unit): boolean {
  return unit.hasAbility(Abilities.Plus) || unit.hasAbility(Abilities.Minus);
}

/**
 * This is a meta ability for Blaze, Overgrow, Swarm and Torrent
 * https://bulbapedia.bulbagarden.net/wiki/Overgrow_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Blaze_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Torrent_(Ability)
 */
export function createBlazeAbility(
  targetAbility: Abilities,
  targetType: Types,
): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const source = event.parent.source;
      const type = event.parent.type;
      if (
        type === targetType &&
        event.unit === source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        source.hasAbility(targetAbility)
      ) {
        const currentHP = source.health;
        const maxHP = source.checkStat(Stats.HP, 0);

        if (currentHP <= maxHP / 3) {
          event.value *= 1.5;
        }
      }
    }),
  );
}

/**
 * Meta ability for weather status guards (Hydration, Leaf Guard):
 * the holder cannot receive major status conditions while its
 * weather is up
 * https://bulbapedia.bulbagarden.net/wiki/Hydration_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Leaf_Guard_(Ability)
 */
export function createHydrationAbility(
  targetAbility: Abilities,
  inWeather: (unit: Unit) => boolean,
): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        // Pure query: no major status conditions in the weather
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            MAJOR_STATUS_CONDITIONS.has(event.status) &&
            inWeather(event.source) &&
            event.source.hasAbility(targetAbility)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (
            MAJOR_STATUS_CONDITIONS.has(event.status) &&
            inWeather(event.source) &&
            event.source.hasAbility(targetAbility)
          ) {
            event.source.triggerAbility(targetAbility);
          }
        }),
      ]),
  );
}

/**
 * Meta ability for type-absorbing healers (Water Absorb, Volt
 * Absorb): the holder is immune to the type and heals a quarter of
 * its max health when a real move of it fails against it
 * https://bulbapedia.bulbagarden.net/wiki/Water_Absorb_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Volt_Absorb_(Ability)
 */
export const ABSORB_HEAL_FRACTION = 1 / 4;

export function createWaterAbsorbAbility(
  targetAbility: Abilities,
  targetType: Types,
): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        // Pure query: grants the type immunity
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === targetType &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(targetAbility)
          ) {
            event.immune = true;
          }
        }),
        // Detection: a real move of the type fails against the holder
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(targetAbility) &&
            parent.source.checkMoveType(parent.move, parent.target) === targetType
          ) {
            parent.target.unit.triggerAbility(targetAbility);
          }
        }),
        createHealFeedScoring(battle, targetAbility, targetType, ABSORB_HEAL_FRACTION),
        // Effect: the quarter-max-health heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === targetAbility) {
            event.source.heal(
              {
                type: EffectType.Ability,
                ability: targetAbility,
                unit: event.source,
              },
              event.source,
              event.source.checkStat(Stats.HP, 0) / 4,
              0,
            );
          }
        }),
      ]),
  );
}

/**
 * Meta ability for the move-flag power boosters (Tough Claws, Strong
 * Jaw, Sharpness): moves carrying the flag hit harder
 * https://bulbapedia.bulbagarden.net/wiki/Tough_Claws_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Strong_Jaw_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Sharpness_(Ability)
 */
export function createToughClawsAbility(
  targetAbility: Abilities,
  flag: MoveFlags,
  factor: number,
): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(targetAbility) &&
        getMoveData(event.move).flags & flag
      ) {
        event.power *= factor;
      }
    }),
  );
}
