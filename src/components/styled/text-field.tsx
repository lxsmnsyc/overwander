import type { JSX } from 'solid-js';
import { FieldFrame } from './form';

/**
 * A box to type in, with the word for it above and its help below.
 *
 * The box itself is dressed by the base layer, so what is added here is
 * the wiring a form needs: the label pointing at the control, the note
 * announced with it, and the red edge that says which field the
 * complaint is about.
 */

/**
 * What kind of thing is being typed. It decides the keyboard a phone
 * offers and what the browser fills in, so it is worth saying even
 * where the field looks the same
 */
export type TextFieldKind = 'text' | 'email' | 'password' | 'url' | 'search' | 'number' | 'date';

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind?: TextFieldKind;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /**
   * The range a number may be typed in. It is the browser's own
   * check — the arrows stop at it and a typed value outside it is
   * refused — for a field whose limits are worth showing rather than
   * explaining
   */
  min?: number;
  max?: number;
  /** What the browser may fill in — `off` for anything account-specific */
  autocomplete?: string;
  /**
   * What Enter does, for a field whose value is submitted rather than
   * merely typed. Leaving it out is right for a field inside a form —
   * the form's own submit already answers Enter
   */
  onEnter?: () => void;
  class?: string;
}

/** The edge, which is the only part of a field that shows a complaint */
const WRONG = 'border-ember focus-visible:border-ember focus-visible:outline-ember';

export default function TextField(props: TextFieldProps): JSX.Element {
  return (
    <FieldFrame
      label={props.label}
      hint={props.hint}
      error={props.error}
      required={props.required}
      class={props.class}
    >
      {(parts) => (
        <input
          id={parts.id}
          type={props.kind ?? 'text'}
          value={props.value}
          placeholder={props.placeholder}
          min={props.min}
          max={props.max}
          disabled={props.disabled}
          autocomplete={props.autocomplete}
          aria-describedby={parts.describedBy}
          aria-invalid={props.error == null ? undefined : true}
          aria-required={props.required}
          class={`w-full ${props.error == null ? '' : WRONG}`}
          onInput={(event) => {
            props.onChange(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              props.onEnter?.();
            }
          }}
        />
      )}
    </FieldFrame>
  );
}
