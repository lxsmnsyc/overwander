import {
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
} from 'solid-js';
import { Disclosure, DisclosureButton, DisclosurePanel } from 'terracotta';
import type { PlayerIdentity } from '../../auth/user';
import {
  DEFAULT_DUEL_RULES,
  DUEL_FIGHTERS,
  type DuelMember,
  type DuelRecord,
  getDuelBlocker,
  getDuelFighters,
  getDuelSpectators,
  inviteToDuel,
  inviteToDuelByCode,
  leaveDuel,
  setDuelParty,
  setDuelReady,
  setDuelRole,
  setDuelRules,
  startDuel,
  watchDuel,
} from '../../auth/duels';
import { Slots, getSlots } from '../../data/constants/slots';
import { LobbyRole } from '../../auth/lobby-role';
import { type Profile, getProfiles } from '../../auth/profile';
import DuelRulesDialog from '../battle/DuelRulesDialog';
import LobbyInviteDialog from '../battle/LobbyInviteDialog';
import LobbyParty from '../battle/LobbyParty';
import PlayerPlate from '../profile/PlayerPlate';
import SpectatorList from '../battle/SpectatorList';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import watchLive from '../app/watch';
import { Badge, Button, DialogActions, Note, Status } from '../styled';
import { ChevronRightIcon } from '../icons';
import { useGame } from '../app/game-context';

export interface DuelLobbyProps {
  user: PlayerIdentity;
  duelId: string;
  /**
   * What the lobby is called, reported upwards so the dialog's own
   * heading can say it
   */
  onTitle?: (title: string | null) => void;
}

/**
 * What is in the lobby, which is where the names are read.
 *
 * A read in the body that declared the resource throws past every
 * boundary written there and lands on the one around the whole page,
 * taking the tab down with it
 */
function LobbyRows(
  props: DuelLobbyProps & {
    duel: () => DuelRecord | null;
    names: Resource<Map<string, Profile>>;
  },
): JSX.Element {
  const game = useGame();
  const [picking, setPicking] = createSignal(false);
  const [calling, setCalling] = createSignal(false);
  const [arranging, setArranging] = createSignal(false);
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const duel = (): DuelRecord | null => props.duel();
  const named = (uid: string): string => props.names()?.get(uid)?.nickname ?? uid;
  const faceOf = (uid: string): string | null => props.names()?.get(uid)?.sprite ?? null;

  const mine = (): DuelMember | undefined => {
    for (const member of duel()?.members ?? []) {
      if (member.player === props.user.uid) {
        return member;
      }
    }
    return undefined;
  };
  const fighters = (): DuelMember[] => {
    const record = duel();

    return record == null ? [] : getDuelFighters(record);
  };
  const watchers = (): string[] => {
    const record = duel();

    const uids: string[] = [];

    if (record != null) {
      for (const member of getDuelSpectators(record)) {
        uids.push(member.player);
      }
    }
    return uids;
  };
  /** Everybody in the room, fighting or watching */
  const present = (): string[] => {
    const uids: string[] = [];

    for (const member of duel()?.members ?? []) {
      uids.push(member.player);
    }
    return uids;
  };
  const isHost = (): boolean => duel()?.host === props.user.uid;
  const teamSize = (): number => duel()?.teamSize ?? DEFAULT_DUEL_RULES.teamSize;
  const limits = (): number => duel()?.limits ?? DEFAULT_DUEL_RULES.limits;

  /**
   * The rules as one line. Everybody reads it, not only the host: it
   * is what the other side is agreeing to when they say they are ready
   */
  const arrangement = (): string =>
    [
      `${teamSize()} per side`,
      `${getSlots(limits(), Slots.Move)} moves`,
      `${getSlots(limits(), Slots.Ability)} abilities`,
      `${getSlots(limits(), Slots.Item)} items`,
    ].join(' · ');
  const fighting = (): boolean => mine()?.role === LobbyRole.Fighter;
  const seatFree = (): boolean => fighters().length < DUEL_FIGHTERS;

  createEffect(() => {
    props.onTitle?.(duel() == null ? null : 'Battle lobby');
  });

  onCleanup(() => {
    props.onTitle?.(null);
  });

  /**
   * Whether the lobby has ever been seen. A lobby the host took down
   * is gone rather than still arriving, and the panel goes back to the
   * list rather than sitting on "Loading…" for something that no
   * longer exists
   */
  let arrived = false;

  createEffect(() => {
    if (duel() != null) {
      arrived = true;
      return;
    }
    if (arrived) {
      game.setDuel(null);
    }
  });

  // The host's start takes the page for everybody in the room, the
  // two fighting and everybody watching
  createEffect(() => {
    const battle = duel()?.battle;

    if (battle != null) {
      game.setBattle({ id: battle, replay: false });
    }
  });

  const act = (action: () => Promise<unknown>, failure: string): void => {
    setStatus(null);
    setBusy(true);
    action()
      // The lobby subscription carries the result back on its own
      .then((result) => {
        setStatus(result === false || result == null ? failure : null);
      })
      .catch((caught: unknown) => {
        setStatus(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const back = (): void => {
    leaveDuel(props.duelId).catch(() => undefined);
    game.setDuel(null);
  };

  const invite = (): void => {
    setCalling(true);
  };

  const takeSeat = (): void => {
    act(async () => setDuelRole(props.duelId, LobbyRole.Fighter), 'That seat could not be taken.');
  };

  /** Your own seat's controls: the party, readiness, and the way back to watching */
  const controls = (member: DuelMember): JSX.Element => (
    <div class="flex flex-col items-start gap-1.5 border-t-2 border-line-soft pt-2">
      <div class="flex flex-wrap gap-2">
        <Button
          disabled={busy() || member.ready}
          onClick={() => {
            setPicking(true);
          }}
        >
          {member.catches.length > 0 ? 'Change party' : 'Form a team'}
        </Button>
        <Button
          tone={member.ready ? undefined : 'primary'}
          disabled={busy() || member.catches.length === 0}
          onClick={() => {
            act(
              async () => setDuelReady(props.duelId, !member.ready),
              'That could not be changed.',
            );
          }}
        >
          {member.ready ? 'Not ready' : 'Ready'}
        </Button>
      </div>
      {/* Stepping back drops the party */}
      <Button
        tone="ghost"
        disabled={busy()}
        onClick={() => {
          act(
            async () => setDuelRole(props.duelId, LobbyRole.Spectator),
            'That could not be changed.',
          );
        }}
      >
        Watch instead
      </Button>
    </div>
  );

  /**
   * One seat, taken or standing empty. The occupant arrives as an
   * accessor: the card is drawn once per seat and follows whoever sits
   * down in it afterwards
   */
  const seat = (member: () => DuelMember | undefined, at: number): JSX.Element => (
    <Show
      when={member()}
      fallback={
        <div
          class="flex min-w-0 flex-col justify-center gap-2 rounded-panel border-2 border-dashed
            border-line p-3"
        >
          <Note>Seat {at + 1} is open.</Note>
          <div class="flex flex-wrap gap-2">
            <Show when={!fighting()}>
              <Button disabled={busy()} onClick={takeSeat}>
                Take this seat
              </Button>
            </Show>
            <Show when={isHost()}>
              <Button disabled={busy()} onClick={invite}>
                Invite
              </Button>
            </Show>
          </div>
        </div>
      }
    >
      {(taken) => (
        <div
          class={`flex min-w-0 flex-col gap-2 rounded-panel border-2 p-3 shadow-pop-sm ${
            taken().player === props.user.uid ? 'border-leaf bg-leaf-soft' : 'border-line bg-paper'
          }`}
        >
          <div class="flex min-w-0 items-center gap-2">
            <span class="min-w-0 grow">
              <PlayerPlate
                name={taken().player === props.user.uid ? 'You' : named(taken().player)}
                sprite={faceOf(taken().player)}
                onOpen={
                  taken().player === props.user.uid
                    ? undefined
                    : () => {
                        game.setVisiting(taken().player);
                      }
                }
              />
            </span>
            <Show when={taken().player === duel()?.host}>
              <Badge tone="tide">Host</Badge>
            </Show>
          </div>
          <Show when={taken().catches.length > 0} fallback={<Note>No party yet.</Note>}>
            <LobbyParty catches={taken().catches} />
          </Show>
          <span>
            <Badge tone={taken().ready ? 'leaf' : 'neutral'}>
              {taken().ready ? '● Ready' : '○ Choosing'}
            </Badge>
          </span>
          <Show when={taken().player === props.user.uid}>{controls(taken())}</Show>
        </div>
      )}
    </Show>
  );

  return (
    <>
      <Show when={duel()} fallback={<Note>Loading the lobby…</Note>}>
        {(record) => (
          <div class="flex flex-col gap-3">
            <Note class="text-center">
              Nothing is recorded: no candy, no aftermath, and what the party spent comes back.
            </Note>

            {/* What the other side agrees to when they say they are ready */}
            <div class="flex min-h-9 items-center gap-2">
              <span class="shrink-0 text-xs font-semibold text-muted uppercase">Rules</span>
              <span class="grow text-sm">{arrangement()}</span>
              <Show when={isHost()}>
                <Button
                  disabled={busy()}
                  onClick={() => {
                    setArranging(true);
                  }}
                >
                  Change
                </Button>
              </Show>
            </div>

            <div class="grid items-stretch gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              {seat(() => fighters().at(0), 0)}
              <span class="self-center text-center text-sm font-bold text-muted">VS</span>
              {seat(() => fighters().at(1), 1)}
            </div>

            <Disclosure defaultOpen={false} class="flex flex-col border-t-2 border-line-soft pt-2">
              <DisclosureButton
                class="group flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0
                  text-left text-sm font-bold text-ink shadow-none focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-tide"
              >
                <ChevronRightIcon
                  aria-hidden="true"
                  class="size-4 shrink-0 text-muted transition-transform group-aria-expanded:rotate-90"
                />
                Watching · {watchers().length}
              </DisclosureButton>
              <DisclosurePanel class="max-h-48 overflow-y-auto pt-2">
                <SpectatorList player={props.user.uid} watching={watchers()} />
              </DisclosurePanel>
            </Disclosure>

            <Show
              when={status()}
              fallback={
                <Show when={isHost() && getDuelBlocker(record())}>
                  {(blocked) => <Note class="text-center">{blocked()}</Note>}
                </Show>
              }
            >
              <Status message={status()} />
            </Show>

            <DialogActions>
              <Button disabled={busy()} onClick={invite}>
                Invite
              </Button>
              <Show when={isHost()}>
                <Button
                  tone="primary"
                  disabled={busy() || getDuelBlocker(record()) != null}
                  onClick={() => {
                    act(async () => startDuel(props.duelId), 'The battle could not be started.');
                  }}
                >
                  Start
                </Button>
              </Show>
              <Button onClick={back}>{isHost() ? 'Close lobby' : 'Leave'}</Button>
            </DialogActions>
          </div>
        )}
      </Show>

      <LobbyInviteDialog
        player={props.user.uid}
        isOpen={calling()}
        onClose={() => {
          setCalling(false);
        }}
        title="Invite to the battle"
        description="They see the call in their own Battle panel, and joining answers it."
        present={present()}
        // Only the host arranges the fight itself; anybody in the room
        // may call somebody in to watch it
        fighters={isHost() && seatFree()}
        onInvite={async (uid, role) => inviteToDuel(props.duelId, uid, role)}
        onInviteByCode={async (code, role) => inviteToDuelByCode(props.duelId, code, role)}
      />

      <DuelRulesDialog
        isOpen={arranging()}
        onClose={() => {
          setArranging(false);
        }}
        rules={{ limits: limits(), teamSize: teamSize() }}
        onSubmit={(rules) => {
          setArranging(false);
          act(async () => setDuelRules(props.duelId, rules), 'Those rules could not be set.');
        }}
      />

      <TeamPickerDialog
        player={props.user.uid}
        max={teamSize()}
        isOpen={picking()}
        onClose={() => {
          setPicking(false);
        }}
        onSubmit={(catches) => {
          setPicking(false);
          act(
            async () => setDuelParty(props.duelId, catches),
            'That team could not be brought: one of them may already be in another lobby.',
          );
        }}
      />
    </>
  );
}

/**
 * One private fight being arranged: two seats, whoever is watching,
 * and the readiness both sides have to give before the host may
 * start.
 *
 * The readiness is what a raid lobby has no use for. A raid boss is
 * not consulted; the other trainer is, and a fight started while they
 * were still picking their sixth is a fight they did not agree to
 */
export default function DuelLobby(props: DuelLobbyProps): JSX.Element {
  // Followed rather than read once: the second player arriving, a
  // party assembled and the host's start all land here
  const duel = watchLive<DuelRecord | null>((set) =>
    watchDuel(props.duelId, (record) => {
      set(record);
    }),
  );

  /**
   * Who everybody in the room is. A member is a uid in the record, and
   * a uid is not a person: the row is the way into their profile, so
   * it wears the name and the face that profile opens under
   */
  const [names] = createResource(
    () => {
      const uids: string[] = [];

      for (const member of duel()?.members ?? []) {
        uids.push(member.player);
      }
      return uids.sort().join(',');
    },
    async (key): Promise<Map<string, Profile>> => {
      const uids: string[] = [];

      for (const uid of key.split(',')) {
        if (uid !== '') {
          uids.push(uid);
        }
      }
      return getProfiles(uids);
    },
  );

  return (
    <Suspense fallback={<Note>Loading the lobby…</Note>}>
      <LobbyRows {...props} duel={() => duel() ?? null} names={names} />
    </Suspense>
  );
}
