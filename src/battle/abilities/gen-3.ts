import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { TYPE_EFFECTIVENESS, TYPE_EFFECTIVENESS_FACTOR, Types } from '../../data/constants/types';
import { DamageFlags, MoveCategories, MoveFlags } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { Statuses, Weathers } from '../../data/ids/status';
import { Species, getBaseFormSpecies } from '../../data/ids/species';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import { STATUS_MOVES } from '../moves/status';
import { unitTarget } from '../utils';
import type Unit from '../unit';
import {
  createAbility,
  createAbsorbStageAbility,
  createClearBodyAbility,
  createHugePowerAbility,
  createPolarityAbility,
  createWeightAbility,
  movesFlagged,
} from './__create';

/** Whether the move's type comes to more than the ordinary amount. */
function isWeakTo(type: Types, target: Unit): boolean {
  let multiplier = 1;

  for (const defending of target.types) {
    const result = TYPE_EFFECTIVENESS[type][defending];

    // Explicit null check: TypeEffectiveness.Effective is 0
    if (result != null) {
      multiplier *= TYPE_EFFECTIVENESS_FACTOR[result];
    }
  }
  return multiplier > 1;
}

/** What a smith's hand is worth to a steel move. */
const STEELWORKER_SCALE = 1.5;

/** What a poison is worth to an Attack that feeds on it. */
const TOXIC_BOOST_SCALE = 1.5;

/** What one Battery is worth to everybody else's special moves. */
const BATTERY_BOOST = 1.3;

/** Either poison counts, the way either one chips. */
const POISONS_HELD = [Statuses.Poisoned, Statuses.BadlyPoisoned];

/** What a poison hands back instead of taking, per residual. */
const POISON_HEAL_FRACTION = 1 / 8;

/**
 * Which shape each sky puts a Castform into. A sky nobody listed,
 * a sandstorm included, leaves it in its plain one
 */
const FORECAST_SHAPES = new Map<Weathers, Species>([
  [Weathers.Sunny, Species.CastformSunny],
  [Weathers.ExtremeSunny, Species.CastformSunny],
  [Weathers.Rain, Species.CastformRainy],
  [Weathers.HeavyRain, Species.CastformRainy],
  [Weathers.Hail, Species.CastformSnowy],
  [Weathers.Snow, Species.CastformSnowy],
]);

/** Both poisons pay out, the way both would otherwise chip. */
const POISONS = new Set<Statuses>([Statuses.Poisoned, Statuses.BadlyPoisoned]);

/**
 * The mainline's Wind Rider also rises when a Tailwind starts behind
 * it. Nothing here blows one, so this is the half that has something
 * to answer: the wind aimed at it
 * https://bulbapedia.bulbagarden.net/wiki/Wind_Rider_(Ability)
 */
/**
 * Truant loafs on alternate turns in the mainline, and there are no
 * turns here to alternate between. So it loafs by the clock instead:
 * the move lock Hyper Beam leaves behind, laid on every move it
 * finishes rather than on one of them
 * https://bulbapedia.bulbagarden.net/wiki/Truant_(Ability)
 */
const setupAbilities = [
  createAbsorbStageAbility(Abilities.WindRider, Stages.Attack, movesFlagged(MoveFlags.Wind)),

  /**
   * Wonder Guard reads the chart rather than the attack pipeline: it
   * answers before a hit is resolved, and the only question it has is
   * whether that hit would have come to more than the ordinary
   * amount. A status move is not a hit and is not refused
   * https://bulbapedia.bulbagarden.net/wiki/Wonder_Guard_(Ability)
   */
  createAbility(Abilities.WonderGuard, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
      if (
        !event.immune &&
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.hasAbility(Abilities.WonderGuard) &&
        getMoveData(event.move).category !== MoveCategories.Status &&
        !isWeakTo(event.type, event.target.unit)
      ) {
        event.immune = true;
      }
    }),
  ),

  /**
   * Poison Heal answers the residual rather than the status: the
   * poison lands, it stays, and everything else it costs (the AI
   * refusing to poison at all, a cure spending a move) reads the same
   * as ever. Only the health it takes turns around
   * https://bulbapedia.bulbagarden.net/wiki/Poison_Heal_(Ability)
   */
  createAbility(
    Abilities.PoisonHeal,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitTriggerStatus, EventPriority.Pre, (event) => {
          if (!POISONS.has(event.status) || !event.source.hasAbility(Abilities.PoisonHeal)) {
            return;
          }
          // The chip never happens: the residual is turned away here
          // and paid back instead
          event.disabled = true;

          const holder = event.source;

          holder.triggerAbility(Abilities.PoisonHeal);
          holder.heal(
            { type: EffectType.Ability, ability: Abilities.PoisonHeal, unit: holder },
            holder,
            holder.checkStat(Stats.HP, 0) * POISON_HEAL_FRACTION,
            0,
          );
        }),
        // Poisoning it is worse than a wasted cast: it is a heal on a
        // timer, so the AI is refused it outright
        battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
          const status = STATUS_MOVES[event.move];

          // Explicit null check: the first Statuses enum member is 0
          if (
            event.usable &&
            status != null &&
            POISONS.has(status) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.PoisonHeal)
          ) {
            event.usable = false;
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/White_Smoke_(Ability)
  createClearBodyAbility(Abilities.WhiteSmoke),

  /**
   * Color Change takes the type of whatever landed on it, and takes
   * it whole: the holder ends up that one type rather than gaining
   * it, so a Kecleon struck by a Water move resists what Water
   * resists from then on
   * https://bulbapedia.bulbagarden.net/wiki/Color_Change_(Ability)
   */
  createAbility(Abilities.ColorChange, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        event.cause.type !== EffectType.Move ||
        event.cause.unit === event.target ||
        !event.target.hasAbility(Abilities.ColorChange)
      ) {
        return;
      }
      const holder = event.target;
      const type = event.cause.unit.checkMoveType(event.cause.move, unitTarget(holder));

      // Already wearing it, and nothing to show
      if (holder.types.size === 1 && holder.types.has(type)) {
        return;
      }
      holder.triggerAbility(Abilities.ColorChange);

      for (const held of [...holder.types]) {
        holder.removeType(held);
      }
      holder.addType(type);
    }),
  ),

  /**
   * Stall makes its holder act last within its priority bracket. A
   * bracket here is a cast time rather than a queue position, so the
   * one thing it can mean is a slower wind-up
   * https://bulbapedia.bulbagarden.net/wiki/Stall_(Ability)
   */
  createAbility(Abilities.Stall, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.Stall)) {
        event.priority -= 1;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Toxic_Boost_(Ability)
  createAbility(Abilities.ToxicBoost, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        event.stat === Stats.Attack &&
        event.source.hasAbility(Abilities.ToxicBoost) &&
        POISONS_HELD.some((status) => event.source.status[status] != null)
      ) {
        event.value *= TOXIC_BOOST_SCALE;
      }
    }),
  ),

  /**
   * Battery lifts what everybody else on the side throws, never its
   * own: a pair of them stand behind each other rather than behind
   * themselves
   * https://bulbapedia.bulbagarden.net/wiki/Battery_(Ability)
   */
  createAbility(Abilities.Battery, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (event.power == null || getMoveData(event.move).category !== MoveCategories.Special) {
        return;
      }

      for (const ally of event.source.team.units) {
        if (ally !== event.source && ally.alive && ally.hasAbility(Abilities.Battery)) {
          event.power *= BATTERY_BOOST;
          return;
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Heavy_Metal_(Ability)
  createWeightAbility(Abilities.HeavyMetal, 2),

  // https://bulbapedia.bulbagarden.net/wiki/Pure_Power_(Ability)
  createHugePowerAbility(Abilities.PurePower),

  // https://bulbapedia.bulbagarden.net/wiki/Minus_(Ability)
  createPolarityAbility(Abilities.Minus),

  /**
   * Normalize rewrites the type on the way out rather than at the
   * moment of damage, so everything downstream agrees: what it is
   * weak to, what shrugs it off, and the same-type bonus it now
   * always gets on a Normal move
   * https://bulbapedia.bulbagarden.net/wiki/Normalize_(Ability)
   */
  createAbility(Abilities.Normalize, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.Normalize)) {
        event.type = Types.Normal;
      }
    }),
  ),

  createAbility(Abilities.Truant, (battle) =>
    battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.Truant)) {
        event.source.addStatus(Statuses.Recharging, {
          type: EffectType.Ability,
          ability: Abilities.Truant,
          unit: event.source,
        });
      }
    }),
  ),
  /**
   * Forecast dresses its holder in whichever shape the sky calls for.
   * Only a Castform has shapes, so anybody else who picks the ability
   * up carries a dead one
   * https://bulbapedia.bulbagarden.net/wiki/Forecast_(Ability)
   */
  createAbility(Abilities.Forecast, (battle) => {
    function dress(unit: Unit): void {
      if (
        !unit.hasAbility(Abilities.Forecast) ||
        getBaseFormSpecies(unit.species) !== Species.Castform
      ) {
        return;
      }

      const shape = FORECAST_SHAPES.get(unit.checkWeather()) ?? Species.Castform;

      if (unit.species === shape) {
        return;
      }
      unit.triggerAbility(Abilities.Forecast);
      // The shape carries the type with it: every form shares one set
      // of base stats, so nothing else about the unit moves
      unit.setSpecies(shape);
    }

    function dressAll(): void {
      for (const unit of battle.units()) {
        dress(unit);
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.SetWeather, EventPriority.Post, dressAll),
      battle.on(BattleEvents.TeamSetWeather, EventPriority.Post, dressAll),
      // A Castform arriving under a sky that is already out
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        dress(event.source);
      }),
    ]);
  }),
  /**
   * Steelworker reads the type the move is going out as rather than
   * the one the table lists, so a Normalize or a plate that rewrote
   * it is answered on what actually lands
   * https://bulbapedia.bulbagarden.net/wiki/Steelworker_(Ability)
   */
  createAbility(Abilities.Steelworker, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(Abilities.Steelworker) &&
        event.source.checkMoveType(event.move, event.target) === Types.Steel
      ) {
        event.power *= STEELWORKER_SCALE;
      }
    }),
  ),
];

export default function setupGen3Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
