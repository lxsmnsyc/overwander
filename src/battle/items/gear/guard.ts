import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Items } from '../../../data/ids/items';
import { DamageFlags, MoveFlags } from '../../../data/ids/moves';
import { Weathers } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createHeldItem, holds } from '../__create';
import {
  FOCUS_BAND_CHANCE,
  QUICK_CLAW_CHANCE,
  QUICK_CLAW_PRIORITY,
  ROCKY_HELMET_SHARE,
  UMBRELLA_WEATHERS,
} from './worths';

/** What answers being hit, being outsped, or being about to go down */
export const setupQuickClaw = createHeldItem(Items.QuickClaw, (battle) => {
  /**
   * Whoever the claw is hurrying. It is rolled as the cast opens rather
   * than in the priority check, because the check is asked over and
   * over — by the AI rating a move it may never throw, and by the
   * engine working out the wind-up — and a claw that rolled fresh each
   * time would be a different item on every question
   */
  const hurried = new Set<Unit>();

  function calm(unit: Unit): void {
    hurried.delete(unit);
  }

  return new MergedLifecycle([
    battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
      if (holds(event.source, Items.QuickClaw) && battle.random() < QUICK_CLAW_CHANCE) {
        hurried.add(event.source);
        event.source.triggerItem(Items.QuickClaw);
      } else {
        calm(event.source);
      }
    }),

    battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
      if (hurried.has(event.source)) {
        event.priority += QUICK_CLAW_PRIORITY;
      }
    }),

    // The hurry is the cast's, so it goes when the cast does
    battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
      calm(event.source);
    }),
    battle.on(BattleEvents.UnitStopCast, EventPriority.Post, (event) => {
      calm(event.source);
    }),
    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      calm(event.source);
    }),
  ]);
});

// A Focus Band leaves its holder standing on 1 HP now and then, and is
// not spent doing it. Indirect damage is not a blow, so nothing a
// status or a recoil does can be endured this way
export const setupFocusBand = createHeldItem(Items.FocusBand, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
    if (
      event.target.alive &&
      !(event.flags & DamageFlags.Indirect) &&
      event.value >= event.target.health &&
      holds(event.target, Items.FocusBand) &&
      battle.random() < FOCUS_BAND_CHANCE
    ) {
      event.value = event.target.health - 1;

      event.target.triggerItem(Items.FocusBand);
    }
  }),
);

// A Rocky Helmet takes a share out of whoever put a hand on its holder.
// Indirect, so nothing about the blow — drain, recoil, an item of the
// attacker's own — reads it as a hit of its own
export const setupRockyHelmet = createHeldItem(Items.RockyHelmet, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      !event.success ||
      event.flags & DamageFlags.Indirect ||
      event.cause.type !== EffectType.Move ||
      event.cause.unit === event.target ||
      !holds(event.target, Items.RockyHelmet) ||
      !event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target))
    ) {
      return;
    }

    const attacker = event.cause.unit;

    if (!attacker.alive) {
      return;
    }

    event.target.triggerItem(Items.RockyHelmet);
    attacker.damage(
      { type: EffectType.Item, item: Items.RockyHelmet, unit: event.target },
      attacker,
      Math.max(1, Math.floor(attacker.checkStat(Stats.HP, 0) * ROCKY_HELMET_SHARE)),
      DamageFlags.Indirect,
    );
  }),
);

export const setupSafetyGoggles = createHeldItem(
  Items.SafetyGoggles,
  (battle) =>
    new MergedLifecycle([
      // Nothing powdered reaches the eyes behind them
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          !event.immune &&
          event.target.type === MoveTargetType.Unit &&
          holds(event.target.unit, Items.SafetyGoggles) &&
          getMoveData(event.move).flags & MoveFlags.Powder
        ) {
          event.immune = true;
        }
      }),

      // And nothing the weather is throwing about, either
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        if (
          event.success &&
          event.cause.type === EffectType.Weather &&
          holds(event.target, Items.SafetyGoggles)
        ) {
          event.success = false;
        }
      }),
    ]),
);

// A Utility Umbrella keeps the sun and the rain off its holder: the
// weather is still out there, but as far as this unit is concerned
// there is none
export const setupUtilityUmbrella = createHeldItem(Items.UtilityUmbrella, (battle) =>
  battle.on(BattleEvents.CheckUnitWeather, EventPriority.Post, (event) => {
    if (UMBRELLA_WEATHERS.has(event.weather) && holds(event.source, Items.UtilityUmbrella)) {
      event.weather = Weathers.None;
    }
  }),
);
