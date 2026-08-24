import {
  type ComponentProps,
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Disclosure, DisclosureButton, DisclosurePanel } from 'terracotta';
import {
  Landmark,
  Metric,
  type QuestStanding,
  type RequirementStanding,
} from '../../auth/quest-record';
import { type QuestPayout, claimQuest, getQuests } from '../../auth/quests';
import { GameDialog, useGame } from '../app/game-context';
import {
  CHAINS,
  CHAIN_ORDER,
  type Chains,
  QUESTS,
  type QuestData,
  type QuestRequirement,
  type QuestReward,
  QuestRewardKind,
  type Quests,
  RequirementKind,
} from '../../data/quests';
import { TYPE_NAMES } from '../../data/constants/types';
import { Items } from '../../data/ids/items';
import { NPC_NAMES } from '../../data/overworld/npc';
import { getFamilyName, getSpeciesData } from '../../data/species';
import { describeItem } from '../details';
import {
  AtIcon,
  AuctionIcon,
  BagIcon,
  ChevronRightIcon,
  FireIcon,
  GlobeIcon,
  MapIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  TagIcon,
  TrophyIcon,
  UserIcon,
} from '../icons';
import ItemSprite from '../items/ItemSprite';
import TypeBadge from '../sprites/TypeBadge';
import { Badge, Button, DialogSection, Meta, Note, type ToastTone, useToast } from '../styled';

/**
 * The quest board: what the game asks, where the player stands on
 * each ask, and the claiming. Progress is the server's arithmetic;
 * this only draws the numbers it is handed.
 */

/** What a landmark kind is called on a requirement line */
const LANDMARK_NAMES: Record<Landmark, string> = {
  [Landmark.Cache]: 'item caches',
  [Landmark.Berry]: 'berry patches',
  [Landmark.Nest]: 'nests',
  [Landmark.Phenomenon]: 'phenomena',
};

/** One requirement, as a line of words */
function describeRequirement(requirement: QuestRequirement): string {
  if (requirement.kind === RequirementKind.TurnIn) {
    return `Hand over ${requirement.count} × ${describeItem(requirement.item)}`;
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
  }
  // Every metric returns above; this only settles the return rule
  return '';
}

/** One reward, as the words on a badge */
function describeReward(reward: QuestReward): string {
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
function describePayout(payout: QuestPayout): string {
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
};

/**
 * The picture in a tile's corner. An item and a glyph sit in the
 * grey square; a type is already a pill of its own colour and stands
 * bare, since a pill on a square reads as two badges fighting
 */
function requirementIcon(requirement: QuestRequirement): JSX.Element {
  if (requirement.kind === RequirementKind.Counter && requirement.type != null) {
    return <TypeBadge type={requirement.type} class="shrink-0" />;
  }

  return (
    <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-line-soft/60">
      {requirement.kind === RequirementKind.TurnIn || requirement.item != null ? (
        <ItemSprite item={requirement.item ?? Items.PokeBall} size={24} label="" />
      ) : (
        <Dynamic component={METRIC_ICONS[requirement.metric]} class="size-5 text-muted" />
      )}
    </span>
  );
}

/**
 * One ask as a tile: the picture, the words, the bar filling toward
 * the count, and the count itself, green once it is met
 */
function RequirementTile(props: { line: RequirementStanding }): JSX.Element {
  const asked = (): number => props.line.requirement.count;
  const share = (): number => Math.min(1, Math.max(0, props.line.have / Math.max(1, asked())));

  return (
    <div
      class={`flex items-center gap-3 rounded-panel border-2 p-2 ${
        props.line.met ? 'border-leaf bg-leaf-soft/40' : 'border-line-soft'
      }`}
    >
      {requirementIcon(props.line.requirement)}
      <div class="flex min-w-0 grow flex-col gap-1">
        <span class="truncate text-sm font-bold text-ink">
          {describeRequirement(props.line.requirement)}
        </span>
        <Show when={props.line.requirement.kind === RequirementKind.TurnIn}>
          <Meta>Taken from the bag when you claim.</Meta>
        </Show>
        <span class="h-1 overflow-hidden rounded-full bg-line-soft">
          <span
            class={`block h-full ${props.line.met ? 'bg-leaf' : 'bg-tide'}`}
            style={{ width: `${share() * 100}%` }}
          />
        </span>
      </div>
      <Show
        when={props.line.met}
        fallback={
          <Meta class="shrink-0">
            {Math.min(props.line.have, asked())} / {asked()}
          </Meta>
        }
      >
        <Badge tone="leaf">✓</Badge>
      </Show>
    </div>
  );
}

function QuestCard(props: {
  standing: QuestStanding;
  busy: boolean;
  onClaim: (quest: Quests) => void;
}): JSX.Element {
  const data = (): QuestData => QUESTS[props.standing.quest];

  return (
    <Disclosure
      defaultOpen={props.standing.claimable}
      class="flex flex-col rounded-panel border-2 border-line-soft p-3"
    >
      <div class="flex items-center gap-3">
        {/* The name is the handle; the claiming stays its own press
            beside it, so opening and paying cannot be one slip */}
        <DisclosureButton
          class="group flex min-w-0 grow cursor-pointer items-center gap-2 border-0 bg-transparent
            p-0 text-left text-sm font-bold text-ink shadow-none focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-tide"
        >
          <ChevronRightIcon
            aria-hidden="true"
            class="size-4 shrink-0 text-muted transition-transform group-aria-expanded:rotate-90"
          />
          <span class="min-w-0 truncate">{data().name}</span>
        </DisclosureButton>
        <Show when={!props.standing.claimed} fallback={<Badge tone="leaf">Claimed</Badge>}>
          <Button
            tone="primary"
            disabled={!props.standing.claimable || props.busy}
            onClick={() => {
              props.onClaim(props.standing.quest);
            }}
          >
            Claim
          </Button>
        </Show>
      </div>

      <DisclosurePanel class="flex flex-col gap-2 pt-2">
        <div class="flex flex-col gap-1.5">
          <For each={props.standing.requirements}>{(line) => <RequirementTile line={line} />}</For>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Meta>Pays</Meta>
          <For each={data().rewards}>
            {(reward) => (
              <Badge tone="gold">
                {reward.kind === QuestRewardKind.Item ? (
                  <ItemSprite item={reward.item} size={16} label="" />
                ) : null}
                {describeReward(reward)}
              </Badge>
            )}
          </For>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

/**
 * A chain link the player has not reached: the name says the chain
 * goes on, and nothing else is given away
 */
function LockedCard(props: { quest: Quests }): JSX.Element {
  return (
    <div class="flex items-center gap-3 rounded-panel border-2 border-line-soft p-3 opacity-60">
      <span class="min-w-0 grow truncate text-sm font-bold text-muted">
        {QUESTS[props.quest].name}
      </span>
      <Meta>Locked</Meta>
    </div>
  );
}

function QuestBoard(props: {
  standings: Resource<QuestStanding[]>;
  onChanged: () => void;
  onClose: () => void;
}): JSX.Element {
  const game = useGame();
  const toast = useToast();
  /** One claim in the air at a time; the board re-reads after each */
  const [claiming, setClaiming] = createSignal(false);

  const all = (): QuestStanding[] => props.standings() ?? [];
  const standingOf = (quest: Quests): QuestStanding | undefined =>
    all().find((one) => one.quest === quest);
  /** The quests that belong to some chain, kept out of the flat lists */
  const chained = new Set<Quests>(CHAIN_ORDER.flatMap((chain) => CHAINS[chain].quests));
  const open = (): QuestStanding[] =>
    all().filter((one) => !one.claimed && !chained.has(one.quest));
  const done = (): QuestStanding[] => all().filter((one) => one.claimed && !chained.has(one.quest));
  const claimedIn = (chain: Chains): number =>
    CHAINS[chain].quests.filter((quest) => standingOf(quest)?.claimed === true).length;

  const say = (message: string, tone: ToastTone): void => {
    toast.push({ message, tone });
  };

  const claim = (quest: Quests): void => {
    if (claiming()) {
      return;
    }
    setClaiming(true);
    claimQuest(quest)
      .then((payout) => {
        if (payout == null) {
          say('That quest is not ready to claim.', 'ember');
          return;
        }
        say(`Received ${describePayout(payout)}.`, 'leaf');

        if (payout.egg != null) {
          game.touchRecords();
        }
        // A meeting is not handed over: it is standing there, and the
        // board gets out of the way so the player can throw at it
        if (payout.encounter != null) {
          game.setDialog(GameDialog.None);
          game.setEncounter(payout.encounter);
          props.onClose();
        }
      })
      .catch(() => {
        say('That could not be claimed.', 'ember');
      })
      .finally(() => {
        setClaiming(false);
        props.onChanged();
      });
  };

  return (
    <div class="flex flex-col gap-4">
      {/* Each chain is one group under its own progress count. A link
          not yet unlocked is named and nothing more */}
      <For each={CHAIN_ORDER}>
        {(chain) => (
          <section class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <h3 class="min-w-0 grow">{CHAINS[chain].name}</h3>
              <Badge>
                {claimedIn(chain)} / {CHAINS[chain].quests.length}
              </Badge>
            </div>
            <For each={CHAINS[chain].quests}>
              {(quest) => (
                <Show when={standingOf(quest)} fallback={<LockedCard quest={quest} />}>
                  {(standing) => (
                    <QuestCard standing={standing()} busy={claiming()} onClaim={claim} />
                  )}
                </Show>
              )}
            </For>
          </section>
        )}
      </For>

      <Show when={open().length > 0}>
        <DialogSection title="Asked of anybody">
          <For each={open()}>
            {(standing) => <QuestCard standing={standing} busy={claiming()} onClaim={claim} />}
          </For>
        </DialogSection>
      </Show>

      <Show when={done().length > 0}>
        <DialogSection title="Done">
          <For each={done()}>
            {(standing) => <QuestCard standing={standing} busy={claiming()} onClaim={claim} />}
          </For>
        </DialogSection>
      </Show>
    </div>
  );
}

export interface QuestsTabProps {
  /** Called when a claimed meeting takes the page, so the dialog shuts */
  onClose: () => void;
}

export default function QuestsTab(props: QuestsTabProps): JSX.Element {
  const [standings, { refetch }] = createResource(getQuests);

  return (
    <Suspense fallback={<Note class="text-center">Looking…</Note>}>
      <QuestBoard
        standings={standings}
        onClose={props.onClose}
        onChanged={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
