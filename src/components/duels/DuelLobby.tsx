import {
  For,
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
  joinDuel,
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
import { PlayerFace } from '../profile/PlayerPlate';
import { CounterTerms, TERM_CHIP } from '../overworld/npc-dialog/terms';
import SpectatorList from '../battle/SpectatorList';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import watchLive from '../app/watch';
import { Button, DialogActions, Meta, Note, Status } from '../styled';
import { useGame } from '../app/game-context';

export interface DuelLobbyProps {
  user: PlayerIdentity;
  duelId: string;
  /** Whether this player holds a seat, so the panel only closes by Leave */
  onSeated?: (seated: boolean) => void;
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
/** A seat's ready stamp, and how a ready one is coloured */
const STAMP =
  'shrink-0 rounded-full border-2 px-2 py-1 text-[10.5px] font-extrabold tracking-wide uppercase';
const STAMP_READY = 'border-leaf-dark bg-leaf text-on-accent shadow-pop-sm';

/** How many watchers' faces are drawn before the count says the rest */
const WATCH_FACES = 5;

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

  const fighting = (): boolean => mine()?.role === LobbyRole.Fighter;
  const seatFree = (): boolean => fighters().length < DUEL_FIGHTERS;

  // Named for whoever hosts it, so the plate says whose lobby this is
  createEffect(() => {
    const record = duel();

    if (record == null) {
      props.onTitle?.(null);
      return;
    }
    props.onTitle?.(isHost() ? 'Your lobby' : `${named(record.host)}'s lobby`);
  });

  // A seated player leaves by Leave alone: shutting the panel any other
  // way would leave their party standing in a lobby they walked out of
  createEffect(() => {
    props.onSeated?.(fighting());
  });

  onCleanup(() => {
    props.onTitle?.(null);
    props.onSeated?.(false);
  });

  // Opened from a call rather than joined: walking in answers it, so
  // the player is in the room (and so in the fight's audience) rather
  // than looking in through a call the start is about to clear
  let answered = false;

  createEffect(() => {
    const record = duel();

    if (record == null || answered || present().includes(props.user.uid)) {
      return;
    }
    answered = true;
    joinDuel(props.duelId).catch(() => undefined);
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

  /** Your own seat's controls under it: the party, and the way back to watching */
  const controls = (member: DuelMember): JSX.Element => (
    <div class="flex flex-wrap gap-1.5">
      <Button
        disabled={busy() || member.ready}
        onClick={() => {
          setPicking(true);
        }}
      >
        {member.catches.length > 0 ? 'Change team' : 'Form a team'}
      </Button>
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
   * Whether a seat is ready, as a stamp on its plate. On your own seat
   * it is the button that says so; on the other it is only read
   */
  const stamp = (member: DuelMember): JSX.Element => (
    <Show
      when={member.player === props.user.uid}
      fallback={
        <span class={`${STAMP} ${member.ready ? STAMP_READY : 'border-line bg-paper text-muted'}`}>
          {member.ready ? '✓ Ready' : 'Choosing…'}
        </span>
      }
    >
      <button
        type="button"
        aria-pressed={member.ready}
        disabled={busy() || member.catches.length === 0}
        class={`${STAMP} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          member.ready ? STAMP_READY : 'border-tide bg-tide-soft text-tide-dark shadow-pop-sm'
        }`}
        onClick={() => {
          act(async () => setDuelReady(props.duelId, !member.ready), 'That could not be changed.');
        }}
      >
        {member.ready ? '✓ Ready' : "I'm ready"}
      </button>
    </Show>
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
          class="flex min-w-0 flex-col items-center gap-1.5 rounded-xl border-2 border-dashed
            border-line bg-paper/55 px-3 py-4 text-center"
        >
          <span class="text-sm font-extrabold">Seat {at + 1} is open</span>
          <Meta>Waiting for a trainer to sit down.</Meta>
          <Show when={!fighting()}>
            <Button disabled={busy()} onClick={takeSeat}>
              Take this seat
            </Button>
          </Show>
        </div>
      }
    >
      {(taken) => (
        <div class="flex min-w-0 flex-col gap-2">
          {/* The trainer's plate: who, which seat, and whether they are ready */}
          <div
            class="flex min-w-0 items-center gap-2 rounded-xl border-2 border-line bg-paper px-2
              py-1.5 shadow-pop-sm"
          >
            <PlayerFace sprite={faceOf(taken().player)} size={34} />
            <span class="flex min-w-0 grow flex-col">
              <span class="flex min-w-0 items-center gap-1">
                <Show
                  when={taken().player !== props.user.uid}
                  fallback={<span class="truncate text-sm font-extrabold">You</span>}
                >
                  <button
                    type="button"
                    class="cursor-pointer truncate border-0 bg-transparent p-0 text-left text-sm
                      font-extrabold text-ink shadow-none hover:underline"
                    onClick={() => {
                      game.setVisiting(taken().player);
                    }}
                  >
                    {named(taken().player)}
                  </button>
                </Show>
                <Show when={taken().player === duel()?.host}>
                  <span
                    class="shrink-0 rounded-full bg-gold-soft px-1.5 text-[9.5px] font-extrabold
                      text-gold uppercase"
                  >
                    Host
                  </span>
                </Show>
              </span>
              <Meta>Seat {at + 1}</Meta>
            </span>
            {stamp(taken())}
          </div>
          <LobbyParty catches={taken().catches} flat={teamSize()} />
          <Show when={taken().player === props.user.uid}>{controls(taken())}</Show>
        </div>
      )}
    </Show>
  );

  /** Why the host cannot start yet, or what the guest is waiting on */
  const waiting = (record: DuelRecord): string | null => {
    if (isHost()) {
      return getDuelBlocker(record) ?? 'Both seats are ready.';
    }
    return 'The host starts the fight.';
  };

  return (
    <>
      <Show when={duel()} fallback={<Note>Loading the lobby…</Note>}>
        {(record) => (
          <div class="flex flex-col gap-3">
            {/* What the other side agrees to when they say they are ready */}
            <CounterTerms
              rows={[
                { label: 'Team', value: `${teamSize()} per side` },
                { label: 'Moves', value: String(getSlots(limits(), Slots.Move)) },
                { label: 'Abilities', value: String(getSlots(limits(), Slots.Ability)) },
                { label: 'Items', value: String(getSlots(limits(), Slots.Item)) },
              ]}
            >
              {/* Nothing is recorded: no candy, no aftermath, and what the party spent comes back */}
              <span class={`${TERM_CHIP} bg-line-soft`}>Unranked</span>
              <Show when={isHost()}>
                <button
                  type="button"
                  disabled={busy()}
                  class={`${TERM_CHIP} cursor-pointer border-2 border-dashed border-line
                    bg-transparent text-muted hover:border-tide hover:text-tide-dark`}
                  onClick={() => {
                    setArranging(true);
                  }}
                >
                  Change rules
                </button>
              </Show>
            </CounterTerms>

            {/* The two seats face each other across a field */}
            <div
              class="-mx-4 grid items-start gap-3 px-4 py-4 sm:-mx-5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
                sm:px-5"
              style={{
                background:
                  'linear-gradient(var(--field-sky), var(--field-haze) 58%, var(--field-grass) 58%, var(--field-grass-deep))',
              }}
            >
              {seat(() => fighters().at(0), 0)}
              <span
                class="grid size-11 place-items-center self-center justify-self-center rounded-full
                  border-[3px] border-paper bg-ember text-sm font-extrabold text-on-accent
                  shadow-pop"
              >
                VS
              </span>
              {seat(() => fighters().at(1), 1)}
            </div>

            {/* Who is watching, as their faces; the list opens on press */}
            <Disclosure defaultOpen={false} class="flex flex-col">
              <DisclosureButton
                class="flex cursor-pointer items-center gap-2 self-start border-0 bg-transparent
                  p-0 text-left text-xs font-extrabold text-muted shadow-none focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-tide"
              >
                <span class="flex">
                  <For each={watchers().slice(0, WATCH_FACES)}>
                    {(uid) => (
                      <span class="-ml-1.5 first:ml-0">
                        <PlayerFace sprite={faceOf(uid)} size={24} />
                      </span>
                    )}
                  </For>
                </span>
                Watching · {watchers().length}
              </DisclosureButton>
              <DisclosurePanel class="max-h-48 overflow-y-auto pt-2">
                <SpectatorList player={props.user.uid} watching={watchers()} />
              </DisclosurePanel>
            </Disclosure>

            <DialogActions
              note={
                <Show when={status()} fallback={<Meta>{waiting(record())}</Meta>}>
                  <Status message={status()} />
                </Show>
              }
            >
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
