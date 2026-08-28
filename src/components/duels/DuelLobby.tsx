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
import type { PlayerIdentity } from '../../auth/user';
import {
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
  startDuel,
  watchDuel,
} from '../../auth/duels';
import { LobbyRole } from '../../auth/lobby-role';
import { type Profile, getProfiles } from '../../auth/profile';
import LobbyInviteDialog from '../battle/LobbyInviteDialog';
import LobbyParty from '../battle/LobbyParty';
import PlayerPlate from '../profile/PlayerPlate';
import SpectatorList from '../battle/SpectatorList';
import TeamPickerDialog from '../battle/TeamPickerDialog';
import watchLive from '../app/watch';
import {
  Badge,
  Button,
  DialogActions,
  DialogSection,
  List,
  ListRow,
  Note,
  Status,
} from '../styled';
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
  const [status, setStatus] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const duel = (): DuelRecord | null => props.duel();
  const named = (uid: string): string => props.names()?.get(uid)?.nickname ?? uid;
  const faceOf = (uid: string): string | null => props.names()?.get(uid)?.sprite ?? null;

  const mine = (): DuelMember | undefined =>
    duel()?.members.find((member) => member.player === props.user.uid);
  const fighters = (): DuelMember[] => {
    const record = duel();

    return record == null ? [] : getDuelFighters(record);
  };
  const watchers = (): string[] => {
    const record = duel();

    return record == null ? [] : getDuelSpectators(record).map((member) => member.player);
  };
  const isHost = (): boolean => duel()?.host === props.user.uid;
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

  /**
   * One seat, taken or standing empty. The occupant arrives as an
   * accessor rather than a value: the row is drawn once per seat and
   * has to follow whoever sits down in it afterwards
   */
  const seat = (member: () => DuelMember | undefined, at: number): JSX.Element => (
    <ListRow selected={member()?.player === props.user.uid}>
      <Show
        when={member()}
        fallback={<Note class="grow">Seat {at + 1} is open. Invite somebody to it.</Note>}
      >
        {(taken) => (
          <>
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
            <Badge tone={taken().ready ? 'leaf' : 'neutral'}>
              {taken().ready ? 'Ready' : 'Choosing'}
            </Badge>
            <Show
              when={taken().catches.length > 0}
              fallback={<Note class="grow">No party yet.</Note>}
            >
              <LobbyParty catches={taken().catches} />
            </Show>
          </>
        )}
      </Show>
    </ListRow>
  );

  return (
    <>
      <Show when={duel()} fallback={<Note>Loading the lobby…</Note>}>
        {(record) => (
          <div class="flex flex-col gap-3">
            <Note class="text-center">
              A fight between trainers. Nothing is recorded from it: no candy, no aftermath, and
              what the party spent comes back.
            </Note>

            <DialogSection title="Fighters">
              <List>
                <For each={Array.from({ length: DUEL_FIGHTERS }, (_, at) => at)}>
                  {(at) => seat(() => fighters().at(at), at)}
                </For>
              </List>
            </DialogSection>

            <DialogSection title="Spectators">
              <SpectatorList player={props.user.uid} watching={watchers()} />
            </DialogSection>

            <Show when={isHost() && getDuelBlocker(record())}>
              {(blocked) => <Note class="text-center">{blocked()}</Note>}
            </Show>

            <Status message={status()} />

            <DialogActions>
              <Show when={fighting()}>
                <Button
                  disabled={busy() || mine()?.ready === true}
                  onClick={() => {
                    setPicking(true);
                  }}
                >
                  {(mine()?.catches.length ?? 0) > 0 ? 'Change party' : 'Form a team'}
                </Button>
                <Button
                  tone={mine()?.ready === true ? undefined : 'primary'}
                  disabled={busy() || (mine()?.catches.length ?? 0) === 0}
                  onClick={() => {
                    act(
                      async () => setDuelReady(props.duelId, mine()?.ready !== true),
                      'That could not be changed.',
                    );
                  }}
                >
                  {mine()?.ready === true ? 'Not ready' : 'Ready'}
                </Button>
              </Show>
              {/* Stepping between the seat and the chairs. Taking a
                  seat is only offered while one is free; stepping back
                  drops the party, which is why it says so */}
              <Show when={!fighting() && seatFree()}>
                <Button
                  disabled={busy()}
                  onClick={() => {
                    act(
                      async () => setDuelRole(props.duelId, LobbyRole.Fighter),
                      'That seat could not be taken.',
                    );
                  }}
                >
                  Take a seat
                </Button>
              </Show>
              <Show when={fighting()}>
                <Button
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
              </Show>
              <Button
                disabled={busy()}
                onClick={() => {
                  setCalling(true);
                }}
              >
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
        present={(duel()?.members ?? []).map((member) => member.player)}
        // Only the host arranges the fight itself; anybody in the room
        // may call somebody in to watch it
        fighters={isHost() && seatFree()}
        onInvite={async (uid, role) => inviteToDuel(props.duelId, uid, role)}
        onInviteByCode={async (code, role) => inviteToDuelByCode(props.duelId, code, role)}
      />

      <TeamPickerDialog
        player={props.user.uid}
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
    () =>
      (duel()?.members ?? [])
        .map((member) => member.player)
        .sort()
        .join(','),
    async (key): Promise<Map<string, Profile>> => getProfiles(key.split(',').filter(Boolean)),
  );

  return (
    <Suspense fallback={<Note>Loading the lobby…</Note>}>
      <LobbyRows {...props} duel={() => duel() ?? null} names={names} />
    </Suspense>
  );
}
