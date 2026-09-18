import { LockedCard, QuestCard, RotationCard } from './cards';
import { describeReward } from './describe';
import type { QuestStanding } from '../../../auth/quest-record';
import { claimQuest } from '../../../auth/quests';
import { type RotationBoard, type RotationScope, claimRotation } from '../../../auth/rotations';
import { CHAINS, CHAIN_ORDER, type Chains, type Quests } from '../../../data/quests';
import { type QuestReward, QuestRewardKind } from '../../../data/quests/types';
import { GameDialog, useGame } from '../../app/game-context';
import { Badge, DialogSection, Hint, HintList, type ToastTone, useToast } from '../../styled';
import { DAILY_SLOTS } from '../../../data/quests/rotations';
import { For, Index, type JSX, type Resource, Show, createEffect, createSignal } from 'solid-js';
import {
  Accordion,
  AccordionButton,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from 'terracotta';
import { ChevronRightIcon } from '../../icons';
import sayItems from '../../items/say-items';

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

  /**
   * Which chains stand open, held here rather than by the accordion.
   *
   * Left to its own devices it would take the opening set as a prop,
   * and that prop is worked out from the standings — so every re-read
   * after a claim would shut whatever the player had opened and open
   * what the board thinks is interesting. Seeded once from the first
   * standings to arrive, and theirs after that
   */
  const [openChains, setOpenChains] = createSignal<Chains[]>([]);
  let seeded = false;

  createEffect(() => {
    if (seeded || props.standings.latest == null) {
      return;
    }
    seeded = true;
    setOpenChains(ready());
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
          say('That quest is not ready to claim.', 'ember');
          return;
        }
        // One line per kind with the item drawn beside it, the way a
        // stash out of the ground is said
        sayItems(toast, paid, 'Quest reward');
      })
      .catch(() => {
        say('That could not be claimed.', 'ember');
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
          say('That quest is not ready to claim.', 'ember');
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
        sayItems(toast, paid, 'Quest reward');
        if (rest.length > 0) {
          say(`Received ${rest.join(', ')}.`, 'leaf');
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
        say('That could not be claimed.', 'ember');
      })
      .finally(() => {
        setClaiming(false);
        props.onChanged();
      });
  };

  return (
    <div class="flex flex-col gap-4">
      {/* The rotating asks first: today's three and the week's hunt
          turn over on their own, so they outrank the standing board.
          Unkeyed, so a re-read swaps the numbers rather than the
          cards: a rebuilt card is one the player watches flicker */}
      <Show when={props.rotations.latest}>
        {(board) => (
          <>
            <DialogSection
              title="Today"
              hint={
                <Hint title="About quests">
                  <HintList>
                    <li>
                      {DAILY_SLOTS} dailies refresh every day at midnight UTC, and one weekly hunt
                      refreshes every Monday.
                    </li>
                    <li>Only what you do after a daily or weekly starts counts toward it.</li>
                    <li>
                      Each chain below opens one step at a time, as you finish the one before.
                    </li>
                    <li>A finished quest waits for you to claim its reward.</li>
                  </HintList>
                </Hint>
              }
            >
              {/* By slot rather than by value: today's three keep
                  their places, and a re-read is new numbers in the
                  same three cards */}
              <Index each={board().daily}>
                {(standing) => (
                  <RotationCard
                    standing={standing()}
                    busy={claiming()}
                    onClaim={() => {
                      claimRotating('daily', standing().quest.slot);
                    }}
                  />
                )}
              </Index>
            </DialogSection>
            <DialogSection title="This week">
              <RotationCard
                standing={board().weekly}
                busy={claiming()}
                onClaim={() => {
                  claimRotating('weekly', board().weekly.quest.slot);
                }}
              />
            </DialogSection>
          </>
        )}
      </Show>

      {/* One chain a row, shut. There are a dozen of them and a
          player is working through one or two, so the board opens as
          a list of what the game teaches rather than as every ask it
          holds; whatever is ready to claim is opened for them */}
      <Accordion
        as="div"
        multiple
        toggleable
        value={openChains()}
        onChange={(chains) => {
          setOpenChains(chains);
        }}
        class="flex flex-col gap-2"
      >
        <For each={CHAIN_ORDER}>
          {(chain) => (
            <AccordionItem
              as="div"
              value={chain}
              class="flex flex-col rounded-panel border-2 border-line-soft"
            >
              <AccordionHeader as="h3" class="m-0">
                <AccordionButton
                  class="group flex w-full cursor-pointer items-center gap-2 border-0
                    bg-transparent p-3 text-left shadow-none focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-tide"
                >
                  <ChevronRightIcon
                    aria-hidden="true"
                    class="size-4 shrink-0 text-muted transition-transform
                      group-aria-expanded:rotate-90"
                  />
                  <span class="min-w-0 grow truncate text-sm font-bold text-ink">
                    {CHAINS[chain].name}
                  </span>
                  <Show when={claimableIn(chain) > 0}>
                    <Badge tone="leaf">{claimableIn(chain)} ready</Badge>
                  </Show>
                  <Badge
                    tone={claimedIn(chain) === CHAINS[chain].quests.length ? 'leaf' : 'neutral'}
                  >
                    {claimedIn(chain)} / {CHAINS[chain].quests.length}
                  </Badge>
                </AccordionButton>
              </AccordionHeader>
              <AccordionPanel class="flex flex-col gap-2 p-3 pt-0">
                <For each={CHAINS[chain].quests}>
                  {(quest) => (
                    <Show when={standingOf(quest)} fallback={<LockedCard quest={quest} />}>
                      {(standing) => (
                        <QuestCard standing={standing()} busy={claiming()} onClaim={claim} />
                      )}
                    </Show>
                  )}
                </For>
              </AccordionPanel>
            </AccordionItem>
          )}
        </For>
      </Accordion>

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
