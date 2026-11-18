import { describeRequirement, describeReward, requirementIcon } from './describe';
import type { QuestStanding, RequirementStanding } from '../../../model/quest-record';
import type { RotationStanding } from '../../../auth/rotations';
import {
  QUESTS,
  type QuestData,
  QuestRewardKind,
  type Quests,
  RequirementKind,
} from '../../../data/quests';
import { describeItem } from '../../details';
import ItemSprite from '../../items/ItemSprite';
import { Badge, Button, Meta } from '../../styled';
import { For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * One ask as a tile: the picture, the words, the bar filling toward
 * the count, and the count itself, green once it is met
 */
function RequirementTile(props: { line: RequirementStanding }): JSX.Element {
  const asked = (): number => props.line.requirement.count;
  const share = (): number => Math.min(1, Math.max(0, props.line.have / Math.max(1, asked())));

  return (
    <div
      class={`flex items-center gap-2.5 rounded-[14px] border-2 px-2.5 py-2 ${
        props.line.met ? 'border-leaf bg-leaf-soft' : 'border-line-soft'
      }`}
    >
      {requirementIcon(props.line.requirement)}
      <div class="flex min-w-0 grow flex-col gap-1">
        <span class="truncate text-sm font-extrabold text-ink">
          {describeRequirement(props.line.requirement)}
        </span>
        <Show when={props.line.requirement.kind === RequirementKind.TurnIn}>
          <Meta>{m.quest_turn_in_note()}</Meta>
        </Show>
        <span class="h-[5px] overflow-hidden rounded-full bg-line-soft">
          <span
            class={`block h-full rounded-full ${props.line.met ? 'bg-leaf' : 'bg-tide'}`}
            style={{ width: `${share() * 100}%` }}
          />
        </span>
      </div>
      <Show
        when={props.line.met}
        fallback={
          <Meta class="shrink-0 font-extrabold">
            {Math.min(props.line.have, asked())} / {asked()}
          </Meta>
        }
      >
        <Badge tone="leaf">✓</Badge>
      </Show>
    </div>
  );
}

/** What a card says it is: ready to claim, as it stands, or beyond reach */
const CARD_LOOKS = {
  ready: 'border-leaf bg-paper ring-3 ring-leaf/15',
  plain: 'border-line-soft bg-paper',
  locked: 'border-dashed border-line-soft bg-line-soft/50 text-muted',
} as const;

/** The head of a card: its name, and the claim, the claimed mark or the lock */
function CardHead(props: { name: string; end: JSX.Element }): JSX.Element {
  return (
    <div class="flex items-center gap-2.5">
      <span class="min-w-0 grow truncate text-[15px] font-extrabold">{props.name}</span>
      {props.end}
    </div>
  );
}

/** What a quest pays, as gold pills with the item drawn where it is one */
function PaysLine(props: { children: JSX.Element }): JSX.Element {
  return (
    <div class="flex flex-wrap items-center gap-1.5">
      <Meta>{m.quest_pays()}</Meta>
      {props.children}
    </div>
  );
}

function ClaimEnd(props: {
  claimed: boolean;
  claimable: boolean;
  busy: boolean;
  onClaim: () => void;
}): JSX.Element {
  return (
    <Show when={!props.claimed} fallback={<Badge tone="leaf">{m.quest_claimed()}</Badge>}>
      <Button
        tone="primary"
        disabled={!props.claimable || props.busy}
        onClick={() => {
          props.onClaim();
        }}
      >
        {m.quest_claim()}
      </Button>
    </Show>
  );
}

export function QuestCard(props: {
  standing: QuestStanding;
  busy: boolean;
  onClaim: (quest: Quests) => void;
}): JSX.Element {
  const data = (): QuestData => QUESTS[props.standing.quest];

  return (
    <div
      class={`flex flex-col gap-2 rounded-card border-2 p-3 ${
        props.standing.claimable && !props.standing.claimed ? CARD_LOOKS.ready : CARD_LOOKS.plain
      }`}
    >
      <CardHead
        name={data().name}
        end={
          <ClaimEnd
            claimed={props.standing.claimed}
            claimable={props.standing.claimable}
            busy={props.busy}
            onClaim={() => {
              props.onClaim(props.standing.quest);
            }}
          />
        }
      />
      <div class="flex flex-col gap-1.5">
        <For each={props.standing.requirements}>{(line) => <RequirementTile line={line} />}</For>
      </div>
      <PaysLine>
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
      </PaysLine>
    </div>
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
    <div
      class={`flex flex-col gap-2 rounded-card border-2 p-3 ${
        props.standing.claimable && !props.standing.claimed ? CARD_LOOKS.ready : CARD_LOOKS.plain
      }`}
    >
      <CardHead
        name={props.standing.quest.name}
        end={
          <ClaimEnd
            claimed={props.standing.claimed}
            claimable={props.standing.claimable}
            busy={props.busy}
            onClaim={props.onClaim}
          />
        }
      />
      <RequirementTile line={line()} />
      <PaysLine>
        <For each={props.standing.quest.rewards}>
          {(reward) => (
            <Badge tone="gold">
              <ItemSprite item={reward.item} size={16} label="" />
              {m.quest_reward_item({ amount: reward.amount, item: describeItem(reward.item) })}
            </Badge>
          )}
        </For>
      </PaysLine>
    </div>
  );
}

/**
 * A chain link the player has not reached: the name says the chain
 * goes on, and nothing else is given away
 */
export function LockedCard(props: { quest: Quests }): JSX.Element {
  return (
    <div class={`flex flex-col gap-1 rounded-card border-2 p-3 ${CARD_LOOKS.locked}`}>
      <CardHead name={QUESTS[props.quest].name} end={<Badge>{m.quest_locked()}</Badge>} />
      <Meta>{m.quest_locked_note()}</Meta>
    </div>
  );
}
