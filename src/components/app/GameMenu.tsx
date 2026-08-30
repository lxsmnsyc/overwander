import {
  type ComponentProps,
  For,
  type JSX,
  createEffect,
  createSignal,
  onCleanup,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Popover, PopoverButton, PopoverPanel, Transition } from 'terracotta';
import { useAuth } from '../../auth/context';
import { serverNow, syncServerClock } from '../../auth/clock';
import { getLocalOffset, toLocalTime } from '../../auth/local-time';
import { TIME_OF_DAY_NAMES } from '../../data/biome';
import { getTimeOfDay } from '../../data/ids/biome';
import {
  LANDMARK_INTERVAL,
  NEST_INTERVAL,
  PHENOMENON_INTERVAL,
  RAID_INTERVAL,
  SNAPSHOT_INTERVAL,
  WEATHER_INTERVAL,
} from '../../overworld/chunk-snapshot';
import { GameDialog, useGame } from './game-context';
import { watchProfile } from '../../auth/profile';
import {
  BagIcon,
  FireIcon,
  GiftIcon,
  MapIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  SwordsIcon,
  TrophyIcon,
  UserIcon,
} from '../icons';
import WeatherIcon from '../overworld/WeatherIcon';
import { Divider, HoverCard } from '../styled';
import { SHEER } from '../styled/transition';
import { ThemeToggle } from './theme';
import settings, { type ClockFormat } from './settings';

/**
 * The one piece of furniture the game has: a bar along the bottom of
 * the world, with everything else behind the button on it.
 *
 * Every destination lives in a panel above that button, laid out as a
 * grid rather than a list: the same thing stays in the same corner, so
 * it is pressable without reading. A row of them along the bottom would
 * cost every screen a strip of map to say words that never change.
 *
 * Beside the button is what a player would otherwise have to open
 * something to learn: where they are standing, the hour the world is
 * in, and what is in the purse
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
  /**
   * The picture over the word. Both are drawn: the keypad is learnt by
   * where a thing is and recognised by its picture, and the word is
   * what makes the first press of it possible
   */
  icon: (props: ComponentProps<'svg'>) => JSX.Element;
}

const ENTRIES: MenuEntry[] = [
  { label: 'World', dialog: GameDialog.Map, icon: MapIcon },
  { label: 'Catches', dialog: GameDialog.Catches, icon: SparklesIcon },
  { label: 'Pokedex', dialog: GameDialog.Pokedex, icon: SearchIcon },
  { label: 'Inventory', dialog: GameDialog.Inventory, icon: BagIcon },
  { label: 'Profile', dialog: GameDialog.Profile, icon: UserIcon },
  { label: 'Raids', dialog: GameDialog.Raids, icon: FireIcon },
  { label: 'Battle', dialog: GameDialog.Battles, icon: SwordsIcon },
  // No Auctions key: the lots are read at an auction board out in the
  // world, which is what makes trading somewhere a player goes rather
  // than a panel they open. The panel itself still exists, and the
  // profile still hands over anything already won
  { label: 'Gifts', dialog: GameDialog.Gifts, icon: GiftIcon },
  { label: 'Quests', dialog: GameDialog.Quests, icon: TrophyIcon },
  { label: 'Settings', dialog: GameDialog.Settings, icon: SettingsIcon },
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
function worldClock(at: number, format: ClockFormat): string {
  const minutes = Math.floor(at / 60_000) % (24 * 60);
  const hour = Math.floor(minutes / 60);
  const past = String(minutes % 60).padStart(2, '0');

  if (format === '24h') {
    return `${String(hour).padStart(2, '0')}:${past}`;
  }
  // Midnight and noon are both twelve, which is the one case a
  // remainder gets wrong
  return `${hour % 12 === 0 ? 12 : hour % 12}:${past} ${hour < 12 ? 'am' : 'pm'}`;
}

/**
 * What a chunk turns over, and how long each window runs. Named the
 * way a player would name them, and read as a countdown: when the next
 * one lands is what somebody standing in a chunk is deciding on
 */
const WINDOWS: [called: string, every: number][] = [
  ['Pokemon', SNAPSHOT_INTERVAL],
  ['Caches and patches', LANDMARK_INTERVAL],
  ['Weather', WEATHER_INTERVAL],
  ['Happenings', PHENOMENON_INTERVAL],
  ['Raids and wanderers', RAID_INTERVAL],
  ['Nest eggs', NEST_INTERVAL],
];

/**
 * How long until a window of this length turns over. Every one of them
 * is counted off the same instant the chunk counts it off, so this is
 * the chunk's own arithmetic rather than a guess at it
 */
function until(at: number, every: number): number {
  return every - (at % every);
}

/**
 * A wait, in the largest units that still say something true. "In 2
 * hours" for a wait of two and a half is a clock a player would set
 * something by and be wrong, so the odd minutes stay on
 */
function saidWait(left: number): string {
  const minutes = Math.max(1, Math.ceil(left / 60_000));
  const hours = Math.floor(minutes / 60);
  const past = minutes % 60;

  if (hours === 0) {
    return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  if (past === 0) {
    return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `in ${hours}h ${past}m`;
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
          <MenuIcon class="size-5" aria-hidden="true" />
          Menu
        </PopoverButton>

        <Divider />

        {/* Where they are standing. It is the one reading that can be
            missing — a chunk still being read has no name yet */}
        {/* Read straight rather than through a `Show`. Its callback
            form hands the child an accessor and then untracks the call,
            so a child that *is* the call — `{(place) => place()}` —
            captures the first place the player stood in and holds it:
            the words only changed when they went from nothing to
            something, which is once a session */}
        <span class="min-w-0 truncate text-sm font-bold text-ink">
          {game.place() ?? 'Somewhere'}
        </span>

        <Divider />

        {/* What the sky is doing, which is worth reading: a pokemon met
            under weather comes with a floor under its values. Drawn
            rather than named, since the bar is a strip and the place
            beside it has the words */}
        <span class="flex shrink-0 items-center text-muted">
          {(() => {
            const sky = game.weather();

            return sky == null ? '' : <WeatherIcon weather={sky} />;
          })()}
        </span>

        <Divider />

        {/* What hour the world is in, which is what decides what walks
            about in it. The reading the player did not choose is the
            first thing the card says, so neither is ever more than a
            hover away, and the windows the hour is divided into are
            under it: what changes on this clock, and how often */}
        <HoverCard
          title="The world's clock"
          description={
            settings().worldTime === 'clock'
              ? TIME_OF_DAY_NAMES[getTimeOfDay(now())]
              : `World time ${worldClock(now(), settings().clock)}`
          }
          placement="top"
          width="wide"
          class="shrink-0 cursor-help rounded text-sm whitespace-nowrap text-muted
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide"
          trigger={
            settings().worldTime === 'clock'
              ? worldClock(now(), settings().clock)
              : TIME_OF_DAY_NAMES[getTimeOfDay(now())]
          }
        >
          {/* When each of them next turns over, rather than how long
              it runs: a player reads this to decide whether to wait
              where they stand or walk on */}
          <dl>
            <For each={WINDOWS}>
              {([called, every]) => (
                <>
                  <dt>{called}</dt>
                  <dd>{saidWait(until(now(), every))}</dd>
                </>
              )}
            </For>
          </dl>
          <p class="mt-2 text-xs text-muted">
            Counted off this clock, yours rather than the world's, so nothing turns over halfway
            through what you are doing at it.
          </p>
        </HoverCard>

        <Divider />

        <span class="shrink-0 text-sm font-bold whitespace-nowrap text-gold">
          {gold() ?? 0} gold
        </span>

        {/* Above the button rather than below it: the button is at the
            bottom of the window, and there is nothing under it to open
            into. Centred on the button and pulled back by half its own
            width, so the panel stays over the middle of the screen
            however wide it turns out to be */}
        <Transition
          show={open()}
          {...SHEER}
          class="absolute bottom-full left-1/2 z-30 mb-2 w-max -translate-x-1/2"
        >
          <PopoverPanel
            // Kept mounted, since the fade needs something to fade,
            // and out of reach while it is going
            // unmount={false}
            class="rounded-panel border-2 border-tide bg-paper p-2 shadow-pop"
          >
            {/* Day or night, over the keypad: it changes how the game
              looks rather than what is on the screen, so it is not one
              of the keys */}
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
                    <Dynamic component={entry.icon} class="size-7" aria-hidden="true" />
                    {entry.label}
                  </button>
                )}
              </For>
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </nav>
  );
}
