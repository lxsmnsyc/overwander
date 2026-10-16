import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses, Weathers } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import {
  createAbility,
  createBeastBoostAbility,
  createLevitateAbility,
  createSteelworkerAbility,
  createTypeShiftAbility,
} from './__create';

/** What Dragonize adds to the Normal moves it turns Dragon */
export const DRAGONIZE_SCALE = 1.2;

/** What is left of a blow Piercing Drill drives through a guard */
export const PIERCING_DRILL_SCALE = 1 / 4;

/** What Aura Guard leaves of a blow that touches it */
export const AURA_GUARD_SCALE = 0.5;

/** What Fire Mane makes of its Fire moves */
export const FIRE_MANE_SCALE = 1.5;

const SUNNY = new Set<Weathers>([Weathers.Sunny, Weathers.ExtremeSunny]);

/**
 * Counts how many windows are open over each unit, so nested move
 * events (a move that calls another) close in the right order
 */
function createWindows(): {
  open(event: object, unit: Unit): void;
  close(event: object): void;
  has(unit: Unit): boolean;
} {
  const counts = new Map<Unit, number>();
  const opened = new WeakMap<object, Unit>();

  return {
    open(event, unit) {
      opened.set(event, unit);
      counts.set(unit, (counts.get(unit) ?? 0) + 1);
    },
    close(event) {
      const unit = opened.get(event);

      if (unit == null) {
        return;
      }
      opened.delete(event);

      const count = counts.get(unit) ?? 0;

      if (count <= 1) {
        counts.delete(unit);
      } else {
        counts.set(unit, count - 1);
      }
    },
    has: (unit) => counts.has(unit),
  };
}

/** The Mega Evolutions Lumiose City brought, and the abilities they wear */
const setupAbilities = [
  /**
   * Mega Meganium: its own moves are thrown under a sun that is not
   * there. The sky reads sunny for the holder only while one of its
   * moves resolves (or the AI weighs one), so whatever a move asks of
   * the sun answers, and nothing outside its moves (a sandstorm's
   * chip, Chlorophyll) is touched
   * https://bulbapedia.bulbagarden.net/wiki/Mega_Sol_(Ability)
   */
  createAbility(Abilities.MegaSol, (battle) => {
    const lit = createWindows();

    function open(event: { source: Unit }): void {
      if (event.source.hasAbility(Abilities.MegaSol)) {
        lit.open(event, event.source);
      }
    }

    function close(event: object): void {
      lit.close(event);
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitWeather, EventPriority.Post, (event) => {
        if (
          !SUNNY.has(event.weather) &&
          lit.has(event.source) &&
          event.source.hasAbility(Abilities.MegaSol)
        ) {
          event.weather = Weathers.Sunny;
        }
      }),
      battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Prepare, open),
      battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Cleanup, close),
      battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Prepare, open),
      battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Cleanup, close),
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Prepare, open),
      battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Cleanup, close),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Prepare, open),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, close),
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Prepare, open),
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Cleanup, close),
      battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Prepare, open),
      battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Cleanup, close),
      // A Solar Beam's charge is asked before the move goes off, on an
      // event with no cleanup bracket. Abilities register after the
      // moves, so this Post closes after Solar Beam's own Post has read
      battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Pre, open),
      battle.on(BattleEvents.CheckUnitMoveSteps, EventPriority.Post, close),
    ]);
  }),

  // Mega Feraligatr: Pixilate in Dragon
  createTypeShiftAbility(Abilities.Dragonize, Types.Normal, Types.Dragon, DRAGONIZE_SCALE),

  /**
   * Mega Excadrill: its contact moves go through a guard the way Unseen
   * Fist's do, but only 1/4 of the blow gets through. The cut is paid
   * only where this ability was what walked through, and only on the
   * reach that asked
   * https://bulbapedia.bulbagarden.net/wiki/Piercing_Drill_(Ability)
   */
  createAbility(Abilities.PiercingDrill, (battle) => {
    const reaching = createWindows();
    const pierced = new Map<Unit, Set<Unit>>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Prepare, (event) => {
        reaching.open(event, event.source);
      }),
      battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Cleanup, (event) => {
        reaching.close(event);

        if (!reaching.has(event.source)) {
          pierced.delete(event.source);
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveGuard, EventPriority.Post, (event) => {
        const { source, target } = event;

        if (
          event.walks ||
          target.type !== MoveTargetType.Unit ||
          !source.hasAbility(Abilities.PiercingDrill) ||
          !source.checkMoveContact(event.move, target)
        ) {
          return;
        }
        event.walks = true;

        if (reaching.has(source)) {
          let through = pierced.get(source);

          if (through == null) {
            through = new Set();
            pierced.set(source, through);
          }
          through.add(target.unit);
          source.triggerAbility(Abilities.PiercingDrill);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const { source, target } = event.parent;

        if (pierced.get(source)?.has(target)) {
          event.value *= PIERCING_DRILL_SCALE;
        }
      }),
    ]);
  }),

  // Mega Eelektross: it floats like Levitate, and feeds on a knockout
  // like Beast Boost
  createLevitateAbility(Abilities.Eelevate),
  createBeastBoostAbility(Abilities.Eelevate),

  /**
   * Mega Scovillain: any move that hurts it burns whoever threw it, every
   * time. The burn lands on the attacker, which the cue cannot carry, so
   * it stays inline
   * https://bulbapedia.bulbagarden.net/wiki/Spicy_Spray_(Ability)
   */
  createAbility(Abilities.SpicySpray, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const { cause, target } = event;

      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        cause.type !== EffectType.Move ||
        cause.unit === target ||
        !cause.unit.alive ||
        cause.unit.status[Statuses.Burned] != null ||
        !target.hasAbility(Abilities.SpicySpray)
      ) {
        return;
      }
      target.triggerAbility(Abilities.SpicySpray);
      cause.unit.addStatus(Statuses.Burned, {
        type: EffectType.Ability,
        ability: Abilities.SpicySpray,
        unit: target,
      });
    }),
  ),

  // Lucario's second Mega: Fluffy's soft half, a touching blow lands at 1/2
  // https://bulbapedia.bulbagarden.net/wiki/Aura_Guard_(Ability)
  createAbility(Abilities.AuraGuard, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const { move, source, target } = event.parent;

      if (
        target.hasAbility(Abilities.AuraGuard) &&
        source.checkMoveContact(move, { type: MoveTargetType.Unit, unit: target })
      ) {
        event.value *= AURA_GUARD_SCALE;
      }
    }),
  ),

  // Mega Pyroar: its Fire moves burn hotter, always
  // https://bulbapedia.bulbagarden.net/wiki/Fire_Mane_(Ability)
  createSteelworkerAbility(Abilities.FireMane, Types.Fire, FIRE_MANE_SCALE),
];

export default function setupLegendsZAAbilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
