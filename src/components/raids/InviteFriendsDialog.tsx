import { For, type JSX, Show, createSignal, from } from 'solid-js';
import { type FriendLink, watchFriends } from '../../auth/friends';
import { inviteToRaid } from '../../auth/raids';
import FriendEntry from '../friends/FriendEntry';
import {
  Button,
  Dialog,
  DialogActions,
  LIST_PAGE,
  List,
  Note,
  createPager,
  useToast,
} from '../styled';

/**
 * Calling friends into the lobby the player is standing in.
 *
 * The list is the player's own friends, so an invite cannot be spam;
 * one already in the lobby is shown and refused rather than hidden,
 * so a roll call reads as complete
 */
export interface InviteFriendsDialogProps {
  raidId: string;
  player: string;
  isOpen: boolean;
  onClose: () => void;
  /** Everybody already fielding a team, who needs no calling */
  present: string[];
}

export default function InviteFriendsDialog(props: InviteFriendsDialogProps): JSX.Element {
  const toast = useToast();
  const friends = from<FriendLink[]>((set) =>
    watchFriends(props.player, (rows) => {
      set(rows);
    }),
  );
  const [asked, setAsked] = createSignal<Set<string>>(new Set());
  const [busy, setBusy] = createSignal(false);

  // Paged because every row follows the profile behind it
  const roster = createPager(() => (friends() ?? []).map((row) => row.uid), LIST_PAGE);

  const there = (): Set<string> => new Set(props.present);

  const call = (uid: string): void => {
    setBusy(true);
    inviteToRaid(props.raidId, uid)
      .then((sent) => {
        if (!sent) {
          toast.push({ message: 'That invite could not be sent.', tone: 'ember' });
          return;
        }
        setAsked((held) => new Set(held).add(uid));
        toast.push({ message: 'Invite sent.', tone: 'leaf' });
      })
      .catch(() => {
        toast.push({ message: 'That invite could not be sent.', tone: 'ember' });
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Invite friends"
      description="They see the call above the list of raids, and joining answers it."
    >
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
