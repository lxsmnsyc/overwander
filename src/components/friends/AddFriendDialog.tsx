import { type JSX, Show, createSignal } from 'solid-js';
import {
  type FoundPlayer,
  FriendTie,
  findPlayerByEmail,
  friendActionLabel,
} from '../../auth/friends';
import { Button, Dialog, DialogActions, List, Note, Status, TextField } from '../styled';
import FriendEntry from './FriendEntry';
import createFriendTie from './tie';
import { useGame } from '../app/game-context';

/**
 * Finding somebody to ask.
 *
 * By address rather than by name. A name is not a handle — two players
 * may call themselves the same thing, and a player who renames
 * themselves is unfindable by the old one — and a list of everybody
 * playing is a list of everybody to be asked by strangers. An address
 * has to be given by the person it belongs to, which is the whole
 * check: somebody who was not told it cannot ask
 */
export interface AddFriendDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/** The one trainer found, with whichever press their standing leaves */
function Found(props: { player: FoundPlayer }): JSX.Element {
  const game = useGame();
  const friend = createFriendTie(() => props.player.uid, { known: () => props.player.tie });

  return (
    <>
      <List>
        <FriendEntry uid={props.player.uid}>
          <Button
            onClick={() => {
              game.setVisiting(props.player.uid);
            }}
          >
            View
          </Button>
          <Button
            tone={friend.tie() === FriendTie.None ? 'primary' : undefined}
            disabled={friend.busy()}
            onClick={friend.act}
          >
            {/* "Add" until it is asked, then whatever undoes it: the
                row stays after a press, and a button that still said
                "Add" would read as one that did nothing */}
            {friend.tie() === FriendTie.None ? 'Add' : friendActionLabel(friend.tie())}
          </Button>
        </FriendEntry>
      </List>
      <Status message={friend.error()} tone="alert" />
    </>
  );
}

export default function AddFriendDialog(props: AddFriendDialogProps): JSX.Element {
  const [typed, setTyped] = createSignal('');
  const [found, setFound] = createSignal<FoundPlayer | null>(null);
  const [looking, setLooking] = createSignal(false);
  const [said, setSaid] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const look = (): void => {
    setError(null);
    setSaid(null);
    setFound(null);
    setLooking(true);
    findPlayerByEmail(typed())
      .then((player) => {
        setFound(player);
        if (player == null) {
          setSaid('Nobody plays under that address.');
        }
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : String(caught));
      })
      .finally(() => {
        setLooking(false);
      });
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Add a friend"
      description="Look a trainer up by the address they signed up with. Asking somebody who has already asked you makes the friendship at once."
    >
      <div class="flex items-end gap-2">
        <TextField
          class="grow"
          label="Email address"
          kind="email"
          value={typed()}
          autocomplete="email"
          disabled={looking()}
          onChange={(value) => {
            setTyped(value);
          }}
        />
        <Button tone="primary" disabled={looking() || typed().trim() === ''} onClick={look}>
          Look up
        </Button>
      </div>

      <Show when={found()}>{(player) => <Found player={player()} />}</Show>
      <Note>{looking() ? 'Looking…' : ''}</Note>
      <Status message={said()} />
      <Status message={error()} tone="alert" />
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
