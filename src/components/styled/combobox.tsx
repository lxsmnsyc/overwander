import { For, type JSX, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  AutocompleteStateChild,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  DisclosureStateChild,
  Combobox as HeadlessCombobox,
  Transition,
} from 'terracotta';
import { SHEER } from './transition';
import { Badge } from './feedback';
import { FieldFrame } from './form';
import dismissOutside from './dismiss';
import { usePortalHost } from './portal-host';

/**
 * A choice out of a list nobody would scroll: a species, an account, an
 * item. Typing narrows it and the arrow keys pick from what is left.
 * Reach for this over `Select` by the length of the list, not the kind
 * of value.
 *
 * Terracotta owns the narrowing and the opening; `matchBy` is the only
 * part written here.
 *
 * Asked for `multiple`, what is picked stands over the box as badges
 * rather than as text in it, since a box holding four names has no
 * room left to type in
 */

export interface ComboboxOptionData<V> {
  value: V;
  label: string;
  disabled?: boolean;
}

interface ComboboxBaseProps<V> {
  label: string;
  options: ComboboxOptionData<V>[];
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}

export interface SingleComboboxProps<V> extends ComboboxBaseProps<V> {
  multiple?: false;
  /** What is chosen, or null while nothing is */
  value: V | null;
  onChange: (value: V) => void;
}

export interface MultipleComboboxProps<V> extends ComboboxBaseProps<V> {
  multiple: true;
  /** Everything chosen, in the order it was picked */
  value: V[];
  /** The whole list as it now stands, rather than what changed */
  onChange: (values: V[]) => void;
  /**
   * How many it will hold — four moves, two abilities. A full box
   * refuses anything new and says so by greying what is left, rather
   * than quietly dropping the oldest pick: what somebody chose is not
   * the box's to take back
   */
  limit?: number;
}

export type ComboboxProps<V> = MultipleComboboxProps<V> | SingleComboboxProps<V>;

/**
 * A row of the list. Every option is drawn and terracotta marks each
 * one — picked, under the keyboard, still matching the query — so the
 * whole of the narrowing is the last line: an option the query left
 * behind takes up no room rather than being drawn empty
 */
const OPTION =
  'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors' +
  ' hover:bg-tide-soft aria-selected:bg-tide aria-selected:text-on-accent' +
  ' aria-selected:hover:bg-tide-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' [&[tc-active]]:bg-tide-soft [&[tc-active]]:text-tide-dark' +
  ' [&:not([tc-matches])]:hidden';

/**
 * The cross on a badge: a round button of a fixed size with the mark
 * drawn inside it. Flat and small, since the badge around it is the
 * thing on the screen and a chunky button inside one reads as a
 * second control
 */
const DROP =
  'inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0' +
  // A ground of its own at rest, or the round shape only appears
  // under the pointer and the cross reads as loose punctuation
  ' bg-paper p-0 text-tide-dark shadow-none transition-colors hover:border-0 hover:bg-tide' +
  ' hover:text-on-accent active:translate-y-0 focus-visible:outline-2' +
  ' focus-visible:outline-offset-1 focus-visible:outline-tide disabled:cursor-not-allowed';

/** The gap between the box and the list under it, in pixels */
const DROP_GAP = 6;

export default function Combobox<V>(props: ComboboxProps<V>): JSX.Element {
  /** The whole control, for working out what is a press away from it */
  const [root, setRoot] = createSignal<HTMLElement>();
  /**
   * The list is drawn in the nearest dialog's own container rather than
   * inside the field: a combobox in a panel that scrolls or clips had
   * its list cut off at the edge of whatever box it was written in
   */
  const host = usePortalHost();
  const [panel, setPanel] = createSignal<HTMLElement>();
  const [spot, setSpot] = createSignal<{ left: number; top: number; width: number } | null>(null);

  const named = (value: V | null): string =>
    props.options.find((option) => option.value === value)?.label ?? '';

  /** Everything picked, whichever mode this is in */
  const picked = (): V[] => {
    if (props.multiple === true) {
      return props.value;
    }
    return props.value == null ? [] : [props.value];
  };

  /** What is in the box, for the membership the list asks per option */
  const chosen = createMemo(() => new Set(picked()));

  /** Whether the box will hold nothing more */
  const full = (): boolean =>
    props.multiple === true && props.limit != null && props.value.length >= props.limit;

  const matchBy = (value: V, query: string): boolean =>
    named(value).toLowerCase().includes(query.trim().toLowerCase());

  const box = (parts: { id: string; describedBy: string | undefined }): JSX.Element => (
    <ComboboxInput
      id={parts.id}
      // Taking several, the box stays a search box: the names are in
      // the badges over it, and one of them repeated inside would be
      // the value said twice
      value={props.multiple === true ? undefined : named(props.value)}
      placeholder={props.placeholder ?? 'Search…'}
      disabled={props.disabled}
      aria-describedby={parts.describedBy}
      aria-invalid={props.error == null ? undefined : true}
      aria-required={props.required}
      class={`w-full ${props.error == null ? '' : 'border-ember'}`}
    />
  );

  /** The list, which is the same either way the box is being used */
  const list = (): JSX.Element => (
    <DisclosureStateChild>
      {(disclosure) => {
        // Terracotta shuts it on Escape and on the focus leaving; this
        // is the press on ground that takes no focus, which moves none.
        // The list is drawn elsewhere, so it is named as inside too
        dismissOutside(root, disclosure.isOpen, disclosure.close, panel);

        // Placed under the box while it is open, and again whenever
        // the page moves under it: a field in a dialog scrolls
        createEffect(() => {
          const anchor = root();

          if (!disclosure.isOpen() || anchor == null) {
            return;
          }

          const put = (): void => {
            const rect = anchor.getBoundingClientRect();

            setSpot({ left: rect.left, top: rect.bottom + DROP_GAP, width: rect.width });
          };

          put();
          // Captured, so a scroll inside a dialog counts as well as
          // the window's own
          window.addEventListener('scroll', put, true);
          window.addEventListener('resize', put);
          onCleanup(() => {
            window.removeEventListener('scroll', put, true);
            window.removeEventListener('resize', put);
          });
        });

        return (
          <Portal mount={host()}>
            <Transition
              ref={(element: HTMLElement) => {
                setPanel(element);
              }}
              show={disclosure.isOpen()}
              {...SHEER}
              class="fixed z-40"
              style={{
                left: `${spot()?.left ?? 0}px`,
                top: `${spot()?.top ?? 0}px`,
                width: `${spot()?.width ?? 0}px`,
              }}
            >
              <ComboboxOptions
                unmount={false}
                class="flex max-h-64 w-full list-none flex-col gap-0.5 overflow-y-auto rounded-xl
                border-2 border-tide bg-paper p-1 shadow-pop"
              >
                <For each={props.options}>
                  {(option) => (
                    <ComboboxOption
                      class={OPTION}
                      value={option.value}
                      // A full box still lets go of what is in it: what
                      // is already picked stays pressable, since
                      // pressing it is how it comes off
                      disabled={option.disabled === true || (full() && !chosen().has(option.value))}
                    >
                      {option.label}
                    </ComboboxOption>
                  )}
                </For>
                {/* Nothing left after the query, which the options
                  cannot say between them: each one only knows about
                  itself */}
                <AutocompleteStateChild>
                  {(state) => (
                    <Show when={props.options.every((option) => !state.matches(option.value))}>
                      <li class="px-2 py-1 text-sm text-muted">Nothing matches that.</li>
                    </Show>
                  )}
                </AutocompleteStateChild>
              </ComboboxOptions>
            </Transition>
          </Portal>
        );
      }}
    </DisclosureStateChild>
  );

  const badges = (many: MultipleComboboxProps<V>): JSX.Element => (
    <Show when={many.value.length > 0}>
      <div class="flex flex-wrap gap-1">
        <For each={many.value}>
          {(value) => (
            <Badge tone="tide" class="py-0.5 pr-1 pl-2 text-xs">
              {named(value)}
              <button
                type="button"
                class={DROP}
                disabled={props.disabled}
                aria-label={`Remove ${named(value)}`}
                onClick={() => {
                  many.onChange(many.value.filter((kept) => kept !== value));
                }}
              >
                {/* Drawn rather than a character: a glyph sits on its
                    own baseline, and no amount of leading puts it in
                    the middle of a circle */}
                <svg viewBox="0 0 10 10" class="size-2.5" aria-hidden="true">
                  <path
                    d="M2.5 2.5l5 5M7.5 2.5l-5 5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </Badge>
          )}
        </For>
      </div>
    </Show>
  );

  return (
    <FieldFrame
      label={props.label}
      hint={props.hint}
      error={props.error}
      required={props.required}
      class={props.class}
    >
      {(parts) => (
        <Show
          when={props.multiple === true ? props : null}
          keyed
          fallback={
            <HeadlessCombobox
              ref={(element: HTMLElement) => {
                setRoot(element);
              }}
              defaultOpen={false}
              disabled={props.disabled}
              value={props.multiple === true ? null : props.value}
              matchBy={(value: V | null, query: string) => value != null && matchBy(value, query)}
              onSelectChange={(value?: V | null) => {
                if (value != null && props.multiple !== true) {
                  props.onChange(value);
                }
              }}
              class="relative"
            >
              {box(parts)}
              {list()}
            </HeadlessCombobox>
          }
        >
          {(many) => (
            <HeadlessCombobox
              ref={(element: HTMLElement) => {
                setRoot(element);
              }}
              multiple
              // Picking what is already picked takes it off again, so
              // the list says the same thing as the badges over it
              toggleable
              defaultOpen={false}
              disabled={props.disabled}
              value={many.value}
              matchBy={matchBy}
              onSelectChange={(values: V[]) => {
                // Terracotta has already added it by the time this is
                // heard, so a pick past the limit is refused here
                if (many.limit == null || values.length <= many.limit) {
                  many.onChange(values);
                }
              }}
              class="relative flex flex-col gap-1.5"
            >
              {badges(many)}
              {box(parts)}
              {list()}
            </HeadlessCombobox>
          )}
        </Show>
      )}
    </FieldFrame>
  );
}
