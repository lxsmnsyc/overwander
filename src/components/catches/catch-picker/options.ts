import type { JSX } from 'solid-js';
import type { CaughtPokemon } from '../../../auth/caught';

/**
 * One of the player's pokemon, with the one thing a caller cannot read
 * off the record itself: whether it is in a battle right now. That
 * needs the server's clock, which the picker reads once for the whole
 * list rather than making every caller do it
 */
export interface CatchOption {
  id: string;
  caught: CaughtPokemon;
  fighting: boolean;
}

interface CatchPickerCommonProps {
  /**
   * Whose pokemon. Defaults to the signed-in player
   */
  player?: string;
  title?: string;
  /**
   * What the caller is asking for, in a sentence. The picker says
   * something sensible about how many it wants if the caller does not
   */
  description?: string;
  label?: string;
  /**
   * What a row's button says it will do. The pokemon follows it
   */
  verb?: string;
  empty?: string;
  /**
   * Ask once more before handing the pick back
   */
  confirm?: boolean;
  /**
   * Whether the list is showing but not taking picks — a catch in a
   * live battle, say, where every row is refused for the same reason
   */
  disabled?: boolean;
  /**
   * Whether the box belongs to somebody else.
   *
   * It is not `disabled`: the squares still answer a press, because
   * looking at one of a stranger's pokemon is the whole reason their
   * box is on screen. What goes is everything that would *take* one —
   * the confirm, the "Pick none", the second press that asks whether
   * you meant it — since none of them is a question about a
   * collection that is not yours
   */
  viewOnly?: boolean;
  /**
   * Render the list on its own, with no dialog and no button to open
   * one
   */
  inline?: boolean;
  open?: boolean;
  onClose?: () => void;
  /**
   * Which pokemon the caller can accept at all. Anything else is left
   * out of the list
   */
  filter?: (option: CatchOption) => boolean;
  /**
   * Why a pokemon that *is* in the list cannot be picked — "in a
   * raid", "fainted". A row with a reason is shown, said, and
   * disabled, so a player counting their party knows where one went
   * instead of finding it missing
   */
  reason?: (option: CatchOption) => string | null;
  /**
   * Something worth saying about a row that does not stop it being
   * picked — what a fee would buy this particular egg, say
   */
  note?: (option: CatchOption) => string | null;
  /**
   * The records, already in hand. A caller showing two pickers over
   * one set of catches reads them once and passes them to both
   */
  options?: CatchOption[];
  /**
   * Changing this re-reads the records
   */
  revision?: unknown;
  /**
   * The query, for a caller that holds it itself. A screen that swaps
   * one shape of picker for another — browsing for selecting — would
   * otherwise throw away whatever the player had typed, since the two
   * are different components. Pass both or neither
   */
  search?: string;
  onSearch?: (typed: string) => void;
  /**
   * What stands beside the box's search: the button that turns picking
   * on, for a caller whose box is both things at once
   */
  aside?: () => JSX.Element;
  /**
   * Every pokemon the picker is offering, as it changes.
   *
   * A caller holding its own picks holds ids, and an id says nothing
   * about whether the pokemon behind it is a favorite or in a battle.
   * This is how it gets the records back without reading them a second
   * time
   */
  onOptions?: (offered: CatchOption[]) => void;
}

export type CatchPickerProps = CatchPickerCommonProps &
  (
    | {
        multiple?: false;
        value: string | null;
        onPick: (caught: string | null) => void;
        max?: undefined;
      }
    | {
        multiple: true;
        value: string[];
        onPick: (caught: string[]) => void;
        /**
         * How many may be picked at once — a party of six, a pair of
         * parents. Rows stop taking picks once it is reached
         */
        max?: number;
        /**
         * Report every press rather than waiting to be confirmed, and
         * draw no confirm button.
         *
         * It is for a caller that already has a button of its own —
         * the breeder's "Breed", the nurse's "Hand over" — where the
         * picker's own confirm was a second button next to it saying
         * very nearly the same thing. The caller holds the picks and
         * decides what they are worth
         */
        live?: boolean;
      }
  );
