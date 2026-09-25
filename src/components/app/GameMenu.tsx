import {
  type ComponentProps,
  For,
  type JSX,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Popover, PopoverButton, PopoverPanel, Transition } from 'terracotta';
import { useAuth } from '../../auth/context';
import { localNow, serverNow, syncServerClock } from '../../auth/clock';
import { getLocalOffset, toLocalTime } from '../../auth/local-time';
import { TIME_OF_DAY_NAMES } from '../../data/biome';
import { getTimeOfDay } from '../../data/ids/biome';
import { WEATHER_DESCRIPTIONS, WEATHER_NAMES } from '../../data/overworld/weather';
import {
  LANDMARK_INTERVAL,
  NEST_INTERVAL,
  PHENOMENON_INTERVAL,
  RAID_INTERVAL,
  SNAPSHOT_INTERVAL,
  WEATHER_INTERVAL,
} from '../../overworld/chunk-snapshot';
import { type FieldMoveOffer, GameDialog, useGame } from './game-context';
import { watchProfile } from '../../auth/profile';
import { listMysteryGifts } from '../../auth/gifts';
import { NoticeKind } from '../../auth/notifications';
import { getDueQuests } from '../../auth/quests';
import {
  ActionsIcon,
  BagIcon,
  BellIcon,
  ChevronDownIcon,
  FireIcon,
  GiftIcon,
  MapIcon,
  MenuIcon,
  NewsIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  SwordsIcon,
  TrophyIcon,
  UserIcon,
} from '../icons';
import { WeatherFavors, getWeatherIcon } from '../overworld/WeatherIcon';
import { Divider } from '../styled';
import { SHEER } from '../styled/transition';
import FullscreenToggle, { fullscreenOffered } from './fullscreen';
import { ThemeToggle } from './theme';
import { actionOf, forTheGame } from './keys';
import settings, { type ClockFormat } from './settings';

/**
 * How a switch is drawn, on the bar and over the keypad alike: the
 * bar's own button, without the box a button usually carries
 */
const TOGGLE = `cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 text-ink shadow-none
  transition-colors hover:border-0 hover:bg-tide hover:text-on-accent active:translate-y-0
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide`;

/** A round icon button on the bar */
const BAR_BUTTON = `relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-2
  border-transparent bg-transparent p-1.5 text-sm font-bold text-ink shadow-none
  transition-colors hover:bg-tide hover:text-on-accent focus-visible:outline-2
  focus-visible:outline-offset-2 focus-visible:outline-tide`;

/** How many things are waiting, on the key or button that opens them */
const COUNT = `min-w-4 rounded-full border-2 border-ember bg-ember-soft px-1 text-center
  text-[0.65rem] leading-4 text-ember-dark`;

/** A field move on the bar. Pressed is a travel mode that is on */
const CHIP = `shrink-0 cursor-pointer rounded-full border-2 border-tide bg-transparent px-2.5 py-0.5
  text-xs font-bold text-tide-dark shadow-none transition-colors hover:bg-tide-soft
  active:translate-y-0 aria-pressed:bg-tide aria-pressed:text-on-accent
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide
  disabled:cursor-not-allowed disabled:opacity-55`;

/**
 * The one piece of furniture the game has: a bar along the bottom of
 * the world, with every destination in a keypad above the button on it.
 * Beside the button is where the player stands and what the sky and
 * clock are doing, which opens into the windows the world turns over on.
 */

/**
 * One key on the keypad. An entry without a `dialog` is a place kept
 * for something not built yet, disabled rather than hidden so the other
 * keys never move
 */
interface MenuEntry {
  label: string;
  dialog?: GameDialog;
  icon: (props: ComponentProps<'svg'>) => JSX.Element;
}

/** A labelled row of keys. A new key joins its own row, so no other key moves */
interface MenuGroup {
  label: string;
  entries: MenuEntry[];
}

/** The notices a player settles from their profile rather than elsewhere */
const PROFILE_NOTICES = new Set<NoticeKind>([
  NoticeKind.FriendRequest,
  NoticeKind.TradeOffer,
  NoticeKind.AuctionWon,
  NoticeKind.AuctionUnsold,
]);

// No Auctions key: the lots are read at an auction board out in the
// world, which is what makes trading somewhere a player goes
const GROUPS: MenuGroup[] = [
  {
    label: 'You',
    entries: [
      { label: 'Catches', dialog: GameDialog.Catches, icon: SparklesIcon },
      { label: 'Bag', dialog: GameDialog.Inventory, icon: BagIcon },
      { label: 'Pokedex', dialog: GameDialog.Pokedex, icon: SearchIcon },
      { label: 'Profile', dialog: GameDialog.Profile, icon: UserIcon },
    ],
  },
  {
    label: 'Play',
    entries: [
      { label: 'World', dialog: GameDialog.Map, icon: MapIcon },
      { label: 'Quests', dialog: GameDialog.Quests, icon: TrophyIcon },
      { label: 'Battle', dialog: GameDialog.Battles, icon: SwordsIcon },
      { label: 'Raids', dialog: GameDialog.Raids, icon: FireIcon },
    ],
  },
  {
    label: 'Inbox',
    entries: [
      { label: 'Notices', dialog: GameDialog.Notifications, icon: BellIcon },
      { label: 'Gifts', dialog: GameDialog.Gifts, icon: GiftIcon },
      { label: 'News', dialog: GameDialog.News, icon: NewsIcon },
    ],
  },
];

const TILE =
  'flex w-full min-w-0 cursor-pointer flex-col items-center gap-1 rounded-xl border-2' +
  ' border-transparent bg-transparent px-1 py-2 text-xs font-bold text-ink shadow-none' +
  ' transition-colors hover:border-tide hover:bg-tide-soft hover:text-tide-dark' +
  ' active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-tide disabled:cursor-not-allowed disabled:text-muted' +
  ' disabled:opacity-55 disabled:hover:border-transparent disabled:hover:bg-transparent' +
  ' disabled:hover:text-muted';

/**
 * How often the hour on the bar is re-read. The world turns over in
 * five-minute windows and the periods themselves are hours long, so a
 * minute is fine enough to never be seen to be wrong
 */
const CLOCK_TICK = 60_000;

/**
 * The hour the world is reading, as a clock. It is the player's own
 * wall clock, the same reading the chunk under them derives its
 * pokemon from
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
 * What a chunk turns over, and how long each window runs. Read as a
 * countdown: when the next one lands is what somebody standing in a
 * chunk is deciding on
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
 * is counted off the same local instant the chunk counts it off
 */
function until(local: number, every: number): number {
  return every - (local % every);
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

/** When each window next turns over, rather than how long it runs */
function Windows(props: { now: number; class?: string }): JSX.Element {
  return (
    <>
      <dl class={props.class}>
        <For each={WINDOWS}>
          {([called, every]) => (
            <>
              <dt>{called}</dt>
              <dd>{saidWait(until(props.now, every))}</dd>
            </>
          )}
        </For>
      </dl>
      <p class="mt-2 text-xs text-muted">
        Counted off your own clock, so nothing turns over halfway through what you are doing at it.
      </p>
    </>
  );
}

/** The travel mode that is on, if any, for the phone's field move button */
function activeMove(offers: FieldMoveOffer[]): FieldMoveOffer | null {
  for (const offer of offers) {
    if (offer.active) {
      return offer;
    }
  }
  return null;
}

export default function GameMenu(): JSX.Element {
  const auth = useAuth();
  const game = useGame();
  const [open, setOpen] = createSignal(false);
  /** Where the player stands and the world's clock, opened from the bar */
  const [details, setDetails] = createSignal(false);
  /** The buddy's field moves, behind their own button on a phone */
  const [moves, setMoves] = createSignal(false);
  const [now, setNow] = createSignal(localNow());
  const [gold, setGold] = createSignal<number | null>(null);

  /** The way in, kept so the bound key can hand it the keyboard */
  let button: HTMLButtonElement | undefined;

  /** How many things are waiting on the player, for the menu button's own badge */
  const waiting = (): number => game.notices().length;

  /** Gifts waiting on the shelf and quests ready to claim, read when the menu opens */
  const [shelf, setShelf] = createSignal({ gifts: 0, quests: 0 });

  const readShelf = (): void => {
    Promise.all([listMysteryGifts(), getDueQuests()])
      .then(([gifts, quests]) => {
        setShelf({ gifts: gifts.length, quests: quests.length });
      })
      .catch(() => {
        // A count that could not be read shows no badge rather than a wrong one
      });
  };

  /** How many things each entry has waiting behind it */
  const countFor = (dialog: GameDialog | undefined): number => {
    if (dialog === GameDialog.Notifications) {
      return waiting();
    }
    if (dialog === GameDialog.Gifts) {
      return shelf().gifts;
    }
    if (dialog === GameDialog.Quests) {
      return shelf().quests;
    }
    if (dialog !== GameDialog.Profile) {
      return 0;
    }
    // What the profile's own tabs resolve: requests, trades and lots
    let count = 0;

    for (const notice of game.notices()) {
      if (PROFILE_NOTICES.has(notice.kind)) {
        count += 1;
      }
    }
    return count;
  };

  /** Opens one panel off the bar and closes the others, since all of them open upward */
  const only = (panel: 'menu' | 'details' | 'moves'): void => {
    setOpen(panel === 'menu');
    setDetails(panel === 'details');
    setMoves(panel === 'moves');
    if (panel === 'menu') {
      readShelf();
    }
  };

  const openDialog = (dialog: GameDialog): void => {
    setOpen(false);
    game.setDialog(dialog);
  };

  const period = (): string => TIME_OF_DAY_NAMES[getTimeOfDay(now())];
  const clock = (): string => worldClock(now(), settings().clock);
  const place = (): string => game.place() ?? 'Somewhere';
  const purse = (): string => `${(gold() ?? 0).toLocaleString()} gold`;

  /**
   * The server's clock for when, put into the player's own zone for
   * which hour, since the chunk under them derives its pokemon from
   * exactly this
   */
  const local = (at: number): number => toLocalTime(at, getLocalOffset());

  /** Read the hour again, measuring the clock only for a tab somebody is looking at */
  const tick = (): void => {
    if (document.visibilityState !== 'visible') {
      setNow(local(serverNow()));
      return;
    }
    syncServerClock()
      .then((at) => {
        setNow(local(at));
      })
      .catch(() => {
        setNow(local(serverNow()));
      });
  };
  onMount(() => {
    const beat = setInterval(tick, CLOCK_TICK);

    document.addEventListener('visibilitychange', tick);

    onCleanup(() => {
      clearInterval(beat);
      document.removeEventListener('visibilitychange', tick);
    });
  });

  syncServerClock()
    .then((at) => {
      setNow(local(at));
    })
    .catch(() => {
      // The device's own clock stands in until a reading lands
    });

  // Watched rather than read once: gold moves at a vendor, on the
  // board and at the end of a raid
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

  /**
   * The bound key puts the keyboard on the bar rather than opening it,
   * so a player who pressed it to see where they were can walk on
   * without a panel over the world
   */
  onMount(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (!forTheGame(event) || actionOf(event, settings().keys) !== 'menu') {
        return;
      }
      event.preventDefault();
      button?.focus();
    };

    window.addEventListener('keydown', onKey);
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
    });
  });

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
          if (state) {
            only('menu');
          } else {
            setOpen(false);
          }
        }}
        // No `overflow-hidden`: every panel opens out of the top of
        // this box, and a clipped panel is a menu that does not appear
        class="pointer-events-auto relative flex max-w-full items-center gap-2 rounded-full
          border-2 border-tide bg-paper/95 py-1 pr-1 pl-1 shadow-pop backdrop-blur-sm sm:pr-3"
      >
        <PopoverButton
          ref={button}
          aria-label={waiting() > 0 ? `Menu, ${waiting()} waiting` : 'Menu'}
          class={BAR_BUTTON}
        >
          <MenuIcon class="size-5" aria-hidden="true" />
          <Show when={waiting() > 0}>
            <span aria-hidden="true" class={`${COUNT} absolute -top-1 -right-1`}>
              {waiting()}
            </span>
          </Show>
        </PopoverButton>

        <Divider />

        {/* Not positioned itself, so its panel hangs off the bar the way the menu's does */}
        <Popover
          isOpen={details()}
          onChange={(state: boolean) => {
            if (state) {
              only('details');
            } else {
              setDetails(false);
            }
          }}
          class="flex min-w-0"
        >
          {/* Read straight rather than through a callback `Show`, which
              untracks the call and would hold the first place stood in */}
          <PopoverButton
            class="flex max-w-full min-w-0 cursor-pointer flex-col items-start rounded-2xl border-0
              bg-transparent px-2 py-0.5 text-left leading-tight shadow-none transition-colors
              hover:bg-tide-soft active:translate-y-0 focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-tide sm:max-w-72"
          >
            <span class="flex max-w-full min-w-0 items-center gap-1">
              <span class="min-w-0 truncate text-sm font-bold text-ink">{place()}</span>
              <ChevronDownIcon class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            </span>
            <span class="flex items-center gap-1 text-xs whitespace-nowrap text-muted">
              {(() => {
                const sky = game.weather();

                return sky == null ? (
                  ''
                ) : (
                  <>
                    <Dynamic component={getWeatherIcon(sky)} class="size-3.5" aria-hidden="true" />
                    <span class="hidden sm:inline">{WEATHER_NAMES[sky]} ·</span>
                  </>
                );
              })()}
              <span>
                {period()} {clock()}
              </span>
            </span>
          </PopoverButton>
          <Transition
            show={details()}
            {...SHEER}
            class="absolute bottom-full left-1/2 z-30 mb-2 w-72 max-w-[calc(100vw-2rem)]
              -translate-x-1/2"
          >
            <PopoverPanel
              class="flex flex-col gap-2 rounded-panel border-2 border-tide bg-paper p-3 text-sm
                shadow-pop"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="min-w-0 truncate font-bold text-ink">{place()}</span>
                {/* On the bar itself from a screen wide enough to hold it */}
                <span class="shrink-0 font-bold whitespace-nowrap text-gold sm:hidden">
                  {purse()}
                </span>
              </div>
              {(() => {
                const sky = game.weather();

                // Said outright rather than behind a hover, which a phone
                // has no way to open
                return sky == null ? (
                  ''
                ) : (
                  <div class="flex flex-col gap-1.5">
                    <span class="flex items-center gap-2 font-bold text-ink">
                      <Dynamic component={getWeatherIcon(sky)} class="size-5" aria-hidden="true" />
                      {WEATHER_NAMES[sky]}
                    </span>
                    <p class="text-xs text-muted">{WEATHER_DESCRIPTIONS[sky]}</p>
                    <WeatherFavors weather={sky} />
                  </div>
                );
              })()}
              <div class="flex items-center justify-between gap-3">
                <span class="font-bold text-ink">{period()}</span>
                <span class="text-muted">{clock()}</span>
              </div>
              <div class="border-t-2 border-line-soft pt-2 text-xs">
                <Windows
                  now={now()}
                  class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 [&_dd]:text-right
                    [&_dd]:text-muted"
                />
              </div>
              <Show when={fullscreenOffered()}>
                <div class="flex justify-end border-t-2 border-line-soft pt-2 sm:hidden">
                  <FullscreenToggle class={TOGGLE} />
                </div>
              </Show>
            </PopoverPanel>
          </Transition>
        </Popover>

        {/* The buddy's field moves, only while there is one to use here */}
        <Show when={game.fieldMoves().length > 0}>
          <Divider />

          <div class="hidden items-center gap-1 sm:flex">
            <For each={game.fieldMoves()}>
              {(offer) => (
                <button
                  type="button"
                  class={CHIP}
                  aria-pressed={offer.active}
                  disabled={offer.busy}
                  onClick={() => {
                    offer.use();
                  }}
                >
                  {offer.name}
                </button>
              )}
            </For>
          </div>

          {/* A phone has no width for the chips, so they go behind a button
              that names the travel mode that is on */}
          <Popover
            isOpen={moves()}
            onChange={(state: boolean) => {
              if (state) {
                only('moves');
              } else {
                setMoves(false);
              }
            }}
            class="flex sm:hidden"
          >
            <PopoverButton aria-label="Field moves" class={BAR_BUTTON}>
              <ActionsIcon class="size-5" aria-hidden="true" />
              <Show when={activeMove(game.fieldMoves())}>
                {(offer) => <span class="pr-1">{offer().name}</span>}
              </Show>
            </PopoverButton>
            <Transition
              show={moves()}
              {...SHEER}
              class="absolute bottom-full left-1/2 z-30 mb-2 w-max -translate-x-1/2"
            >
              <PopoverPanel class="flex gap-1 rounded-panel border-2 border-tide bg-paper p-2 shadow-pop">
                <For each={game.fieldMoves()}>
                  {(offer) => (
                    <button
                      type="button"
                      class={`${TILE} w-20 ${offer.active ? 'border-tide bg-tide-soft text-tide-dark' : ''}`}
                      aria-pressed={offer.active}
                      disabled={offer.busy}
                      onClick={() => {
                        setMoves(false);
                        offer.use();
                      }}
                    >
                      {offer.name}
                    </button>
                  )}
                </For>
              </PopoverPanel>
            </Transition>
          </Popover>
        </Show>

        <div class="hidden items-center gap-2 sm:flex">
          <Divider />

          <span class="shrink-0 text-sm font-bold whitespace-nowrap text-gold">{purse()}</span>

          {/* On the bar rather than behind the button: taking the screen
              is what a player does as they start walking. The divider
              goes with it on a browser that will not fill the screen */}
          <Show when={fullscreenOffered()}>
            <Divider />
          </Show>

          <FullscreenToggle class={`${TOGGLE} shrink-0`} />
        </div>

        {/* Centred on the bar and pulled back by half its own width, so
            the panel stays over the middle of the screen */}
        <Transition
          show={open()}
          {...SHEER}
          class="absolute bottom-full left-1/2 z-30 mb-2 w-[21rem] max-w-[calc(100vw-2rem)]
            -translate-x-1/2"
        >
          <PopoverPanel class="flex flex-col gap-1 rounded-panel border-2 border-tide bg-paper p-2 shadow-pop">
            <For each={GROUPS}>
              {(group) => (
                <div role="group" aria-label={group.label}>
                  <span
                    aria-hidden="true"
                    class="block px-2 pt-1 text-left text-xs font-semibold text-muted uppercase"
                  >
                    {group.label}
                  </span>
                  <div class="grid grid-cols-4 gap-1">
                    <For each={group.entries}>
                      {(entry) => (
                        <button
                          type="button"
                          class={TILE}
                          disabled={entry.dialog == null}
                          // The word alone reads as something the game can do and will not
                          title={entry.dialog == null ? `${entry.label}, not yet` : entry.label}
                          onClick={() => {
                            if (entry.dialog != null) {
                              openDialog(entry.dialog);
                            }
                          }}
                        >
                          <span class="relative">
                            <Dynamic component={entry.icon} class="size-7" aria-hidden="true" />
                            <Show when={countFor(entry.dialog) > 0}>
                              <span class={`${COUNT} absolute -top-1 -right-2`}>
                                {countFor(entry.dialog)}
                              </span>
                            </Show>
                          </span>
                          {entry.label}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              )}
            </For>

            {/* Settings and the day or night switch change how the game
                behaves rather than where the player goes, so they sit
                under the keys rather than among them */}
            <div class="mt-1 flex items-center justify-between gap-2 border-t-2 border-line-soft px-1 pt-2">
              <button
                type="button"
                class={`${TOGGLE} flex items-center gap-1.5 text-sm font-bold`}
                onClick={() => {
                  openDialog(GameDialog.Settings);
                }}
              >
                <SettingsIcon class="size-5" aria-hidden="true" />
                Settings
              </button>
              <ThemeToggle class={TOGGLE} />
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </nav>
  );
}
