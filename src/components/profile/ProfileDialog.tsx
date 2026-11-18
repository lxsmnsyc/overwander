import type { JSX } from '@solidjs/web';
import ProfileSheet from './profile-sheet';

/**
 * Somebody else's profile, opened over whatever named them.
 *
 * A trainer is always met in the middle of something — a party in a
 * lobby, a lot on the board — and the answer to "who is that" is the
 * page they already have. So it is the profile, with everything that
 * writes taken off it: the sign-out, the buddy swap, the button that
 * collects what a raid still owes.
 */
export interface ProfileDialogProps {
  /**
   * Whose profile, or null when nobody's is open
   */
  player: string | null;
  onClose: () => void;
}

export default function ProfileDialog(props: ProfileDialogProps): JSX.Element {
  return (
    <ProfileSheet
      viewOnly
      player={props.player}
      isOpen={props.player != null}
      onClose={props.onClose}
    />
  );
}
