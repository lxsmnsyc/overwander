import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveCategories, MoveFlags, Moves } from '../../../data/ids/moves';
import { Statuses, Weathers } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { OHKO_MOVES } from '../../moves/fixed-damage';
import { ASLEEP_STATUSES } from '../../status';
import type Unit from '../../unit';
import { hasAnyStatus, isWeatherHail, isWeatherRainy, onUnitActs, unitTarget } from '../../utils';
import {
  chipImmunity,
  createAbility,
  createContactHazard,
  createFilterAbility,
  createHydrationAbility,
  createLimberAbility,
  createSandRushAbility,
  createShellArmorAbility,
} from '../__create';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';

/**
 * The swing every unit is fielded with, as the string key a move set
 * is indexed by. It is compared as a string because that is what the
 * keys of `unit.moves` are once they have been through
 * `Object.entries`
 */
const SWING = String(Moves.Attack);

/**
 * Geodude to Drowzee: the heavy ground, the magnets and the abilities
 * that read a fight rather than fight it
 */
const geodudeToDrowzee = [
  // Geodude
  // https://bulbapedia.bulbagarden.net/wiki/Rock_Head_(Ability)
  createAbility(Abilities.RockHead, (battle) =>
    // Mutates the in-flight recoil check, so the effect stays inline
    battle.on(BattleEvents.CheckUnitRecoil, EventPriority.Post, (event) => {
      if (event.recoil && event.parent.source.hasAbility(Abilities.RockHead)) {
        event.recoil = false;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Sturdy_(Ability)
  createAbility(
    Abilities.Sturdy,
    (battle) =>
      new MergedLifecycle([
        // Pure query: one-hit KO moves cannot touch the holder
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            OHKO_MOVES.has(event.move) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.Sturdy)
          ) {
            event.immune = true;
          }
        }),
        // Endures any single blow from full health with 1 HP left
        battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
          if (
            event.target.alive &&
            !(event.flags & DamageFlags.Indirect) &&
            event.value >= event.target.health &&
            event.target.hasAbility(Abilities.Sturdy) &&
            event.target.health >= event.target.checkStat(Stats.HP, 0)
          ) {
            event.value = event.target.health - 1;

            // For visual cues
            event.target.triggerAbility(Abilities.Sturdy);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Solid_Rock_(Ability)
  createFilterAbility(Abilities.SolidRock),

  // Ponyta
  // https://bulbapedia.bulbagarden.net/wiki/Flame_Body_(Ability)
  createAbility(Abilities.FlameBody, (battle) => {
    const CHANCE = 0.3;

    // The effect targets the attacker, which the trigger event
    // cannot carry, so it stays inline
    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.cause.type === EffectType.Move &&
          event.cause.unit !== event.target &&
          event.target.hasAbility(Abilities.FlameBody) &&
          event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target)) &&
          battle.random() < CHANCE
        ) {
          event.target.triggerAbility(Abilities.FlameBody);

          event.cause.unit.addStatus(Statuses.Burned, {
            type: EffectType.Ability,
            ability: Abilities.FlameBody,
            unit: event.target,
          });
        }
      }),
      // Touching it costs something, so the AI is told before it
      // decides to
      createContactHazard(battle, Abilities.FlameBody),
    ]);
  }),

  // Slowpoke
  // https://bulbapedia.bulbagarden.net/wiki/Oblivious_(Ability)
  createAbility(
    Abilities.Oblivious,
    (battle) =>
      new MergedLifecycle([
        // Pure query: cannot be infatuated
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Infatuated &&
            event.source.hasAbility(Abilities.Oblivious)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (
            event.status === Statuses.Infatuated &&
            event.source.hasAbility(Abilities.Oblivious)
          ) {
            event.source.triggerAbility(Abilities.Oblivious);
          }
        }),
        // Unfazed by Intimidate (modern mechanics)
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type === EffectType.Ability &&
            event.cause.ability === Abilities.Intimidate &&
            event.source.hasAbility(Abilities.Oblivious)
          ) {
            event.success = false;
            event.source.triggerAbility(Abilities.Oblivious);
          }
        }),
        // Gaining the ability also cures the blocked status
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          if (
            event.ability === Abilities.Oblivious &&
            event.source.status[Statuses.Infatuated] != null
          ) {
            event.source.removeStatus(Statuses.Infatuated, {
              type: EffectType.Ability,
              ability: Abilities.Oblivious,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Own_Tempo_(Ability)
  createAbility(
    Abilities.OwnTempo,
    (battle) =>
      new MergedLifecycle([
        // Pure query: cannot be confused
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Confused &&
            event.source.hasAbility(Abilities.OwnTempo)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (event.status === Statuses.Confused && event.source.hasAbility(Abilities.OwnTempo)) {
            event.source.triggerAbility(Abilities.OwnTempo);
          }
        }),
        // Unfazed by Intimidate (modern mechanics)
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type === EffectType.Ability &&
            event.cause.ability === Abilities.Intimidate &&
            event.source.hasAbility(Abilities.OwnTempo)
          ) {
            event.success = false;

            // A cue is something a watcher sees, so it waits for a real
            // attempt rather than the AI weighing one
            if (!event.simulated) {
              event.source.triggerAbility(Abilities.OwnTempo);
            }
          }
        }),
        // Gaining the ability also cures the blocked status
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          if (
            event.ability === Abilities.OwnTempo &&
            event.source.status[Statuses.Confused] != null
          ) {
            event.source.removeStatus(Statuses.Confused, {
              type: EffectType.Ability,
              ability: Abilities.OwnTempo,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Regenerator_(Ability)
  createAbility(
    Abilities.Regenerator,
    (battle) =>
      new MergedLifecycle([
        // Detection: the holder withdraws from the field alive
        battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
          if (event.source.alive && event.source.hasAbility(Abilities.Regenerator)) {
            event.source.triggerAbility(Abilities.Regenerator);
          }
        }),
        // Effect: the third-of-max-health heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Regenerator) {
            event.source.heal(
              {
                type: EffectType.Ability,
                ability: Abilities.Regenerator,
                unit: event.source,
              },
              event.source,
              event.source.checkStat(Stats.HP, 0) / 3,
              0,
            );
          }
        }),
      ]),
  ),

  // Magnemite
  // https://bulbapedia.bulbagarden.net/wiki/Magnet_Pull_(Ability)
  createAbility(Abilities.MagnetPull, (battle) =>
    battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        // Only Steel types stick to the magnet; Ghost types and Run
        // Away escape regardless (the explicit check keeps the cue
        // from firing spuriously)
        !source.types.has(Types.Steel) ||
        source.types.has(Types.Ghost) ||
        source.hasAbility(Abilities.RunAway)
      ) {
        return;
      }

      for (const unit of battle.units(source.team.alliance)) {
        if (unit.alive && unit.hasAbility(Abilities.MagnetPull)) {
          event.success = false;

          // For visual cues: every holder reacts, not just the first
          unit.triggerAbility(Abilities.MagnetPull);
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Analytic_(Ability)
  createAbility(Abilities.Analytic, (battle) => {
    const FACTOR = 1.3;

    // Real-time analog of "moves last": the boost applies while the
    // target is already committed to its own move
    return battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(Abilities.Analytic) &&
        event.target.type === MoveTargetType.Unit &&
        (event.target.unit.casting != null || event.target.unit.channeling != null)
      ) {
        event.power *= FACTOR;
      }
    });
  }),

  // Doduo
  // https://bulbapedia.bulbagarden.net/wiki/Early_Bird_(Ability)
  createAbility(Abilities.EarlyBird, (battle) =>
    // Mutates the in-flight duration check, so the effect stays inline
    battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
      if (event.status === Statuses.Sleeping && event.source.hasAbility(Abilities.EarlyBird)) {
        event.duration /= 2;
      }
    }),
  ),

  // Seel
  createHydrationAbility(Abilities.Hydration, isWeatherRainy),

  // https://bulbapedia.bulbagarden.net/wiki/Ice_Body_(Ability)
  createAbility(
    Abilities.IceBody,
    (battle) =>
      new MergedLifecycle([
        // No turn mechanics: it is paid as the holder reaches for a
        // move
        ...onUnitActs(battle, (unit) => {
          if (isWeatherHail(unit) && unit.hasAbility(Abilities.IceBody)) {
            unit.triggerAbility(Abilities.IceBody);
          }
        }),
        // The heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.IceBody) {
            const maxHP = event.source.checkStat(Stats.HP, 0) / 16;

            event.source.heal(
              { type: EffectType.Ability, ability: Abilities.IceBody, unit: event.source },
              event.source,
              maxHP,
              0,
            );
          }
        }),
        chipImmunity(battle, Abilities.IceBody, Weathers.Hail),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Slush_Rush_(Ability)
  createSandRushAbility(Abilities.SlushRush, isWeatherHail),

  // Grimer
  // https://bulbapedia.bulbagarden.net/wiki/Sticky_Hold_(Ability)
  createAbility(Abilities.StickyHold, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Pre, (event) => {
      // Only the holder itself (e.g. eating its berry) may remove its
      // item; removal forced by another unit is blocked
      if (
        'unit' in event.cause &&
        event.cause.unit !== event.source &&
        event.source.hasAbility(Abilities.StickyHold)
      ) {
        event.disabled = true;

        event.source.triggerAbility(Abilities.StickyHold);
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Poison_Touch_(Ability)
  createAbility(Abilities.PoisonTouch, (battle) => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.cause.unit.hasAbility(Abilities.PoisonTouch) &&
        event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target)) &&
        battle.random() < CHANCE
      ) {
        const attacker = event.cause.unit;

        attacker.triggerAbility(Abilities.PoisonTouch);

        event.target.addStatus(Statuses.Poisoned, {
          type: EffectType.Ability,
          ability: Abilities.PoisonTouch,
          unit: attacker,
        });
      }
    });
  }),

  // Shellder
  createShellArmorAbility(Abilities.ShellArmor),

  // https://bulbapedia.bulbagarden.net/wiki/Skill_Link_(Ability)
  createAbility(Abilities.SkillLink, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveHits, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.SkillLink)) {
        event.hits = event.max;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Overcoat_(Ability)
  createAbility(
    Abilities.Overcoat,
    (battle) =>
      new MergedLifecycle([
        chipImmunity(battle, Abilities.Overcoat, Weathers.Sandstorm),
        chipImmunity(battle, Abilities.Overcoat, Weathers.Hail),
        // Pure query: powder- and spore-based moves cannot land
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.Overcoat) &&
            getMoveData(event.move).flags & MoveFlags.Powder
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real use was blocked
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const target = event.parent.target;

          if (
            target.type === MoveTargetType.Unit &&
            target.unit.hasAbility(Abilities.Overcoat) &&
            getMoveData(event.parent.move).flags & MoveFlags.Powder
          ) {
            target.unit.triggerAbility(Abilities.Overcoat);
          }
        }),
      ]),
  ),

  // Gastly
  // https://bulbapedia.bulbagarden.net/wiki/Levitate_(Ability)
  createAbility(
    Abilities.Levitate,
    (battle) =>
      new MergedLifecycle([
        // Airborne unless something (e.g. Gravity) forces grounding;
        // the shared immunity rule then blocks Ground moves
        battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
          if (
            event.grounded &&
            event.source.status[Statuses.Grounded] == null &&
            event.source.hasAbility(Abilities.Levitate)
          ) {
            event.grounded = false;
          }
        }),
        // The cue only fires when a real Ground move was avoided
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const target = event.parent.target;

          if (
            target.type === MoveTargetType.Unit &&
            target.unit.hasAbility(Abilities.Levitate) &&
            !target.unit.checkGrounded() &&
            event.parent.source.checkMoveType(event.parent.move, target) === Types.Ground
          ) {
            target.unit.triggerAbility(Abilities.Levitate);
          }
        }),
      ]),
  ),

  /**
   * Cursed Body: what hit it stops working for a while.
   *
   * The lock is Disable's, cast rather than reimplemented, so the
   * ability inherits its duration, its interrupt and its release
   * https://bulbapedia.bulbagarden.net/wiki/Cursed_Body_(Ability)
   */
  createAbility(Abilities.CursedBody, (battle) => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.target.alive &&
        event.target.hasAbility(Abilities.CursedBody) &&
        battle.random() < CHANCE
      ) {
        event.target.triggerAbility(Abilities.CursedBody);
        event.target.triggerMove(Moves.Disable, unitTarget(event.cause.unit), 0);
      }
    });
  }),

  // Onix
  // https://bulbapedia.bulbagarden.net/wiki/Weak_Armor_(Ability)
  createAbility(
    Abilities.WeakArmor,
    (battle) =>
      new MergedLifecycle([
        // Detection: direct damage from a physical move
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            event.success &&
            !(event.flags & DamageFlags.Indirect) &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.target.hasAbility(Abilities.WeakArmor) &&
            getMoveData(event.cause.move).category === MoveCategories.Physical
          ) {
            event.target.triggerAbility(Abilities.WeakArmor);
          }
        }),
        // Effect: the armor cracks — Defense drops, Speed surges
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.WeakArmor) {
            const cause = {
              type: EffectType.Ability,
              ability: Abilities.WeakArmor,
              unit: event.source,
            } as const;

            event.source.addStage(Stages.Defense, -1, cause);
            event.source.addStage(Stages.Speed, 2, cause);
          }
        }),
      ]),
  ),

  // Drowzee
  // https://bulbapedia.bulbagarden.net/wiki/Insomnia_(Ability)
  createLimberAbility(Abilities.Insomnia, [Statuses.Sleeping]),

  // https://bulbapedia.bulbagarden.net/wiki/Forewarn_(Ability)
  createAbility(Abilities.Forewarn, (battle) => {
    // Same lockout the Disable move gives, so the two read as one
    // mechanic rather than two that happen to look alike
    const DURATION = turns(4);

    interface Warned {
      unit: Unit;
      move: Moves;
      progress: number;
    }

    /** What each forewarner shut off, keyed by the forewarner */
    const locked = new Map<Unit, Warned>();

    const timer = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [holder, data] of locked) {
        data.progress -= event.duration;

        if (data.progress <= 0) {
          release(holder);
        }
      }
    });

    timer.stop();

    function release(holder: Unit): void {
      const data = locked.get(holder);

      if (data) {
        locked.delete(holder);
        data.unit.enableMove(data.move);

        if (locked.size === 0) {
          timer.stop();
        }
      }
    }

    /** Release whatever a unit was holding, on either side of it */
    function clear(unit: Unit): void {
      release(unit);

      for (const [holder, data] of locked) {
        if (data.unit === unit) {
          release(holder);
        }
      }
    }

    /**
     * The hardest hitter on the other side. The swing every unit is
     * fielded with does not count: it is what a pokemon does with its
     * hands rather than something to be forewarned about. Nor does a
     * move somebody else already shut off, or whichever lock lifted
     * first would hand it back
     */
    function strongest(holder: Unit): Warned | undefined {
      let found: Warned | undefined;
      let power = 0;

      for (const unit of battle.units(holder.team.alliance)) {
        if (!unit.alive) {
          continue;
        }

        for (const [key, state] of Object.entries(unit.moves)) {
          // The key is the move's id as a string, which is what makes
          // the comparison a string one, and tsgolint narrows the
          // optional record's values to defined while at runtime a
          // cleared slot holds undefined
          // oxlint-disable-next-line typescript/no-unnecessary-condition
          if (state == null || state.disabled || key === SWING) {
            continue;
          }

          const rated = getMoveData(state.move).power ?? 0;

          if (rated > power) {
            power = rated;
            found = { unit, move: state.move, progress: DURATION };
          }
        }
      }

      return found;
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (locked.has(event.source) || !event.source.hasAbility(Abilities.Forewarn)) {
          return;
        }

        const warned = strongest(event.source);

        if (warned == null) {
          return;
        }

        // Shutting the move off mid-use interrupts it, as Disable does
        if (
          warned.unit.casting?.move === warned.move ||
          warned.unit.channeling?.move === warned.move
        ) {
          warned.unit.interrupt();
        }

        locked.set(event.source, warned);
        warned.unit.disableMove(warned.move);
        event.source.triggerAbility(Abilities.Forewarn);

        if (locked.size === 1) {
          timer.start();
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        clear(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        clear(event.source);
      }),
    ]);
  }),

  /**
   * Bad Dreams: sleeping enemies are bitten for an eighth of their HP.
   *
   * No turn to hang it on, and a sleeper never acts, so it is paid as
   * the holder reaches for a move
   * https://bulbapedia.bulbagarden.net/wiki/Bad_Dreams_(Ability)
   */
  createAbility(
    Abilities.BadDreams,
    (battle) =>
      new MergedLifecycle([
        ...onUnitActs(battle, (unit) => {
          if (unit.hasAbility(Abilities.BadDreams)) {
            unit.triggerAbility(Abilities.BadDreams);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.BadDreams) {
            return;
          }

          for (const unit of battle.units()) {
            if (
              unit.alive &&
              unit.team.alliance !== event.source.team.alliance &&
              hasAnyStatus(unit, ASLEEP_STATUSES)
            ) {
              unit.damage(
                {
                  type: EffectType.Ability,
                  ability: Abilities.BadDreams,
                  unit: event.source,
                },
                unit,
                unit.checkStat(Stats.HP, 0) / 8,
                DamageFlags.Indirect,
              );
            }
          }
        }),
      ]),
  ),
];

export default geodudeToDrowzee;
