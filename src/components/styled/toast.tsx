import {
  type Accessor,
  For,
  type JSX,
  type ParentProps,
  Show,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import { m } from '../../i18n/paraglide/messages.js';
import { rootPortalHost } from './portal-host';

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
 * How wide one is allowed to get. A line apiece, in a column across
 * the top of the screen, so a stack of three still leaves the board
 * under it readable
 */
const WIDTH = 'w-[min(88vw,20rem)]';

/**
 * How long the departure takes: `--motion-base-exit`, 70% of the
 * arrival. It is waited out before the card is dropped, so a toast that
 * goes on its own goes the same way as one that is pressed
 */
const LEAVING = 168;

export type ToastTone = 'neutral' | 'leaf' | 'ember' | 'gold' | 'arcane';

const TONES: Record<ToastTone, string> = {
  neutral: 'border-tide bg-paper',
  leaf: 'border-leaf bg-leaf-soft',
  ember: 'border-ember bg-ember-soft',
  gold: 'border-gold bg-gold-soft',
  arcane: 'border-arcane bg-arcane-soft',
};

/** The lifetime bar, in the toast's own colour */
const LIFE_TONES: Record<ToastTone, string> = {
  neutral: 'bg-tide',
  leaf: 'bg-leaf',
  ember: 'bg-ember',
  gold: 'bg-gold',
  arcane: 'bg-arcane',
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
   * A picture of whatever is being reported, beside the words. It is
   * how a stash of items is shown rather than listed.
   *
   * Written as a function, and it has to be: a toast is pushed from a
   * handler or a promise, where there is no owner to build markup
   * under. Markup made there keeps whatever computations its
   * components create for the life of the page, and Solid says so.
   * Called here, it is built under the card that draws it
   */
  art?: () => JSX.Element;
  tone?: ToastTone;
  /**
   * How long it stays, in milliseconds
   */
  duration?: number;
}

interface Toast extends ToastRequest {
  id: number;
  /** On its way out, and drawn for `LEAVING` longer because of it */
  leaving?: boolean;
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

interface ToastCardProps {
  toast: Toast;
  /** Whether the pointer is resting on it, which stops its clock */
  paused: boolean;
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
}

function ToastCard(props: ToastCardProps): JSX.Element {
  const life = (): number => props.toast.duration ?? LIFETIME;

  return (
    <li
      // Announced rather than read out on arrival: a toast is
      // something that happened, not something being asked
      role="status"
      // One line, read left to right: what it is, what it says, and
      // the way to be rid of it. A cache paying three kinds of thing
      // is three of these rather than one card with a gallery in it
      class={`motion-crossfade pointer-events-auto relative flex ${WIDTH} shrink-0 items-center
        gap-2 overflow-hidden rounded-card border-2 px-2 pt-1.5 pb-2.5 text-left shadow-float
        ${TONES[props.toast.tone ?? 'neutral']}`}
      // It drops in on a spring and goes back up on the exit curve
      style={{
        animation:
          props.toast.leaving === true
            ? 'toast-out var(--motion-base-exit) var(--ease-exit) both'
            : 'toast-in var(--motion-base) var(--ease-spring) both',
      }}
      onPointerEnter={() => {
        props.onPause();
      }}
      onPointerLeave={() => {
        props.onResume();
      }}
    >
      <Show when={props.toast.art != null}>
        <div class="flex shrink-0 items-center justify-center">{props.toast.art?.()}</div>
      </Show>
      <div class="flex min-w-0 grow flex-col">
        <Show when={props.toast.title}>
          {(title) => (
            <strong class="truncate font-display text-sm font-semibold">{title()}</strong>
          )}
        </Show>
        <Show when={props.toast.message}>{(said) => <span class="text-sm">{said()}</span>}</Show>
      </div>
      {/* Nothing has to be pressed — it goes on its own — but a player
          who has read it should not have to wait for it */}
      <button
        type="button"
        aria-label={m.ui_dismiss()}
        class="shrink-0 rounded-full border-0 bg-transparent px-1.5 py-0 leading-none text-muted
          shadow-none hover:border-0 hover:text-ember active:translate-y-0"
        onClick={props.onClose}
      >
        ×
      </button>
      {/* How long it has left, emptying as it goes and holding while the
          pointer rests on the card */}
      <span
        aria-hidden="true"
        class={`motion-timer absolute inset-x-0 bottom-0 h-1 origin-left
          ${LIFE_TONES[props.toast.tone ?? 'neutral']}`}
        style={{
          '--motion-timer': `${life()}ms`,
          animation: `toast-life ${life()}ms linear both`,
          'animation-play-state': props.paused ? 'paused' : 'running',
        }}
      />
    </li>
  );
}

export default function ToastProvider(props: ParentProps): JSX.Element {
  const [toasts, setToasts] = createSignal<Toast[]>([]);
  /**
   * The container the toasts are drawn in, once the app has drawn it.
   * It is the last thing in the app and this is among the first, so
   * there is nothing to portal into while this is rendering
   */
  const [host, setHost] = createSignal<HTMLElement>();

  onMount(() => {
    setHost(rootPortalHost());
  });
  /**
   * The timers still to fire, so a toast dismissed by hand does not
   * leave one running and a provider going away takes them all with it
   */
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  /** When each running timer fires, so a pause knows how long was left */
  const due = new Map<number, number>();
  /** How long each paused toast had left when the pointer arrived */
  const left = new Map<number, number>();
  /** The toasts the pointer is resting on */
  const [paused, setPaused] = createSignal<ReadonlySet<number>>(new Set());
  let next = 0;

  /** Off the screen for good, timers and all */
  const drop = (id: number): void => {
    const timer = timers.get(id);

    if (timer != null) {
      clearTimeout(timer);
      timers.delete(id);
    }
    due.delete(id);
    left.delete(id);
    setPaused((now) => {
      if (!now.has(id)) {
        return now;
      }
      const kept = new Set(now);

      kept.delete(id);
      return kept;
    });
    setToasts((shown) => {
      const kept: typeof shown = [];

      for (const toast of shown) {
        if (toast.id !== id) {
          kept.push(toast);
        }
      }
      return kept;
    });
  };

  /**
   * Marked as leaving and dropped once it has finished going. A second
   * dismissal while it is on its way out is nothing to answer: it is
   * already going
   */
  const dismiss = (id: number): void => {
    let going: ReturnType<typeof toasts>[number] | undefined;

    for (const toast of toasts()) {
      if (toast.id === id) {
        going = toast;
        break;
      }
    }

    // Asked twice is nothing to answer: the timer already running is
    // the one that drops it
    if (going == null || going.leaving === true) {
      return;
    }
    const timer = timers.get(id);

    if (timer != null) {
      clearTimeout(timer);
    }
    // A paused toast pressed shut has no clock to stop, only its pause
    due.delete(id);
    left.delete(id);
    setToasts((shown) => {
      const marked: typeof shown = [];

      for (const toast of shown) {
        marked.push(toast.id === id ? { ...toast, leaving: true } : toast);
      }
      return marked;
    });
    timers.set(
      id,
      setTimeout(() => {
        drop(id);
      }, LEAVING),
    );
  };

  /** Send it on its way in `wait` milliseconds */
  const schedule = (id: number, wait: number): void => {
    timers.set(
      id,
      setTimeout(() => {
        dismiss(id);
      }, wait),
    );
    due.set(id, Date.now() + wait);
  };

  /** Stop its clock while the pointer rests on it */
  const pause = (id: number): void => {
    const when = due.get(id);
    const timer = timers.get(id);

    if (when == null || timer == null) {
      return;
    }
    clearTimeout(timer);
    timers.delete(id);
    due.delete(id);
    left.set(id, Math.max(0, when - Date.now()));
    setPaused((now) => new Set(now).add(id));
  };

  /** And start it again with what it had left */
  const resume = (id: number): void => {
    const wait = left.get(id);

    if (wait == null) {
      return;
    }
    left.delete(id);
    setPaused((now) => {
      const kept = new Set(now);

      kept.delete(id);
      return kept;
    });
    schedule(id, wait);
  };

  const push = (toast: ToastRequest): number => {
    next += 1;

    const id = next;

    setToasts((shown) => [...shown, { ...toast, id }]);
    // Anything past the stack is sent on its way rather than cut, so
    // the oldest leaves the way everything else does
    const staying: ReturnType<typeof toasts> = [];

    for (const one of toasts()) {
      if (one.leaving !== true) {
        staying.push(one);
      }
    }
    for (const older of staying.slice(0, -STACK)) {
      dismiss(older.id);
    }
    schedule(id, toast.duration ?? LIFETIME);
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
      {/* Drawn in the app's own container rather than in whichever
          dialog is open, so a toast is over the top of one rather than
          under it: what the game just did is worth reading whatever
          else is open.

          Waited for rather than asked for while this renders: the
          container is the last thing the app draws, and the toasts are
          among the first */}
      <Show when={host()}>
        {(where) => (
          <Portal mount={where()}>
            {/* A column across the **top centre**, over everything and not
            in the way of a press: only the toasts themselves take the
            pointer.

            Reversed, so the newest is the one against the top edge and
            the older ones are pushed down under it. The player is
            looking at the middle of the board, which is what puts them
            there rather than in a corner */}
            <ul
              class="pointer-events-none fixed top-3 left-1/2 z-[100] m-0 flex -translate-x-1/2
            list-none flex-col-reverse items-center gap-2 p-0"
            >
              <For each={toasts()}>
                {(toast) => (
                  <ToastCard
                    toast={toast}
                    paused={paused().has(toast.id)}
                    onClose={() => {
                      dismiss(toast.id);
                    }}
                    onPause={() => {
                      if (toast.leaving !== true) {
                        pause(toast.id);
                      }
                    }}
                    onResume={() => {
                      resume(toast.id);
                    }}
                  />
                )}
              </For>
            </ul>
          </Portal>
        )}
      </Show>
    </ToastContext.Provider>
  );
}
