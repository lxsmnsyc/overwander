import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Items } from '../../../data/ids/items';
import { DamageFlags, type MoveCategories, type Moves } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createEffectivenessTracker, createHeldItem, holds } from '../__create';
import { heal } from './residual';
import {
  BAND_FACTOR,
  BIG_ROOT_FACTOR,
  EXPERT_BELT_FACTOR,
  METRONOME_LIMIT,
  METRONOME_STEP,
  SHELL_BELL_SHARE,
} from './worths';

/** What a blow is worth to whoever threw it, and what it hands back */
/**
 * Protective Pads answer the contact check rather than each of the
 * things that read it, so one veto covers a Rocky Helmet, a Static, a
 * Sticky Barb and everything else that waits to be touched. What the
 * holder's own abilities make of the blow is their business: a Tough
 * Claws still reads the move's own flag
 */
export const setupProtectivePads = createHeldItem(Items.ProtectivePads, (battle) =>
  battle.on(BattleEvents.CheckUnitMoveContact, EventPriority.Post, (event) => {
    if (event.contact && holds(event.source, Items.ProtectivePads)) {
      event.contact = false;
    }
  }),
);

// A Shell Bell takes its share out of what its holder just did to
// somebody else. Indirect damage is nobody's blow, so nothing a status
// or a recoil does feeds it
export const setupShellBell = createHeldItem(Items.ShellBell, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    if (
      !event.success ||
      event.flags & DamageFlags.Indirect ||
      event.cause.type !== EffectType.Move ||
      event.cause.unit === event.target
    ) {
      return;
    }

    const attacker = event.cause.unit;

    if (attacker.alive && holds(attacker, Items.ShellBell)) {
      heal(attacker, Items.ShellBell, event.value * SHELL_BELL_SHARE);
    }
  }),
);

// A Big Root deepens every drain. Only a drain that gives health back:
// an ability that turns one against the drainer leaves a negative
// behind, and a root is no reason to bleed harder for it
export const setupBigRoot = createHeldItem(Items.BigRoot, (battle) =>
  battle.on(BattleEvents.CheckUnitDrain, EventPriority.Post, (event) => {
    if (event.value > 0 && holds(event.source, Items.BigRoot)) {
      event.value *= BIG_ROOT_FACTOR;
    }
  }),
);

// A band lifts the half of the game it belongs to
export function setupBand(item: Items, boosted: MoveCategories): (battle: Battle) => void {
  return createHeldItem(item, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        getMoveData(event.move).category === boosted &&
        holds(event.source, item)
      ) {
        event.power *= BAND_FACTOR;
      }
    }),
  );
}

/**
 * An Expert Belt pays only on a blow that was already landing hard,
 * which is a thing no power check can know: how hard a move lands is
 * worked out against the defender's types while the damage resolves.
 * So it rides the damage rather than the power
 */
export const setupExpertBelt = createHeldItem(Items.ExpertBelt, (battle) => {
  const landingHard = createEffectivenessTracker(battle);

  return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
    if (landingHard(event.parent) && holds(event.parent.source, Items.ExpertBelt)) {
      event.value *= EXPERT_BELT_FACTOR;
    }
  });
});

/**
 * What a Metronome holder has been doing, and for how long
 */
interface Streak {
  move: Moves;
  repeats: number;
}

export const setupMetronome = createHeldItem(Items.Metronome, (battle) => {
  /**
   * What each holder has been repeating. It is the battle's own
   * bookkeeping rather than the unit's, the way a Choice lock is: the
   * count belongs to the item, and losing it — or leaving the field —
   * is what forgets it
   */
  const streaks = new Map<Unit, Streak>();

  function forget(unit: Unit): void {
    streaks.delete(unit);
  }

  return new MergedLifecycle([
    battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
      if (!holds(event.source, Items.Metronome)) {
        return;
      }

      const streak = streaks.get(event.source);

      streaks.set(
        event.source,
        streak != null && streak.move === event.move
          ? { move: event.move, repeats: streak.repeats + 1 }
          : { move: event.move, repeats: 0 },
      );
    }),

    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const streak = streaks.get(event.source);

      if (
        event.power == null ||
        streak == null ||
        streak.move !== event.move ||
        !holds(event.source, Items.Metronome)
      ) {
        return;
      }

      event.power *= Math.min(METRONOME_LIMIT, 1 + METRONOME_STEP * streak.repeats);
    }),

    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      if (event.item === Items.Metronome) {
        forget(event.source);
      }
    }),
    battle.on(BattleEvents.UnitDisableItem, EventPriority.Post, (event) => {
      if (event.item === Items.Metronome) {
        forget(event.source);
      }
    }),
    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      forget(event.source);
    }),
  ]);
});
