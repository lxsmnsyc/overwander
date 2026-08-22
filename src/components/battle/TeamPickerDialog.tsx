import type { JSX } from 'solid-js';
import { isGuarded } from '../../auth/caught';
import { isEgg } from '../../auth/egg';
import { isFainted } from '../../auth/health';
import { TEAM_SIZE } from '../../auth/teams';
import CatchPicker, { type CatchOption } from '../catches/CatchPicker';

/**
 * Why a pokemon cannot be brought into a raid. All four are shown
 * rather than hidden: a player counting their six should find out
 * where the sixth went instead of finding it gone
 */
function heldBack(option: CatchOption): string | null {
  if (isEgg(option.caught)) {
    return 'not hatched';
  }
  if (isFainted(option.caught)) {
    return 'fainted';
  }
  // Put away by its owner. Nothing is wrong with it — they said so
  if (isGuarded(option.caught)) {
    return 'locked';
  }
  // One pokemon, one battle. It comes back when the raid it is in ends
  return option.fighting ? 'in a raid' : null;
}

export interface TeamPickerDialogProps {
  player: string;
  isOpen: boolean;
  onClose: () => void;
  /**
   * Fired with the chosen catch ids, at most TEAM_SIZE of them
   */
  onSubmit: (catches: string[]) => void;
}

/**
 * Pick up to six catches to bring into a raid. The list itself is the
 * ordinary catch picker — what makes it a team is the six, and the
 * three reasons a pokemon cannot be one of them
 */
export default function TeamPickerDialog(props: TeamPickerDialogProps): JSX.Element {
  return (
    <CatchPicker
      multiple
      // A press on a square takes it into the party, and a press on a
      // taken one puts it back: forming a team is six of those, and a
      // card and a button in the way of each is five steps too many
      player={props.player}
      open={props.isOpen}
      onClose={props.onClose}
      value={[]}
      max={TEAM_SIZE}
      title="Form a team"
      verb="Join with"
      empty="No catches to bring."
      reason={heldBack}
      onPick={props.onSubmit}
    />
  );
}
