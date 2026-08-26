import { LockedCard, QuestCard, RotationCard } from './cards';
import { describePayout } from './describe';
import type { QuestStanding } from '../../../auth/quest-record';
import { claimQuest } from '../../../auth/quests';
import { type RotationBoard, type RotationScope, claimRotation } from '../../../auth/rotations';
import { CHAINS, CHAIN_ORDER, type Chains, type Quests } from '../../../data/quests';
import { GameDialog, useGame } from '../../app/game-context';
import { describeItem } from '../../details';
import { Badge, DialogSection, type ToastTone, useToast } from '../../styled';
import { For, type JSX, type Resource, Show, createSignal } from 'solid-js';

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
        say(
          `Received ${paid.map((one) => `${one.amount} × ${describeItem(one.item)}`).join(', ')}.`,
          'leaf',
        );
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
      {/* The rotating asks first: today's three and the week's hunt
          turn over on their own, so they outrank the standing board */}
      <Show when={props.rotations()} keyed>
        {(board) => (
          <>
            <DialogSection title="Today">
              <For each={board.daily}>
                {(standing) => (
                  <RotationCard
                    standing={standing}
                    busy={claiming()}
                    onClaim={() => {
                      claimRotating('daily', standing.quest.slot);
                    }}
                  />
                )}
              </For>
            </DialogSection>
            <DialogSection title="This week">
              <RotationCard
                standing={board.weekly}
                busy={claiming()}
                onClaim={() => {
                  claimRotating('weekly', board.weekly.quest.slot);
                }}
              />
            </DialogSection>
          </>
        )}
      </Show>

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
