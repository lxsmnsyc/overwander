import { For, type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { Popover, PopoverButton, PopoverPanel } from 'terracotta';
import { useAuth } from '../../auth/context';
import { serverNow, syncServerClock } from '../../auth/clock';
import { getLocalOffset, toLocalTime } from '../../auth/local-time';
import { TIME_OF_DAY_NAMES } from '../../data/biome';
import { getTimeOfDay } from '../../data/ids/biome';
import { GameDialog, useGame } from './game-context';
import { watchProfile } from '../../auth/profile';
import { Divider, IconSlot } from '../styled';
import { ThemeToggle } from './theme';

/**
 * The one piece of furniture the game has: a bar along the bottom of
 * the world, with everything else behind the button on it.
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
 *
 * Beside the button is what a player would otherwise have to open
 * something to find out: where they are standing, what hour the world
 * is in — which decides what walks about in it — and what is in the
 * purse.
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

/**
 * How often the hour on the bar is re-read. The world turns over in
 * five-minute windows and the periods themselves are hours long, so a
 * minute is fine enough to never be seen to be wrong
 */
const CLOCK_TICK = 60_000;

/**
 * The hour the world is reading, as a clock. It is the player's own
 * wall clock — the same reading the chunk under them derives its
 * pokemon from — so a word that disagrees with the window outside
 * shows up as the bug it is
 */
function worldClock(at: number): string {
  const minutes = Math.floor(at / 60_000) % (24 * 60);

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export default function GameMenu(): JSX.Element {
  const auth = useAuth();
  const game = useGame();
  const [open, setOpen] = createSignal(false);
  const [now, setNow] = createSignal(toLocalTime(serverNow(), getLocalOffset()));
  const [gold, setGold] = createSignal<number | null>(null);

  /**
   * The instant, read the way the world reads it: the server's clock
   * for *when* — a device cannot move time — put into the player's own
   * zone for *which hour*. The chunk under them derives its pokemon
   * from exactly this, so the bar said Night over a field of day
   * pokemon while it was reading raw UTC
   */
  const local = (at: number): number => toLocalTime(at, getLocalOffset());

  const beat = setInterval(() => {
    syncServerClock()
      .then((at) => {
        setNow(local(at));
      })
      .catch(() => {
        setNow(local(serverNow()));
      });
  }, CLOCK_TICK);

  onCleanup(() => {
    clearInterval(beat);
  });

  syncServerClock()
    .then((at) => {
      setNow(local(at));
    })
    .catch(() => {
      // The device's own clock stands in until a reading lands
    });

  // Watched rather than read once: gold moves at a vendor, on the
  // board and at the end of a raid, and a figure on permanent display
  // that only updates on a reload is a figure a player stops trusting
  createEffect(() => {
    const user = auth.user();

    if (user == null) {
      setGold(null);
      return;
    }

    const stop = watchProfile(user.uid, (profile) => {
      setGold(profile?.gold ?? 0);
    });

    onCleanup(stop);
  });

  return (
    <nav
      aria-label="Game"
      // Held to the bottom of the window and centred on it, above the
      // map and below anything opened over the map
      class="pointer-events-none fixed inset-x-0 bottom-4 z-10 flex justify-center px-4"
    >
      {/* One bar: the way in on the left, and the three readings a
          player would otherwise have to open something to get */}
      <Popover
        isOpen={open()}
        onChange={(state: boolean) => {
          setOpen(state);
        }}
        // No `overflow-hidden` however tempting: the panel opens out
        // of the top of this box, and a clipped panel is a menu that
        // does not appear
        class="pointer-events-auto relative flex max-w-full items-center gap-2 rounded-full
          border-2 border-tide bg-paper/95 py-1 pr-4 pl-1 shadow-pop backdrop-blur-sm"
      >
        <PopoverButton
          class="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2
            border-transparent bg-transparent px-3 py-1 text-sm font-bold text-ink shadow-none
            transition-colors hover:bg-tide hover:text-on-accent focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-tide"
        >
          <IconSlot size="size-5" />
          Menu
        </PopoverButton>

        <Divider />

        {/* Where they are standing. It is the one reading that can be
            missing — a chunk still being read has no name yet */}
        <span class="min-w-0 truncate text-sm font-bold text-ink">
          <Show when={game.place()} fallback="Somewhere">
            {(place) => place()}
          </Show>
        </span>

        <Divider />

        {/* What hour the world is in, which is what decides what walks
            about in it */}
        <span
          class="shrink-0 text-sm whitespace-nowrap text-muted"
          title={`World time ${worldClock(now())}`}
        >
          {TIME_OF_DAY_NAMES[getTimeOfDay(now())]}
        </span>

        <Divider />

        <span class="shrink-0 text-sm font-bold whitespace-nowrap text-gold">
          {gold() ?? 0} gold
        </span>

        {/* Above the button rather than below it: the button is at the
            bottom of the window, and there is nothing under it to open
            into. Centred on the button and pulled back by half its own
            width, so the panel stays over the middle of the screen
            however wide it turns out to be */}
        <PopoverPanel
          class="absolute bottom-full left-1/2 z-30 mb-2 w-max -translate-x-1/2 rounded-panel
            border-2 border-tide bg-paper p-2 shadow-pop"
        >
          {/* Day or night, over the keypad: it changes how the game
              looks rather than what is on the screen, so it is not one
              of the ten keys */}
          <div class="flex items-center justify-end gap-2 border-b-2 border-line-soft px-2 pb-2">
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
