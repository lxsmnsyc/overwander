import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import AddFriendDialog from '../../friends/AddFriendDialog';
import type ProfileSection from '../../../game/session/profile-section';
import { UserIcon } from '../../icons';
import { Button, Dialog, DialogActions, Meta } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';
import EditProfileDialog from '../EditProfileDialog';
import ProfileBody from './body';
import ProfileHero from './hero';
import createProfileState from './state';

/**
 * Who a trainer is: their details and balance, who walks with them, and
 * what they have fought, earned and bid on.
 *
 * It is the player's own profile, with a rail of sections and what
 * changes something (editing, signing out, swapping the buddy,
 * collecting what a raid still owes), or somebody else's, opened over
 * whatever named them, with everything that writes taken off it. None
 * of that is a permission: the server refuses every one of those writes
 * for a player who is not the owner. This is so a reader is not offered
 * a button that could only fail.
 */

export interface ProfileSheetProps {
  /** Whose profile, or null when nobody's is open */
  player: string | null;
  /** Whether this is somebody else's profile, being looked at */
  viewOnly?: boolean;
  /**
   * Which section of the player's own to open at, for somebody sent
   * here to answer one thing. Read once as the sheet is built
   */
  section?: ProfileSection;
  isOpen: boolean;
  onClose: () => void;
}

/** What the dialog is called when it is the player's own */
function ownTitle(): string {
  return m.panel_profile();
}

function Sheet(props: ProfileSheetProps & { player: string; onGone: () => void }): JSX.Element {
  const state = createProfileState({
    player: props.player,
    viewOnly: props.viewOnly === true,
    section: props.section,
  });

  // Named by the nickname where it is somebody else's, which is what a
  // player is to everybody else; a profile that has not arrived yet is
  // still somebody's, so the heading says what it can rather than waiting
  const named = (): string =>
    props.viewOnly === true ? (state.profile()?.nickname ?? m.profile_trainer()) : ownTitle();

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      afterLeave={props.onGone}
      width="sheet"
      layout="sheet"
      terse
      lead={<UserIcon class="size-4" aria-hidden="true" />}
      title={named()}
      description={
        props.viewOnly === true ? m.profile_dialog_description() : m.panel_profile_description()
      }
      hero={<ProfileHero state={state} />}
    >
      <ProfileBody state={state} />
      <DialogActions
        note={
          <Meta class="hidden md:block">
            {props.viewOnly === true ? m.profile_dock_visited() : m.profile_dock_own()}
          </Meta>
        }
      >
        <Button onClick={props.onClose}>{m.ui_close()}</Button>
      </DialogActions>
      {/* Somebody to ask, out of everybody playing. It is opened from
          the menu on the player's own profile alone */}
      <AddFriendDialog
        isOpen={state.adding()}
        onClose={() => {
          state.setAdding(false);
        }}
      />
      {/* The name and the picture, which are the whole of what a
          trainer sets about themselves */}
      <Show when={state.profile()}>
        {(loaded) => (
          <EditProfileDialog
            player={props.player}
            profile={loaded()}
            isOpen={state.editing()}
            onClose={() => {
              state.setEditing(false);
            }}
            onSaved={() => {
              state.setSaid(m.profile_saved());
            }}
          />
        )}
      </Show>
    </Dialog>
  );
}

/**
 * The sheet is built when it opens and put away when its fade is over,
 * so what it follows (the profile, the requests, the lots) is followed
 * only while somebody is looking
 */
export default function ProfileSheet(props: ProfileSheetProps): JSX.Element {
  const [last, setLast] = createSignal<string | null>(null);

  createEffect(() => {
    if (props.isOpen && props.player != null) {
      setLast(props.player);
    }
  });

  return (
    <Show when={last()} keyed>
      {(player) => (
        <Sheet
          {...props}
          player={player}
          onGone={() => {
            if (!props.isOpen) {
              setLast(null);
            }
          }}
        />
      )}
    </Show>
  );
}
