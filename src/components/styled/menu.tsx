import { For, type JSX, createSignal } from 'solid-js';
import { Menu as HeadlessMenu, MenuItem, Popover, PopoverButton, PopoverPanel } from 'terracotta';

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
}

export interface MenuProps {
  /**
   * What the button says. It names the menu for a screen reader too,
   * so it should say what the actions are about rather than "menu"
   */
  label: string;
  actions: MenuAction[];
  class?: string;
}

const ITEM =
  'cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-left text-sm font-semibold' +
  ' shadow-none transition-colors hover:border-0 hover:bg-tide-soft hover:text-tide-dark' +
  ' active:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted' +
  ' [&[tc-active]]:bg-tide-soft [&[tc-active]]:text-tide-dark';

export default function Menu(props: MenuProps): JSX.Element {
  const [open, setOpen] = createSignal(false);

  return (
    <Popover
      isOpen={open()}
      onChange={(state) => {
        setOpen(state);
      }}
      class={`relative inline-flex ${props.class ?? ''}`}
    >
      <PopoverButton
        class="inline-flex items-center gap-1.5 rounded-xl border-2 border-line bg-paper px-3
          py-1 text-sm font-bold shadow-pop-sm transition-colors hover:border-tide
          hover:text-tide-dark focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-tide"
      >
        {props.label}
        <span aria-hidden="true">▾</span>
      </PopoverButton>
      {/* Hung from the button's right edge rather than its left.
          The button that opens it is pinned to the right of a dialog
          header, so a panel laid out rightwards from there runs off
          the side of the screen — and a menu you have to scroll the
          page sideways to read is a menu with nothing in it */}
      <PopoverPanel
        class="absolute top-full right-0 z-30 mt-1.5 w-max min-w-44 rounded-xl border-2
          border-tide bg-paper p-1 shadow-pop"
      >
        <HeadlessMenu class="flex list-none flex-col gap-0.5">
          <For each={props.actions}>
            {(action) => (
              <MenuItem
                as="button"
                type="button"
                class={ITEM}
                aria-disabled={action.disabled === true}
                onClick={() => {
                  if (action.disabled === true) {
                    return;
                  }
                  setOpen(false);
                  action.onSelect();
                }}
              >
                {action.label}
              </MenuItem>
            )}
          </For>
        </HeadlessMenu>
      </PopoverPanel>
    </Popover>
  );
}
