import { type JSX, Show } from 'solid-js';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons';

/**
 * The way to the one before, and the one after.
 *
 * Both sheets that show a pokemon in full are one of a run: a catch
 * sheet is one of the player's box and a dex entry is one of a hundred
 * and fifty-one. Closing the sheet, finding the next square and
 * opening it again is three presses to do what one arrow does — and
 * the list behind it scrolls back to the top every time.
 *
 * They live in the panel's **top bar**, either side of its name, where
 * they belong to the sheet rather than to anything on it. A pair of
 * arrows beside the sprite moved with the sprite; these stay put
 * however far the sheet is scrolled.
 */
export interface StepButtonProps {
  label: string;
  /** Which way it goes. An absent handler is an end of the run */
  way: 'previous' | 'next';
  onPress?: () => void;
}

export default function StepButton(props: StepButtonProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      disabled={props.onPress == null}
      // Disabled rather than hidden at the ends of a run: a bar whose
      // buttons come and go moves the heading between them
      // White on the blue bar it stands in, rather than the ink the
      // panel hands anything put beside the heading: that ink is for a
      // button with a fill of its own, and this one has none
      class="flex cursor-pointer items-center gap-1 rounded-lg border-2 border-transparent
        bg-transparent px-2 py-1 text-lg font-bold text-on-accent shadow-none transition-colors
        hover:border-paper/60 hover:bg-paper/15 hover:text-on-accent active:translate-y-0
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper
        disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-transparent
        disabled:hover:bg-transparent"
      onClick={() => {
        props.onPress?.();
      }}
    >
      {/* The arrow alone: the button is named by its label, which is
          what a screen reader is given, and a word beside the arrow
          would be a second heading in the bar */}
      <Show
        when={props.way === 'previous'}
        fallback={<ArrowRightIcon class="size-5" aria-hidden="true" />}
      >
        <ArrowLeftIcon class="size-5" aria-hidden="true" />
      </Show>
    </button>
  );
}
