import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { STAGE_NAMES, Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { DamageFlags, MoveCategories, type Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { Items } from '../../data/ids/items';
import { Statuses, Weathers } from '../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { FORCED_SWITCH_MOVES } from '../moves/switch-out';
import { hasFreeItemSlot, isWeatherSunny, onUnitActs } from '../utils';
import { createAbility, createDrizzleAbility, createLimberAbility } from './__create';

const PLUS_BOOST = 1.5;
const FLOWER_GIFT_BOOST = 1.5;

/**
 * Every stage Moody chooses between. Accuracy and evasion are in, as
 * the mainline has them
 */
const MOODY_STAGES = Object.keys(STAGE_NAMES).map(Number) as Stages[];
const MOODY_RISE = 2;

const setupAbilities = [
  // https://bulbapedia.bulbagarden.net/wiki/Berserk_(Ability)
  createAbility(
    Abilities.Berserk,
    (battle) =>
      new MergedLifecycle([
        // Only the crossing pays, so healing back over half arms it
        // again and a second hit while already low does nothing
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            !event.success ||
            (event.flags & DamageFlags.Indirect) !== 0 ||
            event.cause.type !== EffectType.Move ||
            event.cause.unit === event.target ||
            !event.target.alive ||
            !event.target.hasAbility(Abilities.Berserk)
          ) {
            return;
          }

          const half = event.target.checkStat(Stats.HP, 0) / 2;

          if (event.target.health <= half && event.target.health + event.value > half) {
            event.target.triggerAbility(Abilities.Berserk);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Berserk) {
            event.source.addStage(Stages.SpecialAttack, 1, {
              type: EffectType.Ability,
              ability: Abilities.Berserk,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Magic_Bounce_(Ability)
  createAbility(Abilities.MagicBounce, (battle) => {
    // Holders part-way through casting a bounced move, so a move
    // bounced into a second Magic Bounce comes to rest instead of
    // crossing the field forever
    const reflecting = new Set<Unit>();

    function bounces(move: Moves, source: Unit, target: Unit): boolean {
      return (
        source !== target &&
        target.hasAbility(Abilities.MagicBounce) &&
        getMoveData(move).category === MoveCategories.Status
      );
    }

    return new MergedLifecycle([
      // Pure query: grants the immunity, no side effects
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          bounces(event.move, event.source, event.target.unit)
        ) {
          event.immune = true;
        }
      }),
      // The cast back needs the move and the unit that used it, and a
      // trigger event carries neither, so it stays inline
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.target.type !== MoveTargetType.Unit ||
          !bounces(parent.move, parent.source, parent.target.unit) ||
          reflecting.has(parent.source)
        ) {
          return;
        }

        const holder = parent.target.unit;
        const back = { type: MoveTargetType.Unit, unit: parent.source } as const;

        holder.triggerAbility(Abilities.MagicBounce);

        reflecting.add(holder);

        const steps = holder.checkMoveSteps(parent.move, back);

        holder.triggerMove(parent.move, back, steps);

        if (steps > 0) {
          holder.channel(parent.move, back, steps - 1);
        }

        reflecting.delete(holder);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        reflecting.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        reflecting.delete(event.source);
      }),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Flower_Gift_(Ability)
  // Cherrim's form change is not part of it here: the registry has no
  // forms yet, so the gift is the buff alone
  createAbility(Abilities.FlowerGift, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        (event.stat !== Stats.Attack && event.stat !== Stats.SpecialDefense) ||
        !isWeatherSunny(event.source)
      ) {
        return;
      }

      // The holder gives it to the whole team, itself included, so
      // the ally being asked about is rarely the one carrying it
      for (const ally of event.source.team.units) {
        if (ally.alive && ally.hasAbility(Abilities.FlowerGift)) {
          event.value *= FLOWER_GIFT_BOOST;
          return;
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Plus_(Ability)
  // The mainline pairs it with Minus; no registered species has
  // Minus, so a second Plus on the team is the only partner
  createAbility(Abilities.Plus, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat !== Stats.SpecialAttack || !event.source.hasAbility(Abilities.Plus)) {
        return;
      }

      for (const ally of event.source.team.units) {
        if (ally !== event.source && ally.alive && ally.hasAbility(Abilities.Plus)) {
          event.value *= PLUS_BOOST;
          return;
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Motor_Drive_(Ability)
  createAbility(
    Abilities.MotorDrive,
    (battle) =>
      new MergedLifecycle([
        // Pure query: grants the immunity, no side effects
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === Types.Electric &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.MotorDrive)
          ) {
            event.immune = true;
          }
        }),
        // Only a move that really failed against the holder pays out,
        // never a speculative immunity check
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.MotorDrive) &&
            parent.source.checkMoveType(parent.move, parent.target) === Types.Electric
          ) {
            parent.target.unit.triggerAbility(Abilities.MotorDrive);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.MotorDrive) {
            event.source.addStage(Stages.Speed, 1, {
              type: EffectType.Ability,
              ability: Abilities.MotorDrive,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Magma_Armor_(Ability)
  createLimberAbility(Abilities.MagmaArmor, [Statuses.Frozen]),

  // https://bulbapedia.bulbagarden.net/wiki/Suction_Cups_(Ability)
  // Read as an immunity rather than a hold on the switch, because a
  // forced switch deliberately ignores whether the target can escape
  createAbility(
    Abilities.SuctionCups,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            FORCED_SWITCH_MOVES.has(event.move) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.SuctionCups)
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            FORCED_SWITCH_MOVES.has(parent.move) &&
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit.hasAbility(Abilities.SuctionCups)
          ) {
            parent.target.unit.triggerAbility(Abilities.SuctionCups);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Moody_(Ability)
  // A per-turn effect with no turn to sit on, so it is paid as the
  // holder reaches for a move, the way residuals are
  createAbility(
    Abilities.Moody,
    (battle) =>
      new MergedLifecycle([
        ...onUnitActs(battle, (unit) => {
          if (unit.hasAbility(Abilities.Moody)) {
            unit.triggerAbility(Abilities.Moody);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Moody) {
            return;
          }

          const cause = {
            type: EffectType.Ability,
            ability: Abilities.Moody,
            unit: event.source,
          } as const;

          const raised = MOODY_STAGES[Math.floor(battle.random() * MOODY_STAGES.length)];
          // The drop never lands on the stage that just rose, so the
          // two never cancel each other out
          const rest = MOODY_STAGES.filter((stage) => stage !== raised);
          const lowered = rest[Math.floor(battle.random() * rest.length)];

          event.source.addStage(raised, MOODY_RISE, cause);
          event.source.addStage(lowered, -1, cause);
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Stamina_(Ability)
  createAbility(
    Abilities.Stamina,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            event.success &&
            (event.flags & DamageFlags.Indirect) === 0 &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.target.alive &&
            event.target.hasAbility(Abilities.Stamina)
          ) {
            event.target.triggerAbility(Abilities.Stamina);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Stamina) {
            event.source.addStage(Stages.Defense, 1, {
              type: EffectType.Ability,
              ability: Abilities.Stamina,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Super_Luck_(Ability)
  createAbility(Abilities.SuperLuck, (battle) =>
    battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
      // Additive, so it stacks with Focus Energy and the high-crit moves
      if (event.parent.source.hasAbility(Abilities.SuperLuck)) {
        event.value += 1;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Contrary_(Ability)
  createAbility(Abilities.Contrary, (battle) => {
    // Holders part-way through a flipped change: the flip is a fresh
    // call and would otherwise come straight back through here
    const inverting = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
        if (
          !event.success ||
          event.value === 0 ||
          inverting.has(event.source) ||
          !event.source.hasAbility(Abilities.Contrary)
        ) {
          return;
        }

        event.success = false;
        event.source.triggerAbility(Abilities.Contrary);

        inverting.add(event.source);
        event.source.addStage(event.stage, -event.value, event.cause);
        inverting.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        inverting.delete(event.source);
      }),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Storm_Drain_(Ability)
  // The mainline also pulls Water moves aimed elsewhere onto the
  // holder. Nothing here redirects a move away from the target it
  // committed to, so this is the immunity and the boost
  createAbility(
    Abilities.StormDrain,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === Types.Water &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.StormDrain)
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.StormDrain) &&
            parent.source.checkMoveType(parent.move, parent.target) === Types.Water
          ) {
            parent.target.unit.triggerAbility(Abilities.StormDrain);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.StormDrain) {
            event.source.addStage(Stages.SpecialAttack, 1, {
              type: EffectType.Ability,
              ability: Abilities.StormDrain,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Mirror_Armor_(Ability)
  // Two holders never volley a drop between them: the bounced call
  // carries the same cause, so the second one sees the drop as its
  // own and lets it land
  createAbility(Abilities.MirrorArmor, (battle) =>
    battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
      if (
        !event.success ||
        event.value >= 0 ||
        event.cause.type === EffectType.None ||
        event.cause.unit === event.source ||
        !event.source.hasAbility(Abilities.MirrorArmor)
      ) {
        return;
      }

      event.success = false;
      event.source.triggerAbility(Abilities.MirrorArmor);

      event.cause.unit.addStage(event.stage, event.value, event.cause);
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Prankster_(Ability)
  createAbility(Abilities.Prankster, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
      if (
        event.source.hasAbility(Abilities.Prankster) &&
        getMoveData(event.move).category === MoveCategories.Status
      ) {
        event.priority += 1;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Sand_Stream_(Ability)
  createDrizzleAbility(Abilities.SandStream, Weathers.Sandstorm),

  // https://bulbapedia.bulbagarden.net/wiki/Sap_Sipper_(Ability)
  createAbility(
    Abilities.SapSipper,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === Types.Grass &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.SapSipper)
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.SapSipper) &&
            parent.source.checkMoveType(parent.move, parent.target) === Types.Grass
          ) {
            parent.target.unit.triggerAbility(Abilities.SapSipper);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.SapSipper) {
            event.source.addStage(Stages.Attack, 1, {
              type: EffectType.Ability,
              ability: Abilities.SapSipper,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Honey_Gather_(Ability)
  // The mainline finds the jar after the fight, and a fight here has
  // no after to hand anything over in. So it is gathered on the way
  // in, once, and only if there is a hand to carry it
  createAbility(Abilities.HoneyGather, (battle) => {
    const gathered = new WeakSet<Unit>();

    return new MergedLifecycle([
      ...onUnitActs(battle, (unit) => {
        if (
          unit.hasAbility(Abilities.HoneyGather) &&
          !gathered.has(unit) &&
          hasFreeItemSlot(unit)
        ) {
          gathered.add(unit);
          unit.addItem(Items.Honey);

          // Cue only when the jar actually landed: the add can still
          // be vetoed by something else
          if (unit.items[Items.Honey] === true) {
            unit.triggerAbility(Abilities.HoneyGather);
          }
        }
      }),
    ]);
  }),

  // Marill
  // Doubles the stat rather than the blow, so anything reading the
  // Attack it has (Foul Play, a Power Trip) reads the doubled one
  // https://bulbapedia.bulbagarden.net/wiki/Huge_Power_(Ability)
  createAbility(Abilities.HugePower, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (event.stat === Stats.Attack && event.source.hasAbility(Abilities.HugePower)) {
        event.value *= 2;
      }
    }),
  ),
];

export default function setupGen2Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
