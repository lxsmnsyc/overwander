import { For, type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from 'terracotta';
import { FieldFrame } from './form';
import { SHEER } from './transition';
import dismissOutside from './dismiss';
import { usePortalHost } from './portal-host';

/**
 * One choice out of a list that is too long to show at once.
 *
 * `Filter` is the same control put to a different use — it narrows a
 * list that is already on screen and never holds an empty value. This
 * one is a form field: it can start with nothing chosen, it can be
 * refused, and it says so the way the other fields do.
 */

export interface SelectOption<V> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<V> {
  label: string;
  /** What is chosen, or nothing at all until somebody chooses */
  value: V | null;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  /** What the button says while nothing is chosen */
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}

const BUTTON =
  'inline-flex w-full items-center justify-between gap-2 rounded-xl border-2 border-line' +
  ' bg-paper px-3 py-1 text-left text-sm font-bold shadow-pop-sm transition-colors' +
  ' hover:border-tide hover:text-tide-dark focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide aria-disabled:cursor-not-allowed' +
  ' aria-disabled:bg-line-soft aria-disabled:text-muted aria-disabled:hover:border-line';

/** How far below its button the list hangs, the same as the combobox's */
const DROP_GAP = 6;

/** The tallest the list grows before it scrolls, which was `max-h-64` */
const LIST_HEIGHT = 256;

const OPTION =
  'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors' +
  ' hover:bg-tide-soft aria-selected:bg-tide aria-selected:text-on-accent' +
  ' aria-selected:hover:bg-tide-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' aria-disabled:hover:bg-transparent [&[tc-active]]:bg-tide-soft' +
  ' [&[tc-active]]:text-tide-dark';

export default function Select<V>(props: SelectProps<V>): JSX.Element {
  const [open, setOpen] = createSignal(false);
  /** The whole control, for working out what is a press away from it */
  const [root, setRoot] = createSignal<HTMLElement>();
  /** The list, drawn apart from the control so a dialog cannot clip it */
  const [panel, setPanel] = createSignal<HTMLElement>();
  const host = usePortalHost();
  /**
   * Where the list hangs: under the button, or over it when the window
   * has no room below, and never taller than the room it has
   */
  const [spot, setSpot] = createSignal<{
    left: number;
    width: number;
    top: number;
    /** Hung from above the button rather than below it */
    up?: boolean;
    room: number;
  } | null>(null);

  dismissOutside(
    root,
    open,
    () => {
      setOpen(false);
    },
    panel,
  );

  // Placed under the button while it is open, and again whenever the
  // page moves under it. Drawn in place, a list near the foot of a
  // dialog was cut off by the panel and hidden behind its dock
  createEffect(() => {
    const anchor = root();

    if (!open() || anchor == null) {
      return;
    }

    const put = (): void => {
      const rect = anchor.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - DROP_GAP * 2;
      const above = rect.top - DROP_GAP * 2;

      setSpot(
        below >= LIST_HEIGHT || below >= above
          ? { left: rect.left, width: rect.width, top: rect.bottom + DROP_GAP, room: below }
          : { left: rect.left, width: rect.width, top: rect.top - DROP_GAP, room: above, up: true },
      );
    };

    put();
    // Captured, so a scroll inside a dialog counts as well as the window's own
    window.addEventListener('scroll', put, true);
    window.addEventListener('resize', put);
    onCleanup(() => {
      window.removeEventListener('scroll', put, true);
      window.removeEventListener('resize', put);
    });
  });
  /** The name of what is chosen, or the placeholder standing in for it */
  const showing = (): string => {
    for (const option of props.options) {
      if (option.value === props.value) {
        return option.label;
      }
    }
    return props.placeholder ?? 'Choose…';
  };

  return (
    <FieldFrame
      label={props.label}
      hint={props.hint}
      error={props.error}
      required={props.required}
      class={props.class}
    >
      {(parts) => (
        <Listbox
          ref={(element: HTMLElement) => {
            setRoot(element);
          }}
          isOpen={open()}
          onDisclosureChange={(state) => {
            setOpen(state);
          }}
          toggleable={false}
          disabled={props.disabled}
          value={props.value}
          onSelectChange={(value) => {
            if (value != null) {
              props.onChange(value);
            }
          }}
          class="relative"
        >
          <ListboxButton
            // A form does not lose what is being typed into it
            // because somebody opened a dropdown
            type="button"
            id={parts.id}
            aria-describedby={parts.describedBy}
            aria-invalid={props.error == null ? undefined : true}
            aria-required={props.required}
            class={`${BUTTON} ${props.error == null ? '' : 'border-ember'} ${
              props.value == null ? 'text-muted' : ''
            }`}
          >
            {showing()}
            <span aria-hidden="true">▾</span>
          </ListboxButton>
          <Portal mount={host()}>
            <Transition
              ref={(element: HTMLElement) => {
                setPanel(element);
              }}
              show={open()}
              {...SHEER}
              class="fixed z-40"
              style={{
                left: `${spot()?.left ?? 0}px`,
                top: `${spot()?.top ?? 0}px`,
                width: `${spot()?.width ?? 0}px`,
                // Its own height up from the top of the button, whatever that height is
                transform: spot()?.up === true ? 'translateY(-100%)' : undefined,
              }}
            >
              <ListboxOptions
                unmount={false}
                style={{ 'max-height': `${Math.min(LIST_HEIGHT, spot()?.room ?? LIST_HEIGHT)}px` }}
                class="flex w-full list-none flex-col gap-0.5 overflow-y-auto rounded-xl border-2
                border-line bg-paper p-1 shadow-float"
              >
                <For each={props.options}>
                  {(option) => (
                    <ListboxOption class={OPTION} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </ListboxOption>
                  )}
                </For>
                <Show when={props.options.length === 0}>
                  <li class="px-2 py-1 text-sm text-muted">Nothing to choose from.</li>
                </Show>
              </ListboxOptions>
            </Transition>
          </Portal>
        </Listbox>
      )}
    </FieldFrame>
  );
}
