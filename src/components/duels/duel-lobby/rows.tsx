import {
  For,
  type JSX,
  type Resource,
  Show,
  createEffect,
  createSignal,
  onCleanup,
} from 'solid-js';
import { Disclosure, DisclosureButton, DisclosurePanel } from 'terracotta';
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
} from '../../../auth/duels';
import { duelRefusal } from '../../../data/constants/duel-rules';
import describeDuelRefusal from '../../../i18n/duel-refusals';
import LobbyRole from '../../../model/lobby-role';
import { DuelBlocker } from '../../../model/duel-record';
import type { Profile } from '../../../auth/profile';
import DuelRulesDialog from '../../battle/DuelRulesDialog';
import LobbyInviteDialog from '../../battle/LobbyInviteDialog';
import LobbyParty from '../../battle/LobbyParty';
import { PlayerFace } from '../../profile/PlayerPlate';
import RuleChips from './chips';
import { FilledSeat, OpenSeat, STAMP, STAMP_AT_REST, STAMP_READY } from './seat';
import SpectatorList from '../../battle/SpectatorList';
import { openForm } from '../../forms/stack';
import { PickTeamForm } from '../../forms/pick-team';
import { Button, DialogActions, Meta, Note, Status } from '../../styled';
import { useGame } from '../../app/game-context';
import describeFailure from '../../../i18n/refusals';
import { m } from '../../../i18n/paraglide/messages.js';
import type { DuelLobbyProps } from './report';

/** How many watchers' faces are drawn before the count says the rest */
const WATCH_FACES = 5;

/** What the lobby says for each reason the host cannot start, called when shown */
const BLOCKER_MESSAGES: Record<DuelBlocker, () => string> = {
  [DuelBlocker.NoSecond]: m.duels_blocker_second,
  [DuelBlocker.NoParty]: m.duels_blocker_party,
  [DuelBlocker.Unready]: m.duels_blocker_ready,
};

export default function LobbyRows(
  props: DuelLobbyProps & {
    duel: () => DuelRecord | null;
    names: Resource<Map<string, Profile>>;
  },
): JSX.Element {
  const game = useGame();
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
  const maxBst = (): number => duel()?.maxBst ?? 0;
  const bans = (): number => duel()?.bans ?? 0;

  const fighting = (): boolean => mine()?.role === LobbyRole.Fighter;
  const seatFree = (): boolean => fighters().length < DUEL_FIGHTERS;

  // Named for whoever hosts it, so the plate says whose lobby this is.
  // A seated player leaves by Leave alone: shutting the panel any other
  // way would leave their party standing in a lobby they walked out of
  createEffect(() => {
    const record = duel();

    if (record == null) {
      props.onLobby?.(null);
      return;
    }
    props.onLobby?.({
      title: isHost() ? m.duels_your_lobby() : m.duels_their_lobby({ name: named(record.host) }),
      seated: fighting(),
    });
  });

  onCleanup(() => {
    props.onLobby?.(null);
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
        setStatus(describeFailure(caught));
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
    act(async () => setDuelRole(props.duelId, LobbyRole.Fighter), m.duels_seat_failed());
  };

  /** Your own seat's controls under it: the party, and the way back to watching */
  const controls = (member: DuelMember): JSX.Element => (
    <>
      <Button
        disabled={busy() || member.ready}
        onClick={() => {
          openForm(PickTeamForm, {
            player: props.user.uid,
            max: teamSize(),
            // A duel fields everyone healthy, so a fainted pokemon can come
            healed: true,
            // What the host barred stays in the box, greyed, with the reason
            refuse: (option) =>
              describeDuelRefusal(duelRefusal(option.caught, { maxBst: maxBst(), bans: bans() })),
          })
            .then((catches) => {
              if (catches != null) {
                act(async () => setDuelParty(props.duelId, catches), m.duels_team_failed());
              }
            })
            .catch(() => undefined);
        }}
      >
        {member.catches.length > 0 ? m.duels_change_team() : m.duels_form_team()}
      </Button>
      {/* Stepping back drops the party */}
      <Button
        tone="ghost"
        disabled={busy()}
        onClick={() => {
          act(async () => setDuelRole(props.duelId, LobbyRole.Spectator), m.duels_change_failed());
        }}
      >
        {m.duels_watch_instead()}
      </Button>
    </>
  );

  /**
   * Whether a seat is ready, as a stamp on its card. On your own seat
   * it is the button that says so; on the other it is only read
   */
  const stamp = (member: DuelMember): JSX.Element => (
    <Show
      when={member.player === props.user.uid}
      fallback={
        <span class={`${STAMP} ${member.ready ? STAMP_READY : STAMP_AT_REST}`}>
          {member.ready ? m.duels_ready_stamp() : m.duels_choosing()}
        </span>
      }
    >
      <button
        type="button"
        aria-pressed={member.ready}
        disabled={busy() || member.catches.length === 0}
        class={`${STAMP} cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          member.ready ? STAMP_READY : 'border-tide bg-tide-soft text-tide-dark'
        }`}
        onClick={() => {
          act(async () => setDuelReady(props.duelId, !member.ready), m.duels_change_failed());
        }}
      >
        {member.ready ? m.duels_ready_stamp() : m.duels_ready_button()}
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
        <OpenSeat seat={at + 1}>
          <Show when={!fighting()}>
            <Button disabled={busy()} onClick={takeSeat}>
              {m.duels_take_seat()}
            </Button>
          </Show>
        </OpenSeat>
      }
    >
      {(taken) => (
        <FilledSeat
          sprite={faceOf(taken().player)}
          name={
            <Show when={taken().player !== props.user.uid} fallback={<>{m.battle_you()}</>}>
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
          }
          host={taken().player === duel()?.host}
          seat={at + 1}
          party={
            // The party is a row of small squares, as many as the team
            // may hold, so a seat of three is not three giant ones
            <div style={{ 'max-width': `${teamSize() * 40}px` }}>
              <LobbyParty catches={taken().catches} flat={teamSize()} />
            </div>
          }
          footer={
            <>
              <Show when={taken().player === props.user.uid}>{controls(taken())}</Show>
              {stamp(taken())}
            </>
          }
        />
      )}
    </Show>
  );

  /** Why the host cannot start yet, or what the guest is waiting on */
  const waiting = (record: DuelRecord): string | null => {
    if (isHost()) {
      const blocker = getDuelBlocker(record);

      return blocker == null ? m.duels_seats_ready() : BLOCKER_MESSAGES[blocker]();
    }
    return m.duels_host_starts();
  };

  return (
    <>
      <Show when={duel()} fallback={<Note>{m.duels_loading_lobby()}</Note>}>
        {(record) => (
          <div class="flex flex-col gap-3">
            <RuleChips
              teamSize={teamSize()}
              limits={limits()}
              maxBst={maxBst()}
              bans={bans()}
              busy={busy()}
              onChange={
                isHost()
                  ? () => {
                      setArranging(true);
                    }
                  : undefined
              }
            />

            {/* The two seats face each other across a field */}
            <div
              class="grid items-center gap-3 rounded-card px-5 py-[18px]
                sm:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)]"
              style={{
                background:
                  'linear-gradient(var(--field-sky), var(--field-haze) 58%, var(--field-grass) 58%, var(--field-grass-deep))',
              }}
            >
              {seat(() => fighters().at(0), 0)}
              <span
                class="grid size-12 place-items-center self-center justify-self-center rounded-full
                  border-[3px] border-paper bg-ember text-sm font-extrabold text-on-accent
                  shadow-[0_3px_0_rgb(0_0_0/0.25)]"
              >
                {m.duels_vs()}
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
                {m.duels_watching({ count: watchers().length })}
              </DisclosureButton>
              <DisclosurePanel class="max-h-48 overflow-y-auto pt-2">
                <SpectatorList player={props.user.uid} watching={watchers()} />
              </DisclosurePanel>
            </Disclosure>

            <DialogActions
              stack
              note={
                <Show when={status()} fallback={<Meta>{waiting(record())}</Meta>}>
                  <Status message={status()} />
                </Show>
              }
            >
              <Button disabled={busy()} onClick={invite}>
                {m.lobby_invite()}
              </Button>
              <Show when={isHost()}>
                <Button
                  tone="primary"
                  disabled={busy() || getDuelBlocker(record()) != null}
                  onClick={() => {
                    act(async () => startDuel(props.duelId), m.duels_start_failed());
                  }}
                >
                  {m.duels_start()}
                </Button>
              </Show>
              <Button onClick={back}>{isHost() ? m.duels_close_lobby() : m.duels_leave()}</Button>
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
        title={m.duels_invite_title()}
        description={m.duels_invite_description()}
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
        rules={{ limits: limits(), teamSize: teamSize(), maxBst: maxBst(), bans: bans() }}
        onSubmit={(rules) => {
          setArranging(false);
          act(async () => setDuelRules(props.duelId, rules), m.duels_rules_failed());
        }}
      />
    </>
  );
}
