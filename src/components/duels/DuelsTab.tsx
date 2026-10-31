import { For, type JSX, Show, createSignal, from } from 'solid-js';
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
import DuelLobby from './DuelLobby';
import { Button, DialogSection, List, ListRow, Meta, Note, Panel, RowButton } from '../styled';
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
    <ListRow>
      <span class="font-medium">{named()}</span>
      <Meta class="grow">
        {props.invite.role === LobbyRole.Fighter
          ? m.duels_invited_fighter()
          : m.duels_invited_spectator()}
      </Meta>
      <Button tone="primary" onClick={props.onAccept}>
        {m.duels_join()}
      </Button>
      <Button onClick={props.onDecline}>{m.duels_dismiss()}</Button>
    </ListRow>
  );
}

export interface DuelsTabProps {
  user: PlayerIdentity;
  /**
   * What the panel is called: the lobby, while the player is standing
   * in one, and nothing while they are looking at the list
   */
  onTitle?: (title: string | null) => void;
  /** Whether this player holds a seat in the open lobby */
  onSeated?: (seated: boolean) => void;
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
            <Note>{m.duels_intro()}</Note>

            <Show when={(invites() ?? []).length > 0}>
              <DialogSection title={m.duels_invited()}>
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
              </DialogSection>
            </Show>

            <DialogSection title={m.duels_your_lobbies()}>
              <Show when={(mine() ?? []).length > 0} fallback={<Note>{m.duels_no_lobbies()}</Note>}>
                <List>
                  <For each={mine() ?? []}>
                    {([id, lobby]) => (
                      <ListRow>
                        <RowButton
                          class="font-medium"
                          onClick={() => {
                            open(id);
                          }}
                        >
                          {lobby.host === props.user.uid ? m.duels_your_lobby() : m.duels_a_lobby()}
                        </RowButton>
                        <Meta>
                          {m.duels_in_room({ count: lobby.members.length })}
                          {lobby.battle == null ? '' : ` · ${m.duels_being_fought()}`}
                        </Meta>
                      </ListRow>
                    )}
                  </For>
                </List>
              </Show>
            </DialogSection>

            <div class="flex flex-wrap justify-center gap-2">
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
                disabled={busy()}
                onClick={() => {
                  stage(true);
                }}
              >
                {m.duels_host_watch()}
              </Button>
            </div>
          </>
        }
      >
        {(id) => (
          <DuelLobby
            user={props.user}
            duelId={id()}
            onTitle={props.onTitle}
            onSeated={props.onSeated}
          />
        )}
      </Show>
    </Panel>
  );
}
