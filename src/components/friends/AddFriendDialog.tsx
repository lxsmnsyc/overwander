import { type JSX, type Resource, Show, Suspense, createResource, createSignal } from 'solid-js';
import { type FoundPlayer, FriendTie, findPlayerByCode, getMyFriendCode } from '../../auth/friends';
import { Button, Dialog, DialogActions, List, Meta, Note, Row, Status, TextField } from '../styled';
import FriendEntry from './FriendEntry';
import createFriendTie, { friendActionLabel } from './tie';
import { useGame } from '../app/game-context';
import describeFailure from '../../i18n/refusals';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * Finding somebody to ask, and being findable.
 *
 * By friend code rather than by name or address. A name is not a
 * handle — two players may call themselves the same thing — and an
 * address is more than anybody should have to hand out. A code has to
 * be given by the person it belongs to, which is the whole check:
 * somebody who was not told it cannot ask
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
            {m.friends_view()}
          </Button>
          <Button
            tone={friend.tie() === FriendTie.None ? 'primary' : undefined}
            disabled={friend.busy()}
            onClick={friend.act}
          >
            {/* "Add" until it is asked, then whatever undoes it: the
                row stays after a press, and a button that still said
                "Add" would read as one that did nothing */}
            {friend.tie() === FriendTie.None ? m.friends_add() : friendActionLabel(friend.tie())}
          </Button>
        </FriendEntry>
      </List>
      <Status message={friend.error()} tone="alert" />
    </>
  );
}

/**
 * The player's own code, which is where the read lands: a resource
 * read in the component that made it would suspend past the dialog
 */
function OwnCode(props: { code: Resource<string> }): JSX.Element {
  const [copied, setCopied] = createSignal(false);

  return (
    <Row class="items-center justify-between">
      <div class="flex flex-col">
        <Meta>{m.friends_your_code()}</Meta>
        <span class="font-mono text-lg font-semibold tracking-wide">{props.code()}</span>
      </div>
      <Button
        onClick={() => {
          navigator.clipboard
            .writeText(props.code.latest ?? '')
            .then(() => {
              setCopied(true);
            })
            .catch(() => {
              // Nothing to say: the code is on the screen to copy by
              // hand, which is what somebody refused the API does
            });
        }}
      >
        {copied() ? m.friends_copied() : m.friends_copy()}
      </Button>
    </Row>
  );
}

export default function AddFriendDialog(props: AddFriendDialogProps): JSX.Element {
  const [typed, setTyped] = createSignal('');
  const [found, setFound] = createSignal<FoundPlayer | null>(null);
  const [looking, setLooking] = createSignal(false);
  const [said, setSaid] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  // Minted on the first open rather than at sign-in: a code is only
  // needed once somebody means to share it
  const [code] = createResource(
    () => (props.isOpen ? true : null),
    async () => getMyFriendCode(),
  );

  const look = (): void => {
    setError(null);
    setSaid(null);
    setFound(null);
    setLooking(true);
    findPlayerByCode(typed())
      .then((player) => {
        setFound(player);
        if (player == null) {
          setSaid(m.friends_no_code());
        }
      })
      .catch((caught: unknown) => {
        setError(describeFailure(caught));
      })
      .finally(() => {
        setLooking(false);
      });
  };

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={m.friends_add_title()}
      description={m.friends_add_description()}
    >
      <Suspense fallback={<Note>{m.friends_code_loading()}</Note>}>
        <OwnCode code={code} />
      </Suspense>

      <div class="flex items-end gap-2">
        <TextField
          class="grow"
          label={m.friends_code_label()}
          placeholder="0000-0000-0000"
          value={typed()}
          disabled={looking()}
          onChange={(value) => {
            setTyped(value);
          }}
        />
        <Button tone="primary" disabled={looking() || typed().trim() === ''} onClick={look}>
          {m.friends_look_up()}
        </Button>
      </div>

      <Show when={found()}>{(player) => <Found player={player()} />}</Show>
      <Note>{looking() ? m.ui_looking() : ''}</Note>
      <Status message={said()} />
      <Status message={error()} tone="alert" />
      <DialogActions>
        <Button onClick={props.onClose}>{m.ui_close()}</Button>
      </DialogActions>
    </Dialog>
  );
}
