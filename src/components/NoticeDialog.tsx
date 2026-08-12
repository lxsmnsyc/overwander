import { type JSX, Show } from 'solid-js';
import { Button, Dialog, DialogActions } from './styled';

/**
 * Something that happened, put in front of the player.
 *
 * A cache dug up or a patch picked is not a decision — it is already
 * in the bag by the time there is anything to say — and saying it in
 * the status line under the map meant a player who was looking at the
 * cell they just pressed missed what came out of it. So it is said
 * here, in the middle, with one way out.
 *
 * It is the same shape as the mystery gift and for the same reason:
 * nothing to weigh up, nothing to refuse, one button.
 */

export interface NoticeDialogProps {
  /**
   * What happened, or null when nothing has
   */
  message: string | null;
  /**
   * What to call it. The message says what was found; this says what
   * found it
   */
  title: string;
  /**
   * What was found, shown rather than named: the room above the
   * message where a picture of it goes.
   *
   * It is a slot rather than a list of items because the items have
   * no sprites yet — a cache pays in Poke Balls and Fire Stones, and
   * nothing in the game can draw one. The room is here so that the
   * day they can be drawn, they are drawn here, and the dialog does
   * not change shape underneath a player who already knows it
   */
  art?: JSX.Element;
  onClose: () => void;
}

export default function NoticeDialog(props: NoticeDialogProps): JSX.Element {
  return (
    <Dialog
      isOpen={props.message != null}
      onClose={props.onClose}
      title={props.title}
      terse
      description={props.message ?? 'Something happened.'}
    >
      {/* The picture of what was found, and the room it will take up
          once there is one to draw */}
      <div class="flex min-h-24 items-center justify-center">{props.art}</div>
      <Show when={props.message}>{(said) => <p class="text-center text-lg">{said()}</p>}</Show>
      <DialogActions center>
        <Button tone="primary" onClick={props.onClose}>
          Okay
        </Button>
      </DialogActions>
    </Dialog>
  );
}
