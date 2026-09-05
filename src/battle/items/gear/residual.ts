import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { TYPE_EFFECTIVENESS, TypeEffectiveness, Types } from '../../../data/constants/types';
import { Items } from '../../../data/ids/items';
import { DamageFlags } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { hasFreeItemSlot, onUnitActs, unitTarget } from '../../utils';
import { createHeldItem, holds } from '../__create';
import {
  BLACK_SLUDGE_SHARE,
  FLOAT_STONE_WEIGHT,
  IRON_BALL_SPEED,
  LAGGING_TAIL_PRIORITY,
  LEFTOVERS_SHARE,
  STICKY_BARB_SHARE,
} from './worths';

/** The gear paid out as its holder reaches for a move */
/**
 * A residual item, paid out as its holder reaches for a move rather
 * than on a clock
 */
export function createResidualGear(
  item: Items,
  effect: (unit: Unit, maxHealth: number) => void,
): (battle: Battle) => void {
  return createHeldItem(
    item,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (unit.alive && holds(unit, item)) {
            effect(unit, unit.checkStat(Stats.HP, 0));
          }
        }),
      ),
  );
}

export function heal(unit: Unit, item: Items, amount: number): void {
  unit.triggerItem(item);
  unit.heal({ type: EffectType.Item, item, unit }, unit, Math.max(1, Math.floor(amount)), 0);
}

export function bite(unit: Unit, item: Items, amount: number): void {
  unit.damage(
    { type: EffectType.Item, item, unit },
    unit,
    Math.max(1, Math.floor(amount)),
    DamageFlags.Indirect | DamageFlags.HealthScaled,
  );
}

export const setupLeftovers = createResidualGear(Items.Leftovers, (unit, maxHealth) => {
  if (unit.health < maxHealth) {
    heal(unit, Items.Leftovers, maxHealth * LEFTOVERS_SHARE);
  }
});

// Rubbish is food to the ones that live on it and poison to everybody
// else
export const setupBlackSludge = createResidualGear(Items.BlackSludge, (unit, maxHealth) => {
  if (!unit.types.has(Types.Poison)) {
    bite(unit, Items.BlackSludge, maxHealth * BLACK_SLUDGE_SHARE);
  } else if (unit.health < maxHealth) {
    heal(unit, Items.BlackSludge, maxHealth * LEFTOVERS_SHARE);
  }
});

// A barb sticks in whoever is carrying it, Poison type or not
export const setupStickyBarbResidual = createResidualGear(Items.StickyBarb, (unit, maxHealth) => {
  bite(unit, Items.StickyBarb, maxHealth * STICKY_BARB_SHARE);
});

/**
 * A Sticky Barb changes hands on contact, if the hand it caught is
 * empty. Nobody is holding it on purpose, so it goes to whoever
 * touched it rather than costing them anything
 */
export const setupStickyBarbTransfer = createHeldItem(Items.StickyBarb, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      !event.success ||
      event.flags & DamageFlags.Indirect ||
      event.cause.type !== EffectType.Move ||
      event.cause.unit === event.target ||
      !holds(event.target, Items.StickyBarb) ||
      !event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target))
    ) {
      return;
    }

    const attacker = event.cause.unit;

    // A full grip keeps it out: the barb catches on whoever has room
    // for it, which is the record's answer rather than the battle's
    if (!attacker.alive || !hasFreeItemSlot(attacker)) {
      return;
    }

    const cause = { type: EffectType.Item, item: Items.StickyBarb, unit: event.target } as const;

    event.target.triggerItem(Items.StickyBarb);
    event.target.removeItem(Items.StickyBarb, cause);
    attacker.addItem(Items.StickyBarb);
  }),
);

// An Iron Ball drags its carrier down in both senses
export const setupIronBall = createHeldItem(
  Items.IronBall,
  (battle) =>
    new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        if (event.stat === Stats.Speed && holds(event.source, Items.IronBall)) {
          event.value *= IRON_BALL_SPEED;
        }
      }),

      battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
        if (!event.grounded && holds(event.source, Items.IronBall)) {
          event.grounded = true;
        }
      }),
    ]),
);

// A Float Stone lifts what its holder weighs, which is what a Low Kick
// reads
export const setupFloatStone = createHeldItem(Items.FloatStone, (battle) =>
  battle.on(BattleEvents.CheckUnitWeight, EventPriority.Post, (event) => {
    if (holds(event.source, Items.FloatStone)) {
      event.weight *= FLOAT_STONE_WEIGHT;
    }
  }),
);

// A Lagging Tail is a Quick Claw backwards, and never rolls for it:
// whoever carries one is always the later
export const setupLaggingTail = createHeldItem(Items.LaggingTail, (battle) =>
  battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
    if (holds(event.source, Items.LaggingTail)) {
      event.priority += LAGGING_TAIL_PRIORITY;
    }
  }),
);

/**
 * A Ring Target takes away what its holder's own typing would have
 * shrugged off. Only that: the immunity is cleared when the holder's
 * types are what explain it, so a Levitate or an absorbing ability
 * keeps its answer
 */
export const setupRingTarget = createHeldItem(Items.RingTarget, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune ||
      event.target.type !== MoveTargetType.Unit ||
      !holds(event.target.unit, Items.RingTarget)
    ) {
      return;
    }

    for (const defending of event.target.unit.types) {
      if (TYPE_EFFECTIVENESS[event.type][defending] === TypeEffectiveness.Immune) {
        event.immune = false;
        event.target.unit.triggerItem(Items.RingTarget);
        return;
      }
    }
  }),
);
