import { TRAINER_NAMES } from '../../../data/overworld/trainers';
import { Foe, Landmark, Metric } from '../../../model/quest-record';
import { AWARD_NAMES } from '../../../data/awards';
import type Regions from '../../../data/ids/regions';
import { REGION_NAMES } from '../../../data/species/regions';
import type { QuestPayout } from '../../../auth/quests';
import { TYPE_NAMES } from '../../../data/constants/types';
import { Items } from '../../../data/ids/items';
import { getMoveData } from '../../../data/moves';
import { npcName } from '../../../overworld/npcs';
import {
  type QuestRequirement,
  type QuestReward,
  QuestRewardKind,
  RequirementKind,
} from '../../../data/quests';
import { getFamilyName, getSpeciesData } from '../../../data/species';
import { describeItem } from '../../details';
import {
  ActionsIcon,
  ArrowRightIcon,
  AtIcon,
  AuctionIcon,
  BagIcon,
  FireIcon,
  GiftIcon,
  GlobeIcon,
  MapIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TagIcon,
  TrophyIcon,
  UserIcon,
} from '../../icons';
import ItemSprite from '../../items/ItemSprite';
import TypeBadge from '../../sprites/TypeBadge';
import type { ComponentProps, JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';

/** The goal for claiming one kind of landmark: a sentence per kind, so the noun agrees with the count */
const LANDMARK_GOALS: Record<Landmark, (inputs: { count: number }) => string> = {
  [Landmark.Cache]: m.quest_landmark_cache,
  [Landmark.Berry]: m.quest_landmark_berry,
  [Landmark.Nest]: m.quest_landmark_nest,
  [Landmark.Phenomenon]: m.quest_landmark_phenomenon,
  [Landmark.Portal]: m.quest_landmark_portal,
  [Landmark.Apricorn]: m.quest_landmark_apricorn,
};

/** The goal for beating one kind of foe: a sentence per kind, so the noun agrees with the count */
const FOE_GOALS: Record<Foe, (inputs: { count: number }) => string> = {
  [Foe.Rocket]: m.quest_foe_rocket,
  [Foe.GymLeader]: m.quest_foe_gym_leader,
  [Foe.EliteFour]: m.quest_foe_elite_four,
  [Foe.Champion]: m.quest_foe_champion,
  [Foe.Trainer]: m.quest_foe_trainer,
  [Foe.GymSeat]: m.quest_foe_gym_seat,
};

/** A region's name with its capital back on, off the sheet-directory names */
function regionTitle(region: Regions): string {
  const name = REGION_NAMES[region];

  return name.slice(0, 1).toUpperCase() + name.slice(1);
}

/** One requirement, as a line of words */
export function describeRequirement(requirement: QuestRequirement): string {
  if (requirement.kind === RequirementKind.TurnIn) {
    return m.quest_hand_over({ count: requirement.count, item: describeItem(requirement.item) });
  }
  if (requirement.kind === RequirementKind.Dex) {
    return requirement.region == null
      ? m.quest_dex({ count: requirement.count })
      : m.quest_dex_region({ count: requirement.count, region: regionTitle(requirement.region) });
  }

  const count = requirement.count;

  switch (requirement.metric) {
    case Metric.Catches: {
      if (requirement.species != null) {
        return m.quest_catch_species({ count, name: getSpeciesData(requirement.species).name });
      }
      if (requirement.family != null) {
        return m.quest_catch_family({ count, family: getFamilyName(requirement.family) });
      }
      if (requirement.type != null) {
        return m.quest_catch_type({ count, type: TYPE_NAMES[requirement.type] });
      }
      return m.quest_catch_any({ count });
    }
    case Metric.Hatches:
      return requirement.species == null
        ? m.quest_hatch({ count })
        : m.quest_hatch_species({ count, name: getSpeciesData(requirement.species).name });
    case Metric.LevelUps:
      return m.quest_level_ups({ count });
    case Metric.ItemUses:
      return requirement.item == null
        ? m.quest_use_items({ count })
        : m.quest_use_item({ count, item: describeItem(requirement.item) });
    case Metric.Steps:
      return m.quest_steps({ count });
    case Metric.NpcVisits:
      return requirement.npc == null
        ? m.quest_wanderers({ count })
        : m.quest_wanderer({ count, name: npcName(requirement.npc) });
    case Metric.Landmarks:
      return requirement.landmark == null
        ? m.quest_landmarks({ count })
        : LANDMARK_GOALS[requirement.landmark]({ count });
    case Metric.RaidRuns:
      return m.quest_raid_runs({ count });
    case Metric.RaidWins:
      return m.quest_raid_wins({ count });
    case Metric.Trades:
      return m.quest_trades({ count });
    case Metric.Friends:
      return m.quest_friends({ count });
    case Metric.Auctions:
      return m.quest_auctions({ count });
    case Metric.Purifies:
      return m.quest_purifies({ count });
    case Metric.Evolutions: {
      if (requirement.species != null) {
        return m.quest_evolve_species({ count, name: getSpeciesData(requirement.species).name });
      }
      if (requirement.family != null) {
        return m.quest_evolve_family({ count, family: getFamilyName(requirement.family) });
      }
      if (requirement.type != null) {
        return m.quest_evolve_type({ count, type: TYPE_NAMES[requirement.type] });
      }
      return m.quest_evolve_any({ count });
    }
    case Metric.Releases:
      return requirement.species == null
        ? m.quest_release_any({ count })
        : m.quest_release_species({ count, name: getSpeciesData(requirement.species).name });
    case Metric.MovesLearned:
      return requirement.move == null
        ? m.quest_moves({ count })
        : m.quest_move({ count, name: getMoveData(requirement.move).name });
    case Metric.BattleWins:
      return requirement.foe == null
        ? m.quest_beat_trainers({ count })
        : FOE_GOALS[requirement.foe]({ count });
    case Metric.GoldEarned:
      return m.quest_gold_earned({ amount: formatNumber(count) });
    case Metric.GoldSpent:
      return m.quest_gold_spent({ amount: formatNumber(count) });
    case Metric.Gifts:
      return m.quest_gifts({ count });
    case Metric.Bids:
      return m.quest_bids({ count });
    case Metric.ShinyCatches:
      return requirement.species == null
        ? m.quest_shiny_any({ count })
        : m.quest_shiny_species({ count, name: getSpeciesData(requirement.species).name });
    case Metric.TrainerWins:
      return requirement.trainer == null
        ? m.quest_duel_trainers({ count })
        : m.quest_duel_trainer({ count, name: TRAINER_NAMES[requirement.trainer] });
    case Metric.Biomes:
      return m.quest_biomes({ count });
    case Metric.EffortAssigned:
      return m.quest_effort({ count });
  }
  // Every metric returns above; this only settles the return rule
  return '';
}

/** One reward, as the words on a badge */
export function describeReward(reward: QuestReward): string {
  switch (reward.kind) {
    case QuestRewardKind.Item:
      return m.quest_reward_item({ amount: reward.amount, item: describeItem(reward.item) });
    case QuestRewardKind.Catch:
      return m.ui_level_name({ level: reward.level, name: getSpeciesData(reward.species).name });
    case QuestRewardKind.Encounter:
      return m.quest_reward_meeting({
        level: reward.level,
        name: getSpeciesData(reward.species).name,
      });
    case QuestRewardKind.Egg:
      // What is in an egg is never said before it hatches
      return m.quest_reward_egg();
    case QuestRewardKind.Award:
      return AWARD_NAMES[reward.award];
  }
  // Every kind returns above; this only settles the return rule
  return '';
}

/** What claiming paid, said back in a sentence */
export function describePayout(payout: QuestPayout): string {
  const said: string[] = [];

  for (const reward of payout.rewards) {
    said.push(describeReward(reward));
  }
  return said.join(', ');
}

/**
 * The glyph a metric wears where the ask has no item or type of its
 * own to draw
 */
const METRIC_ICONS: Record<Metric, (props: ComponentProps<'svg'>) => JSX.Element> = {
  [Metric.Catches]: SparklesIcon,
  [Metric.Hatches]: SunIcon,
  [Metric.LevelUps]: StarIcon,
  [Metric.ItemUses]: BagIcon,
  [Metric.Steps]: MapIcon,
  [Metric.NpcVisits]: UserIcon,
  [Metric.Landmarks]: GlobeIcon,
  [Metric.RaidRuns]: FireIcon,
  [Metric.RaidWins]: TrophyIcon,
  [Metric.Trades]: TagIcon,
  [Metric.Friends]: AtIcon,
  [Metric.Auctions]: AuctionIcon,
  [Metric.Purifies]: SparklesIcon,
  [Metric.Evolutions]: SparklesIcon,
  [Metric.Releases]: ArrowRightIcon,
  [Metric.MovesLearned]: ActionsIcon,
  [Metric.BattleWins]: TrophyIcon,
  [Metric.GoldEarned]: TagIcon,
  [Metric.GoldSpent]: BagIcon,
  [Metric.Gifts]: GiftIcon,
  [Metric.Bids]: AuctionIcon,
  [Metric.ShinyCatches]: SparklesIcon,
  [Metric.TrainerWins]: TrophyIcon,
  [Metric.Biomes]: GlobeIcon,
  [Metric.EffortAssigned]: StarIcon,
};

/**
 * The picture in a tile's corner. An item and a glyph sit in the
 * grey square; a type is already a pill of its own colour and stands
 * bare, since a pill on a square reads as two badges fighting
 */
function requirementGlyph(requirement: QuestRequirement): JSX.Element {
  if (requirement.kind === RequirementKind.Dex) {
    return <SearchIcon class="size-5 text-muted" />;
  }
  if (requirement.kind === RequirementKind.TurnIn || requirement.item != null) {
    return <ItemSprite item={requirement.item ?? Items.PokeBall} size={24} label="" />;
  }
  return <Dynamic component={METRIC_ICONS[requirement.metric]} class="size-5 text-muted" />;
}

export function requirementIcon(requirement: QuestRequirement): JSX.Element {
  if (requirement.kind === RequirementKind.Counter && requirement.type != null) {
    return <TypeBadge type={requirement.type} class="shrink-0" />;
  }

  return (
    <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-line-soft/60">
      {requirementGlyph(requirement)}
    </span>
  );
}
