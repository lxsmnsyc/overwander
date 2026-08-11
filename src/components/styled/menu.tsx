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
  'cursor-pointer rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-leaf-soft' +
  ' hover:text-leaf-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted' +
  ' [&[tc-active]]:bg-leaf-soft [&[tc-active]]:text-leaf-dark';

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
        class="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-2.5
          py-1 text-sm font-medium transition-colors hover:border-leaf hover:text-leaf-dark
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
      >
        {props.label}
        <span aria-hidden="true">▾</span>
      </PopoverButton>
      <PopoverPanel
        class="absolute top-full left-0 z-30 mt-1 w-max min-w-44 rounded-lg border border-line
          bg-paper p-1 shadow-lg shadow-ink/15"
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
