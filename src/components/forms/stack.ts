import { type Accessor, type JSX, createSignal } from 'solid-js';
import type { DialogWidth } from '../styled';
import { type ActionForm, widthOf } from './form';

/**
 * What one dialog on the stack draws. Every part is a thunk, read
 * under the host, so what a frame shows can change while it is up: a
 * conversation is one frame whose line and body move on step by step
 */
export interface FrameSpec {
  title: () => string;
  line: () => JSX.Element;
  lead?: () => JSX.Element;
  width?: () => DialogWidth | undefined;
  insistent?: () => boolean;
  body: () => JSX.Element;
  /** Escape or the overlay, on a frame that hears them */
  onDismiss: () => void;
}

export interface Frame extends FrameSpec {
  id: number;
  /** False once the frame is answered: it fades, then leaves the stack */
  live: Accessor<boolean>;
}

export interface FrameHandle {
  /** Put the frame away. Closing one twice is nothing */
  close: () => void;
}

const [frames, setFrames] = createSignal<Frame[]>([]);

let next = 0;

export { frames };

/** The frame on top, the only one shown: two modals at once fight for every click */
export function topFrame(list: Frame[]): Frame | undefined {
  for (let at = list.length - 1; at >= 0; at -= 1) {
    if (list[at].live()) {
      return list[at];
    }
  }
  return undefined;
}

/** Off the stack for good, once it has finished fading or was never showing */
export function dropFrame(id: number): void {
  setFrames((list) => {
    const kept: Frame[] = [];

    for (const one of list) {
      if (one.id !== id) {
        kept.push(one);
      }
    }
    return kept;
  });
}

/**
 * Put a dialog on top of everything else open, until it is closed.
 * The frame is built with its own way to close, for its buttons to call
 */
export function openFrame(build: (close: () => void) => FrameSpec): FrameHandle {
  const [live, setLive] = createSignal(true);

  next += 1;

  const id = next;

  const close = (): void => {
    if (!live()) {
      return;
    }
    // One hidden under another has already faded out, so nothing will
    // report its leaving
    const shown = topFrame(frames())?.id === id;

    setLive(false);
    if (!shown) {
      dropFrame(id);
    }
  };

  setFrames((list) => [...list, { ...build(close), id, live }]);

  return { close };
}

/**
 * Ask the player something, from anywhere: the form opens over
 * whatever is up, and the promise settles with the answer, or with
 * null if the player walked away
 */
export async function openForm<I, R>(form: ActionForm<I, R>, input: I): Promise<R | null> {
  return new Promise((resolve) => {
    let answered = false;

    openFrame((close) => {
      const answer = (result: R | null): void => {
        if (answered) {
          return;
        }
        answered = true;
        close();
        resolve(result);
      };

      return {
        title: () => form.title(input),
        line: () => form.prompt(input),
        lead: form.lead == null ? undefined : () => form.lead?.(input),
        width: () => widthOf(form, input),
        insistent: () => form.insistent === true,
        body: () =>
          form.view({
            input,
            submit: answer,
            cancel: () => {
              answer(null);
            },
            leave: 'Never mind',
          }),
        onDismiss: () => {
          answer(null);
        },
      };
    });
  });
}
