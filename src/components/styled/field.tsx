import type { JSX, ParentProps } from 'solid-js';

/**
 * A control and the word for it, kept together.
 *
 * The label wraps the control rather than pointing at it by id, which
 * is what makes the word itself clickable and saves every form in the
 * game from inventing unique ids for its inputs.
 */
export interface FieldProps extends ParentProps {
  label: string;
  /**
   * Whether the word sits beside the control or above it. Beside suits
   * a number a sentence is built around — an asking price, a bid —
   * while above suits a form of several fields
   */
  stacked?: boolean;
  class?: string;
}

export default function Field(props: FieldProps): JSX.Element {
  return (
    <label
      class={`${
        props.stacked === true ? 'flex flex-col gap-1' : 'inline-flex items-center gap-2'
      } text-sm ${props.class ?? ''}`}
    >
      <span class="text-muted">{props.label}</span>
      {props.children}
    </label>
  );
}
