import type { JSX } from 'solid-js';
import type { DialogWidth } from '../styled';

/**
 * A question the game asks the player, as something that can be
 * awaited: it is opened, it takes the input it was given, and it hands
 * back an answer, or null if the player walked away from it.
 *
 * A form draws only its own content and its dock. The frame around it
 * (the nameplate, the line under it) is whoever opened it: a dialog of
 * its own, or the conversation it is a step of
 */
export interface ActionForm<I, R> {
  /** The heading, when the form is opened on its own */
  title: (input: I) => string;
  /** The line under the heading, when nobody is speaking it instead */
  prompt: (input: I) => string;
  /** The face on the nameplate, when the form is opened on its own */
  lead?: (input: I) => JSX.Element;
  width?: DialogWidth | ((input: I) => DialogWidth);
  /**
   * Whether only the form's own buttons answer it. The overlay and
   * Escape are ignored, for a question with no walking away from it
   */
  insistent?: boolean;
  view: (props: FormProps<I, R>) => JSX.Element;
}

export interface FormProps<I, R> {
  input: I;
  /** The answer, handed to whoever opened the form */
  submit: (result: R) => void;
  /** The way out: whoever opened the form is handed null */
  cancel: () => void;
  /** What the way out says: "Never mind" on its own, "Walk on" to somebody */
  leave: string;
}

/** A form, typed by its input and its answer */
export function defineForm<I, R>(form: ActionForm<I, R>): ActionForm<I, R> {
  return form;
}

/** How wide a form asks to be drawn for this input */
export function widthOf<I>(form: ActionForm<I, unknown>, input: I): DialogWidth | undefined {
  return typeof form.width === 'function' ? form.width(input) : form.width;
}
