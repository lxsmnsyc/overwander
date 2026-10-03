import { type ComponentProps, For, type JSX, Show, createSignal } from 'solid-js';
import { Dynamic, Portal } from 'solid-js/web';
import {
  Menu as HeadlessMenu,
  MenuItem,
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from 'terracotta';
import useDropdown from './dropdown';
import { usePortalHost } from './portal-host';
import { SHEER } from './transition';

/**
 * A short list of things that can be done to whatever is on screen,
 * kept behind one button.
 *
 * It is for the actions that would otherwise be a row of buttons over
 * the thing they act on: a sheet with six of them at the top is a
 * sheet whose subject has been pushed off the screen. What belongs in
 * here is what a player does *occasionally* — the everyday press
 * stays a button of its own.
 *
 * Terracotta brings the behaviour: the panel closes on Escape and on
 * a click outside it, the button says whether it is open, and the menu
 * takes the arrow keys. What is decided here is that picking
 * something **closes** it — a menu that stays open after a choice
 * reads as a list of checkboxes
 */
export interface MenuAction {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** `danger` draws it red, for an action that cannot be undone */
  tone?: 'danger';
  /** Whether a rule sets it apart from the entries above it */
  separated?: boolean;
  /** A colour drawn as a swatch before the label */
  swatch?: string;
  /**
   * Whether it is the one that holds now, ticked. A menu of places to
   * move something to ticks where it is
   */
  checked?: boolean;
}

export interface MenuProps {
  /**
   * What the button says. It names the menu for a screen reader too,
   * so it should say what the actions are about rather than "menu"
   */
  label: string;
  /**
   * A picture in place of the word. The label still names the button
   * for a screen reader, and the caret goes with the word: an icon
   * that already means "more" does not need one
   */
  icon?: (iconProps: ComponentProps<'svg'>) => JSX.Element;
  actions: MenuAction[];
  class?: string;
  /**
   * What the button shows in place of the label, which still names it
   * for a screen reader. Drawn in the accent colour, since a button
   * that shows something of its own is a chip rather than a word
   */
  face?: JSX.Element;
  /** A word over the entries, saying what picking one does */
  heading?: string;
}

const ITEM =
  'flex items-center gap-2 cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-left text-sm font-semibold' +
  ' shadow-none transition-colors hover:border-0 hover:bg-tide-soft hover:text-tide-dark' +
  ' active:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted' +
  ' [&[tc-active]]:bg-tide-soft [&[tc-active]]:text-tide-dark';

export default function Menu(props: MenuProps): JSX.Element {
  const [open, setOpen] = createSignal(false);
  const host = usePortalHost();
  // Hung from the button's right edge: the button is usually pinned to
  // the right of a dialog header, and a panel laid out rightwards from
  // there runs off the screen. Drawn in the portal container, so the
  // panel and its dock no longer cut it off
  const floating = useDropdown({ open, placement: 'bottom-end' });

  return (
    <Popover
      isOpen={open()}
      onChange={(state) => {
        setOpen(state);
      }}
      class={`relative inline-flex ${props.class ?? ''}`}
    >
      <PopoverButton
        ref={(element: HTMLElement) => {
          floating.refs.setReference(element);
        }}
        aria-label={props.icon == null && props.face == null ? undefined : props.label}
        class={`inline-flex items-center gap-1.5 rounded-xl border-2 py-1 text-sm shadow-pop-sm
          transition-colors hover:border-tide hover:text-tide-dark focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-tide ${
            props.face == null
              ? 'border-line bg-paper font-bold'
              : 'border-tide bg-tide-soft font-black'
          } ${props.icon == null ? 'px-3' : 'px-2'}`}
      >
        <Show when={props.icon} fallback={props.face ?? props.label}>
          {(icon) => <Dynamic component={icon()} class="size-5" aria-hidden="true" />}
        </Show>
        <Show when={props.icon == null}>
          <span aria-hidden="true">▾</span>
        </Show>
      </PopoverButton>
      <Portal mount={host()}>
        {/* Placed by the outer box and faded by the inner one, so the
            fade never fights the placement over the transform */}
        <div
          ref={(element) => {
            floating.refs.setFloating(element);
          }}
          class="z-40"
          style={{
            ...floating.floatingStyles,
            visibility: floating.isPositioned ? 'visible' : 'hidden',
          }}
        >
          <Transition show={open()} {...SHEER} class="w-max">
            <PopoverPanel
              class="max-h-[var(--drop-room,24rem)] min-w-44 overflow-y-auto rounded-xl border-2
            border-line bg-paper p-1 shadow-float"
            >
              <Show when={props.heading}>
                {(heading) => (
                  <p class="m-0 px-2 pt-1 pb-0.5 text-xs font-black tracking-wide text-muted uppercase">
                    {heading()}
                  </p>
                )}
              </Show>
              <HeadlessMenu class="flex list-none flex-col gap-0.5">
                <For each={props.actions}>
                  {(action) => (
                    <>
                      <Show when={action.separated === true}>
                        <div aria-hidden="true" class="my-0.5 h-px bg-line-soft" />
                      </Show>
                      <MenuItem
                        as="button"
                        type="button"
                        class={
                          action.tone === 'danger'
                            ? `${ITEM} text-ember-dark hover:bg-ember-soft hover:text-ember-dark [&[tc-active]]:bg-ember-soft [&[tc-active]]:text-ember-dark`
                            : ITEM
                        }
                        aria-disabled={action.disabled === true}
                        onClick={() => {
                          if (action.disabled === true) {
                            return;
                          }
                          setOpen(false);
                          action.onSelect();
                        }}
                      >
                        <Show when={action.swatch}>
                          {(swatch) => (
                            <span
                              aria-hidden="true"
                              class="size-3 shrink-0 rounded-[4px]"
                              style={{ background: swatch() }}
                            />
                          )}
                        </Show>
                        <span class="grow">{action.label}</span>
                        <Show when={action.checked === true}>
                          <span aria-hidden="true" class="font-black text-tide-dark">
                            ✓
                          </span>
                        </Show>
                      </MenuItem>
                    </>
                  )}
                </For>
              </HeadlessMenu>
            </PopoverPanel>
          </Transition>
        </div>
      </Portal>
    </Popover>
  );
}
