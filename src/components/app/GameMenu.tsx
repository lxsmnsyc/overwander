import { For, type JSX, Show, createSignal } from 'solid-js';
import { Popover, PopoverButton, PopoverPanel } from 'terracotta';
import { GameDialog, useGame } from './game-context';
import { IconSlot } from '../styled';
import { ThemeToggle } from './theme';

/**
 * The one piece of furniture the game has: a button, and everything
 * behind it.
 *
 * It was a bar with four words on it, which worked while there were
 * four. There are ten now — the player's catches and their bag came
 * out of the profile, the dex arrived beside them, and there is room
 * kept for the friends, the gifts and the settings that are not built
 * yet — and a row of ten across the bottom of the world is a strip of
 * map taken away from every screen to say words that never change.
 *
 * So it is one button, and the ten live in a panel that opens above
 * it. A grid rather than a list: ten things read as a keypad at a
 * glance and as a menu to be scanned when they are stacked, and a
 * keypad is what this is — the same thing is always in the same
 * corner, which is what makes it pressable without reading.
 */

/**
 * One thing behind the button.
 *
 * `dialog` is what pressing it opens; an entry without one is a place
 * kept for something that is not built yet, drawn so the shape of the
 * menu is the shape it will keep. They are disabled rather than
 * hidden, because a keypad whose keys move as the game grows is one a
 * player has to read every time
 */
interface MenuEntry {
  label: string;
  dialog?: GameDialog;
}

const ENTRIES: MenuEntry[] = [
  { label: 'World', dialog: GameDialog.Map },
  { label: 'Catches', dialog: GameDialog.Catches },
  { label: 'Pokedex', dialog: GameDialog.Pokedex },
  { label: 'Inventory', dialog: GameDialog.Inventory },
  { label: 'Profile', dialog: GameDialog.Profile },
  { label: 'Raids', dialog: GameDialog.Raids },
  { label: 'Auctions', dialog: GameDialog.Auctions },
  { label: 'Friends' },
  { label: 'Gifts' },
  { label: 'Settings' },
];

const TILE =
  'flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-transparent' +
  ' bg-transparent px-2 py-2 text-xs font-bold text-ink shadow-none transition-colors' +
  ' hover:border-tide hover:bg-tide-soft hover:text-tide-dark active:translate-y-0' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide' +
  ' disabled:cursor-not-allowed disabled:text-muted disabled:opacity-55' +
  ' disabled:hover:border-transparent disabled:hover:bg-transparent disabled:hover:text-muted';

export default function GameMenu(): JSX.Element {
  const game = useGame();
  const [open, setOpen] = createSignal(false);

  return (
    <nav
      aria-label="Game"
      // Held to the bottom of the window and centred on it, above the
      // map and below anything opened over the map
      class="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex justify-center px-4"
    >
      <Popover
        isOpen={open()}
        onChange={(state: boolean) => {
          setOpen(state);
        }}
        class="pointer-events-auto relative"
      >
        <PopoverButton
          class="flex cursor-pointer items-center gap-2 rounded-full border-2 border-tide
            bg-paper/95 px-4 py-2 text-sm font-bold text-ink shadow-pop backdrop-blur-sm
            transition-colors hover:bg-tide hover:text-on-accent focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-tide"
        >
          <IconSlot size="size-5" />
          Menu
        </PopoverButton>

        {/* Above the button rather than below it: the button is at the
            bottom of the window, and there is nothing under it to open
            into. Centred on the button and pulled back by half its own
            width, so the panel stays over the middle of the screen
            however wide it turns out to be */}
        <PopoverPanel
          class="absolute bottom-full left-1/2 z-30 mb-2 w-max -translate-x-1/2 rounded-panel
            border-2 border-tide bg-paper p-2 shadow-pop"
        >
          {/* Where the player is standing, over the keypad.

              It was on the bar, which is gone, and it is not a thing to
              press — so it is a line at the top of the panel rather
              than a tenth key. The switch between day and night sits
              with it for the same reason: it changes how the game looks
              rather than what is on the screen */}
          <div class="flex items-center gap-2 border-b-2 border-line-soft px-2 pb-2">
            <span class="grow text-sm text-muted whitespace-nowrap">
              <Show when={game.place()} fallback="Somewhere">
                {(place) => place()}
              </Show>
            </span>
            <ThemeToggle
              class="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 text-ink
                shadow-none transition-colors hover:border-0 hover:bg-tide hover:text-on-accent
                active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-tide"
            />
          </div>

          <div class="grid grid-cols-3 gap-1 pt-2">
            <For each={ENTRIES}>
              {(entry) => (
                <button
                  type="button"
                  class={`${TILE} w-20`}
                  disabled={entry.dialog == null}
                  // What a screen reader is told about a key that is
                  // kept rather than built. The word alone reads as
                  // something the game can do and will not
                  title={entry.dialog == null ? `${entry.label} — not yet` : entry.label}
                  onClick={() => {
                    if (entry.dialog == null) {
                      return;
                    }
                    setOpen(false);
                    game.setDialog(entry.dialog);
                  }}
                >
                  <IconSlot />
                  {entry.label}
                </button>
              )}
            </For>
          </div>
        </PopoverPanel>
      </Popover>
    </nav>
  );
}
