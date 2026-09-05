import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../../data/ids/moves';
import { Statuses, Weathers } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import { RISKY_PENALTY } from '../../ai/score';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { ABSORB_MOVES } from '../../moves/absorb';
import { SELF_DESTRUCT_MOVES } from '../../moves/self-destruct';
import { STATUS_MOVES } from '../../moves/status';
import type Unit from '../../unit';
import {
  hasFreeItemSlot,
  isWeatherRainy,
  isWeatherSandstorm,
  isWeatherSunny,
  onUnitActs,
} from '../../utils';
import {
  ABSORB_HEAL_FRACTION,
  chipImmunity,
  createAbility,
  createClearBodyAbility,
  createCloudNineAbility,
  createHealFeedScoring,
  createLimberAbility,
  createWaterAbsorbAbility,
} from '../__create';
import { MergedLifecycle } from '../../lifecycle';

/**
 * Paras to Tentacool: the spore carriers, the sleepers and what a
 * body does to whoever hits it
 */
const parasToTentacool = [
  // Paras
  // https://bulbapedia.bulbagarden.net/wiki/Dry_Skin_(Ability)
  createAbility(
    Abilities.DrySkin,
    (battle) =>
      new MergedLifecycle([
        // Pure query: grants the Water immunity
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === Types.Water &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.DrySkin)
          ) {
            event.immune = true;
          }
        }),
        createHealFeedScoring(battle, Abilities.DrySkin, Types.Water, ABSORB_HEAL_FRACTION),
        // Absorbing a real Water move heals a quarter of max health
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.DrySkin) &&
            parent.source.checkMoveType(parent.move, parent.target) === Types.Water
          ) {
            const holder = parent.target.unit;

            holder.triggerAbility(Abilities.DrySkin);

            holder.heal(
              { type: EffectType.Ability, ability: Abilities.DrySkin, unit: holder },
              holder,
              holder.checkStat(Stats.HP, 0) * ABSORB_HEAL_FRACTION,
              0,
            );
          }
        }),
        // The dry skin burns: Fire damage hits harder
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          if (
            event.parent.type === Types.Fire &&
            event.parent.target.hasAbility(Abilities.DrySkin) &&
            !(event.parent.flags & MoveAttackFlags.Pure) &&
            !(event.parent.flags & MoveAttackFlags.Confused)
          ) {
            event.value *= 1.25;
          }
        }),
        // Soaks up rain, dries out in the sun — paid as the holder
        // reaches for a move, like Rain Dish and Solar Power
        ...onUnitActs(battle, (unit) => {
          if (!unit.hasAbility(Abilities.DrySkin)) {
            return;
          }

          const maxHP = unit.checkStat(Stats.HP, 0);

          if (isWeatherRainy(unit)) {
            unit.heal(
              { type: EffectType.Ability, ability: Abilities.DrySkin, unit },
              unit,
              maxHP / 8,
              0,
            );
            unit.triggerAbility(Abilities.DrySkin);
          } else if (isWeatherSunny(unit)) {
            unit.damage(
              { type: EffectType.Ability, ability: Abilities.DrySkin, unit },
              unit,
              maxHP / 8,
              DamageFlags.NonLethal | DamageFlags.Indirect,
            );
            unit.triggerAbility(Abilities.DrySkin);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Damp_(Ability)
  // (Aftermath performs its own explicit Damp suppression check)
  createAbility(Abilities.Damp, (battle) => {
    /**
     * Holders currently on the field (the Unnerve/Cloud Nine
     * pattern): cast checks reduce to a single size lookup instead
     * of scanning every unit each time
     */
    const holders = new Set<Unit>();

    return new MergedLifecycle([
      // Nobody on the field can blow itself up while a holder is up
      battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
        if (event.success && holders.size > 0 && SELF_DESTRUCT_MOVES.has(event.move)) {
          event.success = false;

          // For visual cues: every holder on the field reacts
          for (const holder of holders) {
            holder.triggerAbility(Abilities.Damp);
          }
        }
      }),
      // The same answer, given to the AI before it picks. It cannot
      // ask the cast check itself — infatuation answers that one with
      // a coin toss, and a speculative flip would pull every replay
      // off its seed — so a veto that lives there says so here too.
      // Otherwise the holder's opponent picks an Explosion it will
      // never be allowed to cast, every tick, for ever
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
        if (event.usable && holders.size > 0 && SELF_DESTRUCT_MOVES.has(event.move)) {
          event.usable = false;
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Damp)) {
          holders.add(event.source);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      // Losing the ability mid-battle also lifts the suppression
      battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
        if (event.ability === Abilities.Damp) {
          holders.delete(event.source);
        }
      }),
    ]);
  }),

  // Venonat (Venomoth)
  // https://bulbapedia.bulbagarden.net/wiki/Wonder_Skin_(Ability)
  createAbility(Abilities.WonderSkin, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
      if (
        event.accuracy != null &&
        event.accuracy > 50 &&
        getMoveData(event.move).category === MoveCategories.Status &&
        event.target.type === MoveTargetType.Unit &&
        event.target.unit !== event.source &&
        event.target.unit.hasAbility(Abilities.WonderSkin)
      ) {
        event.accuracy = 50;
      }
    }),
  ),

  // Diglett
  // https://bulbapedia.bulbagarden.net/wiki/Arena_Trap_(Ability)
  createAbility(Abilities.ArenaTrap, (battle) =>
    battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        // Airborne and Ghost-type units cannot be trapped, and Run
        // Away escapes regardless: the explicit check (instead of a
        // Post override) keeps the trap cue from firing spuriously
        !source.checkGrounded() ||
        source.types.has(Types.Ghost) ||
        source.hasAbility(Abilities.RunAway)
      ) {
        return;
      }

      for (const unit of battle.units(source.team.alliance)) {
        if (unit.alive && unit.hasAbility(Abilities.ArenaTrap)) {
          event.success = false;

          // For visual cues: every holder reacts, not just the first
          unit.triggerAbility(Abilities.ArenaTrap);
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Sand_Force_(Ability)
  createAbility(Abilities.SandForce, (battle) => {
    const BOOSTED = new Set<Types>([Types.Ground, Types.Rock, Types.Steel]);
    const FACTOR = 1.3;

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          event.source.hasAbility(Abilities.SandForce) &&
          isWeatherSandstorm(event.source) &&
          BOOSTED.has(getMoveData(event.move).type)
        ) {
          event.power *= FACTOR;
        }
      }),
      chipImmunity(battle, Abilities.SandForce, Weathers.Sandstorm),
    ]);
  }),

  // Meowth
  // https://bulbapedia.bulbagarden.net/wiki/Pickup_(Ability)
  createAbility(Abilities.Pickup, (battle) =>
    // In-battle behavior: when another unit consumes its item, a
    // holder with a hand free scavenges it. What counts as free is the
    // record's business: a pokemon with room for two carries two
    battle.on(BattleEvents.UnitTriggerItem, EventPriority.Post, (event) => {
      for (const unit of battle.units()) {
        if (
          unit !== event.source &&
          unit.alive &&
          unit.hasAbility(Abilities.Pickup) &&
          hasFreeItemSlot(unit)
        ) {
          unit.addItem(event.item);

          // Cue only when the pickup actually landed: the add can
          // still be vetoed by something else
          if (unit.items[event.item] === true) {
            unit.triggerAbility(Abilities.Pickup);
            return;
          }
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Technician_(Ability)
  createAbility(Abilities.Technician, (battle) => {
    const THRESHOLD = 60;
    const FACTOR = 1.5;

    return battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.power <= THRESHOLD &&
        event.source.hasAbility(Abilities.Technician)
      ) {
        event.power *= FACTOR;
      }
    });
  }),

  // Persian
  // https://bulbapedia.bulbagarden.net/wiki/Limber_(Ability)
  createLimberAbility(Abilities.Limber, [Statuses.Paralyzed]),

  // Psyduck
  // https://bulbapedia.bulbagarden.net/wiki/Cloud_Nine_(Ability)
  createCloudNineAbility(Abilities.CloudNine),

  // https://bulbapedia.bulbagarden.net/wiki/Swift_Swim_(Ability)
  createAbility(Abilities.SwiftSwim, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        isWeatherRainy(event.source) &&
        event.stat === Stats.Speed &&
        event.source.hasAbility(Abilities.SwiftSwim)
      ) {
        event.value *= 2;
      }
    }),
  ),

  // Mankey
  // https://bulbapedia.bulbagarden.net/wiki/Vital_Spirit_(Ability)
  createLimberAbility(Abilities.VitalSpirit, [Statuses.Sleeping]),

  // https://bulbapedia.bulbagarden.net/wiki/Anger_Point_(Ability)
  createAbility(
    Abilities.AngerPoint,
    (battle) =>
      new MergedLifecycle([
        // Detection: a real critical hit on the holder triggers it
        battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.critical &&
            parent.target.hasAbility(Abilities.AngerPoint) &&
            parent.target !== parent.source &&
            !(parent.flags & MoveAttackFlags.Simulated)
          ) {
            parent.target.triggerAbility(Abilities.AngerPoint);
          }
        }),
        // Effect: maximal rage; the stage clamp caps this at +6
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.AngerPoint) {
            event.source.addStage(Stages.Attack, 12, {
              type: EffectType.Ability,
              ability: Abilities.AngerPoint,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Defiant_(Ability)
  createAbility(
    Abilities.Defiant,
    (battle) =>
      new MergedLifecycle([
        // Detection: only stat drops inflicted by an enemy trigger
        // the defiance; its own boost has a positive value, so it
        // never re-triggers
        battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
          const cause = event.cause;

          if (
            event.value < 0 &&
            event.source.hasAbility(Abilities.Defiant) &&
            cause.type !== EffectType.None &&
            cause.unit !== event.source &&
            cause.unit.team.alliance !== event.source.team.alliance
          ) {
            event.source.triggerAbility(Abilities.Defiant);
          }
        }),
        // Effect: the sharp Attack boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Defiant) {
            event.source.addStage(Stages.Attack, 2, {
              type: EffectType.Ability,
              ability: Abilities.Defiant,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Growlithe
  // https://bulbapedia.bulbagarden.net/wiki/Justified_(Ability)
  createAbility(
    Abilities.Justified,
    (battle) =>
      new MergedLifecycle([
        // Detection: direct damage from a Dark-type move
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            event.success &&
            !(event.flags & DamageFlags.Indirect) &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.target.hasAbility(Abilities.Justified) &&
            getMoveData(event.cause.move).type === Types.Dark
          ) {
            event.target.triggerAbility(Abilities.Justified);
          }
        }),
        // Effect: the Attack boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Justified) {
            event.source.addStage(Stages.Attack, 1, {
              type: EffectType.Ability,
              ability: Abilities.Justified,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Poliwag
  createWaterAbsorbAbility(Abilities.WaterAbsorb, Types.Water),

  // Abra
  // https://bulbapedia.bulbagarden.net/wiki/Synchronize_(Ability)
  createAbility(Abilities.Synchronize, (battle) => {
    const SYNC_STATUS = new Set<Statuses>([
      Statuses.Poisoned,
      Statuses.BadlyPoisoned,
      Statuses.Burned,
      Statuses.Paralyzed,
    ]);

    // The effect targets the inflicting unit, which the trigger event
    // cannot carry, so it stays inline. Two Synchronize holders never
    // ping-pong: the reflected status is non-refreshable on re-add
    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
        const cause = event.cause;

        if (
          SYNC_STATUS.has(event.status) &&
          event.source.hasAbility(Abilities.Synchronize) &&
          cause.type !== EffectType.None &&
          cause.unit !== event.source
        ) {
          event.source.triggerAbility(Abilities.Synchronize);

          cause.unit.addStatus(event.status, {
            type: EffectType.Ability,
            ability: Abilities.Synchronize,
            unit: event.source,
          });
        }
      }),
      // Giving one of these to a holder is giving it to yourself, so
      // the AI is warned before it does. Not warned when it would
      // shrug the reflection off — an immune user pays nothing, and
      // the status still lands on the holder
      battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
        const status = STATUS_MOVES[event.move];

        // Explicit null check: the first Statuses enum member is 0
        if (
          status == null ||
          !SYNC_STATUS.has(status) ||
          event.target.type !== MoveTargetType.Unit ||
          !event.target.unit.hasAbility(Abilities.Synchronize)
        ) {
          return;
        }

        const reflected = {
          type: EffectType.Ability,
          ability: Abilities.Synchronize,
          unit: event.target.unit,
        } as const;

        if (!event.source.checkStatusImmunity(status, reflected)) {
          event.score -= RISKY_PENALTY;
        }
      }),
    ]);
  }),

  // Machop
  // https://bulbapedia.bulbagarden.net/wiki/No_Guard_(Ability)
  createAbility(
    Abilities.NoGuard,
    (battle) =>
      new MergedLifecycle([
        // Moves used by or against the holder skip the accuracy check
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.source.hasAbility(Abilities.NoGuard) ||
            (event.target.type === MoveTargetType.Unit &&
              event.target.unit.hasAbility(Abilities.NoGuard))
          ) {
            event.accuracy = undefined;
          }
        }),
        // ...and reach even semi-invulnerable targets (the roll only
        // resolves false here when something forced the miss)
        battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            !event.hit &&
            (parent.source.hasAbility(Abilities.NoGuard) ||
              (parent.target.type === MoveTargetType.Unit &&
                parent.target.unit.hasAbility(Abilities.NoGuard)))
          ) {
            event.hit = true;
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Steadfast_(Ability)
  createAbility(
    Abilities.Steadfast,
    (battle) =>
      new MergedLifecycle([
        // Detection: the holder flinches
        battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
          if (event.status === Statuses.Flinched && event.source.hasAbility(Abilities.Steadfast)) {
            event.source.triggerAbility(Abilities.Steadfast);
          }
        }),
        // Effect: the Speed boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Steadfast) {
            event.source.addStage(Stages.Speed, 1, {
              type: EffectType.Ability,
              ability: Abilities.Steadfast,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Bellsprout
  // https://bulbapedia.bulbagarden.net/wiki/Gluttony_(Ability)
  createAbility(Abilities.Gluttony, (battle) =>
    // The holder eats pinch items early: doubled threshold
    battle.on(BattleEvents.CheckUnitItemThreshold, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.Gluttony)) {
        event.threshold = Math.min(1, event.threshold * 2);
      }
    }),
  ),

  // Tentacool
  // https://bulbapedia.bulbagarden.net/wiki/Clear_Body_(Ability)
  createClearBodyAbility(Abilities.ClearBody),

  // https://bulbapedia.bulbagarden.net/wiki/Liquid_Ooze_(Ability)
  createAbility(
    Abilities.LiquidOoze,
    (battle) =>
      new MergedLifecycle([
        // Drains from the holder backfire; only fired on real drains,
        // so the cue is safe here
        battle.on(BattleEvents.CheckUnitDrain, EventPriority.Post, (event) => {
          if (event.value > 0 && event.target.hasAbility(Abilities.LiquidOoze)) {
            event.value = -event.value;

            // For visual cues
            event.target.triggerAbility(Abilities.LiquidOoze);
          }
        }),
        // A drain into it is a drain the other way round. The move
        // still lands, so this is a warning rather than a refusal —
        // but a pokemon with anything else to throw should throw it
        battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
          if (
            event.target.type === MoveTargetType.Unit &&
            ABSORB_MOVES.has(event.move) &&
            event.target.unit.hasAbility(Abilities.LiquidOoze)
          ) {
            event.score -= RISKY_PENALTY;
          }
        }),
      ]),
  ),
];

export default parasToTentacool;
