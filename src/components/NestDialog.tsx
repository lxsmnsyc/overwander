import { type JSX, Show } from 'solid-js';
import { Species } from '../data/ids/species';
import SpriteDisplay from './SpriteDisplay';
import { Button, Dialog, DialogActions, Meta, Note } from './styled';

/**
 * An egg that has been found, put to the player before it is theirs.
 *
 * It used to be an announcement: pressing a nest took the egg and this
 * dialog said so. Every other landmark can work that way, because
 * everything else they pay is simply better to have — a stash of
 * items, a berry, a pokemon to throw balls at. An egg is not. A buddy
 * carries one egg and walks it open, so taking a second is a decision
 * about the first, and a player who was saving the walk for the egg
 * they already have had it made for them.
 *
 * So it asks. What it cannot say is what is inside — that is the whole
 * of what an egg is — which leaves the picture, where it was found,
 * and what carrying it will cost in walking.
 */

/**
 * Where the egg turned up. A nest is a place that holds one twice a
 * day and is worth walking back to; a grotto hiding one instead of a
 * pokemon is the rarest thing in the overworld, and saying which is
 * which is the only clue to how easily it could be found again
 */
export type EggSource = 'nest' | 'grotto';

const FOUND: Record<EggSource, string> = {
  nest: 'An egg is lying in the nest.',
  grotto: 'An egg, tucked away in the grotto.',
};

const AGAIN: Record<EggSource, string> = {
  nest: 'The nest holds one egg per player between refills, and you have had this one.',
  grotto: 'You have already had what this hour hid here.',
};

const BARE: Record<EggSource, string> = {
  nest: 'The nest is bare until tomorrow.',
  grotto: 'Nothing is tucked away here.',
};

/**
 * What the player has walked up to: an egg going spare, one they have
 * already taken this window, or a nest with nothing in it.
 *
 * A bare nest is a dialog rather than a line under the map for the
 * same reason a quiet lair is: a player who pressed a cell asked a
 * question, and the answer belongs where they are looking
 */
export type EggState = 'offered' | 'taken' | 'bare';

export interface NestDialogProps {
  /**
   * The egg on offer, or null when the player is not standing at one
   */
  offer: { from: EggSource; state: EggState; message: string | null } | null;
  /**
   * Whether the claim is in flight, so the button cannot be pressed
   * twice into two eggs
   */
  busy: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export default function NestDialog(props: NestDialogProps): JSX.Element {
  /**
   * Whether there is still a question on the table. Once it has been
   * answered — taken, or refused by the world in the moment between
   * looking and taking — the dialog has nothing left to ask
   */
  const asking = (): boolean => props.offer?.state === 'offered' && props.offer.message == null;

  /**
   * What the dialog is saying, before anything has been agreed to
   */
  const said = (offer: NonNullable<NestDialogProps['offer']>): string =>
    offer.message ?? (offer.state === 'bare' ? BARE[offer.from] : FOUND[offer.from]);

  return (
    <Dialog
      isOpen={props.offer != null}
      onClose={props.onClose}
      title="Egg"
      terse
      description={
        props.offer == null ? 'An egg, and whether you want to carry it.' : said(props.offer)
      }
    >
      <Show when={props.offer}>
        {(offer) => (
          <div class="flex flex-col items-center gap-2 py-2 text-center">
            {/* Nothing to draw where there is nothing lying there:
                an empty nest is not a picture of an egg */}
            <Show when={offer().state !== 'bare'}>
              {/* On the floor of its box, so the line under it sits
                  where it sits for every other sprite in the game */}
              <div class="flex items-end justify-center">
                <SpriteDisplay
                  species={Species.Egg}
                  animation="Idle"
                  direction="down"
                  scale={4}
                  label="An egg"
                />
              </div>
            </Show>

            <p class="text-lg">{said(offer())}</p>

            <Show
              when={asking()}
              fallback={
                <Show when={offer().state === 'taken'}>
                  <Note class="max-w-prose">{AGAIN[offer().from]}</Note>
                </Show>
              }
            >
              {/* What taking it commits the player to, which is the
                  whole of the decision: an egg is not carried for
                  nothing, and the pokemon already walking with them is
                  what pays for it */}
              <Meta class="max-w-prose">
                It hatches by being walked, and only your buddy walks it — taking it means putting
                down whatever is walking with you now. Nothing about it is known until it opens.
              </Meta>
            </Show>
          </div>
        )}
      </Show>

      <DialogActions center>
        <Show when={asking()}>
          <Button tone="primary" disabled={props.busy} onClick={props.onAccept}>
            Take it
          </Button>
        </Show>
        {/* "Leave it" while there is something to leave, and the plain
            way out once there is not */}
        <Button onClick={props.onClose}>{asking() ? 'Leave it' : 'Close'}</Button>
      </DialogActions>
    </Dialog>
  );
}
