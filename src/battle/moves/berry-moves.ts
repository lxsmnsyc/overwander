import { AttackPriority, EventPriority } from '../../core/event-emitter';
import type { Items } from '../../data/ids/items';
import { Moves } from '../../data/ids/moves';
import { BERRY_RESIST_TYPES, isBerry } from '../../data/items/berries';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';
import { stealableItem } from '../utils';

/**
 * The two moves that go through a berry: Pluck eats the target's,
 * Natural Gift throws the user's own.
 *
 * A berry's type and power in the mainline come from a table of
 * sixty-odd entries with no pattern behind them. That table is the
 * mainline's history rather than a rule, so this reads what the berry
 * is actually for here instead: a berry that resists a type is thrown
 * as that type, and everything else is thrown plain
 * https://bulbapedia.bulbagarden.net/wiki/Natural_Gift_(move)
 */
const GIFT_POWER = 80;

/** What the user is holding, if it is a berry */
function heldBerry(unit: Unit): Items | undefined {
  const held = stealableItem(unit);

  return held != null && isBerry(held) ? held : undefined;
}

export default function setupBerryMoves(battle: Battle): void {
  // Natural Gift is nothing at all without a berry to throw
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.NaturalGift) {
      event.usable = heldBerry(event.source) != null;
    }
  });

  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Exact, (event) => {
    if (event.move === Moves.NaturalGift) {
      event.power = heldBerry(event.source) == null ? 1 : GIFT_POWER;
    }
  });

  // The berry decides what is thrown, so the move has no type of its
  // own until one is in hand
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move !== Moves.NaturalGift) {
      return;
    }

    const berry = heldBerry(event.source);
    const thrown = berry == null ? undefined : BERRY_RESIST_TYPES.get(berry);

    if (thrown != null) {
      event.type = thrown;
    }
  });

  // Spent as it lands: a gift is the berry, so there is nothing left
  // to eat afterwards
  battle.on(BattleEvents.UnitAttackEffect, EventPriority.Exact, (event) => {
    const source = event.parent.source;

    if (event.parent.move === Moves.NaturalGift) {
      const berry = heldBerry(source);

      if (berry != null) {
        source.removeItem(berry, { type: EffectType.Move, move: Moves.NaturalGift, unit: source });
      }
      return;
    }

    // Pluck takes the berry out of the target and gets what the
    // target would have got out of it
    if (event.parent.move === Moves.Pluck) {
      const target = event.parent.target;
      const berry = heldBerry(target);

      if (berry != null) {
        target.removeItem(berry, { type: EffectType.Move, move: Moves.Pluck, unit: source });
        source.addItem(berry);
        source.triggerItem(berry);
      }
    }
  });

  battle.on(BattleEvents.CheckUnitAttackEffectChance, EventPriority.Post, (event) => {
    if (event.parent.move === Moves.Pluck || event.parent.move === Moves.NaturalGift) {
      event.value = 100;
    }
  });

  // Pecking at a target holding nothing is a plain 60-power hit, and
  // the AI should know that is all it is
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.move === Moves.Pluck &&
      event.target.type === MoveTargetType.Unit &&
      heldBerry(event.target.unit) == null
    ) {
      event.score -= USELESS_PENALTY / 2;
    }
  });
}
