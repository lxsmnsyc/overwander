import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, type EffectCause, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { isCentered } from '../../status/centered';
import turns from '../../turn';
import type Unit from '../../unit';
import {
  countHeldItems,
  hasFreeItemSlot,
  isConsumable,
  stealableItem,
  unitTarget,
} from '../../utils';
import { createAbility, createRodAbility } from '../__create';
import { createDamageTaken, createUnitState, isSingleTargetMove, worstHurtMate } from './__create';

/** The share of a Fairy move's damage the horn passes to a teammate */
export const MENDING_HORN_SHARE = 1 / 2;

/** Which landed move on an enemy turns the venom */
export const SLOW_VENOM_INTERVAL = 3;

/** What the raised leek leaves of the next blow */
export const LEEK_SHIELD_SCALE = 0.6;

/** How long a fallen Corsola's husk keeps drawing fire */
export const CORAL_HUSK_DURATION = turns(3);

/** How far a blocked attacker's Defense falls */
export const BLOCKADE_STAGES = 2;

/** What each enemy that struck the gravestone pays when it falls */
export const CARVED_GRUDGE_FRACTION = 1 / 8;

function abilityCause(ability: Abilities, unit: Unit): EffectCause {
  return { type: EffectType.Ability, ability, unit };
}

/** A standing teammate with nothing in its hands and room for something */
function emptyHandedMate(unit: Unit): Unit | undefined {
  for (const mate of unit.team.units) {
    if (mate !== unit && mate.alive && countHeldItems(mate) === 0 && hasFreeItemSlot(mate)) {
      return mate;
    }
  }

  return undefined;
}

/**
 * Galar's regional forms: the Viking cat, the fairy pony, the slow
 * bites, the leek knight, the coral ghost, the punk raccoon, the cold
 * daruma and the cursed tablet
 */
const setupAbilities = [
  // Galarian Meowth: whatever a beaten enemy carried is plunder, and a
  // full belt hands it on to whoever has room
  createAbility(Abilities.WarSpoils, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const fallen = event.source;
      const victor = event.attacker;

      if (
        victor === fallen ||
        !victor.alive ||
        victor.team.alliance === fallen.team.alliance ||
        !victor.hasAbility(Abilities.WarSpoils)
      ) {
        return;
      }

      const item = stealableItem(fallen);
      const taker = hasFreeItemSlot(victor) ? victor : emptyHandedMate(victor);

      if (item == null || taker == null) {
        return;
      }

      victor.triggerAbility(Abilities.WarSpoils);
      fallen.removeItem(item, abilityCause(Abilities.WarSpoils, victor), isConsumable(item));
      taker.addItem(item);
    }),
  ),

  // Galarian Ponyta: the horn heals with what the fairy magic takes
  createAbility(Abilities.MendingHorn, (battle) => {
    const { taken, lifecycles } = createDamageTaken(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;
        const dealt = taken(event);

        if (
          !event.success ||
          dealt == null ||
          dealt <= 0 ||
          (event.flags & DamageFlags.Indirect) !== 0 ||
          cause.type !== EffectType.Move ||
          cause.unit === event.target ||
          !cause.unit.hasAbility(Abilities.MendingHorn) ||
          cause.unit.checkMoveType(cause.move, unitTarget(event.target)) !== Types.Fairy
        ) {
          return;
        }

        const horn = cause.unit;
        const mate = worstHurtMate(horn);

        if (mate == null || mate.health >= mate.checkStat(Stats.HP, 0)) {
          return;
        }

        horn.triggerAbility(Abilities.MendingHorn);
        horn.heal(abilityCause(Abilities.MendingHorn, horn), mate, dealt * MENDING_HORN_SHARE, 0);
      }),
    ]);
  }),

  // Galarian Slowpoke: the shuckle venom in its tail takes a while to
  // reach anybody, so it is the third bite on the same enemy that turns
  createAbility(Abilities.SlowVenom, (battle) => {
    // Per holder, the moves it has landed on each enemy since the last turn
    const { state, lifecycles } = createUnitState<Map<Unit, number>>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          target.team.alliance === source.team.alliance ||
          !source.hasAbility(Abilities.SlowVenom)
        ) {
          return;
        }

        let bitten = state.get(source);

        if (bitten == null) {
          bitten = new Map();
          state.set(source, bitten);
        }

        const landed = (bitten.get(target) ?? 0) + 1;

        if (landed < SLOW_VENOM_INTERVAL) {
          bitten.set(target, landed);
          return;
        }

        bitten.delete(target);
        source.triggerAbility(Abilities.SlowVenom);
        target.addStatus(Statuses.BadlyPoisoned, abilityCause(Abilities.SlowVenom, source));
      }),
    ]);
  }),

  // Galarian Farfetch'd: the leek comes up as a shield after every
  // swing. Raised after its own blow resolves, so the blow that raises
  // it is never the blow it blocks
  createAbility(Abilities.LeekShield, (battle) => {
    const { state, lifecycles } = createUnitState<true>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;
        const target = parent.target;

        if (parent.source === target || !state.has(target)) {
          return;
        }

        event.value *= LEEK_SHIELD_SCALE;

        if (!(parent.flags & MoveAttackFlags.Simulated)) {
          state.delete(target);
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          event.success &&
          source.alive &&
          event.target !== source &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          source.hasAbility(Abilities.LeekShield)
        ) {
          if (!state.has(source)) {
            source.triggerAbility(Abilities.LeekShield);
          }
          state.set(source, true);
        }
      }),
    ]);
  }),

  // Galarian Corsola: the coral it leaves behind keeps drawing the
  // enemy's aim. A fallen unit can take no blow, so what the husk draws
  // fails on it: the cover is that nothing reaches the team behind it
  createAbility(Abilities.CoralHusk, (battle) => {
    // Each standing husk and how long it has left
    const husks = new Map<Unit, number>();

    function huskOf(team: Unit['team']): Unit | undefined {
      for (const husk of husks.keys()) {
        if (husk.team === team && husk.hasAbility(Abilities.CoralHusk)) {
          return husk;
        }
      }

      return undefined;
    }

    /** Turns a cast in progress onto a husk, the way Follow Me turns one */
    function turn(caster: Unit): void {
      const casting = caster.casting;

      if (casting == null || casting.target.type !== MoveTargetType.Unit) {
        return;
      }

      const drawn = caster.checkMoveRedirect(casting.move, casting.target);

      if (
        drawn.type === MoveTargetType.Unit &&
        drawn.unit !== casting.target.unit &&
        husks.has(drawn.unit)
      ) {
        caster.updateCast({ target: drawn });
      }
    }

    // A cast still aimed at the husk when it crumbles is dropped, the
    // way the faint itself drops one
    function crumble(husk: Unit): void {
      husks.delete(husk);

      for (const unit of battle.units(husk.team.alliance)) {
        const aimed = unit.casting?.target;

        if (aimed?.type === MoveTargetType.Unit && aimed.unit === husk) {
          unit.stopCast();
        }
      }
    }

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [husk, left] of [...husks]) {
        const next = left - event.duration;

        if (next <= 0) {
          crumble(husk);
        } else {
          husks.set(husk, next);
        }
      }

      if (husks.size === 0) {
        clock.stop();
      }
    });

    clock.stop();

    return new MergedLifecycle([
      clock,
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        const husk = event.source;

        if (!husk.hasAbility(Abilities.CoralHusk)) {
          return;
        }

        husks.set(husk, CORAL_HUSK_DURATION);
        clock.start();
        husk.triggerAbility(Abilities.CoralHusk);

        for (const enemy of battle.units(husk.team.alliance)) {
          turn(enemy);
        }
      }),
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        if (husks.size > 0) {
          turn(event.source);
        }
      }),
      // A Follow Me's centre and Snipe Shot both keep their aim, as
      // they do against every other draw
      battle.on(BattleEvents.CheckUnitMoveRedirect, EventPriority.Post, (event) => {
        const aimed = event.redirect;

        if (
          husks.size === 0 ||
          aimed.type !== MoveTargetType.Unit ||
          aimed.unit.team.alliance === event.source.team.alliance ||
          event.move === Moves.SnipeShot ||
          !isSingleTargetMove(event.move) ||
          isCentered(aimed.unit)
        ) {
          return;
        }

        const husk = huskOf(aimed.unit.team);

        if (husk != null && husk !== aimed.unit) {
          event.redirect = unitTarget(husk);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        const aimed = event.target;

        if (
          aimed.type === MoveTargetType.Unit &&
          husks.has(aimed.unit) &&
          aimed.unit.team.alliance !== event.source.team.alliance
        ) {
          event.immune = true;
        }
      }),
      battle.on(BattleEvents.UnitRevives, EventPriority.Post, (event) => {
        husks.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        husks.delete(event.source);
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        husks.delete(event.source);
      }),
    ]);
  }),

  // Galarian Zigzagoon: a body set square in the road pushes back on
  // whoever runs into it, as long as it is braced rather than mid-move.
  // Read before the blow, since a flinch can end its cast on the way in
  createAbility(Abilities.Blockade, (battle) => {
    const braced = new WeakSet<object>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
        const target = event.target;

        if (
          target.hasAbility(Abilities.Blockade) &&
          target.casting == null &&
          target.channeling == null
        ) {
          braced.add(event);
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !braced.has(event) ||
          !event.success ||
          !target.alive ||
          source === target ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.checkMoveContact(event.move, unitTarget(target))
        ) {
          return;
        }

        target.triggerAbility(Abilities.Blockade);
        source.addStage(Stages.Defense, -BLOCKADE_STAGES, abilityCause(Abilities.Blockade, target));
      }),
    ]);
  }),

  // Galarian Darumaka: a body that cold soaks up the ice meant for its
  // team and runs hotter for it. A rod in all but name. The rod factory
  // is typed without the id the list reads, though it carries one
  Object.assign(createRodAbility(Abilities.ColdSink, Stages.Attack, Types.Ice), {
    ability: Abilities.ColdSink,
  }),

  // Galarian Yamask: the tablet remembers every hand that struck it.
  // Taken as the damage lands rather than after the blow, since the
  // last blow is the one that fells it
  createAbility(Abilities.CarvedGrudge, (battle) => {
    const struck = new Map<Unit, Set<Unit>>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          struck.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        const cause = event.cause;
        const target = event.target;

        if (
          cause.type !== EffectType.Move ||
          (event.flags & DamageFlags.Indirect) !== 0 ||
          !target.alive ||
          cause.unit.team.alliance === target.team.alliance ||
          !target.hasAbility(Abilities.CarvedGrudge)
        ) {
          return;
        }

        let hands = struck.get(target);

        if (hands == null) {
          hands = new Set();
          struck.set(target, hands);
        }
        hands.add(cause.unit);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        const tablet = event.source;
        const hands = struck.get(tablet);

        struck.delete(tablet);

        if (hands == null || !tablet.hasAbility(Abilities.CarvedGrudge)) {
          return;
        }

        tablet.triggerAbility(Abilities.CarvedGrudge);

        const cause = abilityCause(Abilities.CarvedGrudge, tablet);

        for (const enemy of hands) {
          if (enemy.alive) {
            tablet.damage(
              cause,
              enemy,
              enemy.checkStat(Stats.HP, 0) * CARVED_GRUDGE_FRACTION,
              DamageFlags.Indirect | DamageFlags.HealthScaled,
            );
          }
        }
      }),
    ]);
  }),
];

export default setupAbilities;
