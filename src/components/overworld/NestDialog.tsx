import { type JSX, Show } from 'solid-js';
import { Genders, Species } from '../../data/ids/species';
import { getSpeciesData } from '../../data/species';
import type { Buddy } from '../../overworld/core';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, Dialog, DialogActions, Meta } from '../styled';
import { CounterSpent, CounterTerms, HeadingPortrait } from '../forms/terms';
import type { EggSource, EggState } from '../../game/overworld/journey';
import { m } from '../../i18n/paraglide/messages.js';

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
export type { EggSource };

const FOUND: Record<EggSource, () => string> = {
  nest: m.nest_found_nest,
  grotto: m.nest_found_grotto,
};

const AGAIN: Record<EggSource, () => string> = {
  nest: m.nest_again_nest,
  grotto: m.nest_again_grotto,
};

const BARE: Record<EggSource, () => string> = {
  nest: m.nest_bare_nest,
  grotto: m.nest_bare_grotto,
};

/**
 * What the player has walked up to: an egg going spare, one they have
 * already taken this window, or a nest with nothing in it.
 *
 * A bare nest is a dialog rather than a line under the map for the
 * same reason a quiet lair is: a player who pressed a cell asked a
 * question, and the answer belongs where they are looking
 */
export type { EggState };

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
const OFTEN: Record<EggSource, () => string> = {
  nest: m.nest_often_nest,
  grotto: m.nest_often_grotto,
};

export default function NestDialog(props: NestDialogProps): JSX.Element {
  const asking = (): boolean => props.offer?.state === 'offered';

  /** The line under the title: what is lying there, or that nothing is */
  const heading = (): string => {
    const offer = props.offer;

    if (offer == null) {
      return m.nest_heading();
    }
    return offer.state === 'bare' ? BARE[offer.from]() : FOUND[offer.from]();
  };

  return (
    <Dialog
      isOpen={props.offer != null}
      onClose={props.onClose}
      title={m.nest_title()}
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
              often={offer().state === 'taken' ? m.ow_used_this_while() : OFTEN[offer().from]()}
            />
            <Show when={offer().state === 'taken'}>
              <CounterSpent says={AGAIN[offer().from]()} quoted={false} />
            </Show>
            <Show when={offer().state === 'bare'}>
              <CounterSpent
                title={m.nest_nothing_here()}
                says={BARE[offer().from]()}
                quoted={false}
              />
            </Show>
            <Show when={asking()}>
              {/* What taking it commits the player to: the pokemon
                  already walking with them is what pays for it */}
              <Meta>{m.nest_commitment()}</Meta>
              <div class="flex items-center gap-2 rounded-panel border-2 border-line bg-paper px-3 py-1.5">
                <Show
                  when={props.buddy}
                  fallback={<span class="text-sm">{m.nest_walks_with_you()}</span>}
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
                          ? m.nest_egg_put_down()
                          : m.nest_buddy_stops({ name: getSpeciesData(walking().species).name })}
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
            {m.nest_take()}
          </Button>
        </Show>
        <Button onClick={props.onClose}>{m.ow_walk_on()}</Button>
      </DialogActions>
    </Dialog>
  );
}
