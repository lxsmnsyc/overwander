import { describeRequirement, describeReward, requirementIcon } from './describe';
import type { QuestStanding, RequirementStanding } from '../../../auth/quest-record';
import type { RotationStanding } from '../../../auth/rotations';
import {
  QUESTS,
  type QuestData,
  QuestRewardKind,
  type Quests,
  RequirementKind,
} from '../../../data/quests';
import { describeItem } from '../../details';
import { ChevronRightIcon } from '../../icons';
import ItemSprite from '../../items/ItemSprite';
import { Badge, Button, Meta } from '../../styled';
import { For, type JSX, Show } from 'solid-js';
import { Disclosure, DisclosureButton, DisclosurePanel } from 'terracotta';

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

export function QuestCard(props: {
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
 * One rotating quest as a card: the window's ask, the delta walked
 * so far, and the claim. The quest itself rides the standing, since
 * the board it belongs to is the date's rather than the registry's
 */
export function RotationCard(props: {
  standing: RotationStanding;
  busy: boolean;
  onClaim: () => void;
}): JSX.Element {
  const line = (): RequirementStanding => ({
    requirement: props.standing.quest.requirement,
    have: props.standing.have,
    met: props.standing.have >= props.standing.quest.requirement.count,
  });

  return (
    <div class="flex flex-col gap-2 rounded-panel border-2 border-line-soft p-3">
      <div class="flex items-center gap-3">
        <span class="min-w-0 grow truncate text-sm font-bold text-ink">
          {props.standing.quest.name}
        </span>
        <Show when={!props.standing.claimed} fallback={<Badge tone="leaf">Claimed</Badge>}>
          <Button
            tone="primary"
            disabled={!props.standing.claimable || props.busy}
            onClick={() => {
              props.onClaim();
            }}
          >
            Claim
          </Button>
        </Show>
      </div>
      <RequirementTile line={line()} />
      <div class="flex flex-wrap items-center gap-2">
        <Meta>Pays</Meta>
        <For each={props.standing.quest.rewards}>
          {(reward) => (
            <Badge tone="gold">
              <ItemSprite item={reward.item} size={16} label="" />
              {reward.amount} × {describeItem(reward.item)}
            </Badge>
          )}
        </For>
      </div>
    </div>
  );
}

/**
 * A chain link the player has not reached: the name says the chain
 * goes on, and nothing else is given away
 */
export function LockedCard(props: { quest: Quests }): JSX.Element {
  return (
    <div class="flex items-center gap-3 rounded-panel border-2 border-line-soft p-3 opacity-60">
      <span class="min-w-0 grow truncate text-sm font-bold text-muted">
        {QUESTS[props.quest].name}
      </span>
      <Meta>Locked</Meta>
    </div>
  );
}
