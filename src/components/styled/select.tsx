import { For, type JSX, Show, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from 'terracotta';
import { FieldFrame } from './form';
import { SHEER } from './transition';
import dismissOutside from './dismiss';
import useDropdown from './dropdown';
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
  /** A colour drawn as a swatch before the label, for choices that are told apart by one */
  tone?: string;
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
  /** Drawn before the label while the chosen option has no swatch of its own */
  icon?: JSX.Element;
  /**
   * Drawn in the accent colour, for a control that decides what the
   * whole screen under it shows rather than one field of a form
   */
  accent?: boolean;
}

/** The small square of colour an option carries */
function Swatch(props: { tone: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="size-2.5 shrink-0 rounded-[3px]"
      style={{ background: props.tone }}
    />
  );
}

const BUTTON =
  'inline-flex w-full items-center justify-between gap-2 rounded-xl border-2 border-line' +
  ' bg-paper px-3 py-1 text-left text-sm font-bold shadow-pop-sm transition-colors' +
  ' hover:border-tide hover:text-tide-dark focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide aria-disabled:cursor-not-allowed' +
  ' aria-disabled:bg-line-soft aria-disabled:text-muted aria-disabled:hover:border-line';

/** The accented look, laid over the ordinary one */
const ACCENT = 'border-tide bg-tide-soft font-black';

const OPTION =
  'flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors' +
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
   * Where the list hangs, kept on screen as the page moves under it.
   * Drawn in place, a list near the foot of a dialog was cut off by the
   * panel and hidden behind its dock
   */
  const floating = useDropdown({ open, placement: 'bottom-start', matchWidth: true });

  dismissOutside(
    root,
    open,
    () => {
      setOpen(false);
    },
    panel,
  );

  /** What is chosen, if anything is */
  const chosen = (): SelectOption<V> | undefined => {
    for (const option of props.options) {
      if (option.value === props.value) {
        return option;
      }
    }
    return undefined;
  };
  /** The name of what is chosen, or the placeholder standing in for it */
  const showing = (): string => chosen()?.label ?? props.placeholder ?? 'Choose…';

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
            floating.refs.setReference(element);
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
            class={`${BUTTON} ${props.accent === true ? ACCENT : ''} ${
              props.error == null ? '' : 'border-ember'
            } ${props.value == null ? 'text-muted' : ''}`}
          >
            <span class="flex min-w-0 items-center gap-2">
              <Show when={chosen()?.tone} fallback={props.icon}>
                {(tone) => <Swatch tone={tone()} />}
              </Show>
              <span class="truncate">{showing()}</span>
            </span>
            <span aria-hidden="true">▾</span>
          </ListboxButton>
          <Portal mount={host()}>
            {/* Placed by the outer box and faded by the inner one, so the
                fade never fights the placement over the transform */}
            <div
              ref={(element) => {
                setPanel(element);
                floating.refs.setFloating(element);
              }}
              class="z-40 flex"
              style={{
                ...floating.floatingStyles,
                visibility: floating.isPositioned ? 'visible' : 'hidden',
              }}
            >
              <Transition show={open()} {...SHEER} class="flex w-full">
                <ListboxOptions
                  unmount={false}
                  class="flex max-h-[min(16rem,var(--drop-room,16rem))] w-full list-none flex-col
                gap-0.5 overflow-y-auto rounded-xl border-2 border-line bg-paper p-1 shadow-float"
                >
                  <For each={props.options}>
                    {(option) => (
                      <ListboxOption class={OPTION} value={option.value} disabled={option.disabled}>
                        <Show when={option.tone}>{(tone) => <Swatch tone={tone()} />}</Show>
                        {option.label}
                      </ListboxOption>
                    )}
                  </For>
                  <Show when={props.options.length === 0}>
                    <li class="px-2 py-1 text-sm text-muted">Nothing to choose from.</li>
                  </Show>
                </ListboxOptions>
              </Transition>
            </div>
          </Portal>
        </Listbox>
      )}
    </FieldFrame>
  );
}
