import {
  type Accessor,
  For,
  type JSX,
  type ParentProps,
  Show,
  createContext,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';
import { Portal, isServer } from 'solid-js/web';

/**
 * Something the game did, said in passing.
 *
 * A dialog is a **question**: it takes the screen, traps the keyboard
 * and waits to be answered. Half of what the game had to say was not a
 * question at all — a cache dug up is already in the bag by the time
 * there is anything to report, and a patch picked is picked. Putting
 * those behind a dialog made a player press a button to acknowledge
 * something they could not have refused, and it did it in the middle
 * of a walk.
 *
 * So they are said up here instead: over the top of the world, for a
 * few seconds, and gone. Nothing waits on them and nothing is lost by
 * missing one — what a toast reports has already happened, and the bag
 * is where the proof of it lives.
 */

/**
 * How long one stays up before it goes on its own. Long enough to read
 * a line of text twice, short enough that it is out of the way before
 * a player has walked anywhere
 */
const LIFETIME = 4500;

/**
 * How many are shown at once. A player crossing a chunk full of caches
 * would otherwise paper the screen over; the oldest give way to the
 * newest, which is the ones they have not read yet
 */
const STACK = 3;

/**
 * How wide one is allowed to get. Narrower than it was, because they
 * stand **beside** each other rather than under: a column of them grew
 * down the middle of the screen and covered the thing the player was
 * looking at, which is the one place a passing remark must not be
 */
const WIDTH = 'w-[min(88vw,18rem)]';

export type ToastTone = 'neutral' | 'leaf' | 'ember';

const TONES: Record<ToastTone, string> = {
  neutral: 'border-line bg-paper',
  leaf: 'border-leaf bg-leaf-soft',
  ember: 'border-ember bg-ember-soft',
};

export interface ToastRequest {
  /**
   * What did it — "Item cache", "Berry patch". Left out for anything
   * that is only a sentence
   */
  title?: string;
  /**
   * What happened, in a sentence — where a sentence says anything the
   * picture above it does not. A stash of items drawn out in full
   * needs no line reading "Found 3 × Poke Ball and a Fire Stone"
   * underneath it
   */
  message?: string;
  /**
   * A picture of whatever is being reported, above the words. It is
   * how a stash of items is shown rather than listed
   */
  art?: JSX.Element;
  tone?: ToastTone;
  /**
   * How long it stays, in milliseconds
   */
  duration?: number;
}

interface Toast extends ToastRequest {
  id: number;
}

export interface ToastState {
  /**
   * Say something. Answers the id it was given, which is only of use
   * to a caller that wants to take it back down early
   */
  push: (toast: ToastRequest) => number;
  dismiss: (id: number) => void;
  toasts: Accessor<Toast[]>;
}

const ToastContext = createContext<ToastState>();

export function useToast(): ToastState {
  const state = useContext(ToastContext);

  if (state == null) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return state;
}

/**
 * Where the toasts are drawn: the same container the dialogs are in,
 * so a toast is over the top of one rather than under it. What the
 * game just did is worth reading whatever else is open
 */
function portalHost(): HTMLElement | undefined {
  if (isServer) {
    return undefined;
  }
  return document.getElementById('portals') ?? undefined;
}

function ToastCard(props: { toast: Toast; onClose: () => void }): JSX.Element {
  return (
    <li
      // Announced rather than read out on arrival: a toast is
      // something that happened, not something being asked
      role="status"
      class={`pointer-events-auto relative flex ${WIDTH} shrink-0 flex-col items-center gap-1
        rounded-panel border px-4 py-3 text-center shadow-lg shadow-ink/20
        ${TONES[props.toast.tone ?? 'neutral']}`}
    >
      <Show when={props.toast.art}>
        {(art) => <div class="flex items-center justify-center">{art()}</div>}
      </Show>
      <Show when={props.toast.title}>{(title) => <strong class="text-sm">{title()}</strong>}</Show>
      <Show when={props.toast.message}>{(said) => <span class="text-sm">{said()}</span>}</Show>
      {/* Nothing has to be pressed — it goes on its own — but a player
          who has read it should not have to wait for it */}
      <button
        type="button"
        aria-label="Dismiss"
        class="absolute top-1 right-2 text-muted"
        onClick={props.onClose}
      >
        ×
      </button>
    </li>
  );
}

export default function ToastProvider(props: ParentProps): JSX.Element {
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  /**
   * The timers still to fire, so a toast dismissed by hand does not
   * leave one running and a provider going away takes them all with it
   */
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  let next = 0;

  const dismiss = (id: number): void => {
    const timer = timers.get(id);

    if (timer != null) {
      clearTimeout(timer);
      timers.delete(id);
    }
    setToasts((shown) => shown.filter((toast) => toast.id !== id));
  };

  const push = (toast: ToastRequest): number => {
    next += 1;

    const id = next;

    setToasts((shown) => [...shown, { ...toast, id }].slice(-STACK));
    timers.set(
      id,
      setTimeout(() => {
        dismiss(id);
      }, toast.duration ?? LIFETIME),
    );
    return id;
  };

  onCleanup(() => {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
  });

  return (
    <ToastContext.Provider value={{ push, dismiss, toasts }}>
      {props.children}
      <Portal mount={portalHost()}>
        {/* One band across the top, over everything, and not in the
            way of a press: only the toasts themselves take the
            pointer.

            A **row** rather than a column. Stacked downwards they
            marched into the middle of the screen and sat on top of
            whatever the player was doing — which is the whole problem
            with a notice that nobody asked for. Side by side they stay
            a strip along the edge, and the strip scrolls rather than
            growing when several land at once */}
        <ul
          class="pointer-events-none fixed inset-x-0 top-3 z-[100] m-0 flex list-none flex-row
            flex-nowrap items-start justify-center gap-2 overflow-x-auto p-0 px-3"
        >
          <For each={toasts()}>
            {(toast) => (
              <ToastCard
                toast={toast}
                onClose={() => {
                  dismiss(toast.id);
                }}
              />
            )}
          </For>
        </ul>
      </Portal>
    </ToastContext.Provider>
  );
}
