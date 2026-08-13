import { type JSX, Show } from 'solid-js';
import { Species } from '../data/ids/species';
import SpriteDisplay from './SpriteDisplay';
import { Button, Dialog, DialogActions, Meta } from './styled';

/**
 * A nest, and whatever is lying in it.
 *
 * An egg says nothing about itself — that is the whole of what an egg
 * is — so there is nothing here to weigh up and nothing to refuse: by
 * the time this opens, the egg is already the player's. It is a dialog
 * rather than a line under the map because a player who pressed a nest
 * is looking at the nest, and because the egg is worth showing: it is
 * the one thing in the game whose picture is the same for every
 * species, and the only clue to what is in it is how far it has to be
 * carried.
 */

export interface NestDialogProps {
  /**
   * What happened, or null when the player is not standing at a nest.
   * A bare nest is still worth the dialog — it says the nest is bare,
   * which is what the press asked
   */
  message: string | null;
  /**
   * Whether an egg actually came out of it. A bare nest draws nothing
   */
  found: boolean;
  onClose: () => void;
}

export default function NestDialog(props: NestDialogProps): JSX.Element {
  return (
    <Dialog
      isOpen={props.message != null}
      onClose={props.onClose}
      title="Nest"
      terse
      description={props.message ?? 'A nest, and whatever is lying in it.'}
    >
      <div class="flex flex-col items-center gap-2 py-2 text-center">
        <Show when={props.found}>
          {/* On the floor of its box, so the line under it sits where
              it sits for every other sprite in the game */}
          <div class="flex h-28 items-end justify-center">
            <SpriteDisplay
              species={Species.Egg}
              animation="Idle"
              direction="down"
              scale={4}
              label="An egg, lying in the nest"
            />
          </div>
        </Show>
        <Show when={props.message}>{(said) => <p class="text-lg">{said()}</p>}</Show>
        <Show when={props.found}>
          <Meta class="max-w-prose">
            Carry it as your buddy and walk. Nothing about it is known until it opens.
          </Meta>
        </Show>
      </div>
      <DialogActions center>
        <Button tone="primary" onClick={props.onClose}>
          Okay
        </Button>
      </DialogActions>
    </Dialog>
  );
}
