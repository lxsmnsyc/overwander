import { For, type JSX, Show } from 'solid-js';
import { type CatchGift, GiftKind, type MysteryGift } from '../auth/gift-record';
import getSigil from '../data/constants/sigil';
import type { Items } from '../data/ids/items';
import { getItemData } from '../data/items';
import { getSpeciesData } from '../data/species';
import SpriteDisplay from './SpriteDisplay';
import { Badge, Button, Dialog, DialogActions, Meta } from './styled';

/**
 * A mystery gift, shown once and dismissed.
 *
 * It is the one dialog in the game that asks nothing. Everything else
 * that opens over the world is a decision — throw or walk away, bid
 * or don't, host or join — and each of them can be closed by
 * declining it. This one is a **notice**: whatever it is showing has
 * already been written to the player's records and their bag, and
 * closing it changes nothing. So it has one button, and the button
 * says thank you rather than yes.
 *
 * It is laid out the way the catch sheet lays the same pokemon out —
 * the sprite, its level and name under that, the sigil under that —
 * so the first sight of it and every later one agree.
 */

export interface MysteryGiftDialogProps {
  /**
   * What was given. Empty when nothing was
   */
  gifts: MysteryGift[];
  onClose: () => void;
}

function describeItem(item: Items, amount: number): string {
  return `${getItemData(item).name} × ${amount}`;
}

/**
 * What it is, written the way it is written everywhere else: the
 * level, the name, and the star that says it sparkles
 */
function describeGiven(given: CatchGift): string {
  return `Lv. ${given.level} ${getSpeciesData(given.species).name}${given.shiny ? ' ✦' : ''}`;
}

export default function MysteryGiftDialog(props: MysteryGiftDialogProps): JSX.Element {
  /**
   * The pokemon of the giving, if there is one. It is the thing the
   * dialog is about — everything else that came with it is written
   * underneath in a line
   */
  const pokemon = (): CatchGift | null =>
    props.gifts.find((gift): gift is CatchGift => gift.kind === GiftKind.Catch) ?? null;

  /**
   * What a screen reader is told the dialog is for. It says in one
   * sentence what the panel says in four lines, since a reader has no
   * sprite to look at
   */
  const summary = (): string => {
    const given = pokemon();

    return given == null
      ? 'Congratulations! Something is waiting for you.'
      : `Congratulations! You received a ${describeGiven(given)}.`;
  };

  return (
    <Dialog
      isOpen={props.gifts.length > 0}
      onClose={props.onClose}
      title="Mystery Gift"
      terse
      description={summary()}
    >
      <div class="flex flex-col items-center gap-3 py-2 text-center">
        <p class="text-lg font-semibold">Congratulations!</p>

        <Show when={pokemon()}>
          {(given) => (
            <>
              <SpriteDisplay
                species={given().species}
                shiny={given().shiny}
                animation="Idle"
                direction="down-left"
                scale={4}
                label={describeGiven(given())}
              />
              <div class="flex flex-col items-center gap-0.5">
                <span class="text-lg font-semibold">{describeGiven(given())}</span>
                {/* The mark it will be known by: two of the same
                    species with the same sigil are the same
                    individual */}
                <Meta class="font-mono tracking-[0.2em]">
                  {getSigil(given().individualValue, given().traitValue)}
                </Meta>
              </div>
            </>
          )}
        </Show>

        {/* And whatever came along with it, which is not what the
            player is being congratulated on */}
        <div class="flex flex-wrap justify-center gap-2">
          <For each={props.gifts}>
            {(gift) => (
              <Show when={gift.kind === GiftKind.Item ? gift : null}>
                {(item) => <Badge>{describeItem(item().item, item().amount)}</Badge>}
              </Show>
            )}
          </For>
        </div>
      </div>
      <DialogActions center>
        <Button tone="primary" onClick={props.onClose}>
          Thanks
        </Button>
      </DialogActions>
    </Dialog>
  );
}
