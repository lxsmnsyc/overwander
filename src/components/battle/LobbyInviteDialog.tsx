import { For, type JSX, Show, createSignal, from } from 'solid-js';
import { type FriendLink, watchFriends } from '../../auth/friends';
import { LobbyRole } from '../../model/lobby-role';
import { m } from '../../i18n/paraglide/messages.js';
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

/** What a role is called on the picker, read when shown so it follows the locale */
function readRoleName(role: LobbyRole): string {
  return role === LobbyRole.Fighter ? m.lobby_role_fighter() : m.lobby_role_spectator();
}

/**
 * Calling people into a lobby, to fight or to watch.
 *
 * Both kinds of lobby use it. The list is the player's own friends,
 * which is what keeps a raid invite from being spam; a lobby that can
 * also reach strangers passes `onInviteByCode`, and the code is the
 * check there: its owner handed it over.
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
  const roster = createPager((): string[] => {
    const uids: string[] = [];

    for (const row of friends() ?? []) {
      uids.push(row.uid);
    }
    return uids;
  }, LIST_PAGE);

  const there = (): Set<string> => new Set(props.present);

  /** What is on offer: a seat and a chair, or only the chair */
  const roles = (): LobbyRole[] =>
    props.fighters === false ? [LobbyRole.Spectator] : [LobbyRole.Fighter, LobbyRole.Spectator];

  const roleOptions = (): { value: LobbyRole; label: string }[] => {
    const options: { value: LobbyRole; label: string }[] = [];

    for (const one of roles()) {
      options.push({ value: one, label: readRoleName(one) });
    }
    return options;
  };

  const asking = (): LobbyRole => (props.fighters === false ? LobbyRole.Spectator : role());

  const report = (sent: boolean, remember?: string): void => {
    if (!sent) {
      toast.push({ message: m.lobby_invite_failed(), tone: 'ember' });
      return;
    }
    if (remember != null) {
      setAsked((held) => new Set(held).add(remember));
    }
    toast.push({ message: m.lobby_invite_sent(), tone: 'leaf' });
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
          label={m.lobby_invite_role()}
          value={asking()}
          options={roleOptions()}
          onChange={(chosen) => {
            setRole(chosen);
          }}
        />
      </Show>

      <Show when={props.onInviteByCode}>
        <Row class="items-end gap-2">
          <TextField
            class="grow"
            label={m.lobby_invite_code()}
            placeholder="0000-0000-0000"
            value={typed()}
            disabled={busy()}
            onChange={(value) => {
              setTyped(value);
            }}
          />
          <Button tone="primary" disabled={busy() || typed().trim() === ''} onClick={callByCode}>
            {m.lobby_invite()}
          </Button>
        </Row>
      </Show>

      <Show
        when={(friends() ?? []).length > 0}
        fallback={<Note>{m.lobby_invite_no_friends()}</Note>}
      >
        <List>
          <For each={roster.shown()}>
            {(uid) => (
              <FriendEntry uid={uid}>
                <Show when={!there().has(uid)} fallback={<Note>{m.lobby_invite_present()}</Note>}>
                  <Button
                    disabled={busy() || asked().has(uid)}
                    onClick={() => {
                      call(uid);
                    }}
                  >
                    {asked().has(uid) ? m.lobby_invited() : m.lobby_invite()}
                  </Button>
                </Show>
              </FriendEntry>
            )}
          </For>
        </List>
        {roster.controls()}
      </Show>
      <DialogActions>
        <Button onClick={props.onClose}>{m.battle_close()}</Button>
      </DialogActions>
    </Dialog>
  );
}
