import type { JSX } from 'solid-js';
import { FieldFrame } from './form';

/**
 * The same field for something longer than a line — a note on an
 * account, the body of an announcement.
 *
 * How tall it opens is the caller's, because a box that is one line
 * tall invites one line: the height is the game asking for a sentence
 * or a paragraph.
 */

export interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  class?: string;
}

const WRONG = 'border-ember focus-visible:border-ember focus-visible:outline-ember';

export default function TextArea(props: TextAreaProps): JSX.Element {
  return (
    <FieldFrame
      label={props.label}
      hint={props.hint}
      error={props.error}
      required={props.required}
      class={props.class}
    >
      {(parts) => (
        <textarea
          id={parts.id}
          rows={props.rows ?? 3}
          value={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          aria-describedby={parts.describedBy}
          aria-invalid={props.error == null ? undefined : true}
          aria-required={props.required}
          class={`w-full resize-y ${props.error == null ? '' : WRONG}`}
          onInput={(event) => {
            props.onChange(event.currentTarget.value);
          }}
        />
      )}
    </FieldFrame>
  );
}
