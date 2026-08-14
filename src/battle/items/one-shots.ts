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
import { ONE_SHOTS } from '../../data/items/one-shots';
import { checkTeamUnit } from '../ai/rating';
import { BattleEvents, type EffectCause, EffectType, type UnitUpdateStageEvent } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createEffectivenessTracker, createHeldItems, holds, spendItem } from './__create';

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
const REACTIONS: { item: Items; type: Types; stage: Stages }[] = [
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

export default createHeldItems(
  () => ONE_SHOTS.keys(),
  (battle) => {
    const landingHard = createEffectivenessTracker(battle);

    /**
     * The teammate that would come out, or nothing when the swap
     * cannot happen. `forced` is the card-versus-ejector difference,
     * the same one the switch-out moves draw: a Whirlwind drags its
     * target out of whatever holds it, a Teleport has to be able to go
     */
    function replacementFor(
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
     * Send `switched` to the bench for `holder`'s item — the two
     * differ for a Red Card, which sends away whoever set it off. The
     * item is spent last, so nothing is thrown away on a swap that was
     * never possible
     */
    function bench(
      holder: Unit,
      item: Items,
      switched: Unit,
      priority: MoveTargetPriorities,
      forced: boolean,
    ): boolean {
      if (!holds(holder, item)) {
        return false;
      }

      const replacement = replacementFor(switched, priority, forced);

      if (replacement == null || !spendItem(holder, item)) {
        return false;
      }

      switched.forceSwitch(replacement);
      return true;
    }

    /**
     * Whoever a Power Herb is carrying through a wind-up. In a game
     * whose moves are cast rather than declared, the charge the herb
     * skips is the cast itself: the move goes off the instant it is
     * reached for, once, and the herb is gone.
     *
     * It is spent as the cast opens rather than in the cast-time check,
     * because the check is asked speculatively — the engine and the AI
     * both ask what a move would take — and a herb spent answering a
     * question is a herb spent on nothing
     */
    const rushed = new Set<Unit>();

    /**
     * A White Herb puts back everything that has been taken off its
     * holder — every lowered stage at once, however many blows they
     * came from, which is what makes it worth a slot against anything
     * that lowers stats twice
     */
    function lowered(unit: Unit): Stages[] {
      return ALL_STAGES.filter((stage) => unit.stages[stage] < 0);
    }

    /**
     * A stage can fall two ways: something takes one off, or something
     * adds a negative one — an Intimidate does the latter — so
     * anything answering a stat being lowered has to watch both
     */
    function lowering(listener: (unit: Unit, cause: EffectCause) => void): StageListeners {
      // Both events carry the change that was actually applied once
      // they have been resolved — a stage that was already at the
      // floor comes back as nothing moved — so a negative is a stat
      // that really did go down, whichever door it came through
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
     * Being sized up by an Intimidate. The ability lowers the Attack
     * of everything it can see, so the stare-down is read off the
     * cause of that drop rather than off the ability's own trigger,
     * which fires on the one doing the intimidating
     */
    function intimidated(listener: (unit: Unit) => void): StageListeners {
      return lowering((unit, cause) => {
        if (cause.type === EffectType.Ability && cause.ability === Abilities.Intimidate) {
          listener(unit);
        }
      });
    }

    const listening = new MergedLifecycle([
      /**
       * A Focus Sash is worth exactly one blow that would have finished
       * its holder, and only from full health — a pokemon already hurt
       * has nothing left for a sash to hold on to. Indirect damage is not
       * a blow, so nothing a status or a recoil does can be endured
       */
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

      // An Air Balloon holds its owner off the ground, which is the whole
      // of what a Ground move needs to miss
      battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
        if (
          event.grounded &&
          event.source.status[Statuses.Grounded] == null &&
          holds(event.source, Items.AirBalloon)
        ) {
          event.grounded = false;
        }
      }),

      /**
       * Everything that waits to be hit. The balloon pops on any blow at
       * all, the policy wants one that landed hard, and the elemental
       * ones want one of their own type — all three read the attack that
       * has just resolved, so all three are detected in the same place
       */
      battle.on(BattleEvents.UnitAttack, AttackPriority.Cleanup, (event) => {
        const holder = event.target;

        if (!event.success || event.category === MoveCategories.Status || !holder.alive) {
          return;
        }

        // Anything that lands takes the balloon with it
        spendItem(holder, Items.AirBalloon);

        if (landingHard(event)) {
          const cause = spendItem(holder, Items.WeaknessPolicy);

          if (cause) {
            holder.addStage(Stages.Attack, POLICY_STAGES, cause);
            holder.addStage(Stages.SpecialAttack, POLICY_STAGES, cause);
          }
        }

        for (const reaction of REACTIONS) {
          if (reaction.type !== event.type) {
            continue;
          }

          const cause = spendItem(holder, reaction.item);

          if (cause) {
            holder.addStage(reaction.stage, REACTION_STAGES, cause);
          }
        }

        // A confused pokemon hitting itself has nobody to send away
        if (event.source === holder) {
          return;
        }

        /**
         * A Red Card sends away whoever threw the blow. An enemy is
         * replaced by the worst of their bench; an ally doing its own
         * side no good where it is, by the best of theirs
         */
        const ally = event.source.team.alliance === holder.team.alliance;

        bench(
          holder,
          Items.RedCard,
          event.source,
          ally ? MoveTargetPriorities.Strongest : MoveTargetPriorities.Weakest,
          true,
        );

        // An Eject Button takes its own holder out instead
        bench(holder, Items.EjectButton, holder, MoveTargetPriorities.Strongest, false);
      }),

      // A Blunder Policy pays for a swing that hit nothing: the holder is
      // quicker for having wasted one
      battle.on(BattleEvents.UnitTriggerMoveMissed, EventPriority.Post, (event) => {
        const cause = spendItem(event.parent.source, Items.BlunderPolicy);

        if (cause) {
          event.parent.source.addStage(Stages.Speed, POLICY_STAGES, cause);
        }
      }),

      // A Throat Spray answers the shout rather than what it did
      battle.on(BattleEvents.UnitTriggerMove, EventPriority.Post, (event) => {
        if (!(getMoveData(event.move).flags & MoveFlags.Sound)) {
          return;
        }

        const cause = spendItem(event.source, Items.ThroatSpray);

        if (cause) {
          event.source.addStage(Stages.SpecialAttack, THROAT_SPRAY_STAGES, cause);
        }
      }),

      // An Adrenaline Orb answers being sized up rather than being
      // hit: the stare-down is what it is waiting for, and whether
      // the holder's Attack actually fell is beside the point
      ...intimidated((unit) => {
        const cause = spendItem(unit, Items.AdrenalineOrb);

        if (cause) {
          unit.addStage(Stages.Speed, REACTION_STAGES, cause);
        }
      }),

      /**
       * A stat is lowered either by taking one off — a Growl — or by
       * adding a negative one, which is how an Intimidate does it, so
       * the herb watches both doors
       */
      ...lowering((unit) => {
        const taken = lowered(unit);

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

      // An Eject Pack answers a stat going down rather than a blow
      // landing
      ...lowering((unit) => {
        bench(unit, Items.EjectPack, unit, MoveTargetPriorities.Strongest, false);
      }),

      // A Mental Herb clears the holder's head the moment it is turned
      battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
        if (event.status !== Statuses.Infatuated) {
          return;
        }

        const cause = spendItem(event.source, Items.MentalHerb);

        if (cause) {
          event.source.removeStatus(Statuses.Infatuated, cause);
        }
      }),

      battle.on(BattleEvents.UnitCast, EventPriority.Pre, (event) => {
        if (!holds(event.source, Items.PowerHerb)) {
          return;
        }

        // Marked before it is spent, not after: spending the last
        // one-shot on the field is what closes the family's gate, and
        // the gate asks whether a rushed cast is still owing
        rushed.add(event.source);

        if (!spendItem(event.source, Items.PowerHerb)) {
          rushed.delete(event.source);
        }
      }),

      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (rushed.has(event.source)) {
          event.duration = 0;
        }
      }),

      battle.on(BattleEvents.UnitFinishCast, EventPriority.Post, (event) => {
        rushed.delete(event.source);
      }),
      battle.on(BattleEvents.UnitStopCast, EventPriority.Post, (event) => {
        rushed.delete(event.source);
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        rushed.delete(event.source);
      }),
    ]);

    return {
      start: () => {
        listening.start();
      },
      /**
       * A Power Herb is spent as the cast opens and the cast time is
       * read a moment later, so the family has to stay listening while
       * a rushed cast is still in flight — even when the herb that
       * bought it was the last one-shot on the field
       */
      stop: () => {
        if (rushed.size === 0) {
          listening.stop();
        }
      },
    };
  },
);
