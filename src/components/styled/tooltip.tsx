import { type JSX, type ParentProps, Show, createSignal } from 'solid-js';
import { Portal, isServer } from 'solid-js/web';

/**
 * What a thing is, said where the pointer already is.
 *
 * An item or an ability is a name and one line about what it does, and
 * the line is the half worth reading — a bag showing thirty pictures
 * says nothing about any of them. The card is small on purpose: it
 * covers whatever it is over, so it should cover as little as it can.
 */

export interface TooltipProps {
  name: string;
  description: string;
  class?: string;
}

/**
 * How wide the card is allowed to be, in pixels. It also decides how
 * far from an edge the card can be placed, so it is a number rather
 * than a class
 */
const WIDTH = 240;

/**
 * How far above the thing it describes the card floats, and how much
 * room it needs up there before it gives up and drops below instead
 */
const GAP = 8;
const ROOM = 160;

function Line(props: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <div class="flex flex-col gap-0.5">
      <span class="text-[10px] font-bold tracking-wide text-muted uppercase">{props.label}</span>
      <span class="rounded-lg border border-line bg-paper px-1.5 py-0.5 text-xs text-ink">
        {props.children}
      </span>
    </div>
  );
}

/**
 * The card on its own, for a caller placing it itself
 */
export function Tooltip(props: TooltipProps): JSX.Element {
  return (
    <div
      role="tooltip"
      style={{ 'max-width': `${WIDTH}px` }}
      class={`flex flex-col gap-1.5 rounded-panel border-2 border-line bg-line-soft p-1.5
        shadow-window ${props.class ?? ''}`}
    >
      <Line label="Name">{props.name}</Line>
      <Line label="Description">{props.description}</Line>
    </div>
  );
}

/**
 * Where the cards are drawn: a container standing after the dialogs'
 * own, so a card over a square inside a dialog is over the dialog
 * rather than under it
 */
function tooltipHost(): HTMLElement | undefined {
  if (isServer) {
    return undefined;
  }
  return document.getElementById('tooltip') ?? undefined;
}

/**
 * Anything else that has to float over a dialog — a card placed by its
 * own caller rather than by `TooltipHost`
 */
export function TooltipLayer(props: ParentProps): JSX.Element {
  return <Portal mount={tooltipHost()}>{props.children}</Portal>;
}

export interface TooltipHostProps extends ParentProps, TooltipProps {
  /**
   * What the wrapper itself is. It has to be a box of its own rather
   * than `display: contents`, since where the card goes is measured
   * from it
   */
  class?: string;
}

/**
 * Something with a card over it while the pointer or the keyboard is
 * on it. The card is portalled out because the things that carry one —
 * a square in the bag, a row in a dialog — sit in panels that scroll
 * and clip
 */
export function TooltipHost(props: TooltipHostProps): JSX.Element {
  let host: HTMLSpanElement | undefined;
  const [at, setAt] = createSignal<{ x: number; y: number; below: boolean } | null>(null);

  const show = (): void => {
    const bounds = host?.getBoundingClientRect();

    if (bounds == null) {
      return;
    }

    const below = bounds.top < ROOM;
    // Kept off both edges, so a square in the first column does not
    // hang the card half off the screen
    const x = Math.min(
      Math.max(bounds.left + bounds.width / 2, WIDTH / 2 + GAP),
      globalThis.innerWidth - WIDTH / 2 - GAP,
    );

    setAt({ x, y: below ? bounds.bottom + GAP : bounds.top - GAP, below });
  };

  const hide = (): void => {
    setAt(null);
  };

  return (
    <span
      ref={host}
      class={props.class ?? 'inline-flex'}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusIn={show}
      onFocusOut={hide}
    >
      {props.children}
      <Show when={at()} keyed>
        {(spot) => (
          <Portal mount={tooltipHost()}>
            <div
              // Nothing to click: the card is a label, and a pointer
              // that landed on it would leave whatever it describes
              class={`pointer-events-none fixed z-50 -translate-x-1/2 ${
                spot.below ? '' : '-translate-y-full'
              }`}
              style={{ left: `${spot.x}px`, top: `${spot.y}px` }}
            >
              <Tooltip name={props.name} description={props.description} />
            </div>
          </Portal>
        )}
      </Show>
    </span>
  );
}
