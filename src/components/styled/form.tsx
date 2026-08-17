import { type JSX, type ParentProps, Show, createUniqueId } from 'solid-js';

/**
 * The furniture a form is built out of: what wraps one control, and
 * what arranges a page of them.
 *
 * A dashboard is mostly forms, and a form is mostly repetition — the
 * same word above the same box with the same line of help under it. It
 * is written once here so a screen says what it is asking for and
 * nothing about how the asking is laid out.
 */

/**
 * What a field passes down to whatever it wraps: the id the label
 * points at, and the id of the line under it. Both belong on the
 * control, which is the only thing that can carry them
 */
export interface FieldParts {
  id: string;
  describedBy: string | undefined;
}

export interface FieldFrameProps {
  label: string;
  /**
   * A line under the control saying what the value is for. It is
   * replaced by `error` rather than joined to it: somebody being told
   * what is wrong is not also reading the instructions
   */
  hint?: string;
  error?: string;
  /**
   * Whether the form refuses to go without it. The control is marked
   * `aria-required` by whatever uses this; the star is the visible half
   */
  required?: boolean;
  class?: string;
  children: (parts: FieldParts) => JSX.Element;
}

/**
 * One labelled control, with its help or its complaint under it. The
 * label points at the control by id rather than wrapping it, since a
 * listbox or a group of radios is several elements and a label can
 * only wrap one
 */
export function FieldFrame(props: FieldFrameProps): JSX.Element {
  const id = createUniqueId();
  const noteId = createUniqueId();
  const note = (): string | undefined => props.error ?? props.hint;

  return (
    <div class={`flex flex-col gap-1 ${props.class ?? ''}`}>
      <label for={id} class="text-sm font-semibold text-muted">
        {props.label}
        <Show when={props.required}>
          <span aria-hidden="true" class="text-ember">
            {' '}
            *
          </span>
        </Show>
      </label>
      {props.children({ id, describedBy: note() == null ? undefined : noteId })}
      <Show when={note()}>
        {(said) => (
          <span
            id={noteId}
            // Announced when it changes rather than given `role=alert`:
            // the base layer draws that role as a panel, and a
            // complaint about one field is a line under it
            aria-live={props.error == null ? undefined : 'polite'}
            class={`text-xs ${props.error == null ? 'text-muted' : 'font-semibold text-ember-dark'}`}
          >
            {said()}
          </span>
        )}
      </Show>
    </div>
  );
}

export interface FormSectionProps extends ParentProps {
  title: string;
  /** What this run of fields is for, and what saving it costs */
  lede?: string;
  class?: string;
}

/**
 * A run of fields under a heading. A settings page is three or four of
 * these rather than one column of thirty boxes
 */
export function FormSection(props: FormSectionProps): JSX.Element {
  return (
    <section
      class={`flex flex-col gap-3 rounded-panel border-2 border-line bg-paper p-3 shadow-pop
        sm:p-4 ${props.class ?? ''}`}
    >
      <header class="flex flex-col gap-1 border-b-2 border-line-soft pb-2">
        <h3>{props.title}</h3>
        <Show when={props.lede}>
          {(said) => <p class="max-w-prose text-sm text-muted">{said()}</p>}
        </Show>
      </header>
      {props.children}
    </section>
  );
}

/**
 * Fields side by side where they fit and stacked where they do not.
 * Two is the useful width: a name and a code, a from and a to
 */
export function FormGrid(props: ParentProps<{ columns?: 1 | 2; class?: string }>): JSX.Element {
  return (
    <div class={`grid gap-3 ${props.columns === 1 ? '' : 'sm:grid-cols-2'} ${props.class ?? ''}`}>
      {props.children}
    </div>
  );
}

/**
 * The row a form ends on. What saves it goes last, where the eye
 * finishes, and anything said about the save stands to the left
 */
export function FormActions(
  props: ParentProps<{ note?: JSX.Element; class?: string }>,
): JSX.Element {
  return (
    <div
      class={`flex flex-wrap items-center justify-end gap-2 border-t-2 border-line-soft pt-3
        ${props.class ?? ''}`}
    >
      <Show when={props.note}>
        {(said) => <div class="mr-auto text-sm text-muted">{said()}</div>}
      </Show>
      {props.children}
    </div>
  );
}
