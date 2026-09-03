import { AttackPriority, EventPriority } from '../../core/event-emitter';
import type { EventListenerLifecycle } from '../../core/event-emitter';
import { MAX_STAGE, Stages, Stats } from '../../data/constants/stats';
import { MoveCategories, type MoveFlags, StatFlags } from '../../data/ids/moves';
import { getMoveData, getWeatherMove } from '../../data/moves';
import type { Types } from '../../data/constants/types';
import type Abilities from '../../data/ids/abilities';
import type { Statuses, Weathers } from '../../data/ids/status';
import { FEED_BONUS, RISKY_PENALTY, healWorth } from '../ai/score';
import type Battle from '../core';
import type {
  CheckUnitAIMoveScoreEvent,
  CheckUnitCanDamageEvent,
  UnitAttackEvent,
} from '../events';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { type Lifecycle, MergedLifecycle } from '../lifecycle';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import { isPrimalWeather } from '../utils';
import type Unit from '../unit';

export function createAbility(ability: Abilities, setup: (battle: Battle) => Lifecycle) {
  return (battle: Battle): void => {
    const lifecycle = setup(battle);

    const units = new Set<Unit>();

    function enableAbility(current: Abilities, source: Unit): void {
      if (current === ability) {
        units.add(source);

        if (units.size === 1) {
          lifecycle.start();
        }
      }
    }

    function disableAbility(current: Abilities, source: Unit): void {
      if (ability === current) {
        units.delete(source);

        if (units.size === 0) {
          lifecycle.stop();
        }
      }
    }

    battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
      disableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitEnableAbility, EventPriority.Post, (event) => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitDisableAbility, EventPriority.Post, (event) => {
      disableAbility(event.ability, event.source);
    });
  };
}

/**
 * The AI half of an ability that punishes whoever touches its holder
 * — Static, Flame Body, Poison Point, Effect Spore, Cute Charm.
 *
 * It is only the *warning*: what the ability actually does to the
 * attacker stays where it is written, since each of the five does
 * something different with a different chance. This is the one thing
 * they share, and it is a thing the AI cannot work out for itself —
 * the effect fires on a damage event that the speculative pass never
 * emits, so without being told, a pokemon punches a Static Pikachu
 * exactly as readily as it punches anything else.
 *
 * A warning rather than a refusal: the move still lands, so it loses
 * to an equally good one that costs nothing and beats standing about
 */
export function createContactHazard(
  battle: Battle,
  targetAbility: Abilities,
): EventListenerLifecycle<CheckUnitAIMoveScoreEvent> {
  return battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.target.type === MoveTargetType.Unit &&
      event.target.unit !== event.source &&
      event.source.checkMoveContact(event.move, event.target) &&
      event.target.unit.hasAbility(targetAbility)
    ) {
      event.score -= RISKY_PENALTY;
    }
  });
}

/**
 * What feeding this ability is worth to the side that holds it.
 *
 * A teammate may aim a move of the absorbed type at the holder, and
 * the hit lands as whatever the ability pays out instead of as
 * damage. Nothing else can work that out: the payout rides a failed
 * move, which the chooser's speculative pass never emits, so without
 * being told the AI treats the feed as a hit that does nothing.
 *
 * The gain is the ability's own, so a healer weighs the health it
 * would restore and a stage-raiser what the stage is worth
 */
export function createFeedScoring(
  battle: Battle,
  targetAbility: Abilities,
  targetType: Types,
  worth: (holder: Unit) => number,
): EventListenerLifecycle<CheckUnitAIMoveScoreEvent> {
  return battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.target.type !== MoveTargetType.Unit ||
      event.target.unit === event.source ||
      event.target.unit.team.alliance !== event.source.team.alliance ||
      getMoveData(event.move).category === MoveCategories.Status ||
      !event.target.unit.hasAbility(targetAbility) ||
      event.source.checkMoveType(event.move, event.target) !== targetType
    ) {
      return;
    }

    event.score += worth(event.target.unit);
  });
}

/**
 * Feeding an ability that answers with a heal, weighed by the hole it
 * would fill
 */
export function createHealFeedScoring(
  battle: Battle,
  targetAbility: Abilities,
  targetType: Types,
  fraction: number,
): EventListenerLifecycle<CheckUnitAIMoveScoreEvent> {
  return createFeedScoring(battle, targetAbility, targetType, (holder) =>
    healWorth(holder, fraction),
  );
}

/**
 * Feeding an ability that answers with a stage, which is worth
 * nothing once that stage is as high as it goes
 */
export function createStageFeedScoring(
  battle: Battle,
  targetAbility: Abilities,
  targetType: Types,
  stage: Stages,
): EventListenerLifecycle<CheckUnitAIMoveScoreEvent> {
  return createFeedScoring(battle, targetAbility, targetType, (holder) =>
    holder.stages[stage] >= MAX_STAGE ? 0 : FEED_BONUS,
  );
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
 * Meta ability for status-immunity abilities (Limber, Vital Spirit,
 * Insomnia, Water Veil, Immunity): the statuses cannot land, a cue
 * fires on blocked applications, and gaining the ability cures any
 * blocked status already present
 * https://bulbapedia.bulbagarden.net/wiki/Limber_(Ability)
 */
export function createLimberAbility(
  targetAbility: Abilities,
  statuses: Statuses[],
): (battle: Battle) => void {
  const blocked = new Set(statuses);

  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        // Pure query: the statuses cannot land
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            blocked.has(event.status) &&
            event.source.hasAbility(targetAbility)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (blocked.has(event.status) && event.source.hasAbility(targetAbility)) {
            event.source.triggerAbility(targetAbility);
          }
        }),
        // Gaining the ability also cures a blocked status already
        // present (modern mechanics)
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          if (event.ability === targetAbility) {
            for (const status of blocked) {
              if (event.source.status[status] != null) {
                event.source.removeStatus(status, {
                  type: EffectType.Ability,
                  ability: targetAbility,
                  unit: event.source,
                });
              }
            }
          }
        }),
      ]),
  );
}

/**
 * Meta ability for Keen Eye and Illuminate (modern mechanics): other
 * units cannot lower the holder's accuracy, and the holder's own
 * attacks ignore the target's evasion stages
 * https://bulbapedia.bulbagarden.net/wiki/Keen_Eye_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Illuminate_(Ability)
 */
function accuracyStageFactor(stage: number): number {
  const clamped = Math.max(-6, Math.min(stage, 6));
  return clamped < 0 ? 3 / (3 - clamped) : (3 + clamped) / 3;
}

export function createKeenEyeAbility(targetAbility: Abilities): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.stage === Stages.Accuracy &&
            event.value < 0 &&
            event.source.hasAbility(targetAbility) &&
            event.cause.type !== EffectType.None &&
            event.cause.unit !== event.source
          ) {
            event.success = false;

            // For visual cues
            event.source.triggerAbility(targetAbility);
          }
        }),
        // The holder's attacks ignore the target's evasion stages:
        // compensate the stage factor the shared resolver applied
        battle.on(BattleEvents.UnitTriggerMoveResolveAccuracy, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.accuracy != null &&
            parent.target.type === MoveTargetType.Unit &&
            parent.source.hasAbility(targetAbility)
          ) {
            const accuracy = parent.source.checkStage(Stages.Accuracy, StatFlags.Attack);
            const evasion = parent.target.unit.checkStage(Stages.Evasion, StatFlags.Attack);

            if (evasion !== 0) {
              event.accuracy *=
                accuracyStageFactor(accuracy) / accuracyStageFactor(accuracy - evasion);
            }
          }
        }),
      ]),
  );
}

/**
 * Meta ability for Shell Armor and Battle Armor: critical hits never
 * land on the holder
 * https://bulbapedia.bulbagarden.net/wiki/Shell_Armor_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Battle_Armor_(Ability)
 */
export function createShellArmorAbility(targetAbility: Abilities): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
      if (event.critical && event.parent.target.hasAbility(targetAbility)) {
        event.critical = false;
      }
    }),
  );
}

/**
 * Meta ability for Drizzle, Drought, Sand Stream and Snow Warning
 * https://bulbapedia.bulbagarden.net/wiki/Drizzle_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Drought_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Sand_Stream_(Ability)
 */
export function createDrizzleAbility(
  targetAbility: Abilities,
  targetWeather: Weathers,
): (battle: Battle) => void {
  function triggerWeather(battle: Battle, source: Unit): void {
    // A primal sky is not something an ability argues with
    if (source.hasAbility(targetAbility) && !isPrimalWeather(battle.weather.current)) {
      source.triggerAbility(targetAbility);
    }
  }
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        // For when the unit transforms
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          triggerWeather(battle, event.source);
        }),
        // For when the unit re-enters
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          triggerWeather(battle, event.source);
        }),
        /**
         * The weather change rides the trigger, and the trigger casts
         * the move that calls up that sky rather than setting it
         * itself: a Drought is a Sunny Day nobody had to learn.
         *
         * That way there is one weather-changing path rather than
         * two. Everything the move goes through on its way — the
         * scope resolving through the unit, whatever an item or an
         * ability has to say about weather landing — happens for the
         * ability as well, without either side having to remember
         * that the other exists
         */
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== targetAbility) {
            return;
          }

          const move = getWeatherMove(targetWeather);

          if (move == null) {
            // No move calls up this sky, so there is nothing to cast
            // and the ability sets it directly
            event.source.setWeather(targetWeather);
            return;
          }

          event.source.triggerMove(move, { type: MoveTargetType.None }, 0);
        }),
      ]),
  );
}

/**
 * Vetoes the residual weather chip damage carried by the given weather
 * cause (see mechanics/weather.ts)
 */
export function chipImmunity(
  battle: Battle,
  ability: Abilities,
  weather: Weathers,
): EventListenerLifecycle<CheckUnitCanDamageEvent> {
  return battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.cause.type === EffectType.Weather &&
      event.cause.weather === weather &&
      event.target.hasAbility(ability)
    ) {
      event.success = false;
    }
  });
}

/**
 * Meta ability for the weather sprinters (Sand Rush, Slush Rush):
 * double Speed while their sky is up. `chipWeather` is the sky they
 * are also built to stand in, which Slush Rush is not
 * https://bulbapedia.bulbagarden.net/wiki/Sand_Rush_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Slush_Rush_(Ability)
 */
export function createSandRushAbility(
  targetAbility: Abilities,
  inWeather: (unit: Unit) => boolean,
  chipWeather?: Weathers,
): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (
            event.stat === Stats.Speed &&
            event.source.hasAbility(targetAbility) &&
            inWeather(event.source)
          ) {
            event.value *= 2;
          }
        }),
        ...(chipWeather == null ? [] : [chipImmunity(battle, targetAbility, chipWeather)]),
      ]),
  );
}

/**
 * Meta ability for the super-effective softeners (Filter, Solid Rock):
 * a quarter off whatever lands super effective.
 *
 * The effectiveness arrives one type at a time, so the multipliers are
 * gathered per attack and the reduction is paid once, on the damage
 */
export function createFilterAbility(targetAbility: Abilities): (battle: Battle) => void {
  const FACTOR = 0.75;

  return createAbility(targetAbility, (battle) => {
    const totals = new WeakMap<UnitAttackEvent, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        if (event.parent.target.hasAbility(targetAbility)) {
          totals.set(event.parent, (totals.get(event.parent) ?? 1) * event.multiplier);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const total = totals.get(event.parent);

        if (total != null && total > 1) {
          event.value *= FACTOR;
        }
      }),
    ]);
  });
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
