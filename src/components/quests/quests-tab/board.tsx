import { LockedCard, QuestCard, RotationCard } from './cards';
import { describeReward } from './describe';
import type { QuestStanding } from '../../../model/quest-record';
import { claimQuest } from '../../../auth/quests';
import { type RotationBoard, type RotationScope, claimRotation } from '../../../auth/rotations';
import { CHAINS, CHAIN_ORDER, type Chains, type Quests } from '../../../data/quests';
import { type QuestReward, QuestRewardKind } from '../../../data/quests/types';
import { GameDialog, useGame } from '../../app/game-context';
import {
  Meta,
  RailCount,
  RailTab,
  RailTabs,
  TabGroup,
  TabPane,
  type ToastTone,
  useToast,
} from '../../styled';
import { DAILY_SLOTS } from '../../../data/quests/rotations';
import { For, type ParentProps, type Resource, Show, createEffect, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import sayItems from '../../items/say-items';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * The places a rail row can open. The rotating asks and the two lists
 * of loose ones have a place each, and a chain's place is its own id
 * past them, so the open one is a single number a tab group can hold
 */
const enum Place {
  Daily = 0,
  Weekly = 1,
  Open = 2,
  Done = 3,
  /** Chain ids are added to this */
  Chain = 100,
}

/** The colour square of each chain's row, taken in the board's order */
const CHAIN_TONES = ['#36B26F', '#2360C8', '#D6372A', '#6E46C9', '#2BA3A3', '#F59A3B', '#E94B6A'];

/** A rail row's colour square */
function Dot(props: { tone: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="size-4 shrink-0 rounded-[5px] md:size-[18px] md:rounded-md"
      style={{ background: props.tone }}
    />
  );
}

/** The pane's head: its name, the line under it, and how far along it is */
function PaneHead(props: {
  name: string;
  line: string;
  /** Claimed over total for a place that has a total, for the progress track */
  share?: { claimed: number; total: number };
}): JSX.Element {
  return (
    <>
      <div class="flex flex-wrap items-baseline gap-x-2.5">
        <h3 class="m-0 font-display text-[22px] leading-tight font-semibold">{props.name}</h3>
        <span class="text-xs text-muted">{props.line}</span>
      </div>
      {/* Proposal, approved at the gate: how much of it is claimed */}
      <Show when={props.share != null && props.share.total > 0 ? props.share : null}>
        {(share) => (
          <div
            role="img"
            aria-label={m.quest_claimed_of({ claimed: share().claimed, total: share().total })}
            class="h-2 overflow-hidden rounded-full bg-line-soft"
          >
            <span
              class="block h-full rounded-full bg-leaf transition-[width] duration-(--motion-move)
                ease-settle"
              style={{ width: `${(share().claimed / share().total) * 100}%` }}
            />
          </div>
        )}
      </Show>
    </>
  );
}

export default function QuestBoard(props: {
  standings: Resource<QuestStanding[]>;
  rotations: Resource<RotationBoard>;
  onChanged: () => void;
  onClose: () => void;
}): JSX.Element {
  const game = useGame();
  const toast = useToast();
  /** One claim in the air at a time; the board re-reads after each */
  const [claiming, setClaiming] = createSignal(false);

  /**
   * The board as it last stood.
   *
   * `latest` rather than the accessor itself: claiming re-reads both
   * boards, and a read that suspends would take the whole panel back
   * to its fallback — losing which chains were open, where the list
   * was scrolled, and the card the player just pressed. The numbers
   * are a moment stale instead, which is what they were anyway. The
   * first read has nothing to keep and suspends as usual
   */
  const all = (): QuestStanding[] => props.standings.latest ?? [];
  const standingOf = (quest: Quests): QuestStanding | undefined => {
    for (const one of all()) {
      if (one.quest === quest) {
        return one;
      }
    }
    return undefined;
  };
  /** The quests that belong to some chain, kept out of the flat lists */
  const chained = new Set<Quests>();

  for (const chain of CHAIN_ORDER) {
    for (const quest of CHAINS[chain].quests) {
      chained.add(quest);
    }
  }
  /** Unchained standings, either claimed or not */
  const unchained = (claimed: boolean): QuestStanding[] => {
    const kept: QuestStanding[] = [];

    for (const one of all()) {
      if (one.claimed === claimed && !chained.has(one.quest)) {
        kept.push(one);
      }
    }
    return kept;
  };
  const open = (): QuestStanding[] => unchained(false);
  const done = (): QuestStanding[] => unchained(true);
  const claimedIn = (chain: Chains): number => {
    let count = 0;

    for (const quest of CHAINS[chain].quests) {
      if (standingOf(quest)?.claimed === true) {
        count += 1;
      }
    }
    return count;
  };
  const claimableIn = (chain: Chains): number => {
    let count = 0;

    for (const quest of CHAINS[chain].quests) {
      if (standingOf(quest)?.claimable === true) {
        count += 1;
      }
    }
    return count;
  };
  /**
   * The chains that open with the board: the ones holding something
   * to claim, or the first unfinished one for a player who is between
   * rewards
   */
  const ready = (): Chains[] => {
    const owed: Chains[] = [];

    for (const chain of CHAIN_ORDER) {
      if (claimableIn(chain) > 0) {
        owed.push(chain);
      }
    }
    if (owed.length > 0) {
      return owed;
    }

    for (const chain of CHAIN_ORDER) {
      if (claimedIn(chain) < CHAINS[chain].quests.length) {
        return [chain];
      }
    }
    return [];
  };

  /** The rotating board's cards that can be claimed now, daily or weekly */
  const dailyReady = (): number => {
    let count = 0;

    for (const standing of props.rotations.latest?.daily ?? []) {
      if (standing.claimable && !standing.claimed) {
        count += 1;
      }
    }
    return count;
  };
  const dailyClaimed = (): number => {
    let count = 0;

    for (const standing of props.rotations.latest?.daily ?? []) {
      if (standing.claimed) {
        count += 1;
      }
    }
    return count;
  };
  const weekly = (): RotationBoard['weekly'] | undefined => props.rotations.latest?.weekly;
  const weeklyReady = (): number => (weekly()?.claimable === true && !weekly()?.claimed ? 1 : 0);

  /** Which row is open: seeded once from the first standings to arrive, and the player's after */
  const [place, setPlace] = createSignal<number>(Place.Daily);
  let placed = false;

  createEffect(() => {
    if (placed || props.standings.latest == null) {
      return;
    }
    placed = true;
    // What is ready to claim, then the first unfinished chain, as the
    // board used to open them
    if (dailyReady() > 0 || weeklyReady() > 0) {
      setPlace(dailyReady() > 0 ? Place.Daily : Place.Weekly);
      return;
    }
    const owed = ready();

    if (owed.length > 0) {
      setPlace(Place.Chain + owed[0]);
    }
  });

  const say = (message: string, tone: ToastTone): void => {
    toast.push({ message, tone });
  };

  const claimRotating = (scope: RotationScope, slot: number): void => {
    if (claiming()) {
      return;
    }
    setClaiming(true);
    claimRotation(scope, slot)
      .then((paid) => {
        if (paid == null) {
          say(m.quest_not_ready(), 'ember');
          return;
        }
        // One line per kind with the item drawn beside it, the way a
        // stash out of the ground is said
        sayItems(toast, paid, m.quest_reward_label());
      })
      .catch(() => {
        say(m.quest_claim_failed(), 'ember');
      })
      .finally(() => {
        setClaiming(false);
        props.onChanged();
      });
  };

  const claim = (quest: Quests): void => {
    if (claiming()) {
      return;
    }
    setClaiming(true);
    claimQuest(quest)
      .then((payout) => {
        if (payout == null) {
          say(m.quest_not_ready(), 'ember');
          return;
        }
        // The items are drawn rather than listed; whatever else a quest
        // pays is a sentence, since a meeting and an egg arrive by
        // themselves anyway
        const paid: Extract<QuestReward, { kind: QuestRewardKind.Item }>[] = [];
        const rest: string[] = [];

        for (const one of payout.rewards) {
          if (one.kind === QuestRewardKind.Item) {
            paid.push(one);
          } else {
            rest.push(describeReward(one));
          }
        }
        sayItems(toast, paid, m.quest_reward_label());
        if (rest.length > 0) {
          say(m.quest_received({ rewards: rest.join(', ') }), 'leaf');
        }

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
        say(m.quest_claim_failed(), 'ember');
      })
      .finally(() => {
        setClaiming(false);
        props.onChanged();
      });
  };

  return (
    // The rows down the left from `md` up, a row of chips that scrolls
    // sideways on a phone, and the open one's cards beside them
    <TabGroup
      horizontal
      value={place()}
      onChange={(value) => {
        setPlace(value);
      }}
      class="flex min-h-0 flex-col gap-3 md:flex-row md:gap-0"
    >
      <RailTabs label={m.quest_sections()} class="md:w-[290px] md:px-2.5 md:py-1 md:pl-3.5">
        {/* The rotating asks first: today's three and the week's hunt
            turn over on their own, so they outrank the standing board */}
        <RailGroup label={m.quest_group_rotating()} />
        <RailTab value={Place.Daily}>
          <Dot tone="#F59A3B" />
          <span class="truncate">{m.quest_today()}</span>
          <RowCounts ready={dailyReady()}>
            {props.rotations.latest?.daily.length ?? DAILY_SLOTS}
          </RowCounts>
        </RailTab>
        <RailTab value={Place.Weekly}>
          <Dot tone="#F59A3B" />
          <span class="truncate">{m.quest_this_week()}</span>
          <RowCounts ready={weeklyReady()}>{weekly() == null ? 0 : 1}</RowCounts>
        </RailTab>
        <RailGroup label={m.quest_group_chains()} />
        <For each={CHAIN_ORDER}>
          {(chain, at) => (
            <RailTab value={Place.Chain + chain}>
              <Dot tone={CHAIN_TONES[at() % CHAIN_TONES.length]} />
              <span class="truncate">{CHAINS[chain].name}</span>
              <RowCounts ready={claimableIn(chain)}>
                {claimedIn(chain)} / {CHAINS[chain].quests.length}
              </RowCounts>
            </RailTab>
          )}
        </For>
        <RailGroup label={m.quest_group_other()} />
        <RailTab value={Place.Open}>
          <Dot tone="#2BA3A3" />
          <span class="truncate">{m.quest_asked_of_anybody()}</span>
          <RailCount>{open().length}</RailCount>
        </RailTab>
        <RailTab value={Place.Done}>
          <Dot tone="#9AA8C0" />
          <span class="truncate">{m.quest_done()}</span>
          <RailCount>{done().length}</RailCount>
        </RailTab>
      </RailTabs>

      <div class="flex min-h-0 min-w-0 grow flex-col gap-2.5 md:overflow-y-auto md:px-5 md:py-3">
        {/* Unkeyed, so a re-read swaps the numbers rather than the
            cards: a rebuilt card is one the player watches flicker */}
        <TabPane value={Place.Daily}>
          <div class="flex flex-col gap-2.5">
            <PaneHead
              name={m.quest_today()}
              line={m.quest_hint_rotation({ count: DAILY_SLOTS })}
              share={{ claimed: dailyClaimed(), total: props.rotations.latest?.daily.length ?? 0 }}
            />
            {/* By slot rather than by value: today's three keep
                their places, and a re-read is new numbers in the
                same three cards */}
            <For keyed={false} each={props.rotations.latest?.daily ?? []}>
              {(standing) => (
                <RotationCard
                  standing={standing()}
                  busy={claiming()}
                  onClaim={() => {
                    claimRotating('daily', standing().quest.slot);
                  }}
                />
              )}
            </For>
          </div>
        </TabPane>
        <TabPane value={Place.Weekly}>
          <div class="flex flex-col gap-2.5">
            <PaneHead
              name={m.quest_this_week()}
              line={m.quest_line_week()}
              share={{
                claimed: weekly()?.claimed === true ? 1 : 0,
                total: weekly() == null ? 0 : 1,
              }}
            />
            <Show when={weekly()}>
              {(standing) => (
                <RotationCard
                  standing={standing()}
                  busy={claiming()}
                  onClaim={() => {
                    claimRotating('weekly', standing().quest.slot);
                  }}
                />
              )}
            </Show>
          </div>
        </TabPane>
        {/* One chain a pane. There are a dozen of them and a player is
            working through one or two; whatever is ready to claim
            shows in the rail beside its name */}
        <For each={CHAIN_ORDER}>
          {(chain) => (
            <TabPane value={Place.Chain + chain}>
              <div class="flex flex-col gap-2.5">
                <PaneHead
                  name={CHAINS[chain].name}
                  line={m.quest_line_chain({
                    claimed: claimedIn(chain),
                    total: CHAINS[chain].quests.length,
                  })}
                  share={{ claimed: claimedIn(chain), total: CHAINS[chain].quests.length }}
                />
                <For each={CHAINS[chain].quests}>
                  {(quest) => (
                    <Show when={standingOf(quest)} fallback={<LockedCard quest={quest} />}>
                      {(standing) => (
                        <QuestCard standing={standing()} busy={claiming()} onClaim={claim} />
                      )}
                    </Show>
                  )}
                </For>
              </div>
            </TabPane>
          )}
        </For>
        <TabPane value={Place.Open}>
          <div class="flex flex-col gap-2.5">
            <PaneHead
              name={m.quest_asked_of_anybody()}
              line={m.quest_line_open()}
              share={{ claimed: 0, total: open().length }}
            />
            <Show when={open().length > 0} fallback={<Meta>{m.quest_none_here()}</Meta>}>
              <For each={open()}>
                {(standing) => <QuestCard standing={standing} busy={claiming()} onClaim={claim} />}
              </For>
            </Show>
          </div>
        </TabPane>
        <TabPane value={Place.Done}>
          <div class="flex flex-col gap-2.5">
            <PaneHead
              name={m.quest_done()}
              line={m.quest_line_done()}
              share={{ claimed: done().length, total: done().length }}
            />
            <Show when={done().length > 0} fallback={<Meta>{m.quest_none_here()}</Meta>}>
              <For each={done()}>
                {(standing) => <QuestCard standing={standing} busy={claiming()} onClaim={claim} />}
              </For>
            </Show>
          </div>
        </TabPane>
      </div>
    </TabGroup>
  );
}

/** A group's label in the rail's column; a phone's chip row has no room for it */
function RailGroup(props: { label: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="hidden px-2.5 pt-2.5 pb-1 text-[11px] font-extrabold tracking-[0.12em] text-muted
        uppercase first:pt-0.5 md:block"
    >
      {props.label}
    </span>
  );
}

/** A row's counts at its end: what can be claimed now, in green, before the count itself */
function RowCounts(props: ParentProps<{ ready: number }>): JSX.Element {
  return (
    <span class="ml-auto flex shrink-0 items-center gap-1">
      <Show when={props.ready > 0}>
        <span
          role="img"
          aria-label={m.quest_ready({ count: props.ready })}
          class="inline-flex h-[22px] min-w-[26px] items-center justify-center rounded-full
            bg-leaf px-1.5 font-display text-xs font-semibold text-on-accent tabular-nums"
        >
          {props.ready}
        </span>
      </Show>
      <RailCount>{props.children}</RailCount>
    </span>
  );
}
