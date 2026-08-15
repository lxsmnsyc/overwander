import {
  AttackPriority,
  type EventListenerLifecycle,
  EventPriority,
} from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Items } from '../../data/ids/items';
import { DamageFlags, MoveCategories, MoveFlags, MoveTargetPriorities } from '../../data/ids/moves';
import Abilities from '../../data/ids/abilities';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { checkTeamUnit } from '../ai/rating';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType, type UnitUpdateStageEvent } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createEffectivenessTracker, createHeldItem, holds, spendItem } from './__create';

/**
 * The one-shots: held against a single moment, and gone once it comes.
 *
 * Each of them waits for something that may never happen and pays out
 * once when it does, which is what separates them from the gear: a
 * Leftovers works all fight, a Focus Sash works once. They are spent
 * the way a berry is — disabled, triggered, removed — so what a
 * pokemon used comes off its catch record when the fight ends.
 */

/**
 * What a policy is worth when its moment arrives. Two stages is what
 * a whole move would have bought, which is the point: the holder was
 * hit badly enough that the answer has to be worth the hit
 */
export const POLICY_STAGES = 2;

/**
 * What the elemental one-shots are worth. One stage, because unlike a
 * policy they do not ask for the blow to have hurt — only for it to
 * have been of the right kind
 */
export const REACTION_STAGES = 1;

/**
 * What a Throat Spray is worth to whoever just shouted
 */
export const THROAT_SPRAY_STAGES = 1;

/**
 * The one-shots that answer a blow of one particular type. Water gets
 * two answers because the mainline gives it two, and they are not the
 * same answer: a bulb sharpens what the holder throws back, a moss
 * braces it for the next one
 */
interface Reaction {
  item: Items;
  type: Types;
  stage: Stages;
}

const REACTIONS: Reaction[] = [
  { item: Items.AbsorbBulb, type: Types.Water, stage: Stages.SpecialAttack },
  { item: Items.LuminousMoss, type: Types.Water, stage: Stages.SpecialDefense },
  { item: Items.CellBattery, type: Types.Electric, stage: Stages.Attack },
  { item: Items.Snowball, type: Types.Ice, stage: Stages.Attack },
];

/**
 * Every stage a White Herb has to put back. It is written out rather
 * than derived so the herb restores exactly what the game has, in one
 * pass, and cannot quietly miss one that is added later
 */
const ALL_STAGES: Stages[] = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/**
 * The pair of listeners it takes to catch a stat going down
 */
type StageListeners = [
  EventListenerLifecycle<UnitUpdateStageEvent>,
  EventListenerLifecycle<UnitUpdateStageEvent>,
];

/**
 * The teammate that would come out, or nothing when the swap cannot
 * happen. `forced` is the card-versus-ejector difference, the same one
 * the switch-out moves draw: a Whirlwind drags its target out of
 * whatever holds it, a Teleport has to be able to go
 */
function replacementFor(
  battle: Battle,
  unit: Unit,
  priority: MoveTargetPriorities,
  forced: boolean,
): Unit | undefined {
  const replacement = checkTeamUnit(battle, unit.team, priority, unit);

  if (replacement == null) {
    return undefined;
  }
  if (!forced && !(unit.checkEscape() && replacement.checkEscape())) {
    return undefined;
  }
  return replacement;
}

/**
 * Send `switched` to the bench for `holder`'s item — the two differ for
 * a Red Card, which sends away whoever set it off. The item is spent
 * last, so nothing is thrown away on a swap that was never possible
 */
function bench(
  battle: Battle,
  holder: Unit,
  item: Items,
  switched: Unit,
  priority: MoveTargetPriorities,
  forced: boolean,
): boolean {
  if (!holds(holder, item)) {
    return false;
  }

  const replacement = replacementFor(battle, switched, priority, forced);

  if (replacement == null || !spendItem(holder, item)) {
    return false;
  }

  switched.forceSwitch(replacement);
  return true;
}

/**
 * A stage can fall two ways: something takes one off, or something adds
 * a negative one — an Intimidate does the latter — so anything
 * answering a stat being lowered has to watch both
 */
function lowering(
  battle: Battle,
  listener: (unit: Unit, cause: EffectCause) => void,
): StageListeners {
  // Both events carry the change that was actually applied once they
  // have been resolved — a stage that was already at the floor comes
  // back as nothing moved — so a negative is a stat that really did go
  // down, whichever door it came through
  const fell = (event: UnitUpdateStageEvent): void => {
    if (event.value < 0) {
      listener(event.source, event.cause);
    }
  };

  return [
    battle.on(BattleEvents.UnitRemoveStage, EventPriority.Post, fell),
    battle.on(BattleEvents.UnitAddStage, EventPriority.Post, fell),
  ];
}

/**
 * A Focus Sash is worth exactly one blow that would have finished its
 * holder, and only from full health — a pokemon already hurt has
 * nothing left for a sash to hold on to. Indirect damage is not a blow,
 * so nothing a status or a recoil does can be endured
 */
const setupFocusSash = createHeldItem(Items.FocusSash, (battle) =>
  battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
    const target = event.target;

    if (
      target.alive &&
      !(event.flags & DamageFlags.Indirect) &&
      event.value >= target.health &&
      target.health >= target.checkStat(Stats.HP, 0) &&
      holds(target, Items.FocusSash) &&
      target.checkCanConsumeItem(Items.FocusSash)
    ) {
      event.value = target.health - 1;

      spendItem(target, Items.FocusSash);
    }
  }),
);

// An Air Balloon holds its owner off the ground, which is the whole of
// what a Ground move needs to miss — and anything that lands takes it
const setupAirBalloon = createHeldItem(
  Items.AirBalloon,
  (battle) =>
    new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
        if (
          event.grounded &&
          event.source.status[Statuses.Grounded] == null &&
          holds(event.source, Items.AirBalloon)
        ) {
          event.grounded = false;
        }
      }),

      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
        if (event.success && event.category !== MoveCategories.Status && event.target.alive) {
          spendItem(event.target, Items.AirBalloon);
        }
      }),
    ]),
);

// A Weakness Policy wants a blow that landed hard, which is a thing no
// power check can know: it is worked out against the defender's types
// while the damage resolves
const setupWeaknessPolicy = createHeldItem(Items.WeaknessPolicy, (battle) => {
  const landingHard = createEffectivenessTracker(battle);

  return battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
    const holder = event.target;

    if (
      !event.success ||
      event.category === MoveCategories.Status ||
      !holder.alive ||
      !landingHard(event)
    ) {
      return;
    }

    const cause = spendItem(holder, Items.WeaknessPolicy);

    if (cause) {
      holder.addStage(Stages.Attack, POLICY_STAGES, cause);
      holder.addStage(Stages.SpecialAttack, POLICY_STAGES, cause);
    }
  });
});

/**
 * A one-shot that answers a blow of one particular type
 */
function setupReaction(reaction: Reaction): (battle: Battle) => void {
  return createHeldItem(reaction.item, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
      const holder = event.target;

      if (
        !event.success ||
        event.category === MoveCategories.Status ||
        !holder.alive ||
        event.type !== reaction.type
      ) {
        return;
      }

      const cause = spendItem(holder, reaction.item);

      if (cause) {
        holder.addStage(reaction.stage, REACTION_STAGES, cause);
      }
    }),
  );
}

/**
 * A Red Card sends away whoever threw the blow. An enemy is replaced by
 * the worst of their bench; an ally doing its own side no good where it
 * is, by the best of theirs. Either way the holder stays put
 */
const setupRedCard = createHeldItem(Items.RedCard, (battle) =>
  battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
    const holder = event.target;

    // A confused pokemon hitting itself has nobody to send away
    if (
      !event.success ||
      event.category === MoveCategories.Status ||
      !holder.alive ||
      event.source === holder
    ) {
      return;
    }

    const ally = event.source.team.alliance === holder.team.alliance;

    bench(
      battle,
      holder,
      Items.RedCard,
      event.source,
      ally ? MoveTargetPriorities.Strongest : MoveTargetPriorities.Weakest,
      true,
    );
  }),
);

// An Eject Button takes its own holder out of whatever that was
const setupEjectButton = createHeldItem(Items.EjectButton, (battle) =>
  battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
    const holder = event.target;

    if (event.success && event.category !== MoveCategories.Status && holder.alive) {
      bench(battle, holder, Items.EjectButton, holder, MoveTargetPriorities.Strongest, false);
    }
  }),
);

// An Eject Pack answers a stat going down rather than a blow landing
const setupEjectPack = createHeldItem(
  Items.EjectPack,
  (battle) =>
    new MergedLifecycle(
      lowering(battle, (unit) => {
        bench(battle, unit, Items.EjectPack, unit, MoveTargetPriorities.Strongest, false);
      }),
    ),
);

// A Blunder Policy pays for a swing that hit nothing: the holder is
// quicker for having wasted one
const setupBlunderPolicy = createHeldItem(Items.BlunderPolicy, (battle) =>
  battle.on(BattleEvents.UnitTriggerMoveMissed, EventPriority.Post, (event) => {
    const cause = spendItem(event.parent.source, Items.BlunderPolicy);

    if (cause) {
      event.parent.source.addStage(Stages.Speed, POLICY_STAGES, cause);
    }
  }),
);

// A Throat Spray answers the shout rather than what it did
const setupThroatSpray = createHeldItem(Items.ThroatSpray, (battle) =>
  battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
    if (!(getMoveData(event.move).flags & MoveFlags.Sound)) {
      return;
    }

    const cause = spendItem(event.source, Items.ThroatSpray);

    if (cause) {
      event.source.addStage(Stages.SpecialAttack, THROAT_SPRAY_STAGES, cause);
    }
  }),
);

/**
 * An Adrenaline Orb answers being sized up rather than being hit. The
 * stare-down is read off the cause of the Attack drop rather than off
 * Intimidate's own trigger, which fires on the one doing it — and
 * whether the holder's Attack actually fell is beside the point
 */
const setupAdrenalineOrb = createHeldItem(
  Items.AdrenalineOrb,
  (battle) =>
    new MergedLifecycle(
      lowering(battle, (unit, cause) => {
        if (cause.type !== EffectType.Ability || cause.ability !== Abilities.Intimidate) {
          return;
        }

        const spent = spendItem(unit, Items.AdrenalineOrb);

        if (spent) {
          unit.addStage(Stages.Speed, REACTION_STAGES, spent);
        }
      }),
    ),
);

/**
 * A White Herb puts back everything that has been taken off its holder
 * — every lowered stage at once, however many blows they came from,
 * which is what makes it worth a slot against anything that lowers
 * stats twice
 */
const setupWhiteHerb = createHeldItem(
  Items.WhiteHerb,
  (battle) =>
    new MergedLifecycle(
      lowering(battle, (unit) => {
        const taken = ALL_STAGES.filter((stage) => unit.stages[stage] < 0);

        if (taken.length === 0 || !holds(unit, Items.WhiteHerb)) {
          return;
        }

        const cause = spendItem(unit, Items.WhiteHerb);

        if (cause == null) {
          return;
        }

        for (const stage of taken) {
          unit.addStage(stage, -unit.stages[stage], cause);
        }
      }),
    ),
);

// A Mental Herb clears the holder's head the moment it is turned
const setupMentalHerb = createHeldItem(Items.MentalHerb, (battle) =>
  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status !== Statuses.Infatuated) {
      return;
    }

    const cause = spendItem(event.source, Items.MentalHerb);

    if (cause) {
      event.source.removeStatus(Statuses.Infatuated, cause);
    }
  }),
);

const setupPowerHerb = createHeldItem(Items.PowerHerb, (battle) => {
  /**
   * Whoever the herb is carrying through a wind-up. In a game whose
   * moves are cast rather than declared, the charge it skips is the
   * cast itself: the move goes off the instant it is reached for, once.
   *
   * It is spent as the cast opens rather than in the cast-time check,
   * because the check is asked speculatively — the engine and the AI
   * both ask what a move would take — and a herb spent answering a
   * question is a herb spent on nothing
   */
  const rushed = new Set<Unit>();

  function settle(unit: Unit): void {
    rushed.delete(unit);
  }

  const listening = new MergedLifecycle([
    battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
      if (!holds(event.source, Items.PowerHerb)) {
        return;
      }

      // Marked before it is spent, not after: spending the herb is what
      // closes its own gate, and the gate asks whether a rushed cast is
      // still owing
      rushed.add(event.source);

      if (!spendItem(event.source, Items.PowerHerb)) {
        settle(event.source);
      }
    }),

    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      if (rushed.has(event.source)) {
        event.duration = 0;
      }
    }),

    battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
      settle(event.source);
    }),
    battle.on(BattleEvents.UnitStopCast, EventPriority.Post, (event) => {
      settle(event.source);
    }),
    battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
      settle(event.source);
    }),
  ]);

  return {
    start: () => {
      listening.start();
    },
    /**
     * The herb is spent as the cast opens and the cast time is read a
     * moment later, so it has to stay listening while a rushed cast is
     * still in flight — even though the herb itself is already gone
     */
    stop: () => {
      if (rushed.size === 0) {
        listening.stop();
      }
    },
  };
});

const SETUPS: ((battle: Battle) => void)[] = [
  setupFocusSash,
  setupAirBalloon,
  setupWeaknessPolicy,
  ...REACTIONS.map(setupReaction),
  setupRedCard,
  setupEjectButton,
  setupEjectPack,
  setupBlunderPolicy,
  setupThroatSpray,
  setupAdrenalineOrb,
  setupWhiteHerb,
  setupMentalHerb,
  setupPowerHerb,
];

export default function setupOneShots(battle: Battle): void {
  for (const setup of SETUPS) {
    setup(battle);
  }
}
