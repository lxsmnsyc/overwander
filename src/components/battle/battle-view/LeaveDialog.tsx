import type { JSX } from 'solid-js';
import { Button, Dialog, DialogActions } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * Walking out of a live fight, confirmed first because it cannot be
 * walked back: a grunt's fight is conceded on the way out, and a raid
 * holds the party until it settles
 */
export default function LeaveDialog(props: {
  isOpen: boolean;
  /** What leaving now would mean */
  said: string;
  onLeave: () => void;
  onStay: () => void;
}): JSX.Element {
  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={() => {
        props.onStay();
      }}
      title={m.battle_leave_title()}
      description={m.battle_leave_description()}
      terse
    >
      <p class="text-center">{props.said}</p>
      <DialogActions>
        <Button
          tone="primary"
          onClick={() => {
            props.onLeave();
          }}
        >
          {m.battle_leave_anyway()}
        </Button>
        <Button
          onClick={() => {
            props.onStay();
          }}
        >
          {m.battle_keep_fighting()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
