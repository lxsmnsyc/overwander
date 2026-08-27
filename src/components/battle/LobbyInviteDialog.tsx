import { For, type JSX, Show, createSignal, from } from 'solid-js';
import { type FriendLink, watchFriends } from '../../auth/friends';
import { LOBBY_ROLE_NAMES, LobbyRole } from '../../auth/lobby-role';
import FriendEntry from '../friends/FriendEntry';
import {
  Button,
  Dialog,
  DialogActions,
  LIST_PAGE,
  List,
  Note,
  Row,
  Select,
  TextField,
  createPager,
  useToast,
} from '../styled';

/**
 * Calling people into a lobby, to fight or to watch.
 *
 * Both kinds of lobby use it. The list is the player's own friends,
 * which is what keeps a raid invite from being spam; a lobby that can
 * also reach strangers passes `onInviteByCode`, and the code is the
 * check there — its owner handed it over.
 */
export interface LobbyInviteDialogProps {
  player: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Everybody already in the lobby, who needs no calling */
  present: string[];
  /**
   * Whether a fighting seat is still on offer. A duel with both seats
   * taken can still call people in to watch
   */
  fighters?: boolean;
  onInvite: (uid: string, role: LobbyRole) => Promise<boolean>;
  /** Calling somebody the player has never met, by their friend code */
  onInviteByCode?: (code: string, role: LobbyRole) => Promise<boolean>;
}

export default function LobbyInviteDialog(props: LobbyInviteDialogProps): JSX.Element {
  const toast = useToast();
  const friends = from<FriendLink[]>((set) =>
    watchFriends(props.player, (rows) => {
      set(rows);
    }),
  );
  const [asked, setAsked] = createSignal<Set<string>>(new Set());
  const [busy, setBusy] = createSignal(false);
  const [role, setRole] = createSignal<LobbyRole>(LobbyRole.Fighter);
  const [typed, setTyped] = createSignal('');

  // Paged because every row follows the profile behind it
  const roster = createPager(() => (friends() ?? []).map((row) => row.uid), LIST_PAGE);

  const there = (): Set<string> => new Set(props.present);

  /** What is on offer: a seat and a chair, or only the chair */
  const roles = (): LobbyRole[] =>
    props.fighters === false ? [LobbyRole.Spectator] : [LobbyRole.Fighter, LobbyRole.Spectator];

  const asking = (): LobbyRole => (props.fighters === false ? LobbyRole.Spectator : role());

  const report = (sent: boolean, remember?: string): void => {
    if (!sent) {
      toast.push({ message: 'That invite could not be sent.', tone: 'ember' });
      return;
    }
    if (remember != null) {
      setAsked((held) => new Set(held).add(remember));
    }
    toast.push({ message: 'Invite sent.', tone: 'leaf' });
  };

  const call = (uid: string): void => {
    setBusy(true);
    props
      .onInvite(uid, asking())
      .then((sent) => {
        report(sent, uid);
      })
      .catch(() => {
        report(false);
      })
      .finally(() => {
        setBusy(false);
      });
  };

  const callByCode = (): void => {
    const send = props.onInviteByCode;

    if (send == null) {
      return;
    }
    setBusy(true);
    send(typed(), asking())
      .then((sent) => {
        report(sent);

        if (sent) {
          setTyped('');
        }
      })
      .catch(() => {
        report(false);
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.title}
      description={props.description}
    >
      <Show when={roles().length > 1}>
        <Select
          label="Calling them in as"
          value={asking()}
          options={roles().map((one) => ({ value: one, label: LOBBY_ROLE_NAMES[one] }))}
          onChange={(chosen) => {
            setRole(chosen);
          }}
        />
      </Show>

      <Show when={props.onInviteByCode}>
        <Row class="items-end gap-2">
          <TextField
            class="grow"
            label="Friend code"
            placeholder="0000-0000-0000"
            value={typed()}
            disabled={busy()}
            onChange={(value) => {
              setTyped(value);
            }}
          />
          <Button tone="primary" disabled={busy() || typed().trim() === ''} onClick={callByCode}>
            Invite
          </Button>
        </Row>
      </Show>

      <Show
        when={(friends() ?? []).length > 0}
        fallback={<Note>Nobody to call: add a friend first.</Note>}
      >
        <List>
          <For each={roster.shown()}>
            {(uid) => (
              <FriendEntry uid={uid}>
                <Show when={!there().has(uid)} fallback={<Note>Already in the lobby.</Note>}>
                  <Button
                    disabled={busy() || asked().has(uid)}
                    onClick={() => {
                      call(uid);
                    }}
                  >
                    {asked().has(uid) ? 'Invited' : 'Invite'}
                  </Button>
                </Show>
              </FriendEntry>
            )}
          </For>
        </List>
        {roster.controls()}
      </Show>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
