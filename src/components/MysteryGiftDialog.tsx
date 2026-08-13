import { type JSX, Show, createEffect, createSignal } from 'solid-js';
import { type CatchGift, GiftKind, type ItemGift, type MysteryGift } from '../auth/gift-record';
import getSigil from '../data/constants/sigil';
import { getSpeciesData } from '../data/species';
import ItemStash from './ItemStash';
import SpriteDisplay from './SpriteDisplay';
import { Button, Dialog, DialogActions, Meta } from './styled';

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
 * It is **two** notices rather than one. A first giving is a pokemon
 * *and* twenty Poke Balls, and those are not the same news: one is
 * the thing a new player is being congratulated on, and the other is
 * what they will need to catch the next one. Shown together, the balls
 * were a row of grey badges under a sprite — read as a footnote to the
 * pokemon, when they are the reason the world is playable at all. So
 * the pokemon is shown, thanked for, and then what came with it is
 * shown in its own right, with the pictures the bag draws it by.
 */

export interface MysteryGiftDialogProps {
  /**
   * What was given. Empty when nothing was
   */
  gifts: MysteryGift[];
  onClose: () => void;
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
   * first notice is about
   */
  const pokemon = (): CatchGift | null =>
    props.gifts.find((gift): gift is CatchGift => gift.kind === GiftKind.Catch) ?? null;

  /**
   * And everything else, which is the second
   */
  const items = (): ItemGift[] =>
    props.gifts.filter((gift): gift is ItemGift => gift.kind === GiftKind.Item);

  /**
   * Whether the pokemon has been thanked for yet. A giving with no
   * pokemon in it starts past that point, so the bag is the only
   * notice a player who was handed balls alone ever sees
   */
  const [thanked, setThanked] = createSignal(false);

  // A new giving starts at the beginning of itself. The component is
  // not rebuilt between them — the same one is handed a new list — so
  // a second gift would otherwise open on the step the last one ended
  createEffect(() => {
    if (props.gifts.length > 0) {
      setThanked(false);
    }
  });

  const showingCatch = (): boolean => props.gifts.length > 0 && !thanked() && pokemon() != null;
  const showingItems = (): boolean =>
    props.gifts.length > 0 && (thanked() || pokemon() == null) && items().length > 0;

  /**
   * What a screen reader is told the first panel is for. It says in
   * one sentence what the panel says in four lines, since a reader has
   * no sprite to look at
   */
  const summary = (): string => {
    const given = pokemon();

    return given == null
      ? 'Congratulations! Something is waiting for you.'
      : `Congratulations! You received a ${describeGiven(given)}.`;
  };

  /**
   * Done with whichever notice is up. The pokemon hands over to the
   * bag; the bag is the end of it
   */
  const next = (): void => {
    if (showingCatch() && items().length > 0) {
      setThanked(true);
      return;
    }
    props.onClose();
  };

  return (
    <>
      <Dialog
        isOpen={showingCatch()}
        onClose={next}
        title="Mystery Gift"
        terse
        description={summary()}
      >
        <Show when={pokemon()}>
          {(given) => (
            <div class="flex flex-col items-center gap-2 text-center">
              <p class="text-lg font-semibold">Congratulations!</p>
              <SpriteDisplay
                species={given().species}
                shiny={given().shiny}
                animation="Idle"
                direction="DownLeft"
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
            </div>
          )}
        </Show>
        <DialogActions center>
          <Button tone="primary" onClick={next}>
            Thanks
          </Button>
        </DialogActions>
      </Dialog>

      {/* And what came with it, in its own right rather than as a
          footnote under a sprite */}
      <Dialog
        isOpen={showingItems()}
        onClose={props.onClose}
        title="For the road"
        terse
        description="What came with the gift has been put in your bag."
      >
        <div class="flex flex-col items-center gap-2 text-center">
          <ItemStash items={items()} />
          <Meta>It is in your bag.</Meta>
        </div>
        <DialogActions center>
          <Button tone="primary" onClick={props.onClose}>
            Thanks
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
