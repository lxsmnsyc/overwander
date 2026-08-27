import {
  AttackPriority,
  type EventListenerLifecycle,
  EventPriority,
} from '../../core/event-emitter';
import { type Stages, Stats } from '../../data/constants/stats';
import { ItemTypes, Items } from '../../data/ids/items';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import { NATURE_EFFECTS } from '../../data/ids/natures';
import { Statuses } from '../../data/ids/status';
import {
  BERRY_BRACE_STAGES,
  BERRY_HEALS,
  BERRY_NATURE_HEALS,
  BERRY_NATURE_HEAL_SHARE,
  BERRY_NATURE_HEAL_THRESHOLD,
  BERRY_PAYBACK_SHARE,
  BERRY_PINCH_STAGES,
  BERRY_PINCH_THRESHOLD,
  BERRY_RESIST_FACTOR,
  BERRY_RESIST_TYPES,
  BERRY_STATUS_CURES,
  type BerryHeal,
  CUSTAP_PRIORITY,
  ENIGMA_HEAL_SHARE,
  LANSAT_CRITICAL_STAGES,
  MICLE_ACCURACY,
  STARF_STAGES,
  STARF_STAGE_AMOUNT,
} from '../../data/items/berries';
import { Types } from '../../data/constants/types';
import { listItemsByType } from '../../data/items';
import type Battle from '../core';
import {
  BattleEvents,
  type EffectCause,
  EffectType,
  type UnitAttackEvent,
  type UnitItemEvent,
  type UnitSetValueEvent,
} from '../events';
import { type Lifecycle, MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import {
  createEffectivenessTracker,
  createHeldItem,
  createHeldItems,
  holds,
  spendItem,
} from './__create';

/**
 * Held berries that trigger on their own in battle. Eating a berry
 * always consumes it; a unit prevented from consuming (e.g. by an
 * enemy Unnerve) keeps the berry for later.
 */

/**
 * What a berry cures and what it restores is the berry's own
 * business, written once in
 * [`src/data/items/berries.ts`](../../data/items/berries.ts) and read
 * here as well as by the player handing one over between fights. The
 * threshold in a heal is a battle rule: it is what the
 * CheckUnitItemThreshold event opens with, and abilities like
 * Gluttony adjust it there
 */

/**
 * Detection for anything that waits for its holder to be nearly out.
 * The threshold goes through the unit, so whatever moves it — Gluttony,
 * say — moves every berry's together
 */
function onPinch(
  battle: Battle,
  item: Items,
  threshold: number,
): EventListenerLifecycle<UnitSetValueEvent> {
  return battle.on(BattleEvents.UnitSetHealth, EventPriority.Post, (event) => {
    const unit = event.source;

    if (!unit.alive || unit.health <= 0) {
      return;
    }
    if (unit.health <= unit.checkStat(Stats.HP, 0) * unit.checkItemThreshold(item, threshold)) {
      spendItem(unit, item);
    }
  });
}

/**
 * The effect half of a berry, which rides the trigger its detection
 * fired
 */
function onEaten(
  battle: Battle,
  item: Items,
  effect: (unit: Unit, cause: EffectCause) => void,
): EventListenerLifecycle<UnitItemEvent> {
  return battle.on(BattleEvents.UnitTriggerItem, EventPriority.Exact, (event) => {
    if (event.item === item) {
      effect(event.source, { type: EffectType.Item, item, unit: event.source });
    }
  });
}

/**
 * A blow that has landed on the berry's holder, for the berries that
 * answer one
 */
function onHit(
  battle: Battle,
  effect: (event: UnitAttackEvent, holder: Unit) => void,
): EventListenerLifecycle<UnitAttackEvent> {
  return battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
    if (event.success && event.category !== MoveCategories.Status && event.target.alive) {
      effect(event, event.target);
    }
  });
}

// A cure berry eats itself the moment a status it covers lands, and
// clears every covered status the holder has
function createCureBerry(item: Items, cures: Set<Statuses>): (battle: Battle) => Lifecycle {
  return (battle) =>
    new MergedLifecycle([
      battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
        if (cures.has(event.status)) {
          spendItem(event.source, item);
        }
      }),

      onEaten(battle, item, (unit, cause) => {
        for (const status of cures) {
          if (unit.status[status] != null) {
            unit.removeStatus(status, cause);
          }
        }
      }),
    ]);
}

// A healing berry is eaten when its holder drops to its threshold
function createHealBerry(item: Items, config: BerryHeal): (battle: Battle) => Lifecycle {
  return (battle) =>
    new MergedLifecycle([
      onPinch(battle, item, config.threshold),
      onEaten(battle, item, (unit, cause) => {
        unit.heal(cause, unit, config.heal(unit.checkStat(Stats.HP, 0)), 0);
      }),
    ]);
}

/**
 * A resist berry takes half off a blow of its own type that was landing
 * hard. Detection and effect are one listener: the half has to come off
 * the damage being resolved, which is a number the trigger cannot
 * reach.
 *
 * Chilan is the exception the table cannot express: nothing is weak to
 * Normal, so a berry that waited to be hit hard by one would never be
 * eaten at all
 */
function createResistBerry(item: Items, resisted: Types): (battle: Battle) => Lifecycle {
  return (battle) => {
    const landingHard = createEffectivenessTracker(battle);

    return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      if (event.parent.type !== resisted) {
        return;
      }
      if (resisted !== Types.Normal && !landingHard(event.parent)) {
        return;
      }

      const target = event.parent.target;

      // The AI weighs a move by running this same pipeline. A berry
      // that ate itself answering the question would be gone before
      // the move it was asked about was ever cast, so a simulation
      // gets the half without the bite
      if (event.parent.flags & MoveAttackFlags.Simulated) {
        if (holds(target, item) && target.checkCanConsumeItem(item)) {
          event.value *= BERRY_RESIST_FACTOR;
        }
        return;
      }

      if (spendItem(target, item)) {
        event.value *= BERRY_RESIST_FACTOR;
      }
    });
  };
}

// An Enigma hands a quarter of its holder back for a blow that landed
// hard
const setupEnigmaBerry = createHeldItem(Items.EnigmaBerry, (battle) => {
  const landingHard = createEffectivenessTracker(battle);

  return onHit(battle, (event, holder) => {
    if (!landingHard(event)) {
      return;
    }

    const cause = spendItem(holder, Items.EnigmaBerry);

    if (cause) {
      holder.heal(
        cause,
        holder,
        Math.max(1, Math.floor(holder.checkStat(Stats.HP, 0) * ENIGMA_HEAL_SHARE)),
        0,
      );
    }
  });
});

// Kee braces against the physical, Maranga against the special
function createBraceBerry(item: Items, stage: Stages): (battle: Battle) => Lifecycle {
  return (battle) =>
    onHit(battle, (event, holder) => {
      if ((event.category === MoveCategories.Physical) !== (item === Items.KeeBerry)) {
        return;
      }

      const cause = spendItem(holder, item);

      if (cause) {
        holder.addStage(stage, 1, cause);
      }
    });
}

/**
 * A payback berry takes a share out of whoever threw the blow.
 * Indirect, so nothing about the attack — drain, recoil, a berry of the
 * attacker's own — reads it as a hit
 */
function createPaybackBerry(item: Items, category: MoveCategories): (battle: Battle) => Lifecycle {
  return (battle) =>
    onHit(battle, (event, holder) => {
      if (event.category !== category) {
        return;
      }

      const cause = spendItem(holder, item);

      if (cause && event.source.alive) {
        const share = Math.max(
          1,
          Math.floor(event.source.checkStat(Stats.HP, 0) * BERRY_PAYBACK_SHARE),
        );

        event.source.damage(cause, event.source, share, DamageFlags.Indirect);
      }
    });
}

// A pinch berry lifts one stat as it goes
function createPinchBerry(item: Items, stage: Stages): (battle: Battle) => Lifecycle {
  return (battle) =>
    new MergedLifecycle([
      onPinch(battle, item, BERRY_PINCH_THRESHOLD),
      onEaten(battle, item, (unit, cause) => {
        unit.addStage(stage, 1, cause);
      }),
    ]);
}

/**
 * A bitter berry gives back a third — and a third of the holders cannot
 * stand the taste. Whether it turns their stomach is their nature's
 * business: the one that lowers the stat the berry's flavour belongs to
 * is the one that dislikes it
 */
function createBitterBerry(item: Items, flavour: Stats): (battle: Battle) => Lifecycle {
  return (battle) =>
    new MergedLifecycle([
      onPinch(battle, item, BERRY_NATURE_HEAL_THRESHOLD),
      onEaten(battle, item, (unit, cause) => {
        const maxHealth = unit.checkStat(Stats.HP, 0);

        unit.heal(cause, unit, Math.max(1, Math.floor(maxHealth * BERRY_NATURE_HEAL_SHARE)), 0);

        if (NATURE_EFFECTS[unit.nature]?.down === flavour) {
          unit.addStatus(Statuses.Confused, cause);
        }
      }),
    ]);
}

// A Leppa restores a depleted move. The cooldown is this engine's
// stand-in for spent PP, so the berry clears it as it starts
const setupLeppaBerry = createHeldItem(Items.LeppaBerry, (battle) =>
  battle.on(BattleEvents.UnitStartCooldown, EventPriority.Post, (event) => {
    if (spendItem(event.source, Items.LeppaBerry)) {
      event.source.finishCooldown(event.move);
    }
  }),
);

// A Starf lifts one stat by two, and which one is the price of it being
// worth two
const setupStarfBerry = createHeldItem(
  Items.StarfBerry,
  (battle) =>
    new MergedLifecycle([
      onPinch(battle, Items.StarfBerry, BERRY_PINCH_THRESHOLD),
      onEaten(battle, Items.StarfBerry, (unit, cause) => {
        unit.addStage(
          STARF_STAGES[Math.floor(battle.random() * STARF_STAGES.length)],
          STARF_STAGE_AMOUNT,
          cause,
        );
      }),
    ]),
);

/**
 * The three berries that buy a moment rather than a stat. What each
 * bought outlives the berry, so each refuses to be switched off while
 * anything is still owing — a Lansat sharpens its holder for the rest
 * of the fight, and a Custap and a Micle each carry into one move
 */
function createMomentBerry(
  item: Items,
  listen: (battle: Battle, owing: Set<Unit>) => Lifecycle[],
  spentByTheMove: boolean,
): (battle: Battle) => Lifecycle {
  return (battle) => {
    const owing = new Set<Unit>();

    const listening = new MergedLifecycle([
      onPinch(battle, item, BERRY_PINCH_THRESHOLD),
      onEaten(battle, item, (unit) => {
        owing.add(unit);
      }),
      ...listen(battle, owing),

      // Nothing carries off the field: a unit that has left is not the
      // one that comes back
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        owing.delete(event.source);
      }),

      // What a move was paid for is spent by it, whether or not it
      // landed: the hurry was already had, and the aim already taken
      ...(spentByTheMove
        ? [
            battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
              owing.delete(event.source);
            }),
          ]
        : []),
    ]);

    return {
      start: () => {
        listening.start();
      },
      stop: () => {
        if (owing.size === 0) {
          listening.stop();
        }
      },
    };
  };
}

const setupLansatBerry = createHeldItem(
  Items.LansatBerry,
  createMomentBerry(
    Items.LansatBerry,
    (battle, owing) => [
      battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
        if (owing.has(event.parent.source)) {
          event.value += LANSAT_CRITICAL_STAGES;
        }
      }),
    ],
    false,
  ),
);

const setupCustapBerry = createHeldItem(
  Items.CustapBerry,
  createMomentBerry(
    Items.CustapBerry,
    (battle, owing) => [
      battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
        if (owing.has(event.source)) {
          event.priority += CUSTAP_PRIORITY;
        }
      }),
    ],
    true,
  ),
);

const setupMicleBerry = createHeldItem(
  Items.MicleBerry,
  createMomentBerry(
    Items.MicleBerry,
    (battle, owing) => [
      battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
        if (event.accuracy != null && owing.has(event.source)) {
          event.accuracy *= MICLE_ACCURACY;
        }
      }),
    ],
    true,
  ),
);

/**
 * Which of the berry shapes this one is. Every berry in the registry
 * comes through here, so a berry with no battle behaviour at all — one
 * that is only ever handed over between fights — registers nothing
 */
function berryLifecycle(battle: Battle, item: Items): Lifecycle {
  const cures = BERRY_STATUS_CURES.get(item);

  if (cures != null) {
    return createCureBerry(item, cures)(battle);
  }

  const healing = BERRY_HEALS.get(item);

  if (healing != null) {
    return createHealBerry(item, healing)(battle);
  }

  const resisted = BERRY_RESIST_TYPES.get(item);

  if (resisted != null) {
    return createResistBerry(item, resisted)(battle);
  }

  const brace = BERRY_BRACE_STAGES.get(item);

  if (brace != null) {
    return createBraceBerry(item, brace)(battle);
  }

  const pinch = BERRY_PINCH_STAGES.get(item);

  if (pinch != null) {
    return createPinchBerry(item, pinch)(battle);
  }

  const flavour = BERRY_NATURE_HEALS.get(item);

  if (flavour != null) {
    return createBitterBerry(item, flavour)(battle);
  }
  if (item === Items.JabocaBerry) {
    return createPaybackBerry(item, MoveCategories.Physical)(battle);
  }
  if (item === Items.RowapBerry) {
    return createPaybackBerry(item, MoveCategories.Special)(battle);
  }
  return new MergedLifecycle([]);
}

const SETUPS: ((battle: Battle) => void)[] = [
  createHeldItems(() => listItemsByType(ItemTypes.Berry), berryLifecycle),
  setupEnigmaBerry,
  setupLeppaBerry,
  setupStarfBerry,
  setupLansatBerry,
  setupCustapBerry,
  setupMicleBerry,
];

export default function setupBerries(battle: Battle): void {
  for (const setup of SETUPS) {
    setup(battle);
  }
}
