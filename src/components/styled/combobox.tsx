import { For, type JSX, Show, createMemo, createSignal } from 'solid-js';
import {
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Combobox as HeadlessCombobox,
  Transition,
} from 'terracotta';
import { SHEER, holdFade } from './transition';
import { Badge } from './feedback';
import { FieldFrame } from './form';
import dismissOutside from './dismiss';

/**
 * A choice out of a list nobody would scroll: a species, an account, an
 * item. The typing narrows it and the arrow keys pick from what is
 * left.
 *
 * The rule for reaching for this over `Select` is the length of the
 * list, not the kind of value: past a screenful, reading is slower than
 * typing three letters.
 *
 * Asked for `multiple`, it takes any number of them. What is picked
 * stands over the box as a row of badges rather than as text in it —
 * a box holding four names has no room left to type in, and each
 * badge carries the one thing to do about it, which is take it off.
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

const OPTION =
  'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors' +
  ' hover:bg-tide-soft aria-selected:bg-tide aria-selected:text-on-accent' +
  ' aria-selected:hover:bg-tide-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' [&[tc-active]]:bg-tide-soft [&[tc-active]]:text-tide-dark';

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

export default function Combobox<V>(props: ComboboxProps<V>): JSX.Element {
  const [open, setOpen] = createSignal(false);
  /** What has been typed, which narrows the list without choosing from it */
  const [typed, setTyped] = createSignal('');
  /** The whole control, for working out what is a press away from it */
  const [root, setRoot] = createSignal<HTMLElement>();

  dismissOutside(root, open, () => {
    setOpen(false);
    // Back to the name of what is chosen, the same as a list shut any
    // other way: a box left holding half a search says the wrong value
    setTyped('');
  });

  const named = (value: V | null): string =>
    props.options.find((option) => option.value === value)?.label ?? '';

  /** Whether the box will hold nothing more */
  const full = (): boolean =>
    props.multiple === true && props.limit != null && props.value.length >= props.limit;

  /** Everything picked, whichever mode this is in */
  const picked = (): V[] => {
    if (props.multiple === true) {
      return props.value;
    }
    return props.value == null ? [] : [props.value];
  };

  /** What is in the box, for the membership the list asks per option */
  const chosen = createMemo(() => new Set(picked()));

  /**
   * What is left after the typing. An empty box is the whole list
   * rather than nothing, since the box opens empty
   */
  const showing = (): ComboboxOptionData<V>[] => {
    const query = typed().trim().toLowerCase();

    return query === ''
      ? props.options
      : props.options.filter((option) => option.label.toLowerCase().includes(query));
  };

  const shut = (state: boolean): void => {
    setOpen(state);
    if (!state) {
      setTyped('');
    }
  };

  /**
   * What the box reads while nobody is typing in it. Taking several,
   * it stays a search box — the names are in the badges over it, and
   * one of them repeated inside would be the value said twice
   */
  const inside = (): string => {
    if (open() || props.multiple === true) {
      return typed();
    }
    return named(props.value);
  };

  /** The list itself, which is the same either way it is being used */
  const list = (): JSX.Element => (
    <Transition show={open()} {...SHEER} class="absolute top-full left-0 z-20 mt-1.5 w-full">
      <ComboboxOptions
        unmount={false}
        onTransitionEnd={holdFade}
        inert={!open()}
        class="flex max-h-64 w-full list-none flex-col gap-0.5 overflow-y-auto rounded-xl
          border-2 border-tide bg-paper p-1 shadow-pop"
      >
        <For each={showing()}>
          {(option) => (
            <ComboboxOption
              class={OPTION}
              value={option.value}
              // A full box still lets go of what is in it: what is
              // already picked stays pressable, since pressing it is
              // how it comes off
              disabled={option.disabled === true || (full() && !chosen().has(option.value))}
            >
              {option.label}
            </ComboboxOption>
          )}
        </For>
        <Show when={showing().length === 0}>
          <li class="px-2 py-1 text-sm text-muted">Nothing matches that.</li>
        </Show>
      </ComboboxOptions>
    </Transition>
  );

  return (
    <FieldFrame
      label={props.label}
      hint={props.hint}
      error={props.error}
      required={props.required}
      class={props.class}
    >
      {(parts) => {
        const box = (): JSX.Element => (
          <ComboboxInput
            id={parts.id}
            value={inside()}
            placeholder={props.placeholder ?? 'Search…'}
            disabled={props.disabled}
            aria-describedby={parts.describedBy}
            aria-invalid={props.error == null ? undefined : true}
            aria-required={props.required}
            class={`w-full ${props.error == null ? '' : 'border-ember'}`}
            onInput={(event: InputEvent) => {
              const typing = event.currentTarget;

              setOpen(true);
              if (typing instanceof HTMLInputElement) {
                setTyped(typing.value);
              }
            }}
          />
        );

        return (
          <Show
            when={props.multiple === true ? props : null}
            keyed
            fallback={
              <HeadlessCombobox
                ref={(element: HTMLElement) => {
                  setRoot(element);
                }}
                isOpen={open()}
                onDisclosureChange={shut}
                disabled={props.disabled}
                value={props.multiple === true ? null : props.value}
                matchBy={(value: V | null, query: string) =>
                  named(value).toLowerCase().includes(query.toLowerCase())
                }
                onSelectChange={(value?: V | null) => {
                  if (value != null && props.multiple !== true) {
                    props.onChange(value);
                  }
                }}
                class="relative"
              >
                {box()}
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
                isOpen={open()}
                onDisclosureChange={shut}
                disabled={props.disabled}
                value={many.value}
                matchBy={(value: V, query: string) =>
                  named(value).toLowerCase().includes(query.toLowerCase())
                }
                onSelectChange={(values: V[]) => {
                  // Terracotta has already added it by the time this
                  // is heard, so a pick past the limit is refused here
                  if (many.limit == null || values.length <= many.limit) {
                    many.onChange(values);
                  }
                }}
                class="relative flex flex-col gap-1.5"
              >
                <Show when={picked().length > 0}>
                  <div class="flex flex-wrap gap-1">
                    <For each={picked()}>
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
                            {/* Drawn rather than a character: a glyph
                                sits on its own baseline, and no amount
                                of leading puts it in the middle of a
                                circle */}
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
                {box()}
                {list()}
              </HeadlessCombobox>
            )}
          </Show>
        );
      }}
    </FieldFrame>
  );
}
