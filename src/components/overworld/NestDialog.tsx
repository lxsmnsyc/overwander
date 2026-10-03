import { type JSX, Show } from 'solid-js';
import { Genders, Species } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';
import type { Buddy } from '../../overworld/core';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, Dialog, DialogActions, Meta } from '../styled';
import { CounterSpent, CounterTerms, HeadingPortrait } from '../forms/terms';

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
  nest: 'An egg, warm in the nest.',
  grotto: 'An egg, tucked away in the grotto.',
};

const AGAIN: Record<EggSource, string> = {
  nest: 'One egg per player between refills, and you have had yours.',
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
  offer: { from: EggSource; state: EggState } | null;
  /**
   * Whether the claim is in flight, so the button cannot be pressed
   * twice into two eggs
   */
  busy: boolean;
  /** Who walks with the player now, since taking the egg puts them down */
  buddy: Buddy | null;
  onAccept: () => void;
  onClose: () => void;
}

/** How often each kind hands one out, for the terms */
const OFTEN: Record<EggSource, string> = {
  nest: 'One egg a player between refills',
  grotto: 'One find an hour',
};

export default function NestDialog(props: NestDialogProps): JSX.Element {
  const asking = (): boolean => props.offer?.state === 'offered';

  /** The line under the title: what is lying there, or that nothing is */
  const heading = (): string => {
    const offer = props.offer;

    if (offer == null) {
      return 'An egg, and whether you want to carry it.';
    }
    return offer.state === 'bare' ? BARE[offer.from] : FOUND[offer.from];
  };

  return (
    <Dialog
      isOpen={props.offer != null}
      onClose={props.onClose}
      title="Egg"
      lead={
        <HeadingPortrait>
          <AnimatedSprite species={Species.Egg} direction="Down" still fill label="" />
        </HeadingPortrait>
      }
      description={heading()}
    >
      <Show when={props.offer}>
        {(offer) => (
          <div class="flex flex-col gap-3">
            <CounterTerms
              often={offer().state === 'taken' ? 'Used this while' : OFTEN[offer().from]}
            />
            <Show when={offer().state === 'taken'}>
              <CounterSpent says={AGAIN[offer().from]} quoted={false} />
            </Show>
            <Show when={offer().state === 'bare'}>
              <CounterSpent title="Nothing here" says={BARE[offer().from]} quoted={false} />
            </Show>
            <Show when={asking()}>
              {/* What taking it commits the player to: the pokemon
                  already walking with them is what pays for it */}
              <Meta>
                Only your buddy can walk it warm, so taking it means putting down whoever walks with
                you now. What is inside stays a secret until it opens.
              </Meta>
              <div class="flex items-center gap-2 rounded-panel border-2 border-line bg-paper px-3 py-1.5">
                <Show
                  when={props.buddy}
                  fallback={<span class="text-sm">It will walk with you.</span>}
                >
                  {(walking) => (
                    <>
                      <span class="flex size-8 shrink-0 items-center justify-center">
                        <AnimatedSprite
                          species={walking().species}
                          shiny={walking().shiny}
                          female={walking().gender === Genders.Female}
                          direction="DownLeft"
                          still
                          fill
                          label=""
                        />
                      </span>
                      <span class="text-sm">
                        {walking().species === Species.Egg
                          ? 'The egg you carry now is put down.'
                          : `${getSpeciesData(walking().species).name} stops walking with you.`}
                      </span>
                    </>
                  )}
                </Show>
              </div>
            </Show>
          </div>
        )}
      </Show>

      <DialogActions>
        <Show when={asking()}>
          <Button tone="primary" disabled={props.busy} onClick={props.onAccept}>
            Take it
          </Button>
        </Show>
        <Button onClick={props.onClose}>Walk on</Button>
      </DialogActions>
    </Dialog>
  );
}
