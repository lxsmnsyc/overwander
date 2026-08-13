import type { JSX, ParentProps } from 'solid-js';
import { Button as HeadlessButton } from 'terracotta';

/**
 * The game is mostly lists: a bag, a party, an auction board, a lobby.
 * None of them are prose, so none of them are bulleted — each entry is
 * a row you can press, and the row is the thing that is drawn.
 */

export function List(props: ParentProps & { class?: string }): JSX.Element {
  return (
    <ul class={`m-0 flex list-none flex-col gap-2 p-0 ${props.class ?? ''}`}>{props.children}</ul>
  );
}

export interface ListRowProps extends ParentProps {
  /**
   * The row the player has chosen — the catch about to be sold, the
   * item about to be given. It is marked rather than merely remembered,
   * because a picker that forgets to say what is picked is a picker
   * that gets the wrong thing picked
   */
  selected?: boolean;
  class?: string;
}

export function ListRow(props: ListRowProps): JSX.Element {
  return (
    <li
      class={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border-2 px-3 py-2 text-sm
        shadow-pop-sm transition-colors ${
          props.selected === true
            ? 'border-leaf bg-leaf-soft'
            : 'border-line bg-paper hover:border-tide'
        } ${props.class ?? ''}`}
    >
      {props.children}
    </li>
  );
}

export interface RowButtonProps extends ParentProps {
  onClick?: () => void;
  disabled?: boolean;
  /**
   * Whether this row is one of the chosen ones. It is a pressed button
   * rather than a checkbox because that is what it behaves like: the
   * row is the control
   */
  pressed?: boolean;
  class?: string;
}

/**
 * The row itself as the thing you press. It carries no border or fill
 * of its own — the row around it already has both — so a list of
 * things to choose from does not read as a list of buttons
 */
export function RowButton(props: RowButtonProps): JSX.Element {
  return (
    <HeadlessButton
      type="button"
      aria-pressed={props.pressed}
      disabled={props.disabled}
      class={`grow rounded-none border-0 bg-transparent p-0 text-left text-sm font-normal
        shadow-none hover:border-0 hover:text-tide-dark active:translate-y-0
        disabled:bg-transparent disabled:text-muted disabled:line-through ${props.class ?? ''}`}
      onClick={() => {
        props.onClick?.();
      }}
    >
      {props.children}
    </HeadlessButton>
  );
}

/**
 * The quieter half of a row: how far away it is, how long it has left,
 * what it is carrying. It reads second because it is read second
 */
export function Meta(props: ParentProps & { class?: string }): JSX.Element {
  return <span class={`text-xs text-muted ${props.class ?? ''}`}>{props.children}</span>;
}
