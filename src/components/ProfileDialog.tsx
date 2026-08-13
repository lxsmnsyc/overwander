import { type JSX, Show } from 'solid-js';
import { type Profile, watchProfile } from '../auth/profile';
import ProfileTab from './ProfileTab';
import watchLive from './watch';
import { Button, Dialog, DialogActions } from './styled';

/**
 * Somebody else's profile, opened over whatever named them.
 *
 * A trainer is always met in the middle of something — a party in a
 * lobby, a lot on the board — and the answer to "who is that" is the
 * page they already have. So it is the profile, with everything that
 * writes taken off it: the sign-out, the buddy swap, the button that
 * collects what a raid still owes.
 *
 * None of that is a permission. The rules refuse every one of those
 * writes for a player who is not the owner, and the server refuses
 * them again; this is so a reader is not offered a button that could
 * only fail.
 */
export interface ProfileDialogProps {
  /**
   * Whose profile, or null when nobody's is open
   */
  player: string | null;
  onClose: () => void;
}

export default function ProfileDialog(props: ProfileDialogProps): JSX.Element {
  // Named by the nickname rather than by the uid, which is what a
  // player is to everybody else.
  //
  // Followed through `watchLive` rather than Solid's `from`: this
  // dialog is mounted for the whole session and nobody is being looked
  // at when it is created, so a producer asked once would be asked
  // while there was nothing to follow — and never again
  const profile = watchLive<Profile | null>((set) => {
    const player = props.player;

    if (player == null) {
      return null;
    }
    return watchProfile(player, (record) => {
      set(record);
    });
  });

  /**
   * What the panel is called. A profile that has not arrived yet — or
   * one that never will, for an account whose record is gone — is
   * still somebody's, so the heading says what it can rather than
   * waiting
   */
  const named = (): string => profile()?.nickname ?? 'Trainer';

  return (
    <Dialog
      isOpen={props.player != null}
      onClose={props.onClose}
      width="wide"
      quiet
      title={named()}
      description="Who this trainer is, who walks with them, and what they have done."
    >
      <Show when={props.player}>{(player) => <ProfileTab player={player()} viewOnly />}</Show>
      <DialogActions>
        <Button onClick={props.onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
