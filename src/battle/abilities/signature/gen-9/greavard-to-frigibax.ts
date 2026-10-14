import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import { MAX_STAGE, Stages, Stats } from '../../../../data/constants/stats';
import Abilities from '../../../../data/ids/abilities';
import { DamageFlags, Moves } from '../../../../data/ids/moves';
import { Statuses } from '../../../../data/ids/status';
import { RECHARGE_MOVES } from '../../../../data/moves/recharge';
import { BattleEvents, EffectType, MoveTargetType } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import turns from '../../../turn';
import type Unit from '../../../unit';
import { isWeatherHail } from '../../../weather';
import onUnitActs from '../../../acts';
import { countHeldItems, stealableItem } from '../../../items/held';
import { createAbility, getAbilityHolders } from '../../__create';
import { allyHolder, createDamageTaken, createTimedMarks, createUnitState } from '../__create';

/** How long the snow has to fall for each stage Snow Hoard banks */
export const SNOW_HOARD_INTERVAL = turns(2);

/** The most Attack Snow Hoard banks on its own */
export const SNOW_HOARD_CAP = 3;

/** The share of an HP cost Fillet Thrift still pays */
export const FILLET_THRIFT_SCALE = 1 / 2;

/** The moves that charge their user HP to throw, and leave it standing */
const HP_PRICED_MOVES = new Set<Moves>([
  Moves.FilletAway,
  Moves.ShedTail,
  Moves.Substitute,
  Moves.BellyDrum,
  Moves.Curse,
  Moves.ClangorousSoul,
  Moves.MindBlown,
  Moves.SteelBeam,
  Moves.Chloroblast,
]);

/** The share of its HP below which a teammate is swallowed */
export const MOUTHFUL_THRESHOLD = 1 / 3;

/** How long a swallowed teammate stays out of reach */
export const MOUTHFUL_DURATION = turns(2);

/** What a swallowed teammate gets back, as a share of its HP */
export const MOUTHFUL_HEAL = 1 / 4;

/** What a sheltered Back Seat Orders adds to its teammates' moves */
export const BACK_SEAT_ORDERS_SCALE = 1.2;

/** The stages Glaive Guard lends each defence while it is exposed */
export const GLAIVE_GUARD_STAGES = 2;

/** The moves that leave their user open once they are over */
const EXPOSING_MOVES = new Set<Moves>([
  Moves.GlaiveRush,
  Moves.Outrage,
  Moves.Thrash,
  Moves.PetalDance,
  Moves.RagingFury,
]);

const GUARDED_STAGES = new Set<Stages>([Stages.Defense, Stages.SpecialDefense]);

/**
 * Greavard, Cetoddle, Veluza, Dondozo, Tatsugiri and Frigibax: the
 * cold north of Paldea and what lives off what others leave behind
 */
const greavardToFrigibax = [
  // Greavard: it digs up what the fallen were carrying
  createAbility(Abilities.GraveDigger, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const fallen = event.source;

      for (const digger of fallen.team.units) {
        if (
          digger === fallen ||
          !digger.alive ||
          !digger.hasAbility(Abilities.GraveDigger) ||
          countHeldItems(digger) > 0
        ) {
          continue;
        }

        const item = stealableItem(fallen);

        if (item == null) {
          return;
        }

        digger.triggerAbility(Abilities.GraveDigger);
        fallen.removeItem(item, {
          type: EffectType.Ability,
          ability: Abilities.GraveDigger,
          unit: digger,
        });
        digger.addItem(item);
        return;
      }
    }),
  ),

  // Cetoddle: it stores up the snow while it falls. Only time under
  // the snow counts, so a gap in the weather starts the count over
  createAbility(Abilities.SnowHoard, (battle) => {
    const { state, lifecycles } = createUnitState<{ waited: number; banked: number }>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
        for (const holder of getAbilityHolders(battle, Abilities.SnowHoard)) {
          if (!holder.alive || !holder.hasAbility(Abilities.SnowHoard)) {
            continue;
          }

          const hoard = state.get(holder) ?? { waited: 0, banked: 0 };

          state.set(holder, hoard);
          if (!isWeatherHail(holder) || hoard.banked >= SNOW_HOARD_CAP) {
            hoard.waited = 0;
            continue;
          }

          hoard.waited += event.duration;
          if (hoard.waited < SNOW_HOARD_INTERVAL) {
            continue;
          }
          hoard.waited -= SNOW_HOARD_INTERVAL;

          const before = holder.stages[Stages.Attack];

          holder.triggerAbility(Abilities.SnowHoard);
          holder.addStage(Stages.Attack, 1, {
            type: EffectType.Ability,
            ability: Abilities.SnowHoard,
            unit: holder,
          });
          // A refused or capped stage is not banked
          hoard.banked += Math.max(0, holder.stages[Stages.Attack] - before);
        }
      }),
    ]);
  }),

  // Veluza: it sheds its own flesh cheaply
  createAbility(Abilities.FilletThrift, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const cause = event.cause;

      if (
        (event.flags & DamageFlags.Cost) !== 0 &&
        cause.type === EffectType.Move &&
        cause.unit === event.target &&
        HP_PRICED_MOVES.has(cause.move) &&
        event.target.hasAbility(Abilities.FilletThrift)
      ) {
        event.value *= FILLET_THRIFT_SCALE;
      }
    }),
  ),

  // Dondozo: a teammate in trouble goes into its mouth for a moment
  // and comes out mended. Once each, for the whole fight
  createAbility(Abilities.Mouthful, (battle) => {
    const damage = createDamageTaken(battle);
    const inside = createTimedMarks(battle);
    const swallowed = new Set<Unit>();

    return new MergedLifecycle([
      ...damage.lifecycles,
      ...inside.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const mate = event.target;
        const taken = damage.taken(event);

        if (taken == null || taken <= 0 || !mate.alive || swallowed.has(mate)) {
          return;
        }

        const line = mate.checkStat(Stats.HP, 0) * MOUTHFUL_THRESHOLD;

        if (mate.health >= line || mate.health + taken < line) {
          return;
        }

        const holder = allyHolder(battle, mate, Abilities.Mouthful);

        if (holder == null) {
          return;
        }

        swallowed.add(mate);
        holder.triggerAbility(Abilities.Mouthful);
        inside.mark(mate, MOUTHFUL_DURATION);
        holder.heal(
          { type: EffectType.Ability, ability: Abilities.Mouthful, unit: holder },
          mate,
          mate.checkStat(Stats.HP, 0) * MOUTHFUL_HEAL,
          0,
        );
      }),
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          inside.has(event.target.unit)
        ) {
          event.immune = true;
        }
      }),
      // A spread move never names it, so the blow is turned away too
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        if (
          event.success &&
          inside.has(event.target) &&
          (event.flags & DamageFlags.Indirect) === 0 &&
          event.cause.type === EffectType.Move &&
          event.cause.unit !== event.target
        ) {
          event.success = false;
        }
      }),
    ]);
  }),

  // Tatsugiri: it calls the shots from somewhere safe
  createAbility(Abilities.BackSeatOrders, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (event.power == null) {
        return;
      }

      for (const holder of getAbilityHolders(battle, Abilities.BackSeatOrders)) {
        if (
          holder !== event.source &&
          holder.alive &&
          holder.team === event.source.team &&
          (holder.status[Statuses.Substituted] != null ||
            holder.status[Statuses.Protected] != null) &&
          holder.hasAbility(Abilities.BackSeatOrders)
        ) {
          event.power *= BACK_SEAT_ORDERS_SCALE;
          return;
        }
      }
    }),
  ),

  // Frigibax: the fin comes up over the opening its reckless moves
  // leave. Read rather than written, so nothing has to be taken back
  createAbility(Abilities.GlaiveGuard, (battle) => {
    const guarded = new Set<Unit>();

    function guard(unit: Unit): void {
      if (!guarded.has(unit) && unit.alive && unit.hasAbility(Abilities.GlaiveGuard)) {
        guarded.add(unit);
        unit.triggerAbility(Abilities.GlaiveGuard);
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
        if (!battle.estimating && event.steps === 0 && EXPOSING_MOVES.has(event.move)) {
          guard(event.source);
        }
      }),
      battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
        const cause = event.cause;

        if (
          event.status === Statuses.Recharging &&
          cause.type === EffectType.Move &&
          RECHARGE_MOVES.has(cause.move)
        ) {
          guard(event.source);
        }
      }),
      ...onUnitActs(battle, (unit) => {
        guarded.delete(unit);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        guarded.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        guarded.delete(event.source);
      }),
      battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
        if (
          GUARDED_STAGES.has(event.stage) &&
          guarded.has(event.source) &&
          event.source.hasAbility(Abilities.GlaiveGuard)
        ) {
          event.value = Math.min(MAX_STAGE, event.value + GLAIVE_GUARD_STAGES);
        }
      }),
    ]);
  }),
];

export default greavardToFrigibax;
