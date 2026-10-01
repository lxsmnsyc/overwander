import { AttackPriority } from '../../../core/event-emitter';
import { MAX_STAGE, type Stages } from '../../../data/constants/stats';
import { MoveCategories, type Moves } from '../../../data/ids/moves';
import { getMoveData } from '../../../data/moves';
import type { Types } from '../../../data/constants/types';
import type Abilities from '../../../data/ids/abilities';
import { FEED_BONUS, healWorth } from '../../ai/score';
import type Battle from '../../core';
import { BattleEvents, type MoveTarget, MoveTargetType } from '../../events';
import { type Lifecycle, MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { type AbsorbMatcher, movesOfType } from './matchers';

/** What an ability is worth to the AI weighing a move */
/**
 * What feeding this ability is worth to the side that holds it.
 *
 * A teammate may aim a move of the absorbed type at the holder, and
 * the hit lands as whatever the ability pays out instead of as
 * damage. Nothing else can work that out: the payout rides a failed
 * move, which the chooser's speculative pass never emits, so without
 * being told the AI treats the feed as a hit that does nothing.
 *
 * The gain is the ability's own, so a healer weighs the health it
 * would restore and a stage-raiser what the stage is worth
 */
export function createFeedScoring(
  battle: Battle,
  targetAbility: Abilities,
  matches: AbsorbMatcher,
  worth: (holder: Unit) => number,
): Lifecycle {
  /** What the feed pays the holder, or null when this is not one */
  function fed(event: { source: Unit; move: Moves; target: MoveTarget }): number | null {
    if (
      event.target.type !== MoveTargetType.Unit ||
      event.target.unit === event.source ||
      event.target.unit.team.alliance !== event.source.team.alliance ||
      getMoveData(event.move).category === MoveCategories.Status ||
      !event.target.unit.hasAbility(targetAbility) ||
      !matches(
        event.source,
        event.move,
        event.target,
        event.source.checkMoveType(event.move, event.target),
      )
    ) {
      return null;
    }
    return worth(event.target.unit);
  }

  return new MergedLifecycle([
    battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
      event.score += fed(event) ?? 0;
    }),
    // A feed that pays nothing, a stage already at its top, is no reason to aim
    battle.on(BattleEvents.CheckUnitAIMoveFeeds, AttackPriority.Post, (event) => {
      if ((fed(event) ?? 0) > 0) {
        event.feeds = true;
      }
    }),
  ]);
}

/**
 * Feeding an ability that answers with a heal, weighed by the hole it
 * would fill
 */
export function createHealFeedScoring(
  battle: Battle,
  targetAbility: Abilities,
  targetType: Types,
  fraction: number,
): Lifecycle {
  return createFeedScoring(battle, targetAbility, movesOfType(targetType), (holder) =>
    healWorth(holder, fraction),
  );
}

/**
 * Feeding an ability that answers with a stage, which is worth
 * nothing once that stage is as high as it goes
 */
export function createStageFeedScoring(
  battle: Battle,
  targetAbility: Abilities,
  targetType: Types,
  stage: Stages,
): Lifecycle {
  return createFeedScoring(battle, targetAbility, movesOfType(targetType), (holder) =>
    holder.stages[stage] >= MAX_STAGE ? 0 : FEED_BONUS,
  );
}
