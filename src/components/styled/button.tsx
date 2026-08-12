import type { JSX, ParentProps } from 'solid-js';
import { Button as HeadlessButton } from 'terracotta';

/**
 * The game's button.
 *
 * A button says one of three things by how it looks: this is what the
 * screen is offering, this is a way out of it, or this cannot be taken
 * back. Releasing a pokemon and closing a dialog are both a press, and
 * the difference between them should not be something a player has to
 * read the label carefully to notice.
 *
 * The behaviour is terracotta's, the same as everything else here: it
 * keeps `tabindex` and `aria-disabled` in step with `disabled`, and
 * makes Enter and Space press a button that is not a `<button>` — so a
 * button rendered as something else stays a button to a keyboard.
 */
export type ButtonTone = 'primary' | 'ghost' | 'danger';

const TONES: Record<ButtonTone, string> = {
  primary: 'border-leaf-dark bg-leaf text-paper hover:bg-leaf-dark hover:text-paper',
  ghost: 'border-line bg-paper text-ink hover:border-leaf hover:text-leaf-dark',
  danger: 'border-ember-dark bg-ember text-paper hover:bg-ember-dark hover:text-paper',
};

/**
 * A button that cannot be pressed says so plainly rather than wearing
 * its tone at half strength: a greyed-out green button still reads as
 * the thing to press
 */
const DISABLED = 'cursor-default border-line bg-line-soft text-muted hover:border-line';

const BASE =
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium' +
  ' transition-colors focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-leaf';

export interface ButtonProps extends ParentProps {
  onClick?: () => void;
  disabled?: boolean;
  tone?: ButtonTone;
  /**
   * Submit only where a form means it — everything else is a plain
   * button, since a stray submit reloads the page out from under the
   * game
   */
  type?: 'button' | 'submit';
  /**
   * Room for what the button is used for rather than what it is: how
   * wide it sits, where it lines up
   */
  class?: string;
  /**
   * What hovering it says. It is for the reason behind a button rather
   * than for the button itself — why this one cannot be pressed — so a
   * label stays short without the answer going missing
   */
  title?: string;
}

export default function Button(props: ButtonProps): JSX.Element {
  const look = (): string => (props.disabled === true ? DISABLED : TONES[props.tone ?? 'ghost']);

  return (
    <HeadlessButton
      // A `<button>` in a form submits it unless told otherwise, and
      // most of these sit in one without meaning to
      type={props.type ?? 'button'}
      disabled={props.disabled}
      title={props.title}
      class={`${BASE} ${look()} ${props.class ?? ''}`}
      onClick={() => {
        props.onClick?.();
      }}
    >
      {props.children}
    </HeadlessButton>
  );
}
