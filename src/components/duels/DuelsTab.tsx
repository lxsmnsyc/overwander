import { For, Show, createSignal, from } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { PlayerIdentity } from '../../auth/user';
import {
  type DuelInvite,
  type DuelRecord,
  declineDuelInvite,
  hostDuel,
  joinDuel,
  watchDuelInvites,
  watchMyDuels,
} from '../../auth/duels';
import LobbyRole from '../../model/lobby-role';
import { type Profile, watchProfile } from '../../auth/profile';
import DuelLobby, { type DuelLobbyReport } from './duel-lobby';
import {
  Button,
  DialogActions,
  GroupLabel,
  List,
  Note,
  Panel,
  RowActions,
  RowCard,
  RowText,
} from '../styled';
import { PlayerFace } from '../profile/PlayerPlate';
import { useGame } from '../app/game-context';
import { m } from '../../i18n/paraglide/messages.js';

/** One call, with whoever sent it named rather than left as a uid */
function InvitedRow(props: {
  invite: DuelInvite;
  onAccept: () => void;
  onDecline: () => void;
}): JSX.Element {
  const caller = from<Profile | null>((set) =>
    watchProfile(props.invite.sender, (record) => {
      set(record);
    }),
  );
  const named = (): string => {
    const nickname = caller()?.nickname ?? '';

    return nickname === '' ? m.duels_a_trainer() : nickname;
  };

  return (
    <RowCard>
      <PlayerFace sprite={caller()?.sprite} size={40} />
      <RowText
        name={named()}
        line={
          props.invite.role === LobbyRole.Fighter
            ? m.duels_invited_fighter()
            : m.duels_invited_spectator()
        }
      />
      <RowActions>
        <Button tone="primary" onClick={props.onAccept}>
          {m.duels_join()}
        </Button>
        <Button onClick={props.onDecline}>{m.duels_dismiss()}</Button>
      </RowActions>
    </RowCard>
  );
}

export interface DuelsTabProps {
  user: PlayerIdentity;
  /** Closes the panel: the dock's way out, beside the buttons that host */
  onClose: () => void;
  /**
   * The lobby the player is standing in, so the panel is named for it
   * and closes only by Leave while they hold a seat; null while they
   * are looking at the list
   */
  onLobby?: (lobby: DuelLobbyReport | null) => void;
}

/**
 * The private fights this player has open: the one they are hosting,
 * the ones they have been called into, and the way to stage another.
 *
 * Nothing here is public. A duel exists because somebody asked for it,
 * so there is no board of open lobbies to browse: only what has been
 * offered to this player
 */
export default function DuelsTab(props: DuelsTabProps): JSX.Element {
  const game = useGame();
  const [busy, setBusy] = createSignal(false);

  const invites = from<DuelInvite[]>((set) =>
    watchDuelInvites(props.user.uid, (waiting) => {
      set(waiting);
    }),
  );
  const mine = from<[string, DuelRecord][]>((set) =>
    watchMyDuels(props.user.uid, (lobbies) => {
      set(lobbies);
    }),
  );

  const open = (id: string): void => {
    game.setDuel(id);
  };

  const stage = (watching: boolean): void => {
    setBusy(true);
    hostDuel(watching)
      .then(open)
      .catch(() => undefined)
      .finally(() => {
        setBusy(false);
      });
  };

  const accept = (id: string): void => {
    setBusy(true);
    joinDuel(id)
      .then((joined) => {
        if (joined) {
          open(id);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <Panel>
      <Show
        when={game.duel()}
        fallback={
          <>
            {/* What this is, in a card of its own: a battle is arranged, not found */}
            <p
              class="m-0 rounded-[14px] border-2 border-tide/20 bg-tide-soft/60 px-3 py-2.5
                text-[13px] leading-snug"
            >
              {m.duels_intro()}
            </p>

            <Show when={(invites() ?? []).length > 0}>
              <GroupLabel>{m.duels_invited()}</GroupLabel>
              <List>
                <For each={invites() ?? []}>
                  {(invite) => (
                    <InvitedRow
                      invite={invite}
                      onAccept={() => {
                        accept(invite.duel);
                      }}
                      onDecline={() => {
                        declineDuelInvite(invite.duel).catch(() => undefined);
                      }}
                    />
                  )}
                </For>
              </List>
            </Show>

            <GroupLabel>{m.duels_your_lobbies()}</GroupLabel>
            <Show when={(mine() ?? []).length > 0} fallback={<Note>{m.duels_no_lobbies()}</Note>}>
              <List>
                <For each={mine() ?? []}>
                  {([id, lobby]) => (
                    <RowCard>
                      <RowText
                        name={
                          lobby.host === props.user.uid ? m.duels_your_lobby() : m.duels_a_lobby()
                        }
                        line={`${m.duels_in_room({ count: lobby.members.length })}${
                          lobby.battle == null ? '' : ` · ${m.duels_being_fought()}`
                        }`}
                      />
                      <RowActions>
                        <Button
                          onClick={() => {
                            open(id);
                          }}
                        >
                          {m.raid_open()}
                        </Button>
                      </RowActions>
                    </RowCard>
                  )}
                </For>
              </List>
            </Show>

            {/* The way out on the left, and the two ways to stage a fight on the right */}
            <DialogActions stack>
              <Button
                tone="primary"
                disabled={busy()}
                onClick={() => {
                  stage(false);
                }}
              >
                {m.duels_host()}
              </Button>
              {/* Staging a fight for other people: the host takes no
                  seat, and the lobby waits for two guests rather than
                  one */}
              <Button
                // The board's dock reads Host and watch, then Host a lobby
                // at the far right; on a phone the primary stays on top
                class="sm:order-[-1]"
                disabled={busy()}
                onClick={() => {
                  stage(true);
                }}
              >
                {m.duels_host_watch()}
              </Button>
              <Button onClick={props.onClose}>{m.ui_close()}</Button>
            </DialogActions>
          </>
        }
      >
        {(id) => <DuelLobby user={props.user} duelId={id()} onLobby={props.onLobby} />}
      </Show>
    </Panel>
  );
}
