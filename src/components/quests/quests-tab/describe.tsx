import { TRAINER_NAMES } from '../../../data/overworld/trainers';
import { Foe, Landmark, Metric } from '../../../auth/quest-record';
import type { QuestPayout } from '../../../auth/quests';
import { TYPE_NAMES } from '../../../data/constants/types';
import { Items } from '../../../data/ids/items';
import { getMoveData } from '../../../data/moves';
import { NPC_NAMES } from '../../../data/overworld/npc';
import { type QuestRequirement, type QuestReward, QuestRewardKind, RequirementKind } from '../../../data/quests';
import { getFamilyName, getSpeciesData } from '../../../data/species';
import { describeItem } from '../../details';
import { ActionsIcon, ArrowRightIcon, AtIcon, AuctionIcon, BagIcon, FireIcon, GiftIcon, GlobeIcon, MapIcon, SearchIcon, SparklesIcon, StarIcon, SunIcon, TagIcon, TrophyIcon, UserIcon } from '../../icons';
import ItemSprite from '../../items/ItemSprite';
import TypeBadge from '../../sprites/TypeBadge';
import type { ComponentProps, JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';

/** What a landmark kind is called on a requirement line */
const LANDMARK_NAMES: Record<Landmark, string> = {
  [Landmark.Cache]: 'item caches',
  [Landmark.Berry]: 'berry patches',
  [Landmark.Nest]: 'nests',
  [Landmark.Phenomenon]: 'phenomena',
  [Landmark.Portal]: 'portal crossings',
};

/** What a battle foe is called on a requirement line */
const FOE_NAMES: Record<Foe, string> = {
  [Foe.Rocket]: 'Team Rocket stops',
  [Foe.GymLeader]: 'gym leaders',
  [Foe.EliteFour]: 'Elite Four members',
  [Foe.Champion]: 'Champions',
  [Foe.Trainer]: 'duelling trainers',
};

/** One requirement, as a line of words */
export function describeRequirement(requirement: QuestRequirement): string {
  if (requirement.kind === RequirementKind.TurnIn) {
    return `Hand over ${requirement.count} × ${describeItem(requirement.item)}`;
  }
  if (requirement.kind === RequirementKind.Dex) {
    return `Catch ${requirement.count} different species`;
  }

  const count = requirement.count;

  switch (requirement.metric) {
    case Metric.Catches: {
      if (requirement.species != null) {
        return `Catch ${count} × ${getSpeciesData(requirement.species).name}`;
      }
      if (requirement.family != null) {
        return `Catch ${count} from the ${getFamilyName(requirement.family)} line`;
      }
      if (requirement.type != null) {
        return `Catch ${count} ${TYPE_NAMES[requirement.type]} type${count === 1 ? '' : 's'}`;
      }
      return `Catch ${count} pokemon`;
    }
    case Metric.Hatches:
      return requirement.species == null
        ? `Hatch ${count} egg${count === 1 ? '' : 's'}`
        : `Hatch ${count} × ${getSpeciesData(requirement.species).name}`;
    case Metric.LevelUps:
      return `Raise ${count} level${count === 1 ? '' : 's'}`;
    case Metric.ItemUses:
      return requirement.item == null
        ? `Use ${count} item${count === 1 ? '' : 's'}`
        : `Use ${count} × ${describeItem(requirement.item)}`;
    case Metric.Steps:
      return `Walk ${count} steps with a buddy`;
    case Metric.NpcVisits:
      return requirement.npc == null
        ? `Deal with ${count} wanderer${count === 1 ? '' : 's'}`
        : `Deal with a ${NPC_NAMES[requirement.npc]} ${count} time${count === 1 ? '' : 's'}`;
    case Metric.Landmarks:
      return requirement.landmark == null
        ? `Claim ${count} landmark${count === 1 ? '' : 's'}`
        : `Claim ${count} ${LANDMARK_NAMES[requirement.landmark]}`;
    case Metric.RaidRuns:
      return `Fight in ${count} raid${count === 1 ? '' : 's'}`;
    case Metric.RaidWins:
      return `Win ${count} raid${count === 1 ? '' : 's'}`;
    case Metric.Trades:
      return `Settle ${count} trade${count === 1 ? '' : 's'}`;
    case Metric.Friends:
      return `Make ${count} friend${count === 1 ? '' : 's'}`;
    case Metric.Auctions:
      return `Settle ${count} auction${count === 1 ? '' : 's'}`;
    case Metric.Purifies:
      return `Purify ${count} shadow${count === 1 ? '' : 's'}`;
    case Metric.Evolutions: {
      if (requirement.species != null) {
        return `Evolve ${count} × ${getSpeciesData(requirement.species).name}`;
      }
      if (requirement.family != null) {
        return `Evolve ${count} from the ${getFamilyName(requirement.family)} line`;
      }
      if (requirement.type != null) {
        return `Evolve ${count} ${TYPE_NAMES[requirement.type]} type${count === 1 ? '' : 's'}`;
      }
      return `Evolve ${count} pokemon`;
    }
    case Metric.Releases:
      return requirement.species == null
        ? `Release ${count} pokemon`
        : `Release ${count} × ${getSpeciesData(requirement.species).name}`;
    case Metric.MovesLearned:
      return requirement.move == null
        ? `Teach ${count} move${count === 1 ? '' : 's'}`
        : `Teach ${getMoveData(requirement.move).name} ${count} time${count === 1 ? '' : 's'}`;
    case Metric.BattleWins:
      return requirement.foe == null
        ? `Beat ${count} trainer${count === 1 ? '' : 's'}`
        : `Beat ${count} ${FOE_NAMES[requirement.foe]}`;
    case Metric.GoldEarned:
      return `Earn ${count.toLocaleString()} gold`;
    case Metric.GoldSpent:
      return `Spend ${count.toLocaleString()} gold`;
    case Metric.Gifts:
      return `Claim ${count} mystery gift${count === 1 ? '' : 's'}`;
    case Metric.Bids:
      return `Bid in ${count} auction${count === 1 ? '' : 's'}`;
    case Metric.ShinyCatches:
      return requirement.species == null
        ? `Catch ${count} shiny pokemon`
        : `Catch ${count} shiny ${getSpeciesData(requirement.species).name}`;
    case Metric.TrainerWins:
      return requirement.trainer == null
        ? `Beat ${count} duelling trainer${count === 1 ? '' : 's'}`
        : `Beat ${count} ${TRAINER_NAMES[requirement.trainer]}${count === 1 ? '' : 's'}`;
  }
  // Every metric returns above; this only settles the return rule
  return '';
}

/** One reward, as the words on a badge */
export function describeReward(reward: QuestReward): string {
  switch (reward.kind) {
    case QuestRewardKind.Item:
      return `${reward.amount} × ${describeItem(reward.item)}`;
    case QuestRewardKind.Catch:
      return `Lv. ${reward.level} ${getSpeciesData(reward.species).name}`;
    case QuestRewardKind.Encounter:
      return `A meeting: Lv. ${reward.level} ${getSpeciesData(reward.species).name}`;
    case QuestRewardKind.Egg:
      // What is in an egg is never said before it hatches
      return 'A pokemon egg';
  }
  // Every kind returns above; this only settles the return rule
  return '';
}

/** What claiming paid, said back in a sentence */
export function describePayout(payout: QuestPayout): string {
  return payout.rewards.map(describeReward).join(', ');
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
