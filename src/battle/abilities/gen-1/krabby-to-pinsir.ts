import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { ItemTypes, type Items } from '../../../data/ids/items';
import { DamageFlags, MoveFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { getItemData } from '../../../data/items';
import { getMoveData } from '../../../data/moves';
import { checkUnitRating } from '../../ai/rating';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { CRASH_MOVES } from '../../moves/crash';
import { RECOIL_MOVES } from '../../moves/recoil';
import { transformUnit } from '../../moves/transform';
import { PROTECTED_ABILITIES } from '../special';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { hasAnyStatus, holdsAnyItem, isWeatherSunny, onUnitActs, unitTarget } from '../../utils';
import {
  createAbility,
  createFilterAbility,
  createHydrationAbility,
  createKeenEyeAbility,
  createLimberAbility,
  createShellArmorAbility,
} from '../__create';
import { MergedLifecycle } from '../../lifecycle';

/**
 * Krabby to Pinsir: the shells, the fists and what the odd ones do
 * that nothing else does
 */
const krabbyToPinsir = [
  // Krabby
  // https://bulbapedia.bulbagarden.net/wiki/Hyper_Cutter_(Ability)
  createAbility(Abilities.HyperCutter, (battle) =>
    battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
      if (
        event.success &&
        event.stage === Stages.Attack &&
        event.value < 0 &&
        event.source.hasAbility(Abilities.HyperCutter) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.success = false;

        // A cue is something a watcher sees, so it waits for a real
        // attempt rather than the AI weighing one
        if (!event.simulated) {
          event.source.triggerAbility(Abilities.HyperCutter);
        }
      }
    }),
  ),

  // Voltorb
  // https://bulbapedia.bulbagarden.net/wiki/Soundproof_(Ability)
  createAbility(
    Abilities.Soundproof,
    (battle) =>
      new MergedLifecycle([
        // Pure query: sound-based moves cannot land
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.Soundproof) &&
            getMoveData(event.move).flags & MoveFlags.Sound
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real use was blocked
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const target = event.parent.target;

          if (
            target.type === MoveTargetType.Unit &&
            target.unit.hasAbility(Abilities.Soundproof) &&
            getMoveData(event.parent.move).flags & MoveFlags.Sound
          ) {
            target.unit.triggerAbility(Abilities.Soundproof);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Aftermath_(Ability)
  createAbility(Abilities.Aftermath, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      if (
        event.success &&
        !event.target.alive &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.target.hasAbility(Abilities.Aftermath) &&
        event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target))
      ) {
        // A Damp unit on the field suppresses the blast; every
        // holder reacts for the visual cue
        let suppressed = false;

        for (const unit of battle.units()) {
          if (unit.alive && unit.hasAbility(Abilities.Damp)) {
            suppressed = true;

            unit.triggerAbility(Abilities.Damp);
          }
        }

        if (suppressed) {
          return;
        }

        const attacker = event.cause.unit;

        event.target.triggerAbility(Abilities.Aftermath);

        event.target.damage(
          {
            type: EffectType.Ability,
            ability: Abilities.Aftermath,
            unit: event.target,
          },
          attacker,
          attacker.checkStat(Stats.HP, 0) / 4,
          DamageFlags.Indirect,
        );
      }
    }),
  ),

  // Exeggcute
  // https://bulbapedia.bulbagarden.net/wiki/Harvest_(Ability)
  createAbility(Abilities.Harvest, (battle) => {
    const CHANCE = 0.5;

    // Last berry each holder consumed, restorable by the next harvest
    const consumed = new Map<Unit, Items>();

    return new MergedLifecycle([
      // Only self-consumption (e.g. eating a pinch berry) is
      // harvestable; forced removal by others is not
      battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
        if (
          event.cause.type === EffectType.Item &&
          event.source.hasAbility(Abilities.Harvest) &&
          getItemData(event.item).type === ItemTypes.Berry
        ) {
          consumed.set(event.source, event.item);
        }
      }),
      // No turn mechanics: it is rolled as the holder reaches for a
      // move, and the regrowth is guaranteed in the sun, a coin flip
      // otherwise
      ...onUnitActs(battle, (unit) => {
        if (
          consumed.has(unit) &&
          unit.hasAbility(Abilities.Harvest) &&
          (isWeatherSunny(unit) || battle.random() < CHANCE)
        ) {
          unit.triggerAbility(Abilities.Harvest);
        }
      }),
      // The regrowth rides the trigger
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        const berry = consumed.get(event.source);

        if (event.ability === Abilities.Harvest && berry != null) {
          consumed.delete(event.source);

          event.source.addItem(berry);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        consumed.delete(event.source);
      }),
    ]);
  }),

  // Cubone
  createShellArmorAbility(Abilities.BattleArmor),

  // Tyrogue (Hitmonlee)
  // https://bulbapedia.bulbagarden.net/wiki/Reckless_(Ability)
  createAbility(Abilities.Reckless, (battle) => {
    const FACTOR = 1.2;

    return battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(Abilities.Reckless) &&
        (RECOIL_MOVES[event.move] != null || CRASH_MOVES.has(event.move))
      ) {
        event.power *= FACTOR;
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Unburden_(Ability)
  createAbility(Abilities.Unburden, (battle) => {
    /**
     * Holders whose item is gone: the boost lasts until they leave
     * the field or pick up a new item
     */
    const activated = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Unburden) && !holdsAnyItem(event.source)) {
          activated.add(event.source);

          // For visual cues
          event.source.triggerAbility(Abilities.Unburden);
        }
      }),
      battle.on(BattleEvents.UnitAddItem, EventPriority.Post, (event) => {
        activated.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        activated.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        activated.delete(event.source);
      }),
      battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
        if (event.ability === Abilities.Unburden) {
          activated.delete(event.source);
        }
      }),
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.stat === Stats.Speed && activated.has(event.source)) {
          event.value *= 2;
        }
      }),
    ]);
  }),

  // Tyrogue (Hitmonchan)
  // https://bulbapedia.bulbagarden.net/wiki/Iron_Fist_(Ability)
  createAbility(Abilities.IronFist, (battle) => {
    const PUNCH_MOVES = new Set<Moves>([
      Moves.MegaPunch,
      Moves.CometPunch,
      Moves.FirePunch,
      Moves.IcePunch,
      Moves.ThunderPunch,
      Moves.DizzyPunch,
    ]);
    const FACTOR = 1.2;

    return battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(Abilities.IronFist) &&
        PUNCH_MOVES.has(event.move)
      ) {
        event.power *= FACTOR;
      }
    });
  }),

  // Koffing
  // https://bulbapedia.bulbagarden.net/wiki/Neutralizing_Gas_(Ability)
  createAbility(Abilities.NeutralizingGas, (battle) => {
    /**
     * Abilities the gas cannot shut down: other gas holders and the
     * disable-protected special tier
     */
    const UNSUPPRESSIBLE = new Set<Abilities>([Abilities.NeutralizingGas, ...PROTECTED_ABILITIES]);

    // Holders currently on the field (the Unnerve pattern)
    const holders = new Set<Unit>();

    function removeHolder(unit: Unit, keepUnit: boolean): void {
      if (holders.delete(unit) && holders.size === 0) {
        // The gas lifting re-activates entry abilities (modern
        // mechanics). The reactivation flag keeps this from reading
        // as a genuine entry, so one-time entry side-effects don't
        // re-trigger. Other gas carriers are skipped so a benched
        // one cannot silently re-establish the gas.
        for (const other of battle.units()) {
          if (
            other.alive &&
            (keepUnit || other !== unit) &&
            !other.hasAbility(Abilities.NeutralizingGas)
          ) {
            other.enter(true);
          }
        }
      }
    }

    return new MergedLifecycle([
      // Pure query: while any holder is up, every other unit's
      // abilities read as absent — no unit state is touched, so the
      // gas lifting restores everything for free
      battle.on(BattleEvents.CheckUnitAbility, EventPriority.Post, (event) => {
        if (
          event.enabled &&
          holders.size > 0 &&
          !holders.has(event.source) &&
          !UNSUPPRESSIBLE.has(event.ability)
        ) {
          event.enabled = false;
        }
      }),
      // Pre: the gas is up before any other entry listener (e.g.
      // entry-triggered abilities) processes the same event
      battle.on(BattleEvents.UnitEntersField, EventPriority.Pre, (event) => {
        if (event.source.hasAbility(Abilities.NeutralizingGas)) {
          holders.add(event.source);

          // For visual cues
          event.source.triggerAbility(Abilities.NeutralizingGas);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        removeHolder(event.source, false);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        removeHolder(event.source, false);
      }),
      battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
        if (event.ability === Abilities.NeutralizingGas) {
          removeHolder(event.source, true);
        }
      }),
    ]);
  }),

  // Chansey
  // https://bulbapedia.bulbagarden.net/wiki/Natural_Cure_(Ability)
  createAbility(
    Abilities.NaturalCure,
    (battle) =>
      new MergedLifecycle([
        // Detection: leaving the field with a status condition
        battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
          if (
            event.source.hasAbility(Abilities.NaturalCure) &&
            hasAnyStatus(event.source, MAJOR_STATUS_CONDITIONS)
          ) {
            event.source.triggerAbility(Abilities.NaturalCure);
          }
        }),
        // The cure rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.NaturalCure) {
            event.source.cure({
              type: EffectType.Ability,
              ability: Abilities.NaturalCure,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Serene_Grace_(Ability)
  createAbility(Abilities.SereneGrace, (battle) =>
    // Mutates the in-flight chance check, so the effect stays inline
    battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
      if (event.value != null && event.parent.source.hasAbility(Abilities.SereneGrace)) {
        event.value *= 2;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Healer_(Ability)
  createAbility(Abilities.Healer, (battle) => {
    const CHANCE = 0.3;

    // No turn mechanics: it is rolled as the holder reaches for a
    // move, and the cure needs the rolled ally, so the effect stays
    // inline
    return new MergedLifecycle(
      onUnitActs(battle, (unit) => {
        if (!unit.hasAbility(Abilities.Healer)) {
          return;
        }

        for (const ally of unit.team.units) {
          if (
            ally !== unit &&
            ally.alive &&
            hasAnyStatus(ally, MAJOR_STATUS_CONDITIONS) &&
            battle.random() < CHANCE
          ) {
            unit.triggerAbility(Abilities.Healer);

            ally.cure({
              type: EffectType.Ability,
              ability: Abilities.Healer,
              unit,
            });
          }
        }
      }),
    );
  }),

  // Tangela
  createHydrationAbility(Abilities.LeafGuard, isWeatherSunny),

  // Kangaskhan
  // https://bulbapedia.bulbagarden.net/wiki/Scrappy_(Ability)
  createAbility(
    Abilities.Scrappy,
    (battle) =>
      new MergedLifecycle([
        // Normal and Fighting moves connect with Ghosts
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.immune &&
            (event.type === Types.Normal || event.type === Types.Fighting) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.types.has(Types.Ghost) &&
            event.source.hasAbility(Abilities.Scrappy)
          ) {
            event.immune = false;
          }
        }),
        // Unfazed by Intimidate (modern mechanics)
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type === EffectType.Ability &&
            event.cause.ability === Abilities.Intimidate &&
            event.source.hasAbility(Abilities.Scrappy)
          ) {
            event.success = false;

            // A cue is something a watcher sees, so it waits for a real
            // attempt rather than the AI weighing one
            if (!event.simulated) {
              event.source.triggerAbility(Abilities.Scrappy);
            }
          }
        }),
      ]),
  ),

  // Goldeen
  // https://bulbapedia.bulbagarden.net/wiki/Water_Veil_(Ability)
  createLimberAbility(Abilities.WaterVeil, [Statuses.Burned]),

  // Staryu
  createKeenEyeAbility(Abilities.Illuminate),

  // Magikarp
  // https://bulbapedia.bulbagarden.net/wiki/Rattled_(Ability)
  createAbility(Abilities.Rattled, (battle) => {
    const SCARY_TYPES = new Set<Types>([Types.Bug, Types.Dark, Types.Ghost]);

    return new MergedLifecycle([
      // Detection: direct damage from a scary-typed move
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.cause.type === EffectType.Move &&
          event.cause.unit !== event.target &&
          event.target.hasAbility(Abilities.Rattled) &&
          SCARY_TYPES.has(getMoveData(event.cause.move).type)
        ) {
          event.target.triggerAbility(Abilities.Rattled);
        }
      }),
      // Detection: being Intimidated (modern mechanics)
      battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
        if (
          event.cause.type === EffectType.Ability &&
          event.cause.ability === Abilities.Intimidate &&
          event.source.hasAbility(Abilities.Rattled)
        ) {
          event.source.triggerAbility(Abilities.Rattled);
        }
      }),
      // Effect: the Speed jolt rides the trigger
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.Rattled) {
          event.source.addStage(Stages.Speed, 1, {
            type: EffectType.Ability,
            ability: Abilities.Rattled,
            unit: event.source,
          });
        }
      }),
    ]);
  }),

  // Ditto
  // https://bulbapedia.bulbagarden.net/wiki/Imposter_(Ability)
  createAbility(Abilities.Imposter, (battle) => {
    function strongestEnemy(source: Unit): Unit | undefined {
      let best: Unit | undefined;
      let bestRating = Number.NEGATIVE_INFINITY;

      for (const enemy of battle.units(source.team.alliance)) {
        if (enemy.alive) {
          const rating = checkUnitRating(battle, enemy);

          if (rating > bestRating) {
            best = enemy;
            bestRating = rating;
          }
        }
      }

      return best;
    }

    return new MergedLifecycle([
      // Detection: entering the field with an enemy to copy
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Imposter) && strongestEnemy(event.source) != null) {
          event.source.triggerAbility(Abilities.Imposter);
        }
      }),
      // Effect: the copy rides the trigger (the target re-derives to
      // the same strongest enemy)
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.Imposter) {
          const target = strongestEnemy(event.source);

          if (target) {
            transformUnit(event.source, target);
          }
        }
      }),
    ]);
  }),

  // MrMime
  // https://bulbapedia.bulbagarden.net/wiki/Filter_(Ability)
  createFilterAbility(Abilities.Filter),

  // Pinsir
  // https://bulbapedia.bulbagarden.net/wiki/Moxie_(Ability)
  createAbility(
    Abilities.Moxie,
    (battle) =>
      new MergedLifecycle([
        // Detection: a direct move knocked the target out
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            event.success &&
            !event.target.alive &&
            !(event.flags & DamageFlags.Indirect) &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.cause.unit.hasAbility(Abilities.Moxie)
          ) {
            event.cause.unit.triggerAbility(Abilities.Moxie);
          }
        }),
        // Effect: the Attack surge rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Moxie) {
            event.source.addStage(Stages.Attack, 1, {
              type: EffectType.Ability,
              ability: Abilities.Moxie,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  /**
   * https://bulbapedia.bulbagarden.net/wiki/Mold_Breaker_(Ability)
   *
   * While a holder's move resolves against a target, the target's
   * abilities read as absent (via the CheckUnitAbility query), so
   * defensive abilities like Levitate, Filter or Shell Armor cannot
   * hinder the attack. The windows open at Prepare (before every
   * regular listener) and close at Cleanup, which always runs even
   * when the event is disabled mid-emission — the brackets cannot
   * leak. The window is suspended while UnitDamage emissions run, so
   * post-damage contact abilities (Static, Aftermath, ...) still
   * fire like in the games.
   */
  createAbility(Abilities.MoldBreaker, (battle) => {
    const EXEMPT = new Set<Abilities>([Abilities.NeutralizingGas, ...PROTECTED_ABILITIES]);

    /**
     * Nested per-defender window counts for in-flight holder attacks
     * (the whole pipeline is synchronous, so bracketing the entry
     * events at Prepare/Cleanup scopes every nested query); the
     * opened map remembers each event's pushed defender in case the
     * target is retargeted mid-flight (e.g. Lightning Rod)
     */
    const ignored = new Map<Unit, number>();
    const opened = new WeakMap<object, Unit>();

    // Damage application (and its post-damage reactions) sees real
    // abilities: the suppression only covers the move's resolution
    let suspended = 0;

    function push(event: object, target: Unit): void {
      opened.set(event, target);
      ignored.set(target, (ignored.get(target) ?? 0) + 1);
    }

    function pop(event: object): void {
      const target = opened.get(event);

      if (target) {
        opened.delete(event);

        const count = ignored.get(target) ?? 0;

        if (count <= 1) {
          ignored.delete(target);
        } else {
          ignored.set(target, count - 1);
        }
      }
    }

    return new MergedLifecycle([
      // Pure query: an ignored defender's abilities read as absent
      battle.on(BattleEvents.CheckUnitAbility, EventPriority.Post, (event) => {
        if (
          event.enabled &&
          suspended === 0 &&
          ignored.has(event.source) &&
          !EXEMPT.has(event.ability)
        ) {
          event.enabled = false;
        }
      }),
      // For visual cues: the classic entry announcement
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.MoldBreaker)) {
          event.source.triggerAbility(Abilities.MoldBreaker);
        }
      }),
      // Target resolution window (immunity, accuracy, effects)
      battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Prepare, (event) => {
        if (
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          event.source.hasAbility(Abilities.MoldBreaker)
        ) {
          push(event, event.target.unit);
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Cleanup, (event) => {
        pop(event);
      }),
      // Attack resolution window (damage math, criticals)
      battle.on(BattleEvents.UnitAttack, AttackPriority.Prepare, (event) => {
        if (event.target !== event.source && event.source.hasAbility(Abilities.MoldBreaker)) {
          push(event, event.target);
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
        pop(event);
      }),
      // The AI's speculative windows: what it asks about a move it is
      // considering has to be answered the way the move will actually
      // resolve, or the holder refuses a Ground move against a
      // Levitator it could hit and underrates every hit it would take
      // through Filter. Same brackets, same nesting, no second copy of
      // what this ability ignores
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Prepare, (event) => {
        if (
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          event.source.hasAbility(Abilities.MoldBreaker)
        ) {
          push(event, event.target.unit);
        }
      }),
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Cleanup, (event) => {
        pop(event);
      }),
      battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Prepare, (event) => {
        if (
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          event.source.hasAbility(Abilities.MoldBreaker)
        ) {
          push(event, event.target.unit);
        }
      }),
      battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Cleanup, (event) => {
        pop(event);
      }),
      // Damage bracket: suspend the suppression for the application
      // and every post-damage reaction nested in it
      battle.on(BattleEvents.UnitDamage, AttackPriority.Prepare, () => {
        if (ignored.size > 0) {
          suspended += 1;
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Cleanup, () => {
        if (suspended > 0) {
          suspended -= 1;
        }
      }),
    ]);
  }),
];

export default krabbyToPinsir;
